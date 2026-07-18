#!/bin/bash
# Restart the UE5 → SOV3 bridge with MEOK WORM added
pkill -f ue5_to_sov3_bridge.py 2>/dev/null
sleep 2
cd ~/clawd/ue5_bridge
PYTHONPATH=/Users/nicholas/clawd/mcp-marketplace:/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-passport-mcp:...P/usr/lib/python3.11/site-packages /opt/homebrew/bin/python3.11 ue5_to_sov3_bridge.py
