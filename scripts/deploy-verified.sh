#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Retired as a production deployer.
#
# This script used to `wrangler pages deploy dist/client --project-name=csoai-site
# --branch=main`. That promotes the SPA over the static apex and overwrites
# did:web:csoai.org. csoai-site production is owned by
# .github/workflows/csoai-site-deploy.yml (source: csoai-static-deploy2).
# SPA production is deploy.yml → Pages project councilof-ai → councilof.ai.
#
# Fail closed. Do not retarget this file to another project from muscle memory.
set -euo pipefail

echo "deploy-verified: REFUSING — this script deployed the SPA onto csoai-site --branch=main." >&2
echo "  That overwrites did:web:csoai.org. Official apex deploy: Actions → csoai-site deploy." >&2
echo "  Official SPA deploy: workflow deploy.yml → project councilof-ai → councilof.ai." >&2
exit 1
