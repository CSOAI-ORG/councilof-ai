"""Real HTTP handler and JSON-RPC messages, synthetic register, no model/network egress."""
import http.client, http.server, importlib.util, json, os, pathlib, tempfile, threading, unittest
from unittest.mock import patch
SOURCE=pathlib.Path(os.environ.get('OOWM_TEST_SOURCE', pathlib.Path(__file__).with_name('oowm_gateway.py')))
spec=importlib.util.spec_from_file_location('tested_oowm', SOURCE); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class QueryRound(unittest.TestCase):
    def setUp(self):
        d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);self.file=pathlib.Path(d.name)/'register.json'
        self.enter=patch.object(mod,'REG',str(self.file));self.enter.start();self.addCleanup(self.enter.stop)
        self.remote=patch.object(mod.urllib.request,'urlopen',side_effect=AssertionError('unexpected outbound access'));self.net=self.remote.start();self.addCleanup(self.remote.stop)
    def register(self,items):self.file.write_text(json.dumps({'kind':'test_register','clusters':items}))
    def call(self):return mod.answer('privacy')
    def test_missing_is_not_empty(self):
        d=self.call();self.assertEqual(d['state'],'REGISTRY_UNAVAILABLE');self.assertIsNone(d['measured_axes']);self.assertIsNone(d['total_axes'])
    def test_unreadable_is_not_empty(self):
        self.file.write_text('{');self.assertEqual(self.call()['state'],'REGISTRY_UNAVAILABLE')
    def test_empty_is_not_zero_score(self):
        self.register({});d=self.call();self.assertEqual(d['measured_axes'],0);self.assertIsNone(d['sov_index_signal']);self.assertEqual(d['state'],'NO_RECORDED_SCORES')
    def test_zero_is_a_recorded_score(self):
        self.register({'prv':{'owem':{'sov_score':0}}});d=self.call();self.assertEqual(d['sov_index_signal'],0);self.assertEqual(d['rows'][0]['score_state'],'RECORDED_NOT_RETESTED')
    def test_missing_baseline_not_negative_one(self):
        self.register({'prv':{'owem':{'sov_score':0.25}}});d=self.call();self.assertIsNone(d['rows'][0]['registry_baseline']);self.assertNotIn('-1.000',d['answer'])
    def test_historical_score_is_not_a_worker_response(self):
        self.register({'prv':{'owem':{'n_scored':0,'sov_score':0.5},'trend':'unmeasured-this-loop'}});d=self.call();self.assertEqual(d['rows'][0]['score_state'],'LAST_KNOWN_ONLY');self.assertIs(d['worker_dispatched'],False);self.net.assert_not_called()
    def test_malformed_register(self):
        for record in [[],{'clusters':[]},{'clusters':{'prv':'bad'}}]:
            with self.subTest(record=record):self.file.write_text(json.dumps(record));self.assertEqual(self.call()['state'],'REGISTRY_UNAVAILABLE')
    def test_boolean_is_not_score(self):
        self.register({'prv':{'owem':{'sov_score':True}}});self.assertIsNone(self.call()['sov_index_signal'])
    def test_invalid_question_is_not_a_dispatch(self):
        for q in [None,{},'',False]:self.assertEqual(mod.answer(q)['state'],'INVALID_INPUT')
    def test_data_and_coverage_come_from_one_read(self):
        self.register({'prv':{'owem':{'sov_score':0.5}}});
        with patch.object(mod,'_load_reg',wraps=mod._load_reg) as read:self.call();self.assertEqual(read.call_count,1)
    def test_http_and_agent_agree_and_preserve_rpc_id(self):
        self.register({});server=http.server.HTTPServer(('127.0.0.1',0),mod.H);th=threading.Thread(target=server.serve_forever,kwargs={'poll_interval':0.02},daemon=True);th.start()
        try:
            def post(path,data):
                c=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=2)
                try:c.request('POST',path,json.dumps(data),{'Content-Type':'application/json'});r=c.getresponse();self.assertEqual(r.status,200);return json.loads(r.read())
                finally:c.close()
            human=post('/oowm/chat',{'question':'privacy'});agent=post('/mcp',{'jsonrpc':'2.0','id':'coliseum-001','method':'tools/call','params':{'name':'oowm_query','arguments':{'question':'privacy'}}});self.assertEqual(agent['id'],'coliseum-001');self.assertEqual(json.loads(agent['result']['content'][0]['text']),human);self.assertIs(human['worker_dispatched'],False)
        finally:server.shutdown();th.join(3);server.server_close()
if __name__=='__main__':unittest.main(verbosity=2)
