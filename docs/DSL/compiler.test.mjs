import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const compiler = new URL("./compiler.mjs", import.meta.url).pathname;
const projection = process.argv[2] || "typescript";
const source = new URL("../../examples/delivery.itdsl", import.meta.url).pathname;
const support = new URL("../../examples/support.itdsl", import.meta.url).pathname;
const root = mkdtempSync(join(tmpdir(), "itdsl-"));

function run(src, target) {
  return spawnSync(process.execPath, [compiler, src, target, projection], { encoding: "utf8" });
}

{ const result=run(support, join(root, "support")); assert.equal(result.status, 0, result.stderr); }
const first = join(root, "first");
const second = join(root, "second");
{ const result=run(source, first); assert.equal(result.status, 0, result.stderr); }
{ const result=run(source, second); assert.equal(result.status, 0, result.stderr); }
assert.equal(readFileSync(join(first, projection === "typescript" ? "generated.ts" : "generated.py"), "utf8"), readFileSync(join(second, projection === "typescript" ? "generated.ts" : "generated.py"), "utf8"));
assert.equal(readFileSync(join(first, ".itdsl-ir.json"), "utf8"), readFileSync(join(second, ".itdsl-ir.json"), "utf8"));

const invalid = join(root, "invalid.itdsl");
writeFileSync(invalid, ["@delivery","D: delivery → requested","I: ghost → deliver","R: pickup + dropoff","B: request","S: requested → settled","A: customer { request }","E: request.received","T: request.received → done"].join("\n"));
const failure = run(invalid, join(root, "invalid"));
assert.notEqual(failure.status, 0);
assert.match(failure.stderr, /T-DD-DSL_ACTOR_RESOLUTION/);

const contradictory = join(root, "contradictory.itdsl");
writeFileSync(contradictory, [
  "@logic",
  "D: process → ready",
  "I: actor → run",
  "R: input",
  "B: run",
  "S: ready → done",
  "A: actor { run }",
  "E: process.started",
  "T: process.started",
  "X: ready",
  "X: ¬ ready"
].join("\n"));
const contradiction = run(contradictory, join(root, "contradictory"));
assert.notEqual(contradiction.status, 0);
assert.match(contradiction.stderr, /T-DD-DSL_CONSTRAINT_CONTRADICTION/);

const malformedConstraint = join(root, "malformed-constraint.itdsl");
writeFileSync(malformedConstraint, [
  "@logic",
  "D: process → ready",
  "I: actor → run",
  "R: input",
  "B: run",
  "S: ready → done",
  "A: actor { run }",
  "E: process.started",
  "T: process.started",
  "X: ready ∧"
].join("\n"));
const malformed = run(malformedConstraint, join(root, "malformed"));
assert.notEqual(malformed.status, 0);
assert.match(malformed.stderr, /T-DD-DSL_CONSTRAINT_SYNTAX/);

console.log("T-DD-DSL compiler tests: PASS");

const semanticSkill = run(resolve(process.cwd(), "examples/delivery.itdsl"), join(root, "skill-semantic"));
assert.equal(semanticSkill.status, 0, semanticSkill.stderr);
const semanticIr = JSON.parse(readFileSync(join(root, "skill-semantic", ".itdsl-ir.json"), "utf8"));
assert.ok(semanticIr.skill_semantics.length > 0);
assert.ok(semanticIr.skill_semantics.some((s) => s.pre && s.post && s.from === "searching" && s.to === "assigned"));
const invalidSkill = join(root, "invalid-skill.itdsl");
writeFileSync(invalidSkill, ["@logic","D: process → ready","I: actor → run","R: input","B: run","S: ready → done","A: actor { run }","K run {","  in: input","  out: result","  rule: execute","  emit: process.done","  pre: ready ∧","}","E: process.done","T: process.done"].join("\n"));
const badSkill = run(invalidSkill, join(root, "invalid-skill"));
assert.notEqual(badSkill.status, 0);
assert.match(badSkill.stderr, /T-DD-DSL_CONSTRAINT_SYNTAX/);
rmSync(root, { recursive: true, force: true });
