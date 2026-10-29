"""Offline contract tests. Extract pure functions; never import the signing/inference pipeline."""
from __future__ import annotations
import argparse,ast,contextlib,hashlib,io,json,math,os,re,sys,tempfile,unittest
from collections import defaultdict
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
CANDIDATE=os.environ.get("CSOAI_STATS_CANDIDATE")
SEP=Path(CANDIDATE)/"runpod_gspc_separation.py" if CANDIDATE else ROOT/"scripts/runpod_gspc_separation.py"
MATH=Path(CANDIDATE)/"card_pipeline.py" if CANDIDATE else ROOT/"harness/owem/card_pipeline.py"
NS={"argparse":argparse,"json":json,"sys":sys,"Path":Path,"defaultdict":defaultdict,"hashlib":hashlib,"re":re,"math":math,"ALPHA":.05,"QUOTABLE_N":30}
for path,names in [(MATH,{"mcnemar_exact","wilson_ci"}),(SEP,{"short","load_items","collect","pair_counts","main"})]:
 tree=ast.parse(path.read_text());nodes=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in names]
 exec(compile(ast.Module(body=nodes,type_ignores=[]),str(path),"exec"),NS)
class ReaderTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.f=self.root/"one-items.jsonl"
  self.row={"axis":"safety","bank_sha256":"a"*64,"model":"ollama:m@"+"b"*64,"item_id":"i1","grade":True,"instrument_sha256":"c"*64}
 def tearDown(self):self.tmp.cleanup()
 def rows(self,rows):
  self.f.write_text("\n".join(json.dumps(r) for r in rows));audit={};table=NS["collect"]([self.f],audit);return table,audit
 def test_revisions_distinct(self):
  t,a=self.rows([self.row,{**self.row,"model":"ollama:m@"+"d"*64}]);self.assertEqual(len(t[("safety","a"*64)]),2)
 def test_exact_copy_deduplicated(self):
  t,a=self.rows([self.row,self.row]);self.assertEqual(a["duplicate_copies"],1);self.assertEqual(a["unique_observations"],1)
 def test_conflicting_grade_refused(self):
  with self.assertRaises(ValueError):self.rows([self.row,{**self.row,"grade":False}])
 def test_repeat_run_requires_selection(self):
  with self.assertRaises(ValueError):self.rows([{**self.row,"run_id":"first"},{**self.row,"run_id":"second"}])
 def test_null_is_counted_unscored(self):
  t,a=self.rows([self.row,{**self.row,"item_id":"i2","grade":None}]);self.assertEqual(a["unscored_observations"],1);self.assertEqual(a["unique_observations"],2)
 def test_null_only_model_retained(self):
  t,a=self.rows([{**self.row,"grade":None}]);self.assertEqual(t[("safety","a"*64)][self.row["model"]],{})
 def test_integer_grade_refused(self):
  with self.assertRaises(ValueError):self.rows([{**self.row,"grade":1}])
 def test_missing_grade_refused(self):
  row=dict(self.row);del row["grade"]
  with self.assertRaises(ValueError):self.rows([row])
 def test_invalid_bank_refused(self):
  with self.assertRaises(ValueError):self.rows([{**self.row,"bank_sha256":"named-bank"}])
 def test_nonstring_identity_refused(self):
  with self.assertRaises(ValueError):self.rows([{**self.row,"model":{"x":1}}])
 def test_scalar_row_refused(self):
  with self.assertRaises(ValueError):self.rows([1])
 def test_mixed_instrument_refused(self):
  with self.assertRaises(ValueError):self.rows([self.row,{**self.row,"item_id":"i2","instrument_sha256":"d"*64}])
 def test_bad_instrument_digest_refused(self):
  with self.assertRaises(ValueError):self.rows([{**self.row,"instrument_sha256":"version-one"}])
 def test_separate_banks_not_pooled(self):
  t,a=self.rows([self.row,{**self.row,"bank_sha256":"f"*64}]);self.assertEqual(len(t),2)
 def test_identity_not_authenticated(self):
  t,a=self.rows([self.row]);self.assertFalse(a["model_identity_verified"]);self.assertFalse(a["instrument_compatibility_verified"])
 def test_pair_counts_only_shared(self):
  self.assertEqual(NS["pair_counts"]({"a":True,"b":False,"x":True},{"a":False,"b":True,"y":False}),(1,1,2))
 def test_no_files_nonzero(self):
  self.assertEqual(self.run_main(),2)
 def run_main(self):
  with patch.object(sys,"argv",["reader","--intake",str(self.root),"--out",str(self.root/"result.json")]),contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):return NS["main"]()
 def test_posthoc_not_confirmatory(self):
  rows=[{**self.row,"item_id":str(i),"model":m,"grade":m=="A"} for m in ["A","B"] for i in range(30)];self.rows(rows)
  self.assertEqual(self.run_main(),0);r=json.loads((self.root/"result.json").read_text());self.assertEqual(r["axes"][0]["verdict"],"EXPLORATORY");self.assertEqual(r["axes"][0]["confirmatory_separation"],"NOT_ESTABLISHED")
 def test_same_panel_for_ranking(self):
  rows=[{**self.row,"item_id":str(i),"model":m,"grade":True} for m in ["A","B"] for i in range(30)]+[{**self.row,"item_id":"extra","model":"A","grade":False}];self.rows(rows);self.assertEqual(self.run_main(),0)
  a=json.loads((self.root/"result.json").read_text())["axes"][0];self.assertEqual(a["n_items_paired"],30);self.assertEqual(a["excluded_outside_common_panel"]["A"],1);self.assertEqual(a["top_accuracy"],1)
 def test_no_common_panel_uncheckable(self):
  self.rows([{**self.row,"model":"A","item_id":"a"},{**self.row,"model":"B","item_id":"b"}]);self.assertEqual(self.run_main(),0);a=json.loads((self.root/"result.json").read_text())["axes"][0];self.assertEqual(a["verdict"],"UNCHECKABLE")
class StatisticalTests(unittest.TestCase):
 def test_known_tail(self):self.assertAlmostEqual(NS["mcnemar_exact"](9,1)["p_unrounded"],22/1024)
 def test_six_discordants(self):self.assertEqual(NS["mcnemar_exact"](0,6)["p_unrounded"],.03125)
 def test_no_discordants(self):self.assertEqual(NS["mcnemar_exact"](0,0)["p_unrounded"],1)
 def test_balanced(self):self.assertEqual(NS["mcnemar_exact"](2000,2000)["p_unrounded"],1)
 def test_symmetry(self):self.assertEqual(NS["mcnemar_exact"](21,9)["p_unrounded"],NS["mcnemar_exact"](9,21)["p_unrounded"])
 def test_invalid_counts(self):
  for pair in [(-1,2),(True,1),(1.5,2)]:
   with self.assertRaises(ValueError):NS["mcnemar_exact"](*pair)
 def test_extreme_tail_not_zero_claim(self):
  r=NS["mcnemar_exact"](0,2000);self.assertTrue(r["p_float_underflow"]);self.assertTrue(r["significant"]);self.assertNotEqual(r["p_scientific"].split("E")[0],"0.0000000000000000")
 def test_no_invented_bh(self):self.assertEqual(NS["mcnemar_exact"](3,4)["multiple_testing_adjustment"],"NOT_PERFORMED")
 def test_computation_bound(self):
  with self.assertRaises(ValueError):NS["mcnemar_exact"](100001,0)
 def test_wilson_binary_reference_only(self):
  self.assertEqual(NS["wilson_ci"](0,10),[0,.2775]);self.assertEqual(NS["wilson_ci"](1,10),[.7225,1]);self.assertIsNone(NS["wilson_ci"](None,0))
if __name__=="__main__":unittest.main()
