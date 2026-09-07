#!/usr/bin/env python3
"""One ROUND of the x402 catalog trust snapshot, as a committed artefact (product leaf v0).

Pulls the live facilitator catalog (PayAI), runs one DRY probe per row (challenge
terms only — nothing signed, nothing sent, no side effect), buckets the outcomes,
and writes the counts-only public artefact plus a machine JSON. Doctrine: a 402 is
NOT delivery; a 404 is a catalog row that does not exist; host details are withheld
by design (a public list would name non-conformant parties); measurement, never
certification; counts derived, never typed.

Caps held by construction: exactly one audit per invocation, <= N probes (the
catalog's row count), no payment, no signing, no settlement.

Usage:
  python3 scripts/catalog-trust-round.py [--out-dir public/interop/x402-trust] [--catalog URL]

Lives in the repo so the pipeline can run it on the cadence (catalog-trust-round.yml).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_CATALOG = "https://facilitator.payai.network/discovery/resources"
SUBMIT_UA = "csoai-catalog-trust/0.1"

TEMPLATE_PARAM = re.compile(r":([A-Za-z0-9_]+)")


def fetch(url: str, timeout: int = 14):
    req = urllib.request.Request(url, headers={"User-Agent": SUBMIT_UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout):
            return 200, "", ""
    except urllib.error.HTTPError as e:
        try:
            body = e.read(1500).decode("utf-8", "replace")[:120]
        except Exception:
            body = ""
        return e.code, e.headers.get("content-type", ""), body
    except Exception as e:
        return -1, "", str(e)[:120]


def examples_for(row: dict):
    schema = row.get("inputSchema") or {}
    props = schema.get("properties") if isinstance(schema, dict) else {}
    vals = []
    for k, v in (props or {}).items():
        val = None
        if isinstance(v, dict):
            val = v.get("example") or v.get("default") or (v.get("enum") or [None])[0]
        if val in (None, ""):
            val = "test"
        vals.append(val)
    return vals


def probe_row(row: dict, idx: int):
    url = row.get("resource") or row.get("url") or ""
    if not url.startswith("http"):
        return {"idx": idx, "url": url, "bucket": "no-url"}
    params = TEMPLATE_PARAM.findall(url)
    probed = url
    if params:
        ex = examples_for(row)
        for j, p in enumerate(params):
            val = ex[j] if j < len(ex) and ex[j] else "test"
            probed = probed.replace(f":{p}", str(val), 1)
    code, ct, body = fetch(probed)
    if code == 402:
        bucket = "challenge"
    elif code == 200:
        bucket = "serves_200"
    elif code in (400, 405):
        bucket = "alive_needs_input"
    elif code == 404:
        bucket = "real_404"
    elif code == -1:
        bucket = "unreachable"
    else:
        bucket = "other_error"
    if params and bucket in ("real_404", "unreachable", "other_error"):
        bucket = "template_no_reply"
    return {"idx": idx, "url": url, "probed": probed, "code": code, "bucket": bucket, "snippet": body}


def run(out_dir: str, catalog_url: str):
    req = urllib.request.Request(catalog_url, headers={"User-Agent": SUBMIT_UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    rows = data if isinstance(data, list) else data.get("items", data.get("resources", []))
    total = len(rows)

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        for res in ex.map(lambda i: probe_row(rows[i], i), range(total)):
            results.append(res)
            time.sleep(0.05)

    b = Counter(r["bucket"] for r in results)
    deadline = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    counts = {
        "challenge_402": b.get("challenge", 0),
        "serves_200": b.get("serves_200", 0),
        "alive_needs_input": b.get("alive_needs_input", 0),
        "template_no_reply": b.get("template_no_reply", 0),
        "dead_404_or_unreachable": b.get("real_404", 0) + b.get("unreachable", 0),
        "other_error": b.get("other_error", 0),
        "total": total,
    }
    # Honesty: a 400/405 endpoint EXISTS (it demands its required arg); a 404 is a phantom.
    phantom = counts["dead_404_or_unreachable"] + counts["other_error"]
    summary = {
        "kind": "csoai.x402-catalog-trust-snapshot/0.1",
        "population": catalog_url,
        "as_of": deadline,
        "counts": counts,
        "headline": f"{counts['challenge_402']} of {total} rows answer a correct 402 challenge; "
                    f"{phantom} rows are phantom or unreachable. Counts only by doctrine.",
        "doctrine": "A 402 is NOT delivery; a 404 is a catalog row that does not exist. "
                    "Host details withheld by design; methodology published. Measurement, never certification.",
        "method": "One GET per row (template params substituted), UA %s, 15s timeout, 12 workers, "
                  "zero payment, zero signing, zero side effect." % SUBMIT_UA,
    }
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = deadline.split("T")[0]
    (out / f"{stamp}.json").write_text(json.dumps(summary, indent=2) + "\n")
    # The stable pointer the MCP x402_trust tool reads — always the newest round.
    (out / "latest.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(counts, indent=1))
    print("wrote", out / f"{stamp}.json", "and latest.json")
    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out-dir", default="public/interop/x402-trust")
    p.add_argument("--catalog", default=DEFAULT_CATALOG)
    a = p.parse_args()
    try:
        return run(a.out_dir, a.catalog)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
