#!/usr/bin/env python3
"""gate_draft.py: a clean draft reaches 100%; each doctored copy (must-fail control) does not.

    python3 -m unittest -v test_gate_draft.py
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gate_draft as gd  # noqa: E402

CLEAN = ("# Note\n\nWe measure public statements against what a server answers, and publish dated records.\n"
         "Source: https://huggingface.co/datasets/csoai/mcp-contract-parity (read 2026-09-28).\n")


class GateDraft(unittest.TestCase):
    def test_clean_passes(self):
        r = gd.gate_text(CLEAN)
        self.assertTrue(r["at_100"], r)
        self.assertEqual(r["notice_banned"], [])
        self.assertEqual(len(r["doctrine"]), gd.N_DOCTRINE, r)
        self.assertTrue(all(v == "PASS" for v in r["doctrine"].values()), r)

    def test_must_fail_banned_words(self):
        # the notice list has no negation escape: a denial still trips it
        for bad in ("This server is certified.", "Book a demo with us.", "It failed the check.",
                    "Our pricing is simple.", "This is not an endorsement."):
            r = gd.gate_text(CLEAN + bad)
            self.assertFalse(r["at_100"], bad)
            self.assertTrue(r["notice_banned"], bad)

    def test_must_fail_public_price(self):
        r = gd.gate_text(CLEAN + "Access costs £120 per month.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.no_public_prices"), "FAIL")

    def test_must_fail_brand_gate(self):
        r = gd.gate_text(CLEAN + "Built on sovos.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.brand_gate"), "FAIL")

    def test_must_fail_lf_label(self):
        r = gd.gate_text(CLEAN + "We are an LF member.\n")
        self.assertFalse(r["at_100"])
        self.assertEqual(r["doctrine"].get("doctrine.no_lf_membership_label"), "FAIL")


# A cited document's title is not the drafter's claim. The exemption is narrow on purpose,
# and every limit below is a must-fail control: if the exemption ever grows, one of these goes
# red.
ID_HEAD = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<rfc xmlns:xi="http://www.w3.org/2001/XInclude" ipr="trust200902"'
           ' docName="draft-templeman-scitt-measurement-capsule-01" category="exp"'
           ' submissionType="IETF" tocDepth="1">\n')
ID_WITH_RFC9162 = (ID_HEAD +
                   "<references>\n"
                   '<reference anchor="RFC9162">\n  <front>\n'
                   "    <title>Certificate Transparency Version 2.0</title>\n"
                   "    <author fullname=\"B. Laurie\"/>\n"
                   '    <seriesInfo name="RFC" value="9162"/>\n'
                   "  </front>\n"
                   "</reference>\n"
                   "</references>\n")
ID_V3_HEAD = ('<?xml version="1.0" encoding="utf-8"?>\n'
              '<rfc xmlns="http://www.ietf.org/xml/rfc" version="3">\n')


class CitedTitleIsNotAClaim(unittest.TestCase):
    def test_a_cited_rfc_title_is_not_read_as_a_certification_claim(self):
        r = gd.gate_text(ID_WITH_RFC9162)
        self.assertEqual(r["notice_banned"], [], r)
        self.assertTrue(r["at_100"], r)

    def test_the_same_exemption_holds_in_xml2rfc_v3(self):
        v3 = (ID_V3_HEAD + "<references>\n"
              '<reference anchor="RFC9162">\n  <front>\n'
              "    <title>Certificate Transparency Version 2.0</title>\n"
              "  </front>\n</reference>\n</references>\n")
        r = gd.gate_text(v3)
        self.assertEqual(r["notice_banned"], [], r)
        self.assertTrue(r["at_100"], r)

    def test_must_fail_the_same_word_in_the_body(self):
        r = gd.gate_text(ID_WITH_RFC9162 + "<section><title>Certificate of operation</title>\n"
                         "<t>This service is certified.</t></section>\n")
        self.assertFalse(r["at_100"])
        self.assertTrue(r["notice_banned"])

    def test_must_fail_a_reference_that_anchors_no_rfc(self):
        # Only a real RFC's own title is exempt. A title on any other reference is still read
        # as text, so a smuggled claim cannot hide behind a reference element.
        fake = ('<rfc xmlns="http://www.ietf.org/xml/rfc">\n<references>\n'
                '<reference anchor="internal">\n  <front>\n'
                "    <title>Certificate of Excellence</title>\n"
                "  </front>\n</reference>\n</references>\n")
        r = gd.gate_text(fake)
        self.assertFalse(r["at_100"])
        self.assertTrue(r["notice_banned"])

    def test_must_fail_the_same_block_outside_an_internet_draft(self):
        # Without the IETF namespace the file is not an Internet-Draft, so the block is text.
        not_a_draft = ('<reference anchor="RFC9162">\n  <front>\n'
                       "    <title>Certificate Transparency Version 2.0</title>\n"
                       "  </front>\n</reference>\n")
        r = gd.gate_text(not_a_draft)
        self.assertFalse(r["at_100"])
        self.assertTrue(r["notice_banned"])

    def test_the_real_measurement_capsule_draft_reaches_100(self):
        # The draft this exemption exists for: the only banned word in it is the word
        # "Certificate" inside RFC 9162's own title.
        here = os.path.dirname(os.path.abspath(__file__))
        draft = os.path.join(here, "..", "..", "docs", "ietf", "measurement-capsule-01",
                             "draft-templeman-scitt-measurement-capsule-01.xml")
        if not os.path.exists(draft):
            self.skipTest("measurement-capsule draft is not in this checkout")
        with open(draft, encoding="utf-8") as f:
            text = f.read()
        r = gd.gate_text(text, draft)
        self.assertEqual(r["notice_banned"], [], r)
        self.assertTrue(r["at_100"], r)


if __name__ == "__main__":
    unittest.main()
