"""contact_reachability verdicts, with DNS and SMTP stubbed (no network)."""
import json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(__file__))
import contact_reachability as cr
cr._real_mail_hosts = cr.mail_hosts


def stub(hosts, answers):
    """answers: function(addr) -> (code, msg); a control address starts with csoai-probe-."""
    cr.mail_hosts = lambda d: (hosts, "MX" if hosts else None)
    cr.rcpt = lambda h, a: (*answers(a), "RCPT")


class Verdicts(unittest.TestCase):
    def test_mailbox_proven_only_when_control_is_rejected(self):
        stub(["mx"], lambda a: (550, "5.1.1 unknown") if a.startswith("csoai-probe-") else (250, "ok"))
        self.assertEqual(cr.check("info@euro-os.eu", {})["verdict"], "ACCEPTS")

    def test_accept_all_is_not_proof(self):
        # measured 28 Sep: Exchange Online said 250 to hello@gotrust.be, then bounced 550 5.1.10
        stub(["mx"], lambda a: (250, "2.1.5 Recipient OK"))
        self.assertEqual(cr.check("hello@gotrust.be", {})["verdict"], "ACCEPT_ALL")

    def test_greylisted_control_leaves_existence_unmeasured(self):
        stub(["mx"], lambda a: (450, "4.1.1 unverified") if a.startswith("csoai-probe-") else (250, "ok"))
        self.assertEqual(cr.check("nicholas@csoai.org", {})["verdict"], "ACCEPTS_UNCONTROLLED")

    def test_rejected_and_no_host_block(self):
        stub(["mx"], lambda a: (550, "5.1.10 RecipientNotFound"))
        self.assertEqual(cr.check("x@example.org", {})["verdict"], "REJECTED")
        stub([], lambda a: (250, "ok"))
        self.assertEqual(cr.check("x@nowhere.invalid", {})["verdict"], "NO_MAIL_HOST")
        self.assertEqual(cr.check("not-an-address", {})["verdict"], "NO_MAIL_HOST")

    def test_bounce_ledger_wins_over_a_250(self):
        stub(["mx"], lambda a: (250, "ok"))
        with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
            f.write(json.dumps({"address": "hello@gotrust.be", "status": "5.1.10", "bounce_id": 9443, "date": "2026-09-28"}) + "\n")
        ledger = cr.load_ledger(f.name)
        os.unlink(f.name)
        r = cr.check("Hello@GoTrust.be", ledger)
        self.assertEqual(r["verdict"], "BOUNCED_BEFORE")
        self.assertIn("5.1.10", r["evidence"])

    def test_missing_ledger_is_reported_not_assumed_clean(self):
        stub(["mx"], lambda a: (250, "ok") if not a.startswith("csoai-probe-") else (550, "no"))
        self.assertIsNone(cr.load_ledger("/nonexistent/ledger.jsonl"))
        self.assertIn("UNMEASURED", cr.check("a@b.org", None)["ledger"])

    def test_unreachable_host_is_unmeasured_not_blocking(self):
        def boom(a):
            raise TimeoutError("port 25 blocked")
        stub(["mx"], boom)
        r = cr.check("a@b.org", {})
        self.assertEqual(r["verdict"], "UNREACHABLE")
        self.assertNotIn(r["verdict"], cr.BLOCKING)


class SenderRefused(unittest.TestCase):
    """A refusal aimed at our connecting host is not a verdict on the recipient (28 Sep 2026: the pod has no rDNS)."""

    def test_mail_from_refusal_is_not_rejected(self):
        self.assertEqual(cr.verdict(500, "Invalid request, no reverse DNS for 213.173.111.73", "MAIL FROM", None), "SENDER_REFUSED")

    def test_rcpt_stage_client_text_is_not_rejected(self):
        self.assertEqual(cr.verdict(554, "Client host [1.2.3.4] blocked using zen.spamhaus.org", "RCPT", None), "SENDER_REFUSED")

    def test_must_fail_unknown_mailbox_stays_rejected(self):
        # the control this fix must not weaken: a 5xx about the address at RCPT still blocks the send
        self.assertEqual(cr.verdict(550, "5.1.1 <nobody@example.com>: Recipient address rejected: User unknown", "RCPT", None), "REJECTED")
        self.assertIn("REJECTED", cr.BLOCKING)
        self.assertNotIn("SENDER_REFUSED", cr.BLOCKING)

    def test_accepts_paths_unchanged(self):
        self.assertEqual(cr.verdict(250, "OK", "RCPT", 550), "ACCEPTS")
        self.assertEqual(cr.verdict(250, "OK", "RCPT", 250), "ACCEPT_ALL")
        self.assertEqual(cr.verdict(250, "OK", "RCPT", None), "ACCEPTS_UNCONTROLLED")
        self.assertEqual(cr.verdict(451, "try later", "RCPT", None), "TEMPFAIL")

class MxLookup(unittest.TestCase):
    def test_failed_lookup_is_unmeasured_not_the_a_record(self):
        saved = cr.mx_lines, cr.mail_hosts
        try:
            cr.mail_hosts = cr.__dict__["_real_mail_hosts"]
            cr.mx_lines = lambda d: None
            self.assertEqual(cr.mail_hosts("lists.example.org"), ([], "MX_LOOKUP_FAILED"))
            r = cr.check("wg@lists.example.org", {})
            self.assertEqual(r["verdict"], "UNREACHABLE")
            self.assertNotIn(r["verdict"], cr.BLOCKING)
            cr.mx_lines = lambda d: ["10 lb02.groups.io.", "10 lb01.groups.io."]
            self.assertEqual(cr.mail_hosts("lists.example.org"), (["lb01.groups.io", "lb02.groups.io"], "MX"))
        finally:
            cr.mx_lines, cr.mail_hosts = saved

if __name__ == "__main__":
    unittest.main()
