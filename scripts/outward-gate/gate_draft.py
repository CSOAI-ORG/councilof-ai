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


# A .txt Internet-Draft: the header carries the literal "Internet-Draft" line
# followed by an "Intended status:" line. Only an I-D has that pair, and the
# pair is what stops a public notice that merely mentions a draft from
# picking up the I-D exemptions below.
_ID_TXT = re.compile(r"^Internet-Draft\s+\S[^\n]*\n[^\n]*Intended status:", re.M)
# A numbered I-D section heading: "11.  Normative References".
_TXT_HEADING = re.compile(r"^\s*(\d+)\.\s+(.+?)\s*$", re.M)
# A paragraph: its first line plus its indented continuation lines.
_TXT_PARA = re.compile(r"[^\n][^\n]*(?:\n[ \t]+[^\n]*)*", re.M)
_TXT_RFC = re.compile(r"\bRFC\s?\d{3,5}\b")
_TXT_QUOTED = re.compile(r"\"[^\"]{1,300}\"", re.S)

# The object of a denial is not a claim.
#   "The document distinguishes measurement from certification throughout"
#   "The use case explicitly excludes: grading, ranking, certification, ..."
# The list may WRAP across lines: an I-D's lines are ~72 columns, so
# "excludes: grading, ranking," and "certification, conformity assessment."
# are one clause split over two lines. The character class therefore allows
# newlines and stops only at a sentence-ending period.
_DISTINGUISH_FROM = re.compile(
    r"\b(?:distinguish\w*|separat\w*|differentiate\w*)\b[^.]{0,80}\bfrom\s+$", re.I)
_EXCLUDES_LIST = re.compile(r"\bexcludes?\s*:\s*(?P<list>[^.]{0,200})$", re.I)
# A denial list that names a subject is a new clause, not a list of excluded
# things: "explicitly excludes: X, and we certify Y" is a CLAIM about Y.
_SUBJECT = re.compile(r"\b(?:we|our|us|CSOAI|Council of AI)\b", re.I)


def txt_cited_title_spans(text: str) -> list[tuple[int, int]]:
    """The spans of a cited work's own title inside a .txt Internet-Draft's
    reference list.

    The .txt analogue of the XML <reference><title> rule: a reference entry
    in a Normative or Informative References section that cites an RFC, and
    only the words inside its quoted title.
    """
    if not _ID_TXT.search(text):
        return []
    headings = [(m.start(), m.group(2)) for m in _TXT_HEADING.finditer(text)]
    spans: list[tuple[int, int]] = []
    for para in _TXT_PARA.finditer(text):
        start = para.start()
        prev = [h for h in headings if h[0] <= start]
        if not prev:
            continue
        if not re.search(r"\b(?:normative|informative)\s+references\b", prev[-1][1], re.I):
            continue
        body = para.group(0)
        if not _TXT_RFC.search(body):
            continue
        for q in _TXT_QUOTED.finditer(body):
            spans.append((start + q.start(), start + q.end()))
    return spans


def _in_denial_construction(before: str) -> bool:
    """True when the words immediately before a match make it the object of a
    denial rather than a claim."""
    if _DISTINGUISH_FROM.search(before):
        return True
    m = _EXCLUDES_LIST.search(before)
    if m and not _SUBJECT.search(m.group("list")):
        return True
    return False


def is_internet_draft(text: str) -> bool:
    """True for an Internet-Draft, in XML2RFC v2 or v3, or in the plain-text
    I-D form. Read from the RAW text: md_text() collapses the newlines, so
    the .txt header test cannot see them there."""
    return bool(_ID_TXT.search(text) or _ID_V3.search(text) or _ID_V2.search(text))


def id_denial_exempt(text: str, match) -> bool:
    """Exemption for Internet-Draft files only: the matched word is the object
    of a denial. A public notice gets no such exemption."""
    if not is_internet_draft(text):
        return False
    before = text[max(0, match.start() - 200): match.start()]
    return _in_denial_construction(before)


def gate_text(text, path="/notice"):
    spans = cited_title_spans(text) + txt_cited_title_spans(text)
    is_id = is_internet_draft(text)
    banned = []
    for m in og.NOTICE_BANNED.finditer(text):
        if any(start <= m.start() < end for start, end in spans):
            continue  # a cited document's title, not a claim
        if id_denial_exempt(text, m):
            continue  # the object of a denial, not a claim
        if is_id:
            # The notice word list has NO negation escape BY DESIGN: a public
            # notice that says "not certified" still puts the word in front of
            # the reader, and a notice that says "the check FAILED" is bad.
            # But an Internet-Draft is not a notice, and the DOCTRINE check
            # above has always applied the negation escape to it -- that is
            # how "This document does not define a certification scheme"
            # passes the doctrine check today. Applying two different
            # standards to the same file is the category error: the notice
            # list's rules are for notices.
            # A TIGHT window: the negation must be the words immediately
            # around the match, not somewhere in the paragraph. A 140-char
            # window exempted "Certificate" in a test fixture because the
            # sentence two lines earlier said "nothing" -- an unrelated
            # negation cannot license a claim.
            w0 = text[max(0, m.start() - 40): m.start()]
            w1 = text[m.end(): m.end() + 20]
            if og.NEG.search(w0) or og.NEG.search(w1):
                continue
        banned.append(og.clip(text[max(0, m.start() - 30): m.end() + 30], 80))
    # The doctrine check runs on md_text, whose offsets differ from the raw
    # text, so the "is this an Internet-Draft" answer is taken from the RAW
    # text and the denial window is taken from the SAME text the match was
    # found in. Mixing the two coordinate spaces would exempt the wrong words.
    md = og.md_text(text)

    def _denial_exempt_in_md(md_text, match):
        if not is_id:
            return False
        before = md_text[max(0, match.start() - 200): match.start()]
        return _in_denial_construction(before)

    checks = og.doctrine_checks(md, path, og.OWN_NOTICES, prices=True,
                                 exempt=_denial_exempt_in_md)
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
