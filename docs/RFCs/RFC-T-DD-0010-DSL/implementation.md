# Implementation — RFC-ITDD-0010

Normative language artifacts:
- [DSL README](../../DSL/README.md)
- [Symbols](../../DSL/SYMBOLS.md)
- [Reserved Words](../../DSL/RESERVED-WORDS.md)
- [Logic](../../DSL/LOGICS.md)

Compiler: [compiler.mjs](../../DSL/compiler.mjs). Tests: [compiler.test.mjs](../../DSL/compiler.test.mjs).

The compiler MUST fail closed on syntax errors and semantic resolution failures. Target profiles are documented by the [TypeScript](../../DSL/2typescript/SKILL.md) and [Python](../../DSL/2python/SKILL.md) Skills.