#!/usr/bin/env python3
"""
EU Data Pull Pipeline — Sprint 1 Day 1
=======================================
Pulls key datasets from data.europa.eu via SPARQL and direct API endpoints.
Targets: EU AI Act database, Eurostat economic data, EEA environmental data.

Data Sources:
  - data.europa.eu SPARQL endpoint: https://data.europa.eu/sparql
  - EU AI Act datasets (EUR-Lex via data.europa.eu)
  - Eurostat SDMX REST API: https://ec.europa.eu/eurostat/api/dissemination/
  - EEA data service: https://www.eea.europa.eu/data-and-maps/

Output: Structured JSON in ~/clawd/.hive/data/eu/
Cache: 24-hour freshness with etag support

Usage:
  python3 eu_data_downloader.py              # Full pull
  python3 eu_data_downloader.py --dry-run    # List targets only
  python3 eu_data_downloader.py --force      # Skip cache checks
  python3 eu_data_downloader.py --category ai_act  # Pull specific category
"""

import json
import os
import sys
import hashlib
import ssl
import argparse
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

# SSL fix for macOS — use certifi bundle if available
try:
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()

# ─── Configuration ───────────────────────────────────────────────────────────
DATA_DIR = Path.home() / "clawd" / ".hive" / "data" / "eu"
CACHE_DIR = DATA_DIR / "cache"
MANIFEST_FILE = DATA_DIR / "manifest.json"
USER_AGENT = "MEOK-AI-EU-Data-Pipeline/1.0 (compliance-monitoring; mailto:nicholas@meok.ai)"

# ─── Dataset Targets ─────────────────────────────────────────────────────────
# Each entry has: name, title, category, query_type, query, url

DATASETS = [
    # ── EU AI Act ──
    {
        "name": "eu_ai_act_regulation_2024_1689",
        "title": "EU AI Act — Regulation (EU) 2024/1689",
        "category": "ai_act",
        "source": "eurlex",
        "description": "The full text of the EU Artificial Intelligence Act, laying down harmonised rules on AI.",
        "urls": [
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
        ],
        "sparql_query": None,
        "priority": 1,
    },
    {
        "name": "eu_ai_act_code_of_practice_2nd_draft",
        "title": "EU AI Act — Code of Practice for GPAI (2nd Draft)",
        "category": "ai_act",
        "source": "commission",
        "description": "Second draft of the Code of Practice for General-Purpose AI under the AI Act.",
        "urls": [
            "https://digital-strategy.ec.europa.eu/en/library/second-draft-general-purpose-ai-code-practice-published-written-independent-experts",
        ],
        "sparql_query": None,
        "priority": 1,
    },
    {
        "name": "eu_ai_act_datasets_index",
        "title": "data.europa.eu — AI-Act-related datasets",
        "category": "ai_act",
        "source": "data_europa_sparql",
        "description": "Search data.europa.eu for datasets tagged or relating to the EU AI Act and AI regulation.",
        "urls": [],
        "sparql_query": """
            PREFIX dcat: <http://www.w3.org/ns/dcat#>
            PREFIX dct: <http://purl.org/dc/terms/>
            SELECT ?dataset ?title ?description ?publisher ?issued ?theme
            WHERE {
              ?dataset a dcat:Dataset .
              ?dataset dct:title ?title .
              OPTIONAL { ?dataset dct:description ?description }
              OPTIONAL { ?dataset dct:publisher ?publisher }
              OPTIONAL { ?dataset dct:issued ?issued }
              OPTIONAL { ?dataset dcat:theme ?theme }
              FILTER(
                CONTAINS(LCASE(?title), "ai act") ||
                CONTAINS(LCASE(?title), "artificial intelligence act") ||
                CONTAINS(LCASE(?title), "artificial intelligence regulation") ||
                CONTAINS(LCASE(?description), "ai act") ||
                CONTAINS(LCASE(?description), "regulation 2024/1689")
              )
            }
            LIMIT 50
        """,
        "priority": 1,
    },

    # ── Eurostat Economic Data ──
    {
        "name": "eurostat_economy_gdp",
        "title": "Eurostat — GDP and main components (nama_10_gdp)",
        "category": "eurostat",
        "source": "eurostat_api",
        "description": "Quarterly GDP figures for EU member states via Eurostat SDMX REST API.",
        "urls": [
            "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp?format=JSON",
        ],
        "sparql_query": None,
        "priority": 2,
    },
    {
        "name": "eurostat_digital_economy",
        "title": "Eurostat — Digital Economy & Society (isoc)",
        "category": "eurostat",
        "source": "eurostat_api",
        "description": "ICT usage, e-commerce, digital skills across EU member states.",
        "urls": [
            "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_ec_evaln2?format=JSON",
            "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_sk_dskl_i?format=JSON",
        ],
        "sparql_query": None,
        "priority": 2,
    },
    {
        "name": "eurostat_rnd_expenditure",
        "title": "Eurostat — R&D expenditure (rd_e_gerdtot)",
        "category": "eurostat",
        "source": "eurostat_api",
        "description": "Research & development expenditure by sectors across EU — key for AI investment tracking.",
        "urls": [
            "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/rd_e_gerdtot?format=JSON",
        ],
        "sparql_query": None,
        "priority": 2,
    },
    {
        "name": "eurostat_employment_tech",
        "title": "Eurostat — Employment in technology sectors (htec)",
        "category": "eurostat",
        "source": "eurostat_api",
        "description": "High-tech employment statistics — ICT specialists, AI/ML workforce trends.",
        "urls": [
            "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/htec_emp_nat2?format=JSON",
        ],
        "sparql_query": None,
        "priority": 3,
    },
    {
        "name": "eurostat_datasets_index",
        "title": "data.europa.eu — Eurostat economic datasets",
        "category": "eurostat",
        "source": "data_europa_sparql",
        "description": "Search data.europa.eu for Eurostat-published datasets.",
        "urls": [],
        "sparql_query": """
            PREFIX dcat: <http://www.w3.org/ns/dcat#>
            PREFIX dct: <http://purl.org/dc/terms/>
            SELECT ?dataset ?title ?description ?publisher ?issued ?theme
            WHERE {
              ?dataset a dcat:Dataset .
              ?dataset dct:title ?title .
              ?dataset dct:publisher ?publisher .
              OPTIONAL { ?dataset dct:description ?description }
              OPTIONAL { ?dataset dct:issued ?issued }
              OPTIONAL { ?dataset dcat:theme ?theme }
              FILTER(CONTAINS(LCASE(?publisher), "eurostat"))
            }
            LIMIT 50
        """,
        "priority": 3,
    },

    # ── EEA Environmental Data ──
    {
        "name": "eea_air_quality",
        "title": "EEA — Air Quality e-Reporting (AQ e-Reporting)",
        "category": "eea",
        "source": "eea_api",
        "description": "EU-wide air quality measurements and exceedance reports.",
        "urls": [
            "https://www.eea.europa.eu/data-and-maps/data/aqereporting-9",
        ],
        "sparql_query": None,
        "priority": 3,
    },
    {
        "name": "eea_climate_adaptation",
        "title": "EEA — Climate-ADAPT platform datasets",
        "category": "eea",
        "source": "eea_api",
        "description": "Climate change adaptation data and case studies across the EU.",
        "urls": [
            "https://climate-adapt.eea.europa.eu/en/metadata",
        ],
        "sparql_query": None,
        "priority": 3,
    },
    {
        "name": "eea_greenhouse_gas",
        "title": "EEA — EU Greenhouse Gas Inventory",
        "category": "eea",
        "source": "eea_api",
        "description": "Annual EU greenhouse gas inventory submissions to UNFCCC.",
        "urls": [
            "https://www.eea.europa.eu/data-and-maps/data/national-emissions-reported-to-the-unfccc-and-to-the-eu-greenhouse-gas-monitoring-mechanism-18",
        ],
        "sparql_query": None,
        "priority": 3,
    },
    {
        "name": "eea_datasets_index",
        "title": "data.europa.eu — EEA environmental datasets",
        "category": "eea",
        "source": "data_europa_sparql",
        "description": "Search data.europa.eu for European Environment Agency-published datasets.",
        "urls": [],
        "sparql_query": """
            PREFIX dcat: <http://www.w3.org/ns/dcat#>
            PREFIX dct: <http://purl.org/dc/terms/>
            SELECT ?dataset ?title ?description ?publisher ?issued ?theme
            WHERE {
              ?dataset a dcat:Dataset .
              ?dataset dct:title ?title .
              ?dataset dct:publisher ?publisher .
              OPTIONAL { ?dataset dct:description ?description }
              OPTIONAL { ?dataset dct:issued ?issued }
              OPTIONAL { ?dataset dcat:theme ?theme }
              FILTER(
                CONTAINS(LCASE(?publisher), "european environment agency") ||
                CONTAINS(LCASE(?publisher), "eea")
              )
            }
            LIMIT 50
        """,
        "priority": 3,
    },
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def ensure_dirs():
    """Create output directories."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def fetch_url(url: str, timeout: int = 60) -> tuple[int, bytes | None, str]:
    """Fetch a URL and return (status, body_bytes, error_msg)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CONTEXT) as resp:
            return resp.status, resp.read(), ""
    except urllib.error.HTTPError as e:
        return e.code, None, f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return 0, None, f"URL Error: {e.reason}"
    except Exception as e:
        return 0, None, str(e)


def fetch_sparql(query: str, timeout: int = 90) -> tuple[int, dict | None, str]:
    """Execute a SPARQL query against data.europa.eu and return (status, results_dict, error)."""
    sparql_url = "https://data.europa.eu/sparql"
    params = urllib.parse.urlencode({"query": query, "format": "json"}).encode("utf-8")
    req = urllib.request.Request(
        sparql_url,
        data=params,
        headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CONTEXT) as resp:
            body = resp.read()
            results = json.loads(body)
            return resp.status, results, ""
    except urllib.error.HTTPError as e:
        return e.code, None, f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return 0, None, f"URL Error: {e.reason}"
    except json.JSONDecodeError as e:
        return 0, None, f"JSON decode error: {e}"
    except Exception as e:
        return 0, None, str(e)


def cache_key(dataset_name: str) -> Path:
    """Return the cache file path for a dataset."""
    return CACHE_DIR / f"{dataset_name}.json"


def is_cache_fresh(dataset_name: str, max_age_hours: int = 24) -> bool:
    """Check if cached data is still fresh."""
    ck = cache_key(dataset_name)
    if not ck.exists():
        return False
    age = datetime.now().timestamp() - ck.stat().st_mtime
    return age < (max_age_hours * 3600)


def save_to_cache(dataset_name: str, data: dict):
    """Save dataset result to cache."""
    ck = cache_key(dataset_name)
    ck.write_text(json.dumps(data, indent=2, ensure_ascii=False))


def load_cache(dataset_name: str) -> dict | None:
    """Load cached dataset result."""
    ck = cache_key(dataset_name)
    if ck.exists():
        return json.loads(ck.read_text())
    return None


# ─── Core Pipeline ────────────────────────────────────────────────────────────

def pull_dataset(ds: dict, force: bool = False) -> dict:
    """Pull a single dataset target. Returns result dict."""
    name = ds["name"]
    result = {
        "name": name,
        "title": ds["title"],
        "category": ds["category"],
        "source": ds["source"],
        "status": "pending",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "data": None,
        "urls_fetched": [],
        "sparql_results": None,
        "errors": [],
        "cache_hit": False,
    }

    # Check cache
    if not force and is_cache_fresh(name):
        cached = load_cache(name)
        if cached:
            cached["cache_hit"] = True
            cached["status"] = "cached"
            print(f"  ✓ {ds['title']} (cached)")
            return cached

    # SPARQL query
    if ds.get("sparql_query"):
        print(f"  ⏳ SPARQL: {ds['title']}")
        status, sparql_results, error = fetch_sparql(ds["sparql_query"])
        if error:
            result["errors"].append(f"SPARQL: {error}")
            print(f"    ✗ SPARQL failed: {error}")
        elif sparql_results is not None:
            bindings = sparql_results.get("results", {}).get("bindings", [])
            result["sparql_results"] = {
                "count": len(bindings),
                "head": sparql_results.get("head", {}).get("vars", []),
                "bindings": bindings[:100],  # Keep manageable
                "truncated": len(bindings) > 100,
            }
            print(f"    ✓ SPARQL returned {len(bindings)} results")

    # URL fetches
    if ds.get("urls"):
        for url in ds["urls"]:
            print(f"  ⏳ Fetch: {url[:80]}...")
            status, body, error = fetch_url(url)
            fetch_result = {
                "url": url,
                "status": status,
                "size": len(body) if body else 0,
                "error": error,
            }
            result["urls_fetched"].append(fetch_result)

            if error:
                result["errors"].append(f"URL {url}: {error}")
                print(f"    ✗ {error}")
            else:
                # Save raw body to disk if substantial
                if body and len(body) > 100:
                    dest = DATA_DIR / f"{name}_{_url_slug(url)}.raw"
                    dest.write_bytes(body)
                    print(f"    ✓ HTTP {status}, {len(body)} bytes → {dest.name}")
                else:
                    print(f"    ✓ HTTP {status}, {len(body)} bytes")

    # Determine final status
    if result["errors"]:
        result["status"] = "partial" if (result["sparql_results"] or result["urls_fetched"]) else "failed"
    elif result["sparql_results"] or result["urls_fetched"] or result.get("cache_hit"):
        result["status"] = "ok"
    else:
        result["status"] = "empty"

    # Cache
    save_to_cache(name, result)
    return result


def _url_slug(url: str) -> str:
    """Create a safe filename slug from a URL."""
    parsed = urllib.parse.urlparse(url)
    slug = parsed.path.strip("/").replace("/", "_") or "index"
    if len(slug) > 60:
        slug = hashlib.md5(url.encode()).hexdigest()[:12]
    return slug


# ─── Manifest ─────────────────────────────────────────────────────────────────

def write_manifest(results: list[dict]):
    """Write the full pull manifest."""
    ok_count = sum(1 for r in results if r["status"] in ("ok", "cached"))
    partial_count = sum(1 for r in results if r["status"] == "partial")
    failed_count = sum(1 for r in results if r["status"] == "failed")
    empty_count = sum(1 for r in results if r["status"] == "empty")

    manifest = {
        "pipeline": "eu_data_downloader",
        "version": "1.0.0",
        "run_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total": len(results),
            "ok": ok_count,
            "cached": sum(1 for r in results if r.get("cache_hit")),
            "partial": partial_count,
            "failed": failed_count,
            "empty": empty_count,
        },
        "by_category": {},
        "datasets": results,
    }

    # Per-category breakdown
    for cat in ["ai_act", "eurostat", "eea"]:
        cat_results = [r for r in results if r["category"] == cat]
        manifest["by_category"][cat] = {
            "total": len(cat_results),
            "ok": sum(1 for r in cat_results if r["status"] in ("ok", "cached")),
            "partial": sum(1 for r in cat_results if r["status"] == "partial"),
            "failed": sum(1 for r in cat_results if r["status"] == "failed"),
        }

    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    return manifest


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="EU Data Pull Pipeline — Sprint 1")
    parser.add_argument("--dry-run", action="store_true", help="List targets only, do not fetch")
    parser.add_argument("--force", action="store_true", help="Skip cache and force re-fetch")
    parser.add_argument("--category", choices=["ai_act", "eurostat", "eea"],
                        help="Pull only a specific category")
    parser.add_argument("--no-cache", action="store_true", help="Do not use or write cache")
    args = parser.parse_args()

    ensure_dirs()

    # Filter datasets
    targets = DATASETS
    if args.category:
        targets = [d for d in DATASETS if d["category"] == args.category]

    # Sort by priority
    targets.sort(key=lambda d: d.get("priority", 99))

    print(f"\n{'='*60}")
    print(f"  EU DATA PULL PIPELINE — Sprint 1 Day 1")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"  Targets: {len(targets)} datasets ({len(set(d['category'] for d in targets))} categories)")
    print(f"  Output: {DATA_DIR}")
    print(f"{'='*60}\n")

    if args.dry_run:
        print("DRY RUN — listing targets only:\n")
        for i, ds in enumerate(targets, 1):
            print(f"  {i:2d}. [{ds['category']:>10}] {ds['title']}")
            print(f"       Source: {ds['source']} | Priority: {ds.get('priority','-')}")
            if ds.get("sparql_query"):
                print(f"       Method: SPARQL query ({len(ds['sparql_query'])} chars)")
            if ds.get("urls"):
                print(f"       URLs: {len(ds['urls'])}")
            print()
        return

    results = []
    for i, ds in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {ds['title']}")
        result = pull_dataset(ds, force=args.force)
        results.append(result)
        status_icon = {"ok": "✅", "cached": "💾", "partial": "⚠️", "failed": "❌", "empty": "📭", "pending": "⏳"}
        print(f"  {status_icon.get(result['status'], '❓')} Status: {result['status']}")
        print()

    # Write manifest
    manifest = write_manifest(results)
    print(f"\n{'='*60}")
    print(f"  PIPELINE COMPLETE")
    print(f"  {'='*60}")
    print(f"  Total:   {manifest['summary']['total']}")
    print(f"  OK:      {manifest['summary']['ok']} (cached: {manifest['summary']['cached']})")
    print(f"  Partial: {manifest['summary']['partial']}")
    print(f"  Failed:  {manifest['summary']['failed']}")
    print(f"  Empty:   {manifest['summary']['empty']}")
    print(f"\n  Categories:")
    for cat, stats in manifest["by_category"].items():
        print(f"    {cat:>12}: {stats['ok']}/{stats['total']} ok, {stats['partial']} partial, {stats['failed']} failed")
    print(f"\n  Manifest: {MANIFEST_FILE}")
    print(f"{'='*60}\n")

    return 0 if manifest["summary"]["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
