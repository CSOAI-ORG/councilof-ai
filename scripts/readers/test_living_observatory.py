import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
spec = importlib.util.spec_from_file_location("living_observer", Path(__file__).with_name("living_observatory.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class ObserverTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.state = Path(self.temp.name)
        (self.state / "reviewed-source.sha256").write_text(m.digest(Path(m.__file__).read_bytes()))
        self.fetches = 0
    def tearDown(self):
        self.temp.cleanup()
    def fetch(self, url):
        self.fetches += 1
        return json.dumps({"axes": [], "assets": [], "rows": [], "cards": [], "servers": [], "authority_adapters": []}).encode(), "application/json"
    def test_first_read_is_never_a_measurement(self):
        r = m.observe(self.state, fetcher=self.fetch)
        self.assertEqual(r["state"], "OBSERVED")
        self.assertEqual(r["counts"]["new_measurements"], 0)
        self.assertTrue(all(not row["measured"] and not row["signed"] for row in r["sources"]))
    def test_idempotent_content_and_immutable_receipts(self):
        first = m.observe(self.state, fetcher=self.fetch)
        second = m.observe(self.state, fetcher=self.fetch)
        self.assertTrue(all(r["state"] == "UNCHANGED_BYTES" for r in second["sources"]))
        self.assertEqual(len(list((self.state / "receipts").glob("*.json"))), 2)
        self.assertEqual(len(list((self.state / "blobs").glob("*.body"))), 1)
    def test_drift_is_only_a_review_trigger(self):
        m.observe(self.state, fetcher=self.fetch)
        def changed(url): return b'{"axes":[],"assets":[],"rows":[],"cards":[],"servers":[],"authority_adapters":[],"nav":"change"}', "application/json"
        r = m.observe(self.state, fetcher=changed)
        self.assertTrue(all(s["state"] == "BYTES_CHANGED_REVIEW_REQUIRED" for s in r["sources"]))
        self.assertEqual(r["counts"]["semantic_changes_reviewed"], 0)
    def test_due_guard_does_not_fetch(self):
        m.observe(self.state, fetcher=self.fetch)
        self.fetches = 0
        self.assertEqual(m.observe(self.state, True, self.fetch)["state"], "NOT_DUE")
        self.assertEqual(self.fetches, 0)
    def test_stop_guard(self):
        (self.state / "STOP").touch()
        self.assertEqual(m.observe(self.state, fetcher=self.fetch)["state"], "STOPPED")
        self.assertEqual(self.fetches, 0)
    def test_changed_source_blocks_execution(self):
        (self.state / "reviewed-source.sha256").write_text("wrong")
        self.assertEqual(m.observe(self.state, fetcher=self.fetch)["state"], "SOURCE_REVIEW_REQUIRED")
        self.assertEqual(self.fetches, 0)
    def test_failure_retains_last_good_lineage_but_not_freshness(self):
        before = m.observe(self.state, fetcher=self.fetch)
        def failed(url): raise TimeoutError()
        after = m.observe(self.state, fetcher=failed)
        self.assertEqual(after["state"], "UNAVAILABLE")
        self.assertEqual(after["sources"][0]["last_success_body_sha256"], before["sources"][0]["body_sha256"])
        self.assertNotIn("body_sha256", after["sources"][0])
    def test_html_success_is_not_a_json_collection(self):
        r = m.observe(self.state, fetcher=lambda url: (b"<html>Loading</html>", "text/html"))
        self.assertEqual(r["counts"]["sources_read"], 2)
        self.assertIsNone(r["sources"][2].get("observed_collection_count"))
    def test_tampered_receipt_is_rejected(self):
        m.observe(self.state, fetcher=self.fetch)
        pointer = json.loads((self.state / "latest.json").read_bytes())
        (self.state / "receipts" / pointer["receipt"]).write_text("{}")
        self.assertEqual(m.status(self.state)["state"], "INVALID_RETAINED_REPORT")
    def test_unlisted_urls_rejected_before_network(self):
        for u in ("http://localhost/", "https://councilof.ai.evil.example/", "https://councilof.ai/private"):
            with self.assertRaises(ValueError): m.check_url(u)
    def test_private_resolution_rejected(self):
        with patch.object(m.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("127.0.0.1", 443))]):
            with self.assertRaises(ValueError): m.check_url(m.SOURCES[0][1])
    def test_retain_no_negative_denominator(self):
        with self.assertRaises(ValueError): m.describe_body(b'{"rows": "many"}', "application/json", "rows")
    def test_no_automatic_redirect(self):
        self.assertIsNone(m.NoRedirect().redirect_request(None, None, 302, "", {}, "https://localhost/"))
    def test_read_status_does_not_fetch(self):
        self.assertEqual(m.status(self.state)["state"], "NOT_OBSERVED")
        self.assertEqual(self.fetches, 0)

class ContentDiffTests(unittest.TestCase):
    def test_json_formatting_is_not_a_content_change(self):
        r=m.change_projection(b'{"rows": []}', 'application/json', 'swift-register', 'rows', b'{"rows":[]}', 'application/json')
        self.assertEqual(r['content_change'],'UNCHANGED_NORMALIZED_CONTENT')
        self.assertFalse(r['review_required'])
    def test_dynamic_script_and_navigation_do_not_become_policy_changes(self):
        a=b'<main>Risk management</main><script>t=1</script><nav>Old menu</nav>'
        b=b'<main>Risk management</main><script>t=2</script><nav>New menu</nav>'
        self.assertEqual(m.normalized_content(a,'text/html'),m.normalized_content(b,'text/html'))
    def test_changed_prose_requires_review_but_not_measurement(self):
        r=m.change_projection(b'<main>Changed requirement</main>','text/html','nist-rmf',None,b'<main>Old requirement</main>','text/html')
        self.assertTrue(r['review_required'])
    def test_record_add_remove_and_change(self):
        a=m.canonical({'rows':[{'id':'a','v':1},{'id':'b','v':1}]})
        b=m.canonical({'rows':[{'id':'a','v':2},{'id':'c','v':1}]})
        r=m.change_projection(b,'application/json','swift-register','rows',a,'application/json')
        self.assertEqual(r['record_changes'],{'added':['c'],'removed':['b'],'changed':['a'],'baseline_count':2})
    def test_duplicate_identifiers_fail_closed(self):
        with self.assertRaises(ValueError):m.row_inventory(m.canonical({'rows':[{'id':'a'},{'id':'a'}]}),'swift-register','rows')
    def test_missing_identity_fail_closed(self):
        with self.assertRaises(ValueError):m.row_inventory(b'{"rows":[{}]}','swift-register','rows')
    def test_no_baseline_no_deletion_claim(self):
        r=m.change_projection(b'{"rows":[]}', 'application/json','swift-register','rows',None,None)
        self.assertEqual(r['content_change'],'BASELINE');self.assertEqual(r['record_changes']['removed'],[])
    def test_json_endpoint_cannot_use_loading_html(self):
        with self.assertRaises(ValueError):m.change_projection(b'<html>Loading</html>','text/html','layer0-witness',None,None,None)
    def test_xrpl_uses_receipt_identity_not_ticker(self):
        r=m.row_inventory(m.canonical({'assets':[{'sha256':'a'*64,'symbol':'USD'},{'sha256':'b'*64,'symbol':'USD'}]}),'xrpl-register','assets')
        self.assertEqual(len(r),2)
    def test_noncollection_json_preserves_source_date(self):
        r=m.describe_body(b'{"as_of":"2026-09-01"}','application/json',None)
        self.assertEqual(r['source_as_of'],'2026-09-01')
    def test_same_ticker_different_ids_do_not_merge(self):
        r=m.row_inventory(m.canonical({'rows':[{'asset_id':'143','symbol':'USDV'},{'asset_id':'398','symbol':'USDV'}]}),'stablecoin-supply','rows')
        self.assertEqual(len(r),2)

if __name__ == "__main__": unittest.main()
