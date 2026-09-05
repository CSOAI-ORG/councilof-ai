#!/usr/bin/env python3
"""csoai-xrpl-settlement-v2.py — REAL XRPL settlement using XRPScan + xrplcluster.com.

Pipeline:
  1. Fetch the token list from XRPScan public API (no keys)
  2. For each token with the right issuer name, get the real XRPL issuer address
  3. Probe the issuer account via xrplcluster.com JSON-RPC (no keys)
  4. Build a tier-3 evidence card with: issuer address, holder count, trust lines
  5. Sign + stage x402 receipts

Lane-doable: reads only (XRPScan + xrplcluster.com). No keys, no writes outside the queue.
"""

from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

QUEUE = Path("scripts/badger/_queue/xrpl-settlement")
QUEUE.mkdir(parents=True, exist_ok=True)

# Incident quarantine (2026-09-04): this writer promoted a successful public
# ledger read to MEASURED and emitted digest-shaped placeholders when no signing
# key was present. The legitimate read-only XRPL APIs are separate and remain
# available; this batch writer is retired pending canonical evidence admission.
QUARANTINED_GENERATOR = True
QUARANTINE_REASON = (
    "retired: public ledger observations are PROBED facts, not GSPC measurements"
)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def fetch_json(url: str, timeout: int = 30) -> object:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-XRPL/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


def xrpl_rpc(method: str, params: list) -> dict:
    payload = {"method": method, "params": params}
    try:
        req = urllib.request.Request(
            "https://xrplcluster.com/",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "User-Agent": "CSOAI-XRPL/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


# The 10 issuer names we want to find. XRPScan may have them under various currency codes.
ISSUER_NAMES = [
    "Bitstamp", "Circle", "Ripple", "GateHub", "Braza",
    "Ondo", "Quantoz", "Palau", "Schuman", "Société Générale",
]


def fetch_xrpscan_tokens() -> list[dict]:
    """Fetch top tokens from XRPScan."""
    return fetch_json("https://api.xrpscan.com/api/v1/tokens?limit=200") or []


def find_issuers_by_name(tokens: list[dict]) -> list[dict]:
    """Filter tokens by issuer name keywords."""
    found = []
    keywords = {
        "Bitstamp": ["bitstamp", "usd.bs", "btc.b"],
        "Circle": ["usdc", "circle"],
        "Ripple": ["rlusd", "ripple"],
        "GateHub": ["usd.gh", "gatehub"],
        "Braza": ["usdb", "braza"],
        "Ondo": ["ousg", "ondo"],
        "Quantoz": ["eurq", "quantoz"],
        "Palau": ["psc", "palau"],
        "Schuman": ["eurØp", "eur\u00d8p", "schuman"],
        "Société Générale": ["eurcv", "forge", "societe"],
    }
    for token in tokens:
        if not isinstance(token, dict):
            continue
        code = (token.get("code") or "").lower()
        issuer = (token.get("issuer") or "").lower()
        token_str = (token.get("token") or "").lower()
        for issuer_name, kws in keywords.items():
            for kw in kws:
                if kw in code or kw in issuer or kw in token_str:
                    found.append({
                        "issuer_name": issuer_name,
                        "issuer_address": token.get("issuer"),
                        "currency_code": token.get("code"),
                        "currency_hex": token.get("currency"),
                        "holders": token.get("holders"),
                        "amms": token.get("amms"),
                        "token_id": token.get("id"),
                        "created_at": token.get("createdAt"),
                    })
                    break
    return found


def build_evidence_card(issuer: dict, account_info: dict, account_lines: dict) -> dict:
    """Build a tier-3 evidence card for an XRPL asset."""
    return {
        "schema": "csoai.gspc-axes/0.5",
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": "did:web:csoai.org#card-attestation-1",
        "as_of": now(),
        "subject": {
            "kind": "xrpl-asset-evidence",
            "chain": "xrpl",
            "issuer_name": issuer["issuer_name"],
            "issuer_address": issuer["issuer_address"],
            "currency_code": issuer["currency_code"],
            "currency_hex": issuer["currency_hex"],
            "holders": issuer["holders"],
        },
        "scope": {
            "chain": "xrpl",
            "kind": "asset-evidence",
            "tier": 3,
        },
        "measurement": {
            "status": "PROBED" if account_info.get("result", {}).get("account_data") else "UNREACHABLE",
            "verified_via": "XRPScan public API + xrplcluster.com JSON-RPC",
            "x402_sku": "xrpl-asset-evidence",
            "x402_price_usdc": 0.05,
        },
        "evidence": {
            "account_info": account_info,
            "account_lines_count": len(account_lines.get("result", {}).get("lines", [])) if account_lines.get("result") else 0,
            "xrpscan_holders": issuer["holders"],
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "x402_catalog": "https://councilof.ai/api/x402",
        },
        "notes": [
            f"Auto-built by csoai-xrpl-settlement-v2.py at {now()}",
            f"Issuer: {issuer['issuer_name']} ({issuer['issuer_address']})",
            f"Currency: {issuer['currency_code']} ({issuer['currency_hex'][:8]}...)",
            f"Holders: {issuer['holders']:,}" if isinstance(issuer['holders'], int) else f"Holders: {issuer['holders']}",
            "Tier-3 evidence card — per-asset on-chain state",
            "Measurement, not certification. Verify free at https://councilof.ai/gspc-verify",
        ],
    }


def sign_card(card: dict) -> dict:
    blob = json.dumps(card, sort_keys=True, default=str).encode()
    card["sha256"] = hashlib.sha256(blob).hexdigest()
    key_path = Path.home() / ".ssh" / "csoai_signing_key"
    if key_path.exists():
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
            from cryptography.hazmat.primitives import serialization
            priv = serialization.load_pem_private_key(key_path.read_bytes(), password=None)
            sig = priv.sign(blob)
            card["sig_ed25519"] = sig.hex()
            card["signed"] = True
        except Exception:
            card["sig_ed25519"] = None
            card["signed"] = False
            card["signature_state"] = "UNSIGNED"
    else:
        card["sig_ed25519"] = None
        card["signed"] = False
        card["signature_state"] = "UNSIGNED"
    return card


def build_x402_receipt(card: dict) -> dict:
    return {
        "schema": "csoai.x402-receipt/0.1",
        "sku": "xrpl-asset-evidence",
        "price_usdc": 0.05,
        "as_of": now(),
        "subject_sha256": card["sha256"],
        "issuer_address": card["subject"]["issuer_address"],
        "currency_code": card["subject"]["currency_code"],
        "receipt_status": "STAGED",
        "receipt_note": "Real x402 receipt — settles when buyer pays to 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 on Base mainnet via PayAI",
        "x402_endpoint": "https://councilof.ai/api/x402",
        "links": {
            "verify_card": "https://councilof.ai/gspc-verify?sha=" + card["sha256"],
        },
    }


def main() -> int:
    if QUARANTINED_GENERATOR:
        print(f"QUARANTINED: {QUARANTINE_REASON}")
        return 78
    print("=== XRPL REAL SETTLEMENT v2 ===")
    print()

    # Step 1: fetch tokens from XRPScan
    print("  [1] fetching XRPScan tokens...")
    tokens = fetch_xrpscan_tokens()
    if not isinstance(tokens, list):
        print(f"      error: {tokens}")
        return 1
    print(f"      fetched {len(tokens)} tokens")

    # Step 2: find our issuers
    print("  [2] finding issuers by name...")
    issuers = find_issuers_by_name(tokens)
    print(f"      found {len(issuers)} issuers")

    if not issuers:
        print("  no issuers found — saving raw tokens for manual review")
        out = QUEUE / f"xrpl-tokens-raw-{now()}.json"
        out.write_text(json.dumps({"as_of": now(), "tokens": tokens[:50]}, indent=2))
        return 1

    # Step 3: probe each issuer on XRPL
    print(f"  [3] probing {len(issuers)} issuers on xrplcluster.com...")
    cards = []
    receipts = []
    for issuer in issuers:
        print(f"      {issuer['issuer_name']:<20} {issuer['currency_code']:<10} {issuer['issuer_address']:<35}", end="", flush=True)
        info = xrpl_rpc("account_info", [{"account": issuer["issuer_address"], "ledger_index": "validated"}])
        lines = xrpl_rpc("account_lines", [{"account": issuer["issuer_address"], "limit": 5}])
        if "result" in info and "account_data" in info["result"]:
            bal = int(info["result"]["account_data"].get("Balance", 0)) / 1_000_000
            print(f" -> LIVE ({bal:.2f} XRP)")
        else:
            print(f" -> unreachable")

        card = build_evidence_card(issuer, info, lines)
        card = sign_card(card)
        cards.append(card)
        receipts.append(build_x402_receipt(card))

    # Save
    cards_path = QUEUE / f"xrpl-cards-{now()}.jsonl"
    with cards_path.open("w") as f:
        for c in cards:
            f.write(json.dumps(c) + "\n")

    receipts_path = QUEUE / f"xrpl-receipts-{now()}.jsonl"
    with receipts_path.open("w") as f:
        for r in receipts:
            f.write(json.dumps(r) + "\n")

    # Summary
    signed = sum(1 for c in cards if c.get("signed"))
    probed = sum(1 for c in cards if c["measurement"]["status"] == "PROBED")
    print()
    print(f"=== SUMMARY ===")
    print(f"  issuers found:     {len(issuers)}")
    print(f"  cards built:       {len(cards)}")
    print(f"  signed:            {signed}")
    print(f"  probed:            {probed}")
    print(f"  cards file:        {cards_path}")
    print(f"  receipts file:     {receipts_path}")
    print(f"  x402 SKU:          xrpl-asset-evidence (5 cents USDC per card)")
    print(f"  potential revenue: ${len(cards) * 0.05:.2f} USDC per settlement cycle")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
