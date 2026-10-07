# Implementation — RFC-T-DD-0011

The current compiler is [docs/DSL/compiler.mjs](../../DSL/compiler.mjs), with tests in [compiler.test.mjs](../../DSL/compiler.test.mjs).

It MUST parse declarations, normalize structures, resolve references, validate states, actors, capabilities, evidence and constraints, expose a stable intermediate representation, reject invalid semantics and support deterministic generation.

CI exercises target generation through [TypeScript workflow](../../.github/workflows/itdsl-typescript.yml) and [Python workflow](../../.github/workflows/itdsl-python.yml).