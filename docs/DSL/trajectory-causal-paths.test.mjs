import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCausalPaths } from "./trajectory-causal-paths.mjs";

const graph = {
  nodes: [
    { id: "evidence:A", type: "evidence", value: "A" },
    { id: "skill:B", type: "skill", value: "B" },
    { id: "state:C", type: "state", value: "C" },
    { id: "divergence:D", type: "divergence", value: "D" },
    { id: "state:E", type: "state", value: "E" }
  ],
  edges: [
    { id: "evidence:A->skill:B", from: "evidence:A", to: "skill:B", support: 0.8, lift: 2 },
    { id: "skill:B->state:C", from: "skill:B", to: "state:C", support: 0.6, lift: 3 },
    { id: "state:C->divergence:D", from: "state:C", to: "divergence:D", support: 0.5, lift: 4 },
    { id: "evidence:A->state:E", from: "evidence:A", to: "state:E", support: 0.7, lift: 1.5 }
  ]
};

test("finds multi-hop paths and scores them by weakest link", () => {
  const result = analyzeCausalPaths(graph, { maxDepth: 3, minPathDepth: 2 });
  assert.ok(result.recurringPaths.some(path =>
    path.nodes.join("->") === "evidence:A->skill:B->state:C->divergence:D"
  ));
  const path = result.recurringPaths.find(item => item.nodes.at(-1) === "divergence:D");
  assert.equal(path.pathScore, 2);
  assert.equal(path.support, 0.5);
});

test("identifies convergence and divergence structure", () => {
  const result = analyzeCausalPaths(graph);
  assert.deepEqual(result.divergencePoints, [{
    node: "evidence:A",
    outgoing: ["skill:B", "state:E"]
  }]);
  assert.deepEqual(result.convergencePoints, []);
});

test("ranks source nodes that reach divergence as root-cause candidates", () => {
  const result = analyzeCausalPaths(graph, { maxDepth: 4 });
  assert.equal(result.rootCauseCandidates[0].node, "evidence:A");
  assert.equal(result.rootCauseCandidates[0].reachesDivergence, true);
});
