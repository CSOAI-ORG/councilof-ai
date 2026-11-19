"""Offline controls for EAT metadata classification; never contact or execute agents."""
import copy
import io
import json
from pathlib import Path
import socket
import sys
import unittest
import urllib.error
from unittest.mock import Mock, patch

import a2a_card_probe as a

CARD = {
    'name': 'Fixture agent', 'description': '', 'version': '1.0.0',
    'capabilities': {}, 'defaultInputModes': ['text/plain'],
    'defaultOutputModes': ['text/plain'], 'skills': [],
    'supportedInterfaces': [{'url': 'https://example.invalid/a2a',
                            'protocolBinding': 'JSONRPC', 'protocolVersion': '1.0'}],
}

def raw(card=None):
    return json.dumps(CARD if card is None else card).encode()


def entry(url='https://example.invalid/card.json'):
    return {'kind': 'a2a-agent', 'id': 'fixture', 'meta': {'card_url': url}}


class CardShapeTests(unittest.TestCase):
    def test_v1_shape_is_metadata_only(self):
        self.assertTrue(a.card_shape(raw()))

    def test_legacy_url_shape(self):
        obj=copy.deepcopy(CARD);del obj['supportedInterfaces'];obj['url']='https://example.invalid/a2a'
        self.assertTrue(a.card_shape(raw(obj)))

    def test_typed_skills(self):
        obj=copy.deepcopy(CARD);obj['skills']=[{'id':'echo','name':'Echo','description':'Echo input','tags':['echo']}]
        self.assertTrue(a.card_shape(raw(obj)))

    def test_non_card_bodies_refused(self):
        for body in (b'<html>Maintenance</html>',b'{"error":"no agent"}',b'[]',b'false',b'null',b'"agent"',b'{}'):
            with self.subTest(body=body):self.assertFalse(a.card_shape(body))

    def test_duplicate_keys_refused(self):
        self.assertFalse(a.card_shape(b'{"name":"earlier",'+raw()[1:]))
        obj=raw().replace(b'"capabilities": {}',b'"capabilities": {"streaming":true,"streaming":false}')
        self.assertFalse(a.card_shape(obj))

    def test_nonfinite_and_overflow_json_refused(self):
        for value in (b'NaN',b'Infinity',b'-Infinity',b'1e999'):
            self.assertFalse(a.card_shape(b'{"extra":'+value+b','+raw()[1:]))

    def test_utf8_and_size_refused(self):
        for body in (b'\xff',None,'{}',b'',raw()+b' '*(a.MAX_CARD_BYTES+1)):
            self.assertFalse(a.card_shape(body))
        self.assertTrue(a.card_shape(raw()+b' '*(a.MAX_CARD_BYTES-len(raw()))))

    def test_missing_required_fields(self):
        for key in ('name','description','version','capabilities','defaultInputModes','defaultOutputModes','skills','supportedInterfaces'):
            obj=copy.deepcopy(CARD);del obj[key]
            with self.subTest(key=key):self.assertFalse(a.card_shape(raw(obj)))

    def test_wrong_typed_fields(self):
        for key,bad in (('name',True),('description',{}),('version',3),('capabilities',[]),('skills',{}),('defaultInputModes','text/plain'),('defaultOutputModes',[True])):
            obj=copy.deepcopy(CARD);obj[key]=bad
            with self.subTest(key=key):self.assertFalse(a.card_shape(raw(obj)))

    def test_bad_skill_and_duplicate_id(self):
        for skills in ([{}],[True],[{'id':'x','name':'x','description':'x','tags':True}],
                       [{'id':'x','name':'x','description':'x','tags':[]}]*2):
            obj=copy.deepcopy(CARD);obj['skills']=skills
            self.assertFalse(a.card_shape(raw(obj)))

    def test_bad_interface_not_downgraded(self):
        for value in ([],None,True,[{}],[{'url':'https://example.invalid','protocolBinding':True,'protocolVersion':'1.0'}]):
            obj=copy.deepcopy(CARD);obj['supportedInterfaces']=value;obj['url']='https://example.invalid'
            self.assertFalse(a.card_shape(raw(obj)))

    def test_deep_json_refused(self):
        self.assertFalse(a.card_shape(b'['*2000+b'0'+b']'*2000))

    def test_extensions_do_not_grant_verified_status(self):
        obj=copy.deepcopy(CARD);obj['signatures']=[{'signature':'unverified-text'}];obj['unknownExtension']={'x':1}
        self.assertTrue(a.card_shape(raw(obj)))  # Shape only; no cryptographic verification claimed.


class ProbeTests(unittest.TestCase):
    def setUp(self):
        # Any accidental live network call in these tests must fail.
        self.deny=patch.object(socket,'create_connection',side_effect=AssertionError('NETWORK_FORBIDDEN'))
        self.deny.start();self.addCleanup(self.deny.stop)
    def run_case(self,results,value=None):
        transport=Mock(side_effect=results)
        result=a.probe_agent_card(entry() if value is None else value,user_agent='fixture-agent',get=transport)
        return result,transport

    def test_direct_json_url_is_not_extended(self):
        (state,note),get=self.run_case([(200,raw())])
        self.assertEqual(state,'LIVE');self.assertIn('metadata only',note)
        get.assert_called_once_with('https://example.invalid/card.json','fixture-agent')

    def test_direct_named_resource_no_guess_after_bad_body(self):
        (state,_),get=self.run_case([(200,b'<html>maintenance</html>')])
        self.assertEqual(state,'UNCHECKABLE');self.assertEqual(get.call_count,1)

    def test_query_url_is_exact_and_not_logged(self):
        (state,note),get=self.run_case([(404,None)],entry('https://example.invalid/discover?v=1'))
        self.assertEqual(state,'PLACEHOLDER');self.assertEqual(get.call_count,1);self.assertNotIn('?v=',note)

    def test_base_root_can_return_card_directly(self):
        (state,_),get=self.run_case([(200,raw())],entry('https://example.invalid/'))
        self.assertEqual(state,'LIVE');self.assertEqual(get.call_count,1)

    def test_base_html_then_canonical_card(self):
        (state,_),get=self.run_case([(200,b'<html>home</html>'),(200,raw())],entry('https://example.invalid/'))
        self.assertEqual(state,'LIVE')
        self.assertEqual(get.call_args_list[1].args[0],'https://example.invalid/.well-known/agent-card.json')

    def test_service_subpath_is_preserved(self):
        (state,_),get=self.run_case([(404,None),(200,raw())],entry('https://example.invalid/team/'))
        self.assertEqual(state,'LIVE');self.assertEqual(get.call_args_list[1].args[0],'https://example.invalid/team/.well-known/agent-card.json')

    def test_legacy_fallback_and_four_request_bound(self):
        (state,_),get=self.run_case([(404,None),(404,None),(404,None),(200,raw())],entry('https://example.invalid'))
        self.assertEqual(state,'LIVE');self.assertEqual(get.call_count,4)
        self.assertEqual(get.call_args_list[-1].args[0],'https://example.invalid/agent-card.json')

    def test_permission_denial_stops_without_other_route(self):
        for status in (401,403):
            (state,_),get=self.run_case([(status,None)],entry('https://example.invalid'))
            self.assertEqual(state,'HELD');self.assertEqual(get.call_count,1)

    def test_inconclusive_status_stops_without_retry(self):
        for status in (-1,0,204,301,302,307,308,400,405,408,429,500,503):
            (state,_),get=self.run_case([(status,None)],entry('https://example.invalid'))
            self.assertEqual(state,'UNCHECKABLE');self.assertEqual(get.call_count,1)

    def test_invalid_transport_status(self):
        for value in (True,'200',None):
            (state,_),get=self.run_case([(value,raw())])
            self.assertEqual(state,'UNCHECKABLE')

    def test_missing_card_is_not_dead_agent(self):
        (state,_),get=self.run_case([(404,None),(410,None),(404,None),(404,None)],entry('https://example.invalid'))
        self.assertEqual(state,'PLACEHOLDER');self.assertEqual(get.call_count,4)

    def test_invalid_200_is_not_proof_of_no_card(self):
        (state,_),get=self.run_case([(200,b'[]')]+[(404,None)]*3,entry('https://example.invalid'))
        self.assertEqual(state,'UNCHECKABLE')

    def test_malformed_url_never_requests(self):
        for url in ('file:///tmp/card','httpwhatever','https://u:p@example.invalid','https://example.invalid/#part',
                    'https://example.invalid:99999','https://example.invalid/\ncard','https://example.invalid\\x'):
            (state,_),get=self.run_case([],entry(url))
            self.assertEqual(state,'UNCHECKABLE');get.assert_not_called()

    def test_missing_url_placeholder(self):
        (state,_),get=self.run_case([],{'id':''})
        self.assertEqual(state,'PLACEHOLDER');get.assert_not_called()

    def test_invalid_metadata(self):
        for meta in ([],['bad'],False,'bad'):
            (state,_),get=self.run_case([],{'id':'fixture','meta':meta})
            self.assertEqual(state,'UNCHECKABLE');get.assert_not_called()

    def test_numeric_identifier_without_url_is_placeholder(self):
        (state,_),get=self.run_case([],{'id':'234'})
        self.assertEqual(state,'PLACEHOLDER');get.assert_not_called()

    def test_invalid_entry_and_explicit_url_type(self):
        for value in ([],None,{'id':'https://example.invalid','meta':{'card_url':False}}):
            (state,_),get=self.run_case([],value if value is not None else [])
            self.assertEqual(state,'UNCHECKABLE');get.assert_not_called()

    def test_fallback_auth_denial_stops(self):
        (state,_),get=self.run_case([(404,None),(403,None)],entry('https://example.invalid'))
        self.assertEqual(state,'HELD');self.assertEqual(get.call_count,2)

    def test_advertised_interfaces_are_not_called(self):
        (state,_),get=self.run_case([(200,raw())])
        self.assertEqual(state,'LIVE');self.assertEqual(get.call_count,1)
        self.assertNotIn('https://example.invalid/a2a',[x.args[0] for x in get.call_args_list])

    def test_direct_resource_without_json_suffix(self):
        (state,_),get=self.run_case([(200,raw())],entry('https://example.invalid/discovery'))
        self.assertEqual(state,'LIVE');self.assertEqual(get.call_count,1)

    def test_body_size_guard(self):
        (state,_),get=self.run_case([(200,raw()+b' '*(a.MAX_CARD_BYTES+1))])
        self.assertEqual(state,'UNCHECKABLE')


class TransportTests(unittest.TestCase):
    def test_read_bound_headers_and_get_only(self):
        response=Mock(status=200);response.read.return_value=raw()
        response.__enter__=Mock(return_value=response);response.__exit__=Mock(return_value=False)
        opener=Mock();opener.open.return_value=response
        with patch.object(a.urllib.request,'build_opener',return_value=opener):
            self.assertEqual(a._http_get('https://example.invalid/card.json','test-agent'),(200,raw()))
        response.read.assert_called_once_with(a.MAX_CARD_BYTES+1)
        request=opener.open.call_args.args[0]
        self.assertEqual(request.get_method(),'GET');self.assertIsNone(request.data)
        self.assertEqual(request.get_header('Accept'),'application/json')
        self.assertIsNone(request.get_header('Authorization'))
        self.assertEqual(opener.open.call_args.kwargs['timeout'],12)

    def test_http_error_body_not_downloaded(self):
        body=Mock();exc=urllib.error.HTTPError('https://example.invalid',403,'forbidden',{},body)
        opener=Mock();opener.open.side_effect=exc
        with patch.object(a.urllib.request,'build_opener',return_value=opener):
            self.assertEqual(a._http_get('https://example.invalid','test'),(403,None))
        body.read.assert_not_called()

    def test_network_failure_retains_unknown(self):
        opener=Mock();opener.open.side_effect=OSError('offline')
        with patch.object(a.urllib.request,'build_opener',return_value=opener):
            self.assertEqual(a._http_get('https://example.invalid','test'),(-1,None))

    def test_redirect_handler_does_not_follow(self):
        self.assertIsNone(a._NoRedirect().redirect_request(None,None,302,'redirect',{},'http://other.invalid'))


class ExistingPipelineTests(unittest.TestCase):
    def setUp(self):
        import probe
        self.probe=probe

    def test_entrypoint_uses_corrected_classifier(self):
        with patch.object(a,'_http_get',return_value=(200,b'<html>Maintenance</html>')):
            self.assertEqual(self.probe._probe_one(entry())[1],'UNCHECKABLE')

    def test_aggregate_keeps_denominator_and_unsigned_limits(self):
        values=[('LIVE','valid card'),('UNCHECKABLE','invalid card'),('HELD','gated')]
        entries=[dict(entry(),id=str(i)) for i in range(3)]
        with patch.dict(self.probe.PROBERS,{'a2a-agent':Mock(side_effect=values)}):
            agg=self.probe.run_probes(entries)['a2a-agent']
        self.assertEqual((agg['n'],agg['LIVE'],agg['UNCHECKABLE'],agg['HELD']),(3,1,1,1))
        with patch.object(self.probe.c,'write_atom',return_value=(True,'mock')) as writer:
            self.probe.stage_live_atom('a2a-agent',agg)
        payload=writer.call_args.kwargs['payload']
        self.assertFalse(payload['flags']['auto_measured'])
        self.assertEqual(payload['sample']['live_fraction_of_probed'],0.3333)
        self.assertIn('full_protocol_conformance',payload['unmeasured'])
        self.assertIn('card_signature_and_identity',payload['unmeasured'])
        self.assertLessEqual(len(self.probe.c.canonical_bytes(payload)),3072)

    def test_other_probers_and_pipeline_have_not_changed(self):
        self.assertEqual(set(self.probe.PROBERS),{'hf-model','hf-space','npm-registry','mcp-server','a2a-agent','erc8004','xrpl-account'})
        with patch.object(self.probe.c,'http_get',return_value=(403,b'')):
            self.assertEqual(self.probe.probe_hf({'id':'fixture'} )[0],'HELD')
            self.assertEqual(self.probe.probe_mcp({'id':'fixture','meta':{'remote_url':'https://example.invalid'}})[0],'LIVE')


if __name__ == '__main__':
    suite=unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    report={'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),
            'skipped':len(result.skipped),'expected_failures':len(result.expectedFailures),
            'unexpected_successes':len(result.unexpectedSuccesses),'live_network_requests':0}
    print('A2A_PROBE_TEST_RESULT '+json.dumps(report,sort_keys=True))
    raise SystemExit(0 if result.wasSuccessful() and result.testsRun>=35 and not result.skipped else 1)
