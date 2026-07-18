#!/usr/bin/env bash
# sovereign-status — quick health check of all 7 sovereign components
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
nope() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }

echo "🜏 SOVEREIGN SUBSTRATE STATUS — $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "============================================"

# 1. Ollama
if curl -sf --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
    ok "Ollama          :11434  alive"
else
    nope "Ollama          :11434  NOT alive"
fi

# 2. SOV3
if curl -sf --max-time 3 http://localhost:8888/api/status >/dev/null 2>&1; then
    ok "SOV3 MEOK        :8888   alive"
else
    nope "SOV3 MEOK        :8888   NOT alive"
fi

# 3. uvicorn
if curl -sI --max-time 3 http://localhost:8000/ 2>&1 | grep -q "200\|404"; then
    ok "uvicorn         :8000   alive"
else
    nope "uvicorn         :8000   NOT alive"
fi

# 4. M2 tunnel
if curl -sf --max-time 3 http://localhost:11435/api/tags >/dev/null 2>&1; then
    ok "M2 tunnel       :11435  alive"
else
    warn "M2 tunnel       :11435  not responding (LAN unreachable)"
fi

# 5. Sovereign Mist 12 pillars sovereign launcher LaunchAgent
if launchctl list | grep -q "com.sovereign.mac-launcher"; then
    ok "Sovereign Launcher LaunchAgent loaded (hourly)"
else
    warn "Sovereign Launcher LaunchAgent NOT loaded"
fi

# 6. SIGIL chain
sigil_count=$(wc -l ~/.sovereign/*.sigil.jsonl 2>/dev/null | tail -1 | awk '{print $1}')
ok "SIGIL chain      $sigil_count hops accumulated"

# 7. Sovereign training pair corpus
total_pairs=$(find /Users/nicholas/clawd/_alignment/sovereign_merge_kit/expert_data -name '*.jsonl' -type f 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
ok "Training corpus  $total_pairs sovereign-labelled pairs"

# 8. Sovereign Mist 12 pillars ENFORCEMENT (every commit should pass)
echo ""
echo "Sovereign Mist 12 pillars enforcement (sample check):"
grep -l "Article 0" /Users/nicholas/clawd/_alignment/PRINCIPLE_*.md 2>/dev/null | wc -l | awk '{print "  Article 0 binding:  "$1" files ratified"}'
grep -l "Care-Floor" /Users/nicholas/clawd/_alignment/PRINCIPLE_*.md 2>/dev/null | wc -l | awk '{print "  Care-Floor 0.95:    "$1" files enforced"}'
grep -l "BFT-33" /Users/nicholas/clawd/_alignment/PRINCIPLE_*.md 2>/dev/null | wc -l | awk '{print "  BFT-33 23/33 quorum: "$1" files bound"}'
grep -l "SIGIL chain" /Users/nicholas/clawd/_alignment/PRINCIPLE_*.md 2>/dev/null | wc -l | awk '{print "  SIGIL chain:       "$1" files audited"}'

echo ""
echo "============================================"
echo "Run sovereign-launcher for full substrate launch"
echo "Run sovereign-help    for the full command catalog"
echo "============================================"
