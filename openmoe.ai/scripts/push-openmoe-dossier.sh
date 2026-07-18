#!/usr/bin/env bash
# push-openmoe-dossier.sh
# Push the openmoe.ai dossier to GitHub using an env-var-based token.
#
# Usage:
#   GH_WRITE_TOKEN=ghp_xxx ./push-openmoe-dossier.sh
#
# If GH_WRITE_TOKEN is empty, the script will attempt to use the
# already-authenticated browser session via the Kimi WebBridge
# (127.0.0.1:10086). Otherwise it falls back to direct git push.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/CSOAI-ORG/openmoe.ai.git}"
LOCAL_DIR="${LOCAL_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BRANCH="${BRANCH:-main}"
COMMIT_MSG="${COMMIT_MSG:-chore: sync openmoe.ai dossier (auto-push $(date -u +%Y-%m-%dT%H:%M:%SZ))}"

cd "$LOCAL_DIR"

if [[ -n "${GH_WRITE_TOKEN:-}" ]]; then
    echo "[push] Using GH_WRITE_TOKEN from env"
    git remote set-url origin "https://x-access-token:${GH_WRITE_TOKEN}@github.com/CSOAI-ORG/openmoe.ai.git"
    git add -A
    if ! git diff --cached --quiet; then
        git -c user.email="Mavis@meok.ai" -c user.name="Mavis" commit -m "$COMMIT_MSG"
    fi
    git push -u origin "$BRANCH"
    echo "[push] OK via token"
elif [[ -f /tmp/openmoe-webbridge-ok ]]; then
    echo "[push] WebBridge session ready, using daemon-assisted upload"
    python3 "$(dirname "$0")/webbridge_upload.py" --repo CSOAI-ORG/openmoe.ai --dir "$LOCAL_DIR"
else
    echo "[push] No token and no WebBridge session — opening the GitHub web UI for manual upload"
    open "https://github.com/CSOAI-ORG/openmoe.ai/upload/main"
    echo "[push] Drop the files from $LOCAL_DIR into the browser window"
fi
