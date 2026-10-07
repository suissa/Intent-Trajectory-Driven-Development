# Implementation — RFC-ITDD-0003

The DSL uses `B:` for Behavior.

The compiler MUST preserve behavior order and parameter expressions.

The `→` operator denotes semantic succession. Implementations MUST NOT treat it as arbitrary code sequencing when dependencies do not exist; it represents the declared behavioral relation.

Parameterized operations such as `select(min distance)` MUST preserve their semantic rule in generated metadata and validation.

The runtime MAY implement operations asynchronously, but observable behavior MUST remain conformant to the declared relation.
