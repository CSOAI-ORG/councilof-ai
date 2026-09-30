#!/bin/bash
# Smoke: route 5 sample tasks through agentgateway (127.0.0.1:3900) against the local Ollama candidates,
# validate each record with packages/evidence-fabric/verify.py --structure, and check the execution paths
# answer 501. Prints "SMOKE n/5 records STRUCTURE_VALID". Exit 0 only for 5/5 and both 501s.
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
OUT=${1:-/workspace/lanes/gspc-route-20260930/smoke-$(date -u +%Y%m%dT%H%MZ)}; mkdir -p "$OUT"
GW=http://127.0.0.1:3900
tasks=(
 '{"task":"Summarise a public policy paragraph in two sentences.","objective":{"quality_axis":"governance"}}'
 '{"task":"Label the provenance statement in this caption.","objective":{"quality_axis":"provenance","tie_break":["cheapest_declared","lexical_id"]}}'
 '{"task":"Translate a public notice.","policy":{"presets":["local-only","read-only"]}}'
 '{"task":"Classify this internal memo.","data_class":"internal","objective":{"quality_axis":"safety"}}'
 '{"task":"Draft a reply.","policy":{"presets":["eu-only"]},"objective":{"quality_axis":"machinery-conformity","tie_break":"lexical_id"}}'
)
ok=0
for i in "${!tasks[@]}"; do
  n=$((i+1))
  curl -s -X POST "$GW/route" -H 'content-type: application/json' -d "${tasks[$i]}" > "$OUT/route-$n.json"
  python3 -c "import json,sys; d=json.load(open(sys.argv[1])); json.dump(d['record'],open(sys.argv[2],'w'),indent=1); print(sys.argv[3], d['state'], (d.get('chosen') or {}).get('id'), (d.get('chosen') or {}).get('choice_basis'), d['separation'], '|', d['summary'])" \
    "$OUT/route-$n.json" "$OUT/record-$n.json" "$n" || { echo "$n NO RECORD: $(head -c 300 "$OUT/route-$n.json")"; continue; }
  if python3 "$ROOT/packages/evidence-fabric/verify.py" --structure "$OUT/record-$n.json" > "$OUT/verify-$n.json"; then ok=$((ok+1)); else cat "$OUT/verify-$n.json"; fi
done
c1=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$GW/v1/chat/completions" -H 'content-type: application/json' -d '{"model":"gspc/route","messages":[]}')
c2=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$GW/route_execute" -d '{}')
echo "SMOKE $ok/5 records STRUCTURE_VALID; /v1/chat/completions -> $c1; /route_execute -> $c2; out $OUT"
[ "$ok" = 5 ] && [ "$c1" = 501 ] && [ "$c2" = 501 ]
