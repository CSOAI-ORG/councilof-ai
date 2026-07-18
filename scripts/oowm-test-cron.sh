#!/bin/bash
# SOV3 OOWM CONSTANT TESTER — runs every 30 min
# Tests the entire OOWM: Mamba + MoE + MOM + Sigil + Federation + OL + World model

cd /Users/nicholas/clawd/sovereign-temple
python3 sov3_oowm_tester.py 2>&1 | tee /tmp/oowm-tester.log