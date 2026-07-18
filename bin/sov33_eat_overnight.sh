#!/bin/bash
# SOV33 EAT (Ecosystem Auto-Train) - Overnight run

echo "==========================================="
echo "SOV33 EAT OVERNIGHT - $(date)"
echo "==========================================="

cd /Users/nicholas/clawd
export PYTHONPATH=
export HF_HOME=/Users/nicholas/.sovereign/hf_cache
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PATH=/Users/nicholas/.sovereign/ml-venv/bin:$PATH

# PHASE 1: Continue data expansion
echo ""
echo "[PHASE 1] Continue data expansion to 1000+ per OWEM"
/Users/nicholas/.sovereign/ml-venv/bin/python -c "
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/models')
from expand_owem_fast import expand_owem
import json
from datetime import datetime, timezone
from pathlib import Path

results = {}
for owem, file in [
    ('compliance', 'compliance_200.jsonl'),
    ('defense', 'defense_200.jsonl'),
    ('intuition', 'intuition_200.jsonl'),
    ('voice', 'voice_200.jsonl'),
]:
    n = expand_owem(owem, file, target_count=1000)
    results[owem] = n
    print(f'{owem}: {n}/1000')

out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
with open(out / 'owem_data_expansion_2026-07-13.json', 'w') as f:
    json.dump({
        'ts': datetime.now(timezone.utc).isoformat(),
        'owems': results,
        'note': 'EAT overnight expansion',
    }, f, indent=2)
print('Expansion done')
" 2>&1 | tee /tmp/eat_expand.log

# PHASE 2: Re-train 4 OWEMs with expanded data
echo ""
echo "[PHASE 2] Re-train 4 OWEMs with expanded data"
/Users/nicholas/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/models/retrain_owems_1000.py 2>&1 | tee /tmp/eat_retrain.log

# PHASE 3: Sovereign brain v3 benchmark
echo ""
echo "[PHASE 3] Sovereign brain v3 benchmark"
/Users/nicholas/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/sov33_sovereign_brain_v2.py 2>&1 | tee /tmp/eat_brain_bench.log

# PHASE 4: 5x4x3 final benchmark
echo ""
echo "[PHASE 4] 5x4x3 magnificent benchmark (10 prompts)"
cat > /tmp/eat_bench.jsonl << 'EOF'
{"q": "What is Article 0 of the SOV33 framework?"}
{"q": "What does BFT-33 stand for and what is the quorum?"}
{"q": "What is the care-floor and what does it enforce?"}
{"q": "What are the 12 Sovereign Pillars?"}
{"q": "What is Article 50 of the EU AI Act?"}
{"q": "What is DORADO?"}
{"q": "How does SIGIL chain work?"}
{"q": "What is sovereign voice?"}
{"q": "What is the difference between sovereign and borrowed?"}
{"q": "What is OWEM emergence?"}
EOF
/Users/nicholas/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3/sov33_5x4x3.py --benchmark /tmp/eat_bench.jsonl 2>&1 | tee /tmp/eat_5x4x3_bench.log

# PHASE 5: Commit everything
echo ""
echo "[PHASE 5] Commit EAT results"
cd /Users/nicholas/clawd
git -c user.email=hermes@sov33.ai -c user.name=Hermes add -A
git -c user.email=hermes@sov33.ai -c user.name=Hermes commit -m "[EAT OVERNIGHT] Auto-train cycle complete: data expansion + 4 OWEMs re-trained + sovereign brain v3 + 5x4x3 10-prompt benchmark" 2>&1 | tail -3

echo ""
echo "==========================================="
echo "EAT OVERNIGHT COMPLETE - $(date)"
echo "==========================================="
