# Intent Trajectory Driven Development

Intent Trajectory Driven Development (ITDD) is the development method I use when I start from the intent that must be fulfilled and progressively derive the behavior, evidence, contracts, state transitions, actors, skills and implementation from that intent.

I previously started with API design, schemas, routes, database models or UI. In ITDD I start with the destination of the behavior and progressively increase specificity until the same declaration can become an executable specification.

The central principle is:

```
DESTINY → INTENT → BEHAVIOR → EVIDENCE → CONTRACT → STATE → ACTOR → SKILL → TRAJECTORY → DSL → IMPLEMENTATION
```

Each stage adds constraints without changing the meaning established by the previous stage.

## A escada de especificidade

| Etapa | Define | Resultado |
|---|---|---|
| 0 · Destiny | por que existe | business outcome |
| 1 · Intent | o que deve ser entendido | semantic intent |
| 2 · Behavior | o que deve acontecer | behavior flow |
| 3 · Evidence | como provo que aconteceu | observable evidence |
| 4 · Contract | limites exatos | input/output/invariants |
| 5 · State | progressão válida | state machine |
| 6 · Actor | quem pode agir | capability map |
| 7 · Skill | capacidade executável | semantic skill |
| 8 · Trajectory | jornada ordenada | trajectory |
| 9 · DSL | declaração compacta | semantic source |
| 10 · Execution | projeção técnica | runtime |

A especificidade é monotônica:

```
S₀ ⊂ S₁ ⊂ ... ⊂ S₁₀
```

Eu não uso uma camada posterior para redefinir uma anterior. Ela apenas restringe, refina ou operacionaliza o significado já definido.

---

# Etapa 0 — Intent Trajectory Destiny

## O que é definido

I define the business destination before defining technology.

For delivery, my destination is not "create an API" or "send a WhatsApp message". It is:

```
cliente → solicita entrega → entrega executada → motoboy pago
```

## Definição

```
DESTINY delivery {
  ✓ requested
  ✓ paid
  ✓ assigned
  ✓ tracked
  ✓ delivered
  ✓ settled
}
```

## O que cada passo significa

- `requested`: I need an explicit delivery request.
- `paid`: I require payment before releasing the delivery.
- `assigned`: I need one responsible courier.
- `tracked`: I need the courier trajectory while active.
- `delivered`: I need destination evidence and a valid delivery code.
- `settled`: I need the courier payment finalized.

## Por que escolhi isso

I chose the destination first because I want implementation decisions to remain subordinate to the business outcome. If I cannot state what completion means, I cannot objectively decide whether behavior is correct.

---

# Etapa 1 — Intent Trajectory Intent

## O que é definido

I define the semantic request entering the system.

The first message can be incomplete:

```
I OPEN delivery
→ "Preciso de uma entrega"
```

## Definição

```
INTENT delivery.request {
  actor:customer
  goal:deliver
  need:pickup+dropoff
}
```

## O que cada passo significa

- `actor`: I identify who requests the behavior.
- `goal`: I identify the desired business outcome.
- `need`: I identify the minimum information required to continue.

## Por que escolhi isso

I separate intent recognition from execution readiness because a user can clearly express what they want without providing everything required to execute it. Missing data must not invalidate a valid intent.

---

# Etapa 2 — Intent Trajectory Behavior

## O que é definido

I transform the intent into the behavior necessary to reach the destiny.

```
request
→ collect
→ discover
→ select
→ charge
→ confirm
→ release
→ track
→ validate
→ settle
```

## Definição

```
BEHAVIOR delivery {
  request
  collect(pickup,dropoff)
  discover(courier*)
  select(nearest)
  charge(customer)
  confirm(payment)
  release(courier)
  track(courier→customer)
  validate(code)
  settle(courier)
}
```

## O que cada passo significa

- `request`: I receive and classify the intention.
- `collect`: I resolve missing mandatory information.
- `discover`: I ask eligible couriers whether they are available.
- `select`: I choose the courier according to a declared rule.
- `charge`: I create the customer payment request.
- `confirm`: I accept payment only after validation.
- `release`: I give the selected courier the delivery data.
- `track`: I propagate the courier's live position to the customer.
- `validate`: I verify the delivery code at the destination.
- `settle`: I transfer the agreed payment to the courier.

## Por que escolhi isso

I chose behavior next because I need to describe what the system does without coupling it to HTTP, a database, WhatsApp provider or framework.

---

# Etapa 3 — Intent Trajectory Evidence

## O que é definido

I define what must be observable so that each behavior can be proven.

```
EVIDENCE delivery {
  request.received
  intent.recognized
  addresses.collected
  couriers.responded
  courier.selected
  payment.requested
  payment.confirmed
  delivery.released
  location.received*
  location.forwarded*
  code.received
  code.validated
  settlement.completed
}
```

## O que cada passo significa

Each item is an observable fact, not an implementation log.

For example:

```
payment.confirmed
```

means I can prove that payment was accepted. It does not mean that I merely printed a log saying payment succeeded.

`*` means that the evidence may occur multiple times.

## Por que escolhi isso

I chose evidence before implementation because I want observability to be part of the behavior definition, not something added after the system exists.

---

# Etapa 4 — Intent Trajectory Contract

## O que é definido

I make the semantic boundaries exact:

- required data;
- produced data;
- invariants;
- forbidden scenarios;
- preconditions;
- postconditions;
- failure semantics.

## Definição

```
CONTRACT delivery.request {
  in:actor,text
  out:intent
  inv:intent=delivery
  err:unknown|ambiguous
}

CONTRACT delivery.addresses {
  in:pickup,dropoff
  inv:pickup≠dropoff
}

CONTRACT delivery.payment {
  in:amount,customer
  out:payment
  inv:payment=confirmed
}

CONTRACT delivery.complete {
  in:code,location
  inv:code=valid ∧ location=dropoff
}
```

## O que cada passo significa

- `in`: information required to execute.
- `out`: semantic result produced.
- `inv`: condition that must hold.
- `err`: explicitly permitted failure class.

## Por que escolhi isso

I chose explicit contracts because natural language still leaves room for interpretation. Here I want ambiguity to become a finite technical constraint.

---

# Etapa 5 — Intent Trajectory State

## O que é definido

I define legal states and legal transitions.

```
STATE delivery {
  requested
  collecting
  searching
  assigned
  awaiting_payment
  paid
  active
  arriving
  delivered
  settled
  failed
}

FLOW delivery {
  requested→collecting
  collecting→searching
  searching→assigned
  assigned→awaiting_payment
  awaiting_payment→paid
  paid→active
  active→arriving
  arriving→delivered
  delivered→settled
  *→failed
}
```

## O que cada passo significa

A state is not merely a label. It represents conditions that must currently be true.

A transition is a permitted state change.

For example:

```
awaiting_payment → paid
```

is legal only when payment confirmation exists.

## Por que escolhi isso

I chose an explicit state model because a trajectory without legal states can execute actions in the wrong order. State makes temporal correctness explicit.

---

# Etapa 6 — Intent Trajectory Actor

## O que é definido

I bind each behavior to the actor allowed to perform it.

```
ACTOR customer
ACTOR system
ACTOR courier
ACTOR payment

ALLOW customer {
  request
  address
  pay
  code
}

ALLOW system {
  classify
  collect
  discover
  select
  charge
  validate
  route
  settle
}

ALLOW courier {
  accept
  locate
  deliver
}

ALLOW payment {
  confirm
  reject
}
```

## O que cada passo significa

- `ACTOR`: semantic participant.
- `ALLOW`: capability boundary.
- A capability is an action an actor may legally perform.

## Por que escolhi isso

I chose actor binding because an action can be technically possible but semantically unauthorized. I want authorization to derive from the behavior model.

---

# Etapa 7 — Intent Trajectory Skill

## O que é definido

I decompose behavior into reusable executable capabilities.

```
SKILL classify_delivery
SKILL collect_addresses
SKILL discover_couriers
SKILL select_nearest
SKILL request_payment
SKILL confirm_payment
SKILL release_delivery
SKILL relay_location
SKILL validate_delivery_code
SKILL settle_courier
```

A Skill preserves its declared inputs, outputs, invariants and evidence.

## Definição

```
SKILL select_nearest {
  in:couriers,origin
  rule:min(distance(courier,origin))
  out:courier
  emit:courier.selected
}
```

## O que cada passo significa

- `in`: semantic input.
- `rule`: deterministic decision rule.
- `out`: result.
- `emit`: evidence generated by successful execution.

## Por que escolhi isso

I chose skills as the executable semantic unit because I want the same declaration to be usable by agents, tests, workflows and runtime implementations.

---

# Etapa 8 — Intent Trajectory

## O que é definido

I define the complete temporal journey.

```
TRAJECTORY delivery {
  customer.request
  → system.collect
  → system.discover
  → system.select
  → customer.pay
  → payment.confirm
  → system.release
  → courier.locate*
  → system.relay*
  → customer.code
  → system.validate
  → system.settle
}
```

## O que cada passo significa

The trajectory is the ordered semantic history of behavior.

It answers:

```
quem → fez o quê → quando → sob qual estado → com qual evidência → qual próximo estado
```

## Por que escolhi isso

I chose trajectory as the central artifact because I want development to preserve the history of intent realization, not merely the final database state.

---

# Etapa 9 — Intent Trajectory DSL

## O que é definido

Only now do I compress the semantic model into a declarative DSL.

I choose visually semantic symbols so the syntax itself communicates direction, composition, state and prohibition.

## Definição

```
@delivery

D: delivery→requested paid assigned tracked delivered settled
I: customer→deliver
R: pickup+dropoff

B: request
→collect
→discover(courier*)
→select(min distance)
→charge
→confirm
→release
→track*
→validate(code)
→settle

S: requested→collecting→searching→assigned
→awaiting_payment→paid→active→arriving→delivered→settled

A: customer{request,address,pay,code}
   system{classify,collect,discover,select,charge,validate,route,settle}
   courier{accept,locate,deliver}
   payment{confirm,reject}

E: request.received
→intent.recognized
→addresses.collected
→courier.selected
→payment.confirmed
→delivery.released
→location.received*
→location.forwarded*
→code.validated
→settlement.completed

X: ¬release(payment≠confirmed)
   ¬settle(code≠valid)
   ¬settle(location≠dropoff)
   ¬select(courier∉available)
```

## O que cada passo significa

- `D` = Destiny.
- `I` = Intent.
- `R` = required semantic information.
- `B` = Behavior.
- `S` = State.
- `A` = Actor/capability authorization.
- `E` = Evidence.
- `X` = forbidden scenarios/invariants.

The DSL is compact because the semantics have already been established by the preceding layers.

## Por que escolhi isso

I chose a compact declarative syntax because I do not want verbosity to become another programming language. I want visual syntax to expose semantics directly.

---

# Etapa 10 — Intent Trajectory Execution

## O que é definido

Only after the semantic source is complete do I bind it to technology.

```
DSL
 ↓
validator
 ↓
skill runtime
 ↓
agent/orchestrator
 ↓
channel adapters
 ↓
providers
 ↓
persistence
 ↓
observability
```

For delivery:

```
WhatsApp
 ↓
Intent Classifier
 ↓
delivery.request
 ↓
Behavior Orchestrator
 ↓
Skills
 ├─ collect_addresses
 ├─ discover_couriers
 ├─ select_nearest
 ├─ request_payment
 ├─ confirm_payment
 ├─ release_delivery
 ├─ relay_location
 ├─ validate_code
 └─ settle_courier
```

## O que cada passo significa

- Channel supplies external interaction evidence.
- Classifier maps language to an existing intent.
- Orchestrator advances the trajectory.
- Skills execute semantic capabilities.
- Adapters translate semantic actions to provider operations.
- Persistence stores authoritative state.
- Observability records trajectory evidence.

## Por que escolhi isso

I chose implementation last because technology should satisfy the semantic model instead of becoming the model.

---

# A primeira trajetória completa

```
CUSTOMER
  │
  │ "Preciso de uma entrega"
  ▼
I:delivery
  │
  ├─ missing(pickup,dropoff)
  ▼
COLLECT
  │
  ├─ addresses.collected
  ▼
DISCOVER
  │
  ├─ courier₁: free+geo
  ├─ courier₂: free+geo
  ├─ courier₃: free+geo
  ├─ courier₄: free+geo
  └─ courier₅: free+geo
  ▼
SELECT(min distance)
  │
  ├─ courier.selected
  ▼
CHARGE
  │
  ├─ payment.confirmed
  ▼
RELEASE
  │
  ├─ pickup
  ├─ dropoff
  ├─ price
  ├─ delivery_code
  └─ pix_key
  ▼
TRACK*
  │
  ├─ courier.geo*
  └─ customer.geo*
  ▼
ARRIVAL
  │
  ├─ request(delivery_code)
  ▼
VALIDATE
  │
  ├─ code=valid
  └─ geo=dropoff
  ▼
SETTLE
  │
  └─ pix→courier
  ▼
DESTINY ✓
```

This is the point where my original conversational scenario becomes a formal trajectory.

---

# Why the stages are ordered this way

I intentionally do not start with:

```
API → Schema → DB → Route → UI → Agent
```

My order is:

```
WHY
 ↓
WHAT
 ↓
HOW
 ↓
PROOF
 ↓
BOUNDARY
 ↓
TIME
 ↓
AUTHORITY
 ↓
CAPABILITY
 ↓
JOURNEY
 ↓
SYNTAX
 ↓
RUNTIME
```

I use **Destiny** to establish why the system exists.

I use **Intent** to establish what the user is asking the system to accomplish.

I use **Behavior** to describe what must happen.

I use **Evidence** to establish how I will know that it happened.

I use **Contract** to remove semantic ambiguity.

I use **State** to make temporal validity explicit.

I use **Actor** to establish authority.

I use **Skill** to create reusable executable capabilities.

I use **Trajectory** to preserve the complete temporal history.

I use the **DSL** to compress the model into a declarative source.

I use **Execution** only after the semantic system is complete, so implementation becomes a projection rather than the source of truth.

# Core invariant

```
implementation ⊨ trajectory ⊨ behavior ⊨ intent ⊨ destiny
```

The implementation must satisfy the trajectory.

The trajectory must satisfy the behavior.

The behavior must satisfy the intent.

The intent must satisfy the destiny.

If a technical implementation cannot satisfy a semantic declaration, I change the implementation instead of silently changing the meaning.

# The resulting development loop

```
DESTINY
  ↓
INTENT
  ↓
BEHAVIOR
  ↓
EVIDENCE
  ↓
CONTRACT
  ↓
STATE
  ↓
ACTOR
  ↓
SKILL
  ↓
TRAJECTORY
  ↓
DSL
  ↓
IMPLEMENT
  ↓
EXECUTE
  ↓
OBSERVE
  ↓
COMPARE TRAJECTORY
  └───────────────↺
```

Execution produces a real trajectory. I compare that trajectory with the declared trajectory.

This gives me the fundamental feedback loop of Intent Trajectory Driven Development:

```
declared intent → expected trajectory → observed trajectory → conformance
```

A system is not correct merely because its code passes isolated tests. It is correct when its observed behavior conforms to the intent trajectory declared before implementation.
