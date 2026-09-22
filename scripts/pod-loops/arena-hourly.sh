#!/usr/bin/env bash
# arena-hourly.sh — ONE honest arena round -> Elo reference -> per-axis signals -> branch.
# NOT registered in loops/scheduler.sh (2026-09-22): run by hand until the owner registers it.
#   one round  : --games N games between two Ollama models on ONE frozen bank (deterministic
#                first-label grader), appended to public/arena/rounds.jsonl with provenance
#   elo        : scripts/arena/elo_reference.py over the whole rounds file (board-signed envelope)
#   signals    : scripts/emit_signals.py --pod-token-file (did:web:csoai.org#board-attestation-1)
#   branch     : arena/auto-<UTC hour>, pushed to the bare repo; never merged here
#   receipt    : one line in $RECEIPTS. Absence of a line = the loop did not run.
# Shares the GPU with the mill; never kills anything. Exit non-zero on any gate failure.
set -euo pipefail
export PATH=/workspace/tools/node/bin:$PATH
LANE=/workspace/ci/arena-lane
BARE=/workspace/git/councilof-ai.git
OUTROOT=/workspace/lanes/out/arena-hourly
RECEIPTS=/workspace/lanes/logs/arena-hourly.log
TOKEN=/workspace/secrets/board-sign-pod-token
BANK_AXIS=${BANK_AXIS:-gov}
BANK_URL=${BANK_URL:-https://huggingface.co/datasets/csoai/gspc-${BANK_AXIS}/resolve/main/items.jsonl}
MODELS=${MODELS:-mistral:7b,gemma3:12b}
GAMES=${GAMES:-12}
HOUR=$(date -u +%Y%m%dT%H)
RUN=$OUTROOT/$HOUR
mkdir -p "$RUN" "$(dirname "$RECEIPTS")"
TS(){ date -u +%FT%TZ; }
fail(){ echo "$(TS) FAIL $HOUR $*" >> "$RECEIPTS"; exit 1; }

[ -f "$TOKEN" ] || fail "no board-sign token"
curl -s 127.0.0.1:11434/api/tags >/dev/null || fail "ollama down"
cd "$LANE"
git fetch -q origin || fail "fetch"
git checkout -q -B "arena/auto-$HOUR" origin/master || fail "checkout"

# 1. frozen bank, pinned by bytes (the HF commit is recorded from the response header)
curl -sL --max-time 120 "$BANK_URL" -o "$RUN/bank.items.jsonl" || fail "bank fetch"
[ -s "$RUN/bank.items.jsonl" ] || fail "empty bank"
BANK_SHA=$(sha256sum "$RUN/bank.items.jsonl" | cut -c1-64)
HF_COMMIT=$(curl -sI --max-time 30 "$BANK_URL" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-repo-commit"{print $2}')
printf '{"axis":"%s","bank_url":"%s","bank_sha256":"%s","hf_commit":"%s","fetched":"%s"}\n' \
  "$BANK_AXIS" "$BANK_URL" "$BANK_SHA" "$HF_COMMIT" "$(TS)" > "$RUN/bank-pin.json"

# 2. one round (deterministic grader; ties recorded, never invented)
python3 harness/arena/axis_arena.py --games "$GAMES" --models "$MODELS" --bank "$RUN/bank.items.jsonl" \
  --axis "$BANK_AXIS" --out "$RUN/rounds.jsonl" --seed "$(date -u +%Y%m%d%H)" --grader first-label --sleep 0.5 \
  > "$RUN/axis_arena.log" 2>&1 || fail "axis_arena"
N=$(wc -l < "$RUN/rounds.jsonl"); [ "$N" -gt 0 ] || fail "no games recorded"
cat "$RUN/rounds.jsonl" >> public/arena/rounds.jsonl
mkdir -p "public/arena/$(date -u +%F)"; cp "$RUN/rounds.jsonl" "public/arena/$(date -u +%F)/rounds-$HOUR.jsonl"; cp "$RUN/bank-pin.json" "public/arena/$(date -u +%F)/bank-pin-$HOUR.json"

# 3. elo reference (board-signed envelope) + 4. signals (board-signed)
python3 scripts/arena/elo_reference.py --rounds public/arena/rounds.jsonl --out public/arena/elo_reference.json \
  --supersedes public/arena/elo_reference.json --pod-token-file "$TOKEN" > "$RUN/elo.log" 2>&1 || fail "elo_reference"
python3 scripts/emit_signals.py --leaderboard public/arena/elo_reference.json --out public/signals \
  --pod-token-file "$TOKEN" > "$RUN/signals.log" 2>&1 || fail "emit_signals"
for f in public/signals/*.signed.json public/arena/elo_reference.json; do
  python3 scripts/verify_signed.py "$f" >/dev/null 2>&1 || { python3 scripts/verify_signed.py "$f" || true; fail "verify $f"; }
done
node scripts/arena-route-truth-guard.mjs >/dev/null 2>&1 || fail "arena-route-truth-guard"

# 5. branch to the bare repo (no merge)
git add public/arena public/signals
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "arena: hourly round $HOUR — $N games on $BANK_AXIS ($MODELS), elo reference + signals re-signed (board key)" || fail "nothing to commit"
git push -q origin "arena/auto-$HOUR" || fail "push"
SHA=$(git rev-parse --short HEAD)
DEC=$(python3 -c "import json;print(sum(1 for l in open('$RUN/rounds.jsonl') if json.loads(l)['winner']!='tie'))")
LEAD=$(python3 -c "import json;d=json.load(open('public/signals/_index.json'));print(sum(1 for s in d['signals'] if s['elo_leader']),'/',len(d['signals']))")
echo "$(TS) OK $HOUR games=$N decided=$DEC axis=$BANK_AXIS bank=${BANK_SHA:0:12} leaders=$LEAD branch=arena/auto-$HOUR commit=$SHA" >> "$RECEIPTS"
