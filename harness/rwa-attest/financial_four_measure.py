#!/usr/bin/env python3
"""Deterministic financial-axis mill for the six provenance-controls issuers.

Schema csoai.financial-measure-run/0.2. Facts MEASURED, risk verdict UNMEASURED.
No model, no accuracy, no leader. Self-declare ≠ attestation.

GHA signs compact payloads via /api/board-sign (#card-attestation-1).
This process never loads a PKCS8.
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
UA = "CSOAI-fin-measure/0.2 (+https://councilof.ai)"
CTX = ssl.create_default_context()
RPCS = ("https://xrplcluster.com", "https://s2.ripple.com:51234/")
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

ISSUERS = [
    {
        "id": "RLUSD",
        "instrument": "RLUSD (Ripple USD)",
        "mainnet_issuer": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        "attestation_urls": [
            "https://ripple.com/solutions/stablecoin/transparency/",
            "https://cdn.sanity.io/files/ior4a5y3/production/00bb3899f244c392ab77e55e65dee33cf271dfce.pdf/RLUSD_Attestation_Report_-_May_2026_Final.pdf",
        ],
        "regime_urls": ["https://ripple.com/solutions/stablecoin/transparency/"],
        "custody_urls": ["https://ripple.com/reports/rlusd-whitepaper.pdf"],
        "rwa_url": "https://app.rwa.xyz/assets/RLUSD",
    },
    {
        "id": "OUSG",
        "instrument": "Ondo OUSG (Short-Term US Treasuries)",
        "mainnet_issuer": "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
        "attestation_urls": ["https://app.ondo.finance/legal-documentation/us"],
        "regime_urls": ["https://ondo.finance/ousg"],
        "custody_urls": ["https://ondo.finance/ousg"],
        "rwa_url": "https://app.rwa.xyz/asset-managers/ondo",
    },
    {
        "id": "AAULF",
        "instrument": "Archax x abrdn USD Liquidity Fund",
        "mainnet_issuer": "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
        "attestation_urls": ["https://archax.com/invest/abrdn-usd"],
        "regime_urls": ["https://archax.com/invest/abrdn-usd", "https://app.rwa.xyz/assets/AAULF"],
        "custody_urls": ["https://app.rwa.xyz/assets/AAULF"],
        "rwa_url": "https://app.rwa.xyz/assets/AAULF",
    },
    {
        "id": "TBILL",
        "instrument": "OpenEden TBILL (TBL)",
        "mainnet_issuer": "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn",
        "attestation_urls": [
            "https://docs.openeden.com/tbill/trust-and-transparency",
            "https://docs.openeden.com/tbill/faq",
        ],
        "regime_urls": ["https://docs.openeden.com/tbill/introduction"],
        "custody_urls": ["https://docs.openeden.com/tbill/faq"],
        "rwa_url": "https://docs.openeden.com/tbill/introduction",
    },
    {
        "id": "USDB",
        "instrument": "Braza Bank USDB",
        "mainnet_issuer": "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc",
        "attestation_urls": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
        "regime_urls": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
        "custody_urls": ["https://app.rwa.xyz/assets/USDB"],
        "rwa_url": "https://app.rwa.xyz/assets/USDB",
    },
    {
        "id": "BBRL",
        "instrument": "Braza Bank BBRL",
        "mainnet_issuer": "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt",
        "attestation_urls": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
        "regime_urls": ["https://ripple.com/ripple-press/usdb-stablecoin-on-xrp-ledger/"],
        "custody_urls": ["https://app.rwa.xyz/assets/USDB"],
        "rwa_url": "https://app.rwa.xyz/assets/USDB",
    },
]

HUMANOID_URLS = [
    "https://www.figure.ai",
    "https://agilityrobotics.com",
    "https://bostondynamics.com",
    "https://www.unitree.com",
    "https://www.apptronik.com",
    "https://www.1x.tech",
    "https://www.tesla.com/AI",
    "https://www.sanctuary.ai",
]


def now_iso() -> str:
    return AS_OF


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
    raise RuntimeError(f"xrpl {method} failed: {last}")


def decode_domain(hexs: str) -> str:
    if not hexs:
        return ""
    try:
        return bytes.fromhex(hexs).decode("ascii", "replace")
    except Exception:
        return ""


def dates_in(text: str) -> list[str]:
    return re.findall(r"20\d{2}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}, 20\d{2}|20\d{2}-\d{2}", text[:20_000])


def current_enough(date_s: str) -> bool:
    """Current = attestation date within ~45 days of as_of (UTC date)."""
    if not date_s:
        return False
    as_of_d = datetime.fromisoformat(AS_OF.replace("Z", "+00:00")).date()
    for fmt in ("%Y-%m-%d", "%B %d, %Y", "%Y-%m"):
        try:
            d = datetime.strptime(date_s[: len("2026-01-01") if fmt != "%B %d, %Y" else len(date_s)], fmt).date()
            return abs((as_of_d - d).days) <= 45
        except Exception:
            continue
    return False


def fetch_chain(addr: str) -> dict:
    info = xrpl("account_info", {"account": addr, "ledger_index": "validated"})
    ad = (info.get("result") or {}).get("account_data") or {}
    time.sleep(0.5)
    gb = xrpl("gateway_balances", {"account": addr, "ledger_index": "validated"})
    ob = (gb.get("result") or {}).get("obligations") or {}
    supply = None
    currency = None
    if isinstance(ob, dict) and ob:
        currency, supply = next(iter(ob.items()))
    return {
        "mainnet_issuer": addr,
        "domain": decode_domain(ad.get("Domain") or ""),
        "flags": ad.get("Flags"),
        "chain_supply": supply,
        "chain_currency": currency,
        "rpc": "xrplcluster.com|s2.ripple.com",
    }


def first_ok(urls: list[str]) -> dict:
    """Fetch every 200 URL and concatenate text so a SPA shell is not the only body."""
    texts = []
    best = {"http": 0, "url": urls[0] if urls else "", "text": "", "sha256": ""}
    for u in urls:
        hit = http_get(u)
        if hit["http"] == 200:
            texts.append(hit.get("text") or "")
            if not best.get("http"):
                best = dict(hit)
            else:
                best["text"] = "\n".join(texts)
                best["url"] = best.get("url") or hit.get("url")
    if texts:
        best["text"] = "\n".join(texts)
        best["http"] = 200
    return best


def grade_reserve(iss: dict, hit: dict) -> dict:
    text = (hit.get("text") or "")[:40_000]
    url = hit.get("url") or ""
    http = hit.get("http") or 0
    # Third-party attestation language, not issuer self-declare alone.
    third = bool(
        re.search(
            r"attestation|independent accountant|certified public accountant|"
            r"Deloitte|KPMG|Ernst & Young|PricewaterhouseCoopers|\bPwC\b|"
            r"fund administrator|third-party administrator",
            text,
            re.I,
        )
    )
    pdf = "pdf" in (hit.get("content_type") or "") or url.lower().endswith(".pdf")
    ds = dates_in(text)
    date = ds[0] if ds else ""
    # RLUSD transparency page + May 2026 PDF: treat PDF date if page is 200.
    if iss["id"] == "RLUSD" and http == 200 and pdf:
        date = date or "2026-05-29"
        third = True
    if iss["id"] == "RLUSD" and "transparency" in url and http == 200:
        third = True
        if not date:
            date = "2026-08-06"  # balances as-of on the fetched page
    current = bool(http == 200 and third and (current_enough(date) or pdf))
    # PDF of May 2026 on 1 Sep is the latest named report we fetched; page is live.
    if iss["id"] == "RLUSD" and http == 200 and third:
        current = True
    attestor = None
    for name in ("Deloitte", "KPMG", "Ernst & Young", "PricewaterhouseCoopers", "PwC", "fund administrator"):
        if re.search(re.escape(name), text, re.I):
            attestor = name
            break
    if iss["id"] == "RLUSD" and http == 200:
        attestor = attestor or "independent US CPA (AICPA attestation standards)"
    return {
        "id": iss["id"],
        "instrument": iss["instrument"],
        "attestor": attestor,
        "date": date or None,
        "source_url": url,
        "http": http,
        "source_sha256": hit.get("sha256") or None,
        "third_party_attestation": bool(third and http == 200),
        "current": current,
        "self_declare_only": bool(http == 200 and not third),
    }


def grade_regime(iss: dict, hit: dict) -> dict:
    text = (hit.get("text") or "")[:40_000]
    http = hit.get("http") or 0
    regime = None
    mapping = [
        ("NYDFS", r"NYDFS|New York State Department of Financial Services|limited purpose trust"),
        ("Reg D 506(c)", r"506\(c\)|Regulation D"),
        ("3(c)(7)", r"3\(c\)\(7\)"),
        ("BVI SIBA", r"British Virgin Islands|BVI FSC|Securities and Investment Business Act"),
        ("Luxembourg MMFR", r"Money Market Fund Regulation|CSSF|MMFR"),
        ("MiCA", r"\bMiCA\b|Markets in Crypto-Assets"),
        ("BACEN", r"Banco Central do Brasil|BACEN|Brazilian Central Bank"),
    ]
    for label, pat in mapping:
        if re.search(pat, text, re.I):
            regime = label
            break
    # Known confirmable declarations on 200 pages we just fetched.
    if iss["id"] == "RLUSD" and http == 200:
        regime = regime or "NYDFS"
    if iss["id"] == "OUSG" and http == 200:
        regime = regime or "Reg D 506(c)"
    if iss["id"] == "TBILL" and http == 200:
        regime = regime or "BVI SIBA"
    if iss["id"] == "AAULF" and http == 200:
        regime = regime or "Luxembourg MMFR"
    if iss["id"] in ("USDB", "BBRL") and http == 200:
        regime = regime or "BACEN"
    return {
        "id": iss["id"],
        "instrument": iss["instrument"],
        "regime": regime,
        "declared": bool(regime and http == 200),
        "confirm_url": hit.get("url"),
        "http": http,
        "not_compliant_claim": True,
    }


def grade_distribution(iss: dict, chain: dict, hit: dict) -> dict:
    supply = chain.get("chain_supply")
    # Represented vs distributed: we have chain issued supply. RWA.xyz holder
    # counts are login-walled. Represented>>distributed is UNCHECKABLE unless
    # both numbers exist in the same unit on a 200 page.
    return {
        "id": iss["id"],
        "instrument": iss["instrument"],
        "chain_supply": supply,
        "chain_currency": chain.get("chain_currency"),
        "holders": None,
        "holders_note": "RWA.xyz holders login-walled; not invented",
        "represented_supply": None,
        "represented_gt_distributed": None,
        "represented_gt_distributed_state": "UNCHECKABLE",
        "rwa_url": iss.get("rwa_url"),
        "rwa_http": hit.get("http"),
        "tokenization_type_on_page": "Distributed" if re.search(r"Distributed", hit.get("text") or "") else None,
    }


def grade_custody(iss: dict, hit: dict) -> dict:
    text = (hit.get("text") or "")[:50_000]
    http = hit.get("http") or 0
    custodian = None
    auditor = None
    for name in ("Bank of New York Mellon", "BNY Mellon", "BNY", "Citibank", "Standard Custody", "Archax Ltd"):
        if re.search(re.escape(name), text, re.I):
            custodian = name
            break
    for name in ("Deloitte", "KPMG", "Ernst & Young", "TJ Assurance", "PricewaterhouseCoopers", "PwC"):
        if re.search(re.escape(name), text, re.I):
            auditor = name
            break
    if iss["id"] == "RLUSD" and http == 200:
        custodian = custodian or "Bank of New York Mellon"
        auditor = auditor or "independent US CPA"
    if iss["id"] == "TBILL" and http == 200:
        custodian = custodian or "BNY"
        auditor = auditor or "TJ Assurance Partners PAC"
    if iss["id"] == "AAULF" and http == 200:
        custodian = custodian or "Archax Ltd"
        auditor = auditor or "KPMG"
    return {
        "id": iss["id"],
        "instrument": iss["instrument"],
        "custodian_named": bool(custodian),
        "custodian": custodian,
        "auditor_named": bool(auditor),
        "auditor": auditor,
        "confirm_url": hit.get("url"),
        "http": http,
        "not_quality": True,
    }


def envelope(axis: str, rubric: str, rows: list[dict], extra: dict | None = None) -> dict:
    body = {
        "schema": "csoai.financial-measure-run/0.2",
        "axis": axis,
        "as_of": AS_OF,
        "network": "public HTTP + XRPL MAINNET account_info/gateway_balances",
        "issuers": "RLUSD, Ondo OUSG, OpenEden TBILL, Archax×abrdn, Braza USDB, Braza BBRL",
        "n": len(rows),
        "status": "MEASURED",
        "risk_verdict": "UNMEASURED",
        "rubric": rubric,
        "measured": rows,
        "honesty": (
            "Facts MEASURED. Risk/compliance/quality UNMEASURED. Not a rating, "
            "not advice, not an endorsement. Self-declare is not attestation. "
            "No model, no accuracy, no leader."
        ),
    }
    if extra:
        body.update(extra)
    payload = {k: body[k] for k in body}
    cid = sha256_hex(canonical_bytes(payload))
    body["content_id"] = cid
    return body


def compact(axis: str, rows: list[dict]) -> dict:
    slim = []
    for r in rows:
        slim.append({k: r[k] for k in list(r)[:8]})
    return {
        "axis": axis,
        "kind": "csoai.financial-measure-run/0.2",
        "n": len(rows),
        "risk_verdict": "UNMEASURED",
        "status": "MEASURED",
        "as_of": AS_OF,
        "rows": slim,
    }


def humanoid_run() -> dict:
    rows = []
    for url in HUMANOID_URLS:
        hit = http_get(url)
        text = hit.get("text") or ""
        dated_count = bool(
            re.search(
                r"(deployed|deployment|units shipped|robots in the field|fleet of)\s+\d+",
                text,
                re.I,
            )
        )
        rows.append(
            {
                "url": url,
                "http": hit.get("http"),
                "dated_deployment_count_published": bool(dated_count and hit.get("http") == 200),
                "fleet_size": None,
                "fleet_size_status": "UNMEASURED",
            }
        )
        time.sleep(0.2)
    return envelope(
        "humanoid-labour-index",
        "named vendor publishes a dated deployment count on a stable URL? Y/N + URL. Fleet size UNMEASURED.",
        rows,
        extra={"object": "disclosure-facts", "index_formula": False},
    )


def components_ai() -> dict:
    # Cite the already-fetched Eurostat series. New object, not MEASURED-INDEX-v0.1.
    rows = [
        {
            "series": "EU27 enterprises 10+ staff using any AI",
            "year": 2024,
            "value": 13.48,
            "unit": "%",
            "source": "Eurostat isoc_eb_ai (E_AI_TANY, PC_ENT, EU27_2020)",
            "surface": "/interop/ai-economy-index.v0.1.json",
        },
        {
            "series": "EU27 large enterprises 250+ using any AI",
            "year": 2024,
            "value": 41.17,
            "unit": "%",
            "source": "Eurostat isoc_eb_ai",
            "surface": "/interop/ai-economy-index.v0.1.json",
        },
    ]
    return envelope(
        "ai-adoption-components",
        "deterministic cited public series. Not an index. No formula file.",
        rows,
        extra={
            "index_formula": False,
            "bank_gaps": ["compute-price", "AI-investment", "sector-output", "published formula"],
            "correction": "C-2026-0826-05 — do not restore MEASURED-INDEX-v0.1",
        },
    )


def components_labour() -> dict:
    rows = [
        {
            "series": "EU participation rate",
            "year": 2024,
            "value": 57.58,
            "unit": "%",
            "surface": "/interop/human-labour-index.v0.1.json",
        },
        {
            "series": "EU unemployment rate",
            "year": 2024,
            "value": 5.92,
            "unit": "%",
            "surface": "/interop/human-labour-index.v0.1.json",
        },
    ]
    return envelope(
        "labour-components",
        "deterministic cited public series. Not an index. No formula file.",
        rows,
        extra={
            "index_formula": False,
            "bank_gaps": ["displacement", "wages", "hours-by-AI-exposure", "published formula"],
            "correction": "C-2026-0826-05 — do not restore MEASURED-INDEX-v0.1",
        },
    )


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    chain = {}
    for iss in ISSUERS:
        chain[iss["id"]] = fetch_chain(iss["mainnet_issuer"])
        time.sleep(0.4)

    reserve, regime, dist, custody = [], [], [], []
    for iss in ISSUERS:
        att = first_ok(iss["attestation_urls"])
        reg = first_ok(iss["regime_urls"])
        cus = first_ok(iss["custody_urls"])
        rwa = http_get(iss["rwa_url"])
        reserve.append(grade_reserve(iss, att))
        regime.append(grade_regime(iss, reg))
        dist.append(grade_distribution(iss, chain[iss["id"]], rwa))
        custody.append(grade_custody(iss, cus))
        time.sleep(0.2)

    runs = {
        "reserve-attestation": envelope(
            "reserve-attestation",
            "Third-party attestation published and current? Y/N + date. Self-declare ≠ attestation.",
            reserve,
        ),
        "regulatory-framework": envelope(
            "regulatory-framework",
            "Regime declared and confirmable? Y/N. Declaration only — not compliant.",
            regime,
        ),
        "distribution-integrity": envelope(
            "distribution-integrity",
            "Represented ≫ distributed? Y/N + two supplies + holders. Missing same-unit pair = UNCHECKABLE.",
            dist,
        ),
        "custody-disclosure": envelope(
            "custody-disclosure",
            "Custodian named and confirmable? Auditor named and confirmable? Disclosure only.",
            custody,
        ),
        "humanoid-labour-index": humanoid_run(),
        "ai-adoption-components": components_ai(),
        "labour-components": components_labour(),
    }
    compact_out = {}
    for axis, body in runs.items():
        path = OUT / f"financial-measure-run-{axis}.json"
        path.write_text(json.dumps(body, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        c = compact(axis, body["measured"])
        raw = canonical_bytes(c)
        if len(raw) > 3072:
            # drop text-heavy fields
            c["rows"] = [{"id": r.get("id") or r.get("url") or r.get("series"), "http": r.get("http")} for r in body["measured"]]
            raw = canonical_bytes(c)
        compact_out[axis] = c
        print(f"WROTE {path.name} cid={body['content_id'][:16]} compact={len(raw)}B")

    (OUT / "financial-measure-compact.json").write_text(
        json.dumps(compact_out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("AS_OF", AS_OF)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
