#!/usr/bin/env python3
"""No network, keys or real feed writes: regression tests of the actual generator."""
from __future__ import annotations
import contextlib
import copy
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import common as c
import gen_status as g

class StatusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.feed = self.root / 'public/interop/auto-eat'
        self.feed.mkdir(parents=True)
        self.mapping = dict(FEED=self.feed, INTEROP=self.feed.parent,
            QUEUE=self.feed/'queue.jsonl', PROBED=self.feed/'probed.json',
            COMPACT=self.feed/'cards-compact.json', STATUS_JSON=self.feed/'status.json',
            STATUS_MD=self.root/'scripts/auto-eat/STATUS.md')
        self.patches = [patch.object(c, key, value) for key, value in self.mapping.items()]
        for p in self.patches:p.start()
        c.STATUS_MD.parent.mkdir(parents=True)
        c.QUEUE.write_text(json.dumps({'kind':'hf-model','id':'fixture/model','status':'DISCOVERED'})+'\n')
        c.PROBED.write_text('["hf-model:fixture/model"]')
        self.payload = {'as_of':'2026-09-12T06:49:50Z','flags':{'auto_measured':False},
                        'sample':{'n_probed':1,'live':1,'placeholder':0,'held':0,'dead':0,'uncheckable':0,'live_fraction_of_probed':1.0}}
        c.COMPACT.write_text('{}')
        self.write_payload(self.payload)
        c.STATUS_JSON.write_text('previous JSON report\n')
        c.STATUS_MD.write_text('previous Markdown report\n')
    def tearDown(self):
        for p in reversed(self.patches):p.stop()
        self.temp.cleanup()
    def write_payload(self,payload,surface='autoeat.hf.newmodels'):
        compact=json.loads(c.COMPACT.read_text());compact[surface]=payload
        c.COMPACT.write_text(json.dumps(compact))
        atom={'surface':surface,'payload':payload,'as_of':payload.get('as_of'),
              'sig_ed25519':None,'state':'queued'}
        (self.feed/('card-'+c.slug(surface)+'-unsigned.json')).write_text(json.dumps(atom))
    def run_status(self):
        with contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):return g.main()
    def refused_without_report_write(self):
        before=[c.STATUS_JSON.read_bytes(),c.STATUS_MD.read_bytes()]
        self.assertEqual(self.run_status(),1)
        self.assertEqual([c.STATUS_JSON.read_bytes(),c.STATUS_MD.read_bytes()],before)
        self.assertFalse(list(self.root.rglob('.eat-status-*')))
    def test_valid_source_counts_and_original_timestamp(self):
        self.assertEqual(self.run_status(),0);s=json.loads(c.STATUS_JSON.read_text())
        self.assertEqual(s['queue_discovered_total'],1);self.assertEqual(s['atoms_staged'],1)
        self.assertEqual(s['staged_source_times']['latest'],'2026-09-12T06:49:50Z')
        self.assertEqual(s['loop_liveness'],'NOT_ESTABLISHED_BY_SAVED_FILES')
        self.assertEqual(s['signature_verification'],'NOT_PERFORMED');self.assertIsNone(s['last_signed_batch'])
    def test_invalid_queue_json_preserves_last_report(self):
        c.QUEUE.write_text('{bad\n');self.refused_without_report_write()
    def test_invalid_compact_json_preserves_last_report(self):
        c.COMPACT.write_text('{bad');self.refused_without_report_write()
    def test_invalid_probed_json_preserves_last_report(self):
        c.PROBED.write_text('{bad');self.refused_without_report_write()
    def test_missing_queue_is_not_empty_success(self):
        c.QUEUE.unlink();self.refused_without_report_write()
    def test_queue_nonobject(self):
        c.QUEUE.write_text('true\n');self.refused_without_report_write()
    def test_queue_duplicate_identity(self):
        c.QUEUE.write_text(c.QUEUE.read_text()*2);self.refused_without_report_write()
    def test_queue_promoted_state(self):
        r=json.loads(c.QUEUE.read_text());r['status']='MEASURED';c.QUEUE.write_text(json.dumps(r)+'\n');self.refused_without_report_write()
    def test_queue_control_characters(self):
        r=json.loads(c.QUEUE.read_text());r['kind']='bad\nkind';c.QUEUE.write_text(json.dumps(r)+'\n');self.refused_without_report_write()
    def test_probed_object_not_list(self):
        c.PROBED.write_text('{}');self.refused_without_report_write()
    def test_probed_duplicate(self):
        c.PROBED.write_text('["hf-model:fixture/model","hf-model:fixture/model"]');self.refused_without_report_write()
    def test_probed_unknown_identity(self):
        c.PROBED.write_text('["hf-model:missing"]');self.refused_without_report_write()
    def test_probed_nonstring(self):
        c.PROBED.write_text('[true]');self.refused_without_report_write()
    def test_duplicate_json_key(self):
        c.COMPACT.write_text('{"a":{},"a":{}}');self.refused_without_report_write()
    def test_nonfinite_json(self):
        for value in ['NaN','Infinity','1e999']:
            with self.subTest(value=value):
                c.COMPACT.write_text('{"x":'+value+'}');self.refused_without_report_write()
    def test_bad_utf8(self):
        c.QUEUE.write_bytes(b'\xff');self.refused_without_report_write()
    def test_negative_probe_count(self):
        self.payload['sample']['live']=-1;self.write_payload(self.payload);self.refused_without_report_write()
    def test_boolean_probe_count(self):
        self.payload['sample']['live']=True;self.write_payload(self.payload);self.refused_without_report_write()
    def test_float_probe_count(self):
        self.payload['sample']['n_probed']=1.0;self.write_payload(self.payload);self.refused_without_report_write()
    def test_live_exceeds_denominator(self):
        self.payload['sample']['live']=2;self.write_payload(self.payload);self.refused_without_report_write()
    def test_inconsistent_state_total(self):
        self.payload['sample']['held']=1;self.write_payload(self.payload);self.refused_without_report_write()
    def test_wrong_fraction(self):
        self.payload['sample']['live_fraction_of_probed']=0.5;self.write_payload(self.payload);self.refused_without_report_write()
    def test_boolean_fraction(self):
        self.payload['sample']['live_fraction_of_probed']=True;self.write_payload(self.payload);self.refused_without_report_write()
    def test_partial_count_pair(self):
        del self.payload['sample']['n_probed'];self.write_payload(self.payload);self.refused_without_report_write()
    def test_compact_atom_payload_difference(self):
        p=self.feed/'card-autoeat-hf-newmodels-unsigned.json';a=json.loads(p.read_text());a['payload']['extra']='different';p.write_text(json.dumps(a));self.refused_without_report_write()
    def test_missing_atom(self):
        (self.feed/'card-autoeat-hf-newmodels-unsigned.json').unlink();self.refused_without_report_write()
    def test_orphan_atom(self):
        (self.feed/'card-autoeat-extra-unsigned.json').write_text('{}');self.refused_without_report_write()
    def test_atom_signature_field_not_present(self):
        p=self.feed/'card-autoeat-hf-newmodels-unsigned.json';a=json.loads(p.read_text());del a['sig_ed25519'];p.write_text(json.dumps(a));self.refused_without_report_write()
    def test_signed_staged_atom_refused(self):
        p=self.feed/'card-autoeat-hf-newmodels-unsigned.json';a=json.loads(p.read_text());a['sig_ed25519']='unverified';p.write_text(json.dumps(a));self.refused_without_report_write()
    def test_atom_promoted_state_refused(self):
        p=self.feed/'card-autoeat-hf-newmodels-unsigned.json';a=json.loads(p.read_text());a['state']='measured';p.write_text(json.dumps(a));self.refused_without_report_write()
    def test_atom_time_mismatch(self):
        p=self.feed/'card-autoeat-hf-newmodels-unsigned.json';a=json.loads(p.read_text());a['as_of']='2026-11-12';p.write_text(json.dumps(a));self.refused_without_report_write()
    def test_measured_flag_refused(self):
        self.payload['flags']['auto_measured']=True;self.write_payload(self.payload);self.refused_without_report_write()
    def test_surface_path_refused(self):
        c.COMPACT.write_text(json.dumps({'autoeat.../escape':self.payload}));self.refused_without_report_write()
    def test_slug_collision(self):
        self.write_payload(self.payload,'autoeat.a.b');self.write_payload(self.payload,'autoeat.a-b');self.refused_without_report_write()
    def test_oversized_payload(self):
        self.payload['extra']='x'*3073;self.write_payload(self.payload);self.refused_without_report_write()
    def test_input_file_size_bound(self):
        with patch.object(g,'MAX_QUEUE_BYTES',1):self.refused_without_report_write()
    def test_invalid_calendar_date(self):
        self.payload['as_of']='2026-02-30';self.write_payload(self.payload);self.refused_without_report_write()
    def test_naive_timestamp(self):
        self.payload['as_of']='2026-09-12T06:49:50';self.write_payload(self.payload);self.refused_without_report_write()
    def test_legacy_samples_excluded_not_mixed(self):
        self.write_payload({'as_of':'2026-09-01','flags':{'auto_measured':False},'sample':{'n':26,'n_live':3}},'autoeat.swift.census')
        s=g.build_status();self.assertEqual(s['atoms_staged'],2);self.assertEqual(s['staged_live_of_probed'],{'live':1,'probed':1,'fraction':1.0})
        self.assertEqual(s['probe_fraction_scope']['excluded_non_probe_surfaces'],['autoeat.swift.census'])
    def test_fake_signature_is_presence_not_verified(self):
        p=c.INTEROP/'ledger-card-autoeat-fixture.json';p.write_text(json.dumps({'surface':'autoeat.fixture','as_of':'2026-09-01T00:00:00Z','sha256':'0'*64,'sig_ed25519':'NOT-A-SIGNATURE'}))
        self.assertEqual(self.run_status(),0);s=json.loads(c.STATUS_JSON.read_text());self.assertIsNone(s['last_signed_batch']);self.assertEqual(s['signature_present_candidates'],1)
        self.assertEqual(s['signature_verification'],'NOT_PERFORMED');self.assertNotIn('signed green',c.STATUS_MD.read_text())
    def test_signature_flag_not_string_refused(self):
        p=c.INTEROP/'ledger-card-autoeat-fixture.json';p.write_text(json.dumps({'sig_ed25519':True}));self.refused_without_report_write()
    def test_empty_valid_snapshot_is_distinct_from_missing(self):
        c.QUEUE.write_text('');c.PROBED.write_text('[]');c.COMPACT.write_text('{}');(self.feed/'card-autoeat-hf-newmodels-unsigned.json').unlink()
        self.assertEqual(self.run_status(),0);s=json.loads(c.STATUS_JSON.read_text());self.assertEqual(s['atoms_staged'],0);self.assertIsNone(s['staged_live_of_probed']['fraction'])
    def test_symlink_input_refused(self):
        source=self.root/'real-probed.json';source.write_text(c.PROBED.read_text());c.PROBED.unlink();c.PROBED.symlink_to(source);self.refused_without_report_write()
    def test_source_changes_mid_read_fail(self):
        real=g._bytes;count={'n':0}
        def read(path,limit):
            if path==c.QUEUE:
                count['n']+=1
                if count['n']>1:return real(path,limit)+b'\n'
            return real(path,limit)
        with patch.object(g,'_bytes',side_effect=read):self.refused_without_report_write()
    def test_no_network_or_signing_called(self):
        with patch.object(c,'http_get',side_effect=AssertionError('network')),patch.object(c,'http_post_json',side_effect=AssertionError('network')):
            self.assertEqual(self.run_status(),0)
    def test_hashes_bound_to_input_bytes(self):
        s=g.build_status();self.assertEqual(s['input_sha256']['queue.jsonl'],hashlib.sha256(c.QUEUE.read_bytes()).hexdigest())
    def test_staging_failure_preserves_previous_reports(self):
        real=g.tempfile.mkstemp;count={'n':0}
        def fail_second(*args,**kwargs):
            count['n']+=1
            if count['n']==2:raise OSError('simulated staging failure')
            return real(*args,**kwargs)
        with patch.object(g.tempfile,'mkstemp',side_effect=fail_second):self.refused_without_report_write()

if __name__=='__main__':unittest.main(verbosity=1)
