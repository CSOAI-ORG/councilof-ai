import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
import governance_watch as g

NOW=dt.datetime(2026,11,8,tzinfo=dt.timezone.utc)
T={'name':'page','url':'https://example.test/','kind':'html'}
def response(body=b'<main>Real document</main>',status=200,ctype='text/html',error=None):
    return dict(status=status,_body=body,content_type=ctype,effective_url=T['url'],curl_exit=0 if not error else 28,transport_error=error,redirects=0)
def probe(t=T,**kw):
    return g.probe(t,fetcher=lambda u:response(**kw),now=NOW)

class TestGovernanceWatch(unittest.TestCase):
    def test_main_only(self):
        p=g.VisibleText();p.feed('<header>new</header><main><p>Clause A</p><script>bad</script></main><footer>new</footer>')
        self.assertEqual(p.normalised(),'Clause A')
    def test_nav_hash_stable(self):
        a=g.analyse(T,200,b'<main>Clause A</main><footer>1</footer>','text/html')
        b=g.analyse(T,200,b'<main>Clause A</main><footer>2</footer>','text/html')
        self.assertEqual(a['normalised_sha256'],b['normalised_sha256'])
    def test_clause_hash_changes(self):
        a=g.analyse(T,200,b'<main>Clause A</main>','text/html')
        b=g.analyse(T,200,b'<main>Clause B</main>','text/html')
        self.assertNotEqual(a['normalised_sha256'],b['normalised_sha256'])
    def test_image_alt_name(self):
        p=g.VisibleText();p.feed('<main><img alt="CSOAI LTD"></main>')
        self.assertIn('CSOAI LTD',p.normalised())
    def test_hidden_text_excluded(self):
        p=g.VisibleText();p.feed('<main>Public<span hidden>private</span><p>visible</p></main>')
        self.assertEqual(p.normalised(),'Public visible')
    def test_script_fake_stale_claim_ignored(self):
        t={**T,'name':'membership_agreement'}
        r=probe(t,body=b'<main>Archive</main><script>Ready to Join CSOAI? No current version supersedes it.</script>')
        self.assertFalse(r['facts']['archive_join_conflict'])
    def test_archive_banner_outside_main_is_not_lost(self):
        t={**T,'name':'membership_agreement'}
        r=probe(t,body=b'<header>No current version supersedes it.</header><main>Ready to Join CSOAI?</main>')
        self.assertTrue(r['facts']['archive_join_conflict'])
    def test_valid_json(self):
        r=probe({**T,'kind':'json','required_keys':['name']},body=b'{"name":"Council"}',ctype='application/a2a+json')
        self.assertEqual(r['state'],'VERIFIED_FETCH')
    def test_invalid_json_retries(self):
        r=probe({**T,'kind':'json'},body=b'<html>200 fallback</html>',ctype='text/html')
        self.assertEqual(r['state'],'BROKEN_SURFACE');self.assertEqual(len(r['attempts']),2)
    def test_missing_json_key(self):
        r=probe({**T,'kind':'json','required_keys':['name']},body=b'{}',ctype='application/json')
        self.assertEqual(r['state'],'BROKEN_SURFACE')
    def test_json_order_stable(self):
        t={**T,'kind':'json'}
        a=g.analyse(t,200,b'{"a":1,"b":2}','application/json')
        b=g.analyse(t,200,b'{"b":2,"a":1}','application/json')
        self.assertEqual(a['normalised_sha256'],b['normalised_sha256'])
    def test_timeout_not_outage(self):
        self.assertEqual(probe(status=0,error='timeout')['state'],'UNVERIFIED')
    def test_forbidden_not_outage(self):
        self.assertEqual(probe(status=403)['state'],'UNVERIFIED')
    def test_rate_limit_not_outage(self):
        self.assertEqual(probe(status=429)['state'],'UNVERIFIED')
    def test_challenge_not_green(self):
        r=probe(body=b'<title>Just a moment...</title><main>Checking browser</main>')
        self.assertEqual(r['state'],'UNVERIFIED')
    def test_soft_404(self):
        self.assertEqual(probe(body=b'<title>404 - page not found</title>')['state'],'BROKEN_SURFACE')
    def test_http_404_retried(self):
        r=probe(status=404);self.assertEqual(r['state'],'BROKEN_SURFACE');self.assertEqual(len(r['attempts']),2)
    def test_retry_recovery(self):
        calls=iter([response(status=404),response()])
        r=g.probe(T,lambda u:next(calls),NOW)
        self.assertEqual(r['state'],'VERIFIED_FETCH')
    def test_redirect_not_terminal_success(self):
        self.assertEqual(probe(status=308)['state'],'UNVERIFIED')
    def test_security_future(self):
        r=probe({**T,'kind':'security_txt'},body=b'Contact: mailto:nicholas@csoai.org\nExpires: 2027-03-28T00:00:00Z\n',ctype='text/plain')
        self.assertEqual(r['validation'],'OK')
    def test_security_expired(self):
        r=probe({**T,'kind':'security_txt'},body=b'Contact: mailto:nicholas@csoai.org\nExpires: 2026-03-28T00:00:00Z\n')
        self.assertIn('security.txt expired',r['issues'])
    def test_security_near_expiry(self):
        r=probe({**T,'kind':'security_txt'},body=b'Contact: mailto:nicholas@csoai.org\nExpires: 2026-11-30T00:00:00Z\n')
        self.assertIn('security.txt expires within 30 days',r['issues'])
    def test_security_requires_timezone(self):
        r=probe({**T,'kind':'security_txt'},body=b'Contact: mailto:nicholas@csoai.org\nExpires: 2027-03-28T00:00:00\n')
        self.assertTrue(any('invalid Expires' in s for s in r['issues']))
    def test_security_contact_missing(self):
        r=probe({**T,'kind':'security_txt'},body=b'Expires: 2027-03-28T00:00:00Z\n')
        self.assertIn('missing or invalid Contact',r['issues'])
    def test_change_is_review_not_automatic_legal_alert(self):
        a=probe(body=b'<main>A</main>');old=g.make_report({},[a],'old')
        b=probe(body=b'<main>B</main>');new=g.make_report(old,[b],'new')
        self.assertEqual(len(new['changes_for_review']),1);self.assertEqual(new['new_notifications'],[])
    def test_unchanged_issue_silent(self):
        r=probe(status=404);old=g.make_report({},[r],'old');new=g.make_report(old,[r],'new')
        self.assertEqual(len(old['new_notifications']),1);self.assertEqual(new['new_notifications'],[])
    def test_old_agreement_issue_not_renotified_on_upgrade(self):
        t={**T,'name':'membership_agreement'}
        r=probe(t,body=b'<main>Ready to Join CSOAI? No current version supersedes it.</main>')
        old={'monitor_version':'0.1','results':[],'findings':[{'type':'HISTORICAL_AGREEMENT_STALE_CLAIM','surface':'membership_agreement'}]}
        new=g.make_report(old,[r],'new');self.assertEqual(new['new_notifications'],[])
    def test_two_unverified_runs_escalate_once(self):
        r=probe(status=403);a=g.make_report({},[r],'a');b=g.make_report(a,[r],'b');c=g.make_report(b,[r],'c')
        self.assertEqual(a['new_notifications'],[]);self.assertEqual(len(b['new_notifications']),1);self.assertEqual(c['new_notifications'],[])
    def test_privacy_parity(self):
        a=probe({**T,'name':'privacy'},body=b'<main>Notice A</main>')
        b=probe({**T,'name':'privacy_policy'},body=b'<main>Notice B</main>')
        r=g.make_report({},[a,b],'now');self.assertTrue(any(f['type']=='PRIVACY_PARITY_REVIEW' for f in r['findings']))
    def test_multiple_review_issues_have_unique_ids(self):
        a=g.finding("REVIEW_ACTION","security_txt","missing contact",T["url"],"owner")
        b=g.finding("REVIEW_ACTION","security_txt","invalid expiry",T["url"],"owner")
        self.assertNotEqual(a["id"],b["id"])
    def test_pending_content_review_survives_unchanged_run(self):
        a=probe(body=b'<main>A</main>');b=probe(body=b'<main>B</main>')
        first=g.make_report({},[a],'a');second=g.make_report(first,[b],'b');third=g.make_report(second,[b],'c')
        self.assertEqual(len(third['review_queue']),1);self.assertEqual(third['changes_for_review'],[])
    def test_unchanged_known_issue_not_renotified_after_transient_gap(self):
        a=probe(status=404);gap=probe(status=403)
        first=g.make_report({},[a],'a');second=g.make_report(first,[gap],'b');third=g.make_report(second,[a],'c')
        self.assertEqual(third['new_notifications'],[])
        self.assertTrue(second['open_review_items'])
    def test_normaliser_upgrade_does_not_imply_source_change(self):
        a=probe(body=b'<main>A</main>');b=probe(body=b'<main>B</main>')
        old=g.make_report({},[a],'a');old['normaliser_version']='old-normaliser'
        new=g.make_report(old,[b],'b')
        self.assertEqual(new['changes_for_review'],[])
        self.assertEqual(new['comparison'],'baseline_migration_no_content_change_claim')
    def test_atomic_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'latest.json';g.atomic_write(p,b'{}');self.assertEqual(p.read_bytes(),b'{}')
            g.atomic_write(p,b'{"new":true}');self.assertEqual(json.loads(p.read_text()),{'new':True})
    def test_sources_require_https(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'sources.json';p.write_text(json.dumps([{'name':'bad','url':'http://example.test/'}]))
            with self.assertRaises(ValueError):g.load_targets(p)
    def test_duplicate_source_names_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'sources.json';p.write_text(json.dumps([T,T]))
            with self.assertRaises(ValueError):g.load_targets(p)
    def test_no_network_in_unit_tests(self):
        self.assertIn('No legal edits',g.__doc__)

if __name__=='__main__':unittest.main()
