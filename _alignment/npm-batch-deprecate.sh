#!/bin/bash
# npm batch deprecate — requires 6-digit OTP from csga_global authenticator
# Usage: npm-batch-deprecate.sh <OTP>
set -euo pipefail

OTP="${1:?Usage: npm-batch-deprecate.sh <6-digit-OTP>}"

MSG="Deprecated — measurement-only successor at councilof.ai. No certification claims. No 'certified'/'approved'/'compliant' claims. Measurement only, signed evidence. See https://councilof.ai/.well-known/x402.json for paid artefacts."

# @csgaglobal scope (20 packages)
SCOPED_PKGS=(
  "access-control"
  "aerospace-ai"
  "api-gateway"
  "audit-logging"
  "autonomous-systems-ai"
  "aviation-ai"
  "biosecurity-ai"
  "climate-ai"
  "compliance-reporting"
  "consent-management"
  "continuous-monitoring"
  "critical-infrastructure-ai"
  "data-classification"
  "defense-ai"
  "deployment-governance"
  "education-ai"
  "ethical-review"
  "explainability-engine"
  "government-ai"
  "disaster-recovery"
)

# Unscoped (3 packages)
UNSCOPED_PKGS=(
  "csoai-gspc-mcp"
  "csoai-governance-mcp"
  "csoai-governance-crosswalk-mcp"
)

success=0
fail=0

echo "Deprecating ${#SCOPED_PKGS[@]} @csgaglobal packages..."
for pkg in "${SCOPED_PKGS[@]}"; do
  npm deprecate --otp="$OTP" "@csgaglobal/$pkg" "$MSG" 2>&1 >/dev/null
  current=$(npm view "@csgaglobal/$pkg" deprecated 2>&1)
  if [[ "$current" == *"Deprecated"* ]]; then
    echo "  ✅ @csgaglobal/$pkg"
    success=$((success+1))
  else
    echo "  ❌ @csgaglobal/$pkg: $current"
    fail=$((fail+1))
  fi
done

echo "Deprecating ${#UNSCOPED_PKGS[@]} unscoped packages..."
for pkg in "${UNSCOPED_PKGS[@]}"; do
  npm deprecate --otp="$OTP" "$pkg" "$MSG" 2>&1 >/dev/null
  current=$(npm view "$pkg" deprecated 2>&1)
  if [[ "$current" == *"Deprecated"* ]]; then
    echo "  ✅ $pkg"
    success=$((success+1))
  else
    echo "  ❌ $pkg: $current"
    fail=$((fail+1))
  fi
done

echo ""
echo "DONE: $success success, $fail failed"
