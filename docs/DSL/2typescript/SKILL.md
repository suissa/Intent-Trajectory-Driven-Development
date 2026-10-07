# Intent Trajectory DSL → TypeScript Skill

## 1. Purpose

This is the normative projection of ITDSL into TypeScript.

The objective is semantic preservation, not textual translation.

For DSL specification P and implementation T:

`T ⊨ P`

must be demonstrable through types, runtime validation, invariants, tests, and observed evidence.

## 2. Required profile

Use strict TypeScript, discriminated unions for finite states, readonly semantic values, explicit expected-failure types, boundary validation, exhaustive transitions, explicit authorization, and typed evidence.

Compiler success is necessary but never sufficient.

## 3. Mapping

| DSL | TypeScript |
|---|---|
| D | readonly destiny specification |
| I | intent type |
| R | validated input type |
| B | behavior/transition model |
| S | discriminated state union |
| A | actor/capability policy |
| K | skill interface/function |
| E | evidence union |
| X | invariant/forbidden predicate |
| T | trajectory sequence |
| → | ordered relation |
| ∧ | && |
| ¬ | negated predicate |
| * | repeated collection |
| ⊨ | conformance test |

## 4. Destiny

DSL:

``text
D: delivery → requested paid assigned tracked delivered settled
``

Projection:

``ts
export const destiny = {
  domain: "delivery",
  milestones: [
    "requested", "paid", "assigned",
    "tracked", "delivered", "settled",
  ],
} as const;
``

A milestone may only be claimed when its semantic evidence exists.

## 5. Intent

DSL:

``text
I: customer → deliver
``

Projection:

``ts
type DeliveryIntent = Readonly<{
  actor: "customer";
  goal: "deliver";
}>;
``

Recognition does not imply completion.

## 6. Required information

DSL:

``text
R: pickup + dropoff
``

Projection:

``ts
type DeliveryRequest = Readonly<{
  pickup: Address;
  dropoff: Address;
}>;
``

Constraint:

``ts
function validAddresses(x: DeliveryRequest): boolean {
  return x.pickup.id !== x.dropoff.id;
}
``

Invalid: behavior starts without both values.

## 7. State

DSL:

``text
S:
  requested → collecting → searching → assigned
  → awaiting_payment → paid → active → arriving
  → delivered → settled
``

Projection:

``ts
type DeliveryState =
  | "requested" | "collecting" | "searching"
  | "assigned" | "awaiting_payment" | "paid"
  | "active" | "arriving" | "delivered"
  | "settled" | "failed";
``

Transition relation:

``ts
const transitions = {
  requested: ["collecting"],
  collecting: ["searching", "failed"],
  searching: ["assigned", "failed"],
  assigned: ["awaiting_payment", "failed"],
  awaiting_payment: ["paid", "failed"],
  paid: ["active"],
  active: ["arriving", "failed"],
  arriving: ["delivered"],
  delivered: ["settled"],
  settled: [],
  failed: [],
} as const;
``

Invalid: `requested → settled`.

## 8. Actor authorization

DSL:

``text
A:
  customer { request address pay code }
  system   { classify collect discover select charge validate route settle }
  courier  { accept locate deliver }
  payment  { confirm reject }
``

Projection:

``ts
type Actor = "customer" | "system" | "courier" | "payment";

type Capability =
  | "request" | "address" | "pay" | "code"
  | "classify" | "collect" | "discover" | "select"
  | "charge" | "validate" | "route" | "settle"
  | "accept" | "locate" | "deliver"
  | "confirm" | "reject";
``

Authorization is explicit data:

``ts
const allow = {
  customer: ["request", "address", "pay", "code"],
  system: ["classify", "collect", "discover", "select", "charge", "validate", "route", "settle"],
  courier: ["accept", "locate", "deliver"],
  payment: ["confirm", "reject"],
} as const;
``

Invalid: customer performs `settle`.

## 9. Skill

DSL:

``text
K select_nearest {
  in: couriers + origin
  rule: min(distance(courier, origin))
  out: courier
  emit: courier.selected
}
``

Projection:

``ts
type SelectNearestInput = Readonly<{
  couriers: readonly Courier[];
  origin: Coordinates;
}>;

type SelectNearestOutput = Readonly<{
  courier: Courier;
}>;
``

The algorithm is implementation-defined; the minimum-distance result is semantic and mandatory.

Valid: nearest available courier.

Invalid: unavailable courier.

## 10. Evidence

DSL:

``text
E:
  request.received
  → intent.recognized
  → addresses.collected
  → courier.selected
  → payment.confirmed
``

Projection:

``ts
type Evidence =
  | { readonly type: "request.received"; readonly at: number }
  | { readonly type: "intent.recognized"; readonly at: number }
  | { readonly type: "addresses.collected"; readonly at: number }
  | { readonly type: "courier.selected"; readonly at: number }
  | { readonly type: "payment.confirmed"; readonly at: number };
``

Undeclared evidence is invalid.

## 11. Repetition

DSL:

``text
location.received*
``

Projection:

``ts
readonly locationEvidence: readonly LocationReceivedEvidence[];
``

Zero and many observations are valid.

## 12. Logic

DSL:

``text
payment = confirmed ∧ location = dropoff
``

TypeScript:

``ts
const valid =
  payment.status === "confirmed" &&
  location.id === dropoff.id;
``

DSL:

``text
¬(payment = confirmed)
``

TypeScript:

``ts
if (payment.status !== "confirmed") {
  throw new ForbiddenTransitionError("payment_not_confirmed");
}
``

## 13. Forbidden scenarios

DSL:

``text
X:
  ¬ release(payment ≠ confirmed)
  ¬ settle(code ≠ valid)
  ¬ select(courier ∉ available)
``

Projection must enforce all three conditions before their corresponding capabilities can succeed.

## 14. Transition enforcement

``ts
function transition(
  from: DeliveryState,
  to: DeliveryState,
): DeliveryState {
  const allowed = transitions[from] as readonly string[];
  if (!allowed.includes(to)) {
    throw new IllegalTransitionError("undeclared_transition");
  }
  return to;
}
``

The implementation must not accept arbitrary strings as semantic states.

## 15. Evidence/state invariant

If evidence establishes a state transition, emit/commit the evidence before exposing the new state.

Invalid:

``ts
state = "paid";
emitPaymentConfirmed();
``

Valid:

``ts
emitPaymentConfirmed();
state = "paid";
``

when all payment constraints hold.

## 16. Async and concurrency

Semantic order remains mandatory under async execution.

Valid:

``ts
await confirmPayment();
await releaseDelivery();
``

Invalid when release depends on confirmation:

``ts
await Promise.all([
  releaseDelivery(),
  confirmPayment(),
]);
``

Concurrent duplicate operations must not create incompatible semantic states. Use idempotency or atomic transition mechanisms.

## 17. External boundaries

Validate all external data before entering the semantic core:

- channel messages;
- HTTP/webhooks;
- provider responses;
- persisted data;
- agent output.

A TypeScript assertion does not perform runtime validation.

## 18. Valid scenarios

- normal delivery trajectory;
- no courier while remaining in `searching`;
- multiple location observations under `*`.

## 19. Invalid scenarios

- release before payment;
- settlement with invalid code;
- unavailable courier selection;
- unauthorized capability;
- undeclared transition;
- undeclared evidence;
- state change without required evidence.

## 20. Test obligations

For every DSL declaration provide:

- valid scenario;
- invalid scenario;
- boundary scenario;
- invariant test;
- forbidden-scenario test;
- conformance test.

For every `*` test zero and multiple occurrences.

For every `→` test legal and illegal edges.

For every actor capability test allowed and denied execution.

## 21. Forbidden implementation shortcuts

Do not use `any`, unchecked state strings, undeclared evidence, inferred authorization, or warning-only handling for forbidden scenarios to bypass DSL semantics.

## 22. Correctness

`runtime_behavior ⊨ DSL`

is the final semantic judgment.
