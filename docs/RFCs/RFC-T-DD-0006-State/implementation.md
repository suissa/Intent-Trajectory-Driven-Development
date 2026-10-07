# Implementation — RFC-T-DD-0006

The DSL uses `S:` for state progression.

The compiler MUST construct a finite transition relation from the declaration.

Generated implementations MUST reject arbitrary state strings and undeclared edges.

A state transition that depends on evidence MUST establish that evidence before exposing the new state.

Concurrent operations MUST preserve the same transition relation using transactionality, compare-and-set, serialization, idempotency or an equivalent mechanism.

Relevant generated examples exist under [TypeScript generated output](../DSL/2typescript/generated) and [Python generated output](../DSL/python/generated).
