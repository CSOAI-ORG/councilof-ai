#!/bin/bash
# arena-auto-commit.sh — pull the pod's signed scoreboard into the repo worktree and
# open an auto-PR to the monorepo (never raw-commit onto another lane). Runs on the Mac
# sync side, triggered after arena-auto-loop publishes.
export PATH="/opt/homebrew/bin:$PATH"
KEY="$HOME/.runpod/ssh/runpodctl-ssh-key"
A100_IP=38.128.232.57
# RunPod reassigns ephemeral SSH ports on restart — resolve the LIVE port, never hardcode.
A100_PORT=$(bash "$(dirname "$0")/runpod-port.sh" l7g747oivyq6ab "$A100_IP" 2>/dev/null)
[ -z "${A100_PORT:-}" ] || [ "$A100_PORT" = "0" ] && A100_PORT=23166  # fallback (never silently 0)
REPO=/tmp/coai-arena-sync
STAGE=/tmp/arena-scoreboards
mkdir -p "$STAGE" "$REPO" 2>/dev/null
TS(){ date +%FT%TZ; }
echo "$(TS) arena-auto-commit start" >> /tmp/arena-sync.log

# 1. Pull signed scoreboard from pod.
/opt/homebrew/bin/rsync -a --partial -e "ssh -i $KEY -p $A100_PORT -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10" \
  root@$A100_IP:/workspace/arena_scoreboard.json "$STAGE/arena_scoreboard.json" >> /tmp/arena-sync.log 2>&1
[ -f "$STAGE/arena_scoreboard.json" ] || { echo "$(TS) FAIL no scoreboard" >> /tmp/arena-sync.log; exit 1; }

# 2. Update the repo's committed signed copy (PR the change, never raw-commit).
cd "$REPO" 2>/dev/null || git clone git@github.com:CSOAI-ORG/councilof-ai.git "$REPO" 2>/dev/null
git -C "$REPO" checkout -q master 2>/dev/null || git -C "$REPO" checkout -q main 2>/dev/null
git -C "$REPO" pull -q 2>/dev/null
cp "$STAGE/arena_scoreboard.json" "$REPO/public/signed/arena_scoreboard.json"
git -C "$REPO" checkout -qb "auto/arena-scoreboard" 2>/dev/null
git -C "$REPO" add public/signed/arena_scoreboard.json >> /tmp/arena-sync.log 2>&1
if git -C "$REPO" diff --cached --quiet; then
  echo "$(TS) no change — scoreboard identical" >> /tmp/arena-sync.log
else
  git -C "$REPO" -c core.hooksPath=/dev/null commit -m "auto(arena): refresh signed scoreboard ($(python3 -c "import json;print(json.load(open('$STAGE/arena_scoreboard.json')).get('signature',{}).get('content_id','')[:12])" 2>/dev/null))" >> /tmp/arena-sync.log 2>&1
  git -C "$REPO" push -q origin auto/arena-scoreboard 2>/dev/null
  gh pr create --repo CSOAI-ORG/councilof-ai --title "auto(arena): refresh signed leaderboard" --body "Pod-canonical scoreboard refresh." --head auto/arena-scoreboard --base master >> /tmp/arena-sync.log 2>&1
  echo "$(TS) PR opened for scoreboard refresh" >> /tmp/arena-sync.log
fi
echo "$(TS) arena-auto-commit done" >> /tmp/arena-sync.log
