import copy
from datetime import datetime, timezone
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import mailops as mo


def spec(**kwargs):
    s={'task':'reply-control','from':'Nick Templeman <nicholas@csoai.org>',
       'to':['reader@example.org'],'subject':'A scoped evidence reply',
       'text':'Hello,\n\nPlease review this specific observation.\n\nNick\n'}
    s.update(kwargs);return s


class FakeDrafts:
    def __init__(self): self.items=[];self.appends=0;self.flags=[];self.fail=False;self.hide=False
    def find(self, manifest):
        return None if self.hide or not self.items else self.items[0]
    def append(self, raw):
        self.appends+=1
        if self.fail: raise mo.ReviewRequired('BACKEND_TIMEOUT')
        self.items.append(('91',raw))
    def mark_draft(self,uid): self.flags.append(uid)


class Tests(unittest.TestCase):
    def setUp(self): self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def raw(self,**kwargs):return mo.compose(spec(**kwargs))[0]
    def test_plain_unicode_roundtrip(self):
        raw,m=mo.compose(spec(text='Thank you — please review the revised bytes.\n'))
        self.assertEqual(mo.verify_export(raw,m)['state'],'DRAFT_CONTENT_VERIFIED')
    def test_blank_rejected(self):
        with self.assertRaisesRegex(mo.ReviewRequired,'EMPTY'):self.raw(text='  \n')
    def test_invisible_rejected(self):
        with self.assertRaisesRegex(mo.ReviewRequired,'EMPTY'):self.raw(text='\u200b\u2060\ufeff')
    def test_header_injection(self):
        with self.assertRaises(ValueError):self.raw(subject='Title\nBcc: evil@example.org')
    def test_bad_address(self):
        with self.assertRaises(mo.ReviewRequired):self.raw(to=['reader'])
    def test_duplicate_recipient(self):
        with self.assertRaises(mo.ReviewRequired):self.raw(to=['reader@example.org','reader@example.org'])
    def test_role_collision(self):
        with self.assertRaises(mo.ReviewRequired):self.raw(cc=['reader@example.org'])
    def test_multiple_recipients(self):
        self.assertEqual(mo.contract(self.raw(to=['one@example.org','two@example.org']))['to'],['one@example.org','two@example.org'])
    def test_change_recipient_blocks(self):
        raw,m=mo.compose(spec());other=self.raw(to=['other@example.org'])
        with self.assertRaisesRegex(mo.ReviewRequired,'READBACK'):mo.verify_export(other,m)
    def test_change_body_blocks(self):
        raw,m=mo.compose(spec());other=self.raw(text='Different message.')
        with self.assertRaisesRegex(mo.ReviewRequired,'READBACK'):mo.verify_export(other,m)
    def test_added_transport_header_accepted(self):
        raw,m=mo.compose(spec());changed=b'Received: synthetic control\r\n'+raw
        self.assertEqual(mo.verify_export(changed,m)['state'],'DRAFT_CONTENT_VERIFIED')
    def test_line_ending_equivalence(self):
        raw,m=mo.compose(spec());self.assertEqual(mo.verify_export(raw.replace(b'\r\n',b'\n'),m)['state'],'DRAFT_CONTENT_VERIFIED')
    def test_duplicate_subject_blocked(self):
        with self.assertRaises(mo.ReviewRequired):mo.contract(b'Subject: extra\r\n'+self.raw())
    def test_hidden_bcc_blocked(self):
        with self.assertRaisesRegex(mo.ReviewRequired,'HIDDEN'):mo.contract(b'Bcc: extra@example.org\r\n'+self.raw())
    def test_attachment_roundtrip(self):
        p=self.root/'icon.svg';p.write_bytes(b'<svg/>')
        raw,m=mo.compose(spec(attachments=[{'path':str(p),'name':'icon.svg','type':'image/svg+xml','sha256':mo.sha(p.read_bytes())}]))
        self.assertEqual(mo.verify_export(raw,m)['state'],'DRAFT_CONTENT_VERIFIED')
        self.assertEqual(m['contract']['attachments'][0]['sha256'],mo.sha(b'<svg/>'))
    def test_wrong_attachment_hash(self):
        p=self.root/'icon.svg';p.write_bytes(b'<svg/>')
        with self.assertRaisesRegex(mo.ReviewRequired,'DIGEST'):self.raw(attachments=[{'path':str(p),'name':'icon.svg','type':'image/svg+xml','sha256':'0'*64}])
    def test_attachment_cannot_be_body(self):
        m=BytesParser(policy=policy.default).parsebytes(self.raw(text='real body'))
        m.set_content('');m.add_attachment('Only attached text.',filename='message.txt')
        with self.assertRaisesRegex(mo.ReviewRequired,'EMPTY'):mo.contract(m.as_bytes())
    def test_html_only_rejected(self):
        m=BytesParser(policy=policy.default).parsebytes(self.raw());m.set_content('<html><body></body></html>',subtype='html')
        with self.assertRaises(mo.ReviewRequired):mo.contract(m.as_bytes())
    def test_html_alternative_rejected(self):
        m=BytesParser(policy=policy.default).parsebytes(self.raw());m.add_alternative('<p>Different instruction</p>',subtype='html')
        with self.assertRaisesRegex(mo.ReviewRequired,'HTML_BODY'):mo.contract(m.as_bytes())
    def test_stage_idempotent(self):
        p=mo.stage(spec(),self.root);before=(p/'message.eml').read_bytes();self.assertEqual(mo.stage(spec(),self.root),p);self.assertEqual(before,(p/'message.eml').read_bytes())
    def test_stage_changed_content_blocked(self):
        mo.stage(spec(),self.root)
        with self.assertRaisesRegex(mo.ReviewRequired,'DIFFERENT'):mo.stage(spec(text='different'),self.root)
    def test_stage_tampering_blocked(self):
        p=mo.stage(spec(),self.root);(p/'message.eml').write_bytes(self.raw(text='changed'))
        with self.assertRaisesRegex(mo.ReviewRequired,'CHANGED'):mo.validate_stage(p)
    def test_invalid_task_name(self):
        with self.assertRaises(mo.ReviewRequired):mo.stage(spec(task='../bad'),self.root)
    def test_save_and_readback(self):
        p=mo.stage(spec(),self.root);b=FakeDrafts();r=mo.save_draft(p,b)
        self.assertEqual(r['state'],'DRAFT_CONTENT_VERIFIED');self.assertEqual(b.flags,['91']);self.assertEqual(r['delivery'],'NOT_SENT')
    def test_second_run_not_duplicate(self):
        p=mo.stage(spec(),self.root);b=FakeDrafts();mo.save_draft(p,b);mo.save_draft(p,b);self.assertEqual(b.appends,1)
    def test_unknown_attempt_not_retried(self):
        p=mo.stage(spec(),self.root);b=FakeDrafts();b.fail=True
        with self.assertRaises(mo.ReviewRequired):mo.save_draft(p,b)
        b.fail=False
        with self.assertRaisesRegex(mo.ReviewRequired,'PRIOR_APPEND'):mo.save_draft(p,b)
        self.assertEqual(b.appends,1)
    def test_lost_reply_can_reconcile(self):
        p=mo.stage(spec(),self.root);b=FakeDrafts();b.hide=True
        with self.assertRaises(mo.ReviewRequired):mo.save_draft(p,b)
        b.hide=False;self.assertEqual(mo.save_draft(p,b)['state'],'DRAFT_CONTENT_VERIFIED');self.assertEqual(b.appends,1)
    def test_readback_mismatch_blocks_flags(self):
        p=mo.stage(spec(),self.root);b=FakeDrafts();b.items=[('91',self.raw(text='tampered'))]
        with self.assertRaises(mo.ReviewRequired):mo.save_draft(p,b)
        self.assertEqual(b.flags,[])
    def test_stdin_used_not_positional(self):
        b=mo.HimalayaDrafts('/fake/himalaya');raw=self.raw()
        with patch.object(b,'run',return_value=b'') as call:
            b.append(raw);self.assertEqual(call.call_args.args,(['message','save','-f','Drafts'],raw))
    def test_no_send_backend(self):self.assertFalse(hasattr(mo.HimalayaDrafts,'send'))
    def test_strict_reply_id(self):
        with self.assertRaises(mo.ReviewRequired):self.raw(in_reply_to='not an id')
    def test_reply_id_preserved(self):
        self.assertEqual(mo.contract(self.raw(in_reply_to='<reply@example.org>'))['in_reply_to'],'<reply@example.org>')
    def test_localpart_case_preserved(self):self.assertNotEqual(mo.addresses(['A@example.org']),mo.addresses(['a@example.org']))
    def test_malformed_mime_rejected(self):
        raw=self.raw();bad=raw.replace(b'Content-Type: text/plain;',b'Content-Type: multipart/mixed; boundary="lost";')
        with self.assertRaises(mo.ReviewRequired):mo.contract(bad)
    def test_non_ascii_address_rejected(self):
        with self.assertRaises(mo.ReviewRequired):self.raw(to=['rèader@example.org'])
    def test_oversize_rejected(self):
        with self.assertRaises(mo.ReviewRequired):mo.contract(b'a'*(mo.MAX_BYTES+1))
    def test_attachment_path_name_rejected(self):
        p=self.root/'file.bin';p.write_bytes(b'one')
        with self.assertRaises(mo.ReviewRequired):self.raw(attachments=[{'path':str(p),'name':'../x','type':'application/octet-stream','sha256':mo.sha(b'one')}])
    def test_source_bytes_unchanged(self):
        raw,m=mo.compose(spec());before=raw[:];mo.verify_export(raw,m);self.assertEqual(raw,before)
    def test_message_id_stable_across_times(self):
        a=mo.compose(spec(),datetime(2026,9,17,tzinfo=timezone.utc));b=mo.compose(spec(),datetime(2026,9,18,tzinfo=timezone.utc))
        self.assertEqual(a[1]['contract']['message_id'],b[1]['contract']['message_id'])
    def test_export_strips_one_final_crlf(self):
        raw,m=mo.compose(spec());self.assertTrue(raw.endswith(b'\r\n'))
        self.assertEqual(mo.verify_export(raw[:-2],m)['comparison'],'ONE_TERMINAL_NEWLINE_REMOVED_BY_EXPORT')
    def test_final_space_change_still_rejected(self):
        raw,m=mo.compose(spec())
        with self.assertRaises(mo.ReviewRequired):mo.verify_export(raw[:-2]+b' ',m)
    def test_extra_blank_line_rejected(self):
        raw,m=mo.compose(spec())
        with self.assertRaises(mo.ReviewRequired):mo.verify_export(raw+b'\r\n',m)
    def test_explicit_uid_content_verified(self):
        raw,m=mo.compose(spec());b=mo.HimalayaDrafts(existing_uid='675')
        with patch.object(b,'read',return_value=raw):
            self.assertEqual(b.find(m),('675',raw))
    def test_wrong_explicit_uid_refused(self):
        raw,m=mo.compose(spec());b=mo.HimalayaDrafts(existing_uid='675')
        with patch.object(b,'read',return_value=self.raw(text='Different body')):
            with self.assertRaises(mo.ReviewRequired):b.find(m)
    def test_permissions(self):
        p=mo.stage(spec(),self.root);self.assertEqual((p/'message.eml').stat().st_mode & 0o777,0o600)


if __name__=='__main__':unittest.main(verbosity=2)
