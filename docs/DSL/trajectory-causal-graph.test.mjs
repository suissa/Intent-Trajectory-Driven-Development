import assert from "node:assert/strict";
import test from "node:test";
import { buildTrajectoryCausalGraph } from "./trajectory-causal-graph.mjs";

test("builds directed temporal edges from candidate signals", () => {
  const artifact = (trajectoryId, divergence) => ({
    trajectoryId,
    evidence: ["request.received", "intent.recognized"],
    skills: ["request_delivery", "recognize_intent"],
    states: ["requested", "collecting", "recognizing"],
    ...(divergence ? { firstDivergence: divergence } : {})
  });
  const history = {
    records: [
      { recordId: 1, trajectoryId: "a", artifact: artifact("a", { code: "EVIDENCE", step: 3 }) },
      { recordId: 2, trajectoryId: "a", artifact: artifact("a", { code: "EVIDENCE", step: 3 }) },
      { recordId: 3, trajectoryId: "a", artifact: artifact("a") }
    ]
  };
  const graph = buildTrajectoryCausalGraph(history);
  assert.equal(graph.version, 1);
  assert.ok(graph.nodes.some(x => x.id === "evidence:intent.recognized"));
  assert.ok(graph.nodes.some(x => x.id === "divergence:EVIDENCE"));
  const edge = graph.edges.find(x => x.from === "evidence:intent.recognized");
  assert.ok(edge);
  assert.equal(edge.to, "divergence:EVIDENCE");
  assert.equal(edge.temporal, true);
  assert.ok(edge.lift > 1);
});

test("graph output is deterministic", () => {
  const history = { records: [
    { trajectoryId: "a", artifact: { trajectoryId: "a", evidence: ["x"], skills: ["s"], states: ["q","r"], firstDivergence: { code: "D", step: 2 } } },
    { trajectoryId: "a", artifact: { trajectoryId: "a", evidence: ["x"], skills: ["s"], states: ["q","r"], firstDivergence: { code: "D", step: 2 } } }
  ]};
  const a = buildTrajectoryCausalGraph(history);
  const b = buildTrajectoryCausalGraph(history);
  assert.deepEqual(a, b);
});
