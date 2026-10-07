import { analyzeTrajectoryCausality } from "./trajectory-causality.mjs";

/**
 * Build a deterministic directed graph from candidate temporal-causal signals.
 * Edges represent observed temporal association, not proven causation.
 */
export function buildTrajectoryCausalGraph(history, options = {}) {
  const analysis = analyzeTrajectoryCausality(history, options);
  const nodes = new Map();
  const edges = [];

  const nodeId = (type, value) => type + ":" + value;
  const addNode = (type, value) => {
    const id = nodeId(type, value);
    if (!nodes.has(id)) nodes.set(id, { id, type, value });
    return id;
  };

  for (const signal of analysis.candidateSignals) {
    const from = addNode(signal.antecedentType, signal.antecedent);
    const outcomeType = signal.outcomeType === "divergence" ? "divergence" : "trajectory";
    const to = addNode(outcomeType, signal.outcome);
    edges.push({
      id: from + "->" + to,
      from,
      to,
      relation: "candidate-causal",
      temporal: true,
      occurrences: signal.cooccurrences,
      support: signal.support,
      conditionalRate: signal.conditionalRate,
      baselineRate: signal.baselineRate,
      lift: signal.lift
    });
  }

  edges.sort((a, b) =>
    b.lift - a.lift ||
    b.occurrences - a.occurrences ||
    a.from.localeCompare(b.from) ||
    a.to.localeCompare(b.to)
  );

  return {
    version: 1,
    totalRecords: analysis.totalRecords,
    transitionOpportunities: analysis.transitionOpportunities,
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges
  };
}
