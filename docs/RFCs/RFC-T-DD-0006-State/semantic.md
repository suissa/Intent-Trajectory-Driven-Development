# RFC-ITDD-0006 — State Semantic Model

## Status
Normative.

State defines the legal temporal progression of a semantic process.

A state represents conditions currently true. A transition represents a permitted change between states.

The state graph MUST explicitly define legal transitions. Undeclared transitions are invalid.

Example:

```
S: requested → collecting → searching → assigned
  → awaiting_payment → paid → active → arriving
  → delivered → settled
```

A transition MAY fail into a declared failure state when the model permits it.

State is not equivalent to a database column; persistence is one possible implementation.
