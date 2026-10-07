import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const compiler = new URL("./compiler.mjs", import.meta.url).pathname;
const source = new URL("../../examples/delivery.itdsl", import.meta.url).pathname;
const root = mkdtempSync(join(tmpdir(), "itdsl-"));

function run(src, target) {
  return spawnSync(process.execPath, [compiler, src, target, "typescript"], { encoding: "utf8" });
}

const first = join(root, "first");
const second = join(root, "second");
assert.equal(run(source, first).status, 0);
assert.equal(run(source, second).status, 0);
assert.equal(readFileSync(join(first, "delivery.ts"), "utf8"), readFileSync(join(second, "delivery.ts"), "utf8"));
assert.equal(readFileSync(join(first, ".itdsl-normalized.json"), "utf8"), readFileSync(join(second, ".itdsl-normalized.json"), "utf8"));

const invalid = join(root, "invalid.itdsl");
writeFileSync(invalid, "@delivery
D: delivery → requested
I: ghost → deliver
R: pickup + dropoff
B: request
S: requested → settled
A: customer { request }
E: request.received
");
const failure = run(invalid, join(root, "invalid"));
assert.notEqual(failure.status, 0);
assert.match(failure.stderr, /ITDSL_ACTOR_RESOLUTION/);

rmSync(root, { recursive: true, force: true });
console.log("ITDSL compiler tests: PASS");
