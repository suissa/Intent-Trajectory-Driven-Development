# T-DD Semantic RFCs

These Semantic RFCs specify the semantic and technical model of Trajectory-Driven Development.

The normative semantic source of each RFC is `semantic.md`. The corresponding `implementation.md` defines how the semantic contract is realized by this repository.

## RFC map

| RFC | Scope |
|---|---|
| RFC-T-DD-0001 | Destiny |
| RFC-T-DD-0002 | Intent |
| RFC-T-DD-0003 | Behavior |
| RFC-T-DD-0004 | Evidence |
| RFC-T-DD-0005 | Contract |
| RFC-T-DD-0006 | State |
| RFC-T-DD-0007 | Actor |
| RFC-T-DD-0008 | Skill |
| RFC-T-DD-0009 | Trajectory |
| RFC-T-DD-0010 | Trajectory-Driven DSL |
| RFC-T-DD-0011 | Compiler and semantic validation |
| RFC-T-DD-0012 | Language projections and conformance |

The refinement invariant is:

`implementation ⊨ trajectory ⊨ behavior ⊨ intent ⊨ destiny`

The complete refinement chain is:

`DESTINY → INTENT → REQUIRED → BEHAVIOR → EVIDENCE → CONTRACT → STATE → ACTOR → SKILL → TRAJECTORY → DSL → IMPLEMENTATION`

## Authoritative project artifacts

- [Project README](../../README.md)
- [DSL specification](../DSL/README.md)
- [DSL symbols](../DSL/SYMBOLS.md)
- [DSL reserved words](../DSL/RESERVED-WORDS.md)
- [DSL compiler](../DSL/compiler.mjs)
- [TypeScript projection Skill](../DSL/2typescript/SKILL.md)
- [Python projection Skill](../DSL/2python/SKILL.md)
