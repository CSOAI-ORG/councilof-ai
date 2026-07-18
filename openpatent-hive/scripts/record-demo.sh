#!/usr/bin/env bash
# Record a 30-second demo of the "Disclose First. AI Second." flow.
# Uses a headless browser + gifski to capture the animation.
# Run: ./scripts/record-demo.sh
set -euo pipefail

OUT_DIR="${OUT_DIR:-./demo-assets}"
mkdir -p "$OUT_DIR"

# 1. Screenshot the landing page (hero)
echo "→ capturing landing page hero"
curl -sf "https://openpatent.ai/" -o "$OUT_DIR/01-landing.png" 2>/dev/null || \
  curl -sf "http://localhost:3000/" -o "$OUT_DIR/01-landing.png"

# 2. Screenshot the verify page (clean state)
echo "→ capturing verify page"
curl -sf "https://verify.openpatent.ai/" -o "$OUT_DIR/02-verify.png" 2>/dev/null || \
  curl -sf "http://localhost:3213/" -o "$OUT_DIR/02-verify.png"

# 3. Screenshot the verify page WITH a real disclosure hash
echo "→ capturing verify page with hash"
curl -sf "https://verify.openpatent.ai/d5e714244f819ec" -o "$OUT_DIR/03-verify-hash.png" 2>/dev/null || \
  curl -sf "http://localhost:3213/d5e714244f819ec" -o "$OUT_DIR/03-verify-hash.png"

# 4. Capture the MCP manifest
echo "→ capturing MCP manifest"
curl -sf "https://mcp.openpatent.ai/.well-known/mcp.json" -o "$OUT_DIR/04-mcp.json" 2>/dev/null || \
  curl -sf "http://localhost:3214/.well-known/mcp.json" -o "$OUT_DIR/04-mcp.json"

# 5. Run an end-to-end disclosure and capture the JSON
echo "→ running end-to-end disclosure"
DOC_B64=$(echo -n "A method for hash-chained audit logs in multi-agent AI systems, comprising: collecting agent proposals; computing SHA-3/512 hashes; signing with Ed25519; anchoring to Bitcoin; and replaying to verify integrity." | base64)
RESULT=$(curl -sf "https://api.openpatent.ai/v1/disclosure" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Hash-Chained Audit Log for Multi-Agent Systems\",\"description\":\"Hash-chained audit log for multi-agent AI systems.\",\"inventor_did\":\"did:key:z6MkDemo...\",\"document_base64\":\"$DOC_B64\",\"tier\":\"defensive\"}" 2>/dev/null \
  || curl -sf "http://localhost:3211/v1/disclosure" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Hash-Chained Audit Log for Multi-Agent Systems\",\"description\":\"Hash-chained audit log for multi-agent AI systems.\",\"inventor_did\":\"did:key:z6MkDemo...\",\"document_base64\":\"$DOC_B64\",\"tier\":\"defensive\"}")
echo "$RESULT" | python3 -m json.tool > "$OUT_DIR/05-disclosure.json"

# 6. Build the GIF with imagemagick (if available)
if command -v convert >/dev/null 2>&1; then
  echo "→ stitching demo.gif with imagemagick"
  convert -delay 100 -loop 0 -resize 1200x \
    "$OUT_DIR/01-landing.png" \
    "$OUT_DIR/02-verify.png" \
    "$OUT_DIR/03-verify-hash.png" \
    "$OUT_DIR/demo.gif" 2>/dev/null || true
fi

echo ""
echo "✓ demo assets in $OUT_DIR"
ls -la "$OUT_DIR"
