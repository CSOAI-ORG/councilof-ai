#!/usr/bin/env bash
# Build all hive service images. Run from the repo root: ./scripts/build-all.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SERVICES=(
  "services/patentmcp:patentmcp"
  "services/api-gateway:api-gateway"
  "services/worker:worker"
  "services/bft-council:bft-council"
  "services/verify-page:verify-page"
  "services/mcp-manifest:mcp-manifest"
  "services/drafting-fork:drafting-fork"
  "services/x402-router:x402-router"
  "services/openpatent-primitives:openpatent-primitives"
  "services/landing-site:landing-site"
)

for entry in "${SERVICES[@]}"; do
  context_dir="${entry%%:*}"
  name="${entry##*:}"
  if [ ! -f "${context_dir}/Dockerfile" ]; then
    echo "  (skipping $name — no Dockerfile)"
    continue
  fi
  echo ""
  echo "━━━ building $name ━━━"
  docker build -t "openpatent/${name}:1.0.0" -f "${context_dir}/Dockerfile" .
done

echo ""
echo "✓ all images built"
docker images | grep openpatent
