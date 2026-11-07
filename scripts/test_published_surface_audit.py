#!/usr/bin/env python3
"""The published-surface audit must judge a page at the url it is SERVED at.

WHY THIS TEST EXISTS. Two defects in scripts/audit/published-surface-audit.py, both
measured against the live estate on 2026-11-07.

1. THE CANONICAL RULE COMPARED THE WRONG URL. The rule read the canonical link on a
   page and compared its path with the path that was ASKED for:

       elif urlparse(m.group(1)).path.rstrip("/") != route.rstrip("/"):

   But urllib follows redirects, so the body that rule reads is the FINAL page's body.
   https://councilof.ai/pricing/ answers 308 to
   /dashboard/?tab=measured&task=pricing-overview, and the canonical on the page
   actually served there is https://councilof.ai/dashboard/ — which is CORRECT. The
   audit reported that as a MEDIUM "canonical points at a different path" against a
   page that is not defective. A checker that cries wolf on a correct page teaches its
   reader to ignore it, and that is a worse outcome than the defect the checker was
   written to find.

2. THE CSP RULE WAS A BRANCH THAT COULD NEVER FIRE. The audit meant to report the
   asymmetry between the page surface and the machine surface:

       if "/api/" in url and (headers.get("content-security-policy")):
           pass

   Its body was `pass` and its condition tested for the policy BEING PRESENT, so it
   could only ever do nothing. The asymmetry went unreported for as long as it stood:
   councilof.ai answered /api/gspc, /api/state and /api/cards with five security
   headers and NO Content-Security-Policy at all, and the audit said nothing about it.

WHAT IT CHECKS. The rules are read out of the module, so the test cannot drift away
from the code it tests. The fixtures are the live shapes measured on 2026-11-07:
the /pricing/ redirect, the canonical on the page served there, and the three /api/
surfaces that carried no policy.

    python3 -m unittest discover -s scripts -p test_published_surface_audit.py

No network, no extra dependencies.
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
AUDIT = HERE / "audit" / "published-surface-audit.py"


def load_audit():
    spec = importlib.util.spec_from_file_location("published_surface_audit", AUDIT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PublishedSurfaceAuditRules(unittest.TestCase):
    """The rules the audit reaches for, exercised without touching the network."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.audit = load_audit()

    # -- the canonical rule -------------------------------------------------

    def test_the_canonical_rule_is_reachable(self):
        # THE CONTROL. On the script this fixes, none of these three functions
        # exists, so this test is RED there — which is what makes the green
        # below mean something.
        for name in ("canonical_finding", "csp_state", "csp_finding"):
            self.assertTrue(
                hasattr(self.audit, name),
                f"published-surface-audit.py has no {name}() — the rule this test "
                f"exercises does not exist in this tree",
            )

    def test_a_redirect_to_a_page_that_canonicalises_to_itself_is_not_a_defect(self):
        # MEASURED 2026-11-07. /pricing/ answers 308 to the dashboard; the
        # canonical on the page served there is /dashboard/, which is right.
        verdict = self.audit.canonical_finding(
            "https://councilof.ai/pricing/",
            "https://councilof.ai/dashboard/?tab=measured&task=pricing-overview",
            "https://councilof.ai/dashboard/",
        )
        self.assertIsNone(
            verdict,
            "a canonical naming the url the page was SERVED at is correct, and the "
            "audit must not call it a defect",
        )

    def test_a_canonical_naming_neither_url_is_still_a_defect(self):
        verdict = self.audit.canonical_finding(
            "https://councilof.ai/about/",
            "https://councilof.ai/about/",
            "https://councilof.ai/somewhere-else/",
        )
        self.assertIsNotNone(verdict, "a canonical pointing at a third path is a defect")
        severity, issue, evidence = verdict
        self.assertEqual(severity, "medium")
        self.assertIn("different path", issue)
        self.assertEqual(evidence, "https://councilof.ai/somewhere-else/")

    def test_a_canonical_wrong_even_after_a_redirect_names_both_urls(self):
        verdict = self.audit.canonical_finding(
            "https://councilof.ai/pricing/",
            "https://councilof.ai/dashboard/?tab=measured&task=pricing-overview",
            "https://councilof.ai/elsewhere/",
        )
        self.assertIsNotNone(verdict)
        severity, issue, evidence = verdict
        self.assertEqual(severity, "medium")
        self.assertIn("served", issue)
        self.assertIn("https://councilof.ai/pricing/", evidence)
        self.assertIn("https://councilof.ai/dashboard/", evidence)

    def test_a_page_with_no_canonical_is_a_low_finding(self):
        verdict = self.audit.canonical_finding(
            "https://councilof.ai/about/", "https://councilof.ai/about/", None
        )
        self.assertIsNotNone(verdict)
        severity, issue, _ = verdict
        self.assertEqual(severity, "low")
        self.assertEqual(issue, "no canonical link")

    def test_the_root_canonical_matches_the_root(self):
        self.assertIsNone(self.audit.canonical_finding(
            "https://councilof.ai/", "https://councilof.ai/", "https://councilof.ai/"
        ))

    # -- the CSP rules ------------------------------------------------------

    def test_csp_state_separates_enforced_from_report_only_from_absent(self):
        self.assertEqual(self.audit.csp_state({"content-security-policy": "default-src 'self'"}), "enforced")
        self.assertEqual(self.audit.csp_state({"Content-Security-Policy": "default-src 'self'"}), "enforced")
        self.assertEqual(
            self.audit.csp_state({"content-security-policy-report-only": "default-src 'self'"}),
            "report-only",
        )
        self.assertEqual(
            self.audit.csp_state({"Content-Security-Policy-Report-Only": "default-src 'self'"}),
            "report-only",
        )
        self.assertEqual(self.audit.csp_state({}), "absent")
        self.assertEqual(self.audit.csp_state({"x-content-type-options": "nosniff"}), "absent")

    def test_an_enforced_policy_is_never_a_finding(self):
        self.assertIsNone(self.audit.csp_finding(
            "https://councilof.ai/api/gspc", "enforced", "enforced"
        ))
        self.assertIsNone(self.audit.csp_finding(
            "https://councilof.ai/", "enforced", "enforced"
        ))

    def test_a_report_only_policy_is_a_finding_that_says_why(self):
        verdict = self.audit.csp_finding("https://councilof.ai/", "report-only", "report-only")
        self.assertIsNotNone(verdict)
        severity, issue, evidence = verdict
        self.assertEqual(severity, "medium")
        self.assertIn("Report-Only", issue)
        self.assertIn("cannot protect", evidence)

    def test_the_machine_surface_gap_names_the_asymmetry(self):
        # THE FINDING THE DEAD BRANCH WAS WRITTEN FOR. The HTML surface carries a
        # policy only as Report-Only and the machine surface carries none: that is
        # one surface partly protected and one that is not, and the machine
        # surface is read more often. The old branch had a `pass` body and could
        # never report it.
        verdict = self.audit.csp_finding(
            "https://councilof.ai/api/gspc", "absent", "report-only"
        )
        self.assertIsNotNone(verdict)
        severity, issue, evidence = verdict
        self.assertEqual(severity, "medium")
        self.assertEqual(issue, "no Content-Security-Policy")
        self.assertIn("Report-Only", evidence)
        self.assertIn("read more often", evidence)

    def test_a_machine_surface_with_no_policy_and_no_html_policy_is_still_a_finding(self):
        verdict = self.audit.csp_finding(
            "https://councilof.ai/api/gspc", "absent", "absent"
        )
        self.assertIsNotNone(verdict)
        severity, issue, _ = verdict
        self.assertEqual(severity, "medium")
        self.assertEqual(issue, "no Content-Security-Policy")

    # -- the dead branch is gone -------------------------------------------

    def test_the_branch_that_could_never_fire_is_not_in_the_source(self):
        # The dead branch is QUOTED in a comment that says what it was and why
        # it went — that comment is the record of the defect and stays. What
        # must not come back is the branch as CODE, so the comment lines are
        # stripped before the source is read.
        source = AUDIT.read_text(encoding="utf-8")
        code = "\n".join(
            line for line in source.splitlines()
            if not line.lstrip().startswith("#")
        )
        self.assertNotIn(
            'if "/api/" in url and (headers.get("content-security-policy")):',
            code,
            "the dead CSP branch is back as code: its body was `pass`, so it reported "
            "nothing while the machine surface carried no policy at all",
        )
        self.assertNotIn(
            'headers.get("content-security-policy")):\n            pass',
            code,
            "the dead CSP branch is back as code: a condition with a `pass` body "
            "reports nothing however the surface answers",
        )


if __name__ == "__main__":
    unittest.main()
