#!/bin/bash
# Self-throttling PyPI publisher: up to 10 per run, stop on 429, self-remove cron when done.
B=~/clawd/_pypi_paced; MKT=~/clawd/mcp-marketplace; LOG=$B/paced.log
declare -A DIR; while IFS=$'\t' read -r n d; do DIR["$n"]="$HOME/clawd/$d"; done < "$B/safe_named.tsv"
[ -s "$B/remaining.txt" ] || { crontab -l 2>/dev/null | grep -v paced_publish.sh | crontab - ; echo "$(date) ALL DONE, cron removed" >> "$LOG"; exit 0; }
n=0
while read -r name && [ $n -lt 10 ]; do
  d="${DIR[$name]}"; [ -z "$d" ] && continue
  ( cd "$d" && rm -rf dist build 2>/dev/null && python3 -m build --no-isolation >/dev/null 2>&1 && python3 -m twine check dist/* >/dev/null 2>&1 )
  out=$(cd "$d" && python3 -m twine upload --non-interactive dist/* 2>&1)
  if echo "$out" | grep -q '429'; then echo "$(date) 429 hit at $name, pausing" >> "$LOG"; break; fi
  if echo "$out" | grep -qiE 'view at|already exists'; then echo "$name" >> "$B/done_new.txt"; echo "$(date) OK $name" >> "$LOG"; n=$((n+1));
  else echo "$(date) FAIL $name: $(echo "$out"|tail -1)" >> "$LOG"; echo "$name" >> "$B/failed.txt"; fi
done < "$B/remaining.txt"
# rebuild remaining = old remaining minus done_new/failed
cat "$B/done_new.txt" "$B/failed.txt" 2>/dev/null | sort -u > "$B/processed.txt"
grep -vxF -f "$B/processed.txt" "$B/remaining.txt" > "$B/remaining.tmp" 2>/dev/null && mv "$B/remaining.tmp" "$B/remaining.txt"
echo "$(date) run done, $(wc -l < "$B/remaining.txt") left" >> "$LOG"
