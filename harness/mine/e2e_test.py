#!/usr/bin/env python3
"""E2E 100/100 scoreboard — probes all 18 surfaces, emits scores + report.
Wired into the overnight supervisor: every cycle re-tests, the matrix scores update."""
import json, os, subprocess, urllib.request
from datetime import datetime, timezone

SURFACES = [
    ("councilof.ai/", "https://councilof.ai/"), ("did.json", "https://csoai.org/.well-known/did.json"),
    ("banks-manifest", "https://csoai.org/banks-manifest.json"), ("llms.txt", "https://csoai.org/llms.txt"),
    ("health", "https://csoai.org/api/health"), ("gspc", "https://councilof.ai/api/gspc"),
    ("reported", "https://councilof.ai/api/reported"), ("badge", "https://councilof.ai/api/badge"),
    ("arena-feed", "https://councilof.ai/api/sov-arena/rounds.jsonl"), ("agent-card", "https://councilof.ai/.well-known/agent-card.json"),
    ("mcp.json", "https://csoai.org/.well-known/mcp.json"),
    ("scitt.json", "https://councilof.ai/.well-known/scitt.json"),
    ("ag-ui", "https://councilof.ai/ag-ui"),
    ("library-academy", "https://councilof.ai/library/academy"), ("hf-org", "https://huggingface.co/api/models?author=csoai&limit=1"),
    ("zenodo-1", "https://zenodo.org/records/21991105"), ("zenodo-2", "https://zenodo.org/records/22011165"),
    ("openalex-propag", "https://api.openalex.org/works?filter=doi:10.5281/zenodo.21991105"),
]

def probe(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "csoai-e2e/0.1"})
        r = urllib.request.urlopen(req, timeout=15)
        return r.status, len(r.read())
    except Exception as e:
        return None, str(e)[:60]

results = {}
for name, url in SURFACES:
    st, extra = probe(url)
    results[name] = {"url": url, "status": st, "detail": extra}

# OpenAlex special: count
try:
    d = json.loads(probe("https://api.openalex.org/works?filter=doi:10.5281/zenodo.21991105")[1]) if False else None
except Exception:
    pass
oa = results.get("openalex-propag", {})
if oa.get("status") == 200:
    try:
        req = urllib.request.Request(results["openalex-propag"]["url"], headers={"User-Agent": "csoai-e2e/0.1"})
        d = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
        results["openalex-propag"]["indexed"] = d.get("meta", {}).get("count", 0)
    except Exception as e:
        results["openalex-propag"]["indexed"] = f"err {str(e)[:40]}"

ok = sum(1 for v in results.values() if v.get("status") == 200)
doc = {"kind": "e2e-scoreboard", "ts": datetime.now(timezone.utc).isoformat(),
       "surfaces": results, "ok": ok, "total": len(results),
       "score_pct": round(100 * ok / len(results))}
json.dump(doc, open(os.path.expanduser("~/.grokbot/harness/mine/e2e-scores.json"), "w"), indent=2)
print(f"E2E: {ok}/{len(results)} surfaces 200 ({round(100*ok/len(results))}%)")
for n, v in results.items():
    if v.get("status") != 200:
        print(f"  NOT-200: {n} -> {v.get('status')} {str(v.get('detail'))[:50]}")
