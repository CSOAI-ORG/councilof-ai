#!/bin/bash
# root.sh — pod chain slot :35 hourly. Signed cards → ONE Merkle commitment + OTS stamp.
#
#   inputs   <repo>/public/interop/mill-cards-signed/signed-*.json minus SUPERSEDED.jsonl
#   step     scripts/card_root.py --stamp   (create-only: an existing same-day root with the same
#            leaf set is preserved byte-for-byte; a different set gets a -<root12> suffixed file;
#            the .ots sidecar is a calendar receipt — PENDING, not anchored, until ots.sh upgrades it)
#   outputs  <repo>/public/interop/card-root-YYYY-MM-DD[-<root12>].json (+ .ots)
#   proof    python3 scripts/card_root.py --verify   (run here after the build; failure = exit 1)
#   log      $LOGS/chain.log  one line: <utc> root <signed_seen> <new_files> <sha256 of new files> <cmd>
#
# Determinism: the merkle_root is a function of the signed bytes only; as_of and the OTS bytes are
# not, and the log digest covers the files, so an unchanged leaf set logs 0 new files, not a new root.
# Never commits. DRY_RUN=1 builds nothing (card_root.py without --stamp is still a write; skipped).
set -euo pipefail
. "$(dirname "$0")/lib.sh"
chain_slot root "${1:-}" || exit 0
R=$(chain_repo)
SIGNED=$R/public/interop/mill-cards-signed
INTEROP=$R/public/interop
CMD="card_root.py --stamp && card_root.py --verify"

seen=$(ls "$SIGNED"/signed-*.json 2>/dev/null | wc -l | tr -d ' ')
if chain_dry; then
  chain_log "root[dry]" "$seen" 0 - "$CMD (signed=$SIGNED out=$INTEROP)"
  exit 0
fi
if [ "$seen" = 0 ]; then
  chain_log root 0 0 - "$CMD (no signed cards — a root must not imply a signature)"
  exit 0
fi

before=$(mktemp); after=$(mktemp)
python3 "$CHAIN_TOOLS" manifest "$INTEROP" --glob 'card-root-*' > "$before" || true
set +e
( cd "$R" && python3 scripts/card_root.py --stamp --signed-dir "$SIGNED" --out-dir "$INTEROP" ) > "$STATE/chain-root.out" 2>&1; rc=$?
if [ $rc -eq 0 ]; then
  ( cd "$R" && python3 scripts/card_root.py --verify --signed-dir "$SIGNED" --out-dir "$INTEROP" ) >> "$STATE/chain-root.out" 2>&1; rc=$?
  [ $rc -eq 0 ] || echo "VERIFY FAILED rc=$rc" >> "$STATE/chain-root.out"
fi
set -e
while read -r l; do log root "$l"; done < "$STATE/chain-root.out"
python3 "$CHAIN_TOOLS" manifest "$INTEROP" --glob 'card-root-*' > "$after" || true
read -r new sha < <(python3 "$CHAIN_TOOLS" new "$before" "$after" | head -1)
rm -f "$before" "$after"
chain_log root "$seen" "$new" "$sha" "$CMD (rc=$rc)"
exit "$rc"
