#!/bin/bash
# mill-hourly.sh — one hourly mill slice on the pod, end to end, landing on a BRANCH of the bare repo.
#
#   slice    ONE fleet model per UTC hour (rotation below; 14 models → every model ~every 14 h), all 14
#            behavioural axes, frozen banks in /workspace/banks-all (jail: the goldbank samples.jsonl bytes,
#            sha 0b45b620…, placed at $BANKS/gspc-jail.jsonl by the coordinator — refused if absent/other bytes)
#   grade    scripts/generate_runpod_gspc_playlist.py → scripts/runpod_gspc_worker.py --once per axis
#            (temperature 0, seed 0, labels 128 tokens, keyword banks 1024; the running 24x7 worker is untouched)
#   verify   scripts/verify_runpod_gspc_intake.py per run → chain_tools.py stage → land_mill_cards.py --require-evidence
#   sign     scripts/sign_mill_cards.py --pod-token-file /workspace/secrets/board-sign-pod-token (#board-attestation-1;
#            n>=30 MEASURED, n<30 UNMEASURED "n<30 unquotable"; content-addressed; supersedes, never overwrites)
#   root     scripts/card_root.py --stamp + --verify
#   land     git branch mill/auto-<UTC hour> from origin/master in $CLONE, commit, push to the bare repo. NEVER merges.
#   receipt  ONE line appended to $LOGS/mill-hourly.log: <utc> <model> runs=<n> landed=<n> signed=<n> branch=<b> commit=<sha> rc=<rc>
#   lock     $STATE/mill-hourly.lock (flock -n): a slice that overruns the hour is not doubled.
#   DRY_RUN=1 prints the slice and writes nothing. Not registered anywhere by this file — the owner adds it to scheduler.sh.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/mill-hourly.lock"
flock -n 7 || { log mill-hourly "SKIP previous slice still running"; exit 0; }
[ "${1:-}" = "--now" ] || [ "${DRY_RUN:-0}" = "1" ] || stamp mill-hourly hour || exit 0

BARE=${MILL_BARE:-/workspace/git/councilof-ai.git}
CLONE=${MILL_CLONE:-/workspace/ci/mill-hourly}
BANKS=${MILL_BANKS:-/workspace/banks-all}
MOUT=${MILL_OUT:-$OUT/mill-hourly}
TOKEN=${MILL_POD_TOKEN:-/workspace/secrets/board-sign-pod-token}
OLLAMA=${MILL_OLLAMA_URL:-http://127.0.0.1:11434}
JAIL_SHA=0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a
ROTATION=(gemma3:12b qwen3:8b llama3.1:8b qwen2.5:7b mistral-nemo:12b gemma3:4b qwen3:4b llama3.2:3b mistral:7b phi3.5:3.8b deepseek-r1:8b qwen2.5:1.5b qwen2.5:0.5b-instruct qwen3-precise:latest)
H=$(date -u +%Y%m%dT%H); HOUR=$((10#$(date -u +%H) + 10#$(date -u +%d) * 24))
MODEL=${MILL_MODEL:-${ROTATION[$((HOUR % ${#ROTATION[@]}))]}}
SLUG=$(printf '%s' "$MODEL" | tr -c 'A-Za-z0-9._-' '-')
BRANCH=mill/auto-$H
SLICE=$MOUT/$H-$SLUG
mkdir -p "$MOUT"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "DRY slice=$H model=$MODEL branch=$BRANCH clone=$CLONE banks=$BANKS out=$SLICE token=$([ -s "$TOKEN" ] && echo present || echo ABSENT)"
  exit 0
fi
[ -s "$TOKEN" ] || { log mill-hourly "$H $MODEL HALT pod token absent ($TOKEN)"; exit 2; }
if [ "$(sha256sum "$BANKS/gspc-jail.jsonl" 2>/dev/null | cut -c1-64)" != "$JAIL_SHA" ]; then
  log mill-hourly "$H $MODEL HALT $BANKS/gspc-jail.jsonl is not the goldbank samples.jsonl ($JAIL_SHA); place the frozen bytes first"; exit 2
fi

# fresh clone of master on the slice branch (never the live deploy checkout)
if [ ! -d "$CLONE/.git" ]; then git clone -q "$BARE" "$CLONE" || { log mill-hourly "$H $MODEL HALT clone failed"; exit 2; }; fi
git -C "$CLONE" fetch -q origin master && git -C "$CLONE" checkout -q -B "$BRANCH" origin/master || { log mill-hourly "$H $MODEL HALT checkout failed"; exit 2; }
AL=$CLONE/scripts/runpod_gspc_bank_allowlist.current.json
mkdir -p "$SLICE"

# grade: one model, every axis
rc_grade=0; runs=0
python3 "$CLONE/scripts/generate_runpod_gspc_playlist.py" --bank-dir "$BANKS" --workspace-root /workspace \
  --model-manifest-root /workspace/ollama-models/manifests --jobs-dir "$SLICE/jobs" --output-root "$SLICE/runs" \
  --ollama-url "$OLLAMA" --models "$MODEL" --max-tokens 128 --keyword-max-tokens 1024 >> "$SLICE/grade.log" 2>&1 \
  || { log mill-hourly "$H $MODEL HALT playlist failed (see $SLICE/grade.log)"; exit 2; }
for cfg in $(ls "$SLICE"/jobs/*.json | sort); do
  free=$(df -B1 --output=avail /workspace | tail -1 | tr -dc '0-9'); [ "$free" -gt 8000000000 ] || { log mill-hourly "$H $MODEL HALT low disk $free"; exit 75; }
  ( cd "$CLONE" && python3 scripts/runpod_gspc_worker.py --config "$cfg" --state-dir "$SLICE/state" --once ) >> "$SLICE/grade.log" 2>&1; rc=$?
  [ $rc -eq 0 ] && runs=$((runs+1)) || rc_grade=$rc
done

# verify → stage → land (same steps as pod-loops/land.sh)
for d in "$SLICE"/runs/*/*/runs/*/; do
  [ -f "$d/card-unsigned.json" ] || continue
  ( cd "$CLONE" && python3 scripts/verify_runpod_gspc_intake.py --run-dir "${d%/}" --bank-allowlist "$AL" --quarantine-root "$SLICE/quarantine" ) >> "$SLICE/land.log" 2>&1
done
mkdir -p "$SLICE/stage"
( cd "$CLONE" && python3 scripts/pod-loops/chain_tools.py stage --quarantine "$SLICE/quarantine" --stage "$SLICE/stage" ) >> "$SLICE/land.log" 2>&1
( cd "$CLONE" && python3 scripts/land_mill_cards.py --staged "$SLICE/stage" --require-evidence \
    --inbox public/interop/mill-cards-unsigned --signed public/interop/mill-cards-signed \
    --evidence public/interop/mill-evidence --bank-allowlist "$AL" ) >> "$SLICE/land.log" 2>&1
landed=$(python3 -c 'import json,sys; print(len(json.load(open(sys.argv[1]))["landed"]))' "$SLICE/stage/land-report.json" 2>/dev/null || echo 0)

# sign ONLY this slice's cards (never the backlog in the inbox), with the pod token
signed=0; rc_sign=0
if [ "$landed" -gt 0 ]; then
  mkdir -p "$SLICE/inbox"
  python3 - "$SLICE" "$CLONE" <<'PY'
import json, shutil, sys
from pathlib import Path
slice_dir, clone = Path(sys.argv[1]), Path(sys.argv[2])
rep = json.load(open(slice_dir / "stage" / "land-report.json"))
for row in rep["landed"]:
    staged = next(iter((slice_dir / "stage").rglob(row["file"])), None)
    if staged is None: continue
    w = json.load(open(staged)); name = f"unsigned-{str(w['body']['axis'])[:8]}-{str(w['id'])[:12]}.json"
    src = clone / "public/interop/mill-cards-unsigned" / name
    if src.is_file(): shutil.copy2(src, slice_dir / "inbox" / name)
PY
  ( cd "$CLONE" && python3 scripts/sign_mill_cards.py --source-dir "$SLICE/inbox" --dest-dir public/interop/mill-cards-signed \
      --evidence-dir public/interop/mill-evidence --require-hub-admission --pod-token-file "$TOKEN" \
      --did did:web:csoai.org#board-attestation-1 ) > "$SLICE/sign.log" 2>&1; rc_sign=$?
  signed=$(grep -c '^SIGNED ' "$SLICE/sign.log" || true)
  ( cd "$CLONE" && python3 scripts/card_root.py --stamp --signed-dir public/interop/mill-cards-signed --out-dir public/interop \
      && python3 scripts/card_root.py --verify --signed-dir public/interop/mill-cards-signed --out-dir public/interop ) > "$SLICE/root.log" 2>&1 || rc_sign=$?
fi

# land on the branch (commit + push to the bare repo). Never merges.
commit=-
if [ "$landed" -gt 0 ]; then
  git -C "$CLONE" add public/interop/mill-cards-unsigned public/interop/mill-cards-signed public/interop/mill-evidence public/interop/card-root-* 2>/dev/null
  git -C "$CLONE" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "mill/auto-$H: $MODEL x $runs axes on the pod; landed=$landed signed=$signed (pod token, #board-attestation-1); measurement, not certification" \
    && git -C "$CLONE" push -q origin "$BRANCH" && commit=$(git -C "$CLONE" rev-parse --short HEAD) || commit=PUSH_FAILED
fi
rc=$(( rc_grade != 0 ? rc_grade : rc_sign ))
log mill-hourly "$H $MODEL runs=$runs landed=$landed signed=$signed branch=$BRANCH commit=$commit rc=$rc out=$SLICE"
exit "$rc"
