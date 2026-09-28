#!/usr/bin/env python3
"""CL-4 / ON-2 — does the named organisation's OWN public record mention the term?

A vendor naming an adopter, or quoting a testimonial, is the vendor's statement. This harness
does not test whether it is true. It tests one narrower, answerable thing: searching what the
named organisation itself publishes, can a keyless reader find the term on the organisation's
own site?

Three outcomes, and the wording of the last two is the whole point.

  CORROBORATED        a page on the organisation's own domain contains the term. The URL, the
                      HTTP status, the byte digest of the response and a quoted window of
                      VISIBLE text (script and style stripped, so a string buried in a JSON
                      blob does not count) are recorded.

  NOT_FOUND           the search reached the organisation's own index and did not find the
                      term there. That is a fact about this search, with its stated reach —
                      NOT evidence that the relationship does not exist, NOT a denial by the
                      organisation, and NOT a finding that anyone said anything false. This
                      module never emits such a word.

  SEARCH_INCONCLUSIVE the search could not reach the organisation's index at all, so it cannot
                      distinguish "not there" from "we could not look". Reported as its own
                      state and never collapsed into NOT_FOUND.

Two keyless routes, both over the organisation's own published index, plus a control:

  sitemap        robots.txt -> Sitemap: lines -> the sitemap(s) themselves, one index level
                 deep. Where robots.txt names none, the conventional /sitemap.xml is tried and
                 a 404 there is recorded as proving nothing, because it is a path we guessed.
  commoncrawl    the Common Crawl URL index (keyless, no account) restricted to the
                 organisation's own domain.
  control        before any conclusion, each route is asked whether it can see the domain AT
                 ALL. If neither route returns a single URL for the domain, the result is
                 SEARCH_INCONCLUSIVE.

Both routes match on the URL slug, then FETCH the live page and take the quote from the
organisation's own bytes. A bounded set of the organisation's own news/press/blog pages is
additionally read in full text, so a mention that never reaches a slug can still be found.
Whole-site full text is not searchable this way and the artifact says so.

No general web search engine is used: every one tried answered a bot challenge rather than
results from this host, and a search that was blocked must never be published as an absence.
"""
from __future__ import annotations

import gzip
import json
import re
import sys
import time
import urllib.parse

try:
    from . import common as c
except ImportError:
    import common as c  # type: ignore

CC_COLLINFO = "https://index.commoncrawl.org/collinfo.json"
QUOTE_CHARS = 300
MAX_SITEMAPS = 6
MAX_SITEMAP_URLS = 20000
MAX_TEXT_PAGES = 25
MAX_FETCH = 10
#: Common Crawl pages for a domain below which the CC route alone cannot support a conclusion.
MIN_CC_CONTROL = 50
NEWSY = ("news", "press", "media", "blog", "insight", "article", "stories", "newsroom", "announce")

#: Named subject -> the domains that are that subject's own public record.
ORG_DOMAINS: dict[str, list[str]] = {
    "Swift": ["swift.com"],
    "Euroclear": ["euroclear.com"],
    "Mastercard": ["mastercard.com"],
    "Fidelity International": ["fidelityinternational.com"],
    "UBS": ["ubs.com"],
    "ANZ": ["anz.com"],
    "Aave": ["aave.com", "governance.aave.com"],
    "GMX": ["gmx.io", "docs.gmx.io"],
    "Lido": ["lido.fi", "blog.lido.fi", "docs.lido.fi"],
    "ABN AMRO": ["abnamro.com"],
}

_CC_API: str | None = None
_CC_SOURCE: dict | None = None


def cc_api(bounded: bool = False) -> tuple[str | None, dict]:
    """The newest Common Crawl index, asked for once per process."""
    global _CC_API, _CC_SOURCE
    if _CC_API and _CC_SOURCE:
        return _CC_API, dict(_CC_SOURCE)
    r, data = c.get_json(CC_COLLINFO, timeout=15 if bounded else 45)
    src = c.source(r, "Common Crawl collection list (newest collection used)")
    if r["ok"] and isinstance(data, list) and data:
        _CC_API = data[0].get("cdx-api")
        _CC_SOURCE = src
    return _CC_API, src


def on_domain(url: str, domains: list[str]) -> bool:
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    return any(host == d or host.endswith("." + d) for d in domains)


def find_term(text: str, term: str) -> tuple[bool, str | None]:
    """Word-boundary match on VISIBLE text, returning the window it was found in."""
    m = re.search(r"\b" + re.escape(term) + r"\b", text, re.I)
    if not m:
        return False, None
    a = max(0, m.start() - QUOTE_CHARS // 2)
    return True, ("…" if a else "") + text[a:m.end() + QUOTE_CHARS // 2].strip() + "…"


def _sitemap_urls(domain: str, bounded: bool = False) -> tuple[list[str], list[dict], bool]:
    """Every URL the organisation's own sitemap publishes, one index level deep.

    Returns (urls, sources, reached): `reached` stays unset when the organisation's server answered
    every robots/sitemap request with a block or an error, which is the difference between
    "its index says nothing" and "we were not allowed to read its index".
    """
    sources, locs, sitemaps = [], [], []
    reached = False
    for host in (domain, f"www.{domain}"):
        r = c.get(f"https://{host}/robots.txt", timeout=15 if bounded else 45)
        sources.append(c.source(r, "the organisation's own robots.txt, for its Sitemap: lines"))
        if r["ok"]:
            reached = True
            sitemaps = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", r["body"].decode("utf-8", "replace"))
            if sitemaps:
                break
    guessed = not sitemaps
    if guessed:
        sitemaps = [f"https://{domain}/sitemap.xml", f"https://www.{domain}/sitemap.xml"]
    seen: set[str] = set()
    queue = sitemaps[:MAX_SITEMAPS]
    while queue and len(locs) < MAX_SITEMAP_URLS:
        sm = queue.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        rr = c.get(sm, timeout=30 if bounded else 150)
        note = "sitemap named by robots.txt"
        if guessed:
            note = ("sitemap tried at the conventional path because robots.txt named none; a 404 here is "
                    "a fact about a path we guessed and proves nothing about the site")
        sources.append(c.source(rr, note))
        if not rr["ok"]:
            continue
        reached = True
        body = rr["body"]
        if body[:2] == b"\x1f\x8b":
            try:
                body = gzip.decompress(body)
            except Exception:
                continue
        text = body.decode("utf-8", "replace")
        found = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", text)
        if "<sitemapindex" in text[:2000]:
            queue.extend([u for u in found if u not in seen][: MAX_SITEMAPS - len(seen)])
        else:
            locs.extend(found)
    return locs[:MAX_SITEMAP_URLS], sources, reached


def _cc_urls(domain: str, term: str, bounded: bool = False) -> tuple[list[str], int, list[dict]]:
    """(slug matches, control count, sources). The control is whether CC sees the domain at all."""
    api, s0 = cc_api(bounded=bounded)
    sources = [s0]
    if not api:
        return [], 0, sources
    base = f"{api}?url={urllib.parse.quote(domain)}&matchType=domain&output=json"
    # The public index throttles. A throttled control must not be published as "this domain is not
    # indexed", so it is retried with backoff and its HTTP status is recorded either way.
    control, ctl = 0, {"ok": False, "reason": "not attempted"}
    for attempt in range(1 if bounded else 3):
        ctl = c.get(base + "&limit=200", timeout=30 if bounded else 150)
        if ctl["ok"]:
            control = len([l for l in ctl["body"].decode("utf-8", "replace").splitlines() if '"url"' in l])
            break
        if not bounded:
            time.sleep(5 * (attempt + 1))
    sources.append(c.source(ctl, "control: does the Common Crawl index hold ANY page for this domain"))
    flt = urllib.parse.quote(f"~url:(?i).*\\b{re.escape(term.lower())}\\b.*")
    hit = {"ok": False, "reason": "not attempted", "url": base, "status": None,
           "accessed_utc": c.now_iso(), "bytes": 0, "sha256": ""}
    for attempt in range(1 if bounded else 3):
        hit = c.get(base + f"&limit=200&filter={flt}", timeout=30 if bounded else 180)
        if hit["ok"] or hit.get("status") == 404:  # 404 = the index answered: no captures matched
            break
        if not bounded:
            time.sleep(5 * (attempt + 1))
    sources.append(c.source(hit, f"Common Crawl URLs on this domain whose slug contains {term!r}"))
    urls: list[str] = []
    if hit["ok"]:
        for line in hit["body"].decode("utf-8", "replace").splitlines():
            if '"url"' not in line:
                continue
            try:
                u = json.loads(line)["url"]
            except Exception:
                continue
            if u not in urls and on_domain(u, [domain]):
                urls.append(u)
    return urls, control, sources


def check(org: str, term: str, domains: list[str] | None = None, pause: float = 0.4,
          bounded: bool = False) -> dict:
    doms = domains or ORG_DOMAINS.get(org) or []
    if not doms:
        return {"organisation": org, "term": term, "status": "NOT_SEARCHED",
                "reason": "no domain set recorded for this organisation"}
    sources: list[dict] = []
    candidates: list[str] = []
    text_pages: list[str] = []
    sitemap_urls = cc_control = 0
    sitemap_reached = cc_reached = False
    slug = re.compile(r"\b" + re.escape(term.lower()) + r"\b")
    for d in doms:
        # The homepage is always read in full text, so no organisation is concluded on zero pages.
        text_pages.append(f"https://{d}/")
        locs, ss, reached = _sitemap_urls(d, bounded=bounded)
        sources.extend(ss)
        sitemap_urls += len(locs)
        sitemap_reached = sitemap_reached or reached
        for u in locs:
            if slug.search(urllib.parse.unquote(u).lower()) and u not in candidates:
                candidates.append(u)
        newsy = [u for u in locs if any(n in u.lower() for n in NEWSY)]
        for u in (newsy or locs)[:MAX_TEXT_PAGES]:
            if u not in text_pages:
                text_pages.append(u)
        cc, control, ss2 = _cc_urls(d, term, bounded=bounded)
        sources.extend(ss2)
        cc_control += control
        cc_reached = cc_reached or control > 0
        for u in cc:
            if u not in candidates:
                candidates.append(u)
    fetched, hits = [], []
    read_ok = 0
    fetch_cap = 5 if bounded else MAX_FETCH
    page_cap = 8 if bounded else MAX_TEXT_PAGES
    for u in (candidates[:fetch_cap] + [p for p in text_pages[:page_cap] if p not in candidates]):
        time.sleep(0.1 if bounded else pause)
        pr = c.get(u, timeout=15 if bounded else 40)
        rec = c.source(pr)
        fetched.append(rec)
        if not pr["ok"]:
            continue
        read_ok += 1
        found, quote = find_term(c.visible_text(pr["body"]), term)
        if found:
            hits.append({**rec, "quote": quote})
        if len(hits) >= 3:
            break
    # The control, stated before the conclusion: a search only reaches NOT_FOUND if it could
    # actually look. Either the organisation's own index answered AND a page of its was read, or
    # the Common Crawl index holds a substantial number of its pages. Otherwise: INCONCLUSIVE.
    # At least one of the organisation's own pages must have been read. Without that, this host
    # could not open the site at all, and an absence found by a reader who was turned away is not
    # an absence. The slug routes alone never read a word of the organisation's text.
    conclusive = read_ok > 0 and (
        (sitemap_reached and sitemap_urls > 0) or cc_control >= MIN_CC_CONTROL)
    if hits:
        status = "CORROBORATED"
        meaning = ("a page on this organisation's own domain contains the term; the quote is from that "
                   "page's visible text, fetched from the organisation's own server")
    elif not conclusive:
        status = "SEARCH_INCONCLUSIVE"
        meaning = ("this run could not reach enough of the organisation's own index to conclude anything: "
                   f"its sitemap route yielded {sitemap_urls} URL(s) (reached={sitemap_reached}), the keyless "
                   f"Common Crawl index held {cc_control} page(s) for it, and {read_ok} of its pages could be "
                   "read. That is a limit of this search from this host — several large sites answer an "
                   "automated reader with a block — and it is NOT recorded as NOT_FOUND")
    else:
        status = "NOT_FOUND"
        meaning = ("we did not find the term on this organisation's own domains by the routes below. This is "
                   "a fact about this search — URL slugs across its published index, plus the full text of a "
                   "bounded set of its own news pages — and NOT evidence that the relationship does not "
                   "exist, NOT a denial by the organisation, and NOT a finding that anyone said anything false")
    return {
        "organisation": org,
        "term": term,
        "domains_searched": doms,
        "status": status,
        "meaning": meaning,
        "reach": {
            "conclusive": conclusive,
            "sitemap_route_reached": sitemap_reached,
            "sitemap_urls_seen": sitemap_urls,
            "commoncrawl_pages_indexed_seen": cc_control,
            "commoncrawl_control_threshold": MIN_CC_CONTROL,
            "pages_read_successfully": read_ok,
            "slug_candidates": len(candidates),
            "pages_fetched_and_read_in_full_text": len(fetched),
            "routes": ["organisation's own robots.txt -> sitemap(s), one index level deep",
                       "Common Crawl URL index restricted to the organisation's domain (keyless)"],
            "not_searched": "the full text of the whole site; only slugs across the index plus the fetched pages",
        },
        "corroborations": hits[:3],
        "pages_fetched": [f["url"] for f in fetched][:40],
        "sources": sources[:12],
        "checked_at": c.now_iso(),
    }


def run(term: str, orgs: list[str], pause: float = 0.4) -> dict:
    results = [check(o, term, pause=pause) for o in orgs]
    tally = {s: sum(1 for r in results if r["status"] == s)
             for s in ("CORROBORATED", "NOT_FOUND", "SEARCH_INCONCLUSIVE", "NOT_SEARCHED")}
    # A run that reached no verdict for any organisation has not measured anything. Reporting it
    # as CLAIM_MEASURED would let a run that was blocked everywhere read as a finding.
    conclusive_any = any(r["status"] in ("CORROBORATED", "NOT_FOUND") for r in results)
    return {
        "state": "CLAIM_MEASURED" if conclusive_any else "UNMEASURED",
        "reason": None if conclusive_any else (
            "no organisation in this run could be reached conclusively: every one is "
            "SEARCH_INCONCLUSIVE, so this run measured nothing and claims nothing"),
        "measured_at": c.now_iso(),
        "term": term,
        "method": ("for each named organisation, enumerate its own published index (robots.txt -> sitemaps, "
                   "and the keyless Common Crawl URL index for its domain), fetch every URL whose slug carries "
                   "the term plus a bounded set of its own news pages, and quote the term from the page's "
                   "VISIBLE text served by the organisation itself"),
        "window": "the organisation's public web presence as served at measured_at",
        "denominator": {"organisations_searched": len(results), **{k.lower(): v for k, v in tally.items()},
                        "pages_read_successfully_total": sum(r.get("reach", {}).get("pages_read_successfully", 0)
                                                             for r in results)},
        "organisations": results,
        "does_not_prove": [
            "NOT_FOUND means this search did not find it, by the stated routes. It is not a denial, not a "
            "contradiction, and not a finding that any statement is false",
            "SEARCH_INCONCLUSIVE means we could not look, and is reported separately for exactly that reason",
            "CORROBORATED means the organisation's own site names the term. It does not establish the scale, "
            "the status, the commercial terms or the currency of any relationship",
            "whole-site full text is not searched: slugs across the published index, plus the full text of the "
            "pages actually fetched. A mention in body text on a page outside that set would not be found",
            "pages behind a login, a paywall, a regional redirect, a bot challenge or a robots rule were not read",
        ],
    }


if __name__ == "__main__":
    term = sys.argv[1] if len(sys.argv) > 1 else "Chainlink"
    orgs = sys.argv[2:] or list(ORG_DOMAINS)
    print(json.dumps(run(term, orgs), indent=1, ensure_ascii=False))
