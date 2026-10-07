# Implementation — RFC-T-DD-0008

The current DSL represents skill declarations through semantic capability definitions and the repository's Atomic Skill documentation.

An implementation SHOULD expose a typed input/output boundary and explicit evidence emission.

The [Atomic Skills](../../skills/atomic) are the procedural agent-facing projection of the semantic stages.

A runtime Skill MAY be implemented as a function, class, agent tool, workflow node or service, provided its behavior conforms to the declared semantic contract.

Skill composition MUST preserve actor authorization, state legality and evidence obligations.
