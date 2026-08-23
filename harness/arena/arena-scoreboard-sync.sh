#!/bin/bash
# arena-scoreboard-sync.sh — pull the signed scoreboard off the pod, verify content_id,
# and stage to the repo surface.
export PATH="/opt/homebrew/bin:$PATH"
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
A100_PORT=23166; A100_IP=38.128.232.57
STAGE=/tmp/arena-scoreboards
mkdir -p "$STAGE"
TS(){ date -u +%FT%TZ; }
echo "$(TS) scoreboard-sync start" >> /tmp/arena-sync.log
rsync -a --partial -e "ssh -i $KEY -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
  root@$A100_IP:/tmp/arena_scoreboard.json "$STAGE/arena_scoreboard.json" >> /tmp/arena-sync.log 2>&1
[ -s "$STAGE/arena_scoreboard.json" ] || { echo "$(TS) FAILED: no scoreboard pulled" >> /tmp/arena-sync.log; exit 1; }
CID=$(python3 - "$STAGE/arena_scoreboard.json" <<'PY'
import json,sys,hashlib,math
d=json.load(open(sys.argv[1]))
def _norm(o):
    if isinstance(o,float):
        if o.is_integer(): return int(o)
        return o
    if isinstance(o,dict): return {k:_norm(v) for k,v in o.items()}
    if isinstance(o,list): return [_norm(v) for v in o]
    return o
def cjson(o): return json.dumps(_norm(o),sort_keys=True,separators=(',',':'),ensure_ascii=False)
body={k:v for k,v in d.items() if k!='signature'}
print(hashlib.sha256(cjson(body).encode()).hexdigest())
PY
)
EXPECT=$(python3 -c "import json;print(json.load(open('$STAGE/arena_scoreboard.json')).get('signature',{}).get('content_id',''))")
echo "$(TS) computed=$CID expected=$EXPECT" >> /tmp/arena-sync.log
[ "$CID" = "$EXPECT" ] || { echo "$(TS) CONTENT_ID MISMATCH — not publishing" >> /tmp/arena-sync.log; exit 1; }
echo "$(TS) content_id VERIFIED" >> /tmp/arena-sync.log
