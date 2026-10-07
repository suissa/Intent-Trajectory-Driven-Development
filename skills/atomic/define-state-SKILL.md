# Atomic Skill — Define State

## Purpose
Make temporal correctness explicit.

## When
Use when Behavior has ordered stages or legal transitions.

## Procedure
1. Enumerate valid states.
2. Define legal transitions.
3. Attach conditions/evidence to transitions.
4. Define failure paths.

## Output
A state machine.

## Invariant
An implementation MUST NOT execute a transition that is not semantically legal.

## Source
[ITDD semantic SRFC](../../docs/SRFCs/SRFC-ITDD-Semantic-Model.md)
