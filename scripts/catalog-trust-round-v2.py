#!/usr/bin/env python3
"""The x402 Trust Round v2 — multi-catalog buyer's-eye coverage.

Round v2 probes EVERY live catalog we can read, one DRY pass each (cap: one
round per source per run; each source's row count is its probe count; the
<=100/audit rule is honoured by running the catalogs in separate rounds when
the combined count would exceed it — this producer is the round, the workflow
decides the cadence). Counts only by doctrine. Same shape as v1 so the MCP
tool and the public feed list the newest round per catalog.

Usage:
  python3 scripts/catalog-trust-round-v2.py [--sources payai,x402scan,agenttools] [--out-dir public/interop/x402-trust]

Stdlib only. Nothing is signed, nothing is sent, no wallet, no key.
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

UA = "csoai-catalog-trust/0.2"
TEMPLATE_PARAM = re.compile(r":([A-Za-z0-9_]+)")

SOURCES = {
    "payai": {
        "url": "https://facilitator.payai.network/discovery/resources",
        "rows": lambda d: d if isinstance(d, list) else d.get("items", d.get("resources", [])),
        "resource": lambda r: r.get("resource") or r.get("url") or "",
    },
    "x402scan": {
        "url": "https://api.x402scan.com/v1/resources",  # public read; if 404, the round reports UNREACHABLE, never a fake count
        "rows": lambda d: d if isinstance(d, list) else d.get("items", d.get("resources", d.get("data", []))),
        "resource": lambda r: r.get("resource") or r.get("url") or r.get("endpoint") or "",
    },
    "agenttools": {
        "url": "https://agent-tools.cloud/api/x402/services",
        "rows": lambda d: d if isinstance(d, list) else d.get("items", d.get("services", d.get("data", []))),
        "resource": lambda r: r.get("resource") or r.get("url") or r.get("endpoint") or "",
    },
}


def fetch(url: str, timeout: int = 14):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
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


def probe(resource: str, row: dict, idx: int):
    if not resource.startswith("http"):
        return {"idx": idx, "bucket": "no_url"}
    params = TEMPLATE_PARAM.findall(resource)
    probed = resource
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
    elif code == -1:
        bucket = "unreachable"
    elif code == 404:
        bucket = "real_404"
    else:
        bucket = "other_error"
    if params and bucket in ("real_404", "unreachable", "other_error"):
        bucket = "template_no_reply"
    return {"idx": idx, "resource": resource, "code": code, "bucket": bucket}


def load_rows(src_name: str, spec: dict):
    req = urllib.request.Request(spec["url"], headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    rows = spec["rows"](d)
    if not isinstance(rows, list):
        return None
    return [spec["resource"](r) for r in rows if isinstance(r, dict)]


def run_round(source_name: str, rows: list[str], max_workers: int = 12):
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
        for res in ex.map(lambda i: probe(rows[i], {}, i), range(len(rows))):
            results.append(res)
            time.sleep(0.05)
    b = Counter(r["bucket"] for r in results)
    return {
        "source": source_name,
        "counts": {
            "challenge_402": b.get("challenge", 0),
            "serves_200": b.get("serves_200", 0),
            "alive_needs_input": b.get("alive_needs_input", 0),
            "template_no_reply": b.get("template_no_reply", 0),
            "dead_404_or_unreachable": b.get("real_404", 0) + b.get("unreachable", 0),
            "other_error": b.get("other_error", 0),
            "total": len(rows),
        },
    }


# Unique public sources behind the 8 GSPC financial axes. Host names live HERE,
# never in the snapshot `counts` dict.
FINANCIAL_FACT_URLS = [
    "https://councilof.ai/api/xrpl",
    "https://s1.ripple.com:51234/",
    "https://ripple.com/solutions/stablecoin/transparency/",
    "https://app.ondo.finance/legal-documentation/us",
    "https://www.circle.com/transparency",
    "https://www.bitstamp.net",
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai?format=JSON&lang=EN&indic_is=E_AI_TANY&unit=PC_ENT&geo=EU27_2020",
    "https://api.worldbank.org/v2/country/EUU/indicator/SL.TLF.CACT.ZS?format=json&per_page=1",
    "https://www.figure.ai",
    "https://agilityrobotics.com",
    "https://bostondynamics.com",
    "https://www.unitree.com",
    "https://www.apptronik.com",
    "https://www.1x.tech",
    "https://www.tesla.com/AI",
    "https://www.sanctuary.ai",
]


def counts_have_no_hosts(counts: dict) -> bool:
    blob = json.dumps(counts)
    if "://" in blob or "http" in blob.lower():
        return False
    for k, v in counts.items():
        if not re.match(r"^[a-z][a-z0-9_]*$", str(k)):
            return False
        if isinstance(v, str) or (v is not None and not isinstance(v, (int, float, bool))):
            return False
    return True


def financial_round() -> dict:
    """One probe per 8-axis public source. Counts only."""
    probed = ok = unreach = challenge = 0
    for url in FINANCIAL_FACT_URLS:
        code, _, _ = fetch(url)
        probed += 1
        if code == 402:
            challenge += 1
            ok += 1
        elif code in (-1, 0) or code >= 400:
            unreach += 1
        else:
            ok += 1
    counts = {
        "probed": probed,
        "ok": ok,
        "unreachable": unreach,
        "challenge_402": challenge,
        "axes": 8,
        "total": probed,
    }
    if not counts_have_no_hosts(counts):
        raise RuntimeError("financial counts leaked a host name")
    if counts["probed"] > 100:
        raise RuntimeError("probe cap 100 exceeded")
    return {"source": "financial-facts", "counts": counts}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sources", default="payai,x402scan,agenttools")
    p.add_argument("--out-dir", default="public/interop/x402-trust")
    p.add_argument("--append-financial", action="store_true",
                   help="probe the 8 financial-axis sources and merge into v2-YYYY-MM-DD.json; never overwrite latest.json (v0.1 catalog snapshot)")
    a = p.parse_args()

    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if a.append_financial:
        v2s = sorted(out.glob("v2-*.json"))
        if v2s:
            body = json.loads(v2s[-1].read_text())
            rounds = [r for r in (body.get("rounds") or []) if r.get("source") != "financial-facts"]
        else:
            body, rounds = {"kind": "csoai.x402-catalog-trust-snapshot/0.2", "doctrine": "Counts only. A 402 is not delivery; a 404 is a phantom. Host details withheld. Never a certificate.", "method": "financial-facts append"}, []
        rounds.append(financial_round())
        body["rounds"] = rounds
        body["kind"] = "csoai.x402-catalog-trust-snapshot/0.2"
        body["as_of"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        (out / f"v2-{stamp}.json").write_text(json.dumps(body, indent=2) + "\n")
        print(json.dumps(rounds[-1]))
        print("wrote", out / f"v2-{stamp}.json")
        return 0

    rounds = []
    for name in a.sources.split(","):
        name = name.strip()
        spec = SOURCES.get(name)
        if not spec:
            continue
        try:
            resources = load_rows(name, spec)
        except Exception as e:
            rounds.append({"source": name, "error": str(e)[:80]})
            continue
        if not resources:
            rounds.append({"source": name, "error": "catalog not readable"})
            continue
        rounds.append(run_round(name, resources))

    body = {
        "kind": "csoai.x402-catalog-trust-snapshot/0.2",
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "rounds": rounds,
        "doctrine": "Counts only. A 402 is not delivery; a 404 is a phantom. Host details withheld. Never a certificate.",
        "method": "One DRY GET per resource (template params substituted), UA %s, 15s timeout, 12 workers, zero payment/sign/side-effect." % UA,
    }
    (out / f"v2-{stamp}.json").write_text(json.dumps(body, indent=2) + "\n")
    for rnd in rounds:
        print(json.dumps(rnd))
    print("wrote", out / f"v2-{stamp}.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
