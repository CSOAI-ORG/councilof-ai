#!/bin/bash
# Build + gates on the pod, from the pod bare repo. NO deploy in this script.
# WHY: GitHub Actions has been disabled on CSOAI-ORG since 15 Sep 2026 and the second account was
# suspended on 22 Sep. Nothing in the operating loop may depend on GitHub. The four-step pipeline
# (build -> prerender -> brand-gate + signed-json-guard + canary-leak-gate -> deploy) is plain Node and runs here.
# Deploy is a separate step that needs a Cloudflare credential on this box.
set -euo pipefail
# Build and deploy share the release lock, but each gets an isolated checkout; never force-reset an operator/shared tree.
exec 9>/workspace/ci/deploy.lock
flock -w 900 9 || { echo "deploy lock wait timed out"; exit 9; }
export PATH=/workspace/tools/node/bin:$PATH
resolve_bare_repo() {
  if [ -n "${CSOAI_BARE_REPO:-}" ]; then
    [ "$(git --git-dir="$CSOAI_BARE_REPO" rev-parse --is-bare-repository 2>/dev/null)" = "true" ] || {
      echo "configured CSOAI_BARE_REPO is not a usable bare repository: $CSOAI_BARE_REPO" >&2
      return 1
    }
    printf '%s\n' "$CSOAI_BARE_REPO"
    return 0
  fi
  local candidate
  for candidate in /workspace/git/councilof-ai.git /workspace/staging/mirror/councilof-ai.git; do
    if [ "$(git --git-dir="$candidate" rev-parse --is-bare-repository 2>/dev/null)" = "true" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  echo "no usable councilof-ai bare repository found; set CSOAI_BARE_REPO explicitly" >&2
  return 1
}
BARE=$(resolve_bare_repo) || exit 2; LOG=/workspace/ci/build-gates.log
REF=${1:-master}
echo "=== build-gates $(date -u +%FT%TZ) ref=$REF" | tee -a "$LOG"
COMMIT=$(git --git-dir="$BARE" rev-parse --verify "refs/heads/$REF^{commit}") || { echo "ref resolution failed: $REF" | tee -a "$LOG"; exit 2; }
CI=$(mktemp -d /workspace/ci/build-gates.XXXXXX)
cleanup() { rm -rf "$CI"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
git clone -q --shared --no-checkout "$BARE" "$CI" || { echo "isolated clone failed" | tee -a "$LOG"; exit 2; }
git -C "$CI" checkout -q --detach "$COMMIT" || { echo "isolated checkout failed" | tee -a "$LOG"; exit 2; }
echo "  at $(git -C "$CI" rev-parse --short HEAD) (isolated checkout)" | tee -a "$LOG"
cd "$CI"
t0=$(date +%s)
npm ci --no-audit --no-fund --loglevel=error >/workspace/ci/npm-ci.log 2>&1 && echo "  npm ci ok ($(( $(date +%s)-t0 ))s)" | tee -a $LOG || { echo "  npm ci FAILED (see npm-ci.log)" | tee -a $LOG; exit 3; }
t0=$(date +%s)
npm run build:client >/workspace/ci/build.log 2>&1 && echo "  build:client ok ($(( $(date +%s)-t0 ))s)" | tee -a $LOG || { echo "  build:client FAILED (see build.log)" | tee -a $LOG; tail -5 /workspace/ci/build.log | sed "s/^/    /"; exit 4; }
node scripts/brand-gate.mjs dist/client >/workspace/ci/brand-gate.log 2>&1 && echo "  brand-gate ok" | tee -a "$LOG" || { echo "  brand-gate FAILED" | tee -a "$LOG"; tail -3 /workspace/ci/brand-gate.log | sed "s/^/    /"; exit 6; }
node scripts/signed-json-guard.mjs dist/client >/workspace/ci/signed-json-guard.log 2>&1 && echo "  signed-json-guard ok" | tee -a "$LOG" || { echo "  signed-json-guard FAILED" | tee -a "$LOG"; tail -3 /workspace/ci/signed-json-guard.log | sed "s/^/    /"; exit 7; }
{ node scripts/canary-leak-gate.mjs --selftest && node scripts/canary-leak-gate.mjs dist/client public; } >/workspace/ci/canary-leak-gate.log 2>&1 && echo "  canary-leak-gate ok" | tee -a "$LOG" || { echo "  canary-leak-gate FAILED" | tee -a "$LOG"; tail -3 /workspace/ci/canary-leak-gate.log | sed "s/^/    /"; exit 15; }
echo "  dist/client: $(find dist/client -type f | wc -l) files, $(du -sh dist/client | cut -f1)" | tee -a $LOG
echo "=== done $(date -u +%FT%TZ)" | tee -a $LOG
