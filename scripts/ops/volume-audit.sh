#!/bin/bash
# volume-audit.sh — measure the estate-scratch network volume: real headroom and who is using it.
#
# WHY A SCRIPT AND NOT AN INLINE COMMAND: a find walk over 300k+ files on a FUSE volume takes
# minutes, and an ssh session that carries it dies with it ("Connection closed by remote host").
# The measurement has to outlive the session that starts it.
#
# It never writes a byte that is not removed, and it never removes anything of the estate's.
set -uo pipefail
OUT=/workspace/volume-audit.log
exec >> "$OUT" 2>&1
echo "=== $(date -u +%FT%TZ) volume audit ==="

echo "--- what the CLI says this volume is ---"
runpodctl network-volume get 08xza5ommr -o json 2>/dev/null | head -c 300
echo

echo "--- headroom probe: write 5 GB, read it back, remove it ---"
dd if=/dev/zero of=/workspace/.hdrm5g bs=1M count=5120 2>&1 | tail -1
echo "readback bytes: $(stat -c %s /workspace/.hdrm5g 2>/dev/null || echo MISSING)"
python3 -c "import os; os.remove('/workspace/.hdrm5g')" 2>/dev/null && echo "probe removed"

echo "--- per-directory usage (streaming; no du on the whole tree) ---"
for d in busabase lanes m4-lanes dc-agent busabase-restore-test hf-upload oracle-offload m4-offload autoclaw csoai-state; do
  [ -d "/workspace/$d" ] || continue
  s=$(find "/workspace/$d" -type f -printf "%s\n" 2>/dev/null | awk '{t+=$1} END {printf "%.2f", t/1e9}')
  n=$(find "/workspace/$d" -type f 2>/dev/null | wc -l)
  echo "  $d: ${s} GB, $n files"
done
echo "=== $(date -u +%FT%TZ) audit done ==="
