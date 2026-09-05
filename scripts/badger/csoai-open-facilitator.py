#!/usr/bin/env python3
"""csoai-open-facilitator.py — pay a CSOAI x402 resource from the command line.

WHAT THIS WAS, AND WHY IT CHANGED (2026-09-04). /pay's "Try it now" told a buyer that step 4
of paying us was:

    python3 scripts/badger/csoai-open-facilitator.py --settle payment.json

The file that ran was a sketch, not a client. It made NO network call of any kind — not to a
facilitator, not to the RPC in its own banner. `settle_payment()` returned
{"settlement_status": "ready-to-submit"} and stopped; the calldata encoder carried the comment
"the real encoding would use ethers.js; this is the structure". It rejected any payment whose
value was not 500000 atomic (0.50 USDC) while the live rail charges 20000 (0.02) — so a buyer
who signed CORRECTLY for the advertised amount was told "wrong value". The receipt it minted
pointed at https://councilof.ai/api/x402/verify?digest=… , which 404s. Its banner printed five
prices that matched no SKU in functions/api/_skus.ts. And it was named "the open MetaMask x402
facilitator" while being none of those things: a facilitator is the party that submits the
transaction on-chain, and this submitted nothing.

So the documented way for a human to pay us instructed them to run a stub that could not have
taken their money. It is now a real client, and it is deliberately small:

  · The AMOUNT IS NEVER HARDCODED. It is read from the resource's live 402 challenge
    (accepts[0]), which is the only authoritative price — the previous hardcoded 0.50 is exactly
    how the old copy drifted 25x from what the rail charges.
  · It speaks the facilitator's dialect, PROVEN ONE FIRST, mirroring functions/api/_x402.ts.
    PayAI advertises both v1 and v2 for Base; its v2 rejects the request with HTTP 400
    invalid_payload, and only v1 reaches the real balance check. A 4xx on /verify is a rejected
    SHAPE, so the other dialect is tried; /verify moves no money, so that retry is free.
  · /verify is the default and moves NO money. /settle is what transfers USDC and is reachable
    only behind an explicit --settle.

VERIFIED, AND THE LIMIT OF WHAT WAS VERIFIED: --verify was run end-to-end against
facilitator.payai.network with a freshly generated, unfunded key and returned
`invalid_exact_evm_insufficient_balance` with the payer address correctly recovered — which
proves the signature, the EIP-712 domain, the envelope and the dialect are all right, and that
only funds are missing. --settle has NOT been executed: that needs a funded wallet and is the
owner's decision. It is implemented against the same request body /verify accepted, but do not
read "written carefully" as "observed working".

Signing needs a private key, which never lives in this repo. Either export X402_PAYER_KEY (a
throwaway funded with a few cents is the right way to test), or pass --payment with a payload
you signed elsewhere, e.g. in MetaMask.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request

# Base mainnet USDC. The EIP-712 domain a client signs under is the TOKEN's — name "USD Coin",
# version "2" — not the ticker. Advertising "USDC" there is what made earlier signatures
# unverifiable, so it is stated once, here, and read from the challenge when present.
BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
DEFAULT_FACILITATOR = "https://facilitator.payai.network"
# A real client UA. Cloudflare 403s Python-urllib specifically (Error 1010) on councilof.ai, so
# the default urllib UA would make a WAF ban look like a broken rail.
UA = "csoai-open-facilitator/1.0"


def _get(url: str, headers: dict | None = None) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return e.code, {"raw": raw.decode("utf-8", "replace")[:400]}


def challenge(resource: str) -> dict:
    """Read the resource's live 402 and return accepts[0]. The amount lives ONLY here."""
    code, raw = _get(resource)
    if code != 402:
        raise SystemExit(
            f"expected HTTP 402 from {resource}, got {code}. "
            "A 200 means the resource is free or already paid; anything else is not a challenge."
        )
    doc = json.loads(raw)
    accepts = doc.get("accepts") or []
    if not accepts:
        raise SystemExit("the 402 carried no accepts[] — nothing to pay against")
    return accepts[0]


def dialects(facilitator: str, network: str) -> list[int]:
    """Which x402 versions this facilitator serves for our chain, PROVEN ONE FIRST.

    Order is evidence, not a preference for the higher number: PayAI advertises v1 and v2 for
    Base, and only v1 reaches the balance check. v2 is still attempted after it so a v2-only
    facilitator keeps working. Same rule as functions/api/_x402_negotiate.ts.
    """
    code, raw = _get(f"{facilitator}/supported")
    if code != 200:
        return [1, 2]
    kinds = (json.loads(raw) or {}).get("kinds") or []
    slug, caip = "base", "eip155:8453"
    if network not in (slug, caip):
        slug = caip = network
    usable = [k for k in kinds if (k.get("scheme") or "exact") == "exact" and k.get("network") in (slug, caip)]
    out = []
    if any((k.get("x402Version") or 1) == 1 for k in usable):
        out.append(1)
    if any(k.get("x402Version") == 2 for k in usable):
        out.append(2)
    return out or [1, 2]


def sign(accept: dict, key_hex: str) -> dict:
    """Sign an EIP-3009 transferWithAuthorization for exactly the advertised amount."""
    try:
        from eth_account import Account
        from eth_account.messages import encode_typed_data
    except ImportError:
        raise SystemExit("signing needs `pip install eth-account`, or pass --payment with a payload signed elsewhere")

    acct = Account.from_key(key_hex)
    now = int(time.time())
    amount = accept.get("amount") or accept["maxAmountRequired"]
    auth = {
        "from": acct.address,
        "to": accept["payTo"],
        "value": int(amount),
        "validAfter": 0,
        "validBefore": now + int(accept.get("maxTimeoutSeconds") or 300),
        "nonce": "0x" + secrets.token_hex(32),
    }
    extra = accept.get("extra") or {}
    typed = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"},
            ],
        },
        "primaryType": "TransferWithAuthorization",
        "domain": {
            # The token's domain, from the challenge — never the ticker.
            "name": extra.get("name", "USD Coin"),
            "version": extra.get("version", "2"),
            "chainId": 8453,
            "verifyingContract": accept.get("asset", BASE_USDC),
        },
        "message": auth,
    }
    sig = Account.sign_message(encode_typed_data(full_message=typed), acct.key).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig
    return {"signature": sig, "authorization": {k: (str(v) if isinstance(v, int) else v) for k, v in auth.items()}}


def bodies(accept: dict, payload: dict, resource: str, version: int) -> dict:
    """The facilitator request in one dialect. v1 names Base by slug, v2 by CAIP-2."""
    amount = accept.get("amount") or accept["maxAmountRequired"]
    if version == 1:
        reqs = {
            "scheme": "exact",
            "network": "base",
            "maxAmountRequired": amount,
            "resource": resource.split("?")[0],
            "description": "",
            "mimeType": "application/json",
            "payTo": accept["payTo"],
            "maxTimeoutSeconds": accept.get("maxTimeoutSeconds") or 300,
            "asset": accept.get("asset", BASE_USDC),
            "extra": {k: v for k, v in (accept.get("extra") or {}).items() if k in ("name", "version")},
        }
        net = "base"
    else:
        reqs = {
            "scheme": "exact",
            "network": "eip155:8453",
            "amount": amount,
            "asset": accept.get("asset", BASE_USDC),
            "payTo": accept["payTo"],
            "maxTimeoutSeconds": accept.get("maxTimeoutSeconds") or 300,
            "extra": {k: v for k, v in (accept.get("extra") or {}).items() if k in ("name", "version")},
        }
        net = "eip155:8453"
    return {
        "x402Version": version,
        "paymentPayload": {"x402Version": version, "scheme": "exact", "network": net, "payload": payload},
        "paymentRequirements": reqs,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Pay a CSOAI x402 resource. Verifies by default; settling is opt-in.")
    ap.add_argument("--resource", default="https://councilof.ai/api/request-attestation?subject=gpt-4o",
                    help="the priced URL to pay for (its 402 carries the amount)")
    ap.add_argument("--facilitator", default=DEFAULT_FACILITATOR)
    ap.add_argument("--payment", help="JSON file with an already-signed {signature, authorization}")
    ap.add_argument("--settle", action="store_true",
                    help="ALSO call /settle, which MOVES USDC. Without this nothing is charged.")
    args = ap.parse_args()

    accept = challenge(args.resource)
    amount = accept.get("amount") or accept["maxAmountRequired"]
    print(f"  resource : {args.resource}")
    print(f"  amount   : {amount} atomic  (= {int(amount) / 10**6:.6f} USDC, read from the live 402)")
    print(f"  payTo    : {accept['payTo']}")

    if args.payment:
        payload = json.load(open(args.payment))
    else:
        key = os.environ.get("X402_PAYER_KEY", "").strip()
        if not key:
            raise SystemExit("set X402_PAYER_KEY (a throwaway funded with a few cents) or pass --payment")
        payload = sign(accept, key)
    print(f"  payer    : {payload['authorization']['from']}")

    order = dialects(args.facilitator, accept.get("network", "eip155:8453"))
    print(f"  dialects : {order}  (proven one first)")

    accepted = None
    for v in order:
        body = bodies(accept, payload, args.resource, v)
        code, out = _post(f"{args.facilitator}/verify", body)
        if code == 200:
            accepted = (v, body, out)
            break
        # A 4xx here is the facilitator rejecting our SHAPE, not the buyer's money. Try the next.
        print(f"  verify v{v}: HTTP {code} {out.get('invalidReason') or out.get('raw', '')} — trying the next dialect")
    if not accepted:
        print("  verify   : no dialect accepted. Nothing was charged.")
        return 1

    v, body, out = accepted
    if not out.get("isValid"):
        # This is an ANSWER about the payment, not a rejected shape — never retried.
        print(f"  verify v{v}: isValid=false — {out.get('invalidReason')}  (payer {out.get('payer')})")
        print("  Nothing was charged. insufficient_balance means everything but the money is right.")
        return 1
    print(f"  verify v{v}: isValid=true")

    if not args.settle:
        print("  settle   : skipped — /verify moves no money. Re-run with --settle to pay.")
        return 0

    code, s = _post(f"{args.facilitator}/settle", body)
    if code != 200 or not s.get("success"):
        print(f"  settle   : FAILED HTTP {code} — {s.get('errorReason') or s.get('error') or s}")
        return 1
    print(f"  settle   : success  tx={s.get('transaction')}  payer={s.get('payer')}")
    print("  Re-request the resource with this X-PAYMENT header to collect the artefact:")
    print("    " + base64.b64encode(json.dumps(body["paymentPayload"]).encode()).decode())
    return 0


if __name__ == "__main__":
    sys.exit(main())
