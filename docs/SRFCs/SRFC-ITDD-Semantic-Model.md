# SRFC — Intent Trajectory Driven Development Semantic Model

This SRFC defines the semantic source used to derive the ITDD Skills.

Source: [Intent-Trajectory-Driven-Development README](../../README.md).

## Semantic chain

```
DESTINY → INTENT → BEHAVIOR → EVIDENCE → CONTRACT → STATE → ACTOR → SKILL → TRAJECTORY → DSL → EXECUTION
```

Each stage adds constraints without redefining the meaning established by the previous stage.

## Normative rules

- Destiny/Destination MUST define the business outcome before technology.
- Intent MUST describe the semantic request independently of execution readiness.
- Behavior MUST describe what happens without coupling to a framework or transport.
- Evidence MUST define how behavior can be proven.
- Contract MUST define inputs, outputs, invariants and permitted failures.
- State MUST define legal states and transitions.
- Actor MUST define capability authority.
- Skill MUST represent a reusable executable semantic capability.
- Trajectory MUST preserve the ordered realization of the behavior.
- DSL MUST compress established semantics rather than inventing new meaning.
- Execution MUST be a projection of the semantic model.

## Core invariant

```
implementation ⊨ trajectory ⊨ behavior ⊨ intent ⊨ destiny
```

## Derived Atomic Skills

- [Destination](../../skills/atomic/define-destination-SKILL.md)
- [Intent](../../skills/atomic/recognize-intent-SKILL.md)
- [Behavior](../../skills/atomic/define-behavior-SKILL.md)
- [Evidence](../../skills/atomic/define-evidence-SKILL.md)
- [Contract](../../skills/atomic/define-contract-SKILL.md)
- [State](../../skills/atomic/define-state-SKILL.md)
- [Actor](../../skills/atomic/bind-actor-SKILL.md)
- [Skill](../../skills/atomic/define-skill-SKILL.md)
- [Trajectory](../../skills/atomic/define-trajectory-SKILL.md)
- [DSL](../../skills/atomic/compile-dsl-SKILL.md)
