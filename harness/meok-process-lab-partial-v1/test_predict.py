import json,unittest
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/"release"))
from predict import predict
MODEL=json.loads((ROOT/"release"/"weights.json").read_text())
class PredictTests(unittest.TestCase):
    def test_ensemble_format_and_three_members(self):
        self.assertEqual(MODEL["format"],"meok.partial-observation-process-ensemble/1")
        self.assertEqual(len(MODEL["ensemble"]),3)
    def test_output_is_rule_constrained(self):
        f=[0,0,0,1,0,0,0,1,0,1,1,0]
        r=predict(f,MODEL);p=r["constrained_prediction"]
        self.assertEqual(r["state"],"MODEL_PREDICTION_NOT_OBSERVED")
        self.assertTrue(all(0<=x<=1 for x in p))
        self.assertAlmostEqual(sum(p),1.0,places=12)
        self.assertEqual(r["authority"],"NONE")
    def test_expired_permit_preserves_previous_state(self):
        f=[.1,.2,.3,.4,.1,.2,.3,.4,1,0,1,.5]
        r=predict(f,MODEL)
        self.assertEqual(r["constrained_prediction"],f[:4])
    def test_wrong_feature_count_rejected(self):
        with self.assertRaises(ValueError):predict([0,1],MODEL)
    def test_non_finite_rejected(self):
        f=[0]*12;f[2]=float("nan")
        with self.assertRaises(ValueError):predict(f,MODEL)
    def test_repeat_is_deterministic(self):
        f=[0,0,0,1,0,0,0,1,0,1,1,0]
        self.assertEqual(predict(f,MODEL),predict(f,MODEL))
if __name__=="__main__":unittest.main(verbosity=2)