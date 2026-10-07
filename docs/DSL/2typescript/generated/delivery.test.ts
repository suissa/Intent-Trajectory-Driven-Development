import assert from "node:assert/strict";
import {
  allowed,
  assertCanRelease,
  assertCanSettle,
  conforms,
  selectNearest,
  transition,
  validateEvidenceOrder,
  validateRequest,
} from "./delivery.js";

assert.doesNotThrow(() => validateRequest({ pickup: "A", dropoff: "B" }));
assert.throws(
  () => validateRequest({ pickup: "A", dropoff: "A" }),
  /ITDSL_PICKUP_EQUALS_DROPOFF/,
);

assert.equal(transition("requested", "collecting"), "collecting");
assert.throws(
  () => transition("requested", "settled"),
  /ITDSL_ILLEGAL_TRANSITION/,
);

assert.equal(allowed("customer", "pay"), true);
assert.equal(allowed("customer", "settle"), false);

assert.throws(
  () => assertCanRelease(false),
  /ITDSL_RELEASE_BEFORE_PAYMENT/,
);
assert.doesNotThrow(() => assertCanRelease(true));

assert.throws(
  () => assertCanSettle(false, true),
  /ITDSL_INVALID_CODE/,
);
assert.throws(
  () => assertCanSettle(true, false),
  /ITDSL_NOT_AT_DROPOFF/,
);
assert.doesNotThrow(() => assertCanSettle(true, true));

const selected = selectNearest([
  { available: true, distance: 20 },
  { available: true, distance: 5 },
  { available: false, distance: 1 },
]);
assert.equal(selected.distance, 5);

const evidence = [
  { type: "request.received" as const, at: 1 },
  { type: "intent.recognized" as const, at: 2 },
  { type: "addresses.collected" as const, at: 3 },
  { type: "courier.selected" as const, at: 4 },
  { type: "payment.confirmed" as const, at: 5 },
  { type: "delivery.released" as const, at: 6 },
  { type: "location.received" as const, at: 7 },
  { type: "location.received" as const, at: 8 },
  { type: "code.validated" as const, at: 9 },
  { type: "settlement.completed" as const, at: 10 },
];

assert.doesNotThrow(() => validateEvidenceOrder(evidence));
assert.equal(conforms(evidence), true);

assert.throws(
  () => validateEvidenceOrder([
    { type: "payment.confirmed", at: 1 },
    { type: "request.received", at: 2 },
  ]),
  /ITDSL_EVIDENCE_ORDER/,
);

console.log("TS generated ITDSL conformance: PASS");
