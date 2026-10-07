import unittest
from trajectory_causal_graph import build_trajectory_causal_graph

class TrajectoryCausalGraphTests(unittest.TestCase):
    def test_builds_temporal_edge(self):
        def artifact(divergence=None):
            value={"trajectory_id":"a","evidence":["request.received","intent.recognized"],
                   "skills":["request_delivery","recognize_intent"],
                   "states":["requested","collecting","recognizing"]}
            if divergence:
                value["first_divergence"]=divergence
            return value
        history={"records":[
            {"record_id":1,"trajectory_id":"a","artifact":artifact({"code":"EVIDENCE","step":3})},
            {"record_id":2,"trajectory_id":"a","artifact":artifact({"code":"EVIDENCE","step":3})},
            {"record_id":3,"trajectory_id":"a","artifact":artifact()}
        ]}
        graph=build_trajectory_causal_graph(history)
        self.assertEqual(graph["version"],1)
        edge=next(x for x in graph["edges"] if x["from"]=="evidence:intent.recognized")
        self.assertEqual(edge["to"],"divergence:EVIDENCE")
        self.assertTrue(edge["temporal"])
        self.assertGreater(edge["lift"],1)

    def test_is_deterministic(self):
        history={"records":[
            {"trajectory_id":"a","artifact":{"trajectory_id":"a","evidence":["x"],"skills":["s"],"states":["q","r"],"first_divergence":{"code":"D","step":2}}},
            {"trajectory_id":"a","artifact":{"trajectory_id":"a","evidence":["x"],"skills":["s"],"states":["q","r"],"first_divergence":{"code":"D","step":2}}}
        ]}
        self.assertEqual(build_trajectory_causal_graph(history),build_trajectory_causal_graph(history))

if __name__=="__main__":
    unittest.main(verbosity=2)
