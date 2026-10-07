# Candidate Causal Trajectory Analysis

Trajectory History now supports deterministic analysis of recurring trajectories, recurring divergences, Behavior patterns and trajectory changes. The next layer is to identify temporal associations that can serve as candidate causal signals.

This layer deliberately does **not** claim causal proof.

## Model

```
TrajectoryHistory
    ↓
Antecedent extraction
    ↓
Outcome extraction
    ↓
Conditional frequency
    ↓
Lift + support
    ↓
Candidate causal signals
```

An antecedent is an observed Evidence, Skill or State that appears before an outcome.

The supported outcomes are:

- a recurring divergence code;
- a trajectory change from one TrajectoryID to another.

For a divergence, antecedents are taken from the execution prefix before the first divergence step.

For a trajectory change, the immediate terminal Evidence, Skill and State of the previous record are used as antecedents.

## Association, not causation

The analysis computes:

```
P(outcome | antecedent)
```

and compares it with the baseline:

```
P(outcome)
```

The association strength is:

```
lift = P(outcome | antecedent) / P(outcome)
```

`lift > 1` means the outcome is more frequent when the antecedent is present. `support` measures the proportion of opportunities in which the antecedent/outcome co-occur.

These statistics identify candidate causal signals. They do not establish intervention-level causality, because confounders and selection effects can remain. Stronger causal claims require controlled interventions, counterfactual analysis or explicit causal assumptions.

This distinction is intentional: T-DD first discovers repeatable temporal structure before introducing probabilistic or causal models.

## APIs

JavaScript:

```js
import { analyzeTrajectoryCausality } from './trajectory-causality.mjs';
const analysis = analyzeTrajectoryCausality(history, {
  minOccurrences: 2,
  minLift: 1.2
});
```

Python:

```python
from trajectory_causality import analyze_trajectory_causality

analysis = analyze_trajectory_causality(
    history,
    min_occurrences=2,
    min_lift=1.2,
 )
```

Both return:

```
total records
transition opportunities
candidate signals
```

Each candidate signal contains:

```
antecedent
antecedent type
outcome
outcome type
antecedent count
outcome count
cooccurrences
conditional rate
baseline rate
lift
support
```

Results are deterministically ordered by lift, co-occurrence count and lexical identity.

## Architectural position

```
DESTINY
  ↓
INTENT
  ↓
BEHAVIOR
  ↓
EVIDENCE
  ↓
STATE
  ↓
SKILL
  ↓
TRAJECTORY
  ↓
EXECUTION
  ↓
TRAJECTORY PROOF
  ↓
TRAJECTORY HISTORY
  ↓
HISTORICAL ANALYSIS
  ↓
CANDIDATE CAUSAL ANALYSIS
```

The next logical evolution is to turn repeated candidate signals into a causal graph with temporal edges, while preserving the distinction between observed association and proven causation.
