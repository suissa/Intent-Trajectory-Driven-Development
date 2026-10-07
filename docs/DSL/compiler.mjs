#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(process.argv[2] || "examples/delivery.itdsl");
const out = resolve(process.argv[3] || "docs/DSL/2typescript/generated");
const lang = process.argv[4] || "typescript";
const input = readFileSync(source, "utf8");

function fail(code, message, line) {
  const suffix = line ? " at line " + line : "";
  throw new Error(code + suffix + ": " + message);
}
function splitArrow(s) { return s.split(/→|->/).map(function(x){return x.trim();}).filter(Boolean); }
function parse(src) {
  const lines=src.split(/\r?\n/);
  const a={annotation:null,destiny:[],intent:null,required:[],behavior:[],states:[],actors:{},skills:{},evidence:[],constraints:[],trajectory:[]};
  let section=null, skill=null;
  for(let i=0;i<lines.length;i++){
    const raw=lines[i], line=raw.trim(), n=i+1;
    if(!line || line.startsWith("#")) continue;
    if(line.startsWith("@")){a.annotation=line.slice(1).trim();continue;}
    const h=line.match(/^([DIRBSKETX]):\s*(.*)$/);
    if(h){
      section=h[1]; const body=h[2];
      if(section==="D") a.destiny=splitArrow(body);
      else if(section==="I"){const p=splitArrow(body);a.intent={actor:p[0],goal:p.slice(1).join("→")};}
      else if(section==="R") a.required=body.split(/\s*\+\s*/).map(function(x){return x.trim();}).filter(Boolean);
      else if(section==="B") a.behavior=splitArrow(body);
      else if(section==="S") a.states=splitArrow(body);
      else if(section==="E") a.evidence=splitArrow(body);
      else if(section==="T") a.trajectory=splitArrow(body);
      else if(section==="X" && body) a.constraints.push(body);
      continue;
    }
    if(section==="B"){a.behavior=a.behavior.concat(splitArrow(line));continue;}
    if(section==="S"){a.states=a.states.concat(splitArrow(line));continue;}
    if(section==="E"){a.evidence=a.evidence.concat(splitArrow(line));continue;}
    if(section==="T"){a.trajectory=a.trajectory.concat(splitArrow(line));continue;}
    if(section==="A"){
      const m=line.match(/^([a-z][a-z0-9_]*)\s*\{([^}]*)\}$/);
      if(!m) fail("ITDSL_SYNTAX_ACTOR","expected actor { capabilities }",n);
      a.actors[m[1]]=m[2].trim().split(/\s+/).filter(Boolean); continue;
    }
    if(section==="K"){
      const start=line.match(/^([a-z][a-z0-9_]*)\s*\{$/);
      if(start){skill=start[1];a.skills[skill]={name:skill,fields:{}};continue;}
      if(line==="}"){skill=null;continue;}
      if(!skill) fail("ITDSL_SYNTAX_SKILL","skill field outside block",n);
      const f=line.match(/^(in|out|rule|emit|pre|post|when):\s*(.*)$/);
      if(!f) fail("ITDSL_SYNTAX_SKILL","expected field",n);
      a.skills[skill].fields[f[1]]=f[2];continue;
    }
    if(section==="X"){a.constraints.push(line);continue;}
    fail("ITDSL_SYNTAX","unrecognized declaration",n);
  }
  return a;
}
function normalize(a){
  const sortObj=function(o){return Object.fromEntries(Object.keys(o).sort().map(function(k){return [k,o[k]];}));};
  return {annotation:a.annotation,destiny:a.destiny,intent:a.intent,required:a.required,behavior:a.behavior,states:a.states,actors:sortObj(a.actors),skills:sortObj(a.skills),evidence:a.evidence,constraints:a.constraints,trajectory:a.trajectory};
}
function validate(a){
  if(!a.annotation) fail("ITDSL_MISSING_ANNOTATION","@annotation is required");
  if(!a.destiny.length) fail("ITDSL_MISSING_DESTINY","D is required");
  if(!a.intent || !a.intent.actor || !a.intent.goal) fail("ITDSL_MISSING_INTENT","I is required");
  if(!a.required.length) fail("ITDSL_MISSING_REQUIRED","R is required");
  if(!a.behavior.length) fail("ITDSL_MISSING_BEHAVIOR","B is required");
  if(a.states.length<2) fail("ITDSL_STATE_GRAPH","at least two states are required");
  if(!a.evidence.length) fail("ITDSL_MISSING_EVIDENCE","E is required");
  if(!a.actors[a.intent.actor]) fail("ITDSL_ACTOR_RESOLUTION","intent actor is not declared");
  for(const s of a.states) if(!/^[a-z][a-z0-9_]*$/.test(s)) fail("ITDSL_INVALID_STATE",s);
  for(const actor of Object.keys(a.actors)){
    if(!/^[a-z][a-z0-9_]*$/.test(actor)) fail("ITDSL_INVALID_ACTOR",actor);
    for(const c of a.actors[actor]) if(!/^[a-z][a-z0-9_]*$/.test(c)) fail("ITDSL_INVALID_CAPABILITY",c);
  }
  const ev=a.evidence.map(function(x){return x.replace(/\*$/,"");});
  if(new Set(ev).size!==ev.length) fail("ITDSL_DUPLICATE_EVIDENCE","duplicate evidence");
  for(const e of ev) if(!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(e)) fail("ITDSL_INVALID_EVIDENCE",e);
  for(const b of a.behavior) if(!/^[a-z][a-z0-9_]*(\([^)]*\))?\*?$/.test(b)) fail("ITDSL_INVALID_BEHAVIOR",b);
  const st=new Set(a.states);
  if(a.states[0]!== "requested") fail("ITDSL_ENTRY_STATE","delivery generator requires requested as entry state");
  for(const s of a.states) if(!st.has(s)) fail("ITDSL_STATE_RESOLUTION","unknown state");
  return true;
}
function q(x){return JSON.stringify(x);}
function generateTS(a){
  let states=a.states.slice(); if(states.indexOf("failed")<0) states.push("failed");
  const tr={}; for(let i=0;i<states.length;i++) tr[states[i]]=i<states.length-1?[states[i+1]]:[];
  for(const s of ["collecting","searching","assigned","active"]) if(tr[s] && tr[s].indexOf("failed")<0) tr[s].push("failed");
  const actors=Object.keys(a.actors), caps=[...new Set(Object.values(a.actors).flat())], ev=a.evidence.map(function(x){return x.replace(/\*$/,"");});
  let s="export type DeliveryState =\n"+states.map(function(x){return '  | "'+x+'"';}).join("\n")+";\n\n";
  s+="export type Actor = "+actors.map(function(x){return '"'+x+'"';}).join(" | ")+";\n";
  s+="export type Capability = "+caps.map(function(x){return '"'+x+'"';}).join(" | ")+";\n";
  s+="export type EvidenceType =\n"+ev.map(function(x){return '  | "'+x+'"';}).join("\n")+";\n\n";
  s+="export interface Evidence { readonly type: EvidenceType; readonly at: number; }\n";
  s+="export interface DeliveryRequest { readonly pickup: string; readonly dropoff: string; }\n";
  s+="export const destiny = "+q(a.destiny)+" as const;\nexport const required = "+q(a.required)+" as const;\nexport const behavior = "+q(a.behavior)+" as const;\n";
  s+="export const transitions: Readonly<Record<DeliveryState, readonly DeliveryState[]>> = "+q(tr)+" as const;\n";
  s+="export const authorization: Readonly<Record<Actor, readonly Capability[]>> = "+q(a.actors)+" as const;\n";
  s+='export function allowed(actor: Actor, capability: Capability): boolean { return authorization[actor].includes(capability); }\n';
  s+='export function transition(from: DeliveryState, to: DeliveryState): DeliveryState { if (!transitions[from].includes(to)) throw new Error("ITDSL_ILLEGAL_TRANSITION"); return to; }\n';
  s+='export function validateRequest(request: DeliveryRequest): void { if (!request.pickup || !request.dropoff) throw new Error("ITDSL_REQUIRED_INPUT"); if (request.pickup === request.dropoff) throw new Error("ITDSL_PICKUP_EQUALS_DROPOFF"); }\n';
  s+='export function assertCanRelease(paymentConfirmed: boolean): void { if (!paymentConfirmed) throw new Error("ITDSL_RELEASE_BEFORE_PAYMENT"); }\n';
  s+='export function assertCanSettle(codeValid: boolean, atDropoff: boolean): void { if (!codeValid) throw new Error("ITDSL_INVALID_CODE"); if (!atDropoff) throw new Error("ITDSL_NOT_AT_DROPOFF"); }\n';
  s+='export function selectNearest<T extends { readonly available: boolean; readonly distance: number }>(couriers: readonly T[]): T { const available=couriers.filter(c=>c.available); if (!available.length) throw new Error("ITDSL_NO_AVAILABLE_COURIER"); return available.reduce((a,b)=>b.distance<a.distance?b:a); }\n';
  s+="export const evidenceOrder: readonly EvidenceType[] = "+q(ev)+";\n";
  s+='export function validateEvidenceOrder(evidence: readonly Evidence[]): void { let previous=-1; for(const item of evidence){ const current=evidenceOrder.indexOf(item.type); if(current<0) throw new Error("ITDSL_UNDECLARED_EVIDENCE"); if(current<previous) throw new Error("ITDSL_EVIDENCE_ORDER"); previous=current; } }\n';
  s+='export function conforms(evidence: readonly Evidence[]): boolean { try { validateEvidenceOrder(evidence); const kinds=new Set(evidence.map(x=>x.type)); return kinds.has("request.received") && kinds.has("settlement.completed"); } catch { return false; } }\n';
  s+="export const repeatableEvidence = "+q(a.evidence.filter(function(x){return x.endsWith("*");}).map(function(x){return x.slice(0,-1);}))+ " as const;\n";
  return s;
}
function generateTSTest(){
return 'import assert from "node:assert/strict";\nimport { allowed, assertCanRelease, assertCanSettle, conforms, selectNearest, transition, validateEvidenceOrder, validateRequest } from "./delivery.js";\n'+
'assert.doesNotThrow(()=>validateRequest({pickup:"A",dropoff:"B"}));\nassert.throws(()=>validateRequest({pickup:"A",dropoff:"A"}),/ITDSL_PICKUP_EQUALS_DROPOFF/);\n'+
'assert.equal(transition("requested","collecting"),"collecting"); assert.throws(()=>transition("requested","settled"),/ITDSL_ILLEGAL_TRANSITION/);\n'+
'assert.equal(allowed("customer","pay"),true); assert.equal(allowed("customer","settle"),false);\n'+
'assert.throws(()=>assertCanRelease(false),/ITDSL_RELEASE_BEFORE_PAYMENT/); assert.doesNotThrow(()=>assertCanRelease(true));\n'+
'assert.throws(()=>assertCanSettle(false,true),/ITDSL_INVALID_CODE/); assert.throws(()=>assertCanSettle(true,false),/ITDSL_NOT_AT_DROPOFF/); assert.doesNotThrow(()=>assertCanSettle(true,true));\n'+
'assert.equal(selectNearest([{available:true,distance:20},{available:true,distance:5},{available:false,distance:1}]).distance,5);\n'+
'const evidence=[{type:"request.received" as const,at:1},{type:"intent.recognized" as const,at:2},{type:"addresses.collected" as const,at:3},{type:"courier.selected" as const,at:4},{type:"payment.confirmed" as const,at:5},{type:"delivery.released" as const,at:6},{type:"location.received" as const,at:7},{type:"location.received" as const,at:8},{type:"code.validated" as const,at:9},{type:"settlement.completed" as const,at:10}];\n'+
'assert.doesNotThrow(()=>validateEvidenceOrder(evidence)); assert.equal(conforms(evidence),true); assert.throws(()=>validateEvidenceOrder([{type:"payment.confirmed" as const,at:1},{type:"request.received" as const,at:2}]),/ITDSL_EVIDENCE_ORDER/);\nconsole.log("TS generated ITDSL conformance: PASS");\n';
}
function generatePy(a){
  let states=a.states.slice(); if(states.indexOf("failed")<0) states.push("failed");
  const tr={}; for(let i=0;i<states.length;i++) tr[states[i]]=i<states.length-1?[states[i+1]]:[];
  for(const x of ["collecting","searching","assigned","active"]) if(tr[x] && tr[x].indexOf("failed")<0) tr[x].push("failed");
  const ev=a.evidence.map(function(x){return x.replace(/\*$/,"");});
  let s="from __future__ import annotations\nfrom dataclasses import dataclass\nfrom enum import StrEnum\nfrom typing import Final\n\n";
  s+="class DeliveryState(StrEnum):\n"+states.map(function(x){return "    "+x.toUpperCase()+' = "'+x+'"';}).join("\n")+"\n\n";
  s+="class Actor(StrEnum):\n"+Object.keys(a.actors).map(function(x){return "    "+x.toUpperCase()+' = "'+x+'"';}).join("\n")+"\n\n";
  s+="DESTINY: Final = "+q(a.destiny)+"\nREQUIRED: Final = "+q(a.required)+"\nBEHAVIOR: Final = "+q(a.behavior)+"\n";
  s+="TRANSITIONS: Final = {\n"+Object.entries(tr).map(function(e){return "    DeliveryState."+e[0].toUpperCase()+": frozenset({"+e[1].map(function(x){return "DeliveryState."+x.toUpperCase();}).join(", ")+"}),";}).join("\n")+"\n}\n";
  s+="AUTHORIZATION: Final = {\n"+Object.entries(a.actors).map(function(e){return "    Actor."+e[0].toUpperCase()+": frozenset("+q(e[1])+"),";}).join("\n")+"\n}\n\n";
  s+='@dataclass(frozen=True)\nclass DeliveryRequest:\n    pickup: str\n    dropoff: str\n    def validate(self) -> None:\n        if not self.pickup or not self.dropoff: raise ValueError("ITDSL_REQUIRED_INPUT")\n        if self.pickup == self.dropoff: raise ValueError("ITDSL_PICKUP_EQUALS_DROPOFF")\n\n@dataclass(frozen=True)\nclass Evidence:\n    kind: str\n    at: int\n\ndef allowed(actor: Actor, capability: str) -> bool: return capability in AUTHORIZATION[actor]\ndef transition(current: DeliveryState, target: DeliveryState) -> DeliveryState:\n    if target not in TRANSITIONS[current]: raise ValueError("ITDSL_ILLEGAL_TRANSITION")\n    return target\ndef assert_can_release(payment_confirmed: bool) -> None:\n    if not payment_confirmed: raise ValueError("ITDSL_RELEASE_BEFORE_PAYMENT")\ndef assert_can_settle(code_valid: bool, at_dropoff: bool) -> None:\n    if not code_valid: raise ValueError("ITDSL_INVALID_CODE")\n    if not at_dropoff: raise ValueError("ITDSL_NOT_AT_DROPOFF")\ndef select_nearest(couriers: list[dict]) -> dict:\n    available=[c for c in couriers if c["available"]]\n    if not available: raise ValueError("ITDSL_NO_AVAILABLE_COURIER")\n    return min(available,key=lambda c:c["distance"])\n';
  s+="EVIDENCE_ORDER: Final = "+q(ev)+"\ndef validate_evidence_order(evidence: tuple[Evidence,...]) -> None:\n    previous=-1\n    for item in evidence:\n        try: current=EVIDENCE_ORDER.index(item.kind)\n        except ValueError as exc: raise ValueError(\"ITDSL_UNDECLARED_EVIDENCE\") from exc\n        if current < previous: raise ValueError(\"ITDSL_EVIDENCE_ORDER\")\n        previous=current\n\ndef conforms(evidence: tuple[Evidence,...]) -> bool:\n    try: validate_evidence_order(evidence)\n    except ValueError: return False\n    kinds={x.kind for x in evidence}\n    return \"request.received\" in kinds and \"settlement.completed\" in kinds\n";
  return s;
}
function generatePyTest(){
return 'import unittest\nfrom delivery import Actor,DeliveryRequest,DeliveryState,Evidence,allowed,assert_can_release,assert_can_settle,conforms,select_nearest,transition,validate_evidence_order\nclass GeneratedDeliveryTests(unittest.TestCase):\n def test_constraints(self):\n  DeliveryRequest("A","B").validate()\n  with self.assertRaisesRegex(ValueError,"ITDSL_PICKUP_EQUALS_DROPOFF"): DeliveryRequest("A","A").validate()\n def test_transition(self):\n  self.assertEqual(transition(DeliveryState.REQUESTED,DeliveryState.COLLECTING),DeliveryState.COLLECTING)\n  with self.assertRaisesRegex(ValueError,"ITDSL_ILLEGAL_TRANSITION"): transition(DeliveryState.REQUESTED,DeliveryState.SETTLED)\n def test_authorization(self): self.assertTrue(allowed(Actor.CUSTOMER,"pay")); self.assertFalse(allowed(Actor.CUSTOMER,"settle"))\n def test_forbidden(self):\n  with self.assertRaisesRegex(ValueError,"ITDSL_RELEASE_BEFORE_PAYMENT"): assert_can_release(False)\n  with self.assertRaisesRegex(ValueError,"ITDSL_INVALID_CODE"): assert_can_settle(False,True)\n  with self.assertRaisesRegex(ValueError,"ITDSL_NOT_AT_DROPOFF"): assert_can_settle(True,False)\n  assert_can_release(True); assert_can_settle(True,True)\n def test_skill(self): self.assertEqual(select_nearest([{"available":True,"distance":20},{"available":True,"distance":5},{"available":False,"distance":1}])["distance"],5)\n def test_evidence(self):\n  e=(Evidence("request.received",1),Evidence("intent.recognized",2),Evidence("addresses.collected",3),Evidence("courier.selected",4),Evidence("payment.confirmed",5),Evidence("delivery.released",6),Evidence("location.received",7),Evidence("location.received",8),Evidence("code.validated",9),Evidence("settlement.completed",10))\n  validate_evidence_order(e); self.assertTrue(conforms(e))\n  with self.assertRaisesRegex(ValueError,"ITDSL_EVIDENCE_ORDER"): validate_evidence_order((Evidence("payment.confirmed",1),Evidence("request.received",2)))\nif __name__=="__main__": unittest.main(verbosity=2)\n';
}
const ast=normalize(parse(input)); validate(ast); mkdirSync(out,{recursive:true});
if(lang==="typescript"){writeFileSync(resolve(out,"delivery.ts"),generateTS(ast));writeFileSync(resolve(out,"delivery.test.ts"),generateTSTest());}
else if(lang==="python"){writeFileSync(resolve(out,"delivery.py"),generatePy(ast));writeFileSync(resolve(out,"test_delivery.py"),generatePyTest());}
else fail("ITDSL_TARGET","target must be typescript or python");
writeFileSync(resolve(out,".itdsl-normalized.json"),JSON.stringify(ast,null,2)+"\n");
console.log(JSON.stringify({ok:true,language:lang,source,output:out}));
