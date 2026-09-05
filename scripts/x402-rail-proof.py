#!/usr/bin/env python3
"""x402-rail-proof — does the money rail actually EARN, or does it only look armed?

`/api/x402` reporting mode:"live" means X402_PAY_TO and X402_FACILITATOR_URL are both set. It
says NOTHING about whether a payment can settle. On 2026-09-04 the apex reported "live" with
well-formed v2 challenges while every real payment failed at `facilitator /verify HTTP 400`
AFTER the buyer had signed — PayAI began advertising both v1 and v2 for Base, "highest version
wins" flipped production to v2, and PayAI's v2 rejected our body. A rail can look perfect and
earn nothing.

This is the free end-to-end proof. An ephemeral secp256k1 key signs a REAL EIP-3009
transferWithAuthorization for the exact terms in the live 402 challenge. The key is generated in
memory, holds nothing, is never printed and must never be funded — so no money can move and the
only check that can possibly fail at the end is the balance.

    invalid_exact_evm_insufficient_balance  the verify->settle path works end to end and only
                                            funds are missing. THIS IS A RAIL THAT CAN EARN.
    facilitator /verify HTTP 4xx            dialect drift — the failure that silently stopped
                                            the rail before. A real defect.
    anything else                           a real defect between a buyer and our money.

Facilitator capabilities DRIFT. Re-run this after ANY facilitator change, and after anything
that touches functions/api/_x402.ts.

    python3 scripts/x402-rail-proof.py [resource-url]

Requires: pip install eth-account.  Exit 0 only when the rail is proven to earn.

NOTE ON UA: Cloudflare 403s `Python-urllib` specifically (Error 1010). A probe without a real
User-Agent misreads a WAF ban as a rail failure, so one is set below — do not remove it.
"""
import base64, json, os, secrets, time, urllib.request, urllib.error
from eth_account import Account
from eth_account.messages import encode_typed_data

UA = {"user-agent": "Mozilla/5.0 (compatible; csoai-rail-probe/1.0)", "accept": "application/json"}
USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
import sys
RESOURCE = sys.argv[1] if len(sys.argv) > 1 else "https://councilof.ai/api/rwa/evidence?asset=RLUSD"

def challenge(url):
    try:
        urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30)
        return None, None
    except urllib.error.HTTPError as e:
        pr = e.headers.get("payment-required")
        return (json.loads(base64.b64decode(pr)) if pr else None), e

ch, _ = challenge(RESOURCE)
if not ch or not (ch.get("accepts") or []):
    # No challenge at all: the route is free, quarantined (503) or missing required params.
    # That is not a rail failure, but it is not a proof either — say which, and refuse to pass.
    print(f"NO 402 CHALLENGE from {RESOURCE}")
    print("  the route is free, quarantined, or needs required query params — nothing to prove here")
    raise SystemExit(2)
acc = ch["accepts"][0]
print("challenge:", acc["scheme"], acc["network"], "amount", acc["maxAmountRequired"],
      "| extra", acc.get("extra"))

# Ephemeral, unfunded. The private key never leaves this process and is never printed.
acct = Account.from_key(secrets.token_bytes(32))
print("ephemeral payer (unfunded, never reused):", acct.address)

now = int(time.time())
authorization = {
    "from": acct.address,
    "to": acc["payTo"],
    "value": str(acc["maxAmountRequired"]),
    "validAfter": "0",
    "validBefore": str(now + 600),
    "nonce": "0x" + secrets.token_bytes(32).hex(),
}
extra = acc.get("extra") or {}
typed = {
    "types": {
        "EIP712Domain": [
            {"name": "name", "type": "string"}, {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"}, {"name": "verifyingContract", "type": "address"},
        ],
        "TransferWithAuthorization": [
            {"name": "from", "type": "address"}, {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"}, {"name": "validAfter", "type": "uint256"},
            {"name": "validBefore", "type": "uint256"}, {"name": "nonce", "type": "bytes32"},
        ],
    },
    "primaryType": "TransferWithAuthorization",
    "domain": {"name": extra.get("name", "USD Coin"), "version": extra.get("version", "2"),
               "chainId": 8453, "verifyingContract": USDC},
    "message": {
        "from": authorization["from"], "to": authorization["to"],
        "value": int(authorization["value"]),
        "validAfter": int(authorization["validAfter"]),
        "validBefore": int(authorization["validBefore"]),
        "nonce": bytes.fromhex(authorization["nonce"][2:]),
    },
}
sig = Account.sign_message(encode_typed_data(full_message=typed), private_key=acct.key)
print("signed EIP-3009 authorization ok, sig len", len(sig.signature.hex()))

payment = {"x402Version": 2, "scheme": acc["scheme"], "network": acc["network"],
           "payload": {"signature": "0x" + sig.signature.hex().removeprefix("0x"),
                       "authorization": authorization}}
hdr = base64.b64encode(json.dumps(payment).encode()).decode()

req = urllib.request.Request(RESOURCE, headers={**UA, "x-payment": hdr})
try:
    r = urllib.request.urlopen(req, timeout=60); code, raw = r.status, r.read()
except urllib.error.HTTPError as e:
    code, raw = e.code, e.read()
print("\n--- server answered HTTP", code, "---")
try:
    d = json.loads(raw)
    # TOP-LEVEL csoai, not extensions.csoai (memory)
    cs = d.get("csoai") or (d.get("extensions") or {}).get("csoai") or {}
    reason = cs.get("not_paid_reason") or d.get("not_paid_reason")
    print("not_paid_reason:", reason)
    if code == 200:
        print(">>> SETTLED — the artefact was released. keys:", list(d)[:10])
except Exception:
    print(raw[:400])

EARNS = "invalid_exact_evm_insufficient_balance"
try:
    ok = (code == 200) or (reason or "").endswith(EARNS)
except NameError:
    ok = False
print("\nVERDICT:", "RAIL EARNS — only funds were missing" if ok
      else "RAIL DOES NOT EARN — a buyer who signs would be turned away")
raise SystemExit(0 if ok else 1)
