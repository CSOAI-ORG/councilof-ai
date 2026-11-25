#!/usr/bin/env python3
import copy, json, pathlib, tempfile, unittest
import axis_cluster as w

class ContractTests(unittest.TestCase):
    def fixture(self):
        return {"schema":"csoai.owem.closed-label/1","labels":["HIGH","LOW"],"items":[
          {"id":"a","expected":"HIGH","response":"HIGH"},
          {"id":"b","expected":"LOW","response":"HIGH"},
          {"id":"c","expected":"HIGH","response":"not high"},
          {"id":"d","expected":"LOW","response":None}]}
    def test_states(self):
        r=w.audit_closed_label(self.fixture())
        self.assertEqual(r["counts"],{"CORRECT":1,"INCORRECT":1,"MALFORMED":1,"UNMEASURED":1})
        self.assertEqual(r["observed_accuracy"],1/3)
        self.assertIsNone(r["complete_accuracy"])
        self.assertFalse(r["register_updated"])
    def test_complete(self):
        d=self.fixture();d["items"][-1]["response"]=" LOW "
        r=w.audit_closed_label(d);self.assertEqual(r["complete_accuracy"],.5)
    def test_transport_only(self):
        d=self.fixture();d["items"]=[{"id":"z","expected":"HIGH","response":None}]
        self.assertIsNone(w.audit_closed_label(d)["observed_accuracy"])
    def test_no_substring(self):
        d=self.fixture()
        for value in ("HIGH but LOW","not HIGH","high","",True,{"label":"HIGH"}):
            d["items"][0]["response"]=value
            self.assertEqual(w.audit_closed_label(d)["outcomes"][0]["state"],"MALFORMED")
    def test_unknown_label(self):
        d=self.fixture();d["items"][0]["expected"]="OTHER"
        with self.assertRaises(ValueError):w.audit_closed_label(d)
    def test_duplicate_id(self):
        d=self.fixture();d["items"][1]["id"]="a"
        with self.assertRaises(ValueError):w.audit_closed_label(d)
    def test_duplicate_vocabulary(self):
        d=self.fixture();d["labels"]=["HIGH","HIGH"]
        with self.assertRaises(ValueError):w.audit_closed_label(d)
    def test_extra_fields(self):
        d=self.fixture();d["items"][0]["authority"]=True
        with self.assertRaises(ValueError):w.audit_closed_label(d)
    def test_wrong_schema(self):
        d=self.fixture();d["schema"]="other"
        with self.assertRaises(ValueError):w.audit_closed_label(d)
    def test_input_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp)/"input.json"
            p.write_text(json.dumps(self.fixture()))
            self.assertEqual(w.audit_file(p)["n"],4)
            for raw in (b'{"schema":1,"schema":2}',b'{"x":NaN}',b' '*2000001):
                p.write_bytes(raw)
                with self.assertRaises(ValueError):w.audit_file(p)
    def test_legacy_unchanged(self):
        self.assertEqual(w.judge("not high","HIGH",[]),(1.0,"classify"))
        self.assertEqual(w.judge(None,"HIGH",[]),(None,"timeout"))

if __name__=="__main__":unittest.main()
