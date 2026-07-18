#!/bin/bash
# CSOAI Sovereign Citizen Onboarding Script
# Honesty register: illustrative, not live certification.

set -e

echo "=== CSOAI Sovereign Citizen Onboarding ==="

# 1. Generate Ed25519 keypair
echo "[1/5] Generating Ed25519 keypair..."
mkdir -p ~/.sovereign/keys
nacl-signing genkeypair --output ~/.sovereign/keys/citizen.pub ~/.sovereign/keys/citizen.key

# 2. Sign Charter Article 0
echo "[2/5] Signing Charter Article 0..."
CHART_ARTICLE_0="Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."
echo "$CHART_ARTICLE_0" > ~/.sovereign/charter_article_0.txt
nacl-signing sign-message ~/.sovereign/keys/citizen.key ~/.sovereign/charter_article_0.txt ~/.sovereign/signatures/article-0.sig

# 3. Generate sovereign wallet (W3C DID)
echo "[3/5] Generating sovereign DID..."
DID="did:csoai:citizen-$(uuidgen)"
echo "$DID" > ~/.sovereign/did.txt
nacl-pubkey-to-did ~/.sovereign/keys/citizen.pub "$DID" > ~/.sovereign/did.json

# 4. Submit first SIGIL emit
echo "[4/5] Submitting first SIGIL..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LINE="M|$DID|csoai|First sovereign SIGIL|$TIMESTAMP"
DIGEST=$(echo -n "$LINE" | sha256sum | cut -d' ' -f1)
curl -X POST https://api.csoai.org/v1/sigil/emit \
  -H "X-Partner-DID: $DID" \
  -H "X-Signature: ed25519:$(cat ~/.sovereign/signatures/article-0.sig)" \
  -d "{\"op\":\"M\",\"actor\":\"$DID\",\"target\":\"csoai\",\"message\":\"First sovereign SIGIL\"}"

# 5. Verify public
echo "[5/5] Verifying at proofof.ai/verify..."
curl https://proofof.ai/verify/$DID

echo ""
echo "=== ONBOARDING COMPLETE ==="
echo "DID: $DID"
echo "Verify: proofof.ai/verify/$DID"
echo "Watchdog: watchdog.csoai.org"
echo "API: api.csoai.org"
echo ""
echo "Charter Article 0 binding: preserved"
echo "Honesty register: illustrative, not live certification."
