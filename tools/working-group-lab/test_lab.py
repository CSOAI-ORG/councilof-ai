import importlib.util
import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path

spec=importlib.util.spec_from_file_location("wg_lab",Path(__file__).with_name("server.py"))
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class LabTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=Path(self.tmp.name)/"test.sqlite"
        self.server=mod.make_server(self.db)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.url="http://127.0.0.1:"+str(self.server.server_port)
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
    def post(self,body,origin=None,path="/api/events"):
        request=urllib.request.Request(self.url+path,data=json.dumps(body).encode(),headers={"Content-Type":"application/json","Origin":origin or self.url,"X-Council-Lab":"local-synthetic"},method="POST")
        try:
            with urllib.request.urlopen(request) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:
            with e:return e.code,json.load(e)
    def comment(self,revision=0):return {"documentId":"COAI-WG-002","kind":"comment","body":"Synthetic trace includes a late effect.","expectedRevision":revision}
    def test_durable_comment_and_moderation_journal(self):
        self.assertEqual(self.post(self.comment())[0],201)
        self.assertEqual(self.post({"documentId":"COAI-WG-002","kind":"hide","commentId":1,"reason":"Synthetic moderation exercise","expectedRevision":1})[0],201)
        reloaded=mod.Store(self.db,self.server.store.catalog).snapshot()
        self.assertEqual([e["kind"] for e in reloaded["events"]],["comment","hide"])
        self.assertFalse(reloaded["authenticatedHuman"])
        self.assertIn("late effect",reloaded["events"][0]["payload"]["body"])
        with sqlite3.connect(self.db) as db:
            with self.assertRaises(sqlite3.IntegrityError):db.execute("DELETE FROM events")
    def test_stale_revision_and_parallel_write_conflict(self):
        results=[]
        ts=[threading.Thread(target=lambda:results.append(self.post(self.comment())[0])) for _ in range(2)]
        for t in ts:t.start()
        for t in ts:t.join()
        self.assertEqual(sorted(results),[201,409])
        self.assertEqual(len(self.server.store.snapshot()["events"]),1)
    def test_external_origin_and_authority_actions_refused(self):
        self.assertEqual(self.post(self.comment(),"https://untrusted.example")[0],403)
        self.assertEqual(self.post({**self.comment(),"kind":"approve"})[0],400)
        self.assertEqual(self.post({**self.comment(),"approved":True})[0],400)
        self.assertEqual(self.post(self.comment(),path="/api/decision")[0],404)
        self.assertEqual(self.server.store.snapshot()["events"],[])
    def test_size_unknown_document_and_other_document_hide(self):
        self.assertEqual(self.post({**self.comment(),"body":"x"*4001})[0],400)
        self.assertEqual(self.post({**self.comment(),"documentId":"no-such-id"})[0],400)
        self.post(self.comment())
        self.assertEqual(self.post({"documentId":"COAI-WG-001","kind":"hide","commentId":1,"reason":"wrong group","expectedRevision":0})[0],400)
    def test_rebinding_host_rejected(self):
        request=urllib.request.Request(self.url+"/api/state",headers={"Host":"evil.example"})
        with self.assertRaises(urllib.error.HTTPError) as ctx:urllib.request.urlopen(request)
        self.assertEqual(ctx.exception.code,403)
        ctx.exception.close()
if __name__=="__main__":unittest.main()
