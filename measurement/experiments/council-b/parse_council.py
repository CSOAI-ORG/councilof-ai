"""Frozen parsing, vote and quote-check rules (protocol.json 'parsing' and 'arms.vote_rule').
Key-free: nothing here opens key.jsonl."""
import re
from collections import Counter

LABELS = ("TRUE", "FALSE", "UNCHECKABLE")


def parse_voter(text, options):
    s = (text or "").strip()
    if s and s[0] in "ABC" and (len(s) == 1 or not s[1].isalpha()):
        return options[s[0]]
    m = re.search(r"\b([ABC])\b", s)
    if m:
        return options[m.group(1)]
    found = {w.upper() for w in re.findall(r"(?i)\b(TRUE|FALSE|UNCHECKABLE)\b", s)}
    if len(found) == 1:
        return found.pop()
    return "INVALID"


def vote(labels):
    c = Counter(l for l in labels if l in LABELS)
    if not c:
        return "UNCHECKABLE"
    top = c.most_common()
    if len(top) > 1 and top[0][1] == top[1][1]:
        return "UNCHECKABLE"
    return top[0][0]


def tally_string(labels):
    c = Counter(l for l in labels if l in LABELS)
    return f"TRUE: {c['TRUE']}, FALSE: {c['FALSE']}, UNCHECKABLE: {c['UNCHECKABLE']} (of 12)"


def _norm(s):
    s = s.strip().strip("\"'`\u201c\u201d\u2018\u2019").strip()
    return re.sub(r"\s+", " ", s.casefold())


def parse_referee(text, options, source_text):
    """Returns (final_label, raw_verdict, quote, quote_ok)."""
    t = text or ""
    q = re.search(r"QUOTE:\s*(.*)", t)
    quote = q.group(1).strip() if q else ""
    v = re.search(r"VERDICT:\s*(.*)", t, re.S)
    raw = parse_voter(v.group(1), options) if v else "INVALID"
    nq = _norm(quote)
    ok = len(nq) >= 8 and nq in _norm(source_text)
    if raw in ("TRUE", "FALSE") and ok:
        return raw, raw, quote, ok
    return "UNCHECKABLE", raw, quote, ok
