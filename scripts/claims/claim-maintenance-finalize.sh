#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

python3 scripts/claims/claim_maintenance_priority.py --check
python3 scripts/claims/claim_maintenance_reaction.py --check
node scripts/claims/claim-events-rederive.mjs --dir public/claims/events/v0.1
python3 scripts/claims/claim_maintenance_public_readback.py "$@"

echo "PASS claim-maintenance finalize: local proofs + signed-feed rederive + public readback"
