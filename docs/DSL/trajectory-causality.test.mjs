import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTrajectoryCausality } from "./trajectory-causality.mjs";

const artifact = (trajectoryId, divergence, evidence, skills, states) => ({
  trajectoryId,
  conformant: !divergence,
  evidence,
  skills,
  states,
  ...(divergence ? { firstDivergence: divergence } : {})
});

test("finds recurring antecedent for divergence", () => {
  const history = {
    records: [
      { recordId: 1, trajectoryId: "trajectory-a", artifact: artifact("trajectory-a",
        { code: "T-DD-DSL_CONFORMANCE_EVIDENCE", step: 3 },
        ["request.received", "intent.recognized"], ["request_delivery", "recognize_intent"], ["requested", "collecting", "recognizing"]) },
      { recordId: 2, trajectoryId: "trajectory-a", artifact: artifact("trajectory-a",
        { code: "T-DD-DSL_CONFORMANCE_EVIDENCE", step: 3 },
        ["request.received", "intent.recognized"], ["request_delivery", "recognize_intent"], ["requested", "collecting", "recognizing"]) },
      { recordId: 3, trajectoryId: "trajectory-a", artifact: artifact("trajectory-a",
        undefined,
        ["request.received", "intent.recognized", "addresses.collected"], ["request_delivery", "recognize_intent", "collect_addresses"], ["requested", "collecting", "recognizing", "addressing"]) }
    ]
  };
  const analysis = analyzeTrajectoryCausality(history);
  const signal = analysis.candidateSignals.find(x =>
    x.antecedentType === "evidence" &&
    x.antecedent === "intent.recognized" &&
    x.outcome === "T-DD-DSL_CONFORMANCE_EVIDENCE"
  );
  assert.ok(signal);
  assert.equal(signal.cooccurrences, 2);
  assert.equal(signal.outcomeCount, 2);
  assert.equal(signal.conditionalRate, 1);
  assert.equal(signal.baselineRate, 2 / 3);
  assert.ok(signal.lift > 1);
});

test("detects antecedents for trajectory changes", () => {
  const history = {
    records: [
      { recordId: 1, trajectoryId: "trajectory-a", artifact: artifact("trajectory-a", undefined,
        ["request.received", "payment.confirmed"], ["request_delivery", "confirm_payment"], ["requested", "awaiting_payment", "paid"]) },
      { recordId: 2, trajectoryId: "trajectory-b", artifact: artifact("trajectory-b", undefined,
        ["request.received"], ["request_delivery"], ["requested", "collecting"]) },
      { recordId: 3, trajectoryId: "trajectory-b", artifact: artifact("trajectory-b", undefined,
        ["request.received"], ["request_delivery"], ["requested", "collecting"]) }
    ]
  };
  const analysis = analyzeTrajectoryCausality(history);
  assert.equal(analysis.transitionOpportunities, 2);
  const signal = analysis.candidateSignals.find(x =>
    x.antecedentType === "evidence" &&
    x.antecedent === "payment.confirmed" &&
    x.outcomeType === "trajectory-change" &&
    x.outcome === "trajectory-a→trajectory-b"
  );
  assert.ok(signal);
  assert.equal(signal.cooccurrences, 1);
  assert.equal(signal.outcomeCount, 1);
  assert.equal(signal.lift, 2);
});

test("supports thresholding and deterministic ordering", () => {
  const history = { records: [
    { recordId: 1, trajectoryId: "a", artifact: artifact("a", { code: "D", step: 2 }, ["x"], ["s"], ["a", "b"]) },
    { recordId: 2, trajectoryId: "a", artifact: artifact("a", { code: "D", step: 2 }, ["x"], ["s"], ["a", "b"]) }
  ]};
  const filtered = analyzeTrajectoryCausality(history, { minOccurrences: 3 });
  assert.deepEqual(filtered.candidateSignals, []);
  const included = analyzeTrajectoryCausality(history, { minLift: 1 });
  assert.ok(included.candidateSignals.length > 0);
});
