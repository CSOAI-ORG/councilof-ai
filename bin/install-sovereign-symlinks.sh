#!/usr/bin/env bash
# Install sovereign-* symlinks into ~/.local/bin so every script is callable from anywhere.
set -e
LOCAL_BIN="${HOME}/.local/bin"
mkdir -p "$LOCAL_BIN"

# (name, target) list
TARGETS=(
    "sovereign-launcher|/Users/nicholas/clawd/_alignment/oracle_or_mac/mac_sovereign_launcher.sh"
    "sovereign-drum|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/drum/drum_heartbeat.py"
    "sovereign-flywheel|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/mindset/principle_6_compounding_flywheel.py"
    "sovereign-dimensions|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/dimensions/dimension_harvester.py"
    "sovereign-openworld|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/openworld/openworld_harvester.py"
    "sovereign-hunt|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/hunt/sovereign_training_data_hunt.py"
    "sovereign-hives|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/hive_absorption/sovereign_hive_absorption.py"
    "sovereign-deepsaturation|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/hive_absorption/sovereign_deep_absorption.py"
    "sovereign-oracle|/Users/nicholas/clawd/_alignment/oracle_or_mac/oracle_sovereign_catapult/oracle_sovereign_catapult.py"
    "sovereign-forge|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/framework_forge/principle_7_framework_forge.py"
    "sovereign-owem|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_owem_v3.py"
    "sovereign-dock|/Users/nicholas/clawd/_alignment/sovereign_merge_kit/dock/4move/principle_8_4move_dock.py"
    "sovereign-status|/Users/nicholas/clawd/bin/sovereign-status.sh"
    "sovereign-help|/Users/nicholas/clawd/bin/sovereign-help.sh"
)

count=0
for entry in "${TARGETS[@]}"; do
    name="${entry%%|*}"
    target="${entry#*|}"
    if [ ! -f "$target" ]; then
        echo "  ⚠️  Missing: $target — skipping $name"
        continue
    fi
    ln -sf "$target" "$LOCAL_BIN/$name"
    echo "  ✓ $LOCAL_BIN/$name -> $target"
    count=$((count + 1))
done

echo ""
echo "Installed $count sovereign-* symlinks into $LOCAL_BIN"
echo "Run from anywhere: sovereign-launcher / sovereign-drum / sovereign-flywheel / ..."
