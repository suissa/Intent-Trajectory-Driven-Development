import unittest
from trajectory_causality import analyze_trajectory_causality

def artifact(trajectory_id, divergence, evidence, skills, states):
    value={"trajectory_id":trajectory_id,"conformant":divergence is None,
           "evidence":evidence,"skills":skills,"states":states}
    if divergence:
        value["first_divergence"]=divergence
    return value

class TrajectoryCausalityTests(unittest.TestCase):
    def test_recurring_antecedent(self):
        history={"records":[
            {"record_id":1,"trajectory_id":"a","artifact":artifact("a",{"code":"D","step":3},["x","y"],["s1","s2"],["a","b","c"])},
            {"record_id":2,"trajectory_id":"a","artifact":artifact("a",{"code":"D","step":3},["x","y"],["s1","s2"],["a","b","c"])},
            {"record_id":3,"trajectory_id":"a","artifact":artifact("a",None,["x","y","z"],["s1","s2","s3"],["a","b","c","d"])}
        ]}
        result=analyze_trajectory_causality(history)
        signal=next(x for x in result["candidate_signals"] if x["antecedent_type"]=="evidence" and x["antecedent"]=="y" and x["outcome"]=="D")
        self.assertEqual(signal["cooccurrences"],2)
        self.assertEqual(signal["outcome_count"],2)
        self.assertEqual(signal["conditional_rate"],1)
        self.assertAlmostEqual(signal["baseline_rate"],2/3)
        self.assertGreater(signal["lift"],1)

    def test_trajectory_change(self):
        history={"records":[
            {"record_id":1,"trajectory_id":"a","artifact":artifact("a",None,["x","paid"],["s1","pay"],["a","paid"])},
            {"record_id":2,"trajectory_id":"b","artifact":artifact("b",None,["x"],["s1"],["a","collect"])},
            {"record_id":3,"trajectory_id":"b","artifact":artifact("b",None,["x"],["s1"],["a","collect"])}
        ]}
        result=analyze_trajectory_causality(history)
        signal=next(x for x in result["candidate_signals"] if x["antecedent"]=="paid" and x["outcome_type"]=="trajectory-change")
        self.assertEqual(signal["cooccurrences"],1)
        self.assertEqual(signal["outcome_count"],1)
        self.assertEqual(signal["lift"],2)

    def test_threshold(self):
        history={"records":[
            {"record_id":1,"trajectory_id":"a","artifact":artifact("a",{"code":"D","step":2},["x"],["s"],["a","b"])},
            {"record_id":2,"trajectory_id":"a","artifact":artifact("a",{"code":"D","step":2},["x"],["s"],["a","b"])}
        ]}
        self.assertEqual(analyze_trajectory_causality(history,min_occurrences=3)["candidate_signals"],())
        self.assertTrue(analyze_trajectory_causality(history)["candidate_signals"])

if __name__=="__main__":
    unittest.main(verbosity=2)
