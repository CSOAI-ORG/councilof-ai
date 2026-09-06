#!/bin/bash
# 04:00Z daily: GET https://councilof.ai/api/revenue -> append one row to out/revenue-history.jsonl
# (one row per UTC date; a second run the same day is a no-op) -> csoai/revenue-history on the Hub
# (created on first upload; README carries the one_number definition VERBATIM from the endpoint).
# The site's /interop/revenue-history.json is pulled FROM that Hub file by scripts/interop/pull-revenue-history.py.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp revenue-snapshot || exit 0
D=$(today); F=$OUT/revenue-history.jsonl; README=$OUT/revenue-history.README.md
if [ -f "$F" ] && grep -q "\"date\": \"$D\"" "$F"; then log revenue-snapshot "already have a row for $D"; exit 0; fi
code=$(curl -s -m 30 -A csoai-pod-revenue-snapshot/0.1 -o /tmp/revenue.json -w '%{http_code}' https://councilof.ai/api/revenue)
line=$(python3 - "$D" "$code" "$F" "$README" <<'PY'
import json, sys, time
date, code, out, readme = sys.argv[1:5]
try:
    d = json.load(open("/tmp/revenue.json")); on = d["one_number"]
except Exception as e:
    print(f"FAILED http={code} unreadable {type(e).__name__}; nothing appended"); sys.exit(1)
row = {"date": date, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "http": int(code),
       "schema": d.get("schema"), "one_number": on, "settled_usdc": d.get("settled_usdc"),
       "skus": {k: {kk: vv for kk, vv in v.items() if kk in ("sku", "status", "count", "value")} for k, v in (d.get("skus") or {}).items()},
       "provisioning": d.get("provisioning"), "source": "https://councilof.ai/api/revenue"}
with open(out, "a") as fh: fh.write(json.dumps(row) + "\n")
definition = on.get("definition", "")
open(readme, "w").write(f"""---
license: cc-by-4.0
tags:
- council-of-ai
- measurement
- transparency
- x402
- revenue
pretty_name: revenue-history
configs:
- config_name: default
  data_files:
  - split: train
    path: revenue-history.jsonl
---

# revenue-history

One row per UTC day, read from `GET https://councilof.ai/api/revenue` by a loop on the RunPod pod
(`scripts/pod-loops/revenue-snapshot.sh` in CSOAI-ORG/councilof-ai). Nothing typed by hand; every field is
the endpoint's own. `null` means no source, never 0.

## `one_number` — definition, verbatim from the endpoint

> {definition}

`one_number.all_time` / `last_30d` are that count; `settlements`, `self_settlements`, `zero_value_settlements`
and `records_unreadable` are reported beside it so a reader can see what was excluded and why.

Measurement, not certification. Council of AI (CSOAI Ltd, UK 16939677). Aggregate-only, no per-user data.
""")
print(f"APPENDED date={date} http={code} one_number.all_time={on.get('all_time')} last_30d={on.get('last_30d')} settlements={on.get('settlements')} self={on.get('self_settlements')} zero_value={on.get('zero_value_settlements')} status={on.get('status')} settled_usdc={(d.get('settled_usdc') or {}).get('value')}")
PY
)
rc=$?; log revenue-snapshot "$line"; [ $rc = 0 ] || exit $rc
log revenue-snapshot "$(python3 "$LOOPS/hf_upload.py" --repo csoai/revenue-history --create --file "$F" --path-in-repo revenue-history.jsonl --readme-if-absent "$README" 2>&1 | tail -1)"
