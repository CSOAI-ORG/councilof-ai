#!/usr/bin/env bash
set -euo pipefail

# Finalize Claim Maintenance after an authorized production deploy.
# This script never deploys. It proves the canonical apex first, then signals only
# the changed URLs. A 404 or semantic mismatch stops before IndexNow submission.

cd "$(dirname "$0")/.."

python3 scripts/claim_maintenance_public_readback.py --selftest
python3 scripts/claim_maintenance_public_readback.py
node scripts/indexnow-submit.mjs --changed --file scripts/claim-maintenance-indexnow.txt
python3 scripts/claim_maintenance_public_readback.py

echo "PASS claim-maintenance production finalize: live readback + targeted IndexNow"
