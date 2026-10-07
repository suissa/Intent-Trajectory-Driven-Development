# Intent Skill

The Intent Skill teaches the Agent how to turn a request into a semantic Intent without prematurely executing it.

## Source

- [ITDD README](../README.md)
- [ITDD semantic SRFC](../docs/SRFCs/SRFC-ITDD-Semantic-Model.md)
- [Recognize Intent Atomic Skill](atomic/recognize-intent-SKILL.md)

## When to use

Use when a user, event, message or external signal expresses a desired outcome.

## Procedure

1. Identify the actor.
2. Identify the desired goal.
3. Identify the minimum information needed to understand the request.
4. Separate recognized intent from missing execution data.
5. Preserve the business meaning.
6. Hand the resulting Intent to the Trajectory Skill.

Do not invent behavior merely because an implementation is available.

## Output

A semantic Intent that can be evaluated against the Destination and expanded into a Trajectory.
