#!/usr/bin/env python3
"""csoai-eat-4.py — 4 new public data sources we haven't touched.

Sources:
  1. OECD AI Policy Observatory — AI policies from OECD member states
  2. NIST AI RMF Crosswalk — cross-mapping to ISO 42001 + EU AI Act
  3. GitHub Security Advisories — open-source AI/ML CVE database
  4. HaveIBeenPwned — domain breach checking (CSOAI domain only)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "eat-4"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072


def curl(url: str, *, timeout: int = 30, accept: str = "application/json", extra_headers: list = None) -> tuple[int, str]:
    headers = ["-H", f"Accept: {accept}"]
    if extra_headers:
        for h in extra_headers:
            headers.extend(["-H", h])
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", *headers,
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
            f"Auto-mined by csoai-eat-4.py at {now}",
            f"Source: {source}",
        ],
    }


def mine_oecd_ai() -> list[dict]:
    """OECD AI Policy Observatory — sample the AI policy database."""
    out = []
    url = "https://oecd.ai/en/dashboards/policies"
    code, body = curl(url, accept="text/html")
    if code == 200:
        # Parse the count of policies from the dashboard
        import re
        for m in re.finditer(r"(\d+)\s+(?:AI\s+)?polic(?:y|ies)", body):
            n = int(m.group(1))
            if 50 < n < 2000:
                out.append({
                    "source": "oecd-ai", "kind": "policy-database",
                    "evidence": {"n_policies": n, "url": url},
                    "source_url": url,
                })
                break
    # Also try the JSON endpoint
    for endpoint in [
        "https://oecd.ai/api/policies?limit=10",
        "https://oecd.ai/api/countries?limit=10",
    ]:
        code, body = curl(endpoint)
        if code == 200 and body and body[0] in "{[":
            try:
                data = json.loads(body)
            except Exception:
                continue
            if isinstance(data, list):
                for r in data[:5]:
                    out.append({
                        "source": "oecd-ai", "kind": "ai-policy",
                        "evidence": r if isinstance(r, dict) else {"value": str(r)[:200]},
                        "source_url": endpoint,
                    })
            elif isinstance(data, dict):
                for k, v in list(data.items())[:5]:
                    out.append({
                        "source": "oecd-ai", "kind": "ai-policy",
                        "evidence": {"key": k, "value": str(v)[:200]},
                        "source_url": endpoint,
                    })
    return out[:30]


def mine_nist_crosswalk() -> list[dict]:
    """NIST AI RMF Crosswalk — sample cross-mapping entries."""
    out = []
    # The official NIST AI RMF + ISO 42001 + EU AI Act crosswalk
    url = "https://airc.nist.gov/AI_RMF_Crosswalks"
    code, body = curl(url, accept="text/html")
    if code == 200:
        out.append({
            "source": "nist-airmf-crosswalk", "kind": "crosswalk-database",
            "evidence": {"url": url, "as_of": "2026-09-03",
                         "note": "NIST AI RMF + ISO 42001 + EU AI Act crosswalk"},
            "source_url": url,
        })
    # Also the AI RMF Generative AI Profile
    for url in [
        "https://www.nist.gov/itl/ai-risk-management-framework",
        "https://airc.nist.gov/",
    ]:
        code, body = curl(url, accept="text/html")
        if code == 200:
            out.append({
                "source": "nist-airmf", "kind": "framework-page",
                "evidence": {"url": url, "as_of": "2026-09-03"},
                "source_url": url,
            })
    return out


def mine_gh_advisories() -> list[dict]:
    """GitHub Security Advisories — open-source AI/ML CVE database."""
    out = []
    # GitHub GraphQL API would need auth; REST search needs no auth
    for q in ["type:reviewed+ecosystem:pip+ai", "type:reviewed+ecosystem:npm+llm",
              "type:reviewed+ecosystem:pip+torch", "type:reviewed+ecosystem:npm+openai"]:
        url = f"https://api.github.com/advisories?per_page=10&{q}"
        code, body = curl(url, extra_headers=["User-Agent: csoai-badger"])
        if code != 200 or not body:
            continue
        try:
            data = json.loads(body)
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        for r in data[:5]:
            out.append({
                "source": "github-advisory", "kind": "security-advisory",
                "evidence": {
                    "ghsa_id": r.get("ghsa_id", ""),
                    "cve_id": r.get("cve_id", ""),
                    "summary": (r.get("summary") or "")[:200],
                    "severity": r.get("severity"),
                    "cvss_score": (r.get("cvss") or {}).get("score"),
                    "published_at": r.get("published_at"),
                },
                "source_url": r.get("html_url", f"https://github.com/advisories/{r.get('ghsa_id', '')}"),
            })
    return out[:30]


def mine_breach_check() -> list[dict]:
    """Check CSOAI domain against HaveIBeenPwned — UNCHECKABLE without API key.

    The HIBP /breacheddomain endpoint requires:
      1. An API key in the hibp-api-key header
      2. Domain verification (the domain owner has to register it)

    Without both, the API returns 401 — which is UNCHECKABLE, NOT 'zero breaches'.
    Reporting a 401 as 'the domain is breach-free' is a Category A error.
    Per CSOAI doctrine, the only honest answer is UNCHECKABLE.

    This miner emits UNCHECKABLE atoms by default. When a real API key is
    provided via env var HIBP_API_KEY, the atoms flip to MEASURED.
    """
    import os
    out = []
    api_key = os.environ.get("HIBP_API_KEY", "").strip()
    has_auth = bool(api_key)
    for domain in ["csoai.org", "councilof.ai", "meco.ai"]:
        url = f"https://haveibeenpwned.com/api/v3/breacheddomain/{domain}"
        headers = ["User-Agent: csoai-badger"]
        if has_auth:
            headers.append(f"hibp-api-key: {api_key}")
        code, body = curl(url, extra_headers=headers)
        if has_auth and code == 200:
            # Real authenticated check
            try:
                data = json.loads(body)
            except Exception:
                data = []
            n_breaches = len(data) if isinstance(data, list) else 0
            out.append({
                "source": "haveibeenpwned", "kind": "breach-record",
                "evidence": {
                    "domain": domain, "n_breaches": n_breaches,
                    "as_of": "2026-09-03",
                    "method": "authenticated HIBP API key",
                },
                "source_url": f"https://haveibeenpwned.com/",
            })
        elif code == 401:
            # UNCHECKABLE — not 'zero breaches'
            out.append({
                "source": "haveibeenpwned", "kind": "breach-check-UNCHECKABLE",
                "evidence": {
                    "domain": domain,
                    "http_status": 401,
                    "reason": "UNCHECKABLE — HIBP /breacheddomain requires an API key + domain verification. A 401 is not a clean bill of health. This atom is UNCHECKABLE per CSOAI doctrine.",
                    "method": "unauthenticated HIBP API call",
                    "as_of": "2026-09-03",
                },
                "source_url": f"https://haveibeenpwned.com/",
            })
        elif code == 404:
            # 404 is also UNCHECKABLE without API key, but a different shape
            out.append({
                "source": "haveibeenpwned", "kind": "breach-check-UNCHECKABLE",
                "evidence": {
                    "domain": domain,
                    "http_status": 404,
                    "reason": "UNCHECKABLE — HIBP 404 without authentication could mean 'no breaches' OR 'no API key'. Cannot distinguish without API key.",
                    "method": "unauthenticated HIBP API call",
                    "as_of": "2026-09-03",
                },
                "source_url": f"https://haveibeenpwned.com/",
            })
        else:
            out.append({
                "source": "haveibeenpwned", "kind": "breach-check-UNCHECKABLE",
                "evidence": {
                    "domain": domain,
                    "http_status": code,
                    "reason": f"UNCHECKABLE — unexpected HIBP response code {code}",
                    "method": "unauthenticated HIBP API call",
                    "as_of": "2026-09-03",
                },
                "source_url": f"https://haveibeenpwned.com/",
            })
    return out[:10]


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"eat-4-{stamp}.jsonl"
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
    "oecd-ai": mine_oecd_ai,
    "nist-crosswalk": mine_nist_crosswalk,
    "github-advisories": mine_gh_advisories,
    "breach-check": mine_breach_check,
}


def main():
    ap = argparse.ArgumentParser(description="EAT — 4 new sources.")
    ap.add_argument("--source", choices=list(HARVESTERS.keys()) + ["all"], default="all")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — EAT 4 NEW SOURCES")
    print("================================================================")
    print()
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
    print(f"  queue:         {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
