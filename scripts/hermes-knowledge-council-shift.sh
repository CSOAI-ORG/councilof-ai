#!/bin/bash
# hermes-knowledge-council-shift.sh
# Hermes shift: submit the latest learned knowledge to the BFT council for RATIFICATION
# before it's absorbed as sovereign knowledge. Enforces the non-negotiable requirement
# from MEOK_SOVEREIGN_KNOWLEDGE_HIVES: multi-faith-NEUTRAL, source-cited, bias-checked,
# contested topics → Council, every absorption SIGIL-signed.
#
# Complements hermes-council-audit-shift.sh (which audits *work*); this governs *learning*.
# Cron (daily, after the morning knowledge-learn): 0 7 * * * <this script>

set -uo pipefail
LOG=~/.hermes/logs/knowledge-council.log
CORPUS=~/.hermes/knowledge-corpus
COUNCIL_PY=/Users/nicholas/clawd/sovereign-temple/external_council_voice.py
mkdir -p ~/.hermes/logs

# load LLM keys for the external voices (cron has no env)
[ -f "$HOME/.zshrc" ] && eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI)_API_KEY=' "$HOME/.zshrc" 2>/dev/null || true)"

echo "[$(date '+%F %T')] knowledge-council shift" >> "$LOG"

# council must be reachable
if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health 2>/dev/null | grep -q 200; then
  echo "[skip] SOV3 council unreachable" >> "$LOG"; exit 0
fi

python3 - "$CORPUS" "$LOG" <<'PY'
import sys, os, json, glob
corpus, log = sys.argv[1], sys.argv[2]
sys.path.insert(0, "/Users/nicholas/clawd/sovereign-temple")

# gather the most-recent learning per domain
bundle, total = [], 0
for fp in sorted(glob.glob(os.path.join(corpus, "*.jsonl"))):
    try:
        last = None
        for line in open(fp):
            line = line.strip()
            if line: last = line
        if not last: continue
        rec = json.loads(last)
        items = rec.get("items", [])[:5]
        if items:
            bundle.append({"domain": rec.get("domain"), "n": len(rec.get("items", [])), "sample": items})
            total += len(rec.get("items", []))
    except Exception as e:
        print(f"  parse skip {fp}: {e}", file=open(log, "a"))

if not bundle:
    print("[skip] no knowledge to ratify", file=open(log, "a")); raise SystemExit(0)

domains = ", ".join(b["domain"] for b in bundle)
desc = ("Ratify newly-learned knowledge for absorption. REQUIRE: multi-faith-NEUTRAL, "
        "source-cited, bias-checked; reject/flag any non-neutral or unsourced claims; "
        "contested items escalate to full Council. Bundle:\n" + json.dumps(bundle, ensure_ascii=False)[:1800])

try:
    import external_council_voice as ecv
    pid = ecv.submit_proposal(
        title=f"[KNOWLEDGE] Ratify {total} learned items across: {domains}",
        description=desc,
        action_type="ratify_knowledge",
        action_params={"domains": [b["domain"] for b in bundle], "total_items": total},
    )
    print(f"[ok] submitted knowledge-ratification proposal {pid} ({total} items, {len(bundle)} domains)", file=open(log, "a"))
    print(f"submitted proposal {pid}: {total} items across {len(bundle)} domains")
except Exception as e:
    print(f"[fail] {type(e).__name__}: {e}", file=open(log, "a"))
    print(f"error: {e}")
PY
