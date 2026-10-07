# Multi-Hop Causal Paths

T-DD projects the candidate-causal graph into multi-hop candidate paths. The analysis remains observational: an edge is a temporal candidate association, and a path is not proof of causation.

## Pipeline

Trajectory History -> Candidate Causal Analysis -> Causal Trajectory Graph -> Multi-Hop Causal Paths.

The multi-hop layer exposes recurring paths, convergence points, divergence points, and root-cause candidates.

## API

JavaScript: analyzeCausalPaths(graph, { maxDepth: 4, minPathDepth: 2 })

Python: analyze_causal_paths(graph, max_depth=4, min_path_depth=2)

## Path score

For A -> B -> C -> D, pathScore is the minimum lift among all edges in the path. Path support is the minimum support among all edges. This conservative rule prevents a strong edge from hiding a weak link.

## Structural signals

A convergence point has more than one incoming edge. A divergence point has more than one outgoing edge.

A root-cause candidate is a source node with no incoming edges that has a candidate path reaching a divergence node. It is ranked by path score and support. This is a structural candidate, not a causal intervention claim.

## Determinism

Paths are simple paths: a node cannot occur twice in the same path. This prevents cycles from producing unbounded enumeration. Results are deterministically ordered by depth, path score, support, and node sequence.

## T-DD evolution

The causal graph answers which candidate temporal relationships exist. Multi-hop analysis advances this to which candidate relationships form a behavioral chain, providing the basis for later causal cascade and root-cause analysis.
