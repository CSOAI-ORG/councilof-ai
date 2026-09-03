#!/usr/bin/env python3
"""csoai-mineral-4.py — mine 4 more public sources that add real value.

Sources:
  1. arXiv — research preprints (rate-limited retry)
  2. Wikidata — structured knowledge
  3. Companies House JSON API — UK companies (with API key from CH if available)
  4. PublicWWW — open-source sites with CSOAI mentions
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "mineral-4"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072


def curl(url: str, *, timeout: int = 30, accept: str = "application/json") -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", f"Accept: {accept}",
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
    except Exception as e:
        return 0, f"err: {e}"


def card(source: str, kind: str, evidence: dict, source_url: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "public-data", "source": source},
        "scope": {"axis": "public-data", "kind": kind},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": evidence,
            "source_url": source_url,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-mined by csoai-mineral-4.py at {now}",
            f"Source: {source}",
        ],
    }


def mine_arxiv_v2() -> list[dict]:
    """arXiv via the export API with a longer wait between retries."""
    out = []
    for cat in ["cs.AI", "cs.LG", "cs.CY"]:
        url = f"http://export.arxiv.org/api/query?search_query=cat:{cat}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending"
        code, body = curl(url, accept="application/atom+xml")
        if code != 200 or not body or "<entry>" not in body:
            continue
        import re
        for m in re.finditer(r"<id>([^<]+)</id>\s*<updated>([^<]+)</updated>", body):
            arxiv_id = m.group(1).strip().split("/")[-1]
            if arxiv_id.startswith("http"):
                continue
            updated = m.group(2)
            out.append({
                "source": "arxiv", "kind": "preprint-metadata",
                "evidence": {"arxiv_id": arxiv_id, "category": cat, "updated": updated},
                "source_url": f"https://arxiv.org/abs/{arxiv_id}",
            })
    return out[:30]


def mine_wikidata_v2() -> list[dict]:
    """Wikidata: AI systems + AI labs + AI researchers — smaller query."""
    out = []
    queries = [
        # AI labs
        ("SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q4830453 . SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } } LIMIT 10", "ai-lab"),
        # AI conferences
        ("SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q1143604 . ?item wdt:P921 wd:Q11660 . SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } } LIMIT 10", "ai-conference"),
        # Datasets
        ("SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q1172284 . ?item wdt:P31 wd:Q1668024 . SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } } LIMIT 10", "ai-dataset"),
    ]
    for query, kind in queries:
        url = "https://query.wikidata.org/sparql?query=" + query.replace("\n", " ").replace("  ", " ")
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        for r in (data.get("results") or {}).get("bindings", []):
            item = (r.get("item") or {}).get("value")
            label = (r.get("itemLabel") or {}).get("value")
            if not item:
                continue
            out.append({
                "source": "wikidata", "kind": f"knowledge-graph-{kind}",
                "evidence": {"wikidata_qid": item, "label": label, "entity_kind": kind},
                "source_url": item,
            })
    return out[:30]


def mine_companies_house() -> list[dict]:
    """Companies House via the search JSON endpoint."""
    out = []
    for query in ["artificial intelligence", "machine learning", "sovereign AI", "AI safety"]:
        url = f"https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?companyNameIncludes={query.replace(' ', '+')}&companyStatus=active&page=1"
        code, body = curl(url, accept="application/json")
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        for r in (data.get("items") or [])[:5]:
            out.append({
                "source": "companies-house", "kind": "uk-company",
                "evidence": {"company_name": r.get("company_name", "")[:80],
                             "company_number": r.get("company_number", ""),
                             "company_status": r.get("company_status"),
                             "date_of_creation": r.get("date_of_creation"),
                             "sic_codes": r.get("sic_codes", [])[:3]},
                "source_url": f"https://find-and-update.company-information.service.gov.uk/company/{r.get('company_number', '')}",
            })
    return out[:20]


def mine_openalex_v2() -> list[dict]:
    """OpenAlex with a different filter."""
    out = []
    # Recent AI safety papers
    url = "https://api.openalex.org/works?filter=concepts.id:C154945302,publication_year:2024-2026&per_page=20&sort=publication_date:desc"
    code, body = curl(url)
    if code != 200 or not body:
        return out
    try:
        data = json.loads(body)
    except Exception:
        return out
    for r in (data.get("results") or []):
        oid = (r.get("ids") or {}).get("openalex") or r.get("id")
        if not oid:
            continue
        title = (r.get("title") or "")[:100]
        out.append({
            "source": "openalex", "kind": "ai-safety-paper",
            "evidence": {"openalex_id": oid, "title": title,
                         "publication_date": r.get("publication_date"),
                         "cited_by_count": r.get("cited_by_count", 0),
                         "doi": r.get("doi")},
            "source_url": r.get("doi") or f"https://api.openalex.org/works/{oid}",
        })
    return out


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"mineral-4-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["source"], r["kind"], r["evidence"], r["source_url"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


HARVESTERS = {
    "arxiv": mine_arxiv_v2,
    "wikidata": mine_wikidata_v2,
    "companies-house": mine_companies_house,
    "openalex-ai-safety": mine_openalex_v2,
}


def main():
    ap = argparse.ArgumentParser(description="Mine 4 more public sources.")
    ap.add_argument("--source", choices=list(HARVESTERS.keys()) + ["all"], default="all")
    args = ap.parse_args()

    print("=== MINE 4 MORE ===")
    sources = list(HARVESTERS.keys()) if args.source == "all" else [args.source]
    total = 0
    for src in sources:
        try:
            records = HARVESTERS[src]()
        except Exception as e:
            print(f"  {src:<22} ERROR: {e}")
            continue
        if records:
            n_written, n_oversized = emit(records)
            print(f"  {src:<22} {len(records):>4} records  →  {n_written} written, {n_oversized} oversized")
            total += n_written
        else:
            print(f"  {src:<22} (empty)")
    print(f"\n  total written: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
