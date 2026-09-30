#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Validate every committed generated policy with the cedar CLI and run the round trip on each fixture.
# CEDAR=/path/to/cedar PY=python3 sh validate_all.sh      (run from harness/openshell-cedar)
set -u
C=${CEDAR:?set CEDAR to the cedar binary}; PY=${PY:-python3}
LOG=out/cedar-validate.log
{ echo "# $($C --version)"; echo "# $(date -u +%Y-%m-%dT%H:%M:%SZ)"; } > $LOG
fail=0
for f in out/*.cedar; do
  if $C validate --schema out/openshell.cedarschema --policies "$f" --deny-warnings >/dev/null 2>&1; then
    echo "VALID $f" >> $LOG
  else
    echo "INVALID $f" >> $LOG; fail=1
  fi
done
$PY - <<'PY' > out/roundtrip-summary.json || fail=1
import json, os, sys, tempfile
sys.path.insert(0, ".")
import roundtrip as R, translate as T, test_translate as X
out, bad = {"cedar": os.popen(os.environ["CEDAR"] + " --version").read().strip(), "policies": {}}, 0
for name, path in X.POLICIES.items():
    with tempfile.TemporaryDirectory() as d:
        r = R.run(T.load(path), os.environ["CEDAR"], d)
    out["policies"][name] = {"policy_sha256": T.A.sha256_file(path), "cedar_validate": r["validate_ok"],
                             "translation_status": r["report"]["status"], "requests": r["requests"], "counts": r["counts"]}
    bad += (not r["validate_ok"]) + r["counts"].get("OVER_ALLOW", 0) + r["counts"].get("UNDER_ALLOW", 0)
out["result"] = "no OVER_ALLOW, no UNDER_ALLOW, every policy validates" if not bad else f"{bad} problems"
print(json.dumps(out, indent=1))
sys.exit(1 if bad else 0)
PY
cat $LOG
exit $fail
