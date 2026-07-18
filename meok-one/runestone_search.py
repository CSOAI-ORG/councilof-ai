import json
from pathlib import Path
LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")
def search(query, limit=10):
    if not LEDGER.exists(): return []
    q = query.lower()
    out = []
    for line in LEDGER.read_text().strip().splitlines()[-200:]:
        try:
            r = json.loads(line).get("runestone", {})
            text = (r.get("query", "") + " " + str(r.get("response", ""))).lower()
            if q in text:
                out.append({
                    "sigil": r.get("sigil", "?")[:16],
                    "mode": r.get("mode", "1-brain"),
                    "query": r.get("query", "")[:80],
                    "score": r.get("metadata", {}).get("score", r.get("consensus", {}).get("score", 0)),
                })
                if len(out) >= limit: break
        except: pass
    return out
if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "EU AI Act"
    print(json.dumps(search(q), indent=2))
