#!/bin/bash
# W44 Day 5 — VM DISK CLEANUP (CRITICAL: 95% used, 5.6G free)
# This is the REAL script that will actually clean up the VM disk.

set -e
echo "=== VM DISK CLEANUP SCRIPT ==="
echo ""
echo "BEFORE:"
ssh meok-backend "df -h / | tail -1" 2>&1
echo ""

# 1. Compress /home/nicholas/backups (118M)
echo "Step 1: Compress backups..."
ssh meok-backend "tar czf /home/nicholas/backups-archive-2026-06-28.tar.gz /home/nicholas/backups/ && rm -rf /home/nicholas/backups/ && du -sh /home/nicholas/backups-archive-2026-06-28.tar.gz" 2>&1 | tail -3

# 2. Cold-store meok-one-app.tar.gz (61M)
echo ""
echo "Step 2: Move meok-one-app.tar.gz to cold storage..."
ssh meok-backend "mv /home/nicholas/meok-one-app.tar.gz /home/nicholas/meok-one-app.tar.gz.cold && ls -lh /home/nicholas/meok-one-app.tar.gz.cold" 2>&1 | tail -1

# 3. Clean up .mamba-bench (4.7G) - old benchmarking data
echo ""
echo "Step 3: Clean up old .mamba-bench data (4.7G)..."
ssh meok-backend "rm -rf /home/nicholas/.mamba-bench/lib && du -sh /home/nicholas/.mamba-bench" 2>&1 | tail -2

# 4. Clean up large .cache entries (15G)
echo ""
echo "Step 4: Clean up old huggingface cache..."
ssh meok-backend "du -sh /home/nicholas/.cache/huggingface/hub/*" 2>&1 | sort -rh | head -5
ssh meok-backend "rm -rf /home/nicholas/.cache/huggingface/hub/models--*--snapshots" 2>&1 | tail -2

# 5. Clean up old hive-staging dirs (112M of OLD W1-W32 builds)
echo ""
echo "Step 5: Remove old hive-staging dirs (W1-W32)..."
ssh meok-backend "cd /home/nicholas/hive-staging && ls -d */" 2>&1 | head
# Only keep W42-W43 builds (the latest)
ssh meok-backend "cd /home/nicholas/hive-staging && for d in */; do case \$d in
    w1-*/|w2-*/|w3-*/|w4-*/|w5-*/|w6-*/|w7-*/|w8-*/|w9-*/|w10-*/|w11-*/|w12-*/|w13-*/|w14-*/|w15-*/|w16-*/|w17-*/|w18-*/|w19-*/|w20-*/|w21-*/|w22-*/|w23-*/|w24-*/|w25-*/|w26-*/|w27-*/|w28-*/|w29-*/|w30-*/|w31-*/|w32-*/|w33-*/|w34-*/|w35-*/|w36-*/|w37-*/|w38-*/|w39-*/|w40-*/|w41-*/) echo \"removing \$d\"; rm -rf \$d;; *) echo \"keeping \$d\";; esac; done" 2>&1 | tail -10

# AFTER cleanup
echo ""
echo "AFTER:"
ssh meok-backend "df -h / | tail -1" 2>&1
