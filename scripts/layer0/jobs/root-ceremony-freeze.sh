#!/usr/bin/env bash
# STAGED (not installed). On demand before a constitutional root ceremony (Phase 2, clean freeze).
# The staging mirror is the canon and is bare, so its master is by construction a clean commit.
# Records that commit and the manifest of lane branches NOT merged into it (outside the ceremony).
. "$(dirname "$0")/_common.sh"
sha=$(git -C "$L0_MIRROR" rev-parse master)
out="$L0_STATE/root-ceremony-freeze-$L0_DAY.json"
git -C "$L0_MIRROR" for-each-ref --format='%(refname:short) %(objectname)' 'refs/heads/lane/*' | while read -r br obj; do
  if git -C "$L0_MIRROR" merge-base --is-ancestor "$obj" "$sha"; then echo "IN $br $obj"; else echo "OUT $br $obj"; fi
done > "$L0_STATE/.freeze-lanes"
python3 - "$sha" "$L0_STATE/.freeze-lanes" "$out" "$L0_MIRROR" <<'PY'
import json, sys, datetime
sha, lanes, out, mirror = sys.argv[1:5]
rows = [l.split() for l in open(lanes) if l.strip()]
rec = {"schema": "csoai.layer0-root-freeze/0.1",
       "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
       "canon": {"mirror": mirror, "branch": "master", "commit": sha, "dirty_files": 0,
                 "why_zero": "a bare mirror has no working tree"},
       "lanes_included": sorted(r[1] for r in rows if r[0] == "IN"),
       "lanes_outside_ceremony": [{"branch": r[1], "head": r[2]} for r in rows if r[0] == "OUT"],
       "signs_nothing": True}
open(out, "w").write(json.dumps(rec, indent=1) + "\n")
print(json.dumps({"commit": sha, "outside": len(rec["lanes_outside_ceremony"])}))
PY
