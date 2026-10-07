# ITDD Semantic RFCs

These Semantic RFCs specify the semantic and technical model of Intent Trajectory Driven Development.

The normative semantic source of each RFC is `semantic.md`. The corresponding `implementation.md` defines how the semantic contract is realized by this repository.

## RFC map

| RFC | Scope |
|---|---|
| RFC-ITDD-0001 | Destiny |
| RFC-ITDD-0002 | Intent |
| RFC-ITDD-0003 | Behavior |
| RFC-ITDD-0004 | Evidence |
| RFC-ITDD-0005 | Contract |
| RFC-ITDD-0006 | State |
| RFC-ITDD-0007 | Actor |
| RFC-ITDD-0008 | Skill |
| RFC-ITDD-0009 | Trajectory |
| RFC-ITDD-0010 | Intent Trajectory DSL |
| RFC-ITDD-0011 | Compiler and semantic validation |
| RFC-ITDD-0012 | Language projections and conformance |

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
