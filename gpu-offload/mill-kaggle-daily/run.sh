#!/bin/bash
# ~/lanes/mill-kaggle-daily/run.sh — the GSPC mill, DAILY, on Kaggle's free 2x T4 (lane mill-kaggle-daily-20260928).
#
# Replaces rp-3090-now's mill-hourly.sh while that pod has no GPU (PAUSED_NO_GPU since 2026-09-26T04:44Z).
# Same instrument, same slice shape (ONE fleet model x ALL 14 mill axes), same gates, same signer, same landing:
#
#   floor    / and /evac-bulk must each have >= 2 GB free, else FAILED (nothing run)
#   quota    trailing-7-day kernel wall time from this log must be < QUOTA_CAP_H (default 20 h of Kaggle's ~30 h)
#   code     persistent sparse clone of REAL master (build pod /workspace/staging/mirror/councilof-ai.git), fetched
#   model    rotation over the 11 fleet models whose 3090 manifest digest is pinned in the intake receipts
#   kernel   PRIVATE Kaggle kernel $KID (GPU T4x2, internet): code + 14 pinned banks embedded; no CSOAI secret
#   pull     kernel output -> $OUT/<H>-<slug>/pull
#   verify   verify_runpod_gspc_intake.py per run -> chain_tools.py stage -> land_mill_cards.py --require-evidence
#   sign     sign_mill_cards.py --pod-token-file ~/.secrets/board-sign-pod-token (#board-attestation-1), this slice only
#   root     card_root.py --stamp + --verify
#   land     branch mill/auto-<UTC hour> from master, commit, push to the build pod staging mirror (the canonical
#            bare repo); if that push fails, the Oracle mirror; NEVER merges (publication needs ADMITTED — owner rule)
#   receipt  ONE line in ~/lanes/logs/mill-kaggle-daily.log; state JSON in ~/fleet/mill-kaggle.json
#
# Every exit that does not produce a new signed slice logs FAILED with the reason. rc: 0 OK, 1 FAILED, 75 skipped (lock).
set -uo pipefail
HERE=$HOME/lanes/mill-kaggle-daily
BASE=${MKD_BASE:-/evac-bulk/mill-kaggle-daily}
CLONE=$BASE/clone
OUTROOT=$BASE/out
BANKS=$HERE/banks
TPL=$HERE/kernel_template.py
KAGGLE=${KAGGLE_BIN:-$HOME/bin/kaggle}
KID=${MKD_KERNEL:-nicktempleman/csoai-mill-kaggle-daily}
TOKEN=${MKD_POD_TOKEN:-$HOME/.secrets/board-sign-pod-token}
FLEET_KEY=$HOME/.ssh/fleet_runpod_ed25519
LOG=$HOME/lanes/logs/mill-kaggle-daily.log
HEALTH=$HOME/fleet/mill-kaggle.json
REPEATS=${MKD_REPEATS:-1}
BUDGET_S=${MKD_BUDGET_S:-10800}          # 3 h of grading wall inside the kernel
WAIT_MIN=${MKD_WAIT_MIN:-300}            # 5 h max for the whole kernel (queue + install + grade)
QUOTA_CAP_H=${MKD_QUOTA_CAP_H:-20}
FLOOR_M=${MKD_FLOOR_M:-2048}
# the 3090 rotation (mill-hourly.sh), filtered to models whose 3090 digest is pinned in public/interop/mill-evidence
ROTATION=(gemma3:12b qwen3:8b llama3.1:8b qwen2.5:7b mistral-nemo:12b gemma3:4b llama3.2:3b mistral:7b phi3.5:3.8b qwen2.5:1.5b qwen2.5:0.5b-instruct)
# NEWEST class (added 2026-09-28): models released in the last 30 days, pinned by manifest digest in $NEWEST with their
# primary-source release date, licence and runtime check. A newest model that has never produced an OK slice goes FIRST
# (priority order), unless it already FAILED twice (then it is skipped, loudly, and waits for a human). After its first
# OK slice it joins the daily rotation. No fleet model was removed; the rotation grew from 11 to 11 + len(newest).
NEWEST=${MKD_NEWEST:-$HERE/newest-models.json}
H=$(date -u +%Y%m%dT%H); DAY=$(( $(date -u +%s) / 86400 ))
mapfile -t NEWEST_TAGS < <(python3 -c 'import json,sys; [print(m["tag"]) for m in sorted(json.load(open(sys.argv[1]))["models"], key=lambda m: m["priority"])]' "$NEWEST" 2>/dev/null)
PICK_NOTE=rotation
if [ -z "${MKD_MODEL:-}" ] && [ ${#NEWEST_TAGS[@]} -gt 0 ]; then
  for t in "${NEWEST_TAGS[@]}"; do
    ok=$(grep -F " $t state=OK" "$LOG" 2>/dev/null | wc -l); bad=$(grep -F " $t state=FAILED" "$LOG" 2>/dev/null | wc -l)
    if [ "$ok" -eq 0 ] && [ "$bad" -lt 2 ]; then MKD_MODEL=$t; PICK_NOTE="newest-first(unmeasured,failed=$bad)"; break; fi
    [ "$ok" -eq 0 ] && echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) NEWEST_SKIPPED $t failed=$bad ok=0: needs a human before it is retried" >> "${LOG%.log}.newest-skips.log"
  done
fi
ROTATION+=("${NEWEST_TAGS[@]}")
MODEL=${MKD_MODEL:-${ROTATION[$((DAY % ${#ROTATION[@]}))]}}
[ -n "${MKD_MODEL:-}" ] && [ "$PICK_NOTE" = rotation ] && PICK_NOTE=override
SLUG=$(printf '%s' "$MODEL" | tr -c 'A-Za-z0-9._-' '-')
BRANCH=mill/auto-$H
W=$OUTROOT/$H-$SLUG
mkdir -p "$(dirname "$LOG")" "$(dirname "$HEALTH")" "$OUTROOT"
runs=0; landed=0; signed=0; commit=-; landed_to=-; kernel_s=-

receipt() {  # STATE REASON [RC]
  local st=$1 why=$2 rc=${3:-1}
  local line="$(date -u +%Y-%m-%dT%H:%M:%SZ) $H $MODEL state=$st runs=$runs landed=$landed signed=$signed branch=$BRANCH commit=$commit landed_to=$landed_to kernel_wall_s=$kernel_s rc=$rc out=$W reason=$why"
  echo "$line" >> "$LOG"
  python3 - "$HEALTH" "$st" "$why" "$MODEL" "$H" "$runs" "$landed" "$signed" "$BRANCH" "$commit" "$landed_to" "$kernel_s" "$rc" "$W" <<'PY'
import json, sys, datetime, os
k = ["path","state","reason","model","slice","runs","landed","signed","branch","commit","landed_to","kernel_wall_s","rc","out"]
d = dict(zip(k, sys.argv[1:])); p = d.pop("path")
d["at"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
try: prev = json.load(open(p))
except Exception: prev = {}
d["last_success"] = d["at"] if d["state"].startswith("OK") else prev.get("last_success")
d["last_success_slice"] = d["slice"] if d["state"].startswith("OK") else prev.get("last_success_slice")
d["job"] = "mill-kaggle-daily"; d["schema"] = "csoai.mill-kaggle-daily-receipt/0.1"
open(p + ".tmp", "w").write(json.dumps(d, indent=1) + "\n"); os.replace(p + ".tmp", p)
PY
  echo "$line"; RECEIPT_DONE=1
}
RECEIPT_DONE=0
trap 'rc=$?; [ "$RECEIPT_DONE" = 1 ] || receipt FAILED "script exited rc=$rc before writing a receipt (script error; see ~/lanes/logs/mill-kaggle-daily.cron.log)" "$rc"' EXIT
fail() { receipt FAILED "$1" "${2:-1}"; exit "${2:-1}"; }

exec 9>/tmp/mill-kaggle-daily.lock
flock -n 9 || { receipt SKIPPED "previous run still holds the lock" 75; exit 75; }

# 1. disk floor (Oracle is ~91% full): skip, loudly, below 2 GB on either filesystem
fr=$(df -Pk / | awk 'NR==2{print int($4/1024)}'); fb=$(df -Pk /evac-bulk | awk 'NR==2{print int($4/1024)}')
[ "$fr" -ge "$FLOOR_M" ] && [ "$fb" -ge "$FLOOR_M" ] || fail "disk floor: root=${fr}M bulk=${fb}M < ${FLOOR_M}M; nothing run"

# 2. Kaggle quota guard: trailing 7 days of kernel wall time recorded by this job
used_s=$(python3 - "$LOG" <<'PY'
import sys, re, datetime
cut = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7); s = 0
try:
    for l in open(sys.argv[1]):
        m = re.search(r"kernel_wall_s=(\d+)", l)
        if m and datetime.datetime.strptime(l[:20], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc) > cut:
            s += int(m.group(1))
except FileNotFoundError:
    pass
print(s)
PY
)
[ "$used_s" -lt $((QUOTA_CAP_H * 3600)) ] || fail "quota guard: ${used_s}s of kernel wall in 7 days >= ${QUOTA_CAP_H}h cap"

# 3. prerequisites
[ -s "$TOKEN" ] || fail "pod token absent ($TOKEN)"
[ -x "$KAGGLE" ] || fail "kaggle CLI absent ($KAGGLE)"
[ -d "$CLONE/.git" ] || fail "clone absent ($CLONE)"

# 4. code: fetch REAL master from the build pod staging mirror (port read from the auto-land trigger, one truth)
PORT=$(sed -n 's/^PORT=\([0-9]*\).*/\1/p' $HOME/lanes/bin/auto-land-trigger.sh | head -1)
HOSTP=$(sed -n 's/.*HOST=\(root@[0-9.]*\).*/\1/p' $HOME/lanes/bin/auto-land-trigger.sh | head -1)
export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=20 -i $FLEET_KEY -p ${PORT:-0}"
git -C "$CLONE" remote set-url origin "ssh://$HOSTP/workspace/staging/mirror/councilof-ai.git"
base_note=fetched
git -C "$CLONE" fetch -q origin master 2>>"$BASE/fetch.err" || base_note="FETCH_FAILED(using last fetched origin/master)"
git -C "$CLONE" reset -q --hard && git -C "$CLONE" clean -qfd \
  && git -C "$CLONE" checkout -q -B "$BRANCH" origin/master || fail "checkout $BRANCH from origin/master failed"
COMMIT=$(git -C "$CLONE" rev-parse HEAD)
mkdir -p "$W/kernel/push" "$W/pull" "$W/gate"
echo "base=$COMMIT $base_note" > "$W/base.txt"

# 5. pinned inputs: code tarball, banks (checked against the allowlist before they leave Oracle), model digest (3090 intake pin, or newest-models.json for the newest class)
git -C "$CLONE" archive --format=tar.gz -o "$W/kernel/code.tar.gz" HEAD \
  scripts/runpod_gspc_worker.py scripts/generate_runpod_gspc_playlist.py scripts/verify_runpod_gspc_intake.py \
  scripts/runpod_gspc_bank_allowlist.current.json harness/typed_output || fail "git archive failed"
python3 - "$CLONE" "$BANKS" <<'PY' || fail "bank pin check on Oracle failed (see above)"
import hashlib, json, sys, pathlib
clone, banks = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
sys.path.insert(0, str(clone / "scripts")); import generate_runpod_gspc_playlist as g
pins = {}
for r in json.load(open(clone / "scripts/runpod_gspc_bank_allowlist.current.json"))["banks"]:
    pins.setdefault(r["axis"], set()).add(r["sha256"])
bad = [(a, n) for a, n in g.AXES if hashlib.sha256((banks / n).read_bytes()).hexdigest() not in pins.get(a, set())]
if bad: print("BANK_PIN_MISMATCH", bad); raise SystemExit(1)
PY
( cd "$BANKS" && tar -czf "$W/kernel/banks.tar.gz" --owner=0 --group=0 --mtime=2026-09-28 gspc-*.jsonl ) || fail "banks tar failed"
DIGEST=$(python3 - "$CLONE/public/interop/mill-evidence" "$MODEL" <<'PY'
import glob, json, sys
d = set()
for f in glob.glob(sys.argv[1] + "/runpod-verification-*.json"):
    j = json.load(open(f))
    if j.get("subject", "").startswith("ollama:%s@" % sys.argv[2]): d.add(j.get("model_manifest_digest"))
print(d.pop().removeprefix("sha256:") if len(d) == 1 else "")
PY
)
PIN_SOURCE=3090-intake-receipts
if [ ${#DIGEST} -ne 64 ]; then   # not a 3090 fleet model: it must be a newest-class model pinned in $NEWEST
  DIGEST=$(python3 -c 'import json,sys; print(next((m["digest"] for m in json.load(open(sys.argv[1]))["models"] if m["tag"] == sys.argv[2]), ""))' "$NEWEST" "$MODEL" 2>/dev/null)
  PIN_SOURCE=newest-models.json
fi
[ ${#DIGEST} -eq 64 ] || fail "no pinned manifest digest for $MODEL (neither a single 3090 digest in the intake receipts nor an entry in $NEWEST)"
echo "pick=$PICK_NOTE pin_source=$PIN_SOURCE digest=$DIGEST" >> "$W/base.txt"
python3 - "$TPL" "$W/kernel" "$COMMIT" "$MODEL" "$DIGEST" "$H-$SLUG" "$REPEATS" "$BUDGET_S" "$PIN_SOURCE" <<'PY' || fail "kernel render failed"
import base64, hashlib, sys
tpl, kd, commit, model, digest, sid, reps, budget, pin_source = sys.argv[1:]
code = open(kd + "/code.tar.gz", "rb").read(); banks = open(kd + "/banks.tar.gz", "rb").read()
s = open(tpl).read()
for k, v in (("@@CODE_SHA@@", hashlib.sha256(code).hexdigest()), ("@@CODE_B64@@", base64.b64encode(code).decode()),
             ("@@BANKS_SHA@@", hashlib.sha256(banks).hexdigest()), ("@@BANKS_B64@@", base64.b64encode(banks).decode()),
             ("@@CODE_COMMIT@@", commit), ("@@MODEL@@", model), ("@@MODEL_DIGEST@@", digest), ("@@SLICE_ID@@", sid),
             ("@@REPEATS@@", reps), ("@@BUDGET_SECONDS@@", budget), ("@@PIN_SOURCE@@", pin_source)):
    s = s.replace(k, v)
assert "@@" not in s, "unrendered placeholder"
open(kd + "/push/csoai-mill-kaggle-daily.py", "w").write(s)
PY
cat > "$W/kernel/push/kernel-metadata.json" <<META
{"id": "$KID", "title": "${KID#*/}", "code_file": "csoai-mill-kaggle-daily.py", "language": "python",
 "kernel_type": "script", "is_private": true, "enable_gpu": true, "enable_tpu": false, "enable_internet": true,
 "keywords": [], "dataset_sources": [], "kernel_sources": [], "competition_sources": [], "model_sources": [],
 "machine_shape": "NvidiaTeslaT4"}
META

# 6. push, wait, pull
"$KAGGLE" kernels push -p "$W/kernel/push" > "$W/push.log" 2>&1 || fail "kaggle push failed: $(tail -1 "$W/push.log")"
grep -qiE "error|fail" "$W/push.log" && fail "kaggle push said: $(tail -1 "$W/push.log")"
sleep 90; s=""; fresh=no
for _ in $(seq 1 "$WAIT_MIN"); do
  s=$("$KAGGLE" kernels status "$KID" 2>&1 | tail -1)
  case "$s" in
    *RUNNING*|*QUEUED*|*running*|*queued*) sleep 60 ;;
    *COMPLETE*|*complete*)   # a COMPLETE status can be the PREVIOUS version's: accept only output carrying this slice id
      rm -rf "$W/pull" && mkdir -p "$W/pull"
      "$KAGGLE" kernels output "$KID" -p "$W/pull" > "$W/pull.log" 2>&1 || fail "kaggle output pull failed (kernel status: $s)"
      sid=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("slice_id"))' "$W/pull/environment.json" 2>/dev/null || echo NONE)
      [ "$sid" = "$H-$SLUG" ] && { fresh=yes; break; }; sleep 60 ;;
    *) break ;;
  esac
done
case "$s" in *COMPLETE*|*complete*) ;; *) fail "kernel did not complete: status '$s'" ;; esac
[ "$fresh" = yes ] || fail "kernel output never carried slice_id $H-$SLUG within ${WAIT_MIN} min (stale version or still running)"
kstate=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("state"))' "$W/pull/environment.json" 2>/dev/null || echo NONE)
kernel_s=$(python3 -c 'import json,sys; print(int(json.load(open(sys.argv[1])).get("wall_seconds") or 0))' "$W/pull/environment.json" 2>/dev/null || echo 0)
case "$kstate" in COMPLETE|COMPLETE_WITH_FAILED_JOBS|PARTIAL_BUDGET) ;; *) fail "kernel environment.state=$kstate ($(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("detail",""))' "$W/pull/environment.json" 2>/dev/null))" ;; esac
runs=$(python3 -c 'import json,sys; print(sum(1 for r in json.load(open(sys.argv[1])).get("runs",[]) if r.get("rc")==0 and r.get("repeat")==1))' "$W/pull/environment.json")
trunc=$(python3 -c 'import json,sys; e=json.load(open(sys.argv[1])); print("%d/%d" % (sum(r["done_reason_length"] for r in e.get("run_results",[])), sum(r["items_rows"] for r in e.get("run_results",[]))))' "$W/pull/environment.json")

# 7. verify -> stage -> land (the mill-hourly.sh steps, verbatim targets: the clone's public/interop dirs)
AL=$CLONE/scripts/runpod_gspc_bank_allowlist.current.json
for d in "$W"/pull/slice/run1/runs/*/*/runs/*/; do
  [ -f "$d/card-unsigned.json" ] || continue
  ( cd "$CLONE" && python3 scripts/verify_runpod_gspc_intake.py --run-dir "${d%/}" --bank-allowlist "$AL" --quarantine-root "$W/gate/quarantine" ) >> "$W/land.log" 2>&1
done
mkdir -p "$W/gate/stage"
( cd "$CLONE" && python3 scripts/pod-loops/chain_tools.py stage --quarantine "$W/gate/quarantine" --stage "$W/gate/stage" ) >> "$W/land.log" 2>&1
( cd "$CLONE" && python3 scripts/land_mill_cards.py --staged "$W/gate/stage" --require-evidence \
    --inbox public/interop/mill-cards-unsigned --signed public/interop/mill-cards-signed \
    --evidence public/interop/mill-evidence --bank-allowlist "$AL" ) >> "$W/land.log" 2>&1
landed=$(python3 -c 'import json,sys; print(len(json.load(open(sys.argv[1]))["landed"]))' "$W/gate/stage/land-report.json" 2>/dev/null || echo 0)
[ "$landed" -gt 0 ] || fail "intake landed 0 of $runs runs (see $W/land.log)"

# 8. sign ONLY this slice's cards, with the pod caller token (key stays on Pages)
mkdir -p "$W/inbox"
python3 - "$W" "$CLONE" <<'PY'
import json, shutil, sys
from pathlib import Path
w, clone = Path(sys.argv[1]), Path(sys.argv[2])
for row in json.load(open(w / "gate/stage/land-report.json"))["landed"]:
    staged = next(iter((w / "gate/stage").rglob(row["file"])), None)
    if staged is None: continue
    wr = json.load(open(staged)); name = f"unsigned-{str(wr['body']['axis'])[:8]}-{str(wr['id'])[:12]}.json"
    src = clone / "public/interop/mill-cards-unsigned" / name
    if src.is_file(): shutil.copy2(src, w / "inbox" / name)
PY
( cd "$CLONE" && python3 scripts/sign_mill_cards.py --source-dir "$W/inbox" --dest-dir public/interop/mill-cards-signed \
    --evidence-dir public/interop/mill-evidence --require-hub-admission --pod-token-file "$TOKEN" \
    --did did:web:csoai.org#board-attestation-1 ) > "$W/sign.log" 2>&1; rc_sign=$?
signed=$(grep -c '^SIGNED ' "$W/sign.log" || true)
[ "$signed" -gt 0 ] || fail "signer signed 0 of $landed landed cards rc=$rc_sign: $(grep -m1 UNSIGNED "$W/sign.log")"
( cd "$CLONE" && python3 scripts/card_root.py --stamp --signed-dir public/interop/mill-cards-signed --out-dir public/interop \
    && python3 scripts/card_root.py --verify --signed-dir public/interop/mill-cards-signed --out-dir public/interop ) > "$W/root.log" 2>&1 \
  || fail "card_root stamp/verify failed (see $W/root.log)"

# 9. runtime sidecar (the card schema pins its key set; the substrate is declared beside it, not inside)
mkdir -p "$CLONE/docs/mill-runtime"
python3 - "$W/pull/environment.json" "$CLONE/docs/mill-runtime/$H-$SLUG.kaggle-environment.json" "$KID" <<'PY'
import json, sys
e = json.load(open(sys.argv[1])); e.pop("code", None)
e["substrate"] = f"Kaggle kernel {sys.argv[3]} (private, 2x Tesla T4), triggered from oracle-micro-2"
e["note"] = "SIDECAR: the card intake contract pins the card body key set, so the runtime is declared here, not in the card"
open(sys.argv[2], "w").write(json.dumps(e, indent=2, sort_keys=True) + "\n")
PY

# 10. commit on the slice branch and land it (never merged here; publication needs ADMITTED, the owner's rule)
git -C "$CLONE" add -f public/interop/mill-cards-unsigned public/interop/mill-cards-signed public/interop/mill-evidence \
  'public/interop/card-root-*' "docs/mill-runtime/$H-$SLUG.kaggle-environment.json" 2>>"$W/land.log"
git -C "$CLONE" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "mill/auto-$H: $MODEL x $runs axes on Kaggle 2xT4 (oracle-micro-2 daily); landed=$landed signed=$signed (pod token, #board-attestation-1); measurement, not certification

Substrate: private Kaggle kernel $KID, runtime sidecar docs/mill-runtime/$H-$SLUG.kaggle-environment.json.
Instrument, banks (allowlist pins) and decode are the mill-hourly.sh ones. Model digest pin source: $PIN_SOURCE ($DIGEST); selection: $PICK_NOTE.
done_reason=length: $trunc items. Kernel state: $kstate." || fail "commit failed"
commit=$(git -C "$CLONE" rev-parse --short HEAD)
git -C "$CLONE" bundle create "$W/slice.bundle" "origin/master..$BRANCH" >/dev/null 2>&1
if git -C "$CLONE" push -q origin "$BRANCH" 2>>"$W/land.log"; then landed_to=build-pod-staging-mirror
elif git -C "$CLONE" push -q "$HOME/mirrors/councilof-ai.git" "$BRANCH" 2>>"$W/land.log"; then landed_to=oracle-mirror-FALLBACK
else fail "push to both the build pod staging mirror and the Oracle mirror failed; slice kept at $W/slice.bundle"; fi

# 11. keep the signed slice small on Oracle: drop the model server log, keep receipts/cards/evidence
rm -f "$W/pull/ollama-serve.log" "$W/kernel/push/csoai-mill-kaggle-daily.py"
ls -1d "$OUTROOT"/*/ 2>/dev/null | head -n -30 | xargs -r rm -rf   # keep the last 30 slices
st=OK; [ "$kstate" = COMPLETE ] || st="OK_$kstate"
[ "$runs" -eq 14 ] || st="OK_PARTIAL_${runs}_of_14"
receipt "$st" "kernel=$kstate sign_rc=$rc_sign trunc=$trunc base=${COMMIT:0:9}($base_note) pick=$PICK_NOTE pin=$PIN_SOURCE" 0
exit 0
