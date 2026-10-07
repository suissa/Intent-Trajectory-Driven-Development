import unittest

from trajectory_causal_paths import analyze_causal_paths

GRAPH = {
    "nodes": [
        {"id": "evidence:A", "type": "evidence", "value": "A"},
        {"id": "skill:B", "type": "skill", "value": "B"},
        {"id": "state:C", "type": "state", "value": "C"},
        {"id": "divergence:D", "type": "divergence", "value": "D"},
        {"id": "state:E", "type": "state", "value": "E"},
    ],
    "edges": [
        {"id": "evidence:A->skill:B", "from": "evidence:A", "to": "skill:B", "support": 0.8, "lift": 2},
        {"id": "skill:B->state:C", "from": "skill:B", "to": "state:C", "support": 0.6, "lift": 3},
        {"id": "state:C->divergence:D", "from": "state:C", "to": "divergence:D", "support": 0.5, "lift": 4},
        {"id": "evidence:A->state:E", "from": "evidence:A", "to": "state:E", "support": 0.7, "lift": 1.5},
    ],
}

class TestCausalPaths(unittest.TestCase):
    def test_multi_hop_path_uses_weakest_link(self):
        result = analyze_causal_paths(GRAPH, max_depth=3, min_path_depth=2)
        path = next(path for path in result["recurring_paths"] if path["terminal_type"] == "divergence")
        self.assertEqual(path["path_score"], 2)
        self.assertEqual(path["support"], 0.5)

    def test_divergence_point(self):
        result = analyze_causal_paths(GRAPH)
        self.assertEqual(result["divergence_points"], (
            {"node": "evidence:A", "outgoing": ("skill:B", "state:E")},
        ))

    def test_root_candidate(self):
        result = analyze_causal_paths(GRAPH, max_depth=4)
        self.assertEqual(result["root_cause_candidates"][0]["node"], "evidence:A")
        self.assertTrue(result["root_cause_candidates"][0]["reaches_divergence"])

if __name__ == "__main__":
    unittest.main()
