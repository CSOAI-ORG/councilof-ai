#!/usr/bin/env python3
"""cdp_index_settle.py — STAGED (2026-10-07, TUI-4): put councilof.ai into the Coinbase
CDP Bazaar by producing the one thing their indexer requires — a successful settle through
the CDP facilitator with `paymentPayload.resource` set — without touching the live rail.

Why this exists instead of flipping X402_FACILITATOR_URL: the edge is already CDP-code-complete
(functions/api/_cdp_jwt.ts mints the per-request Ed25519 JWT), but flipping the env switches
EVERY live settlement to CDP for an indexing goal. This script settles directly: the edge
keeps serving PayAI; CDP only sees one self-settled $0.01 transfer that names our own resource.

STATUS: STAGED, E2E-UNTESTED (no credentials present on the operator machine — by design).
The JWT contract below is copied from functions/api/_cdp_jwt.ts; the EIP-3009 payload mirrors
what clients send our edge. Dry-run works with no credentials and moves nothing.

Required env (values never printed, never logged):
  CDP_API_KEY_ID          UUID from portal.cdp.coinbase.com -> API keys
  CDP_API_KEY_SECRET      base64 Ed25519 secret (64 bytes: 32-byte seed || 32-byte pubkey)
  CDP_INDEX_SIGNER_KEY    hex private key of the funded payer wallet (>= $0.05 USDC + Base gas)

Usage:
  python3 scripts/x402/cdp_index_settle.py --dry-run
  python3 scripts/x402/cdp_index_settle.py                # verify -> settle -> index readback

Classification of the resulting transfer: INTERNAL_SELF_FUNDED — an index trigger, never
revenue, never a customer, never a purchase. ~$0.01 USDC to our own payTo + ~$0.001 gas.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.request
import uuid

CDP = "https://api.cdp.coinbase.com/platform/v2/x402"
RESOURCE = "https://councilof.ai/api/proof?bundle=1"
PAYTO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
NETWORK = "eip155:8453"
MERCHANT_Q = (
    "https://api.cdp.coinbase.com/platform/v2/x402/discovery/merchant"
    f"?payTo={PAYTO}&limit=100"
)
UA = "csoai-cdp-index-settle/0.1 (staged; INTERNAL_SELF_FUNDED test)"


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def http(url, method="GET", body=None, headers=None, timeout=60):
    h = {"User-Agent": UA}
    if body is not None:
        h["Content-Type"] = "application/json"
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)
    except Exception as e:
        return None, str(e).encode(), {}


def mint_cdp_jwt(key_id: str, key_secret_b64: str, method: str, path: str) -> str:
    """Per-request Ed25519 JWT, contract copied from functions/api/_cdp_jwt.ts:
    header {alg:EdDSA, typ:JWT, kid, nonce} · claims {sub, iss:cdp, aud:[cdp_service],
    nbf, exp: now+120, uri: 'METHOD host/path'} — uri binds the exact call."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization

    blob = base64.b64decode(key_secret_b64)
    seed = blob[:32]  # 64-byte blob = seed || pubkey
    key = Ed25519PrivateKey.from_private_bytes(seed)
    now = int(time.time())
    header = {"alg": "EdDSA", "typ": "JWT", "kid": key_id, "nonce": uuid.uuid4().hex}
    host_path = f"{CDP.split('//', 1)[1]}{path}"
    claims = {
        "sub": key_id, "iss": "cdp", "aud": ["cdp_service"],
        "nbf": now, "exp": now + 120, "uri": f"{method.upper()} {host_path}",
    }
    signing_input = f"{b64url(json.dumps(header, separators=(',', ':')).encode())}." \
                    f"{b64url(json.dumps(claims, separators=(',', ':')).encode())}"
    sig = key.sign(signing_input.encode())
    return f"{signing_input}.{b64url(sig)}"


def cdp_call(path, method, payload, key_id, key_secret):
    jwt = mint_cdp_jwt(key_id, key_secret, method, path)
    status, body, _ = http(
        f"{CDP}{path}", method=method,
        body=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {jwt}"},
    )
    return status, body


def sign_eip3009(signer_hex: str, to: str, value_atomic: str) -> dict:
    """USDC transferWithAuthorization (domain 'USD Coin' v2, chainId 8453)."""
    from eth_account import Account
    from eth_account.messages import encode_typed_data

    acct = Account.from_key(signer_hex)
    nonce = "0x" + uuid.uuid4().bytes.hex()
    msg = {
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
            "name": "USD Coin",
            "version": "2",
            "chainId": 8453,
            "verifyingContract": USDC_BASE,
        },
        "message": {
            "from": acct.address,
            "to": to,
            "value": int(value_atomic),
            "validAfter": 0,
            "validBefore": int(time.time()) + 3600,
            "nonce": nonce,
        },
    }
    signed = Account.sign_message(encode_typed_data(full_message=msg), acct.key)
    return {
        "x402Version": 2,
        "scheme": "exact",
        "network": NETWORK,
        "payload": {
            "from": acct.address,
            "to": to,
            "value": str(int(value_atomic)),
            "validAfter": "0",
            "validBefore": str(msg["message"]["validBefore"]),
            "nonce": nonce,
            "signature": signed.signature.hex(),
        },
    }


def main():
    ap = argparse.ArgumentParser(description="CDP Bazaar index trigger (staged)")
    ap.add_argument("--dry-run", action="store_true", help="print the plan; move nothing")
    args = ap.parse_args()

    print("=== CDP Bazaar index settle — STAGED, E2E-UNTESTED ===")
    print(f"resource : {RESOURCE}")
    print(f"payTo    : {PAYTO}  (ourselves — INTERNAL_SELF_FUNDED)")
    print(f"facilitator: {CDP}")

    if args.dry_run:
        print("\nDRY RUN — would:")
        print(" 1. GET  {facilitator}/supported        (JWT authed) -> dialect v1/v2")
        print(f" 2. GET  {RESOURCE} -> 402 challenge (exact amount from accepts[])")
        print(" 3. sign EIP-3009 transferWithAuthorization (signer -> payTo, 10000 atomic)")
        print(" 4. POST {facilitator}/verify   {x402Version, paymentPayload, paymentRequirements}")
        print(" 5. POST {facilitator}/settle   (paymentPayload.resource = resource)")
        print(" 6. GET  merchant discovery -> expect pagination.total >= 1")
        print("\nEnv needed: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_INDEX_SIGNER_KEY")
        print("Nothing printed here contains secret material.")
        return 0

    key_id = os.environ.get("CDP_API_KEY_ID", "")
    key_secret = os.environ.get("CDP_API_KEY_SECRET", "")
    signer = os.environ.get("CDP_INDEX_SIGNER_KEY", "")
    missing = [n for n, v in
               [("CDP_API_KEY_ID", key_id), ("CDP_API_KEY_SECRET", key_secret),
                ("CDP_INDEX_SIGNER_KEY", signer)] if not v]
    if missing:
        print(f"BLOCKED (expected): missing env {missing} — these are the owner's hands "
              f"per docs/tui4/cdp-bazaar-runbook-2026-10-07.md. Nothing was attempted.")
        return 2

    # 1. dialect
    st, body, _ = http(f"{CDP}/supported",
                       headers={"Authorization": f"Bearer {mint_cdp_jwt(key_id, key_secret, 'GET', '/supported')}"})
    print(f"supported -> HTTP {st}")
    dialect = 2
    if st == 200:
        sup = json.loads(body)
        kinds = {k.get("kind") for k in (sup.get("kinds") or []) if isinstance(k, dict)}
        if "exact" not in kinds and kinds:
            print(f"FAIL-CLOSED: facilitator kinds {kinds} lack 'exact' — stop.")
            return 3
        vers = sup.get("versions") or []
        if vers and 2 not in vers:
            dialect = 1
    elif st in (401, 403):
        print("FAIL-CLOSED: facilitator rejected auth (HTTP "
              f"{st}) — check CDP_API_KEY_ID/SECRET against portal.cdp.coinbase.com.")
        return 3

    # 2. challenge (accepts from our own door; amount 10000 = $0.01 promo tier)
    st, body, _ = http(RESOURCE)
    if st != 402:
        print(f"FAIL: expected 402 from our own door, got {st}")
        return 4
    ch = json.loads(body)
    acc = next((a for a in ch.get("accepts", []) if a.get("network") == NETWORK),
               ch.get("accepts", [{}])[0])
    amount = acc.get("amount") or "10000"
    print(f"challenge -> 402, amount={amount} atomic ({acc.get('network')})")

    # 3. sign
    payment = sign_eip3009(signer, PAYTO, amount)
    print(f"signed EIP-3009 from {payment['payload']['from']} value={amount}")

    # 4. verify
    vbody = {"x402Version": dialect, "paymentPayload": payment, "paymentRequirements": acc}
    if dialect == 2:
        vbody["paymentPayload"] = dict(payment, resource=RESOURCE, accepted=[acc])
    st, body = cdp_call("/verify", "POST", vbody, key_id, key_secret)
    print(f"verify -> HTTP {st}: {body[:220].decode('utf8', 'replace')}")
    if st != 200:
        print("FAIL-CLOSED: verify did not pass; no money moved.")
        return 5
    vr = json.loads(body)
    if not vr.get("isValid"):
        print(f"FAIL-CLOSED: isValid=false: {vr}")
        return 5

    # 5. settle
    st, body = cdp_call("/settle", "POST", vbody, key_id, key_secret)
    print(f"settle -> HTTP {st}: {body[:300].decode('utf8', 'replace')}")
    if st != 200:
        print("FAIL: settle did not complete.")
        return 6
    settle = json.loads(body)
    tx = settle.get("transaction")
    print(f"SETTLED transaction={tx} — classification INTERNAL_SELF_FUNDED (never revenue)")

    # 6. index readback (cache ~10 min)
    for attempt in range(4):
        time.sleep(30)
        st, body, _ = http(MERCHANT_Q)
        if st == 200:
            total = json.loads(body).get("pagination", {}).get("total", 0)
            print(f"merchant discovery total={total} (attempt {attempt + 1})")
            if total and total >= 1:
                print("INDEXED — resource now listed in CDP Bazaar discovery.")
                return 0
    print("SETTLED but index not visible yet — their cache is up to ~10 min; re-run the "
          "merchant query manually before claiming presence.")
    return 7


if __name__ == "__main__":
    sys.exit(main())
