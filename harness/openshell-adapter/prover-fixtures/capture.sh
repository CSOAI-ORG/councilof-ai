#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Re-run the published OpenShell prover (v0.1.2 release binary, checksum-verified) over the fixtures.
# PROVER=path/to/openshell-prover sh prover-fixtures/capture.sh   (run from harness/openshell-adapter)
set -u
P=${PROVER:?set PROVER to the openshell-prover binary}
run() { name=$1; cand=$2; bound=$3
  "$P" check "$cand" --boundary "$bound" --output json > "prover-fixtures/runs/$name.prover.json"
  echo "$name exit=$?"; }
mkdir -p prover-fixtures/runs
run must-fail-deny-declared-egress fixtures/must-fail-deny-declared-egress/policy.yaml prover-fixtures/boundary-pkg-index.yaml
run control-deny-held fixtures/control-deny-held/policy.yaml prover-fixtures/boundary-pkg-index.yaml
run must-fail-file-syscall fixtures/must-fail-file-syscall/policy.yaml prover-fixtures/boundary-pkg-index.yaml
run candidate-exceeds prover-fixtures/candidate-exceeds.yaml prover-fixtures/boundary-pkg-index.yaml
run capture-2026-09-28 capture-2026-09-28/policy.yaml prover-fixtures/boundary-capture.yaml
"$P" --version > prover-fixtures/runs/prover-version.txt
