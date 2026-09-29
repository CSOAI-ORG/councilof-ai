#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Stage the sources into src/ and build sdist + wheel.  PY=python3 sh build.sh   (run from this directory)
set -eu
PY=${PY:-python3}
rm -rf src dist build
P=src/csoai_openshell_harness
mkdir -p $P
cp ../../openshell-adapter/adapter.py ../../openshell-adapter/declared_observed.py $P/
cp ../translate.py ../roundtrip.py ../ocsf_observer.py $P/
cp ../../../public/spec/signed-receipts/v1/interceptor.py $P/interceptor.py
for f in $P/declared_observed.py $P/translate.py $P/roundtrip.py $P/ocsf_observer.py; do
  sed -i 's/^import adapter as A  # noqa: E402$/from csoai_openshell_harness import adapter as A  # noqa: E402/; s/^import translate as T  # noqa: E402$/from csoai_openshell_harness import translate as T  # noqa: E402/' $f
done
cat > $P/__init__.py <<'PY'
# SPDX-License-Identifier: Apache-2.0
"""csoai-openshell-harness: an independent open example (not affiliated with or endorsed by NVIDIA).

Compares an OpenShell sandbox policy with what an observer records, and translates the policy to Cedar.
Inconclusive is UNMEASURED; anything not understood is UNCHECKABLE and never an allow.
"""
__version__ = "0.1.0"
PY
cat > $P/NOTICE <<'PY'
csoai-openshell-harness, Copyright 2026 CSOAI Ltd. Apache-2.0.
interceptor.py is the signed-receipts/v1 reference implementation (Apache-2.0), copied unmodified from
public/spec/signed-receipts/v1/ of the councilof.ai repository.
OpenShell (github.com/NVIDIA/OpenShell) is Apache-2.0; no OpenShell source is included in this package.
PY
grep -q "csoai_openshell_harness import adapter" $P/translate.py
$PY -m build --sdist --wheel . >/dev/null
rm -rf build src/*.egg-info
ls dist
