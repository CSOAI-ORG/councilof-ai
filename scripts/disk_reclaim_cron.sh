#!/bin/bash
# ~/clawd/scripts/disk_reclaim_cron.sh — auto-reclaim uv cache every 12h
# Per the Day 6 morning finding: uv cache grows back to 1-3GB quickly.
# Move to trash (not rm) per AGENTS.md preference.

set -e
TRASH="$HOME/.Trash"
mkdir -p "$TRASH"

# Trash the uv cache (rebuilds on next pip install)
if [ -d "$HOME/.cache/uv" ]; then
  TS=$(date +%Y%m%d-%H%M%S)
  mv "$HOME/.cache/uv" "$TRASH/uv-cache-$TS" 2>/dev/null && echo "[reclaim] uv cache trashed (uv-cache-$TS)" || true
fi

# Trash the huggingface cache (rebuilds on next model load)
if [ -d "$HOME/.cache/huggingface" ]; then
  TS=$(date +%Y%m%d-%H%M%S)
  mv "$HOME/.cache/huggingface" "$TRASH/huggingface-$TS" 2>/dev/null && echo "[reclaim] huggingface trashed (huggingface-$TS)" || true
fi

# Trash old /tmp tarballs (>24h)
find /tmp -maxdepth 1 -name '*.tar.gz' -o -name '*.tgz' -o -name '*.zip' 2>/dev/null | while read f; do
  age_days=$(( ($(date +%s) - $(stat -f %m "$f" 2>/dev/null || echo 0)) / 86400 ))
  if [ "$age_days" -gt 1 ]; then
    TS=$(date +%Y%m%d-%H%M%S)
    mv "$f" "$TRASH/$(basename $f)-$TS" 2>/dev/null && echo "[reclaim] old tarball: $(basename $f)" || true
  fi
done

# Report
FREE=$(df -h / | tail -1 | awk '{print $4}')
USED=$(df -h / | tail -1 | awk '{print $5}')
echo "[reclaim] $(date) — free: $FREE, used: $USED"
