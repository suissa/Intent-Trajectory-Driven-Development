import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
assert.match(failure.stderr, /ITDSL_ACTOR_RESOLUTION/);

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
assert.match(contradiction.stderr, /ITDSL_CONSTRAINT_CONTRADICTION/);

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
assert.match(malformed.stderr, /ITDSL_CONSTRAINT_SYNTAX/);

rmSync(root, { recursive: true, force: true });
console.log("ITDSL compiler tests: PASS");
