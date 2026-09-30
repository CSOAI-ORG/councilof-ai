#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Re-read a quoted public claim at its URL -> one evidence event per claim. The claim-maintenance primitive.

    python3 probe/quote_reread.py CLAIMS.json > events.jsonl
    CLAIMS.json: [{"url": "https://...", "quote": "exact words", "kind": "repository", "about": "short label"}]

CONSISTENT: the exact quote is present in the bytes served now (whitespace-normalised). DIVERGENT: the page
was served and the quote is not in it (the claim changed or moved). UNCHECKABLE: not served (non-200 / network).
The negative control searches the same bytes for a fabricated quote, which must be absent (DIVERGENT).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E, get  # noqa: E402

CONTROL_QUOTE = "csoai negative control: this sentence was fabricated and appears nowhere"


def norm(b):
    return re.sub(r"\s+", " ", b.decode("utf-8", "replace"))


def measure(c):
    st, b, sha, at = get(c["url"], accept="text/html,application/json,text/plain,*/*")
    if st != 200:
        state, ctl, found = "UNCHECKABLE", {"id": "fabricated-quote", "expected": None, "got": "NOT_RUN"}, None
    else:
        text = norm(b)
        found = re.sub(r"\s+", " ", c["quote"]) in text
        state = "CONSISTENT" if found else "DIVERGENT"
        ctl = {"id": "fabricated-quote", "expected": "DIVERGENT", "got": "CONSISTENT" if CONTROL_QUOTE in text else "DIVERGENT"}
    return E.build(
        subject={"kind": c.get("kind", "web_page"), "locator": c["url"], "declared_by": c.get("about", c["url"])},
        claim={"text": f"The page states: “{c['quote']}”", "source_url": c["url"], "source_sha256": sha, "read_at": at},
        method={"id": "quote-reread", "version": "0.1", "code_sha256": None, "holder": "csoai"},
        declared={"quote": c["quote"]}, observed={"http": st, "quote_present": found, "bytes": len(b) if st == 200 else None},
        state=state, value=None, negative_control=ctl,
        limits=["Presence of words at one URL at one moment; not whether the statement is true.",
                "A moved or reworded sentence reads DIVERGENT until re-quoted; that is a change of text, not of fact."])


def main(argv=None):
    for c in json.load(open((argv or sys.argv[1:])[0])):
        sys.stdout.write(json.dumps(measure(c), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
