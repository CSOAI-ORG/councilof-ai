#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Build -> assert Functions are actually in the bundle -> deploy -> assert the live contract.
#
# Two separate deploys on 2026-08-04 shipped WITHOUT Pages Functions, so every /api/* route
# served the SPA as text/html. Both reported "Deployment complete" and looked successful. The
# only difference in the output was a missing "Uploading Functions bundle" line, which is far
# too easy to miss — so this refuses to deploy a bundle that has no functions, and refuses to
# call a deploy good until the live evidence contract passes.
set -euo pipefail

npm run build:client

COUNT=$(find dist/client/functions -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "${COUNT}" -lt 10 ]; then
  echo "deploy-verified: REFUSING — only ${COUNT} files in dist/client/functions (expected >=10)." >&2
  echo "  The API would deploy as static HTML and every /api/* route would silently break." >&2
  exit 1
fi
echo "deploy-verified: ${COUNT} function files staged"

npx wrangler pages deploy dist/client \
  --project-name=csoai-site --branch=main --commit-dirty=true | tee /tmp/deploy.log

grep -q "Uploading Functions bundle" /tmp/deploy.log || {
  echo "deploy-verified: REFUSING to pass — wrangler did not report a Functions bundle." >&2
  exit 1
}

echo "deploy-verified: waiting for propagation…"
sleep 20
node scripts/smoke-evidence.mjs https://csoai.org
echo "deploy-verified: live evidence contract PASSED"
