# Implementation — RFC-ITDD-0005

Contract semantics are currently expressed through DSL constraints and skill declarations.

The implementation MUST validate external inputs at boundaries and enforce invariants at the semantic core.

Forbidden scenarios MUST fail closed.

Equivalent implementations MAY differ in algorithm, storage and transport, but MUST expose the same semantic input/output and invariant behavior.

Contract violations MUST have stable machine-readable identities so generated tests and conformance tooling can detect them.
