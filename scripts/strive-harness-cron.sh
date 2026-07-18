#!/bin/bash
# SOV3 Striving Harness cron entry — runs every 5 min
# Cron line: */5 * * * * /Users/nicholas/clawd/scripts/strive-harness-cron.sh >> /tmp/strive-harness.log 2>&1

cd /Users/nicholas/clawd/sovereign-temple
python3 sov3_strive_harness.py once 2>&1 | head -20