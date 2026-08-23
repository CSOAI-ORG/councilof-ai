#!/bin/bash
# arena-scoreboard-sync.sh — pod-canonical publish of the signed per-axis leaderboard.
# Pulls the pod's arena_scoreboard.json and commits it to the monorepo surface so the
# public /api/arena/scoreboard endpoint serves it. Also writes it to the councilof-ai
# dist/signed/ so it can be statically served + verified.
#
# Pod-canonical: the sign is done ON the pod (estate key /workspace/arena_engine/key);
# this script only MOVES the already-signed artifact. Never re-signs on the Mac.
#
# Run from the worktree: bash ./scripts/arena-scoreboard-sync.sh
export PATH="/opt/homebrew/bin:$PATH"
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
A100_PORT=23166
A100_IP=38.128.232.57
REPO=/tmp/coai-arena-sync
STAGE=/tmp/arena-scoreboards
mkdir -p "$STAGE"
TS() { date +%FT%TZ; }
echo "$(TS) scoreboard-sync start" >> /tmp/arena-sync.log

# 1. Pull the signed scoreboard from the pod.
rsync -a --partial -e "ssh -i $KEY -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
  root@$A100_IP:/workspace/arena_scoreboard.json "$STAGE/arena_scoreboard.json" >> /tmp/arena-sync.log 2>&1
[ -f "$STAGE/arena_scoreboard.json" ] || { echo "$(TS) FAILED: no scoreboard pulled" >> /tmp/arena-sync.log; exit 1; }

# 2. Verify the content_id recomputes (the credibility gate) before publishing.
CID=$(python3 - "$STAGE/arena_scoreboard.json" <<'PY'
import json, sys, hashlib
d = json.load(open(sys.argv[1]))
sig = d.get("signature", {})
body = {k: v for k, v in d.items() if k != "signature"}
def canon(o):
    if isinstance(o, list): return "[" + ",".join(canon(x) for x in o) + "]"
    if isinstance(o, dict): return "{" + ",".join(json.dumps(str(k), ensure_ascii=True) + ":" + canon(o[k]) for k in sorted(o)) + "}"
    return json.dumps(o, ensure_ascii=True)
cid = hashlib.sha256(canon(body).encode()).hexdigest()
print(cid)
PY
)
EXPECT=$(python3 -c "import json;print(json.load(open('$STAGE/arena_scoreboard.json')).get('signature',{}).get('content_id',''))")
echo "$(TS) content_id computed=$CID expected=$EXPECT" >> /tmp/arena-sync.log
if [ "$CID" != "$EXPECT" ]; then
  echo "$(TS) CONTENT_ID MISMATCH — not publishing a broken scoreboard" >> /tmp/arena-sync.log
  exit 1
fi
echo "$(TS) content_id VERIFIED — pushing to repo surface" >> /tmp/arena-sync.log

# 3. Stage into the repo (a worktree to avoid touching another lane's checkout).
mkdir -p "$REPO" 2>/dev/null
cp "$STAGE/arena_scoreboard.json" "$REPO/public/signed/arena_scoreboard.json" 2>/dev/null \
  || (mkdir -p "$REPO/public/signed" && cp "$STAGE/arena_scoreboard.json" "$REPO/public/signed/arena_scoreboard.json")
echo "$(TS) staged to public/signed/arena_scoreboard.json" >> /tmp/arena-sync.log
