from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Final, TypedDict


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


class Actor(StrEnum):
    CUSTOMER = "customer"
    SYSTEM = "system"
    COURIER = "courier"
    PAYMENT = "payment"


DESTINY: Final = (
    "requested",
    "paid",
    "assigned",
    "tracked",
    "delivered",
    "settled",
)

TRANSITIONS: Final = {
    DeliveryState.REQUESTED: frozenset({DeliveryState.COLLECTING}),
    DeliveryState.COLLECTING: frozenset({DeliveryState.SEARCHING, DeliveryState.FAILED}),
    DeliveryState.SEARCHING: frozenset({DeliveryState.ASSIGNED, DeliveryState.FAILED}),
    DeliveryState.ASSIGNED: frozenset({DeliveryState.AWAITING_PAYMENT, DeliveryState.FAILED}),
    DeliveryState.AWAITING_PAYMENT: frozenset({DeliveryState.PAID, DeliveryState.FAILED}),
    DeliveryState.PAID: frozenset({DeliveryState.ACTIVE}),
    DeliveryState.ACTIVE: frozenset({DeliveryState.ARRIVING, DeliveryState.FAILED}),
    DeliveryState.ARRIVING: frozenset({DeliveryState.DELIVERED}),
    DeliveryState.DELIVERED: frozenset({DeliveryState.SETTLED}),
    DeliveryState.SETTLED: frozenset(),
    DeliveryState.FAILED: frozenset(),
}

AUTHORIZATION: Final = {
    Actor.CUSTOMER: frozenset({"request", "address", "pay", "code"}),
    Actor.SYSTEM: frozenset({
        "classify", "collect", "discover", "select", "charge",
        "validate", "route", "settle",
    }),
    Actor.COURIER: frozenset({"accept", "locate", "deliver"}),
    Actor.PAYMENT: frozenset({"confirm", "reject"}),
}


class Courier(TypedDict):
    available: bool
    distance: float


@dataclass(frozen=True)
class DeliveryRequest:
    pickup: str
    dropoff: str

    def validate(self) -> None:
        if not self.pickup or not self.dropoff:
            raise ValueError("T-DD-DSL_REQUIRED_INPUT")
        if self.pickup == self.dropoff:
            raise ValueError("T-DD-DSL_PICKUP_EQUALS_DROPOFF")


@dataclass(frozen=True)
class Evidence:
    kind: str
    at: int


def allowed(actor: Actor, capability: str) -> bool:
    return capability in AUTHORIZATION[actor]


def transition(current: DeliveryState, target: DeliveryState) -> DeliveryState:
    if target not in TRANSITIONS[current]:
        raise ValueError("T-DD-DSL_ILLEGAL_TRANSITION")
    return target


def assert_can_release(payment_confirmed: bool) -> None:
    if not payment_confirmed:
        raise ValueError("T-DD-DSL_RELEASE_BEFORE_PAYMENT")


def assert_can_settle(code_valid: bool, at_dropoff: bool) -> None:
    if not code_valid:
        raise ValueError("T-DD-DSL_INVALID_CODE")
    if not at_dropoff:
        raise ValueError("T-DD-DSL_NOT_AT_DROPOFF")


def select_nearest(couriers: list[Courier]) -> Courier:
    available = [courier for courier in couriers if courier["available"]]
    if not available:
        raise ValueError("T-DD-DSL_NO_AVAILABLE_COURIER")
    return min(available, key=lambda courier: courier["distance"])


EVIDENCE_ORDER: Final = (
    "request.received",
    "intent.recognized",
    "addresses.collected",
    "courier.selected",
    "payment.confirmed",
    "delivery.released",
    "location.received",
    "location.forwarded",
    "code.validated",
    "settlement.completed",
)


def validate_evidence_order(evidence: tuple[Evidence, ...]) -> None:
    previous = -1
    for item in evidence:
        try:
            current = EVIDENCE_ORDER.index(item.kind)
        except ValueError as exc:
            raise ValueError("T-DD-DSL_UNDECLARED_EVIDENCE") from exc
        if current < previous:
            raise ValueError("T-DD-DSL_EVIDENCE_ORDER")
        previous = current


def conforms(evidence: tuple[Evidence, ...]) -> bool:
    try:
        validate_evidence_order(evidence)
    except ValueError:
        return False

    kinds = {item.kind for item in evidence}
    return {
        "request.received",
        "payment.confirmed",
        "settlement.completed",
    }.issubset(kinds)
