# SRFC — ITDD Skill Model

The ITDD Skill system separates semantic capabilities from orchestration.

An Atomic Skill performs one semantic responsibility. A higher-level Skill teaches the Agent when and how to compose those capabilities.

## Skill hierarchy

```
SKILL.md
  ├── Intent-SKILL.md
  ├── Trajectory-SKILL.md
  └── Destination-SKILL.md
        ↓
Atomic Skills
        ↓
DSL / implementation
```

The final entrypoint intentionally exposes only the semantic triad:

```text
[Intent](Intent-SKILL.md) -> [Trajectory](Trajectory-SKILL.md) -> [Destination](Destination-SKILL.md)
```

The three Skills then reference the Atomic Skills they need.

## Selection

Use Destination when the business outcome is unknown or changing.

Use Intent when the destination is known and the Agent must identify what the requester means.

Use Trajectory when the Agent must plan, execute or verify the ordered realization of an Intent toward a Destination.

## Traceability

Every Atomic Skill must link to:

1. the SRFC semantic source;
2. the originating ITDD stage;
3. the expected inputs/outputs;
4. the invariants;
5. the evidence produced;
6. the next semantic stage.
