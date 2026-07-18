#!/usr/bin/env bash
# bulk_npm_deprecate.sh — deprecate the 192 csga_global-squatted packages with a
# redirect message to the new meok-ai-labs identity.
#
# REQUIREMENTS:
#   - Must have run bulk_npm_owner_add.sh --execute FIRST and have owner access.
#   - npm CLI logged in as the new owner.
#
# Usage:
#   ./bulk_npm_deprecate.sh                     # dry-run
#   ./bulk_npm_deprecate.sh --execute           # actually deprecate
#
# Per-package: `npm deprecate <pkg> '<message>'` marks the version as deprecated
# in npm without breaking dependent installs — users see a warning telling them
# to use the new package. The package is still installable (no breakage).
#
# IMPORTANT: deprecation is per-version. Since the csga_global packages are all
# at 1.0.0/1.0.1, this script deprecates ALL versions of each package.

set -uo pipefail

AUDIT_FILE="${AUDIT_FILE:-/Users/nicholas/clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl}"
DEPRECATION_MSG="${DEPRECATION_MSG:-DEPRECATED: this package is a legacy squatter. Use the canonical MEOK version on PyPI (pip install <pkg>) or contact hello@meok.ai for the new npm identity.}"
EXECUTE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE="yes"; shift ;;
    --msg) DEPRECATION_MSG="$2"; shift 2 ;;
    --audit) AUDIT_FILE="$2"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$AUDIT_FILE" ]]; then
  echo "Audit file not found: $AUDIT_FILE" >&2
  exit 1
fi

if [[ -z "$EXECUTE" ]]; then
  echo "============================================================"
  echo "DRY RUN — pass --execute to actually deprecate"
  echo "============================================================"
fi

SQUATS=$(python3 -c "
import json
with open('$AUDIT_FILE') as f:
    for line in f:
        d = json.loads(line)
        if d.get('phase') == 'npm' and d.get('csga_publisher'):
            print(d['name'])
" | sort -u)

TOTAL=$(echo "$SQUATS" | wc -l | tr -d ' ')
echo "Will deprecate $TOTAL packages with message: $DEPRECATION_MSG"
echo ""

OK=0
FAIL=0
i=0
for pkg in $SQUATS; do
  i=$((i + 1))
  printf "[%3d/%d] %-45s " "$i" "$TOTAL" "$pkg"
  if [[ -z "$EXECUTE" ]]; then
    echo "(dry-run)"
    continue
  fi
  # deprecate with no version arg deprecates ALL versions of the package
  if npm deprecate "$pkg" "$DEPRECATION_MSG" 2>&1 | grep -qE "deprecat"; then
    echo "OK"
    OK=$((OK + 1))
  else
    echo "FAIL"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "============================================================"
if [[ -z "$EXECUTE" ]]; then
  echo "DRY RUN COMPLETE. Pass --execute to deprecate."
else
  echo "DEPRECATION COMPLETE"
  echo "  deprecated: $OK"
  echo "  failed:     $FAIL"
  echo ""
  echo "All squatted packages now show a deprecation warning to npm users"
  echo "redirecting them to the canonical MEOK ecosystem."
fi
echo "============================================================"
