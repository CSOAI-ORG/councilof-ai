#!/usr/bin/env bash
# Mirror only the currently admitted public-root recovery subset to Oracle.
# This is additive and deliberately separate from arena-backup-oracle.sh.
set -euo pipefail

REPO="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ORACLE="${ORACLE:-oracle-micro-2}"
DEST="${DEST:-/home/ubuntu/rag/councilof-ai-public-recovery}"
RSYNC="${RSYNC:-rsync}"
GENERATOR="$REPO/scripts/public_recovery_manifest.py"

[[ "$ORACLE" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "BLOCKED: unsafe Oracle host alias" >&2; exit 2; }
[[ "$DEST" =~ ^/[A-Za-z0-9._/-]+$ && "$DEST" != *".."* ]] || { echo "BLOCKED: unsafe remote destination" >&2; exit 2; }
command -v ssh >/dev/null || { echo "BLOCKED: ssh missing" >&2; exit 2; }
command -v "$RSYNC" >/dev/null || { echo "BLOCKED: rsync missing" >&2; exit 2; }
[[ -f "$GENERATOR" ]] || { echo "BLOCKED: recovery manifest generator missing" >&2; exit 2; }

STAGE=$(mktemp -d "${TMPDIR:-/tmp}/csoai-public-recovery.XXXXXX")
REMOTE_INCOMING=""
cleanup() {
  rm -rf -- "$STAGE"
  if [[ -n "$REMOTE_INCOMING" ]]; then
    ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" "rm -rf -- '$REMOTE_INCOMING'" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# The generator runs the existing live production gate. Any stale/missing witness,
# failed public query, dirty covered file, or invalid proof stops before transfer.
python3 "$GENERATOR" create --repo "$REPO" --output-dir "$STAGE/bundle"
COMMIT=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["git"]["commit"])' "$STAGE/bundle/recovery-manifest.json")
[[ "$COMMIT" =~ ^[0-9a-f]{40}$ ]] || { echo "BLOCKED: manifest commit is invalid" >&2; exit 1; }
RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-${COMMIT:0:12}"
REMOTE_INCOMING="$DEST/.incoming-$RELEASE"
REMOTE_RELEASE="$DEST/releases/$RELEASE"

BYTES=$(du -sk "$STAGE/bundle" | awk '{print $1}')
FREE=$(ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" "mkdir -p '$DEST/releases' && df -Pk '$DEST' | awk 'NR==2 {print \$4}'")
[[ "$FREE" =~ ^[0-9]+$ && "$FREE" -gt $((BYTES * 2 + 102400)) ]] || {
  echo "BLOCKED: Oracle disk headroom is insufficient or unreadable" >&2
  exit 1
}
ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" "test ! -e '$REMOTE_INCOMING' && test ! -e '$REMOTE_RELEASE' && mkdir '$REMOTE_INCOMING'"
"$RSYNC" -a --partial -e "ssh -o BatchMode=yes -o ConnectTimeout=8" "$STAGE/bundle/" "$ORACLE:$REMOTE_INCOMING/"

# Run the same standard-library verifier on Oracle without installing or persisting
# tooling there. It rejects missing, changed, symlinked, or extra payload files.
ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" \
  "python3 - verify --bundle-dir '$REMOTE_INCOMING'" < "$GENERATOR"

# Publish only after remote hash and binding verification. A failed attempt leaves the
# previous current symlink intact.
ssh -o BatchMode=yes -o ConnectTimeout=8 "$ORACLE" \
  "mv '$REMOTE_INCOMING' '$REMOTE_RELEASE' && ln -s 'releases/$RELEASE' '$DEST/.current-$RELEASE' && mv -Tf '$DEST/.current-$RELEASE' '$DEST/current'"
REMOTE_INCOMING=""
echo "Oracle public recovery mirror: PASS release=$RELEASE commit=$COMMIT"
