# RFC-T-DD-0005 — Contract Semantic Model

## Status
Normative.

Contracts make semantic boundaries exact.

A Contract MUST define, where applicable:
- inputs;
- outputs;
- preconditions;
- postconditions;
- invariants;
- allowed failures;
- forbidden conditions.

Contracts MUST reduce ambiguity without changing the meaning established by Intent and Behavior.

A contract violation is a semantic failure, not an optional warning.

Example:

```
payment = confirmed ∧ location = dropoff
```

A later implementation layer MUST NOT weaken a mandatory invariant.
