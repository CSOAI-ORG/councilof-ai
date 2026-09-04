#!/usr/bin/env python3
"""Prove the /settle hop end to end on Base Sepolia, for zero money.

WHY THIS EXISTS. Everything in the x402 chain has been proven on mainnet except the last hop.
/verify has been exercised dozens of times and now returns invalid_exact_evm_insufficient_balance
— correct in every respect but funding. /settle has NEVER run: it needs a funded payer, and the
estate has none. So the one step that actually moves money is the one step never observed.

Base Sepolia closes that for free. PayAI serves it (probed 2026-09-04: x402Version 1
"base-sepolia" and x402Version 2 "eip155:84532", scheme exact), and Circle's faucet gives testnet
USDC away. A settle that succeeds here proves the request shape, the dialect, the EIP-712 domain,
the authorization and the facilitator's settle path all work together — everything except the
mainnet asset.

WHAT IT DOES NOT PROVE, stated because the gap matters: this is testnet money on a testnet chain.
It is not revenue, it earns nothing, and it does NOT index the estate in the Bazaar — indexing
needs a confirmed mainnet settle. It removes doubt, not the funding requirement.

  export X402_PAYER_KEY=0x...            # a throwaway; see make-payer-wallet.sh
  python3 scripts/badger/prove-settle-testnet.py          # verify only, moves nothing
  python3 scripts/badger/prove-settle-testnet.py --settle # submits the testnet transfer
"""
from __future__ import annotations
import json, os, secrets, sys, time, urllib.error, urllib.request

FACILITATOR = "https://facilitator.payai.network"
# USDC on Base Sepolia, as named in the x402 v2 specification's own worked example.
USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
CHAIN_ID = 84532
AMOUNT = "20000"  # 0.02 testnet USDC — the same price the live rail charges
UA = "csoai-settle-prover/1.0"


def post(path: str, body: dict) -> tuple[int, dict]:
    req = urllib.request.Request(
        f"{FACILITATOR}{path}", data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return e.code, {"raw": raw.decode("utf-8", "replace")[:300]}


def main() -> int:
    key = os.environ.get("X402_PAYER_KEY", "").strip()
    if not key:
        raise SystemExit("set X402_PAYER_KEY (a throwaway — see scripts/badger/make-payer-wallet.sh)")
    try:
        from eth_account import Account
        from eth_account.messages import encode_typed_data
    except ImportError:
        raise SystemExit("pip install eth-account")

    acct = Account.from_key(key)
    pay_to = os.environ.get("X402_TESTNET_PAY_TO", acct.address)  # self-pay by default
    now = int(time.time())
    auth = {"from": acct.address, "to": pay_to, "value": int(AMOUNT), "validAfter": 0,
            "validBefore": now + 600, "nonce": "0x" + secrets.token_hex(32)}
    typed = {
        "types": {
            "EIP712Domain": [{"name": "name", "type": "string"}, {"name": "version", "type": "string"},
                             {"name": "chainId", "type": "uint256"}, {"name": "verifyingContract", "type": "address"}],
            "TransferWithAuthorization": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"},
                                          {"name": "value", "type": "uint256"}, {"name": "validAfter", "type": "uint256"},
                                          {"name": "validBefore", "type": "uint256"}, {"name": "nonce", "type": "bytes32"}]},
        "primaryType": "TransferWithAuthorization",
        "domain": {"name": "USDC", "version": "2", "chainId": CHAIN_ID, "verifyingContract": USDC_SEPOLIA},
        "message": auth,
    }
    sig = Account.sign_message(encode_typed_data(full_message=typed), acct.key).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig
    authS = {k: (str(v) if isinstance(v, int) else v) for k, v in auth.items()}

    print(f"  payer      : {acct.address}")
    print(f"  paying     : {int(AMOUNT)/1e6:.6f} testnet USDC to {pay_to}")
    print(f"  chain      : base-sepolia ({CHAIN_ID})")

    reqs_v1 = {"scheme": "exact", "network": "base-sepolia", "maxAmountRequired": AMOUNT,
               "resource": "https://councilof.ai/api/request-attestation", "description": "",
               "mimeType": "application/json", "payTo": pay_to, "maxTimeoutSeconds": 600,
               "asset": USDC_SEPOLIA, "extra": {"name": "USDC", "version": "2"}}
    body = {"x402Version": 1,
            "paymentPayload": {"x402Version": 1, "scheme": "exact", "network": "base-sepolia",
                               "payload": {"signature": sig, "authorization": authS}},
            "paymentRequirements": reqs_v1}

    code, out = post("/verify", body)
    print(f"  verify     : HTTP {code} {out.get('invalidReason') or ('isValid=' + str(out.get('isValid')))}")
    if code != 200 or not out.get("isValid"):
        print("  -> not settled. If this says insufficient_balance, claim testnet USDC first:")
        print("     https://faucet.circle.com  (Base Sepolia)")
        return 1

    if "--settle" not in sys.argv:
        print("  settle     : skipped — /verify moves nothing. Re-run with --settle to submit.")
        return 0

    code, s = post("/settle", body)
    ok = code == 200 and s.get("success")
    print(f"  settle     : HTTP {code} success={s.get('success')} tx={s.get('transaction')}")
    if ok:
        print("\n  SETTLE PROVEN on base-sepolia. This is testnet money: not revenue, and it does")
        print("  NOT index the estate in the Bazaar, which needs a confirmed MAINNET settle.")
        print(f"  https://sepolia.basescan.org/tx/{s.get('transaction')}")
    else:
        print(f"  -> {s.get('errorReason') or s.get('error') or s}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
