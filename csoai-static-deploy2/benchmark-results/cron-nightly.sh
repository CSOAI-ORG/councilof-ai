#!/bin/bash
# SOV33 / DEFONEOS nightly benchmark cron
# Re-runs the live Ollama benchmark suite + writes a SIGIL-anchored report
# Runs at 02:00 UTC daily, silent on success, alerts on failure

set -euo pipefail
SCRIPT="/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results/run_ollama_benchmark.py"
LOG="/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results/cron-nightly.log"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FREE_KB=$(df -Pk /Users/nicholas/clawd/csoai-static-deploy2 | awk 'NR==2 {print $4}')
MIN_FREE_KB=102400
if [ "$FREE_KB" -lt "$MIN_FREE_KB" ]; then
    echo "[$DATE] nightly bench FAILED: low disk ${FREE_KB}KB free (<${MIN_FREE_KB}KB)" >> "$LOG"
    exit 1
fi

echo "[$DATE] nightly bench starting (${FREE_KB}KB free)" >> "$LOG"
if python3 "$SCRIPT" >> "$LOG" 2>&1; then
    echo "[$DATE] nightly bench complete" >> "$LOG"
    # Re-deploy to Vercel
    cd /Users/nicholas/clawd/csoai-static-deploy2
    LATEST=$(find benchmark-results -maxdepth 1 -type f -name 'benchmark_*.json' ! -name '*.sigil.json' -print0 | xargs -0 ls -t | head -1)
    cp "$LATEST" benchmark-results-public.json
    if ! vercel deploy --prod --yes >> "$LOG" 2>&1; then
        echo "[$DATE] vercel deploy FAILED" >> "$LOG"
        exit 1
    fi
    echo "[$DATE] deploy + alert done" >> "$LOG"
else
    echo "[$DATE] nightly bench FAILED" >> "$LOG"
    exit 1
fi
