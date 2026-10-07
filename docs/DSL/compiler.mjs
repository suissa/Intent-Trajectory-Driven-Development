#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const source=resolve(process.argv[2]||"examples/delivery.itdsl");
const out=resolve(process.argv[3]||"docs/DSL/2typescript/generated");
const target=process.argv[4]||"typescript";
const input=readFileSync(source,"utf8");
function fail(code,msg,line){throw new Error(code+(line?" at line "+line:"")+": "+msg);}
const ID=/^[a-z][a-z0-9_]*$/; const QUAL=/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const RESERVED=new Set(["D","I","R","B","S","A","K","E","X","T","in","out","rule","emit","pre","post","when","from","to","requires","ensures","allows","forbids","min","max","one","all","any","none","some","true","false","and","or","not"]);
function canon(s){return s.replace(/->/g,"→").replace(/\band\b/g,"∧").replace(/\bor\b/g,"∨").replace(/\bnot\b/g,"¬").replace(/!=/g,"≠");}
function arrows(s){return canon(s).split("→").map(function(x){return x.trim()}).filter(Boolean);}
function cardinality(s){var m=s.match(/^(.+?)(?:\{(\d+)\.\.(\d+|\*)\}|\*)$/);if(!m)return {value:s,min:1,max:1,repeatable:false};return {value:m[1].trim(),min:m[2]?Number(m[2]):0,max:m[3]?m[3]==="*"?"*":Number(m[3]):"*",repeatable:true};}
function edges(xs){var e=[];for(var i=0;i<xs.length-1;i++)e.push([xs[i],xs[i+1]]);return e;}
function parse(src){
 var lines=src.split(/\r?\n/),a={version:1,annotation:null,destiny:[],intent:null,required:[],behavior:[],states:[],actors:{},skills:{},evidence:[],constraints:[],trajectory:[]},section=null,skill=null;
 for(var i=0;i<lines.length;i++){var line=lines[i].trim(),n=i+1;if(!line||line.startsWith("#"))continue;
  if(line.startsWith("@")){a.annotation=line.slice(1).trim();continue;}
  var skillHeader=line.match(/^K\s+([a-z][a-z0-9_]*)\s*\{$/);if(skillHeader){section="K";skill=skillHeader[1];a.skills[skill]={name:skill,fields:{},line:n};continue;} var h=line.match(/^([DIRABSKETX]):(?:\s*(.*))?$/);
  if(h){section=h[1];var body=(h[2]||"").trim();
   if(section==="K" && body){var kh=body.match(/^([a-z][a-z0-9_]*)\s*\{$/);if(!kh)fail("ITDSL_SYNTAX_SKILL","expected skill declaration",n);skill=kh[1];a.skills[skill]={name:skill,fields:{},line:n};continue;} if(section==="D")a.destiny=arrows(body);
   else if(section==="I"){var p=arrows(body);a.intent={actor:p[0],goal:p.slice(1).join("→")};}
   else if(section==="R")a.required=body.split(/\s*\+\s*/).filter(Boolean);
   else if(section==="B")a.behavior=a.behavior.concat(arrows(body));
   else if(section==="S")a.states=a.states.concat(arrows(body));
   else if(section==="E")a.evidence=a.evidence.concat(arrows(body).map(cardinality));
   else if(section==="T")a.trajectory=a.trajectory.concat(arrows(body));
   else if(section==="A"&&body){var amInline=body.match(/^([a-z][a-z0-9_]*)\s*\{([^}]*)\}$/);if(!amInline)fail("ITDSL_SYNTAX_ACTOR","expected actor { capabilities }",n);a.actors[amInline[1]]=amInline[2].trim().split(/\s+/).filter(Boolean);}
   else if(section==="X"&&body)a.constraints.push(canon(body)); continue;}
  if(["B","S","E","T"].includes(section)){var vals=arrows(line);a[{B:"behavior",S:"states",E:"evidence",T:"trajectory"}[section]]=a[{B:"behavior",S:"states",E:"evidence",T:"trajectory"}[section]].concat(section==="E"?vals.map(cardinality):vals);continue;}
  if(section==="A"){var am=line.match(/^([a-z][a-z0-9_]*)\s*\{([^}]*)\}$/);if(!am)fail("ITDSL_SYNTAX_ACTOR","expected actor { capabilities }",n);a.actors[am[1]]=am[2].trim().split(/\s+/).filter(Boolean);continue;}
  if(section==="K"){var inline=line.match(/^([a-z][a-z0-9_]*)\s*\{$/);if(inline){skill=inline[1];a.skills[skill]={name:skill,fields:{},line:n};continue;}var sm=line.match(/^([a-z][a-z0-9_]*)\s*\{$/);if(sm){skill=sm[1];a.skills[skill]={name:skill,fields:{},line:n};continue;}if(line=== "}"){skill=null;continue;}if(!skill)fail("ITDSL_SYNTAX_SKILL","field outside skill",n);var fm=line.match(/^(in|out|rule|emit|pre|post|when|from|to|requires|ensures|allows|forbids):\s*(.*)$/);if(!fm)fail("ITDSL_SYNTAX_SKILL","expected skill field",n);a.skills[skill].fields[fm[1]]=canon(fm[2]);continue;}
  if(section==="X"){a.constraints.push(canon(line));continue;} fail("ITDSL_SYNTAX","unrecognized declaration",n);
 } return a;
}
function normalize(a){var sort=function(o){return Object.fromEntries(Object.keys(o).sort().map(function(k){return [k,o[k]]}))};return {version:a.version,annotation:a.annotation,destiny:a.destiny,intent:a.intent,required:a.required.slice().sort(),behavior:a.behavior,states:a.states,actors:sort(a.actors),skills:sort(a.skills),evidence:a.evidence,constraints:a.constraints,constraint_ast:a.constraint_ast||[],trajectory:a.trajectory,skill_semantics:a.skillSemantics||[],ids:a.ids||null};}
function validate(a){
 if(!a.annotation)fail("ITDSL_MISSING_ANNOTATION","annotation required");if(!a.destiny.length)fail("ITDSL_MISSING_DESTINY","D required");if(!a.intent?.actor||!a.intent?.goal)fail("ITDSL_MISSING_INTENT","I required");if(!a.required.length)fail("ITDSL_MISSING_REQUIRED","R required");if(!a.behavior.length)fail("ITDSL_MISSING_BEHAVIOR","B required");if(a.states.length<2)fail("ITDSL_STATE_GRAPH","at least two states required");if(!a.evidence.length)fail("ITDSL_MISSING_EVIDENCE","E required");if(!a.trajectory.length)fail("ITDSL_MISSING_TRAJECTORY","T required");if(!a.actors[a.intent.actor])fail("ITDSL_ACTOR_RESOLUTION","intent actor is not declared");
 a.constraint_ast=staticConstraintCheck(a);
 var ss=new Set(a.states);if(ss.size!==a.states.length)fail("ITDSL_DUPLICATE_STATE","duplicate state");for(var s of a.states)if(!ID.test(s)||RESERVED.has(s))fail("ITDSL_INVALID_STATE","invalid state "+s);
 for(var actor of Object.keys(a.actors)){if(!ID.test(actor)||RESERVED.has(actor))fail("ITDSL_INVALID_ACTOR","invalid actor "+actor);for(var c of a.actors[actor])if(!ID.test(c)||RESERVED.has(c))fail("ITDSL_INVALID_CAPABILITY","invalid capability "+c);}
 for(var r of a.required)if(!ID.test(r))fail("ITDSL_INVALID_REQUIRED","invalid required "+r);
 for(var b of a.behavior)if(!/^[a-z][a-z0-9_]*(\([^)]*\))?\*?$/.test(b))fail("ITDSL_INVALID_BEHAVIOR","invalid behavior "+b);
 var ev=new Set();for(var e of a.evidence){if(!QUAL.test(e.value))fail("ITDSL_INVALID_EVIDENCE","invalid evidence "+e.value);if(ev.has(e.value))fail("ITDSL_DUPLICATE_EVIDENCE","duplicate evidence "+e.value);ev.add(e.value);}
 for(var name of Object.keys(a.skills)){var k=a.skills[name];if(!ID.test(name)||RESERVED.has(name))fail("ITDSL_INVALID_SKILL","invalid skill "+name);for(var req of ["in","out","rule","emit"])if(!k.fields[req])fail("ITDSL_SKILL_SHAPE","skill "+name+" requires "+req);if(!QUAL.test(k.fields.emit))fail("ITDSL_SKILL_EVIDENCE","skill emit must be qualified evidence");if(!ev.has(k.fields.emit))fail("ITDSL_SKILL_EVIDENCE","skill emits undeclared evidence "+k.fields.emit);if(!a.trajectory.includes(k.fields.emit)&&!a.trajectory.includes(k.fields.emit+"*"))fail("ITDSL_SKILL_EVIDENCE","skill evidence is not in trajectory "+k.fields.emit);if(/\b(min|max)\s*$/.test(k.fields.rule))fail("ITDSL_SKILL_RULE","selection rule requires operand");for(var optional of ["pre","post","when","from","to","requires","ensures","allows","forbids"])if(k.fields[optional]&&!k.fields[optional].trim())fail("ITDSL_SKILL_FIELD","skill "+name+" has empty "+optional);if(k.fields.pre)parseConstraint(k.fields.pre);if(k.fields.post)parseConstraint(k.fields.post);if(k.fields.when)parseConstraint(k.fields.when);if(k.fields.requires)parseConstraint(k.fields.requires);if(k.fields.ensures)parseConstraint(k.fields.ensures);if(k.fields.from&&!ss.has(k.fields.from))fail("ITDSL_SKILL_STATE","skill "+name+" from state is undeclared");if(k.fields.to&&!ss.has(k.fields.to))fail("ITDSL_SKILL_STATE","skill "+name+" to state is undeclared");if((k.fields.from&&!k.fields.to)||(!k.fields.from&&k.fields.to))fail("ITDSL_SKILL_STATE","skill "+name+" from/to must be declared together");if(k.fields.from&&k.fields.to&&!edges(a.states).some(function(e){return e[0]===k.fields.from&&e[1]===k.fields.to}))fail("ITDSL_SKILL_TRANSITION","skill "+name+" declares an illegal state transition");}
 for(var ed of edges(a.states))if(!ss.has(ed[0])||!ss.has(ed[1]))fail("ITDSL_STATE_RESOLUTION","unknown state edge");
 for(var term of a.trajectory){var base=term.replace(/\*$/g,"");if(!ID.test(base)&&!QUAL.test(base)&&!base.includes("("))fail("ITDSL_TRAJECTORY_SHAPE","invalid trajectory term "+term);}
 return true;}
function tokenizeConstraint(s){return s.match(/→|∧|∨|¬|≠|=|∈|∉|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?\([^)]*\)|\(|\)|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?/g)||[];}
function parseConstraint(s){
 var t=tokenizeConstraint(canon(s)),i=0;
 function atom(){
  if(t[i]==="¬"){i++;return {op:"not",arg:atom()};}
  if(t[i]==="("){i++;var x=or();if(t[i]!==")")fail("ITDSL_CONSTRAINT_SYNTAX","expected )");i++;return x;}
  var left=t[i++];if(!left)fail("ITDSL_CONSTRAINT_SYNTAX","expected operand");
  if(t[i]&&["=","≠","∈","∉"].includes(t[i])){var op=t[i++],right=t[i++];if(!right)fail("ITDSL_CONSTRAINT_SYNTAX","expected right operand");return {op,left,right};}
  return {op:"fact",value:left};
 }
 function and(){var x=atom();while(t[i]==="∧"){i++;x={op:"and",left:x,right:atom()};}return x;}
 function or(){var x=and();while(t[i]==="∨"){i++;x={op:"or",left:x,right:and()};}return x;}
 var ast=or();if(i!==t.length)fail("ITDSL_CONSTRAINT_SYNTAX","unexpected token "+t[i]);return ast;
}
function evaluateConstraint(ast,facts){
 if(ast.op==="fact")return facts.has(ast.value);
 if(ast.op==="not")return !evaluateConstraint(ast.arg,facts);
 if(ast.op==="and")return evaluateConstraint(ast.left,facts)&&evaluateConstraint(ast.right,facts);
 if(ast.op==="or")return evaluateConstraint(ast.left,facts)||evaluateConstraint(ast.right,facts);
 var has=facts.has(ast.left),rhs=facts.has(ast.right);
 if(ast.op==="=")return has===rhs;
 if(ast.op==="≠")return has!==rhs;
 if(ast.op==="∈")return has&&rhs;
 if(ast.op==="∉")return !has||!rhs;
 return false;
}
function constraintAtoms(ast,out=[]){if(ast.op==="not")constraintAtoms(ast.arg,out);else if(ast.op==="and"||ast.op==="or"){constraintAtoms(ast.left,out);constraintAtoms(ast.right,out);}else if(ast.op==="fact")out.push(ast.value);else{out.push(ast.left,ast.right);}return [...new Set(out)];}
function staticConstraintCheck(a){
 var parsed=a.constraints.map(function(c){return {source:c,ast:parseConstraint(c)}});
 var positive=new Set(),negative=new Set();
 function collect(ast,neg=false){
  if(ast.op==="not")return collect(ast.arg,!neg);
  if(ast.op==="and"){collect(ast.left,neg);collect(ast.right,neg);return;}
  if(ast.op==="fact"){(neg?negative:positive).add(ast.value);return;}
  if((ast.op==="="||ast.op==="∈")&&ast.left===ast.right){if(neg)negative.add(ast.left);else positive.add(ast.left);}
  if(ast.op==="≠"&&ast.left===ast.right){if(!neg)negative.add(ast.left);else positive.add(ast.left);}
 }
 parsed.forEach(function(x){collect(x.ast);});
 for(var x of positive)if(negative.has(x))fail("ITDSL_CONSTRAINT_CONTRADICTION","constraint set requires and forbids "+x);
 for(var p of parsed)if(p.ast.op==="fact"&&!p.source.startsWith("¬")){if(!a.evidence.some(e=>e.value===p.ast.value))fail("ITDSL_CONSTRAINT_UNSAT","required fact has no evidence: "+p.ast.value);}
 return parsed;
}
function skillSemantics(a){return Object.values(a.skills).map(function(k){var f=k.fields;return {name:k.name,input:f.in,output:f.out,rule:f.rule,evidence:f.emit,pre:f.pre?parseConstraint(f.pre):null,post:f.post?parseConstraint(f.post):null,when:f.when?parseConstraint(f.when):null,from:f.from||null,to:f.to||null,requires:f.requires?parseConstraint(f.requires):null,ensures:f.ensures?parseConstraint(f.ensures):null,allows:f.allows?arrows(f.allows):[],forbids:f.forbids?arrows(f.forbids):[]};});}
function splitSkillInput(value){return value.split(/\s*\+\s*/).map(function(x){return x.trim()}).filter(Boolean);}
function executionConformance(a){
 var byName=Object.fromEntries(a.skill_semantics.map(function(x){return [x.name,x]}));
 return function(observation){
  var skill=byName[observation.skill]; if(!skill)fail("ITDSL_CONFORMANCE_SKILL","unknown skill "+observation.skill);
  if(skill.from&&observation.from!==skill.from)fail("ITDSL_CONFORMANCE_STATE","skill "+skill.name+" expected from="+skill.from);
  if(skill.to&&observation.to!==skill.to)fail("ITDSL_CONFORMANCE_STATE","skill "+skill.name+" expected to="+skill.to);
  if(skill.from&&skill.to&&!edges(a.states).some(function(e){return e[0]===observation.from&&e[1]===observation.to}))fail("ITDSL_CONFORMANCE_TRANSITION","observed transition is illegal");
  var inputs=Array.isArray(observation.input)?observation.input:[];for(var input of splitSkillInput(skill.input))if(!inputs.includes(input))fail("ITDSL_CONFORMANCE_INPUT","missing declared input "+input);
  if(observation.output!=null&&observation.output!==skill.output)fail("ITDSL_CONFORMANCE_OUTPUT","observed output does not match skill output");
  if(observation.actor&&observation.capability&&!a.actors[observation.actor]?.includes(observation.capability))fail("ITDSL_CONFORMANCE_AUTHORIZATION","actor is not authorized for capability");
  var facts=new Set([...(observation.facts||[]),...(observation.evidence||[]).map(function(x){return typeof x==="string"?x:x.type})]);
  for(var pair of [["pre",skill.pre],["when",skill.when],["requires",skill.requires],["post",skill.post],["ensures",skill.ensures]])if(pair[1]&&!evaluateConstraint(pair[1],facts))fail("ITDSL_CONFORMANCE_"+pair[0].toUpperCase(),"skill "+skill.name+" "+pair[0]+" condition is not satisfied");
  var evidence=(observation.evidence||[]).map(function(x){return typeof x==="string"?x:x.type});
  if(!evidence.includes(skill.evidence))fail("ITDSL_CONFORMANCE_EVIDENCE","expected emitted evidence "+skill.evidence);
  var declared=a.evidence.map(function(x){return x.value});for(var item of evidence)if(!declared.includes(item))fail("ITDSL_CONFORMANCE_EVIDENCE","undeclared evidence "+item);
  var previous=-1;for(var item of evidence){var idx=declared.indexOf(item);if(idx<previous)fail("ITDSL_CONFORMANCE_TRAJECTORY","observed evidence violates trajectory order");previous=idx;}
  return true;
 };
}
function trajectoryProof(a){
 var declared=a.trajectory.map(function(x){return x.replace(/\\*$/,"")});
 var index=new Map(declared.map(function(x,i){return [x,i]}));
 return function(executions){
  if(!Array.isArray(executions)||!executions.length)fail("ITDSL_TRAJECTORY_PROOF_EMPTY","execution trajectory is empty");
  var cursor=0,observedEvidence=[],states=[];
  for(var execution of executions){
   executionConformance(a)(execution);
   if(execution.evidence)for(var item of execution.evidence)observedEvidence.push(typeof item==="string"?item:item.type);
   if(execution.from!=null){if(execution.from!==a.states[cursor]&&cursor===0&&a.states.includes(execution.from)){}states.push(execution.from);}
   if(execution.to!=null)states.push(execution.to);
  }
  var previous=-1;
  for(var item of observedEvidence){var i=index.get(item);if(i===undefined)fail("ITDSL_TRAJECTORY_PROOF_EVIDENCE","evidence is outside declared trajectory: "+item);if(i<previous)fail("ITDSL_TRAJECTORY_PROOF_ORDER","observed evidence regressed in trajectory");previous=i;}
  var required=a.evidence.filter(function(x){return x.min>0}).map(function(x){return x.value});
  for(var req of required)if(!observedEvidence.includes(req))fail("ITDSL_TRAJECTORY_PROOF_MISSING","required trajectory evidence missing: "+req);
  var finalExecution=executions[executions.length-1];
  if(finalExecution.to!==a.states[a.states.length-1])fail("ITDSL_TRAJECTORY_PROOF_DESTINATION","trajectory did not reach terminal state "+a.states[a.states.length-1]);
  return {conformant:true,intent:a.intent,terminalState:finalExecution.to,evidence:observedEvidence,skills:executions.map(function(x){return x.skill})};
 };
}
function semanticIds(a){var hash=function(value){return createHash("sha256").update(value).digest("hex").slice(0,16)};return {behavior_id:"behavior-"+hash(JSON.stringify(a.behavior)),trajectory_id:"trajectory-"+hash(JSON.stringify({trajectory:a.trajectory,states:a.states,evidence:a.evidence}))};}
function q(x){return JSON.stringify(x);}
function pyq(x){return q(x).replace(/\btrue\b/g,"True").replace(/\bfalse\b/g,"False").replace(/\bnull\b/g,"None");}
function trajectoryProofTS(){return `export type Provenance={readonly timestamp?:string;readonly source?:string;readonly sequence?:number};export type Divergence={readonly code:string;readonly step:number;readonly skill?:string;readonly expected?:unknown;readonly observed?:unknown;readonly message:string};export type TrajectoryProofArtifact={readonly version:1;readonly conformant:boolean;readonly trajectoryId:string;readonly behaviorId:string;readonly intent:typeof intent;readonly startAt?:string;readonly endAt?:string;readonly provenance:readonly Provenance[];readonly states:readonly State[];readonly skills:readonly string[];readonly evidence:readonly EvidenceType[];readonly firstDivergence?:Divergence};export function createTrajectoryProof(executions:readonly SkillExecution[]):TrajectoryProofArtifact{const provenance=executions.map(x=>x.provenance||{});const startAt=provenance.find(x=>x.timestamp)?.timestamp;const endAt=[...provenance].reverse().find(x=>x.timestamp)?.timestamp;const states:State[]=executions.length?[executions[0].from,...executions.map(x=>x.to)]:[];const skills=executions.map(x=>x.skill);const observed:EvidenceType[]=[];const facts=new Set<string>();const failArtifact=(code:string,step:number,skill?:string,expected?:unknown,observedValue?:unknown,message=code):TrajectoryProofArtifact=>({version:1,conformant:false,trajectoryId:ids.trajectory_id,behaviorId:ids.behavior_id,intent,startAt,endAt,provenance,states,skills,evidence:observed,firstDivergence:{code,step,skill,expected,observed:observedValue,message}});if(!executions.length)return failArtifact("ITDSL_TRAJECTORY_PROOF_EMPTY",0,undefined,undefined,undefined,"execution trajectory is empty");for(let i=0;i<executions.length;i++){const execution=executions[i],enriched={...execution,facts:[...(execution.facts||[]),...facts]};try{conformSkillExecution(enriched)}catch(error){const message=error instanceof Error?error.message:String(error);return failArtifact(message.split(":")[0],i,execution.skill,undefined,undefined,message)}for(const item of execution.evidence){observed.push(item.type);facts.add(item.type)}}const declared=evidence.map(x=>x.value);let previous=-1;for(let i=0;i<observed.length;i++){const item=observed[i],idx=declared.findIndex(x=>x===item);if(idx<0)return failArtifact("ITDSL_TRAJECTORY_PROOF_EVIDENCE",i,undefined,"declared evidence",item,"trajectory evidence is undeclared");if(idx<previous)return failArtifact("ITDSL_TRAJECTORY_PROOF_ORDER",i,undefined,declared[previous],item,"trajectory evidence regressed");previous=idx}for(const spec of evidence){if(spec.min>0&&!observed.includes(spec.value))return failArtifact("ITDSL_TRAJECTORY_PROOF_MISSING",executions.length,undefined,spec.value,undefined,"required trajectory evidence missing")}const terminal=executions[executions.length-1].to;const terminalState=(Object.keys(transitions).find(state=>transitions[state].length===0) as State|undefined);if(terminalState&&terminal!==terminalState)return failArtifact("ITDSL_TRAJECTORY_PROOF_DESTINATION",executions.length-1,executions[executions.length-1].skill,terminalState,terminal,"trajectory did not reach terminal state");return {version:1,conformant:true,trajectoryId:ids.trajectory_id,behaviorId:ids.behavior_id,intent,startAt,endAt,provenance,states,skills,evidence:observed}}export function proveTrajectory(executions:readonly SkillExecution[]):TrajectoryProofArtifact{const artifact=createTrajectoryProof(executions);if(!artifact.conformant){const d=artifact.firstDivergence!;throw new Error(d.code+" at step "+d.step+": "+d.message)}return artifact}`}
function trajectoryProofPY(){return `@dataclass(frozen=True)\nclass Provenance:\n    timestamp: str | None = None\n    source: str | None = None\n    sequence: int | None = None\n\ndef create_trajectory_proof(executions: tuple[SkillExecution,...]) -> dict:\n    provenance=tuple(x.provenance for x in executions); observed=[]; facts=set(); states=tuple([executions[0].current] + [x.target for x in executions]) if executions else tuple(); skills=tuple(x.skill for x in executions)\n    start_at=next((x.get("timestamp") for x in provenance if x and x.get("timestamp")),None); end_at=next((x.get("timestamp") for x in reversed(provenance) if x and x.get("timestamp")),None)\n    base={"version":1,"conformant":False,"trajectory_id":IDS["trajectory_id"],"behavior_id":IDS["behavior_id"],"intent":INTENT,"start_at":start_at,"end_at":end_at,"provenance":provenance,"states":states,"skills":skills,"evidence":tuple()}\n    if not executions: base["first_divergence"]={"code":"ITDSL_TRAJECTORY_PROOF_EMPTY","step":0,"message":"execution trajectory is empty"};return base\n    for i,execution in enumerate(executions):\n        enriched=SkillExecution(execution.skill,execution.current,execution.target,execution.input,execution.output,execution.actor,execution.capability,tuple(facts),execution.evidence,execution.provenance)\n        try: conform_skill_execution(enriched)\n        except ValueError as exc: base["first_divergence"]={"code":str(exc).split(":")[0],"step":i,"skill":execution.skill,"message":str(exc)};base["evidence"]=tuple(x.kind for x in observed);return base\n        observed.extend(execution.evidence);facts.update(x.kind for x in execution.evidence)\n    declared=[x["value"] for x in EVIDENCE];previous=-1\n    for i,item in enumerate(observed):\n        if item.kind not in declared or declared.index(item.kind)<previous: base["first_divergence"]={"code":"ITDSL_TRAJECTORY_PROOF_EVIDENCE" if item.kind not in declared else "ITDSL_TRAJECTORY_PROOF_ORDER","step":i,"observed":item.kind,"message":"trajectory evidence diverged"};base["evidence"]=tuple(x.kind for x in observed);return base\n        previous=declared.index(item.kind)\n    for spec in EVIDENCE:\n        if spec["min"]>0 and not any(x.kind==spec["value"] for x in observed): base["first_divergence"]={"code":"ITDSL_TRAJECTORY_PROOF_MISSING","step":len(executions),"expected":spec["value"],"message":"required trajectory evidence missing"};base["evidence"]=tuple(x.kind for x in observed);return base\n    terminal=executions[-1].target\n    terminal_state=next((state for state,targets in TRANSITIONS.items() if not targets),None)\n    if terminal_state is not None and terminal != terminal_state: base["first_divergence"]={"code":"ITDSL_TRAJECTORY_PROOF_DESTINATION","step":len(executions)-1,"expected":terminal_state,"observed":terminal,"message":"trajectory did not reach terminal state"};base["evidence"]=tuple(x.kind for x in observed);return base\n    base["conformant"]=True;base["evidence"]=tuple(x.kind for x in observed);return base\n\ndef trajectory_proof(executions: tuple[SkillExecution,...]) -> dict:\n    artifact=create_trajectory_proof(executions)\n    if not artifact["conformant"]:\n        d=artifact["first_divergence"];raise ValueError(d["code"]+" at step "+str(d["step"])+": "+d["message"])\n    return artifact\n\ndef prove_trajectory(executions: tuple[SkillExecution,...]) -> dict:\n    return trajectory_proof(executions)\n`}
function generateTS(a){
 var states=a.states,actors=Object.keys(a.actors),caps=[...new Set(Object.values(a.actors).flat())],ev=a.evidence, tr={};states.forEach(function(s){tr[s]=[]});edges(states).forEach(function(e){tr[e[0]].push(e[1])});
 var skills=Object.values(a.skills).map(function(k){return {name:k.name,fields:k.fields}});
 var s="// GENERATED FROM ITDSL — DO NOT EDIT\n";s+="export type State = "+states.map(function(x){return JSON.stringify(x)}).join(" | ")+";\n";s+="export type Actor = "+actors.map(function(x){return JSON.stringify(x)}).join(" | ")+";\n";s+="export type Capability = "+caps.map(function(x){return JSON.stringify(x)}).join(" | ")+";\n";s+="export type EvidenceType = "+ev.map(function(x){return JSON.stringify(x.value)}).join(" | ")+";\n\n";
 s+="export const destiny="+q(a.destiny)+" as const;\nexport const intent="+q(a.intent)+" as const;\nexport const required="+q(a.required)+" as const;\nexport const behavior="+q(a.behavior)+" as const;\nexport const trajectory="+q(a.trajectory)+" as const;\nexport const constraints="+q(a.constraints)+" as const;\nexport const constraintAst="+q(a.constraint_ast)+" as const;\nexport const evidence="+q(ev)+" as const;\nexport const skills="+q(skills)+" as const;\nexport const skillSemantics="+q(a.skill_semantics)+" as const;\n";
 s+="export const transitions: Readonly<Record<State,readonly State[]>>="+q(tr)+" as const;\nexport const authorization: Readonly<Record<Actor,readonly Capability[]>>="+q(a.actors)+" as const;\n";
 s+="export type Evidence={readonly type:EvidenceType;readonly at:number};\nexport function allowed(actor:Actor,capability:Capability):boolean{return authorization[actor].includes(capability)}\n";
 s+="export function transition(from:State,to:State):State{if(!transitions[from].includes(to))throw new Error(\"ITDSL_ILLEGAL_TRANSITION\");return to}\n";
 s+="export function validateEvidenceOrder(items:readonly Evidence[]):void{let previous=-1;const counts=new Map<string,number>();for(const item of items){const i=evidence.findIndex(function(x){return x.value===item.type});if(i<0)throw new Error(\"ITDSL_UNDECLARED_EVIDENCE\");if(i<previous)throw new Error(\"ITDSL_EVIDENCE_ORDER\");previous=i;counts.set(item.type,(counts.get(item.type)||0)+1)}for(const spec of evidence){const n=counts.get(spec.value)||0;if(n<spec.min)throw new Error(\"ITDSL_EVIDENCE_MIN\");if(spec.max!==\"*\"&&n>spec.max)throw new Error(\"ITDSL_EVIDENCE_MAX\")}}\n";
 s+="export type SkillExecution={readonly skill:string;readonly from:State;readonly to:State;readonly input:readonly string[];readonly output?:string;readonly actor?:Actor;readonly capability?:Capability;readonly facts?:readonly string[];readonly evidence:readonly Evidence[];readonly provenance?:Provenance};\nexport function conformSkillExecution(observation:SkillExecution):boolean{const skill=(skillSemantics as readonly any[]).find((x:any)=>x.name===observation.skill);if(!skill)throw new Error(\"ITDSL_CONFORMANCE_SKILL\");if(skill.from&&observation.from!==skill.from)throw new Error(\"ITDSL_CONFORMANCE_STATE\");if(skill.to&&observation.to!==skill.to)throw new Error(\"ITDSL_CONFORMANCE_STATE\");if(skill.from&&skill.to)transition(observation.from,observation.to);for(const required of String(skill.input).split(/\\s*\\+\\s*/)){if(!observation.input.includes(required))throw new Error(\"ITDSL_CONFORMANCE_INPUT\");}if(observation.output!==undefined&&observation.output!==skill.output)throw new Error(\"ITDSL_CONFORMANCE_OUTPUT\");if(observation.actor&&observation.capability&&!allowed(observation.actor,observation.capability))throw new Error(\"ITDSL_CONFORMANCE_AUTHORIZATION\");const facts=new Set([...(observation.facts||[]),...observation.evidence.map(x=>x.type)]);const evalC=(a:any):boolean=>{if(a.op===\"fact\")return facts.has(a.value);if(a.op===\"not\")return !evalC(a.arg);if(a.op===\"and\")return evalC(a.left)&&evalC(a.right);if(a.op===\"or\")return evalC(a.left)||evalC(a.right);const l=facts.has(a.left),r=facts.has(a.right);if(a.op===\"=\")return l===r;if(a.op===\"≠\")return l!==r;if(a.op===\"∈\")return l&&r;if(a.op===\"∉\")return !l||!r;return false};for(const pair of [[\"pre\",skill.pre],[\"when\",skill.when],[\"requires\",skill.requires],[\"post\",skill.post],[\"ensures\",skill.ensures]] as const){if(pair[1]&&!evalC(pair[1]))throw new Error(\"ITDSL_CONFORMANCE_\"+pair[0].toUpperCase());}if(!observation.evidence.some(x=>x.type===skill.evidence))throw new Error(\"ITDSL_CONFORMANCE_EVIDENCE\");const declaredEvidence=evidence.map(x=>x.value);let previous=-1;for(const item of observation.evidence){const i=declaredEvidence.findIndex(x=>x===item.type);if(i<0)throw new Error(\"ITDSL_UNDECLARED_EVIDENCE\");if(i<previous)throw new Error(\"ITDSL_CONFORMANCE_TRAJECTORY\");previous=i}return true}\nexport function conforms(items:readonly Evidence[]):boolean{try{validateEvidenceOrder(items);return true}catch{return false}}\nexport function assertConstraint(condition:boolean,code:string):void{if(!condition)throw new Error(\"ITDSL_CONSTRAINT:\"+code)}\n";s+=trajectoryProofTS();return s;}
function generatePy(a){var states=a.states,actors=Object.keys(a.actors),ev=a.evidence,tr={};states.forEach(function(s){tr[s]=[]});edges(states).forEach(function(e){tr[e[0]].push(e[1])});var skills=Object.values(a.skills).map(function(k){return {name:k.name,fields:k.fields}});
 var s="# GENERATED FROM ITDSL — DO NOT EDIT\nfrom __future__ import annotations\nfrom dataclasses import dataclass\nfrom enum import StrEnum\nfrom typing import Final, Literal\n\nclass State(StrEnum):\n";s+=states.map(function(x){return "    "+x.toUpperCase()+" = "+q(x)}).join("\n")+"\n\nclass Actor(StrEnum):\n";s+=actors.map(function(x){return "    "+x.toUpperCase()+" = "+q(x)}).join("\n")+"\n\n";
 s+="DESTINY: Final="+pyq(a.destiny)+"\nCONSTRAINT_AST: Final="+pyq(a.constraint_ast)+"\nSKILL_SEMANTICS: Final="+pyq(a.skill_semantics)+"\nIDS: Final="+pyq(a.ids)+"\nINTENT: Final="+pyq(a.intent)+"\nREQUIRED: Final="+pyq(a.required)+"\nBEHAVIOR: Final="+pyq(a.behavior)+"\nTRAJECTORY: Final="+pyq(a.trajectory)+"\nCONSTRAINTS: Final="+pyq(a.constraints)+"\nEVIDENCE: Final="+pyq(ev)+"\nSKILLS: Final="+pyq(skills)+"\n";
 s+="TRANSITIONS: Final={"+Object.keys(tr).map(function(k){return "State."+k.toUpperCase()+": frozenset({"+tr[k].map(function(x){return "State."+x.toUpperCase()}).join(",")+"})"}).join(",")+"}\nAUTHORIZATION: Final={"+Object.keys(a.actors).map(function(k){return "Actor."+k.toUpperCase()+": frozenset("+pyq(a.actors[k])+")"}).join(",")+"}\n\n";
 s+="@dataclass(frozen=True)\nclass Evidence:\n    kind: str\n    at: int\n\n@dataclass(frozen=True)\nclass SkillExecution:\n    skill: str\n    current: State\n    target: State\n    input: tuple[str, ...]\n    output: str | None = None\n    actor: Actor | None = None\n    capability: str | None = None\n    facts: tuple[str, ...] = ()\n    evidence: tuple[Evidence, ...] = ()\n    provenance: dict | None = None\n\ndef allowed(actor: Actor, capability: str) -> bool:\n    return capability in AUTHORIZATION[actor]\n\ndef transition(current: State, target: State) -> State:\n    if target not in TRANSITIONS[current]: raise ValueError(\"ITDSL_ILLEGAL_TRANSITION\")\n    return target\n\ndef validate_evidence_order(items: tuple[Evidence,...]) -> None:\n    order=tuple(x[\"value\"] for x in EVIDENCE); previous=-1; counts={}\n    for item in items:\n        try: i=order.index(item.kind)\n        except ValueError as exc: raise ValueError(\"ITDSL_UNDECLARED_EVIDENCE\") from exc\n        if i<previous: raise ValueError(\"ITDSL_EVIDENCE_ORDER\")\n        previous=i; counts[item.kind]=counts.get(item.kind,0)+1\n    for spec in EVIDENCE:\n        n=counts.get(spec[\"value\"],0)\n        if n<spec[\"min\"]: raise ValueError(\"ITDSL_EVIDENCE_MIN\")\n        if spec[\"max\"]!=\"*\" and n>spec[\"max\"]: raise ValueError(\"ITDSL_EVIDENCE_MAX\")\n\ndef conform_skill_execution(observation: SkillExecution) -> bool:\n    skill = next((x for x in SKILL_SEMANTICS if x['name'] == observation.skill), None)\n    if skill is None: raise ValueError('ITDSL_CONFORMANCE_SKILL')\n    if skill['from'] and observation.current.value != skill['from']: raise ValueError('ITDSL_CONFORMANCE_STATE')\n    if skill['to'] and observation.target.value != skill['to']: raise ValueError('ITDSL_CONFORMANCE_STATE')\n    if skill['from'] and skill['to']: transition(observation.current, observation.target)\n    for required in skill['input'].split('+'):\n        if required.strip() not in observation.input: raise ValueError('ITDSL_CONFORMANCE_INPUT')\n    if observation.output is not None and observation.output != skill['output']: raise ValueError('ITDSL_CONFORMANCE_OUTPUT')\n    if observation.actor is not None and observation.capability is not None and not allowed(observation.actor, observation.capability): raise ValueError('ITDSL_CONFORMANCE_AUTHORIZATION')\n    facts=set(observation.facts) | {x.kind for x in observation.evidence}\n    def evaluate(ast):\n        if ast['op'] == 'fact': return ast['value'] in facts\n        if ast['op'] == 'not': return not evaluate(ast['arg'])\n        if ast['op'] == 'and': return evaluate(ast['left']) and evaluate(ast['right'])\n        if ast['op'] == 'or': return evaluate(ast['left']) or evaluate(ast['right'])\n        left,right=ast['left'] in facts,ast['right'] in facts\n        return {'=':left==right,'≠':left!=right,'∈':left and right,'∉':(not left) or (not right)}[ast['op']]\n    for name,condition in (('pre',skill['pre']),('when',skill['when']),('requires',skill['requires']),('post',skill['post']),('ensures',skill['ensures'])):\n        if condition and not evaluate(condition): raise ValueError('ITDSL_CONFORMANCE_'+name.upper())\n    if not any(x.kind == skill['evidence'] for x in observation.evidence): raise ValueError('ITDSL_CONFORMANCE_EVIDENCE')\n    declared=[x[\"value\"] for x in EVIDENCE]; previous=-1\n    for item in observation.evidence:\n        if item.kind not in declared: raise ValueError('ITDSL_UNDECLARED_EVIDENCE')\n        i=declared.index(item.kind)\n        if i < previous: raise ValueError('ITDSL_CONFORMANCE_TRAJECTORY')\n        previous=i\n    return True\n\ndef conforms(items: tuple[Evidence,...]) -> bool:\n    try: validate_evidence_order(items); return True\n    except ValueError: return False\ndef assert_constraint(condition: bool, code: str) -> None:\n    if not condition: raise ValueError(\"ITDSL_CONSTRAINT:\"+code)\n";s+=trajectoryProofPY();return s;}
function testTS(a){return `import assert from 'node:assert/strict';
import {allowed,assertConstraint,conformSkillExecution,conforms,createTrajectoryProof,ids,proveTrajectory,transition,validateEvidenceOrder} from './generated.ts';
assert.equal(allowed("system","select"),true);
assert.equal(transition("requested","collecting"),"collecting");
const valid=${JSON.stringify(a.evidence.map(x=>x.value))}.map((type,i)=>({type,at:i+1}));
assert.doesNotThrow(()=>validateEvidenceOrder(valid));assert.equal(conforms(valid),true);
const execution={skill:"select_courier",from:"searching",to:"assigned",input:["couriers","origin"],actor:"system",capability:"select",evidence:[{type:"courier.selected",at:1}],facts:["addresses.collected"]};
assert.equal(conformSkillExecution(execution),true);
const chain=[
 ["request_delivery","requested","collecting",["pickup","dropoff"],"request.received",[]],
 ["recognize_intent","recognizing","addressing",["request"],"intent.recognized",["request.received"]],
 ["collect_addresses","addressing","searching",["pickup","dropoff"],"addresses.collected",["intent.recognized"]],
 ["select_courier","searching","assigned",["couriers","origin"],"courier.selected",["request.received","intent.recognized","addresses.collected"]],
 ["confirm_payment","assigned","awaiting_payment",["payment"],"payment.confirmed",["courier.selected"]],
 ["release_delivery","awaiting_payment","paid",["confirmation"],"delivery.released",["payment.confirmed"]],
 ["track_delivery","paid","active",["location"],"location.received",["delivery.released"]],
 ["arrive_delivery","active","arriving",["location"],"location.forwarded",["location.received"]],
 ["validate_delivery","arriving","delivered",["code"],"code.validated",["location.forwarded"]],
 ["settle_delivery","delivered","settled",["code","location"],"settlement.completed",["code.validated"]]
].map((x,i)=>({skill:x[0],from:x[1],to:x[2],input:x[3],actor:"system",capability:"select",facts:x[5],evidence:[{type:x[4],at:i+1}]}));
const artifact=createTrajectoryProof(chain.map((x,i)=>({...x,provenance:{timestamp:"2026-10-07T10:00:"+String(i).padStart(2,"0")+"Z",source:"test-runtime",sequence:i}})));
assert.equal(artifact.conformant,true);assert.equal(artifact.trajectoryId,ids.trajectory_id);assert.equal(artifact.behaviorId,ids.behavior_id);assert.equal(artifact.provenance.length,10);assert.equal(artifact.startAt,"2026-10-07T10:00:00Z");assert.equal(artifact.endAt,"2026-10-07T10:00:09Z");
const truncated=createTrajectoryProof(chain.slice(0,-1));assert.equal(truncated.conformant,false);assert.equal(truncated.firstDivergence?.code,"ITDSL_TRAJECTORY_PROOF_MISSING");assert.equal(truncated.firstDivergence?.step,10);
assert.throws(()=>proveTrajectory(chain.slice(0,-1)),/ITDSL_TRAJECTORY_PROOF_MISSING/);
assert.throws(()=>proveTrajectory([...chain.slice(0,8),{...chain[8],evidence:[{type:"payment.confirmed",at:9}]},chain[9]]),/ITDSL_CONFORMANCE_EVIDENCE/);
assert.throws(()=>assertConstraint(false,"forbidden"),/ITDSL_CONSTRAINT:forbidden/);
console.log("Generic ITDSL TypeScript conformance: PASS");
`;}
function testPy(a){return `import unittest
from generated import Actor,State,Evidence,SkillExecution,allowed,assert_constraint,conform_skill_execution,conforms,create_trajectory_proof,prove_trajectory,transition,validate_evidence_order
class GenericITDSLTests(unittest.TestCase):
 def test_auth(self): self.assertTrue(allowed(Actor.SYSTEM,"select"))
 def test_state(self): self.assertEqual(transition(State.REQUESTED,State.COLLECTING),State.COLLECTING)
 def test_evidence(self):
  e=tuple(Evidence(x,i+1) for i,x in enumerate(${JSON.stringify(a.evidence.map(x=>x.value))}));validate_evidence_order(e);self.assertTrue(conforms(e))
 def test_skill_and_trajectory(self):
  chain=[
   SkillExecution("request_delivery",State.REQUESTED,State.COLLECTING,("pickup","dropoff"),actor=Actor.SYSTEM,capability="select",evidence=(Evidence("request.received",1),)),
   SkillExecution("recognize_intent",State.RECOGNIZING,State.ADDRESSING,("request",),actor=Actor.SYSTEM,capability="select",facts=("request.received",),evidence=(Evidence("intent.recognized",2),)),
   SkillExecution("collect_addresses",State.ADDRESSING,State.SEARCHING,("pickup","dropoff"),actor=Actor.SYSTEM,capability="select",facts=("request.received","intent.recognized"),evidence=(Evidence("addresses.collected",3),)),
   SkillExecution("select_courier",State.SEARCHING,State.ASSIGNED,("couriers","origin"),actor=Actor.SYSTEM,capability="select",facts=("request.received","addresses.collected","intent.recognized"),evidence=(Evidence("courier.selected",4),)),
   SkillExecution("confirm_payment",State.ASSIGNED,State.AWAITING_PAYMENT,("payment",),actor=Actor.SYSTEM,capability="select",facts=("courier.selected",),evidence=(Evidence("payment.confirmed",5),)),
   SkillExecution("release_delivery",State.AWAITING_PAYMENT,State.PAID,("confirmation",),actor=Actor.SYSTEM,capability="select",facts=("payment.confirmed",),evidence=(Evidence("delivery.released",6),)),
   SkillExecution("track_delivery",State.PAID,State.ACTIVE,("location",),actor=Actor.SYSTEM,capability="select",facts=("delivery.released",),evidence=(Evidence("location.received",7),)),
   SkillExecution("arrive_delivery",State.ACTIVE,State.ARRIVING,("location",),actor=Actor.SYSTEM,capability="select",facts=("location.received",),evidence=(Evidence("location.forwarded",8),)),
   SkillExecution("validate_delivery",State.ARRIVING,State.DELIVERED,("code",),actor=Actor.SYSTEM,capability="select",facts=("location.forwarded",),evidence=(Evidence("code.validated",9),)),
   SkillExecution("settle_delivery",State.DELIVERED,State.SETTLED,("code","location"),actor=Actor.SYSTEM,capability="select",facts=("code.validated",),evidence=(Evidence("settlement.completed",10),))
  ]
  for i,item in enumerate(chain): chain[i]=SkillExecution(item.skill,item.current,item.target,item.input,item.output,item.actor,item.capability,item.facts,item.evidence,{"timestamp":f"2026-10-07T10:00:{i:02d}Z","source":"test-runtime","sequence":i})
  artifact=create_trajectory_proof(tuple(chain));self.assertTrue(artifact["conformant"]);self.assertTrue(artifact["trajectory_id"].startswith("trajectory-"));self.assertTrue(artifact["behavior_id"].startswith("behavior-"));self.assertEqual(artifact["start_at"],"2026-10-07T10:00:00Z");self.assertEqual(artifact["end_at"],"2026-10-07T10:00:09Z")
  truncated=create_trajectory_proof(tuple(chain[:-1]));self.assertFalse(truncated["conformant"]);self.assertEqual(truncated["first_divergence"]["code"],"ITDSL_TRAJECTORY_PROOF_MISSING");self.assertEqual(truncated["first_divergence"]["step"],10)
  with self.assertRaisesRegex(ValueError,"ITDSL_TRAJECTORY_PROOF_MISSING"): prove_trajectory(tuple(chain[:-1]))
 def test_constraint(self):
  with self.assertRaisesRegex(ValueError,"ITDSL_CONSTRAINT:forbidden"): assert_constraint(False,"forbidden")
if __name__=="__main__": unittest.main(verbosity=2)
`;}
const parsed=parse(input);validate(parsed);parsed.skillSemantics=skillSemantics(parsed);parsed.ids=semanticIds(parsed);const ast=normalize(parsed);mkdirSync(out,{recursive:true});
if(target==="typescript"){writeFileSync(resolve(out,"generated.ts"),generateTS(ast));writeFileSync(resolve(out,"generated.test.ts"),testTS(ast));}
else if(target==="python"){writeFileSync(resolve(out,"generated.py"),generatePy(ast));writeFileSync(resolve(out,"test_generated.py"),testPy(ast));}else fail("ITDSL_TARGET","target must be typescript or python");
writeFileSync(resolve(out,".itdsl-ir.json"),JSON.stringify(ast,null,2)+"\n");console.log(JSON.stringify({ok:true,target,source,output:out}));