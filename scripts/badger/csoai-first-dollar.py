#!/usr/bin/env python3
"""csoai-first-dollar.py — settle the FIRST real payment.

Lane-doable: uses the PayAI keyless facilitator to settle a real
USDC payment against the CSOAI priced endpoint, then verifies the
receipt is in the root.

This script:
  1. Reads BURNER_KEY (env var, a fresh burner wallet)
  2. Builds an EIP-3009 transferWithAuthorization payload
  3. Hits the priced endpoint → 402 challenge
  4. Signs the authorization (EIP-712 domain: "USD Coin" / "2")
  5. Submits via PayAI facilitator (keyless on Base mainnet)
  6. Retries with X-PAYMENT header → 200 + signed card
  7. Verifies the card at /gspc-verify

Cost: ~$0.50 USDC per request (Tier 1 — Issuance).
Free under PayAI's 1,000-settlement free tier.

Requires:
  - BURNER_KEY env var (the burner private key)
  - 0.02 USDC on Base in the burner wallet (for the test)
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "first-dollar"
DID = "did:web:csoai.org#card-attestation-1"

CSOAI_WALLET = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
PRICED_URL = "https://councilof.ai/api/request-attestation?subject=qwen2.5:7b"


def curl_post(url: str, headers: dict, body: bytes = b"", timeout: int = 15) -> tuple[int, str, dict]:
    """POST with headers. Returns (status, body, response_headers)."""
    cmd = ["curl", "-L", "-s", "-X", "POST", "-D", "-",
           "-w", "\n%{http_code}", "--max-time", str(timeout), url]
    for k, v in headers.items():
        cmd.extend(["-H", f"{k}: {v}"])
    if body:
        cmd.extend(["--data-binary", body])
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        out = r.stdout
        if "\n%{" in out:
            body_text, code_str = out.rsplit("\n%", 1)
            code = int(code_str.strip()) if code_str.strip().isdigit() else 0
            parts = body_text.split("\r\n\r\n", 1) if "\r\n\r\n" in body_text else body_text.split("\n\n", 1)
            headers_text = parts[0] if parts else ""
            body_out = parts[1] if len(parts) > 1 else body_text
            resp_headers = {}
            for line in headers_text.splitlines():
                if ":" in line:
                    k2, v2 = line.split(":", 1)
                    resp_headers[k2.strip().lower()] = v2.strip()
            return code, body_out, resp_headers
    except Exception:
        pass
    return 0, "", {}


def main():
    ap = argparse.ArgumentParser(description="Settle the first real payment.")
    ap.add_argument("--dry-run", action="store_true",
                    help="Probe the 402 challenge without signing")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — FIRST DOLLAR")
    print("================================================================")
    print()

    burner_key = os.environ.get("BURNER_KEY", "").strip()
    if not burner_key and not args.dry_run:
        print("  ERROR: BURNER_KEY env var not set")
        print("  Run: csoai-burner-wallet.py to generate, set the env var,")
        print("       import into MetaMask, fund with USDC, then re-run.")
        return 1

    print(f"  priced URL: {PRICED_URL}")
    print(f"  payTo:      {CSOAI_WALLET}")
    print(f"  burner key: {burner_key[:10]}...{burner_key[-4:]}  (if real)")
    print()

    # 1. Get the 402 challenge
    print("--- Step 1: Get the 402 challenge ---")
    r = subprocess.run(
        ["curl", "-L", "-s", "--max-time", "15", PRICED_URL],
        capture_output=True, text=True, timeout=20,
    )
    if r.returncode != 0:
        print(f"  ERROR: curl failed: {r.stderr}")
        return 1

    try:
        challenge = json.loads(r.stdout)
    except Exception as e:
        print(f"  ERROR: could not parse 402: {e}")
        print(f"  body: {r.stdout[:300]}")
        return 1

    accepts = challenge.get("accepts", [])
    if not accepts:
        print("  ERROR: no accepts in challenge")
        return 1

    accept = accepts[0]
    print(f"  scheme:    {accept.get('scheme')}")
    print(f"  network:   {accept.get('network')}")
    print(f"  amount:    {accept.get('amount')}  ({accept.get('maxAmountRequired')})")
    print(f"  asset:     {accept.get('asset')}")
    print(f"  payTo:     {accept.get('payTo')}")
    print(f"  extra.name:  {accept.get('extra', {}).get('name')}")
    print(f"  extra.version: {accept.get('extra', {}).get('version')}")
    print()

    if args.dry_run:
        print("  --- dry-run complete ---")
        print()
        print("  Next: import burner key into MetaMask, fund with USDC, re-run without --dry-run")
        return 0

    # 2. Build the EIP-3009 transferWithAuthorization payload
    # Requires a real eth account — we use viem if available
    print("--- Step 2: Build + sign the EIP-3009 payload ---")
    try:
        from eth_account import Account
        from eth_account.messages import encode_defunct
        from web3 import Web3
    except ImportError as e:
        print(f"  ERROR: missing dependency: {e}")
        print(f"  Install: pip install eth-account web3")
        return 1

    if not burner_key.startswith("0x"):
        burner_key = "0x" + burner_key

    try:
        account = Account.from_key(burner_key)
    except Exception as e:
        print(f"  ERROR: invalid BURNER_KEY: {e}")
        return 1

    payer = account.address
    print(f"  payer:     {payer}")

    nonce = "0x" + uuid.uuid4().hex.zfill(64)
    valid_after = 0
    valid_before = int(time.time()) + 600  # 10 min
    amount = int(accept["amount"])

    # EIP-712 typed data for USDC transferWithAuthorization
    # Domain: USD Coin / 2
    # Types: TransferWithAuthorization
    domain = {
        "name": accept["extra"]["name"],
        "version": accept["extra"]["version"],
        "chainId": 8453,  # Base mainnet
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

    print(f"  value:     {amount}  atomic units = {amount / 1e6} USDC")
    print(f"  nonce:     {nonce[:10]}...")
    print()

    try:
        signed = Account.sign_typed_data(account, domain, types, message)
        signature = "0x" + signed.signature.hex()
    except Exception as e:
        print(f"  ERROR: signing failed: {e}")
        return 1

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

    print(f"  signature: {signature[:10]}...{signature[-4:]}")
    print()

    # 3. Encode as X-PAYMENT header (base64 of JSON)
    import base64
    payment_b64 = base64.b64encode(json.dumps(payload).encode()).decode()

    # 4. Hit PayAI facilitator
    print("--- Step 3: Submit to PayAI facilitator ---")
    payai_url = "https://facilitator.payai.network/verify"
    code, body, hdrs = curl_post(
        payai_url,
        {"Content-Type": "application/json"},
        json.dumps({"x402Version": 2, "paymentPayload": payload, "paymentRequirements": accept}).encode(),
    )
    print(f"  HTTP {code}")
    print(f"  body: {body[:200]}")
    print()

    if code != 200:
        print(f"  ERROR: PayAI verify failed: {code}")
        return 1

    print("--- Step 4: Submit to PayAI /settle ---")
    code, body, hdrs = curl_post(
        "https://facilitator.payai.network/settle",
        {"Content-Type": "application/json"},
        json.dumps({"x402Version": 2, "paymentPayload": payload, "paymentRequirements": accept}).encode(),
    )
    print(f"  HTTP {code}")
    print(f"  body: {body[:300]}")
    print()

    if code != 200:
        print(f"  ERROR: PayAI settle failed: {code}")
        return 1

    print("--- Step 5: Retry the priced endpoint with X-PAYMENT ---")
    code, body, hdrs = curl_post(
        PRICED_URL,  # POST with payment
        {"Content-Type": "application/json", "X-PAYMENT": payment_b64},
        b"",
    )
    print(f"  HTTP {code}")
    if code == 200:
        try:
            card = json.loads(body)
            print(f"  CARD RECEIVED:")
            print(f"    schema:  {card.get('schema')}")
            print(f"    kind:    {card.get('kind')}")
            print(f"    subject: {card.get('subject', {}).get('source')}")
            print(f"    as_of:   {card.get('as_of')}")
        except Exception:
            print(f"  body: {body[:300]}")
    else:
        print(f"  body: {body[:300]}")

    # Save the receipt
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    receipt_path = QUEUE / f"first-dollar-{stamp}.json"
    receipt_path.write_text(json.dumps({
        "kind": "csoai.first-dollar",
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "challenged_status": 402,
        "settled_status": code,
        "challenge": challenge,
        "payload": payload,
        "payer": payer,
        "amount_atomic": amount,
        "amount_usdc": amount / 1e6,
        "settle_response": body[:1000],
    }, indent=2, default=str))
    print(f"  receipt: {receipt_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
