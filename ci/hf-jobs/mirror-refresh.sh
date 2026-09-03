#!/usr/bin/env bash
# ci/hf-jobs/mirror-refresh.sh — refresh the private HF mirror of this repo.
#
#   mirror-refresh.sh [repo-dir]        (default: the repo this script lives in)
#   env DS=csoai/councilof-ai-mirror    target dataset (private; org write needed)
#
# Produces councilof-ai-mirror-<UTC date>.bundle from origin/master and uploads it.
# Source only — no secrets are in a bundle — so this may run anywhere with an hf login.
# Restore (what deploy.sh does when GitHub is unreachable):
#   hf download csoai/councilof-ai-mirror --repo-type dataset --local-dir m --include '*.bundle'
#   git init repo && git -C repo fetch m/<newest>.bundle '+refs/*:refs/bundle/*'
#   git -C repo checkout --detach refs/bundle/remotes/origin/master   # or refs/bundle/heads/master
set -euo pipefail
REPO="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
DS="${DS:-csoai/councilof-ai-mirror}"
OUT="${TMPDIR:-/tmp}/councilof-ai-mirror-$(date -u +%Y%m%d).bundle"
command -v hf >/dev/null || { echo "hf CLI missing"; exit 1; }
git -C "$REPO" fetch -q origin master
git -C "$REPO" bundle create "$OUT" origin/master
git -C "$REPO" bundle verify "$OUT" >/dev/null
echo "bundle: $OUT ($(wc -c < "$OUT") bytes) heads: $(git -C "$REPO" bundle list-heads "$OUT" | awk '{print $2}' | tr '\n' ' ')"
hf upload "$DS" "$OUT" "$(basename "$OUT")" --repo-type dataset
rm -f "$OUT"
echo "uploaded to hf://datasets/$DS — older bundles are kept; prune with: hf repo-files delete $DS <name>.bundle --repo-type dataset"
