#!/usr/bin/env python3
"""Focused negative controls. Fixture data only; never write frozen corpus files."""
import copy, hashlib, json, pathlib, tempfile, unittest
from verify_corpus_v3 import verify, BASE, NORMALISER_VERSION, provision_hash, corpus_root

class Controls(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=pathlib.Path(self.tmp.name)
        self.d=self.root/BASE
        (self.d/"provisions").mkdir(parents=True)
        self.reg=[]
        self.provisions=[]
        self.anchors={}
        self.roots={}
        for i,mode,pub in (("a","FULL_TEXT",True),("b","FULL_TEXT",False),("c","IDS_ONLY",False)):
            pid=i+":1";h=provision_hash("fixture "+i) if mode=="FULL_TEXT" else None
            if h:self.anchors[pid]=h;self.roots[i]=corpus_root({pid:h})
            self.reg.append({"instrument_id":i,"freeze_mode":mode,"text_published":pub,
              "status":"IN_FORCE","status_citations":[{"url":"https://example.invalid"}],"jurisdiction":"fixture",
              "instrument_root":self.roots.get(i),"provisions_frozen":int(h is not None)})
            self.provisions.append({"instrument_id":i,"provision_id":pid,"provision_sha256":h,
              "normaliser_version":NORMALISER_VERSION,"text":"fixture "+i if pub else None,
              "text_withheld":"fixture licence" if h and not pub else None})
        self.counts={"instruments":3,"jurisdiction_codes":1,"full_text":2,"ids_only":1,"registry_only":0,
          "provision_rows":3,"provisions_hashed":2,"texts_withheld_licence":1,"instruments_text_withheld":1,
          "applicable_instruments":3,"applicable_full_text":2}
        self.man={"normaliser_version":NORMALISER_VERSION,"anchors":self.anchors,"corpus_root":corpus_root(self.anchors),
                  "instrument_roots":self.roots,"counts":self.counts}
    def tearDown(self):self.tmp.cleanup()
    def write(self,change=None):
        for path,data in (("registry.jsonl",self.reg),("provisions/fixture.jsonl",self.provisions),("v1-corrections.jsonl",[])):
            (self.d/path).write_text("".join(json.dumps(r)+"\n" for r in data))
        man=copy.deepcopy(self.man)
        man["files"]={str(p.relative_to(self.root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.d.rglob("*.jsonl")}
        if change:change(man)
        (self.d/"manifest.json").write_text(json.dumps(man))
    def test_valid(self):
        self.write();r=verify(self.root);self.assertEqual(r["errors"],[]);self.assertEqual(r["published_texts_rehashed"],1)
    def test_duplicate_registry_repinned(self):
        self.reg.append(copy.deepcopy(self.reg[0]));self.write()
        self.assertIn("duplicate or invalid registry identity: a",verify(self.root)["errors"])
    def test_duplicate_provision_repinned(self):
        self.provisions.append(copy.deepcopy(self.provisions[0]));self.write()
        self.assertIn("duplicate or invalid provision identity: a:1",verify(self.root)["errors"])
    def test_missing_manifest_file(self):
        self.write(lambda m:m["files"].pop(str(BASE/"provisions/fixture.jsonl")))
        self.assertIn("manifest file set differs from corpus files",verify(self.root)["errors"])
    def test_missing_instrument_root(self):
        self.write(lambda m:m["instrument_roots"].pop("a"))
        self.assertIn("instrument root set differs from hashed rows",verify(self.root)["errors"])
    def test_count_mismatch(self):
        self.write(lambda m:m["counts"].update(provisions_hashed=999))
        self.assertIn("manifest count reconciliation",verify(self.root)["errors"])
    def test_registry_count_mismatch(self):
        self.reg[0]["provisions_frozen"]=999;self.write()
        self.assertIn("registry provision count: a",verify(self.root)["errors"])
    def test_published_withheld(self):
        self.reg[1]["text_published"]=True;self.write()
        self.assertIn("unexplained withheld text: b:1",verify(self.root)["errors"])
    def test_text_mutation_repinned(self):
        self.provisions[0]["text"]="changed";self.write()
        self.assertIn("text does not reproduce its hash: a:1",verify(self.root)["errors"])
    def test_file_mutation(self):
        self.write();p=self.d/"v1-corrections.jsonl";p.write_text("{}\n")
        self.assertIn("file digest mismatch: "+str(BASE/"v1-corrections.jsonl"),verify(self.root)["errors"])

if __name__=="__main__":unittest.main()
