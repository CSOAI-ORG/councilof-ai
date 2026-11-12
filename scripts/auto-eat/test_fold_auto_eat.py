#!/usr/bin/env python3
"""Exercise the real fold/check paths on disposable, unsigned fixture data.

No public feed, ledger, network, signing key or model is used by this suite.
"""
from __future__ import annotations

import contextlib
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as c
import fold_auto_eat as fold


class FoldTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="eat-fold-test-")
        self.root = Path(self.tmp.name)
        self.interop = self.root / "public" / "interop"
        self.feed = self.interop / "auto-eat"
        self.feed.mkdir(parents=True)
        self.compact = self.feed / "cards-compact.json"
        self.ledger = self.interop / "ledger-cards-compact.json"
        self.patcher = patch.multiple(c, INTEROP=self.interop, FEED=self.feed,
                                     COMPACT=self.compact, LEDGER_COMPACT=self.ledger)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.addCleanup(self.tmp.cleanup)
        self.surface = "autoeat.fixture"
        self.payload = {"kind":"fixture", "count":1, "flags":{"auto_measured":False}}
        self.atom = {"schema":fold.SCHEMA, "surface":self.surface, "subject":"synthetic fixture",
                     "as_of":"2026-11-12T00:00:00Z", "source_urls":[], "payload":self.payload,
                     "sig_ed25519":None, "state":"queued", "unmeasured":["real-world correctness"]}
        self.source = self.feed / "card-autoeat-fixture-unsigned.json"
        self.destination = self.interop / "ledger-card-autoeat-fixture-unsigned.json"
        self.write(self.compact, {self.surface:self.payload})
        self.write(self.source, self.atom)
        self.write(self.ledger, {"other.owner":{"count":7}})

    @staticmethod
    def write(path, value):
        path.write_text(json.dumps(value), encoding="utf-8")

    def run_fold(self, check=False):
        output=io.StringIO()
        with patch.object(sys, "argv", ["fold_auto_eat.py"] + (["--check"] if check else [])), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            rc=fold.main()
        return rc,output.getvalue()

    def snapshot(self):
        return {str(p.relative_to(self.root)):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def installed(self):
        self.write(self.ledger,{self.surface:self.payload,"other.owner":{"count":7}})
        self.write(self.destination,self.atom)

    def assert_refused_without_writes(self, check=False):
        before=self.snapshot();code,text=self.run_fold(check)
        self.assertEqual(code,1,text);self.assertEqual(before,self.snapshot());return text

    def test_missing_compact_not_empty_success(self):
        self.compact.unlink();self.assert_refused_without_writes(True)

    def test_malformed_compact_not_empty_success(self):
        self.compact.write_text('{broken');self.assert_refused_without_writes(True)

    def test_confirmed_empty_is_noop(self):
        self.write(self.compact,{});before=self.snapshot();self.assertEqual(self.run_fold(True)[0],0);self.assertEqual(self.run_fold()[0],0);self.assertEqual(before,self.snapshot())

    def test_nonobject_compact_refused(self):
        for value in [[],None,False,1,"data"]:
            with self.subTest(value=value):self.write(self.compact,value);self.assert_refused_without_writes(True)

    def test_duplicate_keys_in_compact_refused(self):
        self.compact.write_text('{"autoeat.fixture":{},"autoeat.fixture":{}}');self.assert_refused_without_writes(True)

    def test_nonfinite_json_refused(self):
        for literal in ['NaN','Infinity','-Infinity','1e999']:
            with self.subTest(literal=literal):self.compact.write_text('{"autoeat.fixture":{"x":'+literal+'}}');self.assert_refused_without_writes(True)

    def test_invalid_utf8_refused(self):
        self.compact.write_bytes(b'{"a":"\xff"}');self.assert_refused_without_writes(True)

    def test_good_fold_and_readback(self):
        self.assertEqual(self.run_fold()[0],0)
        self.assertEqual(json.loads(self.destination.read_text()),self.atom)
        ledger=json.loads(self.ledger.read_text());self.assertEqual(ledger[self.surface],self.payload);self.assertEqual(ledger['other.owner'],{'count':7})
        self.assertEqual(self.run_fold(True)[0],0)

    def test_check_is_readonly(self):
        self.assert_refused_without_writes(True)
        self.installed();before=self.snapshot();self.assertEqual(self.run_fold(True)[0],0);self.assertEqual(before,self.snapshot())

    def test_corrupt_destination_cannot_pass(self):
        self.installed();self.destination.write_text('{corrupt');self.assert_refused_without_writes(True)

    def test_altered_destination_metadata_is_drift(self):
        self.installed();altered=copy.deepcopy(self.atom);altered['subject']='different source';self.write(self.destination,altered)
        self.assert_refused_without_writes(True);self.assertEqual(self.run_fold()[0],0);self.assertEqual(json.loads(self.destination.read_text()),self.atom)

    def test_altered_destination_payload_is_drift(self):
        self.installed();altered=copy.deepcopy(self.atom);altered['payload']['count']=2;self.write(self.destination,altered)
        self.assert_refused_without_writes(True)

    def test_mismatched_source_payload_refused(self):
        self.installed();wrong=copy.deepcopy(self.atom);wrong['payload']['count']=2;self.write(self.source,wrong)
        self.assert_refused_without_writes(True);self.assert_refused_without_writes(False)

    def test_atom_identity_not_rebound(self):
        atom=dict(self.atom,surface='autoeat.other');self.write(self.source,atom);self.assert_refused_without_writes()

    def test_signed_source_refused(self):
        self.write(self.source,dict(self.atom,sig_ed25519='not-a-null-signature'));self.assert_refused_without_writes()

    def test_missing_signature_field_refused(self):
        atom=dict(self.atom);del atom['sig_ed25519'];self.write(self.source,atom);self.assert_refused_without_writes()

    def test_measured_source_state_refused(self):
        self.write(self.source,dict(self.atom,state='MEASURED'));self.assert_refused_without_writes()

    def test_true_auto_measurement_refused(self):
        p={'flags':{'auto_measured':True}};self.write(self.compact,{self.surface:p});self.write(self.source,dict(self.atom,payload=p));self.assert_refused_without_writes()

    def test_signed_destination_never_overwritten(self):
        self.installed();self.write(self.destination,dict(self.atom,sig_ed25519='retained-evidence'));self.assert_refused_without_writes()

    def test_destination_identity_never_overwritten(self):
        self.installed();self.write(self.destination,dict(self.atom,surface='autoeat.someone-else'));self.assert_refused_without_writes()

    def test_malformed_ledger_refused(self):
        self.ledger.write_text('{broken');self.assert_refused_without_writes()

    def test_duplicate_atom_keys_refused(self):
        self.source.write_text('{"surface":"autoeat.fixture","surface":"autoeat.other"}');self.assert_refused_without_writes()

    def test_duplicate_ledger_keys_refused(self):
        self.ledger.write_text('{"x":1,"x":2}');self.assert_refused_without_writes()

    def test_missing_ledger_can_be_created_but_not_checked_green(self):
        self.ledger.unlink();self.assert_refused_without_writes(True);self.assertEqual(self.run_fold()[0],0);self.assertEqual(self.run_fold(True)[0],0)

    def test_missing_source_not_success(self):
        self.source.unlink();self.assert_refused_without_writes(True)

    def test_unique_legacy_filename_preserved_identity(self):
        renamed=self.feed/'card-historical-name-unsigned.json';self.source.rename(renamed);self.assertEqual(self.run_fold()[0],0);self.assertEqual(json.loads(self.destination.read_text())['surface'],self.surface)

    def test_ambiguous_legacy_files_refused(self):
        self.source.unlink()
        for n in ['one','two']:self.write(self.feed/('card-'+n+'-unsigned.json'),self.atom)
        self.assert_refused_without_writes()

    def test_bare_ledger_delegation_is_noop(self):
        self.source.unlink();self.write(self.ledger,{'fixture':self.payload});before=self.snapshot();code,text=self.run_fold(True);self.assertEqual(code,0);self.assertIn('DELEGATED',text);self.assertEqual(before,self.snapshot())

    def test_changed_bare_ledger_not_delegated(self):
        self.source.unlink();self.write(self.ledger,{'fixture':{'different':True}});self.assert_refused_without_writes(True)

    def test_mixed_invalid_batch_has_no_partial_writes(self):
        big={'text':'x'*3100};self.write(self.compact,{self.surface:self.payload,'autoeat.toobig':big});self.write(self.feed/'card-autoeat-toobig-unsigned.json',dict(self.atom,surface='autoeat.toobig',payload=big));self.assert_refused_without_writes()

    def test_small_multibyte_payload_gate_uses_bytes(self):
        big={'text':'雪'*1100};self.write(self.compact,{self.surface:big});self.write(self.source,dict(self.atom,payload=big));self.assert_refused_without_writes()

    def test_invalid_surface_path_refused(self):
        for name in ['autoeat../outside','autoeat.a/../b','autoeat./absolute','autoeat.a\\b']:
            with self.subTest(name=name):self.write(self.compact,{name:self.payload});self.assert_refused_without_writes()

    def test_surface_filename_collisions_refused(self):
        self.write(self.compact,{'autoeat.a.b':self.payload,'autoeat.a-b':self.payload});self.write(self.feed/'card-autoeat-a-b-unsigned.json',dict(self.atom,surface='autoeat.a.b'));self.assert_refused_without_writes()

    def test_symlink_atom_refused(self):
        target=self.feed/'saved.json';self.source.rename(target);self.source.symlink_to(target);self.assert_refused_without_writes()

    def test_symlink_destination_refused(self):
        target=self.interop/'other-evidence.json';self.write(target,self.atom);self.destination.symlink_to(target);self.assert_refused_without_writes()

    def test_bounds_checked_before_parse(self):
        with patch.object(fold,'MAX_ATOM_BYTES',10):self.assert_refused_without_writes()

    def test_noop_repeat_preserves_bytes_and_timestamp(self):
        self.assertEqual(self.run_fold()[0],0);before=self.snapshot();times={str(p):p.stat().st_mtime_ns for p in [self.destination,self.ledger]}
        self.assertEqual(self.run_fold()[0],0);self.assertEqual(before,self.snapshot());self.assertEqual(times,{str(p):p.stat().st_mtime_ns for p in [self.destination,self.ledger]})

    def test_existing_lock_stays_held(self):
        lock=self.interop/'.auto-eat-fold.lock';lock.write_text('another owner');self.assert_refused_without_writes();self.assertEqual(lock.read_text(),'another owner')

    def test_source_changed_between_plan_and_write_refused(self):
        original=fold._stable;before=self.ledger.read_bytes()
        def changed(snapshots):self.source.write_text('{}');original(snapshots)
        with patch.object(fold,'_stable',side_effect=changed):self.assertEqual(self.run_fold()[0],1)
        self.assertEqual(self.ledger.read_bytes(),before);self.assertFalse(self.destination.exists());self.assertFalse((self.interop/'.auto-eat-fold.lock').exists())

    def test_io_failure_nonzero_then_rerun_recovers(self):
        atomic=fold._atomic_write;calls=[]
        def fail_ledger(path,data):
            calls.append(path)
            if path==self.ledger:raise OSError('fixture disk failure')
            atomic(path,data)
        with patch.object(fold,'_atomic_write',side_effect=fail_ledger):self.assertEqual(self.run_fold()[0],1)
        self.assertEqual(self.run_fold(True)[0],1);self.assertEqual(self.run_fold()[0],0);self.assertEqual(self.run_fold(True)[0],0)

    def test_numeric_types_not_laundered(self):
        self.installed();different=copy.deepcopy(self.atom);different['payload']['count']=True;self.write(self.source,different);self.assert_refused_without_writes(True)


if __name__ == '__main__':
    unittest.main(verbosity=2)
