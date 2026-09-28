#!/usr/bin/env bash
# STAGED (not installed). Daily 13:10Z on the build pod, after the Oracle flywheel OTS pass.
# Finds the repository's own public .ots proofs that are still pending, asks the calendars for the
# upgrade (scripts/ots-upgrade.py never rewrites a file that did not improve), checks every new Bitcoin
# attestation against two explorers, and - only if all check - commits them on branch
# lane/ots-upgrade-<day> for the integrator. PUSH=1 pushes that branch to the staging mirror; default
# is a bundle in $L0_STATE. Never master.
. "$(dirname "$0")/_common.sh"
l0_floor
l0_canon public/interop public/measurement-capsules public/claims public/measurements scripts
cd "$L0_CANON"
mapfile -t pending < <(python3 - <<'PY'
import io, pathlib
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
from opentimestamps.core.serialize import StreamDeserializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile
def atts(t):
    yield from t.attestations
    for _o, s in t.ops.items(): yield from atts(s)
for p in sorted(pathlib.Path("public").rglob("*.ots")):
    try:
        d = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(p.read_bytes())))
    except Exception:
        continue
    if not any(isinstance(a, BitcoinBlockHeaderAttestation) for a in atts(d.timestamp)):
        print(p)
PY
)
echo "pending proofs: ${#pending[@]}"
[ "${#pending[@]}" -eq 0 ] && { echo "NO_CHANGE"; exit 0; }
set +e; python3 scripts/ots-upgrade.py "${pending[@]}"; set -e
changed=$(git status --porcelain -- public | awk '{print $2}')
[ -z "$changed" ] && { echo "NO_CHANGE (calendars have not committed yet)"; exit 0; }
mkdir -p "$L0_CANON/.bc"; for f in $changed; do cp "$f" "$L0_CANON/.bc/"; done
python3 scripts/ots_block_check.py --dir "$L0_CANON/.bc" --out "$L0_STATE/ots-upgrade-check-$L0_DAY.json"
python3 - "$L0_STATE/ots-upgrade-check-$L0_DAY.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
bad = {k: v for k, v in d.get("files", {}).items() if k != "MATCHES_BLOCK_HEADER"}
sys.exit(1 if bad else 0)
PY
BR="lane/ots-upgrade-$(date -u +%Y%m%d)"
git checkout -q -b "$BR"
git add -- $changed
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "ots: upgrade $(echo "$changed" | wc -l) pending proof(s) to Bitcoin attestations, block headers checked on two explorers"
if [ "${PUSH:-0}" = 1 ]; then git push -q origin "$BR"; echo "pushed $BR"; else B="$L0_STATE/${BR//\//-}.bundle"; git bundle create "$B" "$BR" >/dev/null; echo "bundle $B"; fi
