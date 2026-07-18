#!/usr/bin/env bash
# Publish the remaining 4 haulage MCPs to PyPI with throttling to avoid 429.
# Uses ~/.pypirc credentials directly via twine.

set -euo pipefail

REMAINING=(
  "meok-fors-clocs-mcp"
  "meok-allmi-hiab-mcp"
  "meok-dvsa-olicence-mcp"
  "meok-cpa-contract-lift-mcp"
)
ROOT="/Users/nicholas/clawd/mcp-marketplace"

# Throttle delay between uploads (seconds)
DELAY=180  # 3 minutes between each — well under PyPI's burst threshold

# Ensure twine is current
python3.11 -m pip install --quiet --upgrade twine build 2>&1 | tail -2

# Pull token from ~/.pypirc
PYPI_TOKEN=$(python3.11 -c "
import configparser, os
c = configparser.ConfigParser()
c.read(os.path.expanduser('~/.pypirc'))
for s in ['pypi', 'default']:
    if s in c.sections():
        for k in ['password', 'token']:
            if k in c[s]:
                print(c[s][k])
                break
        break
" 2>&1)

if [[ ! "$PYPI_TOKEN" == pypi-* ]]; then
  echo "✗ Could not extract token from ~/.pypirc"
  exit 1
fi

i=0
N=${#REMAINING[@]}
for MCP in "${REMAINING[@]}"; do
  i=$((i+1))
  DIR="$ROOT/$MCP"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "📦 [$i/$N] $MCP"
  echo "═══════════════════════════════════════════════════════"
  cd "$DIR"

  # Check if already live (race condition / retry safe)
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "→ already LIVE on PyPI, skipping"
    continue
  fi

  # Build fresh (covers any post-build edits)
  rm -rf dist build *.egg-info
  python3.11 -m build --wheel --sdist --outdir dist/ 2>&1 | tail -3

  # Upload
  echo "→ uploading"
  TWINE_USERNAME="__token__" TWINE_PASSWORD="$PYPI_TOKEN" \
    python3.11 -m twine upload --non-interactive dist/* 2>&1 | tail -8

  echo "✓ uploaded $MCP"

  # Throttle (skip on last item)
  if [ $i -lt $N ]; then
    echo "→ waiting ${DELAY}s before next upload (rate-limit avoidance)"
    sleep $DELAY
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Verify (give PyPI 30s to propagate):"
sleep 30
for MCP in "${REMAINING[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://pypi.org/pypi/$MCP/json")
  if [ "$CODE" = "200" ]; then
    echo "  ✅ LIVE  https://pypi.org/project/$MCP/"
  else
    echo "  ✗ NOT YET ($CODE)  $MCP"
  fi
done
echo "═══════════════════════════════════════════════════════"
