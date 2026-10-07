# Causal Trajectory Graph

The Candidate Causal Analysis stage identifies repeated temporal associations. This stage projects those signals into a deterministic directed graph.

The graph does not assert that an edge is causally proven. Every edge is explicitly marked `candidate-causal` and `temporal: true`.

```
Trajectory History
      ↓
Candidate Causal Signals
      ↓
Causal Trajectory Graph
      ├── nodes
      └── directed temporal edges
```

## Node types

A node represents one observed semantic element:

- `evidence`
- `skill`
- `state`
- `divergence`
- `trajectory`

Node IDs are deterministic:

```
type:value
```

## Edge semantics

An edge means:

```
antecedent → outcome
```

The edge contains `relation`, `temporal`, `occurrences`, `support`, `conditionalRate`, `baselineRate`, and `lift`.

The direction is intentional: the antecedent was observed before the outcome in the analyzed trajectory history.

## API

JavaScript:

```js
import { buildTrajectoryCausalGraph } from './trajectory-causal-graph.mjs';

const graph = buildTrajectoryCausalGraph(history, {
  minOccurrences: 2,
  minLift: 1.2
});
```

Python:

```python
from trajectory_causal_graph import build_trajectory_causal_graph

graph = build_trajectory_causal_graph(
    history,
    min_occurrences=2,
    min_lift=1.2,
 )
```

The result contains `version`, `totalRecords`, `transitionOpportunities`, `nodes[]`, and `edges[]`. Nodes and edges are deterministically ordered.

## Why a graph

A flat list of signals answers:

```
What is associated with what?
```

The graph makes the structure composable:

```
payment.confirmed
      ↓
delivery.released
      ↓
location.received
      ↓
trajectory-change
      ↓
divergence
```

This makes it possible to inspect chains rather than isolated pairs.

The next stage can therefore analyze multi-hop temporal paths, recurring causal chains and convergence points while retaining the distinction between observed association and proven causation.