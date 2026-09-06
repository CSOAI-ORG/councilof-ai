#!/bin/bash
# 03:00Z daily: x402 Bazaar conformance census (third-party hosts, never ours) -> snapshot + summary + diff
# -> csoai/x402-bazaar-conformance on the Hub (queued if the pod has no token). Idempotent per UTC date.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp bazaar-conformance || exit 0
D=$(today); O=$OUT/x402-bazaar-conformance; mkdir -p "$O"
PRODUCER=$REPO/scripts/census/x402-bazaar-conformance.py
[ -f "$PRODUCER" ] || PRODUCER=$LOOPS/x402-bazaar-conformance.py   # until the PR lands, the copy shipped with the loops
log bazaar-conformance "START date=$D producer=$PRODUCER"
python3 "$PRODUCER" --out-dir "$O" --date "$D" ${MAX_HOSTS:+--max-hosts $MAX_HOSTS} 2>> "$LOGS/bazaar-conformance.run.log"
rc=$?
[ -f "$O/summary-$D.json" ] || { log bazaar-conformance "FAILED rc=$rc no summary; see logs/bazaar-conformance.run.log"; exit 1; }
log bazaar-conformance "RESULT rc=$rc $(python3 -c "
import json,sys; s=json.load(open('$O/summary-$D.json')); d=json.load(open('$O/diff-$D.json')); h=s['headline']
print(f\"hosts={s['hosts_probed']} partial={s['partial']} conformant={h['conformant']} ({h['conformant_pct']}%) unreachable={h['unreachable']} cdp_complete={s['indexes']['cdp']['complete']} payai_complete={s['indexes']['payai']['complete']} added={d.get('hosts_added')} dropped={d.get('hosts_dropped')} newly_conformant={d.get('newly_conformant')} lost={d.get('lost_conformance')} price_drift={d.get('price_drift')} elapsed={s['elapsed_s']}s\")")"
if [ "${MAX_HOSTS:-}" != "" ]; then log bazaar-conformance "smoke run (MAX_HOSTS=$MAX_HOSTS): not uploaded"; exit 0; fi
for f in "snapshots/conformance-$D.jsonl" "summary-$D.json" "diff-$D.json"; do
  log bazaar-conformance "$(python3 "$LOOPS/hf_upload.py" --repo csoai/x402-bazaar-conformance --file "$O/$f" --path-in-repo "$f" 2>&1 | tail -1)"
done
