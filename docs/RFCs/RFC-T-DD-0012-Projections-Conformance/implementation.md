# Implementation — RFC-ITDD-0012

Current target profiles:
- [TypeScript Skill](../../DSL/2typescript/SKILL.md)
- [Python Skill](../../DSL/2python/SKILL.md)
- [TypeScript generated output](../../DSL/2typescript/generated)
- [Python generated output](../../DSL/python/generated)

CI MUST verify compilation, generation, generated tests, runtime execution and deterministic regeneration.

A failed projection is a generator/conformance failure, not a reason to weaken the semantic source.

Final judgment:

`runtime_behavior ⊨ DSL`
