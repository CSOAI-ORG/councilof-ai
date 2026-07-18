#!/usr/bin/env python3
"""EU Data Pipeline - Pulls key free datasets from EU open data portals.

Uses Python stdlib only (urllib, json, csv, etc).
Targets: Eurostat (economy, population, employment, energy),
          data.europa.eu SPARQL (AI Act registry),
          EEA (climate/environmental).

Outputs JSON files to ~/clawd/eu_data/
"""

import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ── SSL Fix for macOS Python ──────────────────────────────────────────────
# Python on macOS often can't find the system cert bundle.
# Set SSL_CERT_FILE env var or locate it here.
_CERT_PATHS = [
    os.environ.get("SSL_CERT_FILE", ""),
    "/etc/ssl/cert.pem",
    "/usr/local/etc/openssl/cert.pem",
    "/opt/homebrew/etc/openssl/cert.pem",
]
_CERT_FILE = next((p for p in _CERT_PATHS if p and os.path.exists(p)), None)
if _CERT_FILE:
    os.environ.setdefault("SSL_CERT_FILE", _CERT_FILE)
    ssl_context = ssl.create_default_context(cafile=_CERT_FILE)
else:
    ssl_context = ssl.create_default_context()

# ── Config ────────────────────────────────────────────────────────────────
OUTPUT_DIR = Path.home() / "clawd" / "eu_data"
USER_AGENT = "EU-Data-Pipeline/1.0 (hermes-agent; compliance data collector)"
TIMEOUT = 30  # seconds
RETRIES = 2

# ── Eurostat API v2.0 datasets ────────────────────────────────────────────
# Each entry: (dataset_code, short_name, description)
EUROSTAT_DATASETS = [
    ("tps00001", "population", "EU Population on 1 January (Eurostat tps00001)"),
    ("tec00114", "gdp", "GDP and main components - current prices (Eurostat tec00114)"),
    ("tesem010", "employment", "Employment by sex, age and NACE Rev. 2 (Eurostat tesem010)"),
    # Filter energy balance: annual, EU27, primary production, thousand tonnes oil equiv
    ("nrg_bal_s?freq=A&nrg_bal=G3000&unit=KTOE&geo=EU27_2020", "energy_balance", "Energy balance - primary production, EU27 (Eurostat nrg_bal_s)"),
]

# ── Data.europa.eu SPARQL queries ─────────────────────────────────────────
SPARQL_ENDPOINT = "https://data.europa.eu/sparql"

# Query for EU AI Act related datasets
AI_ACT_SPARQL = """
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?dataset ?title ?publisher ?issued
WHERE {
  ?dataset a dcat:Dataset .
  ?dataset dct:title ?title .
  OPTIONAL { ?dataset dct:publisher ?publisher . }
  OPTIONAL { ?dataset dct:issued ?issued . }
  FILTER(
    CONTAINS(LCASE(?title), "ai act") ||
    CONTAINS(LCASE(?title), "artificial intelligence act") ||
    CONTAINS(LCASE(?title), "regulation 2024/1689")
  )
}
LIMIT 20
"""

# Query for environmental datasets (EEA-sourced)
ENV_SPARQL = """
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?dataset ?title ?publisher
WHERE {
  ?dataset a dcat:Dataset .
  ?dataset dct:title ?title .
  ?dataset dct:publisher ?publisher .
  FILTER(
    CONTAINS(LCASE(STR(?publisher)), "eea") ||
    CONTAINS(LCASE(STR(?publisher)), "environment")
  )
  FILTER(CONTAINS(LCASE(?title), "climate") || CONTAINS(LCASE(?title), "emission"))
}
LIMIT 10
"""


def fetch_url(url, headers=None, data=None, method="GET"):
    """Fetch a URL with retries. Returns (status, body_bytes, content_type)."""
    if headers is None:
        headers = {}
    headers.setdefault("User-Agent", USER_AGENT)

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    last_err = None
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_context) as resp:
                body = resp.read()
                ct = resp.headers.get_content_type()
                return resp.status, body, ct
        except urllib.error.HTTPError as e:
            last_err = e
            body = e.read()
            if attempt < RETRIES:
                time.sleep(2 ** attempt)
            else:
                return e.code, body, ""
        except Exception as e:
            last_err = e
            if attempt < RETRIES:
                time.sleep(2 ** attempt)
            else:
                raise

    return 0, b"", ""


def download_eurostat_dataset(code, label):
    """Download a Eurostat dataset as JSON via the dissemination API."""
    # If code already has query params, append format; otherwise add it
    if "?" in code:
        url = f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{code}&format=JSON"
    else:
        url = f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{code}?format=JSON"
    # Use the base code for filename (strip query params)
    base_code = code.split("?")[0]
    print(f"  [Eurostat] Downloading {label} ({base_code})...", end=" ", flush=True)
    try:
        status, body, ct = fetch_url(url)
        if status == 200:
            data = json.loads(body)
            size = len(body)
            print(f"OK ({size:,} bytes)")
            return {"code": base_code, "label": label, "status": "success", "size": size, "data": data}
        else:
            print(f"FAIL (HTTP {status})")
            return {"code": base_code, "label": label, "status": f"HTTP_{status}", "size": len(body)}
    except Exception as e:
        print(f"FAIL ({e})")
        return {"code": base_code, "label": label, "status": "error", "error": str(e)}


def run_sparql_query(endpoint, query, label):
    """Run a SPARQL query using GET and return JSON results."""
    print(f"  [SPARQL] Querying {label}...", end=" ", flush=True)
    params = urllib.parse.urlencode({"format": "json", "query": query})
    url = f"{endpoint}?{params}"
    headers = {"Accept": "application/sparql-results+json"}
    try:
        status, body, ct = fetch_url(url, headers=headers, method="GET")
        if status == 200:
            data = json.loads(body)
            bindings = data.get("results", {}).get("bindings", [])
            print(f"OK ({len(bindings)} results)")
            return {"label": label, "status": "success", "count": len(bindings), "data": data}
        else:
            print(f"FAIL (HTTP {status})")
            # Check if body has useful error info
            try:
                err = json.loads(body) if body else {}
            except:
                err = {}
            return {"label": label, "status": f"HTTP_{status}", "error": err}
    except Exception as e:
        print(f"FAIL ({e})")
        return {"label": label, "status": "error", "error": str(e)}


def save_dataset(dataset, filename):
    """Save a dataset result to a JSON file."""
    path = OUTPUT_DIR / filename
    with open(path, "w") as f:
        json.dump(dataset, f, indent=2, default=str)
    return path


def main():
    """Main pipeline: download all datasets and save to disk."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {
        "pipeline": "EU Data Pipeline",
        "run_at": datetime.now(timezone.utc).isoformat(),
        "datasets": [],
    }

    print("=" * 60)
    print("EU Data Pipeline — Pulling key EU open datasets")
    print("=" * 60)

    # ── 1. Eurostat datasets ──────────────────────────────────────────
    print("\n[1/3] Eurostat Economy/Population/Employment/Energy:")
    for code, name, desc in EUROSTAT_DATASETS:
        result = download_eurostat_dataset(code, desc)
        result["source"] = "Eurostat"
        result["category"] = name
        results["datasets"].append(result)

        if result["status"] == "success":
            fname = f"eurostat_{name}_{code}.json"
            path = save_dataset(result, fname)
            print(f"        -> Saved {path}")

    # ── 2. data.europa.eu SPARQL (EU AI Act) ──────────────────────────
    print("\n[2/3] data.europa.eu SPARQL — EU AI Act & EEA datasets:")
    ai_result = run_sparql_query(SPARQL_ENDPOINT, AI_ACT_SPARQL, "EU AI Act datasets")
    ai_result["source"] = "data.europa.eu SPARQL"
    ai_result["category"] = "ai_act"
    results["datasets"].append(ai_result)

    if ai_result["status"] == "success":
        path = save_dataset(ai_result, "sparql_eu_ai_act.json")
        print(f"        -> Saved {path}")

    env_result = run_sparql_query(SPARQL_ENDPOINT, ENV_SPARQL, "EEA Climate/Emission datasets")
    env_result["source"] = "data.europa.eu SPARQL"
    env_result["category"] = "eea_environment"
    results["datasets"].append(env_result)

    if env_result["status"] == "success":
        path = save_dataset(env_result, "sparql_eea_environment.json")
        print(f"        -> Saved {path}")

    # ── 3. EEA direct data (GHG emissions trend) ──────────────────────
    print("\n[3/3] EEA direct — Climate/Environment indicators:")

    # Try EEA climate-energy portal data (GHG emissions)
    eea_urls = [
        ("https://climate-energy.eea.europa.eu/api/data/ghg-trends", "EEA GHG Trends"),
    ]
    for url, label in eea_urls:
        print(f"  [EEA] Downloading {label}...", end=" ", flush=True)
        try:
            status, body, ct = fetch_url(url)
            if status == 200:
                try:
                    data = json.loads(body)
                    size = len(body)
                    print(f"OK ({size:,} bytes)")
                    result = {"url": url, "label": label, "status": "success", "size": size, "data": data}
                except json.JSONDecodeError:
                    print(f"OK but not JSON ({len(body):,} bytes)")
                    result = {"url": url, "label": label, "status": "non_json", "size": len(body)}
            else:
                print(f"FAIL (HTTP {status})")
                result = {"url": url, "label": label, "status": f"HTTP_{status}"}
        except Exception as e:
            print(f"FAIL ({e})")
            result = {"url": url, "label": label, "status": "error", "error": str(e)}

        result["source"] = "EEA"
        result["category"] = "eea_environment"
        results["datasets"].append(result)

        if result["status"] == "success":
            fname = f"eea_{label.lower().replace(' ', '_')}.json"
            path = save_dataset(result, fname)
            print(f"        -> Saved {path}")

    # ── Save manifest ─────────────────────────────────────────────────
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    # ── Summary ───────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("PIPELINE SUMMARY")
    print("=" * 60)
    success_count = sum(1 for d in results["datasets"] if d["status"] == "success")
    total = len(results["datasets"])
    print(f"  Datasets attempted: {total}")
    print(f"  Successful:         {success_count}")
    print(f"  Failed:             {total - success_count}")
    print(f"  Output directory:   {OUTPUT_DIR}")
    print(f"  Manifest:           {manifest_path}")

    # List all saved files
    saved = sorted(OUTPUT_DIR.glob("*.json"))
    print(f"\n  Saved files ({len(saved)}):")
    for f in saved:
        print(f"    {f.name} ({f.stat().st_size:,} bytes)")

    return results


if __name__ == "__main__":
    main()
