#!/bin/bash
# Publish the CSOAI Layer-0 bridge family + scoreboard to PyPI.
# DISTRIBUTION is the lever (built >> published). This is one command from live.
# Owner: export PYPI_TOKEN=pypi-... then run. No token = DRY RUN (build only, no upload).
set -uo pipefail
ROOT=~/clawd/mcp-marketplace
BRIDGES="cobol iso20022 hl7-fhir as400 sap oracle scada edi fix cics mqtt acord nacha iso8583 sip tax gs1 mismo dlms"
EXTRA="model-scoreboard oscal-generator nist-iso42001-crosswalk ll144-bias-audit"
DRY=""
[ -z "${PYPI_TOKEN:-}" ] && DRY=1 && echo "DRY RUN — set PYPI_TOKEN to actually publish."
python3 -m pip install -q build twine >/dev/null 2>&1 || true
built=0; published=0; failed=""
for b in $BRIDGES $EXTRA; do
  d="$ROOT/${b}-bridge-mcp"; [ -d "$d" ] || d="$ROOT/${b}-mcp"
  [ -d "$d" ] || { failed="$failed $b(missing)"; continue; }
  cd "$d" || continue
  rm -rf dist build *.egg-info 2>/dev/null
  if python3 -m build >/dev/null 2>&1; then
    built=$((built+1)); echo "  built  $b"
    if [ -z "$DRY" ]; then
      if TWINE_USERNAME=__token__ TWINE_PASSWORD="$PYPI_TOKEN" python3 -m twine upload --skip-existing dist/* >/dev/null 2>&1; then
        published=$((published+1)); echo "  ✓ published $b"
      else
        failed="$failed $b(upload)"
      fi
    fi
  else
    failed="$failed $b(build)"
  fi
done
echo ""
echo "built: $built  published: $published  ${failed:+failed:$failed}"
[ -n "$DRY" ] && echo "→ DRY RUN done. Re-run with PYPI_TOKEN set to publish all."
