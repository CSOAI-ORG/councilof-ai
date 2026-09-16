#!/bin/bash
# land.sh — pod chain slot :15 hourly. Pod worker runs → verified → the signer's inbox.
#
#   inputs   $CHAIN_RUNS/<run_id>/card-unsigned.json  (runpod_gspc_worker.py output; default $LANES/runs)
#   step 1   scripts/verify_runpod_gspc_intake.py --run-dir … --quarantine-root $STATE/chain-quarantine
#            (offline: recomputes hashes, scores and pins; writes verified-<sha>/{candidate,verification,items})
#            once per run — a marker in $STATE/chain-land/ records verified / rejected, never retried blindly
#   step 2   chain_tools.py stage → newest verified run per cell, byte-identical copies
#   step 3   scripts/land_mill_cards.py --staged … --require-evidence
#            (admits a pod card only by its VERIFIED_QUARANTINE receipt + items digest + allowlist)
#   outputs  <repo>/public/interop/mill-cards-unsigned/unsigned-*.json  (+ receipts in mill-evidence/)
#   log      $LOGS/chain.log  one line: <utc> land <runs_seen> <cards_landed> <sha256 of new files> <cmd>
#
# Never signs. Never decides MEASURED. Never commits. DRY_RUN=1 prints and writes nothing.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
chain_slot land "${1:-}" || exit 0
R=$(chain_repo)
RUNS=${CHAIN_RUNS:-$LANES/runs}
ALLOWLIST=${CHAIN_BANK_ALLOWLIST:-$R/scripts/runpod_gspc_bank_allowlist.current.json}
Q=$STATE/chain-quarantine
MARK=$STATE/chain-land
INBOX=$R/public/interop/mill-cards-unsigned
CMD="verify_runpod_gspc_intake.py → chain_tools.py stage → land_mill_cards.py --staged --require-evidence"

seen=0; verified=0; rejected=0
for d in "$RUNS"/*/; do
  [ -f "$d/card-unsigned.json" ] || continue
  run=$(basename "$d"); seen=$((seen+1))
  [ -e "$MARK/$run.verified" ] && continue
  [ -e "$MARK/$run.rejected" ] && continue
  if chain_dry; then echo "DRY verify $run"; continue; fi
  mkdir -p "$MARK"
  set +e
  out=$(python3 "$R/scripts/verify_runpod_gspc_intake.py" --run-dir "$(cd "$d" && pwd)" \
        --bank-allowlist "$ALLOWLIST" --quarantine-root "$Q" 2>&1); rc=$?
  set -e
  if [ $rc -eq 0 ] || printf '%s' "$out" | grep -q "REJECT OUTPUT_EXISTS"; then
    printf '%s\n' "$out" > "$MARK/$run.verified"; verified=$((verified+1))
  else
    printf '%s\n' "$out" > "$MARK/$run.rejected"; rejected=$((rejected+1))
    log land "REJECT $run $(printf '%s' "$out" | head -1)"
  fi
done

if chain_dry; then
  chain_log "land[dry]" "$seen" 0 - "$CMD (runs=$RUNS quarantine=$Q inbox=$INBOX)"
  exit 0
fi

T=$(mktemp -d "$STATE/chain-stage.XXXXXX")
before=$(mktemp); after=$(mktemp)
python3 "$CHAIN_TOOLS" manifest "$INBOX" --glob 'unsigned-*.json' > "$before" || true
stage_report=$(python3 "$CHAIN_TOOLS" stage --quarantine "$Q" --stage "$T")
log land "stage $stage_report"
landed=0; land_rc=0
if [ -n "$(ls -A "$T" 2>/dev/null)" ]; then
  set +e
  python3 "$R/scripts/land_mill_cards.py" --staged "$T" --require-evidence \
    --inbox "$INBOX" --signed "$R/public/interop/mill-cards-signed" \
    --evidence "$R/public/interop/mill-evidence" \
    --bank-allowlist "$ALLOWLIST" > "$T/land.out" 2>&1; land_rc=$?
  set -e
  while read -r l; do log land "$l"; done < "$T/land.out"
  [ -f "$T/land-report.json" ] && cp "$T/land-report.json" "$OUT/chain-land-$(date -u +%Y%m%dT%H%M%SZ).json"
fi
python3 "$CHAIN_TOOLS" manifest "$INBOX" --glob 'unsigned-*.json' > "$after" || true
read -r landed sha < <(python3 "$CHAIN_TOOLS" new "$before" "$after" | head -1)
rm -rf "$T" "$before" "$after"
chain_log land "$seen" "$landed" "$sha" "$CMD (verified_now=$verified rejected_now=$rejected land_rc=$land_rc)"
exit "$land_rc"
