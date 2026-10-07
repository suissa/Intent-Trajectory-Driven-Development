# Implementation — RFC-ITDD-0001

The Destiny stage is represented in the DSL by the `D:` declaration.

Example:

```
D: delivery → requested paid assigned tracked delivered settled
```

The compiler MUST parse Destiny into an ordered semantic milestone collection without converting it into imperative execution.

The generated TypeScript/Python projections MUST preserve the milestone identities and ordering.

Validation MUST reject an empty Destiny, unresolved identifiers, and malformed milestone declarations.

Relevant implementation:
- [DSL README](../../DSL/README.md)
- [Compiler](../../DSL/compiler.mjs)
- [TypeScript projection Skill](../../DSL/2typescript/SKILL.md)
- [Python projection Skill](../../DSL/2python/SKILL.md)
