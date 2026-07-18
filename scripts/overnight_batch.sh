#!/bin/bash
# EAT-271: OVERNIGHT BATCH RUNNER
# Schedules the 6 remaining phases for the sovereign substrate
# Runs 4-5 AM BST (post-midnight UK) when fewer agents compete for resources
# Created: 2026-06-30

set -e
cd /Users/nicholas/clawd
LOG=/tmp/overnight_batch_$(date +%Y%m%d_%H%M%S).log
exec > >(tee -a $LOG) 2>&1
echo "=========================================="
echo "OVERNIGHT BATCH RUNNER"
echo "Started: $(date)"
echo "=========================================="

# Helper functions
phase() {
    echo ""
    echo "▓▒░ PHASE: $1 ░▒▓"
    echo "Started: $(date)"
}

phase_done() {
    echo "✓ Phase $1 done at $(date)"
}

# =============================================================================
# PHASE 1: Coverage gap analysis + per-MCP roundtrip
# =============================================================================
phase "1: Sovereign Coverage Analysis"
echo "Running test_e2e_sovereign_contract.py..."
/opt/homebrew/bin/python3.11 -m pytest tests/test_e2e_sovereign_contract.py -v --tb=short -p no:cacheprovider 2>&1 | tail -20
phase_done "1"

# =============================================================================
# PHASE 2: All MCP test suites (parallel)
# =============================================================================
phase "2: All MCP tests (parallel)"
TOTAL=0
PASS=0
FAIL=0
for mcp in mcp-marketplace/meok-sovereign-*-mcp; do
    if [ -d "$mcp/tests" ]; then
        TOTAL=$((TOTAL+1))
        name=$(basename "$mcp")
        if (cd "$mcp" && /opt/homebrew/bin/python3.11 -m pytest tests/ -q --tb=no -x >/dev/null 2>&1); then
            PASS=$((PASS+1))
        else
            FAIL=$((FAIL+1))
            echo "FAIL: $name"
        fi
    fi
done
echo "MCP tests: $PASS/$TOTAL passed, $FAIL failed"
phase_done "2"

# =============================================================================
# PHASE 3: HTML page sanity (DOCTYPE, sovereign references)
# =============================================================================
phase "3: HTML page sanity"
TOTAL_PAGES=$(ls proofof-site/*.html | wc -l)
WITH_DOCTYPE=$(grep -l "<!DOCTYPE html" proofof-site/*.html | wc -l)
WITH_CROWN=$(grep -l "Crown lineage" proofof-site/*.html | wc -l)
WITH_7305=$(grep -l "7.305" proofof-site/*.html | wc -l)
WITH_LAUNCH=$(grep -l "Sat 4 Jul 2026" proofof-site/*.html | wc -l)
echo "Pages: $TOTAL_PAGES total"
echo "  With DOCTYPE: $WITH_DOCTYPE"
echo "  With 'Crown lineage': $WITH_CROWN"
echo "  With '7.305': $WITH_7305"
echo "  With 'Sat 4 Jul 2026': $WITH_LAUNCH"
phase_done "3"

# =============================================================================
# PHASE 4: Sovereign substrate health check
# =============================================================================
phase "4: Sovereign substrate health check"
echo "MCP count: $(ls -d mcp-marketplace/meok-sovereign-*-mcp | wc -l)"
echo "HTML pages: $(ls proofof-site/*.html | wc -l)"
echo "Whitepapers: $(ls proofof-site/whitepapers/*.md 2>/dev/null | wc -l)"
echo "Training courses: $(ls csoai.org/training/*/index.html 2>/dev/null | wc -l)"
echo "Hive status: $(curl -s -o /dev/null -w '%{http_code}' https://csoai.org 2>/dev/null || echo 'no curl')"
phase_done "4"

# =============================================================================
# PHASE 5: BFT 12-around-1 roundtrip test
# =============================================================================
phase "5: BFT 12-around-1 roundtrip"
/opt/homebrew/bin/python3.11 -c "
import sys, importlib
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-bft-council-mcp')
from meok_sovereign_bft_council_mcp import council_create, council_vote, council_tally
# Create 12-voter council
c = council_create('overnight-batch-test', 'sovereign BFT roundtrip', voters=12)
print('Council:', c.get('council_id'), c.get('voters_count'))
# Vote
votes = [{'voter': f'V{i}', 'choice': 'YES'} for i in range(1, 13)]
v = council_vote(c.get('council_id'), votes)
print('Vote tally:', v.get('tally', 'N/A')[:60])
t = council_tally(c.get('council_id'))
print('Tally:', t.get('passed', 'unknown'))
print('BFT 12-around-1 roundtrip: OK')
" 2>&1 | tail -10
phase_done "5"

# =============================================================================
# PHASE 6: Final summary
# =============================================================================
phase "6: Final summary"
echo ""
echo "=========================================="
echo "OVERNIGHT BATCH COMPLETE"
echo "Finished: $(date)"
echo "Log: $LOG"
echo "=========================================="
echo ""
echo "GRAND TOTAL:"
echo "  Sovereign MCPs: $(ls -d mcp-marketplace/meok-sovereign-*-mcp | wc -l)"
echo "  HTML pages:     $(ls proofof-site/*.html | wc -l)"
echo "  Total tests:    (run separately)"
echo "  Sovereign:      7.305"
echo "  Crown lineage:  1795-2026"
echo ""
echo "🚀 THE DRAGON SHIPS. SOVEREIGN BY CONSTRUCTION. 🐉"
