#!/usr/bin/env python3
"""csoai-t3-atoms.py — Tier 3 harvest: underutilized atoms.

Lane-doable: reads-only, no keys. Tier 3 = lower signal but still useful
atoms that we don't harvest anywhere else.

Sources wired:
- Wikidata SPARQL endpoint (open knowledge graph)
- Wikipedia (free API)
- Companies House (UK company data — we already have PSC)
- data.gov.uk (UK open data catalog)
- EU Open Data Portal
- Federal Register (US)
- regulations.gov (US dockets)
- GitHub advisories — already done in t2
- arXiv — already done in t2

Each emitted as an unsigned ≤3KB card.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "t3"
MAX = 3072
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"


def curl(url: str, timeout: int = 30) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception:
        return 0, ""


def curl_json(url: str, **kw):
    code, body = curl(url, **kw)
    if code != 200:
        return None
    try:
        return json.loads(body)
    except Exception:
        return None


def emit(kind: str, subject: dict, scope: dict, measurement: dict) -> int:
    body = {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "subject": subject,
        "scope": {"chain": "t3-harvest", "kind": kind, **scope},
        "measurement": measurement,
        "links": {"live_board": "https://councilof.ai/api/gspc",
                  "verify": "https://councilof.ai/gspc-verify"},
        "notes": [
            f"Auto-discovered by csoai-t3-atoms.py at {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}",
            "Tier 3 — open, permissionless, lower signal.",
        ],
    }
    blob = json.dumps(body, separators=(",", ":"))
    if len(blob) > MAX:
        return 0
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = int(time.time() * 1000)
    fname = f"t3-{kind}-{stamp}.jsonl"
    with open(QUEUE / fname, "a") as f:
        f.write(blob + "\n")
    return 1


# ---------- sources ----------

def source_wikidata() -> dict:
    """Wikidata SPARQL — find AI governance entities."""
    out = {"source": "wikidata", "atoms": 0, "status": "live"}
    query = """
    SELECT ?item ?itemLabel WHERE {
      ?item wdt:P31 wd:Q13382609 .  # instance of AI system
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 30
    """
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({
        "query": query, "format": "json",
    })
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    results = (data.get("results") or {}).get("bindings", [])
    for r in results:
        item = (r.get("item") or {}).get("value")
        label = (r.get("itemLabel") or {}).get("value")
        if not item:
            continue
        w = emit("wikidata-entity",
                 subject={"kind": "entity", "wikidata_qid": item, "label": label},
                 scope={"endpoint": "wikidata-sparql"},
                 measurement={"status": "DISCOVERED",
                              "note": "AI-system instance per P31/Q13382609"})
        if w:
            out["atoms"] += 1
    return out


def source_wikipedia() -> dict:
    """Wikipedia: AI governance article list (free API)."""
    out = {"source": "wikipedia", "atoms": 0, "status": "live"}
    # Wikipedia API: list articles in category
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:AI governance",
        "cmlimit": "30",
        "format": "json",
    })
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    pages = (data.get("query") or {}).get("categorymembers", [])
    for p in pages:
        title = p.get("title")
        pageid = p.get("pageid")
        if not title:
            continue
        w = emit("wikipedia-article",
                 subject={"kind": "article", "wikipedia": title, "pageid": pageid},
                 scope={"category": "AI governance"},
                 measurement={"status": "DISCOVERED",
                              "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title)}"})
        if w:
            out["atoms"] += 1
    return out


def source_companies_house() -> dict:
    """UK Companies House — we already have PSC. Free, keyless search."""
    out = {"source": "companies-house", "atoms": 0, "status": "live"}
    # Search for companies with 'AI' in their name (free Advanced Search)
    url = "https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?" + urllib.parse.urlencode({
        "companyNameIncludes": "artificial intelligence",
        "companyNameExcludes": "",
        "registeredOfficeAddress": "",
        "incorporatedFrom": "",
        "incorporatedTo": "",
        "sicCodes": "",
        "dissolvedFrom": "",
        "dissolvedTo": "",
        "companyStatus": "active",
        "companyType": "",
        "companySubtype": "",
        "page": "1",
    })
    code, body = curl(url, timeout=20)
    if code != 200:
        out["status"] = "UNREACHABLE"
        return out
    # Parse company numbers from the HTML — quick regex
    import re
    # sorted(), not list(): a set cannot be sliced (this raised
    # "'set' object is not subscriptable" on the source's first ever execution),
    # and set iteration order varies between runs, so an unsorted list would emit
    # a different 20 of the same page each time. In an estate whose atoms are
    # addressed by content digest, non-determinism here means duplicate atoms
    # for identical input.
    nums = sorted(set(re.findall(r"/company/(\w{8})", body)))[:20]
    for cn in nums:
        w = emit("companies-house",
                 subject={"kind": "company", "jurisdiction": "UK", "company_number": cn},
                 scope={"query": "artificial intelligence"},
                 measurement={"status": "DISCOVERED",
                              "url": f"https://find-and-update.company-information.service.gov.uk/company/{cn}"})
        if w:
            out["atoms"] += 1
    return out


def source_data_gov_uk() -> dict:
    """data.gov.uk — UK open data catalog. JSON API."""
    out = {"source": "data-gov-uk", "atoms": 0, "status": "live"}
    url = "https://data.gov.uk/api/3/action/package_search?q=AI&rows=20"
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    results = (data.get("result") or {}).get("results", [])
    for r in results:
        name = r.get("name")
        if not name:
            continue
        w = emit("data-gov-uk",
                 subject={"kind": "dataset", "jurisdiction": "UK", "title": name},
                 scope={"query": "AI"},
                 measurement={"status": "DISCOVERED",
                              "notes": (r.get("notes") or "")[:100]})
        if w:
            out["atoms"] += 1
    return out


def source_eu_open_data() -> dict:
    """EU Open Data Portal — 1.6M datasets."""
    out = {"source": "eu-open-data", "atoms": 0, "status": "live"}
    url = "https://data.europa.eu/api/hub/search/datasets?" + urllib.parse.urlencode({
        "q": "artificial intelligence",
        "limit": 20,
        "locale": "en",
    })
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    results = data.get("result") or {}
    items = results.get("results", []) if isinstance(results, dict) else results
    for r in items[:20]:
        title = r.get("title") or r.get("dct:title")
        if isinstance(title, list):
            title = title[0] if title else None
        if not title:
            continue
        w = emit("eu-open-data",
                 subject={"kind": "dataset", "jurisdiction": "EU", "title": title},
                 scope={"query": "artificial intelligence"},
                 measurement={"status": "DISCOVERED"})
        if w:
            out["atoms"] += 1
    return out


def source_federal_register() -> dict:
    """US Federal Register — daily AI mentions."""
    out = {"source": "federal-register", "atoms": 0, "status": "live"}
    # Free API, no key
    url = "https://www.federalregister.gov/api/v1/documents.json?" + urllib.parse.urlencode({
        "conditions[term]": "artificial intelligence",
        "conditions[publication_date][year]": "2026",
        "per_page": "20",
    })
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    results = data.get("results", [])
    for r in results:
        title = r.get("title")
        if not title:
            continue
        w = emit("federal-register",
                 subject={"kind": "document", "jurisdiction": "US", "title": title,
                          "fr_doc_number": r.get("document_number")},
                 scope={"term": "artificial intelligence", "year": "2026"},
                 measurement={"status": "DISCOVERED",
                              "publication_date": r.get("publication_date"),
                              "agency": (r.get("agencies") or [{}])[0].get("name")})
        if w:
            out["atoms"] += 1
    return out


def source_regulations_gov() -> dict:
    """US regulations.gov — AI-related dockets."""
    out = {"source": "regulations-gov", "atoms": 0, "status": "live"}
    url = "https://api.regulations.gov/v4/dockets?" + urllib.parse.urlencode({
        "filter[searchTerm]": "artificial intelligence",
        "page[size]": "20",
        "api_key": "DEMO_KEY",  # public demo key, rate-limited
    })
    data = curl_json(url)
    if not data or not isinstance(data, dict):
        return out
    items = (data.get("data") or [])
    for r in items:
        attrs = r.get("attributes", {})
        title = attrs.get("title")
        if not title:
            continue
        w = emit("regulations-gov",
                 subject={"kind": "docket", "jurisdiction": "US", "title": title,
                          "docket_id": attrs.get("docketId")},
                 scope={"term": "artificial intelligence"},
                 measurement={"status": "DISCOVERED",
                              "agency": attrs.get("agencyId")})
        if w:
            out["atoms"] += 1
    return out


# ---------- main ----------

SOURCES = {
    "wikidata": source_wikidata,
    "wikipedia": source_wikipedia,
    "companies-house": source_companies_house,
    "data-gov-uk": source_data_gov_uk,
    "eu-open-data": source_eu_open_data,
    "federal-register": source_federal_register,
    "regulations-gov": source_regulations_gov,
}


def main():
    ap = argparse.ArgumentParser(description="CSOAI — Tier 3 harvest.")
    ap.add_argument("--source", choices=list(SOURCES.keys()) + ["all"],
                    default="all")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — Tier 3 harvest (underutilized atoms)")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"  source: {args.source}  dry-run: {args.dry_run}")
    print(f"================================================================")
    print()

    sources = list(SOURCES.keys()) if args.source == "all" else [args.source]
    total = 0
    for s in sources:
        try:
            r = SOURCES[s]()
        except Exception as e:
            r = {"source": s, "status": "ERROR", "error": str(e)}
        print(f"  [{s:<22}] {json.dumps(r, sort_keys=True)}")
        if r.get("atoms"):
            total += r["atoms"]

    print()
    print(f"Total new atoms: {total}")
    if not args.dry_run:
        print(f"Queue dir: {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
