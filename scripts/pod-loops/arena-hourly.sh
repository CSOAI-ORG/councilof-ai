#!/usr/bin/env bash
# arena-hourly.sh — ONE honest arena round -> Elo reference -> per-axis signals -> branch.
# Registered in loops/scheduler.sh 2026-09-22 (hourly at :35, owner ruled no more gates).
#
# WHAT THIS HOUR PLAYS, AND WHY IT ROTATES (changed 2026-09-23)
#   Until today this script read BANK_AXIS=gov, MODELS=mistral:7b,gemma3:12b, GAMES=12 and had
#   played that one cell every hour for at least thirteen consecutive rounds. A 14-axis board
#   crossed with C(fleet,2) model pairs was receiving all of its evidence in a single cell, so
#   thirteen axes could never accumulate any and no pair could ever reach separation. The live
#   board on 2026-09-23T03:30Z showed it: across the fourteen model-comparison axes, separation
#   read UNTESTED 12, TIE 2, SEPARATED 0. "23 measured of 23" says a run exists behind every
#   slot; it never said an axis can tell two models apart, which is what an instrument is for.
#   The replayed cell was also a coin flip — 147 decided games at a 0.517 win share — and by our
#   own rule a pair that close does not separate at any n this pod will reach (see below).
#
#   The axis and the pair are now derived from the HOUR by scripts/arena/rotation.py, so a
#   stranger holding only the hour can name both, predict the round and re-run it:
#     axis  strict round-robin over the fourteen register axes: every axis once every 14 hours.
#     pair  probe every pair of the declared fleet on that axis first (fewest rounds first),
#           then concentrate on the pair with the MOST decided games still short of the target —
#           the one closest to being adjudicated from below — so a cell reaches a verdict instead
#           of every cell sitting under the Wilson floor forever, which is the state we are in.
#     The rule reads COUNTS ONLY: rounds played and rounds decided. It never reads who won, the
#     win-rate, the Elo or the verdict, and a cell retires at the target whether it SEPARATED or
#     TIED. Flipping every winner in the corpus changes no scheduling decision; there is a
#     control that asserts that and fails if any hour's choice moves.
#
# WHAT SEPARATION COSTS (derived, not asserted — scripts/arena/rotation.py:games_to_separation)
#   With two models on an axis, wins_a + wins_b = n and games_a = games_b = n, so
#   winrate_b = 1 - winrate_a and Wilson is symmetric. emit_signals' test top.ci[0] > runner.ci[1]
#   therefore reduces exactly to L(p,n) > 0.5. Decided games needed at a true win share p:
#       p=0.90 -> 8    p=0.80 -> 11   p=0.75 -> 16   p=0.70 -> 24
#       p=0.65 -> 41   p=0.60 -> 91   p=0.55 -> 381  p=0.50 -> never
#   RESOLVE_GAP is set to 0.65, so TARGET_DECIDED = 41. That is this instrument's stated
#   sensitivity: it resolves a 65:35 pair and reports anything closer as a TIE — not because the
#   models are equal, but because this many games cannot tell. Ties are findings, not failures.
#
# WHAT THE GPU ALLOWS (measured on rp-3090-now 2026-09-23, mill and 24x7 worker both running)
#   A warm answer costs 0.3-1.7 s and a cold model load 3-20 s; 8 real games including both cold
#   loads took 28.6 s. GAMES=40 therefore costs about two minutes of GPU. The mill's slice runs
#   :10 to roughly :24 and its landing at :50, so this round at :35 sits inside a free window and
#   the binding cost is not the GPU but the fourteen signing round-trips afterwards. At GAMES=40
#   MEASURED on three real 40-game rounds under this rule, 2026-09-23T03:49Z to 04:09Z:
#       care  gemma3:12b vs llama3.1:8b    40 games,  6 decided (15%), 6m30s wall
#       xr    gemma3:12b vs phi3.5:3.8b    40 games, 19 decided (48%), 5m40s wall
#       det   llama3.1:8b vs qwen3:8b      40 games, 14 decided (35%), 2m26s wall
#   Decided games are the currency, and their rate is a property of the axis, not of the budget:
#   care is slowest because its published bank carries no label vocabulary (expected is 0/1), so
#   the generic prompt is used and about half the answers grade as ungraded, each costing a three
#   second penalty. A cell therefore needs TARGET_DECIDED / decided_rate games: about 120 on xr,
#   270 on care. At 40 games an hour that is 3 arena hours for a decisive cell and 7 for care.
#   With 10 pairs over 14 axes = 140 cells and one cell per arena hour, adjudicating the whole
#   board costs of the order of 420 arena hours, about 18 days of wall clock. That is the honest
#   figure and it is NOT shortened by raising GAMES: the window at :35 is some 25 minutes and a
#   40-game round already uses 2 to 7 of them, so the ceiling is roughly 150 games an hour on the
#   fastest axis, which buys under a factor of four and risks colliding with the :50 landing.
#   The levers that actually move it are stated rather than taken quietly:
#     - a smaller fleet: 4 models is 6 pairs and 84 cells, cutting the board to about 250 hours;
#     - a coarser RESOLVE_GAP: 0.70 needs 24 decided games instead of 41, cutting it by two fifths
#       at the cost of no longer resolving a 65:35 pair;
#     - a second GPU, which is the only lever that costs no sensitivity.
#   All three are owner decisions. The loop does not take them; it runs 40 games and reports.
#
# THE MILL HAS PRIORITY. This round never kills anything. If the mill slice is still running it
#   waits up to MILL_WAIT seconds and, if the mill is still there, yields for the hour and says so
#   in its receipt. A skipped hour is recorded; absence of a line is still "the loop did not run".
#   The VRAM floor is measured, not guessed. Sampled on rp-3090-now 2026-09-23 with the mill and
#   the 24x7 worker both live: 23,598 MiB free once ollama's keep-alive expires, 11,912 MiB with
#   one 12B worker model resident, 5,328 MiB immediately after an arena round while its own two
#   models are still held. The largest pair in this fleet needs about 13,100 MiB. 9,000 MiB sits
#   below the worst steady state so an ordinary hour proceeds, and above the point where a round
#   would have to evict a model something else is actively using. Both guards were seen to fire:
#   a back-to-back replay on 2026-09-23T03:57Z yielded with "only 5589MiB VRAM free".
#
#   one round  : --games N games between the hour's two models on the hour's ONE frozen bank
#                (deterministic first-label grader), appended to public/arena/rounds.jsonl
#   elo        : scripts/arena/elo_reference.py over the whole rounds file (board-signed envelope)
#   signals    : scripts/emit_signals.py --pod-token-file (did:web:csoai.org#board-attestation-1)
#   branch     : arena/auto-<UTC hour>, pushed to the bare repo; never merged here
#   receipt    : one line in $RECEIPTS. Absence of a line = the loop did not run.
# Shares the GPU with the mill; never kills anything. Exit non-zero on any gate failure.
# The SCHEDULER stamps this job. This script takes --now and must not stamp itself.
set -euo pipefail
export PATH=/workspace/tools/node/bin:$PATH
# Overridable so the loop can be PROVEN end to end in a scratch clone without touching the
# live lane, the live receipts or the branch namespace the scheduler uses. Defaults are live.
LANE=${LANE:-/workspace/ci/arena-lane}
BARE=${BARE:-/workspace/git/councilof-ai.git}
OUTROOT=${OUTROOT:-/workspace/lanes/out/arena-hourly}
RECEIPTS=${RECEIPTS:-/workspace/lanes/logs/arena-hourly.log}
BRANCH_PREFIX=${BRANCH_PREFIX:-arena/auto}
TOKEN=/workspace/secrets/board-sign-pod-token
# The declared fleet: five models resident on this pod, spanning 3.8B to 12.2B and four vendors.
# Breadth of scale is deliberate — an instrument has to be shown to discriminate on a pair where
# a difference ought to exist. Every name is verified against /api/tags below; a fleet naming a
# model this pod does not hold fails the round rather than silently playing something else.
FLEET=${FLEET:-phi3.5:3.8b,mistral:7b,qwen3:8b,llama3.1:8b,gemma3:12b}
GAMES=${GAMES:-40}
MILL_WAIT=${MILL_WAIT:-300}
MIN_FREE_VRAM_MIB=${MIN_FREE_VRAM_MIB:-9000}
HOUR=$(date -u +%Y%m%dT%H)
# Any hour can be re-derived and re-run by a stranger: HOUR_INDEX pins the schedule input
# (unix seconds / 3600) instead of reading the clock. That is the whole claim of a rotation
# that is "derivable from the hour", so it is exercisable, not just asserted.
HOUR_INDEX=${HOUR_INDEX:-}
# A replay keeps its own output directory so it can never overwrite the scheduled hour's evidence.
RUN=$OUTROOT/$HOUR${HOUR_INDEX:+-replay$HOUR_INDEX}
mkdir -p "$RUN" "$(dirname "$RECEIPTS")"
TS(){ date -u +%FT%TZ; }
fail(){ echo "$(TS) FAIL $HOUR $*" >> "$RECEIPTS"; exit 1; }
yield(){ echo "$(TS) YIELD $HOUR $*" >> "$RECEIPTS"; exit 0; }

[ -f "$TOKEN" ] || fail "no board-sign token"
curl -s 127.0.0.1:11434/api/tags >/dev/null || fail "ollama down"

# --- the mill has priority: wait for its slice, then yield the hour rather than crowd it -------
waited=0
while ps -eo args | grep -v grep | grep -q -- "mill-hourly.sh"; do
  [ "$waited" -ge "$MILL_WAIT" ] && yield "mill slice still running after ${MILL_WAIT}s — arena stood down this hour"
  sleep 15; waited=$((waited+15))
done
FREE=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1 || echo 0)
[ "${FREE:-0}" -ge "$MIN_FREE_VRAM_MIB" ] || yield "only ${FREE}MiB VRAM free (<${MIN_FREE_VRAM_MIB}) — arena stood down rather than evict the mill"

cd "$LANE"
git fetch -q origin || fail "fetch"
git checkout -q -B "$BRANCH_PREFIX-$HOUR" origin/master || fail "checkout"

# every fleet model must actually be on this pod
TAGS=$(curl -s 127.0.0.1:11434/api/tags)
for m in ${FLEET//,/ }; do
  echo "$TAGS" | grep -q "\"$m\"" || fail "fleet model $m not present on this pod"
done

# --- 0. the hour decides the axis and the pair (counts only; never reads a winner) -------------
if [ -n "$HOUR_INDEX" ]; then ROTWHEN=(--hour-index "$HOUR_INDEX"); else ROTWHEN=(--now); fi
ROT=$(python3 scripts/arena/rotation.py "${ROTWHEN[@]}" --fleet "$FLEET" --rounds public/arena/rounds.jsonl --format sh) \
  || fail "rotation"
eval "$ROT"
[ -n "${ROT_MODELS:-}" ] || yield "axis $ROT_AXIS is SETTLED for this fleet — every pair adjudicated or recorded undecidable (${ROT_UNDECIDABLE:-none})"
BANK_AXIS=$ROT_AXIS
MODELS=$ROT_MODELS
BANK_URL=${BANK_URL:-https://huggingface.co/datasets/csoai/gspc-${BANK_AXIS}/resolve/main/items.jsonl}
echo "$ROT" > "$RUN/rotation.env"
python3 scripts/arena/rotation.py "${ROTWHEN[@]}" --fleet "$FLEET" --rounds public/arena/rounds.jsonl --format json > "$RUN/rotation.json"

# 1. frozen bank, pinned by bytes (the HF commit is recorded from the response header)
curl -sL --max-time 120 "$BANK_URL" -o "$RUN/bank.items.jsonl" || fail "bank fetch"
[ -s "$RUN/bank.items.jsonl" ] || fail "empty bank"
BANK_SHA=$(sha256sum "$RUN/bank.items.jsonl" | cut -c1-64)
HF_COMMIT=$(curl -sI --max-time 30 "$BANK_URL" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-repo-commit"{print $2}')
printf '{"axis":"%s","bank_url":"%s","bank_sha256":"%s","hf_commit":"%s","fetched":"%s"}\n' \
  "$BANK_AXIS" "$BANK_URL" "$BANK_SHA" "$HF_COMMIT" "$(TS)" > "$RUN/bank-pin.json"

# 2. one round (deterministic grader; ties recorded, never invented). --require-items makes an
#    axis whose published bank yields nothing playable a reported FAILURE, not an endless loop.
python3 harness/arena/axis_arena.py --games "$GAMES" --models "$MODELS" --bank "$RUN/bank.items.jsonl" \
  --axis "$BANK_AXIS" --out "$RUN/rounds.jsonl" --seed "$(date -u +%Y%m%d%H)" --grader first-label --sleep 0.5 \
  --require-items 2 \
  > "$RUN/axis_arena.log" 2>&1 || fail "axis_arena rc=$? axis=$BANK_AXIS models=$MODELS (see $RUN/axis_arena.log)"
N=$(wc -l < "$RUN/rounds.jsonl"); [ "$N" -gt 0 ] || fail "no games recorded"
cat "$RUN/rounds.jsonl" >> public/arena/rounds.jsonl
mkdir -p "public/arena/$(date -u +%F)"; cp "$RUN/rounds.jsonl" "public/arena/$(date -u +%F)/rounds-$HOUR.jsonl"; cp "$RUN/bank-pin.json" "public/arena/$(date -u +%F)/bank-pin-$HOUR.json"
cp "$RUN/rotation.json" "public/arena/$(date -u +%F)/rotation-$HOUR.json"

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
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "arena: hourly round $HOUR — $N games on $BANK_AXIS ($MODELS, $ROT_PHASE), elo reference + signals re-signed (board key)" || fail "nothing to commit"
git push -q origin "$BRANCH_PREFIX-$HOUR" || fail "push"
SHA=$(git rev-parse --short HEAD)
DEC=$(python3 -c "import json;print(sum(1 for l in open('$RUN/rounds.jsonl') if json.loads(l)['winner']!='tie'))")
# what the board can now say about telling two models apart, counted from the signals themselves
SEP=$(python3 -c "import json;d=json.load(open('public/signals/_index.json'));s=[x['elo_separation'] for x in d['signals']];print('sep=%d tie=%d unmeasured=%d of %d'%(s.count('SEPARATED'),s.count('TIE'),s.count('UNMEASURED'),len(s)))")
echo "$(TS) OK $HOUR games=$N decided=$DEC axis=$BANK_AXIS pair=$MODELS phase=$ROT_PHASE cell_decided=$((ROT_DECIDED_ON_CELL+DEC))/$ROT_TARGET_DECIDED bank=${BANK_SHA:0:12} $SEP undecidable=${ROT_UNDECIDABLE:-none} branch=$BRANCH_PREFIX-$HOUR commit=$SHA" >> "$RECEIPTS"
