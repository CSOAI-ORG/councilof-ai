#!/usr/bin/env python3
"""CL-2 — counterexample log for an exclusivity claim, from the competitors' own documentation.

"The only all-in-one oracle platform" is an exclusivity claim. Exclusivity claims have one
honest test available to an outsider: a counterexample. If another vendor's OWN public
documentation says it offers a capability in the same category, that category is evidenced
elsewhere too.

What a counterexample is, and is not.
  IS   : evidence that a declared capability category is documented by more than one vendor,
         quoted from the other vendor's own published words, with the URL and the access date.
  IS NOT: a finding that anyone lied, misled, or said anything untrue. "All-in-one" is not a
         defined term, a rival's documentation is a marketing surface too, and a capability
         with the same name may differ in every way that matters. This module never scores a
         category, never ranks a vendor, and never uses a word like untrue, misleading, or
         disproven. It logs what other vendors publish about themselves, per category.

Method. For each competitor, its own published index (robots.txt -> sitemap) is enumerated and a
bounded set of its documentation pages is fetched ONCE into a local corpus. Every category is
then searched across that one corpus, so the number of pages read is the same whether one
category is checked or twenty, and the denominator — pages read per vendor — is published. A
category with no match in a vendor's corpus is recorded as not found IN THAT CORPUS, which is a
statement about the pages we read and about nothing else.
"""
from __future__ import annotations

import json
import re
import sys
import time

try:
    from . import common as c
    from .corroborate import _sitemap_urls, on_domain
except ImportError:
    import common as c  # type: ignore
    from corroborate import _sitemap_urls, on_domain  # type: ignore

MAX_PAGES_PER_VENDOR = 40
QUOTE_CHARS = 300

#: category -> the patterns searched for in each competitor's own documentation corpus
CATEGORIES: dict[str, str] = {
    "price-data-feeds": r"\bprice feeds?\b|\bdata feeds?\b",
    "low-latency-data-streams": r"\blow[- ]latency\b|\bsub[- ]second\b|\bdata streams?\b",
    "verifiable-randomness": r"\bverifiable random\w*\b|\bQRNG\b|\brandom number\b|\brandomness\b",
    "cross-chain-messaging": r"\bcross[- ]chain messag\w*\b|\binteroperability protocol\b|\bomnichain\b",
    "offchain-compute-any-api": r"\bany API\b|\bfirst[- ]party oracle\b|\bAirnode\b|\boff[- ]chain comput\w*\b",
    "proof-of-reserve": r"\bproof of reserves?\b|\bPoR\b",
    "automation-scheduled-execution": r"\bautomation\b|\bkeepers?\b|\bscheduled execution\b",
}

#: competitor -> the domains that carry that competitor's own documentation
COMPETITORS: dict[str, list[str]] = {
    "API3": ["api3.org", "docs.api3.org"],
    "Pyth": ["pyth.network", "docs.pyth.network"],
    "RedStone": ["redstone.finance", "docs.redstone.finance"],
    "Chronicle": ["chroniclelabs.org"],
}

DOCSY = ("doc", "learn", "develop", "guide", "product", "reference", "api", "resource", "build", "overview")


def corpus_for(domains: list[str], max_pages: int = MAX_PAGES_PER_VENDOR,
               pause: float = 0.3) -> tuple[list[dict], list[dict], bool]:
    """(pages, sources, index_reached). Each page: url, text, sha256, accessed_utc."""
    urls: list[str] = []
    sources: list[dict] = []
    reached = False
    for d in domains:
        locs, ss, got = _sitemap_urls(d)
        sources.extend(ss)
        reached = reached or got
        # Documentation pages first, then top up from the rest of the index, so a vendor whose
        # sitemap does not use documentation-shaped paths still gets a real corpus read.
        docsy = [u for u in locs if any(k in u.lower() for k in DOCSY)]
        rest = [u for u in locs if u not in docsy]
        for u in docsy + rest:
            if u not in urls and on_domain(u, [d]):
                urls.append(u)
        if f"https://{d}/" not in urls:
            urls.insert(0, f"https://{d}/")
    pages = []
    for u in urls[:max_pages]:
        time.sleep(pause)
        r = c.get(u, timeout=40)
        if not r["ok"]:
            continue
        pages.append({"url": u, "text": c.visible_text(r["body"]),
                      "sha256": r["sha256"], "accessed_utc": r["accessed_utc"]})
    return pages, sources, reached


def search_corpus(pages: list[dict], pattern: str) -> dict | None:
    for p in pages:
        m = re.search(pattern, p["text"], re.I)
        if m:
            a = max(0, m.start() - QUOTE_CHARS // 2)
            return {"source_url": p["url"], "accessed_utc": p["accessed_utc"],
                    "response_sha256": p["sha256"],
                    "matched_text": m.group(0),
                    "quoted_capability": ("…" if a else "") + p["text"][a:m.end() + QUOTE_CHARS // 2].strip() + "…"}
    return None


def run(competitors: list[str] | None = None, categories: list[str] | None = None,
        max_pages: int = MAX_PAGES_PER_VENDOR, pause: float = 0.3) -> dict:
    comps = competitors or list(COMPETITORS)
    cats = categories or list(CATEGORIES)
    corpora, sources, reach = {}, [], {}
    for comp in comps:
        pages, ss, got = corpus_for(COMPETITORS[comp], max_pages, pause)
        corpora[comp] = pages
        sources.extend(ss[:4])
        reach[comp] = {"domains": COMPETITORS[comp], "index_reached": got, "pages_read": len(pages),
                       "pages": [p["url"] for p in pages][:max_pages]}
    per_category: dict[str, list[dict]] = {}
    for cat in cats:
        rows = []
        for comp in comps:
            pages = corpora[comp]
            hit = search_corpus(pages, CATEGORIES[cat])
            rows.append({
                "competitor": comp,
                "documented_in_the_pages_read": bool(hit),
                "pages_read": len(pages),
                **(hit or {}),
                "not_found_means": None if hit else (
                    "the pattern for this category did not appear in the "
                    f"{len(pages)} page(s) of this vendor's own documentation that were read. It is a "
                    "statement about those pages and not about what the vendor offers")
                if pages else
                    "no page of this vendor's documentation could be read by this run, so nothing is concluded",
            })
        per_category[cat] = rows
    found = {k: sum(1 for r in v if r["documented_in_the_pages_read"]) for k, v in per_category.items()}
    vendors_all = [k for k, v in found.items() if v == len(comps)]
    return {
        "state": "CLAIM_MEASURED",
        "measured_at": c.now_iso(),
        "method": ("for each competitor, enumerate its own published index (robots.txt -> sitemap), fetch a "
                   "bounded set of its documentation pages once into a corpus, and search every declared "
                   "capability category across that corpus; each match is quoted from the vendor's own "
                   "visible page text with the URL, the access time and the response digest"),
        "window": "each competitor's published documentation as served at measured_at",
        "denominator": {
            "categories": len(cats), "competitors": len(comps),
            "category_vendor_pairs_searched": len(cats) * len(comps),
            "pairs_with_a_documented_capability": sum(found.values()),
            "pages_read_per_vendor": {k: v["pages_read"] for k, v in reach.items()},
            "pages_read_total": sum(v["pages_read"] for v in reach.values()),
            "max_pages_per_vendor": max_pages,
        },
        "categories_declared": {k: CATEGORIES[k] for k in cats},
        "competitor_reach": reach,
        "counterexamples_per_category": per_category,
        "counterexample_counts": found,
        "categories_documented_by_every_competitor_read": vendors_all,
        "sources": sources,
        "does_not_prove": [
            "no finding of falsity is made or implied about anyone. A counterexample bears on exclusivity in "
            "one declared category, nothing more",
            "'all-in-one' is not a defined term; this harness declares its own category list and a reader who "
            "disagrees with the categories should re-run it with theirs",
            "a documented capability is not a working, audited, adopted or comparable capability; the same "
            "word can name very different products",
            "these are the vendors' own marketing and documentation surfaces, measured as published text and "
            "not as delivered software",
            "a category not found in a vendor's corpus is absent from the pages read, which is a bounded set; "
            "it is not an absence from the vendor's offering",
        ],
    }


if __name__ == "__main__":
    print(json.dumps(run(max_pages=int(sys.argv[1]) if len(sys.argv) > 1 else MAX_PAGES_PER_VENDOR),
                     indent=1, ensure_ascii=False))
