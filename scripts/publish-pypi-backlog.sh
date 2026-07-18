#!/bin/bash
# publish-pypi-backlog.sh — Batch publish the 44 built-but-unpublished MCP packages
# Run from: /Users/nicholas/clawd
# Requires: twine, build, PyPI API token in ~/.pypirc or env
# Authored: 2026-06-09 by Kimi orchestrator

set -e

MARKETPLACE="mcp-marketplace"
BACKLOG=(
  agent-x402-paywall-mcp
  bft-progress-council-mcp
  care-home-cqc-mcp
  care-home-scheduling-mcp
  cisa-kev-mcp
  coppa-ferpa-mcp
  cqc-compliance-mcp
  dispense-record-mcp
  domiciliary-care-mcp
  eudi-wallet-mcp
  firmware-attestation-mcp
  gos-claim-validator-mcp
  iso-42005-impact-mcp
  korea-ai-basic-act-mcp
  mcp-spec-compliance-mcp
  meok-aaif-agent-card-mcp
  meok-abci-bridge-mcp
  meok-agents-md-lint-mcp
  meok-ap2-mandate-mcp
  meok-c2pa-durable-mcp
  meok-coinbase-x402-receipt-mcp
  meok-cra-art14-reporter-mcp
  meok-drcf-agent-crosswalk-mcp
  meok-eu-aia-art-9-rms-mcp
  meok-eu-aigc-icon-mcp
  meok-koikeeper-ai-mcp
  meok-libp2p-agent-mesh-mcp
  meok-mcp-cardgen-mcp
  meok-mcp-hardening-mcp
  meok-mcp-test-mcp
  meok-nis2-nl-register-mcp
  meok-stripe-acp-checkout-mcp
  meok-uk-adm-article22c-mcp
  meok-w3c-tdm-rights-mcp
  meok-x402-wrap-mcp
  mhra-samd-optometry-mcp
  mitre-attack-mcp
  nhs-gos-claims-mcp
  oasf-agent-directory-mcp
  optical-care-home-bridge-mcp
  optometry-patient-mcp
  sigstore-cosign-mcp
  slsa-supply-chain-mcp
)

LOGFILE="pypi-publish-$(date +%Y%m%d-%H%M%S).log"
SUCCESS=0
FAILED=0
ALREADY=0

echo "=== MEOK PyPI 44-Package Publish Pipeline ===" | tee -a "$LOGFILE"
echo "Time: $(date)" | tee -a "$LOGFILE"
echo "Total: ${#BACKLOG[@]} packages" | tee -a "$LOGFILE"
echo "" | tee -a "$LOGFILE"

for pkg in "${BACKLOG[@]}"; do
  dir="$MARKETPLACE/$pkg"
  
  if [ ! -d "$dir" ]; then
    echo "  ❌ $pkg — directory not found" | tee -a "$LOGFILE"
    ((FAILED++)) || true
    continue
  fi
  
  cd "$dir"
  
  # Check if already published
  name=$(grep -E '^name\s*=' pyproject.toml 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
  if [ -z "$name" ]; then
    echo "  ❌ $pkg — could not parse name from pyproject.toml" | tee -a "$LOGFILE"
    ((FAILED++)) || true
    cd - >/dev/null
    continue
  fi
  
  published=$(curl -s -o /dev/null -w "%{http_code}" "https://pypi.org/pypi/$name/json" 2>/dev/null)
  if [ "$published" = "200" ]; then
    echo "  ⏭️  $name — already published (skipping)" | tee -a "$LOGFILE"
    ((ALREADY++)) || true
    cd - >/dev/null
    continue
  fi
  
  # Build
  echo "  🔨 Building $name..." | tee -a "$LOGFILE"
  if ! python3 -m build 2>&1 | tee -a "$LOGFILE"; then
    echo "  ❌ $name — build failed" | tee -a "$LOGFILE"
    ((FAILED++)) || true
    cd - >/dev/null
    continue
  fi
  
  # Publish
  echo "  🚀 Publishing $name to PyPI..." | tee -a "$LOGFILE"
  if python3 -m twine upload dist/* 2>&1 | tee -a "$LOGFILE"; then
    echo "  ✅ $name — PUBLISHED" | tee -a "$LOGFILE"
    ((SUCCESS++)) || true
  else
    echo "  ❌ $name — upload failed" | tee -a "$LOGFILE"
    ((FAILED++)) || true
  fi
  
  cd - >/dev/null
  echo "" | tee -a "$LOGFILE"
done

echo "=== Publish Complete ===" | tee -a "$LOGFILE"
echo "Success: $SUCCESS | Already: $ALREADY | Failed: $FAILED" | tee -a "$LOGFILE"
echo "Log: $LOGFILE"
