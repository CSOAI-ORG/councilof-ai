#!/usr/bin/env python3
"""csoai-public-data-mine.py — public open data harvester (the deep expansion).

Lane-doable: reads the 8 new public open data sources (OpenAlex, OSM,
World Bank, Eurostat, Open Library, arXiv, Wikidata, ONS) and emits
one unsigned ≤3KB card per atom. Reads the live board + each source's
public REST endpoint. No keys, no auth.

Usage:
  ./csoai-public-data-mine.py --source arxiv
  ./csoai-public-data-mine.py --all
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "public-data"
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
            f"Auto-mined by csoai-public-data-mine.py at {now}",
            f"Source: {source}",
            "Status DISCOVERED — public open data, not yet on the GSPC board.",
        ],
    }


def mine_arxiv() -> list[dict]:
    """Pull last 20 arXiv preprints in cs.AI + cs.CY."""
    out = []
    for cat in ["cs.AI", "cs.CY"]:
        url = f"http://export.arxiv.org/api/query?search_query=cat:{cat}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending"
        code, body = curl(url, accept="application/atom+xml")
        if code != 200 or not body:
            continue
        for m in re.finditer(r"<id>(\d+\.\d+(?:v\d+)?)</id>", body):
            arxiv_id = m.group(1)
            out.append({
                "source": "arxiv", "kind": "preprint-metadata",
                "evidence": {"arxiv_id": arxiv_id, "category": cat,
                             "url": f"https://arxiv.org/abs/{arxiv_id}"},
                "source_url": f"https://arxiv.org/abs/{arxiv_id}",
            })
    return out[:30]


def mine_openalex() -> list[dict]:
    """Pull last 20 OpenAlex works in AI safety / governance."""
    out = []
    for query in ["AI safety", "AI governance", "model evaluation", "alignment"]:
        url = f"https://api.openalex.org/works?search={query}&per_page=5&sort=publication_date:desc"
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        for r in (data.get("results") or []):
            oid = (r.get("ids") or {}).get("openalex") or r.get("id")
            if not oid:
                continue
            out.append({
                "source": "openalex", "kind": "academic-work",
                "evidence": {"openalex_id": oid, "title": (r.get("title") or "")[:100],
                             "publication_date": r.get("publication_date"),
                             "cited_by_count": r.get("cited_by_count", 0)},
                "source_url": r.get("doi") or f"https://api.openalex.org/works/{oid}",
            })
    return out[:30]


def mine_wikidata() -> list[dict]:
    """Sample 30 entities from Wikidata that are AI systems."""
    query = """
    SELECT ?item ?itemLabel WHERE {
      ?item wdt:P31 wd:Q13382609 .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 30
    """
    url = "https://query.wikidata.org/sparql?query=" + query.replace("\n", " ").replace("  ", " ")
    code, body = curl(url)
    if code != 200 or not body:
        return []
    try:
        data = json.loads(body)
    except Exception:
        return []
    out = []
    for r in (data.get("results") or {}).get("bindings", []):
        item = (r.get("item") or {}).get("value")
        label = (r.get("itemLabel") or {}).get("value")
        if not item:
            continue
        out.append({
            "source": "wikidata", "kind": "knowledge-graph-entity",
            "evidence": {"wikidata_qid": item, "label": label},
            "source_url": item,
        })
    return out[:30]


def mine_osm() -> list[dict]:
    """Geocode a few AI hubs."""
    out = []
    for q in ["Stanford University", "MIT CSAIL", "DeepMind London",
              "Anthropic San Francisco", "OpenAI San Francisco",
              "Mistral AI Paris", "Cohere Toronto", "Aleph Alpha Heidelberg"]:
        url = f"https://nominatim.openstreetmap.org/search?q={q.replace(' ', '+')}&format=json&limit=1"
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        if data:
            r = data[0]
            out.append({
                "source": "openstreetmap", "kind": "geocoded-place",
                "evidence": {"name": q, "display_name": r.get("display_name", "")[:120],
                             "lat": r.get("lat"), "lon": r.get("lon")},
                "source_url": f"https://nominatim.openstreetmap.org/?q={q.replace(' ', '+')}",
            })
    return out


def mine_world_bank() -> list[dict]:
    """Pull a few World Bank indicators."""
    out = []
    for ind in ["NY.GDP.MKTP.CD", "SP.POP.TOTL", "IT.NET.USER.ZS"]:
        url = f"https://api.worldbank.org/v2/country/WLD/indicator/{ind}?format=json&per_page=1"
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        records = data[1] if isinstance(data, list) and len(data) == 2 else []
        if not records or not records[0]:
            continue
        r = records[0]
        out.append({
            "source": "world-bank", "kind": "country-indicator",
            "evidence": {"indicator": ind, "country": "WLD", "year": r.get("date"),
                         "value": r.get("value")},
            "source_url": f"https://data.worldbank.org/indicator/{ind}?locations=WD",
        })
    return out


def mine_eurostat() -> list[dict]:
    """Pull a few Eurostat indicators."""
    out = []
    for ind in ["tec00118", "une_rt_a", "isoc_r_iuse_i"]:
        url = f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{ind}?format=JSON&lang=EN&sinceTimePeriod=2023"
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        out.append({
            "source": "eurostat", "kind": "eu-indicator",
            "evidence": {"indicator": ind, "dataset_label": (data.get("label") or "")[:80]},
            "source_url": f"https://ec.europa.eu/eurostat/databrowser/view/{ind}/default/table",
        })
    return out


def mine_open_library() -> list[dict]:
    """Pull top AI safety / governance books from Open Library."""
    out = []
    for q in ["AI safety", "AI governance", "alignment problem", "superintelligence"]:
        url = f"https://openlibrary.org/search.json?q={q.replace(' ', '+')}&limit=5"
        code, body = curl(url)
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        for d in (data.get("docs") or [])[:3]:
            out.append({
                "source": "open-library", "kind": "book-metadata",
                "evidence": {"title": d.get("title", ""), "key": d.get("key", ""),
                             "author": (d.get("author_name") or [""])[0],
                             "first_publish_year": d.get("first_publish_year")},
                "source_url": f"https://openlibrary.org{d.get('key', '')}",
            })
    return out[:20]


def mine_ons() -> list[dict]:
    """Pull a few ONS datasets."""
    out = []
    for ds in ["cpih01", "gdpq1", "lms"]:
        url = f"https://www.ons.gov.uk/economy/economicoutputandproductivityoutput/datasets/{ds}"
        code, body = curl(url, accept="text/html")
        if code != 200 or not body:
            continue
        out.append({
            "source": "ons", "kind": "uk-statistics-dataset",
            "evidence": {"dataset_id": ds, "as_of": "2026-09-03"},
            "source_url": url,
        })
    return out


HARVESTERS = {
    "arxiv": mine_arxiv,
    "openalex": mine_openalex,
    "wikidata": mine_wikidata,
    "openstreetmap": mine_osm,
    "world-bank": mine_world_bank,
    "eurostat": mine_eurostat,
    "open-library": mine_open_library,
    "ons": mine_ons,
}


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"public-data-{stamp}.jsonl"
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


def main():
    ap = argparse.ArgumentParser(description="Public data harvester.")
    ap.add_argument("--source", choices=list(HARVESTERS.keys()) + ["all"], default="all")
    args = ap.parse_args()

    print(f"=== PUBLIC DATA MINE (the deep expansion) ===")
    sources = list(HARVESTERS.keys()) if args.source == "all" else [args.source]
    total = 0
    for src in sources:
        try:
            records = HARVESTERS[src]()
        except Exception as e:
            print(f"  {src:<20} ERROR: {e}")
            continue
        if records:
            n_written, n_oversized = emit(records)
            print(f"  {src:<20} {len(records):>4} records  →  {n_written} written, {n_oversized} oversized")
            total += n_written
        else:
            print(f"  {src:<20} (empty)")
    print(f"\n  total written: {total}")
    print(f"  queue:         {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
