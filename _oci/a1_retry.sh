#!/usr/bin/env bash
VP="/Users/nicholas/clawd/_oci/venv/bin/python"
OUT=$("$VP" ~/clawd/_oci/launch_a1_slice.py 2>&1)
echo "$(date) $OUT" >> ~/clawd/_oci/a1_retry.log
if echo "$OUT" | grep -qE 'LAUNCHED|ALREADY-EXISTS'; then
  crontab -l 2>/dev/null | grep -v a1_retry.sh | crontab -   # got it -> stop retrying
  echo "$(date) A1 SECURED, cron removed" >> ~/clawd/_oci/a1_retry.log
fi
