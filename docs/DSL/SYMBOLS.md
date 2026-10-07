# Trajectory-Driven DSL — Symbols

This document is normative. Every operator must have one defined semantic meaning in each grammatical context.

## 1. Operator table

| Symbol | Meaning | Context |
|---|---|---|
| `→` | ordered semantic succession | behavior, state, evidence, trajectory |
| `+` | all listed requirements are required | required information |
| `∧` | Boolean conjunction | constraints |
| `¬` | Boolean negation / prohibition | constraints |
| `=` | equality or binding | predicates, declarations |
| `≠` | inequality | predicates |
| `*` | zero or more occurrences | repeated skills/evidence |
| `∈` | membership | sets/authorization |
| `∉` | non-membership | sets/authorization |
| `⊨` | satisfies / conforms to | semantic conformance |
| `:` | declaration separator | sections |
| `.` | namespace/member qualification | evidence, members |
| `()` | parameterization/grouping | predicates and skills |
| `{}` | capability grouping | actor declarations |

## 2. `→` succession

`A → B` means B is semantically subsequent to A.

Example:

``text
requested → collecting → searching
``

It does not imply synchronous execution, HTTP, a function call, or a specific latency.

In a trajectory:

``text
customer.request → system.collect
``

the arrow expresses ordered semantic participation.

Invalid interpretation:

``text
request → HTTP POST
``

when HTTP is merely an implementation mechanism.

## 3. `+` required composition

`pickup + dropoff` means both are required.

``text
R: pickup + dropoff
``

A request containing only pickup is incomplete.

In `R`, `+` is not arithmetic.

## 4. `∧` logical conjunction

`A ∧ B` is true only when both propositions are true.

``text
payment = confirmed ∧ location = dropoff
``

Both predicates are mandatory.

`∧` is logical, not temporal.

## 5. `¬` negation

`¬P` means P must not hold in the constrained scope.

Example:

``text
¬ release(payment ≠ confirmed)
``

The semantic condition represented by release-before-confirmation is forbidden.

A forbidden scenario is a correctness violation, not merely a user-facing error.

## 6. `=` equality and binding

Equality:

``text
payment = confirmed
``

Binding:

``text
amount = customer.amount
``

The parser must determine which semantic context applies.

## 7. `≠` inequality

`A ≠ B` requires different values.

``text
pickup ≠ dropoff
``

This is a value constraint.

## 8. `*` repetition

`X*` means zero or more X occurrences.

Examples:

``text
courier*
location.received*
track*
``

Thus `track*` permits zero, one, or many occurrences.

It does not mean optional execution, asynchronous execution, or eventual execution.

If one-or-more is required, an explicit cardinality form must be used, for example:

``text
location.received{1..*}
``

## 9. `∈` and `∉` membership

`courier ∈ available` means courier belongs to the declared available set.

`courier ∉ available` means it does not.

Example:

``text
¬ select(courier ∉ available)
``

selecting an unavailable courier is forbidden.

## 10. `⊨` satisfaction

`A ⊨ B` means A satisfies B.

Examples:

``text
implementation ⊨ trajectory
trajectory ⊨ behavior
behavior ⊨ intent
intent ⊨ destiny
``

The relation is not equality, inheritance, execution, or implication.

A useful semantic definition is:

`A ⊨ B iff every mandatory property of B holds in A and no forbidden property of B is violated by A.`

## 11. Precedence

Strongest to weakest:

1. grouping `()`;
2. postfix cardinality `*`;
3. equality/membership `= ≠ ∈ ∉`;
4. negation `¬`;
5. conjunction `∧` and requirement composition `+`;
6. succession `→`;
7. conformance `⊨`.

Parentheses are preferred when a reader could otherwise infer the wrong grouping.

Preferred:

``text
¬(payment = confirmed ∧ location = dropoff)
``

## 12. Context restrictions

- `→` requires semantic elements compatible with the enclosing relation.
- `*` is postfix and only applies to repeatable elements.
- `¬` requires a proposition or predicate.
- `∧` requires Boolean propositions.
- `⊨` requires compatible semantic artifacts.
- `∈` and `∉` require a declared set/domain.
- `+` in `R` means conjunction of requirements.
- Symbols must retain the same semantics across language projections.

## 13. Invalid examples

Invalid:

``text
requested ⊨ collecting
``

because these are states in a succession relation.

Invalid:

``text
R: pickup + 1
``

because `+` in `R` combines requirements, not numbers.

Invalid:

``text
X: ¬ release
``

if `release` is not a proposition/predicate in that scope.

Invalid:

``text
courier ∈ available
``

when no available set exists.

## 14. Canonical representation

ASCII aliases may be accepted by tooling:

`and` → `∧`
`not` → `¬`
`!=` → `≠`
`->` → `→`

The normalized AST must be identical regardless of accepted alias syntax.

Canonical serialization must use the symbolic forms.
