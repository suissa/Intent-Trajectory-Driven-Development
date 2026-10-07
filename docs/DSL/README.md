# Intent Trajectory DSL

## 1. Purpose

The Intent Trajectory DSL (ITDSL) is the declarative notation of Intent Trajectory Driven Development (ITDD).

It describes, with progressively precise semantics:

- destiny;
- intent;
- required information;
- behavior;
- state;
- actors and authorization;
- skills;
- evidence;
- constraints and forbidden scenarios;
- trajectory;
- implementation conformance.

The DSL is a specification language, not an implementation language. It does not prescribe TypeScript, Python, HTTP, databases, queues, frameworks, agents, or control-flow algorithms.

The central judgment is:

`implementation ⊨ trajectory ⊨ behavior ⊨ intent ⊨ destiny`

The implementation must satisfy the declared semantics. It must not redefine the declaration to fit its own behavior.

## 2. Specification order

The semantic refinement order is:

`DESTINY → INTENT → REQUIRED → BEHAVIOR → STATE → ACTOR → SKILL → EVIDENCE → CONSTRAINT → TRAJECTORY → DSL → IMPLEMENTATION`

Each layer adds specificity. A later layer may constrain an earlier layer, but must not contradict an earlier mandatory commitment.

The order answers:

- DESTINY: why;
- INTENT: what is requested;
- REQUIRED: what must be known;
- BEHAVIOR: what must happen;
- STATE: where the trajectory is;
- ACTOR: who may act;
- SKILL: which capability establishes a semantic change;
- EVIDENCE: what proves it;
- CONSTRAINT: what must or must not be true;
- TRAJECTORY: how the facts relate through time;
- DSL: how all of this is written compactly;
- IMPLEMENTATION: how a concrete program realizes it.

## 3. Minimal complete example

``text
@delivery

D: delivery → requested paid assigned tracked delivered settled
I: customer → deliver
R: pickup + dropoff

B: request
→ collect
→ discover(courier*)
→ select(min distance)
→ charge
→ confirm
→ release
→ track*
→ validate(code)
→ settle

S: requested
→ collecting
→ searching
→ assigned
→ awaiting_payment
→ paid
→ active
→ arriving
→ delivered
→ settled

A:
  customer { request address pay code }
  system   { classify collect discover select charge validate route settle }
  courier  { accept locate deliver }
  payment  { confirm reject }

E: request.received
→ intent.recognized
→ addresses.collected
→ courier.selected
→ payment.confirmed
→ delivery.released
→ location.received*
→ location.forwarded*
→ code.validated
→ settlement.completed

X:
  ¬ release(payment ≠ confirmed)
  ¬ settle(code ≠ valid)
  ¬ settle(location ≠ dropoff)
  ¬ select(courier ∉ available)
``

## 4. Lexical model

The language contains declarations, identifiers, operators, grouping, qualifiers, and annotations.

``text
D:       declaration
delivery identifier
→        operator
pickup + dropoff   composition
select(min distance) parameterized semantic operation
customer { ... }   capability set
@delivery          annotation
``

Whitespace is insignificant except for token separation. Identifiers are case-sensitive. Reserved words and canonical aliases are defined in RESERVED-WORDS.md.

## 5. Semantics must precede syntax

The language is designed so that a reader can understand every symbol before seeing the complete DSL.

The core operators are:

`→` succession;
`+` required composition;
`∧` logical conjunction;
`¬` logical negation;
`=` equality/binding;
`≠` inequality;
`*` zero-or-more repetition;
`∈` membership;
`∉` non-membership;
`⊨` satisfaction/conformance.

Their normative definitions are in SYMBOLS.md.

## 6. Static validity

Parsing only proves structural validity. Semantic validation must additionally prove that:

- names resolve;
- states exist;
- actors exist;
- capabilities are authorized;
- skills reference valid inputs and outputs;
- evidence is declared;
- constraints are meaningful;
- transitions are legal;
- cardinalities are valid;
- the specification is internally consistent;
- at least one conforming trajectory is possible.

A DSL can therefore be syntactically valid but semantically invalid.

## 7. Runtime conformance

Runtime conformance evaluates observed evidence against the declared trajectory.

The validator must be able to answer:

``text
who acted?
what happened?
in which state?
through which skill?
with which evidence?
under which constraints?
what state followed?
``

The trajectory is the semantic history. Logs are only one possible physical source of evidence.

## 8. Canonical pipeline

``text
source
→ parse
→ AST
→ resolve
→ validate
→ normalize
→ project
→ execute
→ observe
→ compare
→ conformance
``

The parser must not execute business behavior.

The validator must not silently repair semantic contradictions.

The projection must not introduce domain semantics that are absent from the DSL.

## 9. Language independence

The same DSL is projected into TypeScript and Python.

The projection rule is:

`meaning(DSL) = meaning(TypeScript) = meaning(Python)`

Syntax may differ because each language has different type and runtime mechanisms. Semantic obligations may not differ.

See:

- 2typescript/SKILL.md
- 2python/SKILL.md

## 10. Design invariant

The shortest DSL is preferred only after the semantics are complete.

Compression must remove syntactic noise, never semantic information.

The fundamental development loop is:

`DESTINY → INTENT → BEHAVIOR → EVIDENCE → CONTRACT → STATE → ACTOR → SKILL → TRAJECTORY → DSL → IMPLEMENT → EXECUTE → OBSERVE → COMPARE ↺`
