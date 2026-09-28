"""contact_reachability verdicts, with DNS and SMTP stubbed (no network)."""
import json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(__file__))
import contact_reachability as cr


def stub(hosts, answers):
    """answers: function(addr) -> (code, msg); a control address starts with csoai-probe-."""
    cr.mail_hosts = lambda d: (hosts, "MX" if hosts else None)
    cr.rcpt = lambda h, a: answers(a)


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


if __name__ == "__main__":
    unittest.main()
