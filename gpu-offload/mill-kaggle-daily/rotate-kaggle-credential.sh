#!/bin/bash
# rotate-kaggle-credential.sh — OWNER-RUN on oracle-micro-2, AFTER the Kaggle API token has been rotated at kaggle.com
# (Settings -> API: expire the old token, create a new one). HELD until then; nothing runs it automatically.
#
#   bash ~/lanes/mill-kaggle-daily/rotate-kaggle-credential.sh      # paste the NEW token, Enter (input is not echoed)
#
# What it does, in order, and nothing else:
#   1. reads the NEW token from stdin (never argv, never echoed, never logged);
#   2. appends the sha256 of each OLD credential file (~/.kaggle/access_token, ~/.kaggle/kaggle.json) to the deny list
#      ~/.secrets/kaggle-credential-denylist.sha256, which run.sh step 3b checks before every kernel push;
#   3. refuses if the pasted token is itself on the deny list (i.e. the old one was pasted);
#   4. renames the old files to *.revoked-<UTC stamp> (mode 0600; renamed, not deleted);
#   5. installs the new token as ~/.kaggle/access_token (0600, atomic rename);
#   6. proves it with ONE read-only call (kernels status); it never pushes a kernel.
# Prints only file names, hash prefixes and the status line. Exit 0 = installed and authenticated.
set -uo pipefail
umask 077
K=${KAGGLE_CONFIG_DIR:-$HOME/.kaggle}
DENY=${MKD_KAGGLE_DENY:-$HOME/.secrets/kaggle-credential-denylist.sha256}
KAGGLE=${KAGGLE_BIN:-$HOME/bin/kaggle}
KID=${MKD_KERNEL:-nicktempleman/csoai-mill-kaggle-daily}
mkdir -p "$K" "$(dirname "$DENY")"; touch "$DENY"; chmod 600 "$DENY"

[ -t 0 ] && printf 'paste the NEW Kaggle token, then Enter: ' >&2
IFS= read -r -s NEW || true
[ -t 0 ] && echo >&2
NEW=$(printf '%s' "$NEW" | tr -d '[:space:]')
[ ${#NEW} -ge 20 ] || { echo "no token read (need >= 20 chars); nothing changed" >&2; exit 1; }
TMP=$(mktemp "$K/.access_token.XXXXXX"); printf '%s' "$NEW" > "$TMP"; unset NEW
NEW_FP=$(sha256sum "$TMP" | cut -c1-64)

# Two fingerprints per old file: the raw file AND its whitespace-stripped content. The live access_token ends in a
# newline and a pasted token does not, so the raw hash alone would let a re-paste of the OLD token through.
for f in "$K/access_token" "$K/kaggle.json"; do
  [ -s "$f" ] || continue
  sha256sum "$f" | cut -c1-64 >> "$DENY"
  tr -d '[:space:]' < "$f" | sha256sum | cut -c1-64 >> "$DENY"
done
sort -u -o "$DENY" "$DENY"
if grep -qxF "$NEW_FP" "$DENY"; then
  rm -f "$TMP"; echo "REFUSED: the pasted token matches a denied (old) credential; nothing installed" >&2; exit 1
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
for f in "$K/access_token" "$K/kaggle.json"; do
  [ -e "$f" ] && mv "$f" "$f.revoked-$stamp" && chmod 600 "$f.revoked-$stamp" && echo "moved aside: $f -> $f.revoked-$stamp"
done
chmod 600 "$TMP" && mv "$TMP" "$K/access_token"
echo "installed: $K/access_token (sha256 ${NEW_FP:0:8}...); deny list: $DENY ($(wc -l < "$DENY") entries)"

out=$("$KAGGLE" kernels status "$KID" 2>&1 | tail -1)
case "$out" in
  *401*|*403*|*nauthori*|*orbidden*) echo "FAILED: read-only status call was refused: $out" >&2; exit 1 ;;
esac
echo "OK: read-only status call answered: $out"
echo "next: remove ~/lanes/mill-kaggle-daily/HOLD if present; the 10:40Z cron then pushes with the new token."
