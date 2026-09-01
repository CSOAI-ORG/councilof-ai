#!/usr/bin/env python3
"""Deterministic financial-axis mill over the LIVE XRPL reader-16.

Schema csoai.financial-measure-run/0.3. Roster = GET https://councilof.ai/api/xrpl
(n=16, writes_board=false). Start set = the four bidirectional-verified issuers
(RLUSD, OUSG, USDB, BBRL), then the twelve well-known/registry rows in reader order.

Archax x abrdn and OpenEden TBILL are OFF this reader (BUSINESS-ERRATA 01Sep2026 §3).
They are parked under rwa-attest-other and this script REFUSES to run if they appear.

Three-state per fact: PASS / FAIL / UNCHECKABLE. UNREACHABLE pages make a fact
UNCHECKABLE, never FAIL. EURQ / USDQ / other reader sig_ed25519=null stays flagged.

Facts MEASURED. Risk verdict UNMEASURED. No model, no accuracy, no leader.
This process never loads a PKCS8. Card signing happens ONLY in GHA
(hf-fin-shells-measure -> /api/board-sign). Never a laptop key.
"""
from __future__ import annotations

import hashlib
import json
import re
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "public" / "interop"
UA = "CSOAI-fin-measure/0.3 (+https://councilof.ai)"
CTX = ssl.create_default_context()
READER = "https://councilof.ai/api/xrpl"
RPCS = ("https://xrplcluster.com", "https://s2.ripple.com:51234/")
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

START_SET = ["RLUSD", "OUSG", "USDB", "BBRL"]  # bidirectional domain verified
BANNED = ("archax", "openeden", "abrdn", "tbill", "aaulf")
PARKED = {
    "rwa-attest-other": [
        "Archax x abrdn USD Liquidity Fund",
        "OpenEden TBILL (TBL)",
    ],
    "note": "Off the live XRPL reader-16. Parked, not measured here. BUSINESS-ERRATA 01Sep2026 §3.",
}

# Curated disclosure pages where the estate's prior machinery already named them.
# Every other issuer is graded from its ON-CHAIN declared Domain (account_info),
# which is the same surface the reader's verification used. No invented URLs.
EXTRA_PAGES: dict[str, list[str]] = {
    "RLUSD": [
        "https://ripple.com/solutions/stablecoin/transparency/",
        "https://ripple.com/reports/rlusd-whitepaper.pdf",
    ],
    "OUSG": [
        "https://app.ondo.finance/legal-documentation/us",
        "https://ondo.finance/ousg",
    ],
    "USDB": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
    "BBRL": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
    "USDC": ["https://www.circle.com/transparency"],
}

PASS, FAIL, UNCHECKABLE = "PASS", "FAIL", "UNCHECKABLE"


def canonical_bytes(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def http_get(url: str, n: int = 120_000) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=20, context=CTX) as r:
            body = r.read(n)
            return {
                "http": r.status,
                "url": url,
                "final": r.geturl(),
                "content_type": (r.headers.get("content-type") or "")[:80],
                "n": len(body),
                "sha256": sha256_hex(body),
                "text": body.decode("utf-8", "replace"),
            }
    except urllib.error.HTTPError as e:
        return {"http": e.code, "url": url, "final": url, "content_type": "", "n": 0, "sha256": "", "text": ""}
    except Exception:
        return {"http": 0, "url": url, "final": url, "content_type": "", "n": 0, "sha256": "", "text": ""}


def xrpl(method: str, params: dict) -> dict:
    body = json.dumps({"method": method, "params": [params], "id": 1}).encode()
    last = None
    for rpc in RPCS:
        try:
            req = urllib.request.Request(
                rpc, data=body, headers={"Content-Type": "application/json", "User-Agent": UA}
            )
            with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
                return json.loads(r.read())
        except Exception as e:
            last = e
            time.sleep(0.6)
    return {"error": str(last)}


def decode_domain(hexs: str) -> str:
    if not hexs:
        return ""
    try:
        return bytes.fromhex(hexs).decode("ascii", "replace").strip()
    except Exception:
        return ""


def fetch_roster() -> list[dict]:
    hit = http_get(READER)
    if hit["http"] != 200:
        raise SystemExit(f"HALT reader UNREACHABLE http={hit['http']} — no roster, no run")
    d = json.loads(hit["text"])
    assets = d.get("assets") or []
    if d.get("n") != 16 or len(assets) != 16:
        raise SystemExit(f"HALT reader n={d.get('n')} assets={len(assets)} != 16 — roster drifted, refuse")
    for a in assets:
        blob = (str(a.get("symbol", "")) + " " + str(a.get("issuer", ""))).lower()
        if any(b in blob for b in BANNED):
            raise SystemExit(f"HALT banned name on reader: {a.get('symbol')} — park under rwa-attest-other")
    order = {s: i for i, s in enumerate(START_SET)}
    return sorted(assets, key=lambda a: (order.get(a["symbol"], 99), assets.index(a)))


def fetch_chain(addr: str) -> dict:
    info = xrpl("account_info", {"account": addr, "ledger_index": "validated"})
    ad = (info.get("result") or {}).get("account_data") or {}
    return {
        "domain": decode_domain(ad.get("Domain") or ""),
        "flags": ad.get("Flags"),
        "reachable": bool(ad),
    }


def pages_for(sym: str, chain_domain: str) -> list[str]:
    urls = list(EXTRA_PAGES.get(sym, []))
    if chain_domain:
        dom = chain_domain.lower()
        if not dom.startswith("http"):
            dom = "https://" + dom
        if dom not in urls:
            urls.append(dom)
    return urls


def fetch_all(urls: list[str]) -> tuple[list[dict], str, int]:
    hits = [http_get(u) for u in urls]
    ok = [h for h in hits if h["http"] == 200]
    text = "\n".join((h.get("text") or "")[:60_000] for h in ok)
    primary = ok[0]["url"] if ok else (urls[0] if urls else "")
    http = ok[0]["http"] if ok else (hits[0]["http"] if hits else 0)
    return hits, text, http if ok else http


def state_of(matched: bool, any_page_ok: bool) -> str:
    if not any_page_ok:
        return UNCHECKABLE  # UNREACHABLE is not FAIL
    return PASS if matched else FAIL


ATTEST_RE = re.compile(
    r"attestation report|independent accountant|certified public accountant|reserve report|"
    r"proof of reserves|Deloitte|KPMG|Ernst & Young|PricewaterhouseCoopers|\bPwC\b|Grant Thornton|\bBDO\b",
    re.I,
)
REGIMES = [
    ("NYDFS", r"NYDFS|New York State Department of Financial Services|limited purpose trust"),
    ("Reg D 506(c)", r"506\(c\)|Regulation D"),
    ("MiCA / EU e-money", r"\bMiCA\b|Markets in Crypto-Assets|e-money institution|electronic money institution|EMI licen[cs]e"),
    ("BACEN", r"Banco Central do Brasil|BACEN|Brazilian Central Bank"),
    ("Luxembourg MMFR", r"Money Market Fund Regulation|CSSF|MMFR"),
    ("UCITS", r"\bUCITS\b"),
    ("FCA (UK)", r"Financial Conduct Authority|\bFCA\b"),
    ("FINMA (CH)", r"\bFINMA\b"),
    ("MAS (SG)", r"Monetary Authority of Singapore|\bMAS\b licen[cs]e"),
    ("statute (sovereign)", r"Republic of Palau|national government|ministry of finance"),
]
CUSTODIAN_RE = re.compile(
    r"Bank of New York Mellon|BNY Mellon|\bBNY\b|State Street|Citibank|Standard Custody|"
    r"Coinbase Custody|BitGo|Fireblocks|Zodia|Komainu|Societe Generale Securities Services",
    re.I,
)
AUDITOR_RE = re.compile(
    r"Deloitte|KPMG|Ernst & Young|\bEY\b|PricewaterhouseCoopers|\bPwC\b|Grant Thornton|\bBDO\b|Mazars|TJ Assurance",
    re.I,
)


def first_match(regex: re.Pattern, text: str) -> str | None:
    m = regex.search(text)
    return m.group(0) if m else None


def grade(asset: dict, chain: dict, hits: list[dict], text: str) -> dict:
    sym = asset["symbol"]
    any_ok = any(h["http"] == 200 for h in hits)
    primary = next((h["url"] for h in hits if h["http"] == 200), hits[0]["url"] if hits else None)
    srcs = [{"url": h["url"], "http": h["http"], "sha256": h["sha256"] or None} for h in hits]

    attestor = first_match(ATTEST_RE, text)
    regime = None
    for label, pat in REGIMES:
        if re.search(pat, text, re.I):
            regime = label
            break
    custodian = first_match(CUSTODIAN_RE, text)
    auditor = first_match(AUDITOR_RE, text)
    kind = asset.get("kind")

    return {
        "id": sym,
        "issuer": asset.get("issuer"),
        "mainnet_issuer": asset.get("issuer_address"),
        "verified_via": asset.get("verified_via"),
        "reader_sig_ed25519": "present" if asset.get("sig_ed25519") else "null (flagged, stays flagged)",
        "chain_domain": chain.get("domain") or None,
        "source_pages": srcs,
        "primary_url": primary,
        "reserve": {
            "third_party_attestation_language": state_of(bool(attestor), any_ok),
            "attestor_or_language": attestor,
            "date": None,
            "date_note": "packet date not parsed this run; null stays null",
        },
        "regulatory": {
            "regime_declared_and_confirmable": state_of(bool(regime), any_ok),
            "regime": regime,
            "not_compliant_claim": True,
        },
        "distribution": {
            "classified_distributed_on_reader": PASS if kind == "distributed" else (FAIL if kind else UNCHECKABLE),
            "reader_kind": kind,
            "chain_supply": asset.get("supply"),
            "holders": asset.get("holders"),
            "represented_supply": None,
            "represented_gt_distributed": UNCHECKABLE,
            "represented_note": "no RWA.xyz key this run; represented supply not invented",
        },
        "custody": {
            "custodian_named_confirmable": state_of(bool(custodian), any_ok),
            "custodian": custodian,
            "auditor_named_confirmable": state_of(bool(auditor), any_ok),
            "auditor": auditor,
        },
        "page_state": "OK" if any_ok else "UNREACHABLE",
    }


def envelope(axis: str, rubric: str, rows: list[dict], supersedes: str | None) -> dict:
    body = {
        "schema": "csoai.financial-measure-run/0.3",
        "axis": axis,
        "as_of": AS_OF,
        "roster": "GET https://councilof.ai/api/xrpl (kind=reader, writes_board=false, n=16)",
        "order": "start set RLUSD, OUSG, USDB, BBRL (bidirectional domain), then reader order",
        "n": len(rows),
        "status": "MEASURED",
        "risk_verdict": "UNMEASURED",
        "three_state": "PASS / FAIL / UNCHECKABLE per fact. UNREACHABLE page => UNCHECKABLE, never FAIL.",
        "rubric": rubric,
        "supersedes": supersedes,
        "parked": PARKED,
        "measured": rows,
        "signing": (
            "Run body is UNSIGNED at rest. Cards are signed ONLY by GHA hf-fin-shells-measure via "
            "/api/board-sign. Never a laptop key. Board status changes only through that path."
        ),
        "honesty": (
            "Facts MEASURED. Risk/compliance/quality UNMEASURED. Not a rating, not advice, not an "
            "endorsement. Self-declare is not attestation. No model, no accuracy, no leader. "
            "EURQ/USDQ (and any other) reader sig_ed25519=null stays flagged."
        ),
    }
    body["content_id"] = sha256_hex(canonical_bytes(body))
    return body


def project(axis: str, r: dict) -> dict:
    if axis == "reserve-attestation":
        return {"id": r["id"], "s": r["reserve"]["third_party_attestation_language"]}
    if axis == "regulatory-framework":
        return {"id": r["id"], "s": r["regulatory"]["regime_declared_and_confirmable"]}
    if axis == "distribution-integrity":
        return {"id": r["id"], "s": r["distribution"]["classified_distributed_on_reader"]}
    return {
        "id": r["id"],
        "s": r["custody"]["custodian_named_confirmable"],
        "a": r["custody"]["auditor_named_confirmable"],
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    roster = fetch_roster()
    print("ROSTER", [a["symbol"] for a in roster])

    rows = []
    for asset in roster:
        chain = fetch_chain(asset["issuer_address"])
        urls = pages_for(asset["symbol"], chain.get("domain") or "")
        hits, text, _ = fetch_all(urls)
        rows.append(grade(asset, chain, hits, text))
        time.sleep(0.3)

    axes = {
        "reserve-attestation": "Third-party attestation language on a retrieved issuer page? PASS/FAIL/UNCHECKABLE. Self-declare != attestation.",
        "regulatory-framework": "Regime declared and confirmable on a retrieved URL? PASS/FAIL/UNCHECKABLE. Declaration only, never compliance.",
        "distribution-integrity": "Reader classification + chain supply + holders. represented>>distributed UNCHECKABLE without a same-unit pair.",
        "custody-disclosure": "Custodian named? Auditor named? PASS/FAIL/UNCHECKABLE each. Disclosure only, never quality.",
    }

    compact_path = OUT / "financial-measure-compact.json"
    compact_all = json.loads(compact_path.read_text(encoding="utf-8")) if compact_path.exists() else {}

    for axis, rubric in axes.items():
        old = OUT / f"financial-measure-run-{axis}.json"
        supersedes = None
        if old.exists():
            try:
                supersedes = json.loads(old.read_text(encoding="utf-8")).get("content_id")
            except Exception:
                supersedes = None
        body = envelope(axis, rubric, rows, supersedes)
        old.write_text(json.dumps(body, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

        c = {
            "axis": axis,
            "kind": "csoai.financial-measure-run/0.3",
            "n": len(rows),
            "roster": "xrpl-reader-16",
            "status": "MEASURED",
            "risk_verdict": "UNMEASURED",
            "as_of": AS_OF,
            "rows": [project(axis, r) for r in rows],
        }
        raw = canonical_bytes(c)
        if len(raw) > 3072:
            c["rows"] = [{"id": r["id"]} for r in rows]
            raw = canonical_bytes(c)
        compact_all[axis] = c
        print(f"WROTE {old.name} cid={body['content_id'][:16]} n={len(rows)} compact={len(raw)}B supersedes={str(supersedes)[:16]}")

    compact_path.write_text(json.dumps(compact_all, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    tallies = {
        axis: {
            s: sum(1 for r in rows if project(axis, r)["s"] == s) for s in (PASS, FAIL, UNCHECKABLE)
        }
        for axis in axes
    }
    print("TALLIES", json.dumps(tallies))
    print("AS_OF", AS_OF)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
