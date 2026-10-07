# Intent Trajectory DSL — Logics

## 1. Logical layers

ITDSL separates structural validity, propositional constraints, temporal succession, authorization, and conformance.

They are different judgments and must not be conflated.

## 2. Structural validity

Parsing proves structure only:

`parse(source) = AST`

A parsed program may still be semantically invalid.

Example:

``text
S: requested → nonexistent
``

This is invalid if `nonexistent` cannot be resolved.

## 3. Propositional logic

Constraints evaluate Boolean propositions.

``text
payment = confirmed ∧ location = dropoff
``

requires both predicates to hold.

``text
¬(payment = rejected)
``

requires the rejected condition not to hold.

## 4. Invariants

An invariant is a proposition that must hold for every valid trajectory in its declared scope.

Example:

``text
X:
  ¬ settle(code ≠ valid)
``

If the forbidden condition becomes true at runtime, conformance fails.

## 5. Temporal succession

`A → B` means B is semantically subsequent to A.

It does not by itself mean immediate, synchronous, unique, or bounded-time execution.

Example:

``text
request.received → payment.confirmed
``

does not define a latency.

A timing extension must define its own semantics before use:

``text
within(5m, request.received → payment.confirmed)
``

## 6. State-machine logic

`S` defines legal state transitions.

``text
S:
  requested
  → collecting
  → searching
  → assigned
  → awaiting_payment
  → paid
  → active
  → arriving
  → delivered
  → settled
``

An undeclared edge is invalid.

Thus `requested → settled` is forbidden unless explicitly declared.

## 7. State invariants

A valid state graph requires:

- every referenced state exists;
- required states are reachable;
- transition endpoints exist;
- undeclared edges are rejected;
- terminal behavior is explicit;
- recovery states are explicitly declared.

## 8. Authorization logic

Actor capability is the relation:

`allow(actor, capability)`

Example:

``text
A:
  customer { request address pay code }
  system   { classify collect discover select charge validate route settle }
``

Therefore:

`allow(customer, settle)` is false.

Authorization must not be inferred from function names or module names.

## 9. Skill logic

A skill is a semantic capability with declared inputs, rule, output, and evidence.

``text
K select_nearest {
  in: couriers + origin
  rule: min(distance(courier, origin))
  out: courier
  emit: courier.selected
}
``

The implementation may change its algorithm, but it must preserve the declared rule.

## 10. Evidence logic

Evidence witnesses a semantic fact.

``text
payment.confirmed
``

is evidence of payment confirmation.

It is not automatically evidence of arrival.

Therefore:

``text
payment.confirmed ⊭ location = dropoff
``

unless another declaration establishes that implication.

## 11. Evidence ordering

If:

``text
E:
  request.received
  → intent.recognized
  → addresses.collected
  → payment.confirmed
``

is declared, observed evidence must preserve that semantic order.

Repeated evidence is valid only where its cardinality permits repetition.

## 12. Cardinality

`X*` means zero or more.

Therefore:

``text
location.received*
``

allows zero, one, or many observations.

An explicit minimum is required for one-or-more semantics:

``text
location.received{1..*}
``

assuming the cardinality extension is part of the grammar.

## 13. Conformance

The central judgment is:

`implementation ⊨ trajectory`

An observed sequence can be judged with:

`observed_trajectory ⊨ declared_trajectory`

A conforming implementation may use different frameworks, databases, algorithms, or languages. Conformance concerns semantic behavior.

## 14. Refinement

The specificity relation is:

`DESTINY ⊑ INTENT ⊑ BEHAVIOR ⊑ STATE ⊑ ACTOR ⊑ SKILL ⊑ EVIDENCE ⊑ TRAJECTORY ⊑ DSL ⊑ IMPLEMENTATION`

A refinement may add constraints and precision. It must not contradict an earlier mandatory requirement.

Invalid:

``text
D: delivery → paid → delivered
B: deliver_without_payment
``

## 15. Satisfiability

A specification is satisfiable when at least one possible trajectory conforms to it:

`Satisfiable(P) ⇔ ∃T : T ⊨ P`

If no trajectory can satisfy all mandatory constraints, static validation must reject the specification.

## 16. Contradictions

Example:

``text
S: paid → delivered
X: ¬ delivered
D: delivered
``

If delivered is mandatory, the declarations are inconsistent.

Another example:

``text
A:
  customer { settle }

K settle {
  actor: system
}
``

is inconsistent if the skill has exclusive actor binding.

## 17. Validation precedence

Recommended order:

`syntax → name resolution → shape → semantic graph → constraints → trajectory → conformance`

Root causes should be reported before cascading failures.

## 18. Invalidity classes

- syntax invalid;
- name invalid;
- semantic invalid;
- constraint invalid;
- authorization invalid;
- temporal invalid;
- state invalid;
- evidence invalid;
- conformance invalid.

Each class should preserve a stable diagnostic identity.

## 19. Determinism

The same normalized DSL must produce the same semantic model and diagnostic ordering.

Static validation must not depend on execution scheduling.

## 20. Formal core

`Valid(P) ⇔ Parse(P) ∧ Resolve(P) ∧ Consistent(P) ∧ Satisfiable(P)`

`Conforms(O,P) ⇔ Ordered(O,P) ∧ Authorized(O,P) ∧ EvidenceValid(O,P) ∧ ¬Forbidden(O,P)`

P is the DSL program and O is an observed trajectory.

This separates grammar, semantic validity, and runtime conformance, a standard distinction in DSL design. citeturn0search6turn0search1

## 22. Skill semantics

Skills are semantic transformations, not merely named functions. The required core is `in`, `rule`, `out`, and `emit`; optional preconditions, postconditions, guards, state endpoints, requirements, guarantees, authorization and forbidden conditions are compiled into the same IR. Constraint-bearing skill fields use the same Boolean grammar as `X`.
