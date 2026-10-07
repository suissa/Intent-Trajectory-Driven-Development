# Atomic Skill — Define Trajectory

## Purpose
Define the ordered temporal realization of an Intent toward a Destination.

## When
Use after Behavior, Evidence, Contract, State, Actor and Skills are sufficiently defined.

## Procedure
1. Order semantic capabilities.
2. Bind each step to actor and state.
3. Attach expected evidence.
4. Define allowed repetition and failure transitions.
5. Preserve the original Intent and Destination.

## Output
A declared Trajectory.

## Invariant
implementation ⊨ trajectory ⊨ behavior ⊨ intent ⊨ destiny.

## Source
[T-DD semantic SRFC](../../docs/SRFCs/SRFC-T-DD-Semantic-Model.md)
