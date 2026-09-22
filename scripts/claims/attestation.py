#!/usr/bin/env python3
"""ON-3 — what the issuer itself publishes about a product, and what its attestations cover.

The claim under maintenance describes OUSG as "liquid exposure to an ETF of short-term U.S.
Treasuries". Two things are measurable about a sentence like that without any key, any account
and any opinion about the product:

  1. WHOSE sentence it is. The registry captured it from a third-party index. This harness
     fetches that index's record and the issuer's own documentation and reports, by exact
     string comparison, which of them the sentence matches. Where a description differs between
     a third-party index and the issuer's own current wording, both are quoted and attributed.
     A difference between two publishers' wording is a difference in wording; it is not an
     error by either of them and is never written as one.

  2. WHAT IS PUBLISHED, AND WHAT IS NOT. The issuer's own documentation states what reporting
     exists, who produces it, how often, and how far it may lag. That is recorded verbatim,
     together with whether the artifacts themselves are reachable by a keyless reader.

This module makes no statement about solvency, adequacy, suitability or risk, expresses no view
on whether any disclosure is sufficient, and gives no financial advice. It reports the issuer's
published words and whether the documents they point to could be reached.
"""
from __future__ import annotations

import json
import re
import sys

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

#: Issuer documentation, in the `.md` form the site serves — the issuer's own words, unwrapped.
ONDO_DOCS = [
    "https://docs.ondo.finance/qualified-access-products/ousg/overview.md",
    "https://docs.ondo.finance/qualified-access-products/ousg/trust-and-transparency.md",
]
THIRD_PARTY_RECORD = "https://api.llama.fi/protocol/ondo-finance"

#: The assertions inside the claim sentence, each with what to look for in the issuer's own text.
CLAIM_TOKENS = {
    "liquid exposure": r"liquid exposure",
    "an ETF (a single exchange-traded fund)": r"\bETFs?\b|exchange[- ]traded",
    "short-term U.S. Treasuries": r"short[- ]term US Treasur|short[- ]term U\.S\. Treasur",
    "what the portfolio also holds": r"government[- ]sponsored enterprise|GSE|bank deposits|USDC",
    "reporting cadence": r"daily|annually|annual",
    "reporting lag": r"lag",
}


def quotes_for(text: str, pattern: str, width: int = 300, limit: int = 2) -> list[str]:
    out = []
    for m in re.finditer(pattern, text, re.I):
        a = max(0, m.start() - width // 2)
        out.append(("…" if a else "") + re.sub(r"\s+", " ", text[a:m.end() + width // 2]).strip() + "…")
        if len(out) >= limit:
            break
    return out


def run(claim_text: str = "liquid exposure to an ETF of short-term U.S. Treasuries") -> dict:
    sources, issuer_text, issuer_docs = [], "", []
    for u in ONDO_DOCS:
        r = c.get(u, timeout=45)
        sources.append(c.source(r, "issuer's own published documentation (markdown form)"))
        if r["ok"]:
            t = r["body"].decode("utf-8", "replace")
            issuer_text += "\n" + t
            issuer_docs.append({"url": u, "bytes": r["bytes"], "sha256": r["sha256"],
                                "accessed_utc": r["accessed_utc"]})
    r3, j3 = c.get_json(THIRD_PARTY_RECORD, timeout=45)
    sources.append(c.source(r3, "the third-party index record the claim was captured from"))
    third_party_desc = (j3 or {}).get("description") if isinstance(j3, dict) else None

    attribution = {
        "claim_as_captured": claim_text,
        "third_party_index_description": third_party_desc,
        "matches_third_party_index_record": bool(third_party_desc and claim_text.lower() in third_party_desc.lower()),
        "appears_verbatim_in_issuer_documentation": bool(re.search(re.escape(claim_text), issuer_text, re.I)),
        "note": ("where the sentence matches the third-party index and not the issuer's own documentation, the "
                 "sentence is the index's description of the issuer, not the issuer's description of itself. "
                 "Both are quoted below. A difference in wording between two publishers is a difference in "
                 "wording and nothing more"),
    }
    per_token = {label: {"pattern": pat, "found_in_issuer_docs": bool(re.search(pat, issuer_text, re.I)),
                         "issuer_quotes": quotes_for(issuer_text, pat)}
                 for label, pat in CLAIM_TOKENS.items()}

    # Are the reporting artifacts the issuer points to reachable by a keyless reader?
    linked = sorted(set(re.findall(r"\((https?://[^)\s]+)\)", issuer_text)))
    report_links = [u for u in linked if re.search(r"drive\.google|report|financial|nav|attest", u, re.I)]
    reachability = []
    for u in report_links[:4]:
        rr = c.get(u, timeout=45)
        reachability.append({**c.source(rr, "artifact the issuer's documentation links as its reporting"),
                             "keyless_reader_reached_it": rr["ok"],
                             "note": "reachability only; the contents are not read, summarised or assessed here"})
        sources.append(reachability[-1])

    if not issuer_docs:
        return {"state": "UNMEASURED", "reason": "the issuer's documentation was not reachable", "sources": sources}
    return {
        "state": "CLAIM_MEASURED",
        "measured_at": c.now_iso(),
        "method": ("fetch the issuer's own published documentation for the product and the third-party index "
                   "record the claim was captured from; compare the captured sentence to both by exact string "
                   "match; quote the issuer's own wording for each assertion inside the claim; and record "
                   "whether the reporting artifacts the issuer links are reachable without a key"),
        "window": "the issuer's documentation and the index record as served at measured_at",
        "denominator": {"issuer_documents_read": len(issuer_docs),
                        "assertions_in_the_claim_checked": len(CLAIM_TOKENS),
                        "linked_reporting_artifacts_probed": len(reachability)},
        "attribution": attribution,
        "issuer_documents": issuer_docs,
        "issuer_wording_per_assertion": per_token,
        "linked_reporting_artifacts": reachability,
        "sources": sources,
        "does_not_prove": [
            "nothing about solvency, adequacy, suitability, valuation or risk. No financial advice and no "
            "opinion on whether any disclosure is sufficient is offered or implied",
            "no statement that anyone's description is wrong. Two publishers describing the same product in "
            "different words is a difference in wording",
            "the contents of the linked reporting artifacts are not read, verified, recomputed or assessed; "
            "only whether a keyless reader could reach them",
            "documentation is not the product: what a page says the portfolio holds is what the page says",
        ],
    }


if __name__ == "__main__":
    print(json.dumps(run(*sys.argv[1:2]), indent=1, ensure_ascii=False))
