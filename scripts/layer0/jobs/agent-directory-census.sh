#!/usr/bin/env bash
# STAGED (not installed). Weekly Mon 07:00Z on the build pod. Read-only; 31 paced requests (~22 MB).
# Output stays in $L0_STATE: it names a third-party catalogue, so publication is HELD for the owner's
# per-company OK. BIND_SAMPLE (default 20) OASF exports are fetched for the content-binding sample.
. "$(dirname "$0")/_common.sh"
l0_floor
l0_canon scripts/census
cd "$L0_CANON"
out="$L0_STATE/agent-directory/$L0_DAY"
mkdir -p "$out"
set +e
nice -n 10 python3 scripts/census/agent_directory_census.py --base "${AGENT_DIRECTORY_BASE:-https://ai-catalog.outshift.io}" \
  --out-dir "$out" --bind-sample "${BIND_SAMPLE:-20}"
rc=$?
set -e
echo "rc=$rc (3 = PARTIAL read: the census says so and is not a population)"
exit $rc
