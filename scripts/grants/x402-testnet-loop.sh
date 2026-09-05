#!/usr/bin/env bash
# x402-testnet-loop.sh — the free 402 -> verify -> settle loop on Base Sepolia.
#
# WHAT IT PROVES. The facilitator's /verify and /settle hops work end to end for OUR exact
# challenge shape (x402 v2, scheme "exact", EIP-3009 transferWithAuthorization, USDC domain
# name/version "USDC"/"2") with testnet money. It moves 0.02 testnet USDC and earns nothing.
#
# WHAT IT DOES NOT PROVE, said plainly:
#   * it does not settle on mainnet, does not count on /api/revenue and does not index the estate
#     in any Bazaar (both need a confirmed eip155:8453 settle);
#   * the live edge only issues eip155:8453 challenges (functions/api/_x402_config.ts,
#     NETWORK_CAIP2_BASE), so step 1 below READS the live 402 for its shape and this script
#     re-targets that shape at eip155:84532 — the edge itself is not exercised on testnet.
#
# INPUTS (env). The key is a placeholder here and must never be committed:
#   X402_PAYER_KEY        0x-prefixed secp256k1 private key of a THROWAWAY wallet funded from
#                         https://faucet.circle.com (Base Sepolia, USDC, 20 per 2 h per address).
#                         Make one with scripts/badger/make-payer-wallet.sh (writes .payer.key, chmod 600).
#   X402_PAY_TO           receiver. Default: payTo read from https://councilof.ai/.well-known/x402.json
#                         (the same address exists on every EVM chain, so the estate's Base address
#                         receives on Base Sepolia too).
#   X402_FACILITATOR      default https://facilitator.payai.network  (serves v1 "base-sepolia" and
#                         v2 "eip155:84532"; probed 2026-09-05 via /supported).
#                         Alternative: https://x402.org/facilitator (v2 "eip155:84532" exact only).
#   X402_RESOURCE         the live paid door whose 402 shape is copied.
#                         Default https://councilof.ai/api/rwa/evidence?asset=RLUSD
#   SETTLE=1              actually POST /settle. Without it the loop stops after /verify (moves nothing).
#
# Requires: curl, python3, `pip install eth-account`.
#
# Exit codes: 0 verify ok (and settle ok when SETTLE=1) · 1 facilitator said no · 2 no 402 shape read.
set -euo pipefail

: "${X402_PAYER_KEY:?set X402_PAYER_KEY to a THROWAWAY key (never paste a real one; see scripts/badger/make-payer-wallet.sh)}"
FACILITATOR="${X402_FACILITATOR:-https://facilitator.payai.network}"
RESOURCE="${X402_RESOURCE:-https://councilof.ai/api/rwa/evidence?asset=RLUSD}"
UA="Mozilla/5.0 (compatible; csoai-testnet-loop/1.0)"

# Base Sepolia constants (CAIP-2 eip155:84532). USDC address is the one named in the x402 v2
# specification's own worked example and used by scripts/badger/prove-settle-testnet.py.
CHAIN_ID=84532
NETWORK_V2="eip155:84532"
USDC_SEPOLIA="0x036CbD53842c5426634e7929541eC2318f3dCF7e"

echo "[1/4] facilitator supports testnet?  $FACILITATOR/supported"
curl -fsS --max-time 30 -A "$UA" "$FACILITATOR/supported" \
  | python3 -c 'import sys,json; k=json.load(sys.stdin)["kinds"]; ok=[x for x in k if x.get("network") in ("eip155:84532","base-sepolia")]; print("   ", *[f"v{x["x402Version"]} {x["scheme"]} {x["network"]}" for x in ok], sep="\n    "); sys.exit(0 if ok else 1)'

echo "[2/4] read the LIVE 402 shape from $RESOURCE (mainnet challenge; copied, then re-targeted)"
PR=$(curl -sS --max-time 30 -A "$UA" -o /dev/null -D - "$RESOURCE" | tr -d '\r' | awk 'tolower($1)=="payment-required:"{print $2}')
if [ -z "$PR" ]; then echo "    no payment-required header: route is free, quarantined or needs params — nothing to copy"; exit 2; fi
PAYTO_DEFAULT=$(curl -fsS --max-time 30 -A "$UA" https://councilof.ai/.well-known/x402.json | python3 -c 'import sys,json;print(json.load(sys.stdin)["payTo"])')
PAY_TO="${X402_PAY_TO:-$PAYTO_DEFAULT}"

echo "[3/4] sign EIP-3009 for the copied terms on $NETWORK_V2 and POST /verify"
BODY=$(python3 - "$PR" "$PAY_TO" "$RESOURCE" <<'PY'
import base64, json, os, secrets, sys, time
from eth_account import Account
from eth_account.messages import encode_typed_data
ch = json.loads(base64.b64decode(sys.argv[1]))
acc = ch["accepts"][0]                       # the live mainnet terms; only network/asset are re-targeted
pay_to, resource = sys.argv[2], sys.argv[3]
acct = Account.from_key(os.environ["X402_PAYER_KEY"].strip())
now = int(time.time())
amount = str(acc.get("amount") or acc.get("maxAmountRequired"))
auth = {"from": acct.address, "to": pay_to, "value": int(amount), "validAfter": 0,
        "validBefore": now + 600, "nonce": "0x" + secrets.token_hex(32)}
typed = {"types": {"EIP712Domain": [{"name":"name","type":"string"},{"name":"version","type":"string"},
                                     {"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],
                   "TransferWithAuthorization": [{"name":"from","type":"address"},{"name":"to","type":"address"},
                                                 {"name":"value","type":"uint256"},{"name":"validAfter","type":"uint256"},
                                                 {"name":"validBefore","type":"uint256"},{"name":"nonce","type":"bytes32"}]},
         "primaryType": "TransferWithAuthorization",
         "domain": {"name": "USDC", "version": "2", "chainId": 84532,
                    "verifyingContract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"},
         "message": auth}
sig = Account.sign_message(encode_typed_data(full_message=typed), acct.key).signature.hex()
sig = sig if sig.startswith("0x") else "0x" + sig
auth_s = {k: (str(v) if isinstance(v, int) else v) for k, v in auth.items()}
reqs = {"scheme": "exact", "network": "eip155:84532", "amount": amount, "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "payTo": pay_to, "resource": {"url": resource, "description": "", "mimeType": "application/json"},
        "maxTimeoutSeconds": 600, "extra": {"name": "USDC", "version": "2"}}
body = {"x402Version": 2,
        "paymentPayload": {"x402Version": 2, "accepted": reqs,
                           "payload": {"signature": sig, "authorization": auth_s}},
        "paymentRequirements": reqs}
sys.stderr.write(f"    payer {acct.address}  ->  {int(amount)/1e6:.6f} testnet USDC  ->  {pay_to}\n")
print(json.dumps(body))
PY
)
V=$(curl -sS --max-time 90 -A "$UA" -H 'content-type: application/json' -d "$BODY" "$FACILITATOR/verify")
echo "    verify: $V"
echo "$V" | python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get("isValid") else 1)' || {
  echo "    -> not valid. invalid_exact_evm_insufficient_balance means: fund the payer at https://faucet.circle.com (Base Sepolia)"; exit 1; }

if [ "${SETTLE:-0}" != "1" ]; then echo "[4/4] settle skipped (SETTLE=1 to submit). /verify moved nothing."; exit 0; fi
echo "[4/4] POST /settle"
S=$(curl -sS --max-time 120 -A "$UA" -H 'content-type: application/json' -d "$BODY" "$FACILITATOR/settle")
echo "    settle: $S"
echo "$S" | python3 -c 'import sys,json; d=json.load(sys.stdin); tx=d.get("transaction"); print(f"    https://sepolia.basescan.org/tx/{tx}" if tx else ""); sys.exit(0 if d.get("success") else 1)' \
  && echo "    SETTLED on Base Sepolia. Testnet money: not revenue, not on /api/revenue, indexes nothing."
