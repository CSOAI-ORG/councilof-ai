#!/usr/bin/env bash
# ci/hf-jobs/public-root.sh — .github/workflows/public-root.yml, run as a Hugging Face Job.
#
#   public-root.sh <source> [ref]
#     <source>  git URL of the repo (must be pushable: the job commits to master)
#     [ref]     default master — the workflow always checks out master
#
#   env   BOARD_SIGN_KEY_PKCS8_B64   job secret — publish_public_root.py exits 3 without it
#         GIT_PUSH_TOKEN             job secret — `git push origin HEAD:master`; fail closed without it
#         HF_TOKEN                   job secret (also exported as HUGGING_FACE_HUB_TOKEN, as the workflow does)
#         HUGGINGFACE_TOKEN, HF_INFERENCE_TOKEN, EAS_ATTESTER_PRIVATE_KEY, BASE_RPC_URL   optional, pass-through
#         DRY_RUN=1                  = workflow_dispatch dry_run=true: adapters + halts, no write, no push
#
# Mirrors public-root.yml step for step (names are asserted by steps-drift.test.mjs).
# One writer. Does NOT prerender. Never wrangler. Never prints the key. Never stamps MEASURED.
# There is no GitHub OIDC on HF, so the Pages /api/board-sign relay is unavailable here:
# the PKCS8 secret is the only signer path. That is the second key-custody location.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

SOURCE="${1:-$GITHUB_REPO_URL}"; REF="${2:-master}"
WORK="${WORK:-$(mktemp -d "${TMPDIR:-/tmp}/coai-root.XXXXXX")}"
REPO="$WORK/repo"
DRY_RUN="${DRY_RUN:-0}"
PYTHON="${PYTHON:-$(command -v python3.11 || command -v python3 || true)}"

echo "councilof-ai public-root via HF Jobs — source=$SOURCE ref=$REF dry_run=$DRY_RUN job=${JOB_ID:-local}"
echo "secrets (presence only):"
secret_state BOARD_SIGN_KEY_PKCS8_B64
secret_state GIT_PUSH_TOKEN
secret_state HF_TOKEN
secret_state EAS_ATTESTER_PRIVATE_KEY
require_secret GIT_PUSH_TOKEN        # a publish that cannot push is a wasted signature; fail before signing
for t in git node npm; do need_cmd "$t"; done
[ -n "$PYTHON" ] || die "no python found"
"$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' \
  || die "python >= 3.11 required (workflow pins 3.11); found $("$PYTHON" --version 2>&1)"
echo "python: $("$PYTHON" --version 2>&1) ($PYTHON)"

export PYTHONUNBUFFERED=1
export BOARD_SIGN_URL="${BOARD_SIGN_URL:-https://councilof.ai/api/board-sign}"
export HUGGING_FACE_HUB_TOKEN="${HF_TOKEN:-}"

prep "checkout master (actions/checkout@v4 ref: master)"
FALLBACK_SOURCE="" resolve_source "$SOURCE" "$REF" "$REPO"   # no mirror fallback: a stale snapshot must never be pushed
cd "$REPO"
prep "setup-python 3.11"

step 'deps'
# The image venv (/opt/py311, made by uv) has no pip; bootstrap.sh pre-installs both wheels.
"$PYTHON" -m pip install -q cryptography 2>/dev/null \
  || { command -v uv >/dev/null 2>&1 && uv pip install --python "$PYTHON" --quiet cryptography 2>/dev/null; } \
  || "$PYTHON" -c 'import cryptography' \
  || die "cryptography is not importable in $PYTHON"

git_commit_push() {   # <message> [paths…] — commit staged (+ given) paths, push to master via the credential helper
  local msg="$1"; shift
  git config user.name "csoai-public-root"
  git config user.email "board@csoai.org"
  [ "$#" -eq 0 ] || git add "$@"
  if git diff --cached --quiet; then return 10; fi
  git commit -q -m "$msg"
  git "${GIT_CRED[@]}" push origin HEAD:master
}

step 'publish public root'
PUBLISH_RC=0
if [ "$DRY_RUN" = "1" ]; then
  "$PYTHON" scripts/publish_public_root.py --dry-run || PUBLISH_RC=$?
else
  "$PYTHON" scripts/publish_public_root.py || PUBLISH_RC=$?
fi
# The workflow's later steps carry `if: success() && !dry_run`; `ok` is that condition.
ok() { [ "$PUBLISH_RC" -eq 0 ] && [ "$DRY_RUN" != "1" ]; }
[ "$PUBLISH_RC" -eq 0 ] || echo "publish failed rc=$PUBLISH_RC (3 = missing BOARD_SIGN_KEY_PKCS8_B64 — fail closed, tree not published)"

step 'witness the ONE root (Rekor rekord + OpenTimestamps; public bytes only, no key)'
if ok; then
  "$PYTHON" -m pip install -q opentimestamps-client 2>/dev/null || true
  "$PYTHON" scripts/witness_public_root.py
else skipped "publish rc=$PUBLISH_RC dry_run=$DRY_RUN"; fi

step 'EAS on Base — attest the ONE root (fails closed without EAS_ATTESTER_PRIVATE_KEY)'
if ok; then
  npm i --no-save --silent ethers@6 @ethereum-attestation-service/eas-sdk@2 >/dev/null 2>&1 || echo "eas deps unavailable"
  node scripts/eas_attest_root.mjs || echo "EAS step did not attest (recorded honestly in eas-root-attestations.json)"
else skipped "publish rc=$PUBLISH_RC dry_run=$DRY_RUN"; fi

step 'commit published tree'
if ok; then
  git add public/root.json public/cards public/proofs public/publisher-health.json
  git add public/interop/root-witness-*.json public/interop/rekor-root-*.json public/interop/root-witness-pointer.json public/interop/*.ots public/interop/eas-root-attestations.json 2>/dev/null || true
  if git_commit_push "public-root: adapters → cards → merkle ($(date -u +%Y-%m-%dT%H:%MZ))"; then
    echo "pushed $(git rev-parse --short HEAD) to master"
  else
    rc=$?; [ "$rc" -eq 10 ] && echo "no tree change" || exit "$rc"
  fi
else skipped "publish rc=$PUBLISH_RC dry_run=$DRY_RUN"; fi

# Halt is still fail-closed (publish step failed). Persist health only — never the unsigned tree.
step 'commit halt health'
if [ "$PUBLISH_RC" -ne 0 ] && [ "$DRY_RUN" != "1" ]; then
  if git_commit_push "public-root: halt health (tree not published, $(date -u +%Y-%m-%dT%H:%MZ))" public/publisher-health.json; then
    echo "pushed halt health"
  else
    rc=$?; [ "$rc" -eq 10 ] && echo "no halt health" || exit "$rc"
  fi
else skipped "publish rc=$PUBLISH_RC dry_run=$DRY_RUN"; fi

[ "$DRY_RUN" = "1" ] && echo && echo "DRY RUN COMPLETE — adapters + halts ran; nothing written, nothing pushed"
exit "$PUBLISH_RC"
