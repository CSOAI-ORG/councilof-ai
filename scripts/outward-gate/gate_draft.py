#!/usr/bin/env python3
"""Gate an outward draft FILE the way outward_gate.py gates a queued notice, before anyone sends it.

For each file: NOTICE_BANNED over the raw text (the notice gate's word list, no negation escape), and every
doctrine check over md_text(text) with prices=True (certify language, public prices, LF membership label,
statutory-verifier claim, brand-gate.mjs rules). A file is at 100% only when NOTICE_BANNED finds nothing AND
every doctrine check is PASS. Measures only: reads local files, sends and publishes nothing.

    python3 gate_draft.py FILE [FILE ...]     # one JSON line per file; exit 1 if any file is below 100%
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import outward_gate as og  # noqa: E402

N_DOCTRINE = 5  # certify, prices, LF label, statutory verifier, brand gate

# A cited document's title is not the drafter's claim.
#
# An Internet-Draft's normative references must carry the published title of the document they
# cite — xml2rfc fills that element from the RFC index, and a reference whose title is not the
# document's real title is a malformed reference — so a standards title such as "Certificate
# Transparency Version 2.0" lands inside a <title> element that NOTICE_BANNED would otherwise
# read as a certification claim by CSOAI. That reading is wrong. A rule that misfires is worse
# than no rule, because it teaches the reader to ignore the gate.
#
# Measured 2026-10-26 on draft-templeman-scitt-measurement-capsule-01: the ONLY banned word in
# the whole draft was the word "Certificate", inside RFC 9162's own title, in the reference
# list. The body of the draft cites "RFC 9162" and <xref target="RFC9162"/> and is clean.
#
# The exemption is deliberately narrow, and each limit is a test in test_gate_draft.py:
#   - only a <title> inside a <reference> that anchors a real RFC,
#   - only in a file that is actually an Internet-Draft (the IETF rfc namespace),
#   - only the words inside that title.
# Every other word, every other reference and every other file is gated exactly as before.
# An Internet-Draft, in either XML2RFC version: v3 carries the IETF rfc namespace on the <rfc>
# root element, v2 carries the IETF submission markers there instead.
_ID_V3 = re.compile(r"<rfc\b[^>]*xmlns=[\"']http://www\.ietf\.org/xml/rfc[\"']", re.I)
_ID_V2 = re.compile(r"<rfc\b[^>]*(?:submissionType=[\"']IETF[\"']|docName=[\"']draft-)", re.I)
_REFERENCE_BLOCK = re.compile(r"<reference\b[^>]*>.*?</reference>", re.I | re.S)
_REFERENCE_ANCHOR = re.compile(r"<reference\b[^>]*\banchor=[\"']RFC\d+[\"']", re.I)
_REFERENCE_TITLE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.I | re.S)


def cited_title_spans(text: str) -> list[tuple[int, int]]:
    """The spans of a cited RFC's own title inside an Internet-Draft's reference list."""
    if not (_ID_V3.search(text) or _ID_V2.search(text)):
        return []
    spans: list[tuple[int, int]] = []
    for block in _REFERENCE_BLOCK.finditer(text):
        if not _REFERENCE_ANCHOR.search(block.group(0)):
            continue
        for title in _REFERENCE_TITLE.finditer(block.group(0)):
            spans.append((block.start() + title.start(1), block.start() + title.end(1)))
    return spans


def gate_text(text, path="/notice"):
    spans = cited_title_spans(text)
    banned = []
    for m in og.NOTICE_BANNED.finditer(text):
        if any(start <= m.start() < end for start, end in spans):
            continue  # a cited document's title, not a claim
        banned.append(og.clip(text[max(0, m.start() - 30): m.end() + 30], 80))
    checks = og.doctrine_checks(og.md_text(text), path, og.OWN_NOTICES, prices=True)
    doctrine = {c["check"]: c["status"] for c in checks}
    fails = [c for c in checks if c["status"] != og.PASS]
    ok = not banned and not fails and len(checks) >= N_DOCTRINE
    return {"notice_banned": banned, "doctrine": doctrine,
            "doctrine_evidence": [c["evidence"] for c in fails], "at_100": ok}


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    worst = 0
    for p in argv:
        with open(p, encoding="utf-8") as f:
            r = gate_text(f.read(), p)
        r["file"] = os.path.basename(p)
        print(json.dumps(r, ensure_ascii=False))
        if not r["at_100"]:
            worst = 1
    return worst


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
