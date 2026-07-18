#!/usr/bin/env bash
# Unify sovereign memory: mirror the Care-Floor CLI store (~/.sovereign/*.jsonl) into the
# HTTP semantic store (:8100) so ONE memory is searchable by Claude Science / all tabs.
# Idempotent — the HTTP store dedupes by content_hash. Run anytime; add to cron if wanted.
KEY=$(cat ~/.sovereign/memory_api_key 2>/dev/null); [ -z "$KEY" ] && { echo "no memory key"; exit 1; }
curl -s -m4 http://127.0.0.1:8100/api/health >/dev/null 2>&1 || { echo "memory service down — run start-sovereign-memory.sh"; exit 1; }
python3 - "$KEY" <<'PY'
import sys,json,urllib.request,os,glob
key=sys.argv[1]; B="http://127.0.0.1:8100"
def post(p,b):
    r=urllib.request.Request(B+p,json.dumps(b).encode(),{'Content-Type':'application/json','Authorization':'Bearer '+key})
    try: return urllib.request.urlopen(r,timeout=15).status
    except: return 0
n=ok=0
for f in glob.glob(os.path.expanduser('~/.sovereign/*memory*.jsonl')):
    for line in open(f,encoding='utf-8',errors='ignore'):
        line=line.strip()
        if not line: continue
        try: d=json.loads(line)
        except: continue
        c=d.get('content') or d.get('memory') or d.get('text');  tags=d.get('tags') or ['sovereign']
        if not c: continue
        if isinstance(tags,str): tags=[tags]
        n+=1; ok+= (post('/api/memories',{'content':str(c)[:1500],'tags':tags[:8]})==200)
print(f"synced {ok}/{n} sovereign memories -> HTTP store")
PY
