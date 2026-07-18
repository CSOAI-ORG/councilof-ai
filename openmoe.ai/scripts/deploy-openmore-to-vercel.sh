#!/usr/bin/env bash
# deploy-openmore-to-vercel.sh
# Trigger a Vercel deploy of the meok-attestation-api project so that
# public/openmoe/ goes live at https://proofof.ai/openmoe/
#
# Usage:
#   VERCEL_TOKEN=xxx ./deploy-openmore-to-vercel.sh
#   ./deploy-openmore-to-vercel.sh --dry-run
#
# Required env: VERCEL_TOKEN, VERCEL_TEAM_ID (optional, for teams), VERCEL_PROJECT_ID

set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

ATTEST_API_DIR="/Users/nicholas/clawd/meok-attestation-api"
PUBLIC_DIR="$ATTEST_API_DIR/public/openmoe"

if [[ ! -d "$PUBLIC_DIR" ]]; then
    echo "[deploy] public/openmoe/ not found at $PUBLIC_DIR"
    exit 1
fi

echo "[deploy] Files staged in $PUBLIC_DIR:"
ls -la "$PUBLIC_DIR" | tail -n +2

if [[ "$DRY_RUN" == "true" ]]; then
    echo "[deploy] DRY-RUN — would invoke: vercel deploy --prebuilt --prod --token \$VERCEL_TOKEN"
    exit 0
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
    echo "[deploy] VERCEL_TOKEN not set — falling back to 'vercel deploy' interactive (manual)"
    cd "$ATTEST_API_DIR"
    vercel --prod
    exit 0
fi

cd "$ATTEST_API_DIR"
echo "[deploy] Triggering vercel deploy --prod with token"
vercel deploy --prod --yes --token "$VERCEL_TOKEN"
echo "[deploy] OK — proofof.ai/openmoe/ should be live in ~30s"
