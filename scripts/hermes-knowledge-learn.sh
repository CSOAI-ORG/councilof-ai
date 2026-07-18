#!/bin/bash
# Hermes knowledge-learn — rotates the FULL Sovereign Knowledge curriculum, one domain/day.
# Additive to governance-learn (does not touch it). Pulls real public feeds + queues a neutral
# synthesis prompt for the LLM runtime. Multi-faith neutral; contested → Council. Cron: 0 6 * * *
# Arch: MEOK_SOVEREIGN_KNOWLEDGE_HIVES.md
set -e
CUR=~/.hermes/knowledge-curriculum.json
CORPUS=~/.hermes/knowledge-corpus
LOG=~/.hermes/logs/knowledge-learn.log
mkdir -p "$CORPUS" ~/.hermes/logs
[ -f "$CUR" ] || { echo "no curriculum at $CUR" >> "$LOG"; exit 0; }

python3 - "$CUR" "$CORPUS" "$LOG" <<'PY'
import sys, json, datetime, urllib.request, re, os, ssl
cur, corpus, log = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    import certifi; _ctx = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _ctx = ssl.create_default_context(); _ctx.check_hostname = False; _ctx.verify_mode = ssl.CERT_NONE
doms = json.load(open(cur))["domains"]
now = datetime.datetime.now(datetime.timezone.utc)
doy = int(now.strftime("%j"))
d = doms[doy % len(doms)]
dom, feeds, prompt = d["domain"], d.get("feeds", []), d.get("prompt", "")
ts = now.isoformat()
lines = [f"===== {ts} — Knowledge: {dom} ====="]
items = []
for url in feeds:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MEOK-Hermes/1.0"})
        txt = urllib.request.urlopen(req, timeout=12, context=_ctx).read().decode("utf-8", "ignore")
        titles = re.findall(r"<title[^>]*>(?:<!\[CDATA\[)?([^<\]]+)", txt)[1:7]
        for t in titles:
            t = t.strip()
            if t:
                items.append(t[:140]); lines.append(f"  • {t[:140]}")
    except Exception as e:
        lines.append(f"  (feed unreachable: {url} — {e})")
if not feeds:
    lines.append("  (prompt-only domain — synthesis runs when the LLM runtime is live)")
# queue the neutral synthesis prompt for the runtime
lines.append(f"  PROMPT: {prompt}")
# write per-domain corpus file (the hive's raw material) + SIGIL-style digest stub
rec = {"ts": ts, "domain": dom, "items": items, "prompt": prompt}
open(os.path.join(corpus, f"{dom}.jsonl"), "a").write(json.dumps(rec) + "\n")
open(log, "a").write("\n".join(lines) + "\n")
print(f"knowledge-learn: {dom} — {len(items)} items gathered")
PY
