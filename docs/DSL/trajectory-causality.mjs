/**
 * Deterministic candidate causal analysis over T-DD Trajectory History.
 *
 * This module reports temporal associations only. It does not claim causal
 * proof. A signal is a candidate when an antecedent appears before an
 * outcome more often than the outcome baseline.
 */

function artifactField(artifact, camel, snake) {
  return artifact?.[camel] ?? artifact?.[snake];
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function evidenceName(value) {
  if (typeof value === "string") return value;
  return value?.type ?? value?.kind;
}

function stateName(value) {
  if (typeof value === "string") return value;
  return value?.value ?? value?.name;
}

function extractAntecedents(record, outcomeStep) {
  const artifact = record.artifact ?? record;
  const evidence = normalizeArray(artifactField(artifact, "evidence", "evidence"))
    .map(evidenceName).filter(Boolean);
  const skills = normalizeArray(artifactField(artifact, "skills", "skills")).filter(Boolean);
  const states = normalizeArray(artifactField(artifact, "states", "states"))
    .map(stateName).filter(Boolean);
  const step = Number.isFinite(outcomeStep) ? Math.max(0, outcomeStep - 1) : Math.max(evidence.length, skills.length);
  return [
    ...evidence.slice(0, step).map(value => ["evidence", value]),
    ...skills.slice(0, step).map(value => ["skill", value]),
    ...states.slice(0, Math.min(states.length, step + 1)).map(value => ["state", value])
  ];
}

function addOpportunity(opportunities, outcome, antecedents) {
  const unique = new Set(antecedents.map(([type, value]) => type + ":" + value));
  for (const key of unique) {
    const [antecedentType, ...rest] = key.split(":");
    const antecedent = rest.join(":");
    const current = opportunities.get(key) ?? { antecedentType, antecedent, opportunities: 0, outcomes: new Map() };
    current.opportunities += 1;
    current.outcomes.set(outcome, (current.outcomes.get(outcome) ?? 0) + 1);
    opportunities.set(key, current);
  }
}

function outcomeTotals(records) {
  const totals = new Map();
  for (const record of records) {
    const divergence = artifactField(record.artifact ?? record, "firstDivergence", "first_divergence");
    if (divergence?.code) {
      const key = "divergence:" + divergence.code;
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
  }
  for (let i = 1; i < records.length; i++) {
    const from = records[i - 1].trajectoryId ?? records[i - 1].trajectory_id;
    const to = records[i].trajectoryId ?? records[i].trajectory_id;
    if (from !== to) {
      const key = "trajectory-change:" + from + "→" + to;
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
  }
  return totals;
}

export function analyzeTrajectoryCausality(history, options = {}) {
  const records = normalizeArray(history?.records);
  const minOccurrences = Math.max(1, options.minOccurrences ?? 1);
  const minLift = options.minLift ?? 1;
  const opportunities = new Map();
  const totals = outcomeTotals(records);

  for (const record of records) {
    const artifact = record.artifact ?? record;
    const divergence = artifactField(artifact, "firstDivergence", "first_divergence");
    if (divergence?.code) {
      addOpportunity(opportunities, "divergence:" + divergence.code,
        extractAntecedents(record, Number(divergence.step)));
    }
  }

  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1];
    const current = records[i];
    const from = previous.trajectoryId ?? previous.trajectory_id;
    const to = current.trajectoryId ?? current.trajectory_id;
    if (from !== to) {
      const outcome = "trajectory-change:" + from + "→" + to;
      const previousArtifact = previous.artifact ?? previous;
      const evidence = normalizeArray(artifactField(previousArtifact, "evidence", "evidence"))
        .map(evidenceName).filter(Boolean);
      const skills = normalizeArray(artifactField(previousArtifact, "skills", "skills")).filter(Boolean);
      const states = normalizeArray(artifactField(previousArtifact, "states", "states"))
        .map(stateName).filter(Boolean);
      addOpportunity(opportunities, outcome, [
        ...evidence.slice(-1).map(value => ["evidence", value]),
        ...skills.slice(-1).map(value => ["skill", value]),
        ...states.slice(-1).map(value => ["state", value])
      ]);
    }
  }

  const denominators = records.length;
  const transitionOpportunities = Math.max(0, records.length - 1);
  const signals = [];

  for (const entry of opportunities.values()) {
    for (const [outcome, cooccurrences] of entry.outcomes) {
      if (cooccurrences < minOccurrences) continue;
      const outcomeCount = totals.get(outcome) ?? 0;
      const denominator = outcome.startsWith("trajectory-change:") ? transitionOpportunities : denominators;
      if (!outcomeCount || !denominator) continue;
      const conditionalRate = cooccurrences / entry.opportunities;
      const baselineRate = outcomeCount / denominator;
      const lift = baselineRate === 0 ? 0 : conditionalRate / baselineRate;
      if (lift < minLift) continue;
      signals.push({
        antecedentType: entry.antecedentType,
        antecedent: entry.antecedent,
        outcomeType: outcome.startsWith("divergence:") ? "divergence" : "trajectory-change",
        outcome: outcome.slice(outcome.indexOf(":") + 1),
        antecedentCount: entry.opportunities,
        outcomeCount,
        cooccurrences,
        conditionalRate,
        baselineRate,
        lift,
        support: cooccurrences / denominator
      });
    }
  }

  signals.sort((a, b) =>
    b.lift - a.lift ||
    b.cooccurrences - a.cooccurrences ||
    a.antecedentType.localeCompare(b.antecedentType) ||
    a.antecedent.localeCompare(b.antecedent) ||
    a.outcome.localeCompare(b.outcome)
  );

  return {
    totalRecords: records.length,
    transitionOpportunities,
    candidateSignals: signals
  };
}
