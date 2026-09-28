import importlib.util, json, unittest
from pathlib import Path
P=Path(__file__).with_name("evidence_manifest.py")
S=importlib.util.spec_from_file_location("em",P); em=importlib.util.module_from_spec(S); S.loader.exec_module(em)
class T(unittest.TestCase):
    def test_manifest_is_derived_and_non_additive(self):
        repo=Path(__file__).resolve().parents[2]; d=em.build(repo)
        cards=json.loads((repo/"public/signed/card_index.json").read_text())
        root=json.loads((repo/"public/root.json").read_text())
        self.assertEqual(d["populations"]["signed_card_index"]["count"],cards["n_cards"])
        self.assertEqual(d["populations"]["signed_card_index"]["actual_array_length"],len(cards["cards"]))
        self.assertEqual(d["populations"]["public_root"]["count"],root["card_count"])
        self.assertIn("never added",d["authority"]["rule"])
        self.assertGreaterEqual(d["populations"]["claim_registry_heads"]["count"],1)
if __name__=="__main__": unittest.main()
