#!/bin/bash
# garak-weekly.sh — Sundays, in the GPU gap: NVIDIA garak 0.17.0 (a THIRD-PARTY instrument) on the pilot's two models.
#
#   when     scheduler.sh calls it on Sundays (%u=7) once per hour when the minute is :27-:40. This script refuses
#            to START outside :27-:44 UTC (the gap after the :10 mill slice) or when nvidia-smi shows GPU
#            utilisation > 30% on any of three samples or a non-ollama compute process holding > 1 GiB; every
#            garak run is hard-stopped at :48 (timeout -s INT). The :35 arena round is short (~2 min) and did
#            share this gap during the 2026-09-24 pilot; nothing here kills or pauses anything else.
#   what     per invocation: the two generator controls first if not yet done this Sunday (test.Repeat = the
#            detector can fire, test.Blank = the negative; CPU only), then ONE model not yet done this Sunday,
#            in order qwen2.5:1.5b, llama3.2:3b — the pilot's models, config and seed, so a week is comparable
#            to 2026-09-24 without being pooled with it. Two Sunday hours cover the queue.
#   pin      garak==0.17.0 by wheel sha256 9a67e6298e4d7025358fecafa9d473c77ff70acdae103aa5251ad60fca3db145
#            (PyPI, Apache-2.0). The wheel is downloaded --no-deps into $STATE/garak-wheelhouse (persistent),
#            its sha256 checked, and only that file is installed; garak's own dependencies are resolved by pip
#            and recorded (pip-freeze.txt + sha256), not pinned. The venv lives at /root/lanes/garak/.venv on the
#            container disk, which is LOST when the pod stops; it is rebuilt here when absent or not 0.17.0.
#   config   /workspace/condor-gspc/data/gspc_garak/garak-pilot-config.yaml, refused unless its sha256 is
#            cff6c19bfd53de598080de9393bf0d860ad15bf2812bf5901a2ab073de66ade4 (the pilot's). Its report_dir is
#            /root/lanes/garak/runs, so garak writes there (scratch) and every file is copied to $OUT at once.
#   writes   $OUT/garak/<date>/{<prefix>.report.jsonl.gz,<prefix>.runmeta.json,<prefix>.console.log,
#            <prefix>.parsed.json (condor/gspc_garak.py verbatim eval counts, no re-grading),pip-freeze.txt} and
#            ONE line per invocation in $LOGS/garak-weekly.log.
#   population  third-party-instrument:nvidia-garak. Never mixed into pod-measurement, never into the GSPC board;
#            a garak hit count is what garak's heuristic detector reported, not a safety grade.
#
# Publishes nothing, signs nothing, pushes no branch, uploads nothing. THE STAMP IS THE SCHEDULER'S
# (`stamp garak-weekly hour`); --now here.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/garak-weekly.lock"
flock -n 7 || { log garak-weekly "SKIP previous run still holds the lock"; exit 0; }
[ "${1:-}" = "--now" ] || stamp garak-weekly hour || exit 0

WHEEL_SHA=9a67e6298e4d7025358fecafa9d473c77ff70acdae103aa5251ad60fca3db145
WHEEL=garak-0.17.0-py3-none-any.whl
CFG_SHA=cff6c19bfd53de598080de9393bf0d860ad15bf2812bf5901a2ab073de66ade4
CFG_SRC=${GARAK_CONFIG:-/workspace/condor-gspc/data/gspc_garak/garak-pilot-config.yaml}
CONDOR=${GARAK_CONDOR:-/workspace/condor-gspc}
G=/root/lanes/garak
VENV=$G/.venv
WH=$STATE/garak-wheelhouse
MODELS=(qwen2.5:1.5b llama3.2:3b)
D=$(today)
W=$OUT/garak/$D
RUNLOG=$LOGS/garak-weekly.run.log
line() { log garak-weekly "$* date=$D"; }
minute() { date -u +%-M; }
: >"$RUNLOG"

m=$(minute)
if [ "$m" -lt 27 ] || [ "$m" -gt 44 ]; then line "REFUSE minute :$m outside the :27-:44 start window"; exit 0; fi
# A CPU-only start of the pod (gpuCount 0, no nvidia-smi) is a SKIP, not a failure: garak on a CPU-served
# model would be a different instrument, and Ollama is deliberately not served on CPU.
{ command -v nvidia-smi >/dev/null && nvidia-smi -L >/dev/null 2>&1; } || { line "SKIP no GPU (nvidia-smi absent or no device; CPU-only pod)"; exit 0; }
for i in 1 2 3; do
  u=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -dc '0-9')
  [ -n "$u" ] || { line "REFUSE nvidia-smi gave no utilisation reading"; exit 0; }
  [ "$u" -le 30 ] || { line "REFUSE GPU utilisation ${u}% on sample $i (another heavy process)"; exit 0; }
  sleep 2
done
heavy=$(nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader,nounits 2>/dev/null \
        | awk -F', *' '$2 !~ /ollama/ && $3+0 > 1024 {print $1":"$2":"$3"MiB"}' | tr '\n' ' ')
[ -z "$heavy" ] || { line "REFUSE non-ollama GPU process(es): $heavy"; exit 0; }

mkdir -p "$W" "$WH" "$G/runs" "$G/xdg/data" "$G/xdg/config" "$G/xdg/cache" "$G/hf" "$G/tmp"

# config: the pilot's bytes or nothing
[ "$(sha256sum "$CFG_SRC" 2>/dev/null | cut -c1-64)" = "$CFG_SHA" ] || { line "FAIL config $CFG_SRC is absent or not sha256 ${CFG_SHA:0:12}…"; exit 2; }
cp "$CFG_SRC" "$G/garak-pilot-config.yaml"

# the pinned wheel, verified by bytes; venv rebuilt when absent or wrong version
if [ "$(sha256sum "$WH/$WHEEL" 2>/dev/null | cut -c1-64)" != "$WHEEL_SHA" ]; then
  rm -f "$WH/$WHEEL"
  python3 -m pip download -q --no-deps --only-binary=:all: "garak==0.17.0" -d "$WH" >>"$RUNLOG" 2>&1
  got=$(sha256sum "$WH/$WHEEL" 2>/dev/null | cut -c1-64)
  [ "$got" = "$WHEEL_SHA" ] || { rm -f "$WH/$WHEEL"; line "FAIL downloaded $WHEEL sha256=${got:-none} is not the pin ${WHEEL_SHA:0:12}…; not installing"; exit 2; }
fi
if ! "$VENV/bin/python" -c 'import importlib.metadata as m,sys; sys.exit(0 if m.version("garak")=="0.17.0" else 1)' 2>/dev/null; then
  rm -rf "$VENV"
  python3 -m venv "$VENV" >>"$RUNLOG" 2>&1 && "$VENV/bin/pip" install -q "$WH/$WHEEL" >>"$RUNLOG" 2>&1 \
    || { line "FAIL venv install of the pinned wheel into $VENV (see $RUNLOG)"; exit 2; }
  line "INSTALLED garak 0.17.0 from $WH/$WHEEL (sha256 ${WHEEL_SHA:0:12}…) into $VENV"
fi
"$VENV/bin/pip" freeze 2>/dev/null >"$W/pip-freeze.txt"
export XDG_DATA_HOME=$G/xdg/data XDG_CONFIG_HOME=$G/xdg/config XDG_CACHE_HOME=$G/xdg/cache HF_HOME=$G/hf TMPDIR=$G/tmp

# one garak run, bounded by :48, copied to $OUT at once
run_one() {  # <prefix> <target_name> [extra garak args...]
  local prefix=$1 target=$2; shift 2
  local now_s rem digest=- rc t0 t1
  now_s=$(date -u +%s); rem=$(( ( (now_s / 3600) * 3600 + 48 * 60 ) - now_s ))
  [ "$rem" -gt 60 ] || return 75
  if [ $# -eq 0 ]; then
    digest=$(curl -s --max-time 10 127.0.0.1:11434/api/tags | python3 -c "import json,sys; print(next(m['digest'] for m in json.load(sys.stdin)['models'] if m['name']==sys.argv[1]))" "$target" 2>/dev/null) \
      || return 76
  fi
  t0=$(date -u +%FT%TZ)
  ( cd "$G" && timeout --signal=INT --kill-after=20 "$rem" "$VENV/bin/python" -m garak --config garak-pilot-config.yaml \
      --target_name "$target" --report_prefix "$prefix" "$@" ) >"$G/runs/$prefix.console.log" 2>&1
  rc=$?; t1=$(date -u +%FT%TZ)
  python3 - "$G/runs" "$W" "$prefix" "$target" "$digest" "$t0" "$t1" "$rc" "$WHEEL_SHA" "$CFG_SHA" <<'PY'
import gzip, hashlib, json, os, shutil, sys
runs, w, p, target, dig, t0, t1, rc, wsha, csha = sys.argv[1:]
rp = os.path.join(runs, f"{p}.report.jsonl")
raw = open(rp, "rb").read() if os.path.exists(rp) else None
done = bool(raw) and b'"entry_type": "completion"' in raw
meta = {"population": "third-party-instrument:nvidia-garak", "target": target, "ollama_digest": None if dig == "-" else dig,
        "report_prefix": p, "started_at": t0, "completed_at": t1, "exit_code": int(rc), "completed": done,
        "report_sha256": hashlib.sha256(raw).hexdigest() if raw else None, "config_sha256": csha,
        "garak": "0.17.0", "garak_wheel_sha256": wsha, "signed": False, "published": False,
        "boundary": "a garak hit count is what garak's heuristic detector reported; it is not a safety grade"}
if raw:
    with open(os.path.join(w, f"{p}.report.jsonl.gz"), "wb") as f:
        f.write(gzip.compress(raw, 9, mtime=0))
shutil.copy2(os.path.join(runs, f"{p}.console.log"), os.path.join(w, f"{p}.console.log"))
json.dump(meta, open(os.path.join(w, f"{p}.runmeta.json"), "w"), indent=1)
sys.exit(0 if done and int(rc) == 0 else 1)
PY
}
done_ok() { python3 -c 'import json,sys; m=json.load(open(sys.argv[1])); sys.exit(0 if m.get("completed") and m.get("exit_code")==0 else 1)' "$W/$1.runmeta.json" 2>/dev/null; }

did=""
for c in Repeat Blank; do
  p=weekly-$D-control-$c
  done_ok "$p" && continue
  run_one "$p" "$c" --target_type "test.$c"; did="$did control-$c:rc=$?"
done
for mdl in "${MODELS[@]}"; do
  slug=$(printf '%s' "$mdl" | tr -c 'A-Za-z0-9._-' '-')
  p=weekly-$D-$slug
  done_ok "$p" && continue
  m=$(minute); [ "$m" -le 44 ] || { did="$did $mdl:deferred(start-window-passed)"; break; }
  run_one "$p" "$mdl"; rc=$?; did="$did $mdl:rc=$rc"
  if [ $rc -eq 0 ] && [ -s "$CONDOR/condor/gspc_garak.py" ]; then
    dig=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ollama_digest"] or "")' "$W/$p.runmeta.json")
    ( cd "$CONDOR" && PYTHONPATH=. python3 condor/gspc_garak.py "$G/runs/$p.report.jsonl" --model-digest "$dig" ) \
      >"$W/$p.parsed.json" 2>>"$RUNLOG" || did="$did parse:FAILED"
  fi
  break   # one model per invocation; the next Sunday hour takes the next
done
left=0
for mdl in "${MODELS[@]}"; do done_ok "weekly-$D-$(printf '%s' "$mdl" | tr -c 'A-Za-z0-9._-' '-')" || left=$((left+1)); done
line "${did:+RAN$did }models_left=$left freeze_sha=$(sha256sum "$W/pip-freeze.txt" | cut -c1-12) out=$W (not published)"
