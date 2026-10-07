"""Deterministic candidate causal analysis over T-DD Trajectory History.

The output describes temporal association. It is not a causal proof.
"""

import json


def _field(obj, camel, snake):
    return obj.get(camel, obj.get(snake)) if isinstance(obj, dict) else None


def _evidence_name(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("type", value.get("kind"))
    return None


def _state_name(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("value", value.get("name"))
    return None


def _antecedents(record, outcome_step):
    artifact = record.get("artifact", record)
    evidence = [_evidence_name(x) for x in (_field(artifact, "evidence", "evidence") or [])]
    evidence = [x for x in evidence if x]
    skills = [x for x in (_field(artifact, "skills", "skills") or []) if x]
    states = [_state_name(x) for x in (_field(artifact, "states", "states") or [])]
    states = [x for x in states if x]
    step = max(0, outcome_step - 1) if isinstance(outcome_step, int) else max(len(evidence), len(skills))
    return (
        [("evidence", x) for x in evidence[:step]]
        + [("skill", x) for x in skills[:step]]
        + [("state", x) for x in states[: min(len(states), step + 1)]]
    )


def _add(opportunities, outcome, antecedents):
    unique = {f"{kind}:{value}" for kind, value in antecedents}
    for key in unique:
        antecedent_type, antecedent = key.split(":", 1)
        entry = opportunities.setdefault(
            key, {"antecedent_type": antecedent_type, "antecedent": antecedent,
                  "opportunities": 0, "outcomes": {}}
        )
        entry["opportunities"] += 1
        entry["outcomes"][outcome] = entry["outcomes"].get(outcome, 0) + 1


def analyze_trajectory_causality(history, min_occurrences=1, min_lift=1.0):
    records = tuple(history.get("records", ()))
    min_occurrences = max(1, min_occurrences)
    totals = {}

    for record in records:
        artifact = record.get("artifact", record)
        divergence = _field(artifact, "firstDivergence", "first_divergence")
        if divergence and divergence.get("code"):
            outcome = f"divergence:{divergence['code']}"
            totals[outcome] = totals.get(outcome, 0) + 1

    for previous, current in zip(records, records[1:]):
        from_id = previous.get("trajectoryId", previous.get("trajectory_id"))
        to_id = current.get("trajectoryId", current.get("trajectory_id"))
        if from_id != to_id:
            outcome = f"trajectory-change:{from_id}→{to_id}"
            totals[outcome] = totals.get(outcome, 0) + 1

    opportunities = {}
    for record in records:
        artifact = record.get("artifact", record)
        divergence = _field(artifact, "firstDivergence", "first_divergence")
        if divergence and divergence.get("code"):
            _add(opportunities, f"divergence:{divergence['code']}",
                 _antecedents(record, divergence.get("step")))

    for previous, current in zip(records, records[1:]):
        from_id = previous.get("trajectoryId", previous.get("trajectory_id"))
        to_id = current.get("trajectoryId", current.get("trajectory_id"))
        if from_id == to_id:
            continue
        artifact = previous.get("artifact", previous)
        evidence = [_evidence_name(x) for x in (_field(artifact, "evidence", "evidence") or [])]
        evidence = [x for x in evidence if x]
        skills = [x for x in (_field(artifact, "skills", "skills") or []) if x]
        states = [_state_name(x) for x in (_field(artifact, "states", "states") or [])]
        states = [x for x in states if x]
        _add(opportunities, f"trajectory-change:{from_id}→{to_id}",
             ([("evidence", evidence[-1])] if evidence else [])
             + ([("skill", skills[-1])] if skills else [])
             + ([("state", states[-1])] if states else []))

    denominator = len(records)
    transition_opportunities = max(0, len(records) - 1)
    signals = []
    for entry in opportunities.values():
        for outcome, cooccurrences in entry["outcomes"].items():
            if cooccurrences < min_occurrences:
                continue
            outcome_count = totals.get(outcome, 0)
            denominator_for_outcome = transition_opportunities if outcome.startswith("trajectory-change:") else denominator
            if not outcome_count or not denominator_for_outcome:
                continue
            conditional_rate = cooccurrences / entry["opportunities"]
            baseline_rate = outcome_count / denominator_for_outcome
            lift = conditional_rate / baseline_rate if baseline_rate else 0
            if lift < min_lift:
                continue
            signals.append({
                "antecedent_type": entry["antecedent_type"],
                "antecedent": entry["antecedent"],
                "outcome_type": "divergence" if outcome.startswith("divergence:") else "trajectory-change",
                "outcome": outcome.split(":", 1)[1],
                "antecedent_count": entry["opportunities"],
                "outcome_count": outcome_count,
                "cooccurrences": cooccurrences,
                "conditional_rate": conditional_rate,
                "baseline_rate": baseline_rate,
                "lift": lift,
                "support": cooccurrences / denominator_for_outcome,
            })

    signals.sort(key=lambda x: (
        -x["lift"], -x["cooccurrences"], x["antecedent_type"],
        x["antecedent"], x["outcome"]
    ))
    return {
        "total_records": len(records),
        "transition_opportunities": transition_opportunities,
        "candidate_signals": tuple(signals),
    }
