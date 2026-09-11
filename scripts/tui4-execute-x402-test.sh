#!/usr/bin/env bash
# tui4-execute-x402-test.sh — Run the 0.01 USDC test for request_attestation on llama3.2:3b
#
# Classification: INTERNAL_SELF_FUNDED
# Revenue impact: Zero (self-payment to own wallet)
#
# Prerequisites:
#   1. A funded wallet on Base mainnet with >=0.01 USDC
#   2. Set X402_PAYER_KEY env var (0x-prefixed secp256k1 private key)
#   3. pip install eth-account
#
# Usage:
#   export X402_PAYER_KEY="0x..."
#   bash scripts/tui4-execute-x402-test.sh
#
# This script calls csoai-real-payment.py which:
#   1. Probes /api/request-attestation?subject=llama3.2:3b for the 402 challenge
#   2. Builds EIP-3009 transferWithAuthorization (0.01 USDC)
#   3. Signs with EIP-712 (domain: USD Coin / 2, chain 8453)
#   4. Submits to PayAI /verify + /settle
#   5. Retries with X-PAYMENT header
#   6. Receives the signed card-v0 for llama3.2:3b
#   7. Emits a receipt atom
set -euo pipefail

: "${X402_PAYER_KEY:?Set X402_PAYER_KEY to a funded Base mainnet wallet private key}"

SUBJECT="llama3.2:3b"
ENDPOINT="https://councilof.ai/api/request-attestation?subject=${SUBJECT}"
OUT_DIR="scripts/badger/_queue/tui4-x402-test-$(date +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"

echo "=== TUI-4 x402 Self-Test ==="
echo "Subject: $SUBJECT"
echo "Endpoint: $ENDPOINT"
echo "Classification: INTERNAL_SELF_FUNFD"
echo "Output: $OUT_DIR"
echo ""

# Step 1: Capture the402 challenge
echo "--- Step 1: Capturing 402 challenge ---"
curl -s -D "$OUT_DIR/402-headers.txt" -o "$OUT_DIR/402-body.json" "$ENDPOINT"
HTTP_CODE=$(head -1 "$OUT_DIR/402-headers.txt" | grep -oE '[0-9]{3}')
echo "Status: $HTTP_CODE"
echo "Challenge body: $(wc -c < "$OUT_DIR/402-body.json") bytes"

# Extract amount from challenge
AMOUNT=$(python3 -c "import json; d=json.load(open('$OUT_DIR/402-body.json')); print(d['accepts'][0]['amount'])")
echo "Amount: $AMOUNT atomic ($(($AMOUNT / 10000)) USDC cents)"

# Step 2: Run the real payment script
echo ""
echo "--- Step 2: Executing payment ---"
python3 scripts/badger/csoai-real-payment.py \
  --endpoint "$ENDPOINT" \
  --subject "$SUBJECT" \
  --amount "$AMOUNT" \
  --out "$OUT_DIR" \
  --classification "INTERNAL_SELF_FUNFD" \
  --label "TUI-4 self-test: request_attestation on llama3.2:3b"

echo ""
echo "=== Done ==="
echo "Results in: $OUT_DIR"
echo "Classification: INTERNAL_SELF_FUNFD"
echo "Revenue impact: Zero"
