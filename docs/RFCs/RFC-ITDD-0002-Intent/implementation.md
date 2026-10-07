# Implementation — RFC-ITDD-0002

The DSL uses `I:` for Intent and `R:` for required semantic information.

Example:

```
I: customer → deliver
R: pickup + dropoff
```

The compiler MUST resolve the actor and goal as semantic identifiers and retain required information separately.

An implementation MAY use an LLM, classifier, parser or deterministic matcher for recognition, but the recognized result MUST conform to the declared Intent domain.

External input MUST be validated before entering the semantic core.

Relevant implementation:
- [DSL README](../../DSL/README.md)
- [Compiler](../../DSL/compiler.mjs)
- [Intent Skill](../../skills/Intent-SKILL.md)
