# Implementation — RFC-ITDD-0004

The DSL uses `E:` for evidence.

The compiler MUST build a typed evidence domain and preserve repetition qualifiers.

Generated projections MUST reject undeclared evidence kinds.

Runtime evidence SHOULD contain at least:
- semantic kind;
- occurrence time;
- correlation/trajectory identity;
- relevant validated facts.

For repeated evidence, projections MUST support zero or multiple observations.

Evidence is the basis for conformance checking and MUST NOT be replaced by unstructured logging.
