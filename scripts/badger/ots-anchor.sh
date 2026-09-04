#!/bin/bash
# ots-anchor.sh — the daily OTS job. Stamp what is new, UPGRADE what is pending.
#
# WHY THIS FILE EXISTS. com.csoai.ots-anchor.plist has been installed and firing
# at 07:00 since it was written, pointed at this path — which did not exist. The
# job failed before it could even open its log, so there was no log to notice.
# Meanwhile 243 .ots files sat pending and the estate described them as anchored.
#
# A stamp is not an anchor. A calendar accepts a digest instantly and commits it
# to a Bitcoin block hours later; the proof must then be fetched back (UPGRADED)
# or the file stays pending forever even though the Bitcoin proof exists. Step 2
# is the one that was missing, and it is the whole point of this job.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 1
mkdir -p scripts/badger/_logs

echo "=== ots-anchor $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# 1. Compute the default-deny atom-root candidate only. Automatic root stamping
#     is retired: source admission, publication, and OTS submission are a reviewed
#     ceremony. A recurring job must never turn a newly harvested queue into a
#     public evidence claim without that review.
if [ -f scripts/badger/atom-root.py ]; then
  python3 scripts/badger/atom-root.py --dry-run || echo "  atom-root dry-run returned $?"
fi

# 2. Upgrade every already-reviewed mutable proof we hold. Incident evidence is immutable: the
#    inventory walker prunes evidence/incidents before descent, rather than
#    discovering it and filtering it afterward. ots-upgrade.py exits 1 when
#    nothing improved, which is NOT an error: the calendars simply have not
#    committed yet. Never let that fail the job.
python3 scripts/badger/ots_proof_inventory.py --null \
  | xargs -0 -r python3 scripts/ots-upgrade.py || true

# 3. Report the MEASURED state. The number in any public sentence comes from here,
#    never from a count of stamps requested.
python3 - <<'PY'
import pathlib, sys, collections
sys.path.insert(0, "scripts/badger")
from ots_stamp import attestation_state
from ots_proof_inventory import proof_paths
c = collections.Counter()
for p in proof_paths(pathlib.Path(".")):
    c[attestation_state(p.read_bytes())["state"]] += 1
print(f"  ANCHORED (Bitcoin block) : {c['bitcoin']}")
print(f"  pending (not a proof)    : {c['pending']}")
print(f"  unreadable (not a stamp) : {c['unreadable']}")
print("  Only the first number may be described as anchored.")

# The atom root is the one that matters: it covers the whole queue.
roots = sorted(pathlib.Path("public/interop").glob("atom-root-*.json.ots"))
if roots:
    import json as _j
    latest = roots[-1]
    st = attestation_state(latest.read_bytes())
    body = _j.loads(pathlib.Path(str(latest)[:-4]).read_text())
    n = body.get("n_leaves", "?")
    if st["state"] == "bitcoin":
        print(f"  ATOM ROOT: {n} atoms ANCHORED via block {st['block_height']}")
    else:
        print(f"  ATOM ROOT: {n} atoms covered by a {st['state']} stamp - NOT yet anchored")
else:
    print("  ATOM ROOT: none built")
PY

echo "=== ots-anchor done $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
