# RFC-T-DD-0001 — Destiny Semantic Model

## Status
Normative.

## Purpose
Define the business destination that an T-DD specification must achieve.

## Semantics

A Destiny is the terminal business outcome of a trajectory. It is independent of transport, framework, database, agent, API or UI.

A Destiny MUST define:
1. a stable identity;
2. the business outcome;
3. terminal milestones;
4. completion conditions;
5. evidence sufficient to establish completion.

A Destiny MUST NOT be defined as a technical artifact such as "create an API".

The same Destiny MAY be reached by multiple trajectories.

## Formal relation

`trajectory ⊨ destiny` iff the terminal trajectory state satisfies every mandatory Destiny milestone and completion condition.

## Example

```
D: delivery → requested paid assigned tracked delivered settled
```

The declaration means that a delivery is not complete merely because a request exists; every mandatory terminal milestone must be satisfied.

## Invariants

- Destiny semantics MUST remain stable when implementation technology changes.
- A later refinement MUST NOT contradict a mandatory Destiny condition.
- Completion MUST be observable.
