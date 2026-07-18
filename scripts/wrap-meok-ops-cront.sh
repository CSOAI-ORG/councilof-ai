#!/bin/bash
# Wrap all com.meok.ops.* launchd plists with cron-wrapper.sh
# Backs up originals to ~/Library/LaunchAgents/_original_plists/

set -euo pipefail

PLIST_DIR="$HOME/Library/LaunchAgents"
BACKUP_DIR="$PLIST_DIR/_original_plists"
WRAPPER="$HOME/clawd/scripts/cron-wrapper.sh"

mkdir -p "$BACKUP_DIR"

cd "$PLIST_DIR"

for plist in com.meok.ops.*.plist; do
    [ -f "$plist" ] || continue
    label="${plist%.plist}"
    task_name="${label#com.meok.ops.}"
    backup="$BACKUP_DIR/$plist"

    # Backup once
    if [ ! -f "$backup" ]; then
        cp "$plist" "$backup"
    fi

    # Skip if already wrapped
    if grep -q "cron-wrapper.sh" "$plist" 2>/dev/null; then
        echo "SKIP (already wrapped): $plist"
        continue
    fi

    # Use Python to rewrite plist ProgramArguments safely
    python3 << PYEOF
import plistlib
import sys

with open("$plist", "rb") as f:
    data = plistlib.load(f)

orig = data.get("ProgramArguments", [])
if not orig:
    sys.exit(0)

new_args = ["/bin/bash", "$WRAPPER", "$task_name"] + orig
data["ProgramArguments"] = new_args

with open("$plist", "wb") as f:
    plistlib.dump(data, f)
PYEOF

    echo "WRAPPED: $plist (task: $task_name)"

    # Reload launchd job
    launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$plist" 2>&1 || echo "FAILED to load: $label"
done

echo "Done. Original plists backed up to $BACKUP_DIR"
