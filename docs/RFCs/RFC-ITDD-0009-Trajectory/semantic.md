# RFC-ITDD-0009 — Trajectory Semantic Model

## Status
Normative.

A Trajectory is the ordered semantic history through which an Intent is realized toward a Destiny.

It is not merely a list of logs and not merely the final state.

A Trajectory MUST preserve, in semantic order:
- actor actions;
- relevant state transitions;
- evidence;
- skill/capability execution;
- causal dependencies required to explain the journey.

A trajectory MAY contain repeated observations and intermediate states.

Conformance requires:

`observed trajectory ⊨ declared trajectory`

The central ITDD loop is:

`declared intent → expected trajectory → observed trajectory → conformance`
