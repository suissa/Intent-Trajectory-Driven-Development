# RFC-T-DD-0012 — Projections and Conformance

## Status
Normative.

A language projection maps normalized T-DD-DSL semantics to an implementation language without changing meaning.

For specification P and implementation Y:

`Y ⊨ P`

A projection MUST preserve finite domains, transitions, actor authorization, evidence identities, repetition, invariants and forbidden scenarios. It MUST NOT widen finite semantic domains into arbitrary target-language values.

Generated source being syntactically valid does not prove semantic conformance.

Conformance tests MUST include valid, invalid, boundary and forbidden scenarios.