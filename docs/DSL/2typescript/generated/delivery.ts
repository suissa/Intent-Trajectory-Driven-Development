export type DeliveryState =
  | "requested"
  | "collecting"
  | "searching"
  | "assigned"
  | "awaiting_payment"
  | "paid"
  | "active"
  | "arriving"
  | "delivered"
  | "settled"
  | "failed";

export type Actor = "customer" | "system" | "courier" | "payment";

export type Capability =
  | "request" | "address" | "pay" | "code"
  | "classify" | "collect" | "discover" | "select"
  | "charge" | "validate" | "route" | "settle"
  | "accept" | "locate" | "deliver"
  | "confirm" | "reject";

export type EvidenceType =
  | "request.received"
  | "intent.recognized"
  | "addresses.collected"
  | "courier.selected"
  | "payment.confirmed"
  | "delivery.released"
  | "location.received"
  | "location.forwarded"
  | "code.validated"
  | "settlement.completed";

export interface Evidence {
  readonly type: EvidenceType;
  readonly at: number;
}

export interface DeliveryRequest {
  readonly pickup: string;
  readonly dropoff: string;
}

export const destiny = [
  "requested",
  "paid",
  "assigned",
  "tracked",
  "delivered",
  "settled",
] as const;

export const transitions: Readonly<Record<DeliveryState, readonly DeliveryState[]>> = {
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
};

export const authorization: Readonly<Record<Actor, readonly Capability[]>> = {
  customer: ["request", "address", "pay", "code"],
  system: ["classify", "collect", "discover", "select", "charge", "validate", "route", "settle"],
  courier: ["accept", "locate", "deliver"],
  payment: ["confirm", "reject"],
};

export function allowed(actor: Actor, capability: Capability): boolean {
  return authorization[actor].includes(capability);
}

export function transition(from: DeliveryState, to: DeliveryState): DeliveryState {
  if (!transitions[from].includes(to)) {
    throw new Error("T-DD-DSL_ILLEGAL_TRANSITION");
  }
  return to;
}

export function validateRequest(request: DeliveryRequest): void {
  if (!request.pickup || !request.dropoff) {
    throw new Error("T-DD-DSL_REQUIRED_INPUT");
  }
  if (request.pickup === request.dropoff) {
    throw new Error("T-DD-DSL_PICKUP_EQUALS_DROPOFF");
  }
}

export function assertCanRelease(paymentConfirmed: boolean): void {
  if (!paymentConfirmed) {
    throw new Error("T-DD-DSL_RELEASE_BEFORE_PAYMENT");
  }
}

export function assertCanSettle(codeValid: boolean, atDropoff: boolean): void {
  if (!codeValid) {
    throw new Error("T-DD-DSL_INVALID_CODE");
  }
  if (!atDropoff) {
    throw new Error("T-DD-DSL_NOT_AT_DROPOFF");
  }
}

export function selectNearest<T extends { readonly available: boolean; readonly distance: number }>(
  couriers: readonly T[],
): T {
  const available = couriers.filter((courier) => courier.available);
  if (available.length === 0) {
    throw new Error("T-DD-DSL_NO_AVAILABLE_COURIER");
  }
  return available.reduce((nearest, courier) =>
    courier.distance < nearest.distance ? courier : nearest,
  );
}

export function validateEvidenceOrder(evidence: readonly Evidence[]): void {
  const order: EvidenceType[] = [
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
  ];

  let previous = -1;
  for (const item of evidence) {
    const current = order.indexOf(item.type);
    if (current < 0) {
      throw new Error("T-DD-DSL_UNDECLARED_EVIDENCE");
    }
    if (current < previous) {
      throw new Error("T-DD-DSL_EVIDENCE_ORDER");
    }
    previous = current;
  }
}

export function conforms(evidence: readonly Evidence[]): boolean {
  try {
    validateEvidenceOrder(evidence);
    return evidence.some((x) => x.type === "request.received")
      && evidence.some((x) => x.type === "payment.confirmed")
      && evidence.some((x) => x.type === "settlement.completed");
  } catch {
    return false;
  }
}
