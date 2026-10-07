# Trajectory Skill

The Trajectory Skill teaches the Agent how to compose and execute the Atomic Skills that transform a Destination into a verifiable implementation trajectory.

## Source

- [ITDD README](../README.md)
- [ITDD semantic SRFC](../docs/SRFCs/SRFC-ITDD-Semantic-Model.md)
- [ITDD Skill SRFC](../docs/SRFCs/SRFC-ITDD-Skill-Model.md)

## Atomic Skill sequence

Use the smallest applicable set. The normal derivation is:

1. [Define Destination](atomic/define-destination-SKILL.md) — establish the business outcome.
2. [Recognize Intent](atomic/recognize-intent-SKILL.md) — identify what is being requested.
3. [Define Behavior](atomic/define-behavior-SKILL.md) — describe what must happen.
4. [Define Evidence](atomic/define-evidence-SKILL.md) — define how success is proven.
5. [Define Contract](atomic/define-contract-SKILL.md) — remove semantic ambiguity.
6. [Define State](atomic/define-state-SKILL.md) — constrain legal temporal progression.
7. [Bind Actor](atomic/bind-actor-SKILL.md) — constrain authority.
8. [Define Skill](atomic/define-skill-SKILL.md) — create reusable capabilities.
9. [Define Trajectory](atomic/define-trajectory-SKILL.md) — order capabilities through time.
10. [Compile DSL](atomic/compile-dsl-SKILL.md) — compress the established semantics.

## How to use them

The Agent MUST NOT skip backwards in semantic authority. Later stages refine earlier stages.

For each Atomic Skill:

- read its source and inputs;
- execute only when its trigger applies;
- preserve its invariants;
- emit its declared output/evidence;
- pass the result to the next applicable Atomic Skill.

## Verification loop

```
declared Destination
  ↓
Intent
  ↓
Trajectory
  ↓
execution
  ↓
observed evidence
  ↓
compare with declared Trajectory
```

If observed behavior contradicts the declared Trajectory, repair the implementation or trajectory conformance rather than silently changing the original meaning.
