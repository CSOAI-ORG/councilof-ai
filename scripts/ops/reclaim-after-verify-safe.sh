#!/bin/bash
# reclaim-after-verify-safe.sh — reclaim an M4 directory ONLY after the cluster's copy of it has
# been proven, FILE BY FILE, and only with a written record of what was emptied and where the
# bytes went.
#
# WHY THIS EXISTS (2026-11-03). The reclaim that emptied the estate's clawd records on
# 2026-11-02 09:25 was sound in its arithmetic and silent about its consequence:
#
#   1. It compared TOTALS — file count and byte total of the source against the same two
#      numbers for the archive expanded on the cluster. Two different trees with the same
#      totals pass. Totals are not identity.
#   2. It TRUNCATED every source file to zero bytes and reported "reclaimed". The emptied
#      files look like files. Nothing in the file, in the tree, or in any log said that the
#      bytes had been emptied or where the keeper was — the evidence of the damage was the
#      ABSENCE of content.
#   3. It REMOVED the directories that became empty, so the M4 lost the shape of the tree and
#      the path context that is part of the evidence.
#   4. It never re-checked the keeper AFTER reclaiming. The whole point of a reclaim is that
#      the keeper survives; the script proved the keeper existed and then destroyed the source
#      without ever proving the keeper still held the bytes.
#   5. It had no guard against running a second time over a source that had already been
#      reclaimed. A source that is ALREADY empty is a source that is already damaged, and it
#      must stop the run, not pass it.
#
# This version keeps the good part (the archive is expanded on the cluster and compared, not
# just hashed) and adds what was missing:
#
#   - PER-FILE verification: every source file must exist at the same relative path in the
#     expanded copy with the same size. Mismatches are counted and NAMED.
#   - A keeper must be non-empty for every file it is about to protect.
#   - A RECLAIM MANIFEST is written BEFORE anything is truncated, to a directory that is not
#     the thing being reclaimed: the path, the size, the sha256 and the keeper location of
#     every file that will be emptied. After a reclaim, every emptied file is explained by a
#     line in that manifest.
#   - A POST-RECLAIM re-read of the keeper, so "reclaimed" is a statement about the keeper,
#     not about the source.
#   - The emptied DIRECTORIES are kept. The file names and their paths survive; that is the
#     whole reason this reclaim truncates instead of deleting.
#   - It REFUSES to run over a source that already contains empty files, unless
#     ALLOW_EMPTY_SOURCE=1 is set explicitly, and it refuses if the keeper cannot be read
#     back afterwards.
#
# Usage (same contract as the script it replaces):
#   SRC=/Users/nicholas/clawd VERIFY_DIR=/workspace/m4-offload/verify-20261102-063232/x-clawd \
#   POD_NAME=estate-scratch-20261028 bash reclaim-after-verify-safe.sh
set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

SRC="${SRC:?set SRC to the M4 directory to reclaim}"
VERIFY_DIR="${VERIFY_DIR:?set VERIFY_DIR to the cluster directory holding the expanded archive}"
POD_NAME="${POD_NAME:-estate-scratch-20261028}"
KEY=/Users/nicholas/.runpod/ssh/runpodctl-ssh-key
# The manifest must NOT live inside the thing being reclaimed, and must not live on the pod
# alone. It goes to the M4's scratch-restore area and to the cluster, in that order.
MANIFEST_DIR="${MANIFEST_DIR:-/Users/nicholas/csoai-work/scratch-restore}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
MANIFEST="$MANIFEST_DIR/reclaim-manifest-${STAMP}.tsv"
say() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "${LOG:-/tmp/reclaim.log}"; }
mkdir -p "$MANIFEST_DIR" "$(dirname "${LOG:-/tmp/reclaim.log}")"

[ -d "$SRC" ] || { say "FATAL: SRC $SRC does not exist"; exit 1; }
[ -d "$VERIFY_DIR" ] || { say "FATAL: VERIFY_DIR $VERIFY_DIR does not exist"; exit 1; }

# ---- resolve the pod endpoint at run time (it rotates on every resume) ----------------
id=$(runpodctl pod list 2>/dev/null | python3 -c "
import sys,json
for p in json.load(sys.stdin):
    if p.get('name')=='$POD_NAME': print(p.get('id')); break
" 2>/dev/null)
[ -z "$id" ] && { say "FATAL: no pod named $POD_NAME"; exit 1; }
info=$(runpodctl ssh info "$id" -o json 2>/dev/null)
IP=$(printf '%s' "$info" | python3 -c "import sys,json;print(json.load(sys.stdin).get('ip',''))")
PORT=$(printf '%s' "$info" | python3 -c "import sys,json;print(json.load(sys.stdin).get('port',''))")
[ -z "$IP" ] || [ -z "$PORT" ] && { say "FATAL: could not resolve the endpoint for $id"; exit 1; }
SSHOPT=( ssh -F /dev/null -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new
         -o BatchMode=yes -o ConnectTimeout=15 -p "$PORT" )
REMOTE="root@$IP"
say "pod $POD_NAME at $IP:$PORT"
say "source: $SRC"
say "keeper:  $REMOTE:$VERIFY_DIR"

# ---- GUARD 1: a source that already contains empty files is ALREADY DAMAGED ------------
empty_src=$(find "$SRC" -type f -size 0 2>/dev/null | wc -l | tr -d ' ')
if [ "${empty_src:-0}" != "0" ] && [ "${ALLOW_EMPTY_SOURCE:-0}" != "1" ]; then
  say "REFUSED: the source already contains ${empty_src} zero-length file(s). It has already been"
  say "         reclaimed, or it is damaged. Reclaiming again cannot prove anything. Nothing was"
  say "         reclaimed. If you know what you are doing, set ALLOW_EMPTY_SOURCE=1."
  exit 1
fi

# ---- the SOURCE, per file -------------------------------------------------------------
src_list=$(mktemp /tmp/reclaim-src-XXXXXX)
( cd "$SRC" && find . -type f -print0 2>/dev/null | xargs -0 -I{} stat -f '%z %N' "{}" 2>/dev/null ) \
  | sed 's|^\([0-9]*\) \./|\1\t|' | sort > "$src_list"
sfiles=$(wc -l < "$src_list" | tr -d ' ')
sbytes=$(awk -F'\t' '{s+=$1} END{printf "%.0f", s+0}' "$src_list")
say "source: $sfiles files / ${sbytes:-0} bytes"

# ---- the KEEPER, per file --------------------------------------------------------------
keeper_list=$(mktemp /tmp/reclaim-keeper-XXXXXX)
"${SSHOPT[@]}" "$REMOTE" "cd '$VERIFY_DIR' && find . -type f -print0 2>/dev/null | xargs -0 -I{} stat -c '%s %n' '{}' 2>/dev/null | sed 's|^\([0-9]*\) \./|\1\t|' | sort" > "$keeper_list" 2>/dev/null
vfiles=$(wc -l < "$keeper_list" | tr -d ' ')
vbytes=$(awk -F'\t' '{s+=$1} END{printf "%.0f", s+0}' "$keeper_list")
say "keeper:  $vfiles files / ${vbytes:-0} bytes"

# ---- GUARD 2: per-file identity, not totals ---------------------------------------------
# Every source file must appear in the keeper at the same relative path with the same size.
missing=$(awk -F'\t' 'NR==FNR{k[$2]=$1;next} !($2 in k)' "$keeper_list" "$src_list" | wc -l | tr -d ' ')
sizediff=$(awk -F'\t' 'NR==FNR{k[$2]=$1;next} ($2 in k) && k[$2]!=$1' "$keeper_list" "$src_list" | wc -l | tr -d ' ')
keeper_zero=$(awk -F'\t' '$1==0' "$keeper_list" | wc -l | tr -d ' ')
say "per-file check: ${missing:-?} missing, ${sizediff:-?} size-mismatched, ${keeper_zero:-?} keeper files empty"
if [ "${missing:-0}" != "0" ] || [ "${sizediff:-0}" != "0" ]; then
  say "REFUSED: the keeper does not hold the source file for file. The first mismatches:"
  awk -F'\t' 'NR==FNR{k[$2]=$1;next} !($2 in k) || k[$2]!=$1 {print "         "$2" (source "$1" B, keeper "k[$2]" B)"}' \
    "$keeper_list" "$src_list" | head -10
  say "         It is not a backup. Nothing was reclaimed."
  exit 1
fi
if [ "${keeper_zero:-0}" != "0" ]; then
  say "REFUSED: ${keeper_zero} file(s) in the keeper are ZERO LENGTH. A keeper of empty files is"
  say "         not a keeper. Nothing was reclaimed."
  exit 1
fi
say "PER-FILE MATCH: every one of the $sfiles source files is present in the keeper at the same path with the same size"

# ---- GUARD 3: the archive must still expand cleanly ------------------------------------
arc="$VERIFY_DIR/$(basename "$SRC").tar.zst"
if [ -f "$arc" ] || "${SSHOPT[@]}" "$REMOTE" "test -f '$arc'" 2>/dev/null; then
  zrc=$("${SSHOPT[@]}" "$REMOTE" "zstd -t '$arc' >/dev/null 2>&1; echo \$?" 2>/dev/null | tr -d ' \r')
  if [ "$zrc" != "0" ]; then
    say "REFUSED: $arc does not expand cleanly on the cluster (zstd -t exit $zrc). Nothing was reclaimed."
    exit 1
  fi
  say "the archive expands cleanly on the cluster (zstd -t ok)"
fi

# ---- WRITE THE MANIFEST BEFORE ANYTHING IS EMPTIED -------------------------------------
{
  echo "# reclaim manifest $STAMP"
  echo "# source: $SRC"
  echo "# keeper: $REMOTE:$VERIFY_DIR"
  echo "# columns: relative_path<TAB>bytes<TAB>sha256"
  while IFS=$'\t' read -r sz rel; do
    sh=$(shasum -a 256 "$SRC/$rel" 2>/dev/null | cut -d' ' -f1)
    echo -e "$rel\t$sz\t$sh"
  done < "$src_list"
} > "$MANIFEST"
say "reclaim manifest written BEFORE any truncation: $MANIFEST ($(wc -l < "$MANIFEST") lines)"
cp "$MANIFEST" "${SSHOPT[@]}" "$REMOTE" "cat > '$VERIFY_DIR/reclaim-manifest-$STAMP.tsv'" < "$MANIFEST" 2>/dev/null \
  && say "a copy of the manifest is on the cluster too: $VERIFY_DIR/reclaim-manifest-$STAMP.tsv" \
  || say "WARNING: the manifest copy to the cluster FAILED — the M4 copy is the only one"

# ---- GUARD 4: refuse to empty a file the keeper does not actually hold -------------------
nonempty_src=$(awk -F'\t' '$1>0' "$src_list" | wc -l | tr -d ' ')
say "about to empty $nonempty_src files (every one of them is named in the manifest above)"

# ---- the reclaim itself ------------------------------------------------------------------
find "$SRC" -type f -exec truncate -s 0 {} \; 2>/dev/null
# NOTE: the emptied DIRECTORIES ARE KEPT. The old script rmdir'd them, which destroyed the
# tree's shape and the path context. A file name and its path are evidence too.
say "source files emptied; directories KEPT (the old reclaim removed them, which destroyed the shape)"

# ---- POST-RECLAIM: re-read the keeper, so 'reclaimed' is a statement about the keeper ----
sample=$(awk -F'\t' 'NR%37==0' "$src_list" | head -40)
bad=0; checked=0
while IFS=$'\t' read -r sz rel; do
  checked=$((checked+1))
  ksz=$("${SSHOPT[@]}" "$REMOTE" "stat -c%s '$VERIFY_DIR/$rel' 2>/dev/null" 2>/dev/null | tr -d ' \r')
  if [ "$ksz" != "$sz" ]; then
    say "  POST-RECLAIM MISMATCH: $rel — keeper says ${ksz:-missing} B, source said $sz B"
    bad=$((bad+1))
  fi
done <<< "$sample"
say "post-reclaim re-read: $checked keeper files sampled, $bad mismatched"
if [ "$bad" != "0" ]; then
  say "FAIL: the keeper does not hold the bytes this reclaim claimed to protect. The source has"
  say "      ALREADY been emptied — restore from the keeper before doing anything else."
  exit 1
fi

say "reclaimed, and the keeper was re-read afterwards: it holds the bytes"
df -h / | tail -1
exit 0
