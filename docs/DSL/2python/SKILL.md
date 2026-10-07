# Trajectory-Driven DSL → Python Skill

## 1. Purpose

This is the normative projection of T-DD-DSL into Python.

For DSL specification P and implementation Y:

`Y ⊨ P`

must be demonstrable through validation, invariant enforcement, tests, and observed evidence.

Python's dynamic runtime must never be used to omit DSL constraints.

## 2. Required profile

Prefer immutable dataclasses/value objects, Enum or Literal for finite states, complete annotations, Protocol for skills, explicit expected-failure types, runtime boundary validation, exhaustive transitions, and deterministic evidence.

## 3. Mapping

| DSL | Python |
|---|---|
| D | immutable destiny specification |
| I | intent dataclass |
| R | validated input dataclass |
| B | behavior/transition functions |
| S | Enum/Literal state model |
| A | authorization policy |
| K | Protocol/function skill |
| E | typed evidence dataclass |
| X | invariant/forbidden predicate |
| T | trajectory sequence |
| → | ordered relation |
| ∧ | and |
| ¬ | not |
| * | repeated sequence |
| ⊨ | conformance validator |

## 4. Destiny

DSL:

``text
D: delivery → requested paid assigned tracked delivered settled
``

Projection:

``python
from typing import Final

DESTINY: Final = (
    "requested",
    "paid",
    "assigned",
    "tracked",
    "delivered",
    "settled",
)
``

The tuple declares semantic milestones; it is not automatically an imperative program.

## 5. Intent

DSL:

``text
I: customer → deliver
``

Projection:

``python
from dataclasses import dataclass

@dataclass(frozen=True)
class DeliveryIntent:
    actor: str
    goal: str
``

Validation must enforce the declared actor and goal.

## 6. Required information

DSL:

``text
R: pickup + dropoff
``

Projection:

``python
@dataclass(frozen=True)
class DeliveryRequest:
    pickup: Address
    dropoff: Address

    def validate(self) -> None:
        if self.pickup.id == self.dropoff.id:
            raise ConstraintViolation("pickup_equals_dropoff")
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

``python
from enum import StrEnum

class DeliveryState(StrEnum):
    REQUESTED = "requested"
    COLLECTING = "collecting"
    SEARCHING = "searching"
    ASSIGNED = "assigned"
    AWAITING_PAYMENT = "awaiting_payment"
    PAID = "paid"
    ACTIVE = "active"
    ARRIVING = "arriving"
    DELIVERED = "delivered"
    SETTLED = "settled"
    FAILED = "failed"
``

Transition relation:

``python
TRANSITIONS = {
    DeliveryState.REQUESTED: frozenset({DeliveryState.COLLECTING}),
    DeliveryState.COLLECTING: frozenset({
        DeliveryState.SEARCHING,
        DeliveryState.FAILED,
    }),
    DeliveryState.SEARCHING: frozenset({
        DeliveryState.ASSIGNED,
        DeliveryState.FAILED,
    }),
    DeliveryState.ASSIGNED: frozenset({
        DeliveryState.AWAITING_PAYMENT,
        DeliveryState.FAILED,
    }),
    DeliveryState.AWAITING_PAYMENT: frozenset({
        DeliveryState.PAID,
        DeliveryState.FAILED,
    }),
    DeliveryState.PAID: frozenset({DeliveryState.ACTIVE}),
    DeliveryState.ACTIVE: frozenset({
        DeliveryState.ARRIVING,
        DeliveryState.FAILED,
    }),
    DeliveryState.ARRIVING: frozenset({DeliveryState.DELIVERED}),
    DeliveryState.DELIVERED: frozenset({DeliveryState.SETTLED}),
    DeliveryState.SETTLED: frozenset(),
    DeliveryState.FAILED: frozenset(),
}
``

Invalid: `REQUESTED → SETTLED`.

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

``python
AUTHORIZATION = {
    "customer": frozenset({"request", "address", "pay", "code"}),
    "system": frozenset({
        "classify", "collect", "discover", "select",
        "charge", "validate", "route", "settle",
    }),
    "courier": frozenset({"accept", "locate", "deliver"}),
    "payment": frozenset({"confirm", "reject"}),
}
``

``python
def allowed(actor: str, capability: str) -> bool:
    return capability in AUTHORIZATION.get(actor, frozenset())
``

`allowed("customer", "settle")` must be false.

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

``python
from typing import Protocol, Sequence

class SelectNearest(Protocol):
    def __call__(
        self,
        couriers: Sequence[Courier],
        origin: Coordinates,
    ) -> Courier:
        ...
``

Example implementation:

``python
def select_nearest(
    couriers: Sequence[Courier],
    origin: Coordinates,
) -> Courier:
    available = [c for c in couriers if c.available]
    if not available:
        raise NoAvailableCourier("no_available_courier")

    return min(
        available,
        key=lambda courier: distance(courier.location, origin),
    )
``

The algorithm may change; the minimum-distance rule may not.

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

``python
from dataclasses import dataclass
from typing import Literal

EvidenceKind = Literal[
    "request.received",
    "intent.recognized",
    "addresses.collected",
    "courier.selected",
    "payment.confirmed",
]

@dataclass(frozen=True)
class Evidence:
    kind: EvidenceKind
    at: int
``

Undeclared evidence is invalid.

## 11. Repetition

DSL:

``text
location.received*
``

Projection:

``python
location_evidence: tuple[Evidence, ...]
``

Zero or many observations are valid.

## 12. Logic

DSL:

``text
payment = confirmed ∧ location = dropoff
``

Python:

``python
valid = (
    payment.status == "confirmed"
    and location.id == dropoff.id
)
``

DSL:

``text
¬(payment = confirmed)
``

Python:

``python
if payment.status != "confirmed":
    raise ForbiddenTransition("payment_not_confirmed")
``

The semantic error identity must be preserved.

## 13. Forbidden scenarios

DSL:

``text
X:
  ¬ release(payment ≠ confirmed)
  ¬ settle(code ≠ valid)
  ¬ select(courier ∉ available)
``

Projection must reject each forbidden condition before its capability succeeds.

## 14. Transition enforcement

``python
def transition(
    current: DeliveryState,
    target: DeliveryState,
) -> DeliveryState:
    if target not in TRANSITIONS[current]:
        raise IllegalTransition("undeclared_transition")
    return target
``

Arbitrary strings must not bypass this boundary.

## 15. Evidence/state invariant

When evidence establishes a state transition, establish evidence before exposing the new state.

Invalid:

``python
state = DeliveryState.PAID
emit_payment_confirmed()
``

Valid:

``python
emit_payment_confirmed()
state = DeliveryState.PAID
``

provided all other constraints hold.

## 16. Async and concurrency

Async does not weaken semantic order.

Valid:

``python
await confirm_payment()
await release_delivery()
``

Invalid when release depends on confirmation:

``python
await asyncio.gather(
    release_delivery(),
    confirm_payment(),
)
``

Concurrent duplicate operations must not create incompatible semantic states. Use idempotency, transactionality, compare-and-set, serialization, or another equivalent mechanism.

## 17. External boundaries

Validate:

- channel messages;
- HTTP/webhooks;
- provider responses;
- persisted data;
- agent outputs.

Annotations alone are not runtime validation.

## 18. Valid scenarios

- complete delivery trajectory;
- remaining in `searching` while no courier exists when permitted;
- multiple location evidence items under `*`.

## 19. Invalid scenarios

- release before payment;
- settlement with invalid code;
- unavailable courier;
- unauthorized customer settlement;
- undeclared state transition;
- undeclared evidence;
- state change without required evidence.

## 20. Test obligations

For every DSL declaration provide:

- valid test;
- invalid test;
- boundary test;
- invariant test;
- forbidden-scenario test;
- conformance test.

For `*` test zero and multiple occurrences.

For `→` test legal and illegal edges.

For each actor capability test allowed and denied execution.

## 21. Property-oriented tests

Tests should represent DSL properties.

``python
@given(valid_requests())
def test_pickup_and_dropoff_are_distinct(request):
    assert request.pickup.id != request.dropoff.id
``

``python
@given(illegal_transitions())
def test_illegal_transition_is_rejected(pair):
    with pytest.raises(IllegalTransition):
        transition(*pair)
``

## 22. Forbidden shortcuts

Do not bypass validation, use arbitrary string states, emit undeclared evidence, infer authorization from names, downgrade forbidden conditions to warnings, or modify the DSL merely because implementation is inconvenient.

## 23. Correctness

`runtime_behavior ⊨ DSL`

is the final semantic judgment.


## 24. Generator and projection failure mitigation

Generation failures are compilation failures, not reasons to weaken the DSL.

Required handling:

| Failure | Meaning | Mitigation |
|---|---|---|
| syntax error | source cannot be parsed | fix DSL structure; do not generate |
| unresolved actor/state/evidence | semantic name has no declaration | add/resolve the declaration |
| invalid behavior term | behavior shape is outside grammar | correct the behavior expression |
| unsupported target | generator has no projection | implement the target profile before use |
| runtime failure | generated Python violates the DSL | fix generator/runtime, not the specification |
| nondeterministic output | same source produces different output | normalize ordering and serialization |
| generated tests fail | semantic projection is incomplete | inspect the violated DSL obligation and repair the generator |

A generator must fail closed. A partial Python module is never a successful projection.

CI must verify:

1. compiler validation;
2. generation;
3. language classification;
4. runtime execution;
5. deterministic regeneration.

Python must preserve finite semantic domains with `StrEnum`, `Literal`, immutable values or equivalent runtime checks. Dynamic typing must not turn a DSL state or actor into an arbitrary string.
