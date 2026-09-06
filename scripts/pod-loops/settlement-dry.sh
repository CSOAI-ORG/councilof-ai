#!/bin/bash
# 03:30Z daily: settlement-census DRY rehearsal. Runs the repo's scripts/grants/x402-settlement-census.py
# exactly as the paid pass would, minus SETTLE=1 and minus any key: X402_PAYER_KEY is never on this pod.
# Census = today's local conformance snapshot if loop 2 produced one, else the script's Hub default.
# Output: out/x402-settlement-census/dry-<date>.jsonl (the script APPENDS, so the .done marker is what
# makes a day idempotent) -> csoai/x402-settlement-census as dated config dry-<date> (queued without token).
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp settlement-dry || exit 0
unset SETTLE X402_PAYER_KEY
D=$(today); O=$OUT/x402-settlement-census; mkdir -p "$O"
F=$O/dry-$D.jsonl
[ -f "$F.done" ] && { log settlement-dry "already done for $D"; exit 0; }
CENSUS=$OUT/x402-bazaar-conformance/snapshots/conformance-$D.jsonl
[ -s "$CENSUS" ] || CENSUS=""
log settlement-dry "START date=$D mode=DRY census=${CENSUS:-<script default, 2026-09-05 Hub snapshot>} max_hosts=${MAX_HOSTS:-100000}"
rm -f "$F.partial"; [ -f "$F" ] && mv "$F" "$F.partial-$(date -u +%H%M%S)"   # an interrupted earlier run today is kept, never appended to
cd "$REPO" && python3 scripts/grants/x402-settlement-census.py ${CENSUS:+--census "$CENSUS"} \
  --max-hosts "${MAX_HOSTS:-100000}" --out "$F" 2> "$LOGS/settlement-dry.run.log"
rc=$?
first=$(head -1 "$LOGS/settlement-dry.run.log"); last=$(tail -1 "$LOGS/settlement-dry.run.log")
n=$(wc -l < "$F" 2>/dev/null || echo 0)
log settlement-dry "RESULT rc=$rc rows=$n | $first | $last"
[ "$rc" = 0 ] && [ -z "${MAX_HOSTS:-}" ] || { [ -n "${MAX_HOSTS:-}" ] && log settlement-dry "smoke run: not uploaded"; exit $rc; }
echo "$(now)" > "$F.done"
log settlement-dry "$(python3 "$LOOPS/hf_upload.py" --repo csoai/x402-settlement-census --file "$F" --path-in-repo "dry/dry-$D.jsonl" --config-name "dry-$D" 2>&1 | tail -1)"
