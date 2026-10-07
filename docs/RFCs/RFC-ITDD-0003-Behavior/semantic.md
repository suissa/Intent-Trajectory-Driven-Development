# RFC-ITDD-0003 — Behavior Semantic Model

## Status
Normative.

Behavior defines the semantic actions required to transform a recognized Intent toward its Destiny.

A Behavior MUST:
- have an explicit semantic identity;
- contain ordered or explicitly composable actions;
- identify required inputs;
- preserve preconditions and postconditions;
- remain independent of implementation technology.

Behavior is not source code. It is a semantic operation model.

Example:

```
B: request → collect → discover(courier*) → select(min distance)
  → charge → confirm → release → track* → validate(code) → settle
```

The behavior relation MUST be compatible with Intent and Destiny.

An implementation MUST NOT remove a mandatory behavior step merely because its technical equivalent is inconvenient.
