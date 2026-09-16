#!/bin/bash
# ots.sh — pod chain slot :45 hourly. Pending OTS receipts → Bitcoin attestations, in place.
#
#   inputs   every *.ots under <repo>/public/
#   step     OTS_NO_GIT=1 scripts/ots-upgrade-loop.sh   (walks every proof, upgrades additively,
#            re-audits coverage and refuses on a mismatch; with OTS_NO_GIT=1 it never commits or
#            pushes — the pod's outputs reach a branch by their own step, never master from a loop)
#   outputs  the .ots files whose bytes changed (an upgrade attaches a block attestation)
#   proof    the loop's own line in its log: "walked N proofs; covers=…"; a refusal is exit 1
#   log      $LOGS/chain.log  one line: <utc> ots <proofs_seen> <upgraded> <sha256 of changed files> <cmd>
#
# "Anchored" is never said here: an upgraded proof carries a block height this loop has not
# validated against a Bitcoin node (ots_stamp.attestation_state chain_verified=False).
# DRY_RUN=1 walks nothing.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
chain_slot ots "${1:-}" || exit 0
R=$(chain_repo)
PUB=$R/public
CMD="OTS_NO_GIT=1 ots-upgrade-loop.sh"

seen=$(find "$PUB" -name '*.ots' 2>/dev/null | wc -l | tr -d ' ')
if chain_dry; then
  chain_log "ots[dry]" "$seen" 0 - "$CMD (public=$PUB)"
  exit 0
fi

before=$(mktemp); after=$(mktemp)
python3 "$CHAIN_TOOLS" manifest "$PUB" --glob '*.ots' --recursive > "$before" || true
set +e
OTS_NO_GIT=1 bash "$R/scripts/ots-upgrade-loop.sh" > "$STATE/chain-ots.out" 2>&1; rc=$?
set -e
while read -r l; do log ots "$l"; done < "$STATE/chain-ots.out"
python3 "$CHAIN_TOOLS" manifest "$PUB" --glob '*.ots' --recursive > "$after" || true
read -r changed sha < <(python3 "$CHAIN_TOOLS" new "$before" "$after" | head -1)
rm -f "$before" "$after"
chain_log ots "$seen" "$changed" "$sha" "$CMD (rc=$rc)"
exit "$rc"
