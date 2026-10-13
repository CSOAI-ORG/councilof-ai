import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
import research_bridge as bridge
import research_server as server

def outcome(value,**extra):
    return dict(execution='disabled',symbol='TEST',net_return_bps=value,**extra)

def encode(rows):return ('\n'.join(json.dumps(r) for r in rows)+'\n').encode()

class ReportingTests(unittest.TestCase):
    def test_missing_return_cannot_make_200_percent(self):
        raw=encode([outcome(5,profitable_after_estimated_cost=True),
            {'execution':'disabled','profitable_after_estimated_cost':True}])
        result=bridge.outcome_summary(raw)['recomputed_score']
        self.assertEqual(result['settled_outcomes'],1)
        self.assertEqual(result['cost_adjusted_win_rate'],1)
    def test_invalid_json_counted(self):
        result=bridge.outcome_summary(encode([outcome(-2)])+b'not json\n')
        self.assertEqual(result['malformed_json_lines'],1)
        self.assertEqual(result['recomputed_score']['settled_outcomes'],1)
    def test_no_data_is_unknown(self):
        self.assertIsNone(bridge.outcome_summary(b'')['recomputed_score']['net_bps_total'])
    def test_live_rows_excluded(self):
        raw=encode([{'execution':'live','net_return_bps':100},outcome(-5)])
        self.assertEqual(bridge.outcome_summary(raw)['recomputed_score']['net_bps_total'],-5)
    def test_no_dollar_profit_or_promotion(self):
        value=bridge.outcome_summary(encode([outcome(4)]))['recomputed_score']
        self.assertIsNone(value['pnl_in_currency'])
        self.assertFalse(value['eligible_for_live_promotion'])
    def test_nonfinite_json_rejected(self):
        with self.assertRaises(ValueError):bridge.parse('{"x":NaN}')
    def test_naive_timestamp_rejected(self):
        with self.assertRaises(ValueError):bridge.timestamp('2026-09-19T12:00:00')
    def test_file_read_is_bounded(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'data';p.write_bytes(b'12345')
            with self.assertRaises(ValueError):bridge.bounded_bytes(p,4)
    def test_host_failure_stays_unknown(self):
        with patch.object(bridge,'run_json',side_effect=OSError('private detail')):
            result=bridge.peer_report()
        self.assertEqual(result,{'status':'UNCHECKABLE','error_type':'OSError'})
    def test_frozen_code_mismatch_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);(p/'code.py').write_text('changed')
            with patch.object(bridge,'PINS',{'code.py':'0'*64}):
                with self.assertRaises(ValueError):bridge.check_frozen(p)

class RouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True)
        cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.thread.join(2)
    def request(self,method,path,headers=None):
        client=http.client.HTTPConnection('127.0.0.1',self.http.server_port,timeout=3)
        try:
            client.request(method,path,headers=headers or {})
            response=client.getresponse()
            return response.status,response.read(),dict(response.getheaders())
        finally:client.close()
    def test_root_is_paper_only(self):
        status,body,_=self.request('GET','/')
        self.assertEqual(status,200);self.assertIn(b'Research only',body)
    def test_health_requires_no_remote_queries(self):
        with patch.object(server,'current',side_effect=AssertionError('no fetch')):
            status,body,_=self.request('GET','/health')
        self.assertEqual(status,200);self.assertIs(json.loads(body)['orders'],False)
    def test_report_returns_only_fixed_reader(self):
        with patch.object(server,'current',return_value={'mode':'READ_ONLY_RESEARCH'}):
            status,body,_=self.request('GET','/api/report')
        self.assertEqual(status,200);self.assertEqual(json.loads(body)['mode'],'READ_ONLY_RESEARCH')
    def test_post_put_patch_delete_rejected(self):
        for method in ('POST','PUT','PATCH','DELETE'):
            self.assertEqual(self.request(method,'/api/report')[0],405)
    def test_path_traversal_rejected(self):
        self.assertEqual(self.request('GET','/../../.env')[0],404)
    def test_external_host_rejected(self):
        self.assertEqual(self.request('GET','/api/report',{'Host':'attacker.example'})[0],403)
    def test_external_origin_rejected(self):
        self.assertEqual(self.request('GET','/api/report',{'Origin':'https://attacker.example'})[0],403)
    def test_query_parameters_cannot_supply_commands(self):
        self.assertEqual(self.request('GET','/api/report?command=trade')[0],404)
    def test_reader_failure_not_success(self):
        with patch.object(server,'current',side_effect=ValueError('private detail')):
            status,body,_=self.request('GET','/api/report')
        self.assertEqual(status,503);self.assertNotIn(b'private detail',body)
    def test_no_cors_and_browser_isolation_headers(self):
        _,_,headers=self.request('GET','/health')
        self.assertNotIn('Access-Control-Allow-Origin',headers)
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertIn("frame-ancestors 'none'",headers['Content-Security-Policy'])

if __name__=='__main__':unittest.main(verbosity=2)
