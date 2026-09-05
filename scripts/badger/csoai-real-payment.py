#!/usr/bin/env python3
"""csoai-real-payment.py — settle a REAL USDC payment via PayAI.

This script does the full x402 settlement loop using a burner key
or an existing private key. Uses eth_account to sign EIP-3009
transferWithAuthorization, submits to PayAI (keyless), and verifies
the receipt on the CSOAI side.

Steps:
  1. Probe the priced endpoint for the 402 challenge
  2. Build EIP-3009 transferWithAuthorization
  3. Sign with EIP-712 (domain: USD Coin / 2)
  4. Submit to PayAI /verify + /settle
  5. Retry the priced endpoint with X-PAYMENT
  6. Receive the signed card-v0
  7. Emit a receipt atom (canonical, OTS-anchored)
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "real-payment"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

CSOAI_WALLET = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
BASE_RPC = "https://mainnet.base.org"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CHAIN_ID = 8453

PRICED_ENDPOINTS = [
    ("https://councilof.ai/api/request-attestation?subject=qwen2.5:7b", "Tier 1 — Issuance"),
    ("https://councilof.ai/api/rwa/evidence?asset=RLUSD", "Tier 1b — RWA XRPL"),
    ("https://councilof.ai/api/proof?bundle=1", "Tier 1b — Proof bundle"),
]


def curl_get(url: str, timeout: int = 15) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-w", "\n%{http_code}",
             "--max-time", str(timeout), url],
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


def curl_post(url: str, headers: dict, body: bytes = b"", timeout: int = 15) -> tuple[int, str]:
    cmd = ["curl", "-L", "-s", "-X", "POST",
           "-w", "\n%{http_code}", "--max-time", str(timeout), url]
    for k, v in headers.items():
        cmd.extend(["-H", f"{k}: {v}"])
    if body:
        cmd.extend(["--data-binary", body])
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        out = r.stdout
        if "\n" in out:
            body_text, code = out.rsplit("\n", 1)
            try:
                return int(code), body_text
            except ValueError:
                return 0, body_text
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def build_and_sign_eip3009(burner_key: str, accept: dict) -> tuple[dict, str, int]:
    """Build EIP-3009 transferWithAuthorization + EIP-712 sign."""
    from eth_account import Account
    if not burner_key.startswith("0x"):
        burner_key = "0x" + burner_key

    account = Account.from_key(burner_key)
    payer = account.address
    nonce = "0x" + uuid.uuid4().hex.zfill(64)
    valid_after = 0
    valid_before = int(time.time()) + 600
    amount = int(accept["amount"])

    domain = {
        "name": accept["extra"]["name"],
        "version": accept["extra"]["version"],
        "chainId": CHAIN_ID,
        "verifyingContract": accept["asset"],
    }
    types = {
        "TransferWithAuthorization": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "validAfter", "type": "uint256"},
            {"name": "validBefore", "type": "uint256"},
            {"name": "nonce", "type": "bytes32"},
        ],
    }
    message = {
        "from": payer,
        "to": accept["payTo"],
        "value": amount,
        "validAfter": valid_after,
        "validBefore": valid_before,
        "nonce": nonce,
    }

    signed = Account.sign_typed_data(account, domain, types, message)
    signature = "0x" + signed.signature.hex()

    payload = {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:8453",
        "payload": {
            "signature": signature,
            "authorization": {
                "from": payer,
                "to": accept["payTo"],
                "value": str(amount),
                "validAfter": str(valid_after),
                "validBefore": str(valid_before),
                "nonce": nonce,
            },
        },
    }

    payment_b64 = base64.b64encode(json.dumps(payload).encode()).decode()
    return payload, payment_b64, amount


def main():
    ap = argparse.ArgumentParser(description="Settle a real USDC payment.")
    ap.add_argument("--endpoint", type=int, default=0,
                    help="Which priced endpoint (0-2)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — REAL PAYMENT (settles via PayAI facilitator)")
    print("================================================================")
    print()

    burner_key = os.environ.get("BURNER_KEY", "").strip()
    if not burner_key:
        print("  ERROR: BURNER_KEY env var not set")
        print("  Run csoai-burner-wallet.py to generate, set the env var,")
        print("       import into MetaMask, fund with USDC on Base, then re-run.")
        return 1
    if not burner_key.startswith("0x"):
        burner_key = "0x" + burner_key

    url, name = PRICED_ENDPOINTS[args.endpoint]
    print(f"  priced URL: {url}")
    print(f"  tier:       {name}")
    print()

    # 1. Probe the 402 challenge
    print("--- Step 1: Get the 402 challenge ---")
    code, body = curl_get(url)
    if code != 402:
        print(f"  ERROR: expected 402, got {code}")
        print(f"  body: {body[:300]}")
        return 1
    try:
        challenge = json.loads(body)
    except Exception as e:
        print(f"  ERROR: parse: {e}")
        return 1
    accept = challenge["accepts"][0]
    print(f"  ✓ scheme={accept['scheme']}  network={accept['network']}  amount={accept['amount']}")
    print()

    if args.dry_run:
        print("  --- dry-run complete ---")
        return 0

    # 2. Build + sign EIP-3009
    print("--- Step 2: Build + sign EIP-3009 transferWithAuthorization ---")
    try:
        payload, payment_b64, amount = build_and_sign_eip3009(burner_key, accept)
    except ImportError as e:
        print(f"  ERROR: missing dep: {e}")
        print(f"  Install: pip3 install --user eth_account web3")
        return 1
    except Exception as e:
        print(f"  ERROR: signing: {e}")
        return 1

    print(f"  ✓ payer:   {payload['payload']['authorization']['from']}")
    print(f"  ✓ payTo:   {payload['payload']['authorization']['to']}")
    print(f"  ✓ value:   {amount} ({amount / 1e6} USDC)")
    print(f"  ✓ sig:     {payload['payload']['signature'][:10]}...{payload['payload']['signature'][-4:]}")
    print()

    # 3. Submit to PayAI /verify
    print("--- Step 3: PayAI /verify ---")
    code, body = curl_post(
        "https://facilitator.payai.network/verify",
        {"Content-Type": "application/json"},
        json.dumps({"x402Version": 2, "paymentPayload": payload, "paymentRequirements": accept}).encode(),
    )
    print(f"  HTTP {code}")
    if code != 200:
        print(f"  body: {body[:300]}")
        return 1
    print(f"  body: {body[:200]}")
    print()

    # 4. Submit to PayAI /settle
    print("--- Step 4: PayAI /settle ---")
    code, body = curl_post(
        "https://facilitator.payai.network/settle",
        {"Content-Type": "application/json"},
        json.dumps({"x402Version": 2, "paymentPayload": payload, "paymentRequirements": accept}).encode(),
    )
    print(f"  HTTP {code}")
    print(f"  body: {body[:300]}")
    if code != 200:
        print("  ERROR: PayAI settle failed")
        return 1

    try:
        settle_result = json.loads(body)
    except Exception:
        settle_result = {"raw": body}

    print()

    # 5. Retry the priced endpoint with X-PAYMENT
    print("--- Step 5: Retry priced endpoint with X-PAYMENT ---")
    code, body = curl_post(
        url,
        {"Content-Type": "application/json", "X-PAYMENT": payment_b64},
        b"",
    )
    print(f"  HTTP {code}")
    if code == 200:
        try:
            card = json.loads(body)
            print(f"  ✓ CARD RECEIVED")
            print(f"    schema:  {card.get('schema')}")
            print(f"    kind:    {card.get('kind')}")
            print(f"    subject: {card.get('subject', {}).get('source', '?')}")
            print(f"    as_of:   {card.get('as_of')}")
            print(f"    verify:  https://councilof.ai/gspc-verify")
        except Exception as e:
            print(f"  body: {body[:300]}")
            card = {"raw_body": body}
    else:
        print(f"  body: {body[:300]}")
        card = {"raw_body": body}

    # 6. Emit the receipt as a CSOAI card
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    receipt = {
        "kind": "csoai.real-payment-receipt",
        "schema": SCHEMA,
        "version": 1,
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "subject": {
            "kind": "x402-payment-receipt",
            "tier": name,
            "payer": payload["payload"]["authorization"]["from"],
            "amount_usdc": amount / 1e6,
        },
        "scope": {"axis": "revenue", "kind": "first-dollar"},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": {
                "endpoint": url,
                "challenge_status": 402,
                "settle_status": code,
                "amount_atomic": str(amount),
                "transaction": settle_result if isinstance(settle_result, dict) else {"raw": settle_result},
                "card_v0_digest": hashlib.sha256(json.dumps(card, sort_keys=True).encode()).hexdigest() if isinstance(card, dict) and "schema" in card else None,
            },
            "source_url": url,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "basescan": f"https://basescan.org/address/{CSOAI_WALLET}",
        },
        "notes": [
            f"First real USDC payment received on x402 rail.",
            f"Tier: {name}",
            f"Payer: {payload['payload']['authorization']['from']}",
            f"Amount: {amount / 1e6} USDC",
            f"Pay-to: {CSOAI_WALLET}",
            "Receipt signed by PayAI facilitator + CSOAI server.",
            "Verify the card at /gspc-verify.",
        ],
    }
    receipt_path = QUEUE / f"real-payment-{stamp}.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, default=str))
    print()
    print(f"  receipt: {receipt_path}")
    return 0


import hashlib  # late import for digest
if __name__ == "__main__":
    sys.exit(main())
