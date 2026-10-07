from trajectory_causality import analyze_trajectory_causality


def build_trajectory_causal_graph(history, min_occurrences=1, min_lift=1.0):
    analysis = analyze_trajectory_causality(history, min_occurrences, min_lift)
    nodes = {}
    edges = []

    def add_node(kind, value):
        node_id = f"{kind}:{value}"
        nodes.setdefault(node_id, {"id": node_id, "type": kind, "value": value})
        return node_id

    for signal in analysis["candidate_signals"]:
        source = add_node(signal["antecedent_type"], signal["antecedent"])
        outcome_type = "divergence" if signal["outcome_type"] == "divergence" else "trajectory"
        target = add_node(outcome_type, signal["outcome"])
        edges.append({
            "id": f"{source}->{target}",
            "from": source,
            "to": target,
            "relation": "candidate-causal",
            "temporal": True,
            "occurrences": signal["cooccurrences"],
            "support": signal["support"],
            "conditional_rate": signal["conditional_rate"],
            "baseline_rate": signal["baseline_rate"],
            "lift": signal["lift"],
        })

    edges.sort(key=lambda x: (
        -x["lift"], -x["occurrences"], x["from"], x["to"]
    ))
    return {
        "version": 1,
        "total_records": analysis["total_records"],
        "transition_opportunities": analysis["transition_opportunities"],
        "nodes": tuple(sorted(nodes.values(), key=lambda x: x["id"])),
        "edges": tuple(edges),
    }
