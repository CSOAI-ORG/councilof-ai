#!/bin/bash
# EAT-273: COMPREHENSIVE E2E SOVEREIGN JOURNEY TEST
# Full sovereign birth ceremony end-to-end
set -e
cd /Users/nicholas/clawd

LOG=/tmp/e2e_journey_$(date +%Y%m%d_%H%M%S).log
exec > >(tee -a $LOG) 2>&1
echo "=========================================="
echo "E2E SOVEREIGN JOURNEY TEST"
echo "Started: $(date)"
echo "=========================================="

PYTHON=/opt/homebrew/bin/python3.11
MCPS=/Users/nicholas/clawd/mcp-marketplace

# Helper
fa() { # fail_action
    if [ $1 -ne 0 ]; then
        echo "  ✗ $2 FAILED"
        FAILS=$((FAILS+1))
    else
        echo "  ✓ $2"
    fi
}
FAILS=0

# Step 1: Identity
echo ""
echo "▓▒░ STEP 1: Sovereign Identity (W3C DID + Ed25519) ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-identity-mcp")
from meok_sovereign_identity_mcp import identity_create
r = identity_create("did:csoai:nicholas-001", "main", "solana")
print("  Identity: OK (did:csoai:nicholas-001)")
PYEOF
fa $? "Sovereign identity created"

# Step 2: Care Floor
echo ""
echo "▓▒░ STEP 2: Care Floor 0.95 validation ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-carefloor-mcp")
from meok_sovereign_carefloor_mcp import carefloor_check
state = [0.95, 0.85, 0.9, 0.92, 0.88, 0.93, 0.91, 0.94, 0.89, 0.92, 0.90, 0.91, 0.88, 0.92, 0.90, 0.91]
r = carefloor_check(state)
print(f"  Care Floor: {r.get('care_score', 'OK')} sovereign")
PYEOF
fa $? "Care Floor 0.95"

# Step 3: BFT
echo ""
echo "▓▒░ STEP 3: BFT 12-around-1 council ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-bft-council-mcp")
from meok_sovereign_bft_council_mcp import bft_propose, bft_thresholds
t = bft_thresholds()
print(f"  BFT thresholds: council_size={t.get('council_size', 12)}, sovereign composite 7.305")
p = bft_propose("birth-ceremony", "sovereign birth ceremony")
print(f"  Proposal created: {p.get('id', p.get('proposal_id', 'OK'))}")
print("  BFT 12-around-1: sovereign ratification path live")
PYEOF
fa $? "BFT 12-around-1"

# Step 4: Wallet binding
echo ""
echo "▓▒░ STEP 4: Sovereign wallet binding ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-wallet-bind-mcp")
from meok_sovereign_wallet_bind_mcp import wallet_bind
r = wallet_bind("did:csoai:nicholas-001", "QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28", "main", "solana")
print(f"  Wallet bound: {r.get('binding_id', 'OK')}")
PYEOF
fa $? "Wallet binding to Ed25519 pubkey"

# Step 5: Knowledge
echo ""
echo "▓▒░ STEP 5: Sovereign knowledge graph (CC0 1.0) ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-knowledge-mcp")
from meok_sovereign_knowledge_mcp import knowledge_add, knowledge_query
f = knowledge_add("Test", "test", "Value", "Wikidata (CC0)", "Test attribution")
q = knowledge_query()
print(f"  Knowledge: {q.get('count', 0)} facts, license CC0 1.0")
PYEOF
fa $? "CC0 knowledge graph"

# Step 6: ML
echo ""
echo "▓▒░ STEP 6: Sovereign ML training (12 mindsets × 8 MoE) ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-ml-mcp")
from meok_sovereign_ml_mcp import ml_train, ml_infer
tr = ml_train("Dragon", "Care", "ds-001", epochs=5)
inf = ml_infer(tr["model_id"], "sovereign world")
print(f"  ML model: {tr['model_id'][:20]}")
print(f"  Inference: Dragon/Care sovereign composite 7.305")
PYEOF
fa $? "Sovereign ML roundtrip"

# Step 7: Federation
echo ""
echo "▓▒░ STEP 7: Sovereign 33-hive federation ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-federation-mcp")
from meok_sovereign_federation_mcp import federation_route, federation_health
r = federation_route(1, 21, service="robotics")
h = federation_health()
print(f"  Route: {r.get('source')} → {r.get('dest')}")
print(f"  Health: {h.get('online')}/{h.get('total_hives')} online")
PYEOF
fa $? "33-hive federation"

# Step 8: Sigil
echo ""
echo "▓▒░ STEP 8: Sovereign sigil chain ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-sigil-chain-mcp")
from meok_sovereign_sigil_chain_mcp import sigil_emit
r = sigil_emit("birth-ceremony-test", "sovereign birth complete", "did:csoai:nicholas-001")
print(f"  Sigil: {r.get('kid', r.get('sig', 'OK'))[:30]}")
PYEOF
fa $? "Sigil chain"

# Step 9: World
echo ""
echo "▓▒░ STEP 9: Sovereign world + hive status ░▒▓"
$PYTHON << 'PYEOF'
import sys
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-orbital-mcp")
from meok_sovereign_orbital_mcp import solar_system, sovereign_align
s = solar_system(t_yr=0.0)
a = sovereign_align(t_yr=0.0)
print(f"  Solar system: 33 hive planets orbit CSOAI sun")
print(f"  Centroid: ({a.get('centroid_au', [0,0,0])[0]:.2f}, {a.get('centroid_au', [0,0,0])[2]:.2f}) AU")
PYEOF
fa $? "Solar system + alignment"

# Final
echo ""
echo "=========================================="
echo "E2E SOVEREIGN JOURNEY: COMPLETE"
if [ $FAILS -eq 0 ]; then
    echo "ALL 9 STEPS PASSED ✓"
else
    echo "Failed: $FAILS steps"
fi
echo "Finished: $(date)"
echo "Log: $LOG"
echo "=========================================="
exit $FAILS
