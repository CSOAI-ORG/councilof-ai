import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from register import call_tool, digest, load_register, propose, provision, search, validate

HERE = Path(__file__).resolve().parent


class RegisterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_register(HERE / 'register.json')

    def test_complete_frozen_inventory_and_original_root(self):
        self.assertEqual(len(self.data['provisions']), 417)
        self.assertEqual(self.data['frozen_corpus']['coverage'], {'PREDICATE': 1, 'RELATED_MEASURE': 12, 'CROSSWALK_ONLY': 38, 'HASH_ONLY': 366})
        self.assertTrue(all(p['source_bytes'] == 'UNRESOLVED' for p in self.data['provisions']))

    def test_changed_record_is_rejected_even_when_outer_digest_is_recomputed(self):
        changed = copy.deepcopy(self.data)
        changed['provisions'][0]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'root mismatch'):
            validate(changed)

    def test_envelope_tamper_is_rejected(self):
        envelope = json.loads((HERE / 'register.json').read_text())
        envelope['register']['sources'][0]['name'] = 'Changed'
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder) / 'record.json'
            p.write_text(json.dumps(envelope))
            with self.assertRaisesRegex(ValueError, 'digest mismatch'):
                load_register(p)

    def test_duplicate_ids_and_unknown_article_refused(self):
        d = copy.deepcopy(self.data); d['sources'].append(d['sources'][0])
        with self.assertRaisesRegex(ValueError, 'Duplicate'): validate(d)
        d = copy.deepcopy(self.data); d['sources'][0]['candidate_articles'] = [999]
        with self.assertRaisesRegex(ValueError, 'Unknown charter'): validate(d)

    def test_external_source_cannot_be_silently_adopted(self):
        d = copy.deepcopy(self.data); d['sources'][0]['adoption'] = 'APPROVED'
        with self.assertRaisesRegex(ValueError, 'silently adopted'): validate(d)

    def test_missing_legal_text_cannot_be_promoted_to_verified(self):
        d = copy.deepcopy(self.data); d['provisions'][0]['source_bytes'] = 'VERIFIED'
        with self.assertRaisesRegex(ValueError, 'no recovered'): validate(d)

    def test_exact_provision_unknown_and_invalid(self):
        p = provision(self.data, '32024R1689:50')
        self.assertEqual(p['legal_applicability'], 'NOT_DETERMINED')
        for bad in ['../../etc/passwd', '32024R1689:9999', None]:
            with self.assertRaises(ValueError): provision(self.data, bad)

    def test_search_limits_do_not_allow_type_coercion(self):
        self.assertGreater(search(self.data, 'forum')['total'], 0)
        for limit in [0, 51, True, '20']:
            with self.assertRaises(ValueError): search(self.data, '', limit)

    def test_stale_revision_proposal_fails(self):
        with self.assertRaisesRegex(ValueError, 'changed'):
            propose(self.data, 'ietf', '0' * 64, 'Add a specific public review period.')

    def test_valid_draft_binds_revision_without_effect_or_mutation(self):
        before = digest(self.data)
        p = propose(self.data, 'ietf', before, 'Add a specific public review period.')
        self.assertEqual(digest(p['proposal']), p['sha256'])
        self.assertEqual(p['proposal']['register_sha256'], before)
        self.assertEqual(p['proposal']['state'], 'DRAFT_NOT_SUBMITTED')
        for key in ['human_approval', 'may_execute', 'changes_live_policy']:
            self.assertIs(p['proposal'][key], False)
        self.assertEqual(digest(self.data), before)

    def test_tool_cannot_smuggle_authority_parameters(self):
        with self.assertRaisesRegex(ValueError, 'unsupported'):
            call_tool(self.data, 'charter_sources', {'approve': True})
        with self.assertRaisesRegex(ValueError, 'Unknown tool'):
            call_tool(self.data, 'execute', {})

    def test_real_stdio_transport_success_errors_and_notification(self):
        requests = [
            {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'test', 'version': '1'}}},
            {'jsonrpc': '2.0', 'method': 'notifications/initialized'},
            {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list'},
            {'jsonrpc': '2.0', 'id': 3, 'method': 'tools/call', 'params': {'name': 'charter_provision', 'arguments': {'id': '32024R1689:50'}}},
            {'jsonrpc': '2.0', 'id': 4, 'method': 'tools/call', 'params': {'name': 'execute', 'arguments': {}}},
            {'jsonrpc': '2.0', 'id': 5, 'method': 'missing'},
            {'jsonrpc': '2.0', 'id': 6, 'method': 'tools/call', 'params': {'name': 'charter_prepare_change', 'arguments': {'source_id': 'ietf', 'expected_register_sha256': digest(self.data), 'rationale': 'Add a specific public review period.'}}}]
        before = (HERE / 'register.json').read_bytes()
        p = subprocess.run([sys.executable, '-B', str(HERE / 'mcp_server.py')], input='\n'.join(map(json.dumps, requests))+'\n{invalid\n', capture_output=True, text=True, timeout=10)
        self.assertEqual(p.returncode, 0, p.stderr)
        rows = [json.loads(line) for line in p.stdout.splitlines()]
        self.assertEqual(len(rows), 7)
        self.assertEqual(rows[0]['result']['protocolVersion'], '2025-06-18')
        self.assertEqual(len(rows[1]['result']['tools']), 3)
        self.assertFalse(rows[2]['result']['isError'])
        self.assertTrue(rows[3]['result']['isError'])
        self.assertEqual(rows[4]['error']['code'], -32601)
        self.assertFalse(json.loads(rows[5]['result']['content'][0]['text'])['proposal']['may_execute'])
        self.assertEqual(rows[6]['error']['code'], -32700)
        self.assertEqual((HERE / 'register.json').read_bytes(), before)


if __name__ == '__main__': unittest.main()
