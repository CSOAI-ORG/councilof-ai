#!/bin/bash
# SOV33 / DEFONEOS nightly benchmark cron v3.0
# Fluid heartbeat integration: sov-space tracker + docstore + adapter training + benchmarks + deploy
# Runs the expanded benchmark suite (125 tasks across 16 suites)
# Aligned with: Open LLM Leaderboard v2 + EleutherAI lm-evaluation-harness
# Tracks trends, writes SIGIL-anchored report, deploys to Vercel

set -euo pipefail
BASE="/Users/nicholas/clawd/csoai-static-deploy2"
BENCH="$BASE/benchmark-results"
SCRIPT="$BENCH/run_ollama_benchmark.py"
HEARTBEAT="$BENCH/sov4_fluid_heartbeat.py"
SOVSPACE="$BENCH/sov4_sovspace_tracker.py"
TRAINER="$BENCH/train_sovereign_adapter.py"
LOG="$BENCH/cron-nightly.log"
TRENDS="$BENCH/trends.json"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FREE_KB=$(df -Pk "$BASE" | awk 'NR==2 {print $4}')
MIN_FREE_KB=204800

echo "[$DATE] === SOV4 FLUID CRON v3 ===" >> "$LOG"

# Disk check
if [ "$FREE_KB" -lt "$MIN_FREE_KB" ]; then
    echo "[$DATE] FAILED: low disk ${FREE_KB}KB free (<${MIN_FREE_KB}KB)" >> "$LOG"
    exit 1
fi

# Step 1: Sov-space heartbeat
echo "[$DATE] Step 1: sov-space heartbeat" >> "$LOG"
python3 "$SOVSPACE" heartbeat >> "$LOG" 2>&1 || echo "[$DATE] sovspace WARN" >> "$LOG"

# Step 2: Check invariants
echo "[$DATE] Step 2: invariants check" >> "$LOG"
python3 "$SOVSPACE" invariants >> "$LOG" 2>&1

# Step 3: Model availability + training
echo "[$DATE] Step 3: model check" >> "$LOG"
if ! ollama list 2>/dev/null | grep -q "sov33-master-v2"; then
    echo "[$DATE] sov33-master-v2 missing, rebuilding..." >> "$LOG"
    python3 "$TRAINER" --specs master general_ability >> "$LOG" 2>&1 || true
fi

# Step 4: Fluid heartbeat (docstore → train if needed → bench → sigil)
echo "[$DATE] Step 4: fluid heartbeat" >> "$LOG"
python3 "$HEARTBEAT" >> "$LOG" 2>&1 && echo "[$DATE] heartbeat OK" >> "$LOG" || echo "[$DATE] heartbeat WARN" >> "$LOG"

# Step 5: Ensure benchmarks ran
echo "[$DATE] Step 5: verify benchmarks" >> "$LOG"
cd "$BENCH"
LATEST=$(find . -maxdepth 1 -type f -name 'benchmark_registry_*.json' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
if [ -n "$LATEST" ] && [ -f "$LATEST" ]; then
    cp "$LATEST" "$BASE/benchmark-results-public.json"
    echo "[$DATE] benchmarks: $(python3 -c "import json; d=json.load(open('$LATEST')); [print(f'{m}: {r.get(\"summary\",{}).get(\"composite_pct\",0):.0f}%') for m,r in d.get('models',{}).items()]" 2>/dev/null)" >> "$LOG"

    # Trend tracking
    python3 -c "
import json
tr = {}
try:
    with open('$TRENDS') as f: tr = json.load(f)
except: pass
with open('$LATEST') as f: d = json.load(f)
for model, r in d.get('models', {}).items():
    s = r.get('summary', {})
    if not s: continue
    tr.setdefault(model, []).append({
        'date': d.get('timestamp', '$DATE'),
        'composite_pct': s.get('composite_pct', 0),
        'tasks_tested': s.get('tasks_tested', 0),
        'tasks_passed': s.get('tasks_passed', 0),
        'median_latency_ms': s.get('median_latency_ms', 0),
    })
    tr[model] = tr[model][-30:]
with open('$TRENDS', 'w') as f:
    json.dump(tr, f, indent=2)
for model, entries in tr.items():
    if len(entries) >= 2:
        prev = entries[-2]['composite_pct']
        curr = entries[-1]['composite_pct']
        drop = prev - curr
        if drop > 5:
            print(f'WARN: {model} dropped {drop:.1f}% ({prev:.1f} -> {curr:.1f})')
" >> "$LOG" 2>&1

    # Deploy
    echo "[$DATE] deploying to Vercel..." >> "$LOG"
    if vercel deploy --prod --yes >> "$LOG" 2>&1; then
        echo "[$DATE] deploy OK" >> "$LOG"
    else
        echo "[$DATE] deploy FAILED" >> "$LOG"
    fi
fi
echo "[$DATE] === CRON COMPLETE ===" >> "$LOG"
