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

REPO_DIR="$LANES/distribution-repo"
REMOTE="https://github.com/CSOAI-ORG/councilof-ai.git"
BRANCH="distribution/auto-$(date -u +%Y-%m-%d)"
RUN_LOG="$LOGS/distribution-measure.run.log"
OUT_DIR="$OUT/distribution"

log distribution-measure "START branch=$BRANCH"

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone --filter=blob:none --no-checkout "$REMOTE" "$REPO_DIR" >>"$RUN_LOG" 2>&1 || {
    log distribution-measure "RESULT rc=1 | clone failed"; exit 1; }
  git -C "$REPO_DIR" sparse-checkout init --cone >>"$RUN_LOG" 2>&1
  git -C "$REPO_DIR" sparse-checkout set public/interop scripts >>"$RUN_LOG" 2>&1
fi
git -C "$REPO_DIR" fetch -q origin master >>"$RUN_LOG" 2>&1
git -C "$REPO_DIR" checkout -q -B "$BRANCH" origin/master >>"$RUN_LOG" 2>&1 || {
  log distribution-measure "RESULT rc=1 | checkout failed"; exit 1; }

LIST="$REPO_DIR/public/interop/footprint-packages.json"
[ -s "$LIST" ] || { log distribution-measure "RESULT rc=1 | no confirmed package list at $LIST"; exit 1; }

: >"$RUN_LOG"
python3 "$LOOPS/distribution-measure.py" --now --list "$LIST" --out-dir "$OUT_DIR" >>"$RUN_LOG" 2>&1
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
  git -C "$REPO_DIR" push -q -f origin "$BRANCH" >>"$RUN_LOG" 2>&1
  push=$?
  log distribution-measure "PUSH rc=$push branch=$BRANCH (landing is a separate gated merge; this loop never merges)"
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
