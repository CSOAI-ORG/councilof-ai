import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest import TestCase, mock

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('wrapper', ROOT / 'scripts/venturi/wrapper.py')
wrapper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wrapper)
SRC = 'https://example.org/evidence.json'
AXES = wrapper.pack_map()['agent-economy']['gspc_profile']

def board(status='MEASURED'):
    return json.dumps({'axes': [{'axis': name, 'status': status} for name in AXES]}).encode()

class GateTests(TestCase):
    def test_positive_is_only_source_readback(self):
        with mock.patch.object(wrapper, 'fetch', side_effect=[(b'{"a":1}', 200), (board(), 200)]):
            result = wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org')
        self.assertEqual(result['capsule']['state'], 'completed')
        self.assertEqual(result['venturi']['subject_measurement_state'], 'NOT_RUN')
        self.assertEqual(result['venturi']['constitutional_decision'], 'NOT_RUN')
        self.assertEqual(result['venturi']['delivery_state'], 'NOT_RUN')
        self.assertEqual(result['venturi']['settlement_state'], 'NOT_RUN')
        self.assertEqual(result['capsule']['side_effects'], [])
        self.assertEqual(result['capsule']['receipts'][0]['digest'], wrapper.sha(b'{"a":1}'))


    def test_every_venturi_readback_emits_bounded_reaction_trigger(self):
        with mock.patch.object(wrapper, 'fetch', side_effect=[(b'{"a":1}', 200), (board(), 200)]):
            result = wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org')
        rt=result['venturi']['reaction_trigger']
        self.assertEqual(rt['state'],'QUEUED_SYNTHETIC_SIMULATION')
        self.assertFalse(rt['execution_authority'])
        self.assertFalse(rt['measurement_authority'])
        self.assertIn('COUNTER_REACTION',rt['reaction_classes'])
        self.assertIn('REGIME_BREAK',rt['reaction_classes'])
        self.assertEqual(rt['event']['current_content_id'],result['capsule']['capsule_id'])
        self.assertTrue(rt['dependency_seed'])

    def test_unmeasured_board_axis_suspends(self):
        with mock.patch.object(wrapper, 'fetch', side_effect=[(b'{}', 200), (board('UNMEASURED'), 200)]):
            result = wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org')
        self.assertEqual(result['capsule']['state'], 'suspended')
        self.assertEqual(set(result['venturi']['missing_axes']), set(AXES))

    def test_source_failure_suspends(self):
        with mock.patch.object(wrapper, 'fetch', side_effect=[OSError('offline'), (board(), 200)]):
            result = wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org')
        self.assertEqual(result['capsule']['state'], 'suspended')
        self.assertEqual(len(result['venturi']['source_failures']), 1)

    def test_cli_flag_cannot_authorize_mutation(self):
        with self.assertRaisesRegex(ValueError, 'verified delegation'):
            wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org', True)

    def test_private_or_unbounded_source_rejected(self):
        for url in ('http://example.org/x', 'https://127.0.0.1/x',
                    'https://localhost/x', 'https://user:secret@example.org/x'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                wrapper.build('agent-economy', 'subject', [url], 'did:web:csoai.org')

    def test_empty_source_rejected(self):
        with self.assertRaises(ValueError):
            wrapper.build('agent-economy', 'subject', [], 'did:web:csoai.org')

    def test_schema_validates(self):
        import jsonschema
        with mock.patch.object(wrapper, 'fetch', side_effect=[(b'{}', 200), (board(), 200)]):
            result = wrapper.build('agent-economy', 'subject', [SRC], 'did:web:csoai.org')
        schema = json.loads((ROOT / 'public/interop/work-evidence-capsule-v0.1.schema.json').read_text())
        jsonschema.validate(result['capsule'], schema)

    def test_offline_verifier_rejects_changed_source_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory=Path(tmp); evidence=directory/'evidence'
            with mock.patch.object(wrapper, 'fetch', side_effect=[(b'{"a":1}', 200), (board(), 200)]):
                result=wrapper.build('agent-economy','subject',[SRC],'did:web:csoai.org',evidence_dir=evidence)
            capsule=directory/'result.json'; capsule.write_text(json.dumps(result))
            verifier=ROOT/'scripts/venturi/verify_bundle.py'
            good=subprocess.run([sys.executable,str(verifier),str(capsule)],capture_output=True,text=True)
            self.assertEqual(good.returncode,0,good.stderr)
            first=evidence/result['venturi']['evidence_files'][0]['path']
            first.write_bytes(b'{"a":2}')
            bad=subprocess.run([sys.executable,str(verifier),str(capsule)],capture_output=True,text=True)
            self.assertNotEqual(bad.returncode,0)
            self.assertIn('evidence byte mismatch',bad.stderr)
