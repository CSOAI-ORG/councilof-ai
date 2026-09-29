#!/usr/bin/env bash
# STAGED (not installed). Daily 05:40Z on the build pod, after root-daily.
# Does every Layer 0 record verify against did:web:csoai.org; do its OTS proofs commit to its bytes;
# are the served bytes the canon bytes. Exit 1 on an INVALID signature or an OTS digest mismatch.
. "$(dirname "$0")/_common.sh"
l0_floor
l0_canon public/interop scripts
cd "$L0_CANON"
set +e
python3 scripts/layer0/verify_layer0_records.py --live --out "$L0_STATE/verify-records-$L0_DAY.json"
rc=$?
set -e
ln -sf "verify-records-$L0_DAY.json" "$L0_STATE/verify-records-latest.json"
echo "canon=$L0_SHA rc=$rc"
exit $rc
