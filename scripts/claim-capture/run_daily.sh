#!/bin/sh
# Existing RunPod CPU only. No model, wallet, paid API or new compute.
set -u
BASE=/workspace/csoai-claim-capture
cd "$BASE" || exit 3
/usr/bin/python3 - <<'PY'
import shutil
from pathlib import Path
p=Path('/workspace/csoai-claim-capture/state')
if shutil.disk_usage(p).free < 5*1024**3:
    raise SystemExit('HELD: less than 5 GiB free; no files deleted')
size=sum(f.stat().st_size for f in p.rglob('*') if f.is_file())
if size > 2*1024**3:
    raise SystemExit('HELD: capture storage exceeds 2 GiB; archival required')
PY
check=$?
[ "$check" -eq 0 ] || exit "$check"
printf '\nSTART %s\n' "$(date -u +%FT%TZ)"
/usr/bin/timeout 300 /usr/bin/python3 -u "$BASE/claim_capture.py" --state "$BASE/state" --pages 6 --daily --stamp
rc=$?
/usr/bin/timeout 180 /usr/bin/python3 -u "$BASE/watch_cohort.py"
watch_rc=$?
[ "$watch_rc" -eq 0 ] || rc=$watch_rc
/usr/bin/timeout 300 /usr/bin/python3 -u "$BASE/delivery_pipeline.py" --state "$BASE/state" --upgrade
delivery_rc=$?
[ "$delivery_rc" -eq 0 ] || rc=$delivery_rc
printf 'END %s exit=%s\n' "$(date -u +%FT%TZ)" "$rc"
exit "$rc"
