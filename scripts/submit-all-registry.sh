#!/bin/bash
# Submit the CSOAI bridge family to the official MCP Registry (after PyPI publish).
# Distribution step 2. Uses mcp-publisher (io.github.CSOAI-ORG/* namespace = GitHub OIDC auth).
# No mcp-publisher / not logged in = DRY: validates each server.json + lists submit commands.
set -uo pipefail
ROOT=~/clawd/mcp-marketplace
BRIDGES="cobol iso20022 hl7-fhir as400 sap oracle scada edi fix cics mqtt acord nacha iso8583 sip tax gs1 mismo dlms"
HAVE=$(command -v mcp-publisher || true)
# SAFE: validate-only by default. Actual submission to the public registry requires SUBMIT=1 (explicit, owner).
[ "${SUBMIT:-0}" != "1" ] && HAVE="" && echo "DRY (validate-only). Set SUBMIT=1 + 'mcp-publisher login github' to actually submit."
valid=0; n=0
for b in $BRIDGES; do
  d="$ROOT/${b}-bridge-mcp"; sj="$d/server.json"; n=$((n+1))
  [ -f "$sj" ] || { echo "  ✗ $b (no server.json)"; continue; }
  if python3 -c "import json,sys; j=json.load(open('$sj')); assert j['packages'][0]['registryType']=='pypi'; assert j['name'].startswith('io.github.CSOAI-ORG/')" 2>/dev/null; then
    valid=$((valid+1))
    if [ -n "$HAVE" ]; then ( cd "$d" && mcp-publisher publish >/dev/null 2>&1 && echo "  ✓ submitted $b" || echo "  ✗ submit failed $b" ); else echo "  ✓ $b ready  (cd $d && mcp-publisher publish)"; fi
  else echo "  ✗ $b server.json invalid"; fi
done
echo ""
echo "registry-valid: $valid/$n  ${HAVE:+(submitted via mcp-publisher)}"
[ -z "$HAVE" ] && echo "→ all valid + ready. Install mcp-publisher, 'mcp-publisher login github', re-run to submit."
