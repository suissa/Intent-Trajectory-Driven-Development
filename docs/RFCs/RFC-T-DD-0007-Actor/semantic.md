# RFC-ITDD-0007 — Actor Semantic Model

## Status
Normative.

An Actor is a semantic participant authorized to perform declared capabilities.

Actor identity is distinct from authentication mechanism. The RFC defines semantic authority, not a particular identity provider.

An authorization declaration MUST explicitly bind capabilities to actors.

An implementation MUST reject a capability execution when the actor is not authorized.

Example:

```
A:
  customer { request address pay code }
  system   { classify collect discover select charge validate route settle }
  courier  { accept locate deliver }
  payment  { confirm reject }
```

Authorization MUST NOT be inferred from naming conventions.
