"""Multi-hop analysis for candidate causal trajectory graphs."""

def analyze_causal_paths(graph, max_depth=4, min_path_depth=1):
    max_depth = max(1, int(max_depth))
    min_path_depth = max(1, int(min_path_depth))
    nodes = sorted(graph.get("nodes", ()), key=lambda node: node["id"])
    edges = sorted(graph.get("edges", ()), key=lambda edge: (edge["from"], edge["to"], -edge["lift"]))
    node_by_id = {node["id"]: node for node in nodes}
    outgoing = {node["id"]: [] for node in nodes}
    incoming = {node["id"]: [] for node in nodes}
    for edge in edges:
        outgoing[edge["from"]].append(edge)
        incoming[edge["to"]].append(edge)
    for values in outgoing.values():
        values.sort(key=lambda edge: (edge["to"], -edge["lift"]))

    paths = []
    def visit(node_id, node_path, edge_path):
        if len(edge_path) >= min_path_depth:
            lifts = [edge["lift"] for edge in edge_path]
            supports = [edge["support"] for edge in edge_path]
            paths.append({
                "nodes": tuple(node_path),
                "edge_ids": tuple(edge["id"] for edge in edge_path),
                "depth": len(edge_path),
                "support": min(supports),
                "min_lift": min(lifts),
                "path_score": min(lifts),
                "terminal_type": node_by_id.get(node_id, {}).get("type", "unknown"),
            })
        if len(edge_path) >= max_depth:
            return
        for edge in outgoing.get(node_id, ()):
            if edge["to"] not in node_path:
                visit(edge["to"], node_path + [edge["to"]], edge_path + [edge])

    for node in nodes:
        visit(node["id"], [node["id"]], [])

    paths.sort(key=lambda path: (-path["depth"], -path["path_score"], -path["support"], "->".join(path["nodes"])))

    convergence_points = tuple(
        {"node": node["id"], "incoming": tuple(sorted(edge["from"] for edge in incoming[node["id"]]))}
        for node in nodes if len(incoming[node["id"]]) > 1
    )
    divergence_points = tuple(
        {"node": node["id"], "outgoing": tuple(sorted(edge["to"] for edge in outgoing[node["id"]]))}
        for node in nodes if len(outgoing[node["id"]]) > 1
    )

    candidates = []
    for node in nodes:
        if incoming[node["id"]]:
            continue
        reachable = [path for path in paths if path["nodes"][0] == node["id"] and path["terminal_type"] == "divergence"]
        if reachable:
            best = sorted(reachable, key=lambda path: (-path["path_score"], -path["support"], path["depth"]))[0]
            candidates.append({"node": node["id"], "score": best["path_score"], "support": best["support"], "reaches_divergence": True})
    candidates.sort(key=lambda item: (-item["score"], -item["support"], item["node"]))

    return {
        "version": 1,
        "max_depth": max_depth,
        "paths": tuple(paths),
        "recurring_paths": tuple(path for path in paths if path["depth"] > 1),
        "convergence_points": convergence_points,
        "divergence_points": divergence_points,
        "root_cause_candidates": tuple(candidates),
    }
