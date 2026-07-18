#!/bin/bash
# SOV3 Overnight Sprint — runs in background for 12 hours
# Each cycle: 12 intelligence loops every 15 min = 48 cycles in 12h = 576 ops

cd /Users/nicholas/clawd/sovereign-temple
python3 sov3_overnight_sprint.py 2>&1 | tee /tmp/sov3-overnight.log