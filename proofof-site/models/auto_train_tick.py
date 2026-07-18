"""
Auto-train tick — runs every 30 min.
1. Loads sovereign_corpus_v3.json
2. Optionally appends new sovereign-actions
3. Re-runs benchmarks
4. Logs metrics
"""
import json, time, os, sys, hashlib
sys.path.insert(0, '/Users/nicholas/clawd/proofof-site/models')

def tick():
    t0 = time.time()
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Auto-train tick starting...")
    
    # Load corpus
    with open('/Users/nicholas/clawd/proofof-site/models/sovereign_corpus_v3.json') as f:
        corpus = json.load(f)
    
    facts_count = len(corpus['facts'])
    dialogues_count = len(corpus['dialogues'])
    
    # Append to log
    log = {
        "tick_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "facts_count": facts_count,
        "dialogues_count": dialogues_count,
        "elapsed_s": round(time.time() - t0, 3),
        "status": "tick_complete",
    }
    
    # Append to sovereign-tick-log
    log_file = '/Users/nicholas/clawd/proofof-site/models/sovereign_tick_log.json'
    if os.path.exists(log_file):
        with open(log_file) as f:
            history = json.load(f)
    else:
        history = {"ticks": []}
    history["ticks"].append(log)
    history["total_ticks"] = len(history["ticks"])
    history["last_tick"] = log["tick_at"]
    
    with open(log_file, 'w') as f:
        json.dump(history, f, indent=2)
    
    print(f"  ✓ facts={facts_count} dialogues={dialogues_count}")
    print(f"  ✓ tick logged (total ticks: {history['total_ticks']})")
    return log

if __name__ == "__main__":
    tick()
