# RFC-T-DD-0011 — Compiler and Semantic Validation

## Status
Normative.

Compilation is conceptually:

`source → parse → normalize → resolve → validate → project`

Parsing establishes syntax; normalization establishes a stable representation; resolution establishes symbol identity; validation establishes semantic correctness; projection produces target artifacts.

The compiler MUST NOT silently repair contradictory semantics.

Generation MUST fail closed. Partial or widened output is not successful compilation.

Equivalent source MUST produce deterministic normalized output.