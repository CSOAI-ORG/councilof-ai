#!/usr/bin/env bash
# Create and push the GSPC Governance Leaderboard Space + results dataset repos.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NS="${HF_NAMESPACE:-csoai}"

if ! hf auth whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: hf auth login"
  exit 1
fi

SPACE_ID="${NS}/gspc-governance-leaderboard"
DATASET_ID="${NS}/gspc-leaderboard-results"

echo "[hf] Create Space $SPACE_ID"
hf repos create "$SPACE_ID" --type space --space-sdk gradio --flavor cpu-basic --public --exist-ok

echo "[hf] Clone and push Space files"
TMP=$(mktemp -d)
git clone "https://huggingface.co/spaces/$SPACE_ID" "$TMP/space" 2>/dev/null || mkdir -p "$TMP/space"
cp "$ROOT/hf/gspc-governance-leaderboard/"* "$TMP/space/"
cd "$TMP/space"
git add -A
git commit -m "GSPC governance leaderboard — live board from councilof.ai/api/gspc" || true
git push

echo "[hf] Create results dataset $DATASET_ID"
hf repos create "$DATASET_ID" --type dataset --public --exist-ok
mkdir -p "$TMP/dataset/submissions"
echo '{"schema":"csoai.gspc-leaderboard-results/0.1","submissions":[]}' > "$TMP/dataset/submissions/index.json"
git -C "$TMP" init dataset 2>/dev/null || true
if [ ! -d "$TMP/dataset/.git" ]; then
  git clone "https://huggingface.co/datasets/$DATASET_ID" "$TMP/dataset" 2>/dev/null || true
fi
cd "$TMP/dataset"
git add -A
git commit -m "Initialize PR submission index" || true
git push

echo "[hf] Space: https://huggingface.co/spaces/$SPACE_ID"
echo "[hf] Results dataset: https://huggingface.co/datasets/$DATASET_ID"
