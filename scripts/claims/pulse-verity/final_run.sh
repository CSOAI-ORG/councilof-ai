#!/usr/bin/env bash
# Final re-check of the Pulse Verity record. Read-only GETs against Pulse's public URLs; publishes and sends nothing.
#   bash scripts/claims/pulse-verity/final_run.sh        (from anywhere; paths resolve from this file)
# Writes public/claims/pulse-verity/evidence-<UTC date>/, runs verify_pulse.py, rebuilds
# public/claims/claimreg-pulse-verity-<UTC date>.json and its .md, and prints the line of times for the note to Pulse.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
cd "$ROOT/public/claims/pulse-verity"
E="evidence-$(date -u +%Y-%m-%d)"
mkdir -p "$E"; : > "$E/fetch_times.txt"
UA='CSOAI-verify/0.1'
f() { curl -sS -A "$UA" -D "$E/$1.headers" -o "$E/$1.json" -w '%{http_code} %{url_effective} %{remote_ip}' "$2" > "$E/$1.meta"
      echo "$1 $(date -u +%Y-%m-%dT%H:%M:%SZ) $(cat "$E/$1.meta")" >> "$E/fetch_times.txt"; }
f keyring https://thepulse.markets/.well-known/pulse-verity-keys.json
f pubkey  https://mcp.thepulse.markets/api/index/v1/pubkey
f sample_btc 'https://mcp.thepulse.markets/api/index/v1/sample?symbol=BTC'
f sample_eth 'https://mcp.thepulse.markets/api/index/v1/sample?symbol=ETH'
f sample_sol 'https://mcp.thepulse.markets/api/index/v1/sample?symbol=SOL'
python3 verify_pulse.py "$E" > /dev/null
python3 - "$E" <<'PY'
import json, sys
d = json.load(open(sys.argv[1] + '/verify_result.json'))
print('ALL_PASS', d['all_pass'], '| keyring kids', d['keyring_kids'], '| api match', d['keyring_matches_api'])
for s in d['samples']:
    print(s['symbol'], s['at'], 'v1', s['v1_valid'], 'v2', s['v2_valid_as_given'],
          'tamper_text_valid', s['tamper_v2_canonical_one_byte']['valid'], 'tamper_sig_valid', s['tamper_v2_signature_one_byte']['valid'],
          'line_check_caught', s['tamper_json_sources_detected_by_line_check'])
if not d['all_pass']:
    sys.exit('STOP: the re-check did not pass. Do not publish; tell Justin what changed.')
PY
python3 "$HERE/build_final.py" "$E"
T0=$(awk 'NR==1{print $2}' "$E/fetch_times.txt"); T1=$(awk 'END{print $2}' "$E/fetch_times.txt")
echo "NOTE-B LINE: The final re-check ran from $T0 to $T1. BTC, ETH and SOL v2 and v1 signatures verified under the key in your separately hosted key ring, and every tamper control came back INVALID."
python3 "$HERE/render_md.py" "$ROOT/public/claims/claimreg-pulse-verity-${E#evidence-}.json"
