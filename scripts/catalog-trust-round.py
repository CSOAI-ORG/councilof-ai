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
  python3 scripts/catalog-trust-round.py --append-financial [--force]
      # merge 8-axis source counts into the v0.1 latest.json the MCP x402_trust
      # tool reads. Does not re-probe the 100-row PayAI catalog. Cap ≤100. 2h gate.

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
from datetime import datetime, timedelta, timezone
from pathlib import Path

DEFAULT_CATALOG = "https://facilitator.payai.network/discovery/resources"
SUBMIT_UA = "csoai-catalog-trust/0.1"
V01_KIND = "csoai.x402-catalog-trust-snapshot/0.1"
V01_DATED = "2026-09-07.json"

TEMPLATE_PARAM = re.compile(r":([A-Za-z0-9_]+)")

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


def financial_probe_code(url: str) -> int:
    """One GET (or JSON-RPC POST for the public XRPL node). Returns HTTP code or -1."""
    if url.rstrip("/").endswith("51234"):
        req = urllib.request.Request(
            url,
            data=json.dumps({"method": "server_info", "params": [{}]}).encode(),
            headers={"User-Agent": SUBMIT_UA, "Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=14) as r:
                return int(r.status)
        except urllib.error.HTTPError as e:
            return int(e.code)
        except Exception:
            return -1
    code, _, _ = fetch(url)
    return code


def financial_counts() -> dict:
    probed = ok = unreach = challenge = 0
    for url in FINANCIAL_FACT_URLS:
        code = financial_probe_code(url)
        probed += 1
        if code == 402:
            challenge += 1
            ok += 1
        elif code in (-1, 0) or code >= 400:
            unreach += 1
        else:
            ok += 1
    extra = {
        "financial_probed": probed,
        "financial_ok": ok,
        "financial_unreachable": unreach,
        "financial_challenge_402": challenge,
        "financial_axes": 8,
        "financial_total": probed,
    }
    if not counts_have_no_hosts(extra):
        raise RuntimeError("financial counts leaked a host name")
    if extra["financial_probed"] > 100:
        raise RuntimeError("probe cap 100 exceeded")
    return extra


def _parse_iso(s: str):
    try:
        return datetime.strptime(s.replace("Z", "+0000"), "%Y-%m-%dT%H:%M:%S%z")
    except Exception:
        return None


def too_soon(iso: str | None, hours: int = 2) -> bool:
    ts = _parse_iso(iso) if iso else None
    if ts is None:
        return False
    return datetime.now(timezone.utc) - ts < timedelta(hours=hours)


def append_financial(out_dir: str, force: bool = False) -> int:
    """Merge 8-axis source counts into the v0.1 snapshot the MCP tool reads.

    Keeps kind v0.1, keeps PayAI catalog counts, does not add `rounds`.
    Writes latest.json AND the dated v0.1 file (generate-redirects rewrites latest → 2026-09-07.json).
    """
    out = Path(out_dir)
    latest = out / "latest.json"
    dated = out / V01_DATED
    src = latest if latest.exists() else dated
    if not src.exists():
        print("no v0.1 snapshot to merge into", file=sys.stderr)
        return 2
    body = json.loads(src.read_text())
    if body.get("kind") != V01_KIND:
        print("latest.json is not v0.1 — refuse to clobber", file=sys.stderr)
        return 2
    if "rounds" in body:
        print("latest.json has rounds — refuse to mix v0.2 into the MCP pointer", file=sys.stderr)
        return 2
    if not force and too_soon(body.get("financial_as_of")):
        print("skip: financial_as_of inside the 2h gate")
        print(json.dumps({k: body["counts"][k] for k in body["counts"] if str(k).startswith("financial") or k == "total"}, indent=1))
        return 0
    extra = financial_counts()
    counts = dict(body["counts"])
    counts.update(extra)
    body["counts"] = counts
    body["financial_as_of"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    text = json.dumps(body, indent=2) + "\n"
    latest.write_text(text)
    dated.write_text(text)
    print(json.dumps(extra, indent=1))
    print("wrote", latest, "and", dated)
    return 0


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
    p.add_argument("--append-financial", action="store_true",
                   help="merge 8-axis source counts into v0.1 latest.json (no PayAI re-probe)")
    p.add_argument("--force", action="store_true", help="ignore the 2h financial gate")
    a = p.parse_args()
    try:
        if a.append_financial:
            return append_financial(a.out_dir, force=a.force)
        return run(a.out_dir, a.catalog)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
