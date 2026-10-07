# Implementation — RFC-ITDD-0007

The DSL uses `A:` with actor capability sets.

The compiler MUST produce a normalized actor-to-capability relation.

Runtime authorization MUST evaluate the relation explicitly.

A transport identity, token, session or agent identity MAY be mapped to a semantic Actor, but the mapping MUST occur before capability execution.

Unknown actors and undeclared capabilities MUST fail closed.
