#!/bin/bash
# Build + gates on the pod, from the pod bare repo. NO deploy in this script.
# WHY: GitHub Actions has been disabled on CSOAI-ORG since 15 Sep 2026 and the second account was
# suspended on 22 Sep. Nothing in the operating loop may depend on GitHub. The four-step pipeline
# (build -> prerender -> brand-gate + signed-json-guard -> deploy) is plain Node and runs here.
# Deploy is a separate step that needs a Cloudflare credential on this box.
set -uo pipefail
# The production build shares this checkout; serialize it with deployment.
exec 9>/workspace/ci/deploy.lock
flock -w 900 9 || { echo "deploy lock wait timed out"; exit 9; }
export PATH=/workspace/tools/node/bin:$PATH
BARE=/workspace/git/councilof-ai.git; CI=/workspace/ci/councilof-ai; LOG=/workspace/ci/build-gates.log
REF=${1:-master}
echo "=== build-gates $(date -u +%FT%TZ) ref=$REF" | tee -a $LOG
[ -d $CI/.git ] || git clone -q $BARE $CI
git -C $CI fetch -q origin && git -C $CI checkout -q -f "origin/$REF" || { echo "checkout failed" | tee -a $LOG; exit 2; }
echo "  at $(git -C $CI rev-parse --short HEAD)" | tee -a $LOG
cd $CI
t0=$(date +%s)
npm ci --no-audit --no-fund --loglevel=error >/workspace/ci/npm-ci.log 2>&1 && echo "  npm ci ok ($(( $(date +%s)-t0 ))s)" | tee -a $LOG || { echo "  npm ci FAILED (see npm-ci.log)" | tee -a $LOG; exit 3; }
t0=$(date +%s)
npm run build:client >/workspace/ci/build.log 2>&1 && echo "  build:client ok ($(( $(date +%s)-t0 ))s)" | tee -a $LOG || { echo "  build:client FAILED (see build.log)" | tee -a $LOG; tail -5 /workspace/ci/build.log | sed "s/^/    /"; exit 4; }
node scripts/brand-gate.mjs dist/client >/workspace/ci/brand-gate.log 2>&1 && echo "  brand-gate ok" | tee -a $LOG || { echo "  brand-gate FAILED" | tee -a $LOG; tail -3 /workspace/ci/brand-gate.log | sed "s/^/    /"; }
node scripts/signed-json-guard.mjs dist/client >/workspace/ci/signed-json-guard.log 2>&1 && echo "  signed-json-guard ok" | tee -a $LOG || { echo "  signed-json-guard FAILED" | tee -a $LOG; tail -3 /workspace/ci/signed-json-guard.log | sed "s/^/    /"; }
echo "  dist/client: $(find dist/client -type f | wc -l) files, $(du -sh dist/client | cut -f1)" | tee -a $LOG
echo "=== done $(date -u +%FT%TZ)" | tee -a $LOG
