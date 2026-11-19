"""Research-tool acceptance for the consumed targeted-invalidation repair."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import memory_ui_tools as tools

class MemoryAdoptionTests(unittest.TestCase):
    def test_installed_cache_controls_execute(self):
        r=tools.targeted_invalidation_replay()
        self.assertEqual(r['state'],'DECLARED_CONTROLS_PASSED')
        self.assertEqual(len(r['cases']),5)
        self.assertTrue(all(x['passed'] for x in r['cases']))
    def test_no_stale_result_retained_in_race_controls(self):
        rows={x['case']:x for x in tools.targeted_invalidation_replay()['cases']}
        self.assertEqual(rows['during-compute']['observed'],'INVALIDATED_DURING_COMPUTE')
        self.assertEqual(rows['during-hit']['observed'],'INVALIDATED_DURING_LOOKUP')
        self.assertEqual(rows['during-compute']['stored_results'],0)
        self.assertEqual(rows['during-hit']['stored_results'],0)
    def test_unrelated_work_and_fresh_recovery_preserved(self):
        rows={x['case']:x for x in tools.targeted_invalidation_replay()['cases']}
        for name in ['unrelated-source','other-tenant']:
            self.assertEqual(rows[name]['observed'],'REUSED_RESULT')
        self.assertEqual(rows['fresh-after-invalidation']['observed'],'FRESH_RESULT')
    def test_exact_cache_source_digest_retained(self):
        r=tools.targeted_invalidation_replay()
        actual=hashlib.sha256(Path(tools.__file__).with_name('memory_venturi.py').read_bytes()).hexdigest()
        self.assertEqual(r['cache_source_sha256'],actual)
    def test_ephemeral_directory_really_removed(self):
        real=tempfile.TemporaryDirectory;paths=[]
        def create(*args,**kwargs):
            x=real(*args,**kwargs);paths.append(Path(x.name));return x
        with patch.object(tools.tempfile,'TemporaryDirectory',side_effect=create):
            tools.targeted_invalidation_replay()
        self.assertEqual(len(paths),1)
        self.assertTrue(all(not p.exists() for p in paths))
    def test_no_auth_training_or_atomicity_claim(self):
        r=tools.targeted_invalidation_replay()
        self.assertFalse(r['real_user_authorisation'])
        self.assertFalse(r['cross_process_atomicity_claimed'])
        self.assertEqual(r['provider_calls'],0)
        self.assertEqual(r['source_revision_changes'],0)
    def test_repeat_has_same_declared_outcomes(self):
        a=tools.targeted_invalidation_replay();b=tools.targeted_invalidation_replay()
        self.assertEqual(a,b)

if __name__=='__main__':unittest.main(verbosity=2)
