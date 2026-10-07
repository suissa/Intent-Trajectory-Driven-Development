# RFC-T-DD-0010 — Trajectory-Driven DSL Semantic Model

## Status
Normative.

T-DD-DSL is the declarative notation for the T-DD semantic model.

The DSL MUST represent, directly or through defined projection, Destiny, Intent, Required information, Behavior, State, Actor, Skill, Evidence, Constraint and Trajectory semantics.

The DSL is a specification language, not an implementation language.

Core operators have fixed meanings:
- `→` succession;
- `+` required composition;
- `∧` conjunction;
- `¬` negation;
- `=` equality/binding;
- `≠` inequality;
- `*` repetition;
- `∈` membership;
- `∉` non-membership;
- `⊨` conformance.

Parsing MUST be separated from semantic validation.

A valid source MUST be deterministic to parse and semantically resolvable.
