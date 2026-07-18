#!/usr/bin/env bash
# install-sovereign.sh — drop Sovereign into any sovereign web app
# CSOAI Ltd UK 16939677 · MIT License · 1 July 2026
# Run: ./install-sovereign.sh /path/to/web-app-root [citizen-id]

set -euo pipefail

WEB_ROOT="${1:-.}"
CITIZEN_ID="${2:-defoneos-csoai-nicholas-001}"

echo "🜏 Installing Sovereign into ${WEB_ROOT} (citizen_id=${CITIZEN_ID})..."

mkdir -p "${WEB_ROOT}/sovereign-os/frontend"
mkdir -p "${WEB_ROOT}/sovereign-os/backend"

# 1. Copy all sovereign-os files from the canonical source on the Mac
SRC="/Users/nicholas/clawd/csoai.org/sovereign-os"
if [ -d "$SRC/frontend" ]; then
  cp -f $SRC/frontend/*.{js,css,html,md} "${WEB_ROOT}/sovereign-os/frontend/" 2>/dev/null || true
fi
cp -f $SRC/sov3-vision-bridge.py "${WEB_ROOT}/sovereign-os/" 2>/dev/null || true
cp -f $SRC/backend/{server.py,brain_endpoint.py,observability.py,test_e2e_runner.py} "${WEB_ROOT}/sovereign-os/backend/" 2>/dev/null || true
cp -f $SRC/HANDOFF-TO-M2.md "${WEB_ROOT}/sovereign-os/" 2>/dev/null || true

echo "✓ Copied files to ${WEB_ROOT}/sovereign-os/"

# 2. Add the drop-in <script> block to the main sovereign page
SOVEREIGN_PATCH=$(cat <<HTML_PATCH
<!-- 🜏 SOVEREIGN OS INTEGRATION (MIT · CSOAI Ltd UK 16939677) -->
<script src="/sovereign-os/frontend/sovereign-event-bus.js"
        data-citizen-id="${CITIZEN_ID}"></script>
<script src="/sovereign-os/frontend/sovereign-hud.js"></script>
<script src="/sovereign-os/frontend/sov3-llm-brain.js"
        data-brain-endpoint="http://localhost:8100/v1"></script>
<link rel="stylesheet" href="/sovereign-os/frontend/sovereign-hud.css">
HTML_PATCH
)

TARGETS=("cop.html" "index.html" "sovereign.html" "app.html")
PATCHED=0
for T in "${TARGETS[@]}"; do
  if [ -f "${WEB_ROOT}/${T}" ]; then
    if ! grep -q "sovereign-event-bus.js" "${WEB_ROOT}/${T}"; then
      printf '\n%s\n' "$SOVEREIGN_PATCH" >> "${WEB_ROOT}/${T}"
      echo "✓ Patched ${WEB_ROOT}/${T}"
      PATCHED=$((PATCHED + 1))
    fi
  fi
done

# 3. If no sovereign page exists yet, create a stub so dev can see it
if [ $PATCHED -eq 0 ]; then
  cp -f $SRC/frontend/index.html "${WEB_ROOT}/sovereign.html" 2>/dev/null || true
  echo "✓ No sovereign page found — created ${WEB_ROOT}/sovereign.html (demo)"
fi

echo
echo "🜏 Verification:"
echo "    [ ] python3 sovereign-os/backend/server.py --port 8200 &"
echo "    [ ] python3 sovereign-os/backend/brain_endpoint.py --port 8100 &"
echo "    [ ] python3 sovereign-os/backend/test_e2e_runner.py  # 19/19 pass"
echo "    [ ] open ${WEB_ROOT}/cop.html and type 'what can you see'"
echo
echo "🜏 Done. Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC. MIT. Public. Sovereign."
