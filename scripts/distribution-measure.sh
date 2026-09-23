#!/bin/bash
# 07:00Z daily: measure this estate's distribution package by package and publish the artifact.
# Installed on the pod as /workspace/lanes/loops/distribution-measure.sh; kept in the repo so the
# producer of the number is reviewable beside the number.
#
# THE SCHEDULER OWNS THE STAMP. scheduler.sh calls `stamp distribution-measure` and then runs this
# with --now; with --now this script must not stamp again. A script that stamps itself as well as
# the scheduler finds its own stamp already written and exits 0 having done nothing, and a loop
# that silently no-ops leaves no log line to notice — that was today's bug elsewhere on this pod.
#
# One clone per purpose: $LANES/distribution-repo is this loop's and nothing else's. The shared
# checkouts on this pod get reset --hard under whoever is using them.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp distribution-measure || exit 0

# Production defaults. Overridable so the loop can be exercised end to end without a 13-minute
# run and without pushing a real branch — a wrapper nobody has ever run is not a wrapper, it is a
# hope, and a loop that silently no-ops leaves no log line to notice.
REPO_DIR="${DISTRIBUTION_REPO_DIR:-$LANES/distribution-repo}"
# The pod clones from its own bare repo, not from GitHub: there are no GitHub credentials in this
# environment and a clone over https dies with "could not read Username". /workspace/git/councilof-ai.git
# is the pod's origin for every other clone here, and deploy-prod.sh ships from it.
REMOTE="${DISTRIBUTION_REMOTE:-/workspace/git/councilof-ai.git}"
BASE_REF="${DISTRIBUTION_BASE_REF:-origin/master}"
BRANCH="${DISTRIBUTION_BRANCH:-distribution/auto-$(date -u +%Y-%m-%d)}"
LIMIT="${DISTRIBUTION_LIMIT:-0}"
PUSH="${DISTRIBUTION_PUSH:-1}"
RUN_LOG="$LOGS/distribution-measure.run.log"
OUT_DIR="$OUT/distribution"

log distribution-measure "START branch=$BRANCH base=$BASE_REF limit=$LIMIT"

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone --filter=blob:none --no-checkout "$REMOTE" "$REPO_DIR" >>"$RUN_LOG" 2>&1 || {
    log distribution-measure "RESULT rc=1 | clone failed"; exit 1; }
  git -C "$REPO_DIR" sparse-checkout init --cone >>"$RUN_LOG" 2>&1
  git -C "$REPO_DIR" sparse-checkout set public/interop scripts >>"$RUN_LOG" 2>&1
fi
git -C "$REPO_DIR" fetch -q origin >>"$RUN_LOG" 2>&1
git -C "$REPO_DIR" checkout -q -B "$BRANCH" "$BASE_REF" >>"$RUN_LOG" 2>&1 || {
  log distribution-measure "RESULT rc=1 | checkout failed"; exit 1; }

LIST="$REPO_DIR/public/interop/footprint-packages.json"
[ -s "$LIST" ] || { log distribution-measure "RESULT rc=1 | no confirmed package list at $LIST"; exit 1; }

: >"$RUN_LOG"
python3 "$LOOPS/distribution-measure.py" --now --list "$LIST" --out-dir "$OUT_DIR" --limit "$LIMIT" >>"$RUN_LOG" 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then
  log distribution-measure "RESULT rc=$rc | measurement failed; nothing published | $(tail -2 "$RUN_LOG" | tr '\n' ' ' | cut -c1-300)"
  exit "$rc"
fi

DATED="$OUT_DIR/distribution-$(date -u +%Y-%m-%d).json"
LATEST="$OUT_DIR/distribution-latest.json"
cp "$DATED" "$LATEST" "$REPO_DIR/public/interop/" 2>>"$RUN_LOG"
git -C "$REPO_DIR" add public/interop/distribution-latest.json "public/interop/$(basename "$DATED")" >>"$RUN_LOG" 2>&1
if git -C "$REPO_DIR" diff --cached --quiet; then
  log distribution-measure "RESULT rc=0 | measured, artifact byte-identical to master; nothing to push | $(grep '^RESULT' "$RUN_LOG" | tail -1)"
else
  git -C "$REPO_DIR" -c user.name=CSOAI -c user.email=nicholas@csoai.org \
    commit -q -m "distribution: $(grep '^RESULT' "$RUN_LOG" | tail -1 | cut -c8-200)" >>"$RUN_LOG" 2>&1
  if [ "$PUSH" = "1" ]; then
    git -C "$REPO_DIR" push -q -f origin "$BRANCH" >>"$RUN_LOG" 2>&1
    push=$?
    log distribution-measure "PUSH rc=$push branch=$BRANCH (landing is a separate gated merge; this loop never merges)"
  else
    log distribution-measure "PUSH skipped (DISTRIBUTION_PUSH=0) | committed locally on $BRANCH"
  fi
fi

# Mirror the artifact so the measurement outlives this pod. Two machines or it did not happen.
if hf_token_present; then
  python3 "$LOOPS/hf_upload.py" --repo csoai/distribution-measure --create --private \
    --file "$DATED" --path-in-repo "distribution/$(basename "$DATED")" >>"$RUN_LOG" 2>&1
  log distribution-measure "MIRROR rc=$? repo=csoai/distribution-measure"
else
  log distribution-measure "MIRROR skipped | no HF token on this pod; the artifact is on /workspace only"
fi

log distribution-measure "RESULT rc=0 | $(grep '^RESULT' "$RUN_LOG" | tail -1)"

# The measured branch is not a public release. A separate worker checks its
# dated bytes, refreshes the two discovery texts, and uses the pod's existing
# build and Cloudflare gates. This is deliberately queued only after a real
# branch push; smoke runs and failed pushes cannot trigger publication.
if [ "$PUSH" = "1" ]; then
  if [ "${push:-skipped}" = "skipped" ]; then
    log distribution-measure "RELEASE skipped: artifact already byte-identical to master"
  elif [ "$push" != "0" ]; then
    log distribution-measure "RELEASE HOLD: branch push failed; no public release queued"
    exit 1
  elif [ "${DISTRIBUTION_AUTO_RELEASE:-1}" != "1" ]; then
    log distribution-measure "RELEASE disabled by DISTRIBUTION_AUTO_RELEASE"
  elif [ ! -s "$LOOPS/distribution-release.py" ]; then
    log distribution-measure "RELEASE HOLD: installed worker absent at $LOOPS/distribution-release.py"
    exit 1
  else
    nohup python3 "$LOOPS/distribution-release.py" "$(date -u +%Y-%m-%d)" \
      >"$LOGS/distribution-release.run.log" 2>&1 < /dev/null &
    log distribution-measure "RELEASE queued pid=$!; public result requires separate SERVED receipt"
  fi
fi
