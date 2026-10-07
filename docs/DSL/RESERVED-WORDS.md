# Intent Trajectory DSL — Reserved Words

Reserved words are part of the language contract. Implementations must not reinterpret them as ordinary identifiers.

## 1. Core declarations

| Token | Meaning |
|---|---|
| `D` | destiny |
| `I` | intent |
| `R` | required semantic information |
| `B` | behavior |
| `S` | state |
| `A` | actor/capability authorization |
| `K` | skill |
| `E` | evidence |
| `X` | constraint / forbidden scenario |
| `T` | trajectory |

A parser may support long aliases, but they must normalize to the same AST category.

## 2. Qualifiers

Reserved qualifiers:

`in`, `out`, `rule`, `emit`, `pre`, `post`, `when`, `from`, `to`, `requires`, `ensures`, `allows`, `forbids`.

Example:

``text
K select_nearest {
  in: couriers + origin
  rule: min(distance(courier, origin))
  out: courier
  emit: courier.selected
}
``

## 3. Selection/cardinality words

`min`, `max`, `one`, `all`, `any`, `none`, `some`.

Example:

``text
rule: min(distance(courier, origin))
``

means choose a value satisfying the minimum-distance rule.

## 4. Logical aliases

Reserved words:

`true`, `false`, `and`, `or`, `not`.

Canonical symbolic forms:

`∧`, `∨`, `¬`.

Word forms are optional ASCII aliases and must normalize to symbolic operators.

## 5. Semantic category words

`destiny`, `intent`, `behavior`, `state`, `actor`, `skill`, `evidence`, `trajectory`, `constraint`.

They identify semantic categories and should not be used as ordinary identifiers without an explicit escaping mechanism.

## 6. Annotations

`@delivery` is an annotation. `delivery` is its value.

Core annotations must have defined semantics.

Extensions should be namespaced:

``text
@ext.name
``

An extension must not silently alter core semantics.

## 7. Identifier grammar

Canonical identifiers:

``text
[a-z][a-z0-9_]*
``

Valid:

``text
delivery
delivery_request
courier2
dropoff
``

Invalid under the canonical grammar:

``text
2courier
delivery-request
Delivery
``

## 8. Qualified identifiers

Dots create semantic qualification:

``text
payment.confirmed
location.received
courier.selected
``

The namespace must be declared or derivable from a declared semantic artifact.

## 9. Name resolution invariants

1. Every referenced semantic name must resolve.
2. Reserved words cannot be shadowed.
3. A symbol cannot be redefined by an extension.
4. Duplicate canonical identities are invalid unless the grammar explicitly defines declaration merging.
5. Unknown declarations must fail rather than being ignored.

## 10. Invalid examples

``text
D: delivery → unknown_state
``

is invalid if the state is not declared or inferable.

``text
A:
  customer { invent_money }
``

is invalid if no corresponding capability/skill exists.

``text
K select {
  rule: min
}
``

is invalid because `min` lacks its operand.

## 11. Canonicalization

Implementations may accept ASCII aliases but must serialize one canonical representation.

Example:

``text
request -> collect
``

normalizes to:

``text
request → collect
``

This makes formatting deterministic and keeps semantic comparison independent of source spelling.
