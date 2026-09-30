#!/bin/bash
# Bundle the edge core (functions/_lib/route) for the pod service. Run from anywhere inside a councilof-ai
# checkout that has node_modules (esbuild comes with vite). Output: services/gspc-router/dist/route-core.mjs.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
"$ROOT/node_modules/.bin/esbuild" "$HERE/core.ts" --bundle --format=esm --platform=node --target=node20 \
  --outfile="$HERE/dist/route-core.mjs" --log-level=warning
sha256sum "$HERE/dist/route-core.mjs"
