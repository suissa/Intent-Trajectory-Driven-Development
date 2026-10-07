# RFC-T-DD-0004 — Evidence Semantic Model

## Status
Normative.

Evidence is an observable fact proving that a semantic event, behavior or transition occurred.

Evidence MUST describe an observable semantic fact, not merely an arbitrary log line.

Evidence MAY repeat when the declaration uses `*`.

Evidence MUST be sufficient to prove mandatory behavior and terminal completion.

Example:

```
E: request.received → intent.recognized → addresses.collected
  → courier.selected → payment.confirmed → delivery.released
  → location.received* → location.forwarded* → code.validated
  → settlement.completed
```

An implementation MUST emit evidence before exposing a state that depends on that evidence.

Evidence identifiers MUST remain stable across implementation languages.
