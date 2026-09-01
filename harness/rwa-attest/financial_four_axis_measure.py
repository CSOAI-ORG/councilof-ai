#!/usr/bin/env python3
"""Four financial-axis mill — clone of provenance-controls v0.2.

Same six XRPL issuers. Schema csoai.financial-measure-run/0.2.
Facts MEASURED. Risk verdict UNMEASURED. No model, no accuracy, no leader.
Do not stamp from a Hub skeleton. Self-declare ≠ third-party attestation.
RWA.xyz API key absent this run: represented supply stays UNMEASURED inside
the distribution card; chain supply/holders come from XRPL + /api/xrpl.
"""
from __future__ import annotations

import base64
import hashlib
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_private_key

UA = {"User-Agent": "csoai-fin-mill/0.2 (+https://councilof.ai)"}
AS_OF = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
KEY = Path("/Users/nicholas/.sovos/city_ed25519")
OUT = Path("/Users/nicholas/.grokbot/eat-2026-09-01/interop")
OUT.mkdir(parents=True, exist_ok=True)

TARGETS = [
    {
        "instrument": "RLUSD (Ripple USD)",
        "mainnet_issuer": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        "symbol": "RLUSD",
        "pages": ["https://ripple.com/products/stablecoin/"],
    },
    {
        "instrument": "Ondo OUSG (Short-Term US Treasuries)",
        "mainnet_issuer": "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
        "symbol": "OUSG",
        "pages": ["https://ondo.finance/ousg"],
    },
    {
        "instrument": "Archax x abrdn USD Liquidity Fund",
        "mainnet_issuer": "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
        "symbol": "Archax-abrdn",
        "pages": ["https://www.archax.com/"],
    },
    {
        "instrument": "OpenEden TBILL (TBL)",
        "mainnet_issuer": "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn",
        "symbol": "TBILL",
        "pages": ["https://openeden.com/tbill", "https://docs.openeden.com/"],
    },
    {
        "instrument": "Braza Bank USDB",
        "mainnet_issuer": "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc",
        "symbol": "USDB",
        "pages": ["https://www.brazabank.com.br/"],
    },
    {
        "instrument": "Braza Bank BBRL",
        "mainnet_issuer": "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt",
        "symbol": "BBRL",
        "pages": ["https://www.brazabank.com.br/"],
    },
]


def get(url: str, timeout: int = 20) -> tuple[int, str]:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, (e.read() or b"").decode("utf-8", "replace")
    except Exception as e:
        return 0, str(e)


def wilson(k: int, n: int, z: float = 1.96) -> list[float]:
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / den
    return [round(centre - half, 3), round(centre + half, 3)]


def sign_body(body: dict) -> dict:
    payload = json.dumps(
        {k: body[k] for k in body if k not in ("content_id", "signature")},
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sk = load_pem_private_key(KEY.read_bytes(), password=None)
    pub = sk.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    sig = sk.sign(cid.encode())
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    body["content_id"] = cid
    body["signature"] = {
        "alg": "Ed25519",
        "content_id": cid,
        "sig": base64.b64encode(sig).decode(),
        "pubkey": base64.b64encode(pub).decode(),
        "mill": "same city_ed25519 mill as /interop/financial-measure-run-v2.json content_id 29369542cb537f38",
        "note": "Ed25519 over sha256(canonical body sans envelope). Not #card-attestation-1 (that key stays off this laptop). Not a rating.",
    }
    return body


def xrpl() -> dict:
    st, raw = get("https://councilof.ai/api/xrpl")
    d = json.loads(raw) if st == 200 else {}
    by = {}
    for a in d.get("assets") or []:
        by[a.get("symbol")] = a
    return by


def main() -> None:
    chain = xrpl()
    pages: dict[str, tuple[int, str]] = {}
    for t in TARGETS:
        for u in t["pages"]:
            if u not in pages:
                pages[u] = get(u)

    reserve, regulatory, dist, custody = [], [], [], []

    for t in TARGETS:
        texts = []
        urls_ok = []
        for u in t["pages"]:
            st, body = pages[u]
            texts.append(body.lower())
            if st == 200:
                urls_ok.append(u)
        blob = "\n".join(texts)
        primary = t["pages"][0]

        # reserve: third-party packet retrieved?
        named_attestor = None
        for firm in ("deloitte", "pwc", "kpmg", "grant thornton", "bdo", "ernst & young"):
            if firm in blob:
                named_attestor = firm
                break
        claims_monthly = "monthly third-party attestation" in blob or "attestation reports" in blob
        current = bool(named_attestor) and bool(urls_ok)
        # self-declare of "we attest" without a named firm is NOT current
        if named_attestor is None:
            current = False
        reserve.append(
            {
                "instrument": t["instrument"],
                "mainnet_issuer": t["mainnet_issuer"],
                "control_facts": {
                    "status": "MEASURED",
                    "as_of": AS_OF,
                    "rubric": "Third-party attestation published and current? Y/N + date. Self-declare ≠ attestation.",
                    "facts": {
                        "attestation_current": current,
                        "attestor_named": bool(named_attestor),
                    },
                    "attestor": named_attestor,
                    "attestation_date": None,
                    "source_url": primary,
                    "http": pages[primary][0],
                    "claim_on_page": claims_monthly,
                    "n_facts": 2,
                    "coverage_rate": round(int(current) + int(bool(named_attestor)) / 2, 4)
                    if False
                    else round((int(current) + int(bool(named_attestor))) / 2, 4),
                    "wilson95": wilson(int(current) + int(bool(named_attestor)), 2),
                    "honest_note": "Y only if a named third-party attestor is on a retrieved page. Missing PDF date stays null. NOT a reserve quality score.",
                },
                "risk_verdict_status": "UNMEASURED",
            }
        )

        regime = None
        declared = False
        if "nydfs" in blob or "new york department of financial services" in blob:
            regime, declared = "NYDFS (+ DFSA named on same page)" if "dfsa" in blob else "NYDFS", True
        elif "ondo i lp" in blob and "delaware" in blob:
            regime, declared = "Delaware LP (Ondo I LP, USA)", True
        elif "banco central" in blob:
            regime, declared = "Banco Central do Brasil (named on issuer site)", True
        elif "mica" in blob:
            regime, declared = "MiCA (named)", True
        elif "ucits" in blob:
            regime, declared = "UCITS (named)", True
        elif "fca" in blob and pages[primary][0] == 200 and len(blob) > 2000:
            regime, declared = "FCA (string present)", True
        regulatory.append(
            {
                "instrument": t["instrument"],
                "mainnet_issuer": t["mainnet_issuer"],
                "control_facts": {
                    "status": "MEASURED",
                    "as_of": AS_OF,
                    "rubric": "Regime declared and confirmable on a retrieved URL? Y/N. Declaration only. Not compliant.",
                    "facts": {"regime_declared_and_confirmable": declared},
                    "regime": regime,
                    "confirm_url": primary,
                    "http": pages[primary][0],
                    "n_facts": 1,
                    "coverage_rate": 1.0 if declared else 0.0,
                    "wilson95": wilson(int(declared), 1),
                    "honest_note": "Measures whether a regime string is present and the page retrieved. Never whether the issuer is compliant.",
                },
                "risk_verdict_status": "UNMEASURED",
            }
        )

        row = chain.get(t["symbol"]) if t["symbol"] in chain else None
        # XRPL reader uses RLUSD/OUSG/USDB/BBRL. TBILL/Archax not in locked-16.
        holders = row.get("holders") if row else None
        supply = row.get("supply") if row else None
        kind = row.get("kind") if row else None
        represented = None  # RWA.xyz key absent
        flag = None
        if kind == "distributed" and represented is None:
            flag = False  # cannot be represented>>distributed if classified distributed and no represented figure larger
        dist.append(
            {
                "instrument": t["instrument"],
                "mainnet_issuer": t["mainnet_issuer"],
                "control_facts": {
                    "status": "MEASURED",
                    "as_of": AS_OF,
                    "rubric": "Represented ≫ distributed? Y/N + two supplies + holders. RWA.xyz v4 key absent this hour — represented_supply UNMEASURED.",
                    "facts": {
                        "classified_distributed_on_xrpl_reader": kind == "distributed" if kind else False,
                        "represented_gt_distributed": flag,
                    },
                    "chain_supply": supply,
                    "holders": holders,
                    "represented_supply": None,
                    "xrpl_kind": kind,
                    "source_url": "https://councilof.ai/api/xrpl" if row else None,
                    "unmeasured": ["represented_supply (no RWA.xyz key)"]
                    + ([] if holders is not None else ["holders"]),
                    "n_facts": 1,
                    "coverage_rate": 1.0 if kind == "distributed" else 0.0,
                    "wilson95": wilson(int(kind == "distributed") if kind else 0, 1),
                    "honest_note": "Chain read of the living XRPL reader. Represented TVL is NOT mixed in. NOT a solvency score.",
                },
                "risk_verdict_status": "UNMEASURED",
            }
        )

        custodian_named = any(
            n in blob
            for n in ("bank of new york", "bny mellon", "state street", "coinbase custody", "bitgo")
        )
        # generic "custodians" without a name is not named
        auditor_named = named_attestor is not None
        custody.append(
            {
                "instrument": t["instrument"],
                "mainnet_issuer": t["mainnet_issuer"],
                "control_facts": {
                    "status": "MEASURED",
                    "as_of": AS_OF,
                    "rubric": "Custodian named and confirmable? Auditor named and confirmable? Y/N + Y/N. Disclosure only. Not quality.",
                    "facts": {
                        "custodian_named_confirmable": custodian_named and bool(urls_ok),
                        "auditor_named_confirmable": auditor_named and bool(urls_ok),
                    },
                    "source_url": primary,
                    "http": pages[primary][0],
                    "n_facts": 2,
                    "coverage_rate": round(
                        (int(custodian_named and bool(urls_ok)) + int(auditor_named and bool(urls_ok))) / 2, 4
                    ),
                    "wilson95": wilson(
                        int(custodian_named and bool(urls_ok)) + int(auditor_named and bool(urls_ok)), 2
                    ),
                    "honest_note": "Named-string presence on a retrieved page. Generic 'custodians' without a name is N. Not a quality score.",
                },
                "risk_verdict_status": "UNMEASURED",
            }
        )

    honesty = (
        "Financial axis MEASURED for deterministic disclosure/chain facts on the same six issuers "
        "as provenance-controls v0.2. Risk verdicts remain UNMEASURED. Not ratings/advice/endorsements. "
        "Stranger re-runs this script + compares. Do not stamp from a Hub skeleton."
    )
    specs = [
        (
            "reserve-attestation",
            "issuer disclosure pages retrieved this hour (PDF packet date may be null)",
            reserve,
        ),
        (
            "regulatory-framework",
            "issuer disclosure pages retrieved this hour",
            regulatory,
        ),
        (
            "distribution-integrity",
            "GET https://councilof.ai/api/xrpl (writes_board=false) + six-issuer set",
            dist,
        ),
        (
            "custody-disclosure",
            "issuer disclosure pages retrieved this hour",
            custody,
        ),
    ]
    written = []
    for axis, network, rows in specs:
        body = {
            "schema": "csoai.financial-measure-run/0.2",
            "axis": axis,
            "network": network,
            "supersedes": None,
            "clone_of": "/interop/financial-measure-run-v2.json",
            "measured": rows,
            "honesty": honesty,
        }
        sign_body(body)
        path = OUT / f"financial-measure-run-{axis}.json"
        path.write_text(json.dumps(body, indent=1) + "\n")
        written.append((axis, body["content_id"], str(path)))
        print(axis, body["content_id"], "n", len(rows))
    Path(OUT / "FOUR_AXIS_INDEX.json").write_text(
        json.dumps({"as_of": AS_OF, "runs": written, "n_issuers": 6}, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
