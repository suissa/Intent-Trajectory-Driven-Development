# RFC-T-DD-0002 — Intent Semantic Model

## Status
Normative.

## Purpose
Define the semantic request entering an T-DD system.

An Intent represents what an actor wants to accomplish. It is not execution.

## Semantics

An Intent MUST identify:
- actor;
- goal;
- semantic domain;
- minimum information required to understand the request.

Intent recognition MUST be separable from execution readiness. Missing information MAY require collection without invalidating a recognized Intent.

Intent MUST preserve the business meaning expressed by the actor.

## Formal relation

`intent ⊨ destiny` iff the goal is compatible with the declared Destiny.

## Example

```
I: customer → deliver
R: pickup + dropoff
```

## Invariants

- Recognition MUST NOT invent unsupported goals.
- Missing execution data MUST NOT be silently fabricated.
- An implementation MUST NOT reinterpret Intent to fit an available API.
