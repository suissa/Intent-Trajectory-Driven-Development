# RFC-T-DD-0008 — Skill Semantic Model

## Status
Normative.

A Skill is a reusable executable semantic capability.

A Skill MUST declare:
- identity;
- inputs;
- semantic rule or procedure;
- outputs;
- produced evidence;
- invariants and forbidden conditions.

A Skill MUST be independently understandable and composable.

The algorithm MAY vary when the semantic result and constraints remain equivalent.

Example:

```
K select_nearest {
  in: couriers + origin
  rule: min(distance(courier, origin))
  out: courier
  emit: courier.selected
}
```

A Skill MUST NOT silently mutate unrelated semantic state.
