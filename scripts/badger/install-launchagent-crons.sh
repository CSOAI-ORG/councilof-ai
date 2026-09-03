#!/usr/bin/env bash
# install-launchagent-crons.sh — wire the relentless loop into macOS LaunchAgent.
# Owner-gated (requires sudo / LaunchAgent install), but the plist files
# can be staged here for review.

set -euo pipefail
REPO="$HOME/clawd/councilof-ai"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_DIR"

# Common env — paths and env vars the agents need.
PLIST_HEADER='<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>REPLACE_LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>REPLACE_SCRIPT</string>
  </array>
  <key>WorkingDirectory</key>
  <string>REPLACE_REPO</string>
  <key>StandardOutPath</key>
  <string>REPLACE_LOG</string>
  <key>StandardErrorPath</key>
  <string>REPLACE_LOG</string>
  <key>RunAtLoad</key>
  <false/>
'

# 1. csoai-eat-all-chains — every 15 minutes
cat > "$LAUNCH_DIR/com.csoai.eat-all-chains.plist" <<EOF
${PLIST_HEADER/REPLACE_LABEL/com.csoai.eat-all-chains}
  <key>StartInterval</key>
  <integer>900</integer>
</dict>
</plist>
EOF
sed -i '' "s|REPLACE_SCRIPT|${REPO}/scripts/badger/csoai-eat-all-chains.py|; s|REPLACE_REPO|${REPO}|; s|REPLACE_LOG|${REPO}/scripts/badger/_logs/eat-all-chains.log|" \
  "$LAUNCH_DIR/com.csoai.eat-all-chains.plist"
chmod +x "${REPO}/scripts/badger/csoai-eat-all-chains.py"

# 2. tier-2/3 harvesters — every hour
for src in csoai-t2-atoms csoai-t3-atoms; do
  cat > "$LAUNCH_DIR/com.csoai.${src}.plist" <<EOF2
${PLIST_HEADER/REPLACE_LABEL/com.csoai.${src}}
  <key>StartInterval</key>
  <integer>3600</integer>
</dict>
</plist>
EOF2
  sed -i '' "s|REPLACE_SCRIPT|${REPO}/scripts/badger/${src}.py|; s|REPLACE_REPO|${REPO}|; s|REPLACE_LOG|${REPO}/scripts/badger/_logs/${src}.log|" \
    "$LAUNCH_DIR/com.csoai.${src}.plist"
  chmod +x "${REPO}/scripts/badger/${src}.py"
done

# 3. Bitcoin OTS anchor — every day at 07:00 UTC
cat > "$LAUNCH_DIR/com.csoai.ots-anchor.plist" <<EOF3
${PLIST_HEADER/REPLACE_LABEL/com.csoai.ots-anchor}
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>7</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
</dict>
</plist>
EOF3
sed -i '' "s|REPLACE_SCRIPT|${REPO}/scripts/badger/ots-anchor.sh|; s|REPLACE_REPO|${REPO}|; s|REPLACE_LOG|${REPO}/scripts/badger/_logs/ots-anchor.log|" \
  "$LAUNCH_DIR/com.csoai.ots-anchor.plist"

# 4. corrections check — every hour
cat > "$LAUNCH_DIR/com.csoai.corrections-check.plist" <<EOF4
${PLIST_HEADER/REPLACE_LABEL/com.csoai.corrections-check}
  <key>StartInterval</key>
  <integer>3600</integer>
</dict>
</plist>
EOF4
sed -i '' "s|REPLACE_SCRIPT|${REPO}/scripts/badger/corrections-check.sh|; s|REPLACE_REPO|${REPO}|; s|REPLACE_LOG|${REPO}/scripts/badger/_logs/corrections-check.log|" \
  "$LAUNCH_DIR/com.csoai.corrections-check.plist"

# 5. end-to-end-pass — every 6 hours
cat > "$LAUNCH_DIR/com.csoai.end-to-end-pass.plist" <<EOF5
${PLIST_HEADER/REPLACE_LABEL/com.csoai.end-to-end-pass}
  <key>StartInterval</key>
  <integer>21600</integer>
</dict>
</plist>
EOF5
sed -i '' "s|REPLACE_SCRIPT|${REPO}/scripts/end-to-end-pass.sh|; s|REPLACE_REPO|${REPO}|; s|REPLACE_LOG|${REPO}/scripts/badger/_logs/end-to-end-pass.log|" \
  "$LAUNCH_DIR/com.csoai.end-to-end-pass.plist"

echo "================================================================"
echo "  LaunchAgent plists staged in $LAUNCH_DIR"
echo "================================================================"
ls -la "$LAUNCH_DIR"/com.csoai.*.plist 2>/dev/null
echo ""
echo "To enable, run each:"
for plist in "$LAUNCH_DIR"/com.csoai.*.plist; do
  echo "  launchctl load -w '$plist'"
done
echo ""
echo "(This script is lane-doable; the load commands are owner-gated.)"
