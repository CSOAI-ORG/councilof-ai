"""Offline Git fixtures. No uploads, credentials, production edits or external probes."""
import contextlib, io, os, pathlib, re, subprocess, sys, tempfile, unittest
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import mirror_source_guard as guard
import mirror_fanout as mf


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = pathlib.Path(self.tmp.name)
        self.run_git('init', '-q'); self.run_git('config', 'user.name', 'Synthetic test')
        self.run_git('config', 'user.email', 'test@example.invalid')
        self.put('public/interop/a.json', b'{"value":1}\n')
        self.run_git('add', 'public/interop/a.json'); self.run_git('-c','commit.gpgsign=false','commit','-qm','fixture')
        self.run_git('update-ref', 'refs/remotes/origin/master', 'HEAD')
    def tearDown(self): self.tmp.cleanup()
    def run_git(self, *args):
        return subprocess.check_output(['git','-C',str(self.root),*args], stderr=subprocess.STDOUT)
    def put(self, rel, data):
        p=self.root/rel; p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);return p
    def check(self, paths=None):
        return guard.approved_source(self.root, paths or ['public/interop/a.json'], mf.PUBLISH_GLOBS, mf.PUBLISH_EXCLUDE)
    def add_commit(self, rel):
        self.run_git('add', rel);self.run_git('-c','commit.gpgsign=false','commit','-qm','fixture update')
        self.run_git('update-ref','refs/remotes/origin/master','HEAD')
    def test_clean(self): self.assertEqual(len(self.check()[1]),1)
    def test_untracked_explicit(self):
        self.put('public/interop/new.json',b'{}')
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/new.json'])
    def test_ignored_untracked(self):
        self.put('.gitignore',b'public/interop/new.json\n');self.add_commit('.gitignore')
        self.put('public/interop/new.json',b'{}')
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/new.json'])
    def test_tracked_edit(self):
        self.put('public/interop/a.json',b'changed')
        with self.assertRaises(guard.SourceRefused): self.check()
    def test_staged_edit(self):
        self.put('public/interop/a.json',b'changed');self.run_git('add','public/interop/a.json')
        with self.assertRaises(guard.SourceRefused): self.check()
    def test_unapproved_commit(self):
        self.put('public/interop/a.json',b'changed');self.run_git('add','public/interop/a.json')
        self.run_git('-c','commit.gpgsign=false','commit','-qm','not approved')
        with self.assertRaisesRegex(guard.SourceRefused,'LOCAL_ORIGIN'): self.check()
    def test_missing_approved_ref(self):
        self.run_git('update-ref','-d','refs/remotes/origin/master')
        with self.assertRaises(guard.SourceRefused): self.check()
    def test_non_git(self):
        with tempfile.TemporaryDirectory() as other:
            with self.assertRaises(guard.SourceRefused): guard.approved_source(other,['a'],[],[])
    def test_escape(self):
        with self.assertRaises(guard.SourceRefused): self.check(['../outside.json'])
    def test_absolute(self):
        with self.assertRaises(guard.SourceRefused): self.check([str(self.root/'public/interop/a.json')])
    def test_duplicates(self):
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/a.json']*2)
    def test_empty(self):
        with self.assertRaises(guard.SourceRefused): guard.approved_source(self.root,[],mf.PUBLISH_GLOBS,mf.PUBLISH_EXCLUDE)
    def test_generated_manifest(self):
        self.put('public/interop/mirror-manifest.json',b'{}')
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/mirror-manifest.json'])
    def test_sidecar_not_profile(self):
        self.put('public/interop/a.json.ots',b'not a proof');self.add_commit('public/interop/a.json.ots')
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/a.json.ots'])
    def test_symlink(self):
        (self.root/'public/interop/link.json').symlink_to('a.json');self.add_commit('public/interop/link.json')
        with self.assertRaises(guard.SourceRefused): self.check(['public/interop/link.json'])
    def test_spaces(self):
        self.put('public/interop/with space.json',b'{}');self.add_commit('public/interop/with space.json')
        self.assertEqual(len(self.check(['public/interop/with space.json'])[1]),1)
    def test_missing_git_fails_closed(self):
        with patch.object(guard.subprocess,'run',side_effect=FileNotFoundError()):
            with self.assertRaisesRegex(guard.SourceRefused,'UNAVAILABLE'):self.check()
    def test_git_timeout_fails_closed(self):
        with patch.object(guard.subprocess,'run',side_effect=subprocess.TimeoutExpired('git',15)):
            with self.assertRaisesRegex(guard.SourceRefused,'UNAVAILABLE'):self.check()
    def test_snapshot_survives_later_working_edit(self):
        _,blobs=self.check();self.put('public/interop/a.json',b'new uncommitted bytes')
        with guard.committed_snapshot(self.root,blobs) as frozen:
            self.assertEqual((frozen/'public/interop/a.json').read_bytes(),b'{"value":1}\n')
            self.assertEqual((self.root/'public/interop/a.json').read_bytes(),b'new uncommitted bytes')
        self.assertFalse(frozen.exists())
    def test_snapshot_failure(self):
        with self.assertRaises(guard.SourceRefused):
            with guard.committed_snapshot(self.root,{'public/interop/a.json':'0'*40}):pass
    def test_cli_positive_offline(self):
        run=subprocess.run([sys.executable,str(pathlib.Path(mf.__file__)),
                            '--root',str(self.root),'--artifact','public/interop/a.json',
                            '--check-inputs','--surface','INVALID_IF_NETWORK_PHASE_REACHED'],
                           capture_output=True,text=True,timeout=15)
        self.assertEqual(run.returncode,0,run.stderr)
        self.assertIn('APPROVED_INPUTS_CHECKED',run.stdout)
        self.assertNotIn('anonymous readback probe',run.stdout)
    def test_explicit_publish_cannot_bypass_guard(self):
        self.put('public/interop/new.json',b'{}')
        with patch.object(mf,'publish_hf') as upload,patch.object(mf,'build_manifest') as probe:
            with contextlib.redirect_stderr(io.StringIO()):
                result=mf.main(['--root',str(self.root),'--artifact','public/interop/new.json','--publish-hf'])
            self.assertEqual(result,4);upload.assert_not_called();probe.assert_not_called()
    def test_check_inputs_does_not_publish(self):
        with patch.object(mf,'publish_hf') as upload,patch.object(mf,'build_manifest') as probe:
            with contextlib.redirect_stdout(io.StringIO()):
                result=mf.main(['--root',str(self.root),'--artifact','public/interop/a.json','--check-inputs','--publish-hf'])
            self.assertEqual(result,0);upload.assert_not_called();probe.assert_not_called()
    def test_nested_file_outside_glob(self):
        self.put('public/interop/nested/a.json',b'{}');self.add_commit('public/interop/nested/a.json')
        with self.assertRaises(guard.SourceRefused):self.check(['public/interop/nested/a.json'])
    def test_no_implicit_default_for_git_failure(self):
        with patch.object(guard.subprocess,'run',return_value=subprocess.CompletedProcess('git',128,b'',b'error')):
            with self.assertRaises(guard.SourceRefused):self.check()

    def test_output_cannot_overwrite_source(self):
        with self.assertRaises(guard.SourceRefused):guard.check_manifest_output(self.root,'public/interop/a.json')
    def test_generated_output_allowed(self):guard.check_manifest_output(self.root,'public/interop/mirror-manifest.json')
    def test_git_metadata_not_output(self):
        with self.assertRaises(guard.SourceRefused):guard.check_manifest_output(self.root,'.git/config')
    def test_symlink_not_output(self):
        p=self.root/'output.json';p.symlink_to(self.root/'public/interop/a.json')
        with self.assertRaises(guard.SourceRefused):guard.check_manifest_output(self.root,str(p))

if __name__=='__main__':unittest.main(verbosity=2)
