# Atomic Skill — Recognize Intent

## Purpose
Map an incoming expression to an existing semantic Intent.

## When
Use when a request enters the system.

## Input
Actor, message/event and context.

## Procedure
1. Identify actor.
2. Identify goal.
3. Identify required semantic information.
4. Keep missing execution data separate from Intent recognition.
5. Reject unknown or ambiguous meanings explicitly.

## Output
A semantic Intent.

## Invariant
Intent recognition MUST NOT be replaced by an implementation route or database operation.

## Source
[ITDD semantic SRFC](../../docs/SRFCs/SRFC-ITDD-Semantic-Model.md)
