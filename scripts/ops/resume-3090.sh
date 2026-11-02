#!/bin/bash
# resume-3090.sh — bring the RunPod 3090 (rp-3090-now, pod fpowppss5ngtkw) back and land ONE named lane bundle.
# Idempotent: every step checks before it acts, so a second run after a partial one only does what is left.
# Runs on the operator's machine (needs runpodctl + ssh to the pod and to Oracle). Writes nothing large locally:
# the bundle goes Oracle -> pod directly (or is streamed through this machine's pipe, never to its disk).
#
#   bash scripts/ops/resume-3090.sh                     # full resume; prints the ssh Host block to update
#   bash scripts/ops/resume-3090.sh --write-ssh-config  # same, and rewrites HostName/Port of Host rp-3090-now
#                                                       # in ~/.ssh/config (backup ~/.ssh/config.bak-resume-<ts>)
#   bash scripts/ops/resume-3090.sh --verify            # only the verification checklist (pod must be running)
#
# THE ONE BUNDLE. This script lands exactly ~/lanes/cross-ledger-usdc-20260925.bundle (branch
# lane/cross-ledger-usdc-20260925) from Oracle. It names that file and never globs ~/lanes/*.bundle: other
# bundles sit there on purpose — ~/lanes/claim-entity-decode.bundle is HELD for an owner ruling and fails a
# frozen-reference gate by design; it must never be landed by any script.
#
# Refuses to do anything if the RunPod balance (runpodctl user -> clientBalance) is below MIN_BALANCE (5).
# If the host's GPU was re-let while the pod was stopped, `runpodctl pod start` fails with "not enough free
# GPUs"; this script then prints the console choices and stops (no scripted zero-GPU resume exists: the
# runpodctl key is REST-only, GraphQL answers 401). On a CPU-only start (gpuCount 0) it does NOT start
# Ollama — serving the models on CPU would be an instrument change; mill/arena HALT on the missing Ollama
# by design and garak-weekly skips, while cross-ledger and the HITL probe run on CPU.
# Steps: see scripts/pod-loops/RESUME-3090.md (the same list, with the why).
set -u
POD_ID=${POD_ID:-fpowppss5ngtkw}
MIN_BALANCE=${MIN_BALANCE:-5}
ORACLE=${ORACLE_HOST:-oracle-micro-2}
BUNDLE_NAME=cross-ledger-usdc-20260925.bundle
BUNDLE_BRANCH=lane/cross-ledger-usdc-20260925
KEY=${RP_SSH_KEY:-$HOME/.runpod/ssh/runpodctl-ssh-key}
KNOWN=${RP_KNOWN_HOSTS:-$HOME/.ssh/known_hosts_rp3090}
WRITE_SSH=0; VERIFY_ONLY=0
for a in "$@"; do
  case $a in
    --write-ssh-config) WRITE_SSH=1 ;;
    --verify) VERIFY_ONLY=1 ;;
    *) echo "unknown argument: $a"; exit 64 ;;
  esac
done
say() { printf '%s %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
die() { say "STOP $*"; exit "${2:-1}"; }
command -v runpodctl >/dev/null || die "runpodctl not found" 2
command -v python3 >/dev/null || die "python3 not found" 2

# 0. money first: nothing happens below 5
bal=$(runpodctl user -o json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["clientBalance"])' 2>/dev/null) \
  || die "could not read clientBalance from runpodctl user; refusing (fail closed)" 3
python3 -c 'import sys; sys.exit(0 if float(sys.argv[1]) >= float(sys.argv[2]) else 1)' "$bal" "$MIN_BALANCE" \
  || die "RunPod balance $bal is below $MIN_BALANCE; top up first. Nothing was started." 3
say "balance $bal >= $MIN_BALANCE"

pod_state() {  # prints: <runtimeStatus> <ip> <port> <gpuCount>
  runpodctl pod get "$POD_ID" -o json 2>/dev/null | python3 -c '
import json, re, sys
d = json.load(sys.stdin); s = d.get("ssh") or {}
ip = s.get("ip") or s.get("host") or d.get("publicIp") or ""
port = s.get("port") or (d.get("portMappings") or {}).get("22") or ""
cmd = s.get("command") or ""
if (not ip or not port) and cmd:
    m = re.search(r"-p\s+(\d+)", cmd); h = re.search(r"@([0-9.]+)", cmd)
    port = port or (m.group(1) if m else ""); ip = ip or (h.group(1) if h else "")
print(d.get("runtimeStatus") or d.get("desiredStatus") or "unknown", ip or "-", port or "-", d.get("gpuCount", "?"))'
}

# 1. start (only if not running) and wait for RUNNING with an ssh endpoint
read -r st IP PORT GPUS < <(pod_state) || die "runpodctl pod get $POD_ID failed" 2
if [ "$st" != "running" ] && [ "$VERIFY_ONLY" = "0" ]; then
  say "pod $POD_ID is $st; starting"
  out=$(runpodctl pod start "$POD_ID" 2>&1); rc=$?
  if printf '%s' "$out" | grep -qiE "not enough free gpus|no (free|available) gpu|insufficient.*gpu"; then
    cat <<'EOF'
STOP the GPU this pod was on has been re-let while it was stopped ("not enough free GPUs on the host machine").
There is no scripted zero-GPU resume (the runpodctl key is REST-only; GraphQL answers 401). In the RunPod
console: Pods -> sov-repull-20260808 (fpowppss5ngtkw) -> Start. The dialog offers:
  1. "Automatically migrate your Pod data"  - a host with a free GPU; /workspace is copied; host AND port change
  2. "Start Pod using CPUs"                 - same /workspace, gpuCount 0 (~$0.11/h); /root overlay ~5 GB, wiped;
                                              no Ollama, so mill/arena HALT and garak skips (cross-ledger, HITL run)
  3. "Do nothing"
Pick one, then re-run this script: every step below checks state first and does only what is left.
EOF
    exit 4
  fi
  [ $rc -eq 0 ] || die "runpodctl pod start $POD_ID failed: $(printf '%s' "$out" | head -c 300)" 4
fi
for i in $(seq 1 80); do
  read -r st IP PORT GPUS < <(pod_state)
  [ "$st" = "running" ] && [ "$IP" != "-" ] && [ "$PORT" != "-" ] && break
  [ "$VERIFY_ONLY" = "1" ] && die "pod is $st; --verify needs it running" 5
  sleep 15
done
[ "$st" = "running" ] && [ "$IP" != "-" ] && [ "$PORT" != "-" ] || die "pod not RUNNING with an ssh endpoint after 20 min (state=$st ip=$IP port=$PORT)" 5
say "pod RUNNING ssh root@$IP -p $PORT gpuCount=$GPUS"

# 2. the endpoint drifts on every restart: print (or, with --write-ssh-config, write) the Host block
cat <<EOF
---- ~/.ssh/config block for this start (ports drift on restart) ----
Host rp-3090-now
  HostName $IP
  Port $PORT
  User root
  IdentityFile ~/.runpod/ssh/runpodctl-ssh-key
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
----------------------------------------------------------------------
EOF
if [ "$WRITE_SSH" = "1" ]; then
  cp -p "$HOME/.ssh/config" "$HOME/.ssh/config.bak-resume-$(date -u +%Y%m%dT%H%M%SZ)" || die "could not back up ~/.ssh/config" 6
  python3 - "$HOME/.ssh/config" "$IP" "$PORT" <<'PY' || die "could not rewrite Host rp-3090-now" 6
import re, sys
path, ip, port = sys.argv[1:]
lines = open(path).read().split("\n"); out = []; inblock = False; seen = False
for l in lines:
    if re.match(r"^\s*Host\s", l):
        inblock = l.split()[1:] == ["rp-3090-now"]; seen = seen or inblock
    elif inblock and re.match(r"^\s*HostName\s", l):
        l = re.sub(r"(HostName\s+)\S+", r"\g<1>" + ip, l)
    elif inblock and re.match(r"^\s*Port\s", l):
        l = re.sub(r"(Port\s+)\S+", r"\g<1>" + port, l)
    out.append(l)
if not seen:
    sys.exit("no Host rp-3090-now block in " + path)
open(path, "w").write("\n".join(out))
PY
  say "wrote HostName/Port into ~/.ssh/config (backup kept)"
fi

# Trust-on-first-use per restart: the container's host key can change when the pod restarts, so this run
# forgets only this endpoint's old key in its own known_hosts file and accepts the new one once.
touch "$KNOWN"; ssh-keygen -R "[$IP]:$PORT" -f "$KNOWN" >/dev/null 2>&1
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$KNOWN" \
     -o IdentitiesOnly=yes -i "$KEY" -p "$PORT" "root@$IP")
for i in $(seq 1 20); do "${SSH[@]}" true </dev/null 2>/dev/null && break; sleep 15; done
"${SSH[@]}" true </dev/null || die "sshd on root@$IP:$PORT not answering" 5

verify() {
  say "---- verification checklist ----"
  printf '  [site]      '; curl -sI --max-time 20 https://councilof.ai | head -1 | tr -d '\r'; echo
  code=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' https://councilof.ai/interop/cross-ledger-usdc-2026-09-25.json)
  echo "  [artifact]  /interop/cross-ledger-usdc-2026-09-25.json -> HTTP $code (200 expected once the queued deploy finishes)"
  "${SSH[@]}" 'bash -s' <<'REMOTE'
L=/workspace/lanes
p=$(cat $L/state/scheduler.pid 2>/dev/null)
if [ -n "$p" ] && [ -r /proc/$p/cmdline ]; then echo "  [scheduler] pid=$p alive"; else echo "  [scheduler] NOT RUNNING (pid file: '${p:-empty}')"; fi
echo "  [scheduler] last START: $(grep ' START ' $L/logs/scheduler.log 2>/dev/null | tail -1)"
echo "  [scheduler] self-restart after install: $(grep 'changed on disk' $L/logs/scheduler.log 2>/dev/null | tail -1)"
M=$(date -u +%-M); H=$(date -u +%H)
if [ "$M" -lt 10 ]; then nxt="${H}:10Z"; else nxt="$(date -u -d '+1 hour' +%H):10Z"; fi
echo "  [mill]      next slot $nxt; last receipt: $(tail -1 $L/logs/mill-hourly.log 2>/dev/null | cut -c1-160)"
echo "  [land]      last: $(tail -1 $L/logs/mill-hourly-land.log 2>/dev/null | cut -c1-160)"
echo "  [deploy]    $(tail -1 /workspace/ci/deploy-prod.log 2>/dev/null | cut -c1-160)"
if nvidia-smi -L >/dev/null 2>&1; then echo "  [gpu]       $(nvidia-smi -L | head -1)"; else echo "  [gpu]       NONE (CPU-only start): Ollama deliberately not served; mill/arena HALT, garak skips"; fi
echo "  [ollama]    $(curl -s --max-time 5 127.0.0.1:11434/api/tags | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["models"]), "models")' 2>/dev/null || echo DOWN)"
echo "  [mirror]    oracle-mirror alias: $(ssh -G oracle-mirror 2>/dev/null | awk '/^hostname /{print $2}') (Include /workspace/secrets/ssh/config: $(grep -qs 'Include /workspace/secrets/ssh/config' /root/.ssh/config && echo present || echo ABSENT))"
for f in cross-ledger.sh hitl-probe-weekly.sh garak-weekly.sh; do
  [ -s $L/loops/$f ] && echo "  [loop]      $f installed" || echo "  [loop]      $f NOT installed"
done
echo "  [cross-ledger] next run 04:20Z; last: $(tail -1 $L/logs/cross-ledger.log 2>/dev/null | cut -c1-160)"
cfg=/workspace/condor-gspc/data/gspc_garak/garak-pilot-config.yaml
[ "$(sha256sum $cfg 2>/dev/null | cut -c1-64)" = cff6c19bfd53de598080de9393bf0d860ad15bf2812bf5901a2ab073de66ade4 ] \
  && echo "  [garak]     pinned config present" || echo "  [garak]     pinned config ABSENT/changed at $cfg (garak-weekly will FAIL closed)"
b=""; for f in $(find $L/out/effect-binding-server-* -maxdepth 2 -type f -name '*.json' -size -512M 2>/dev/null); do
  [ "$(sha256sum "$f" | cut -c1-64)" = 5043ce0b4d69b712389fc13cd990e0b1af1d3415ebd472c446b250810563e3f1 ] && { b=$f; break; }; done
echo "  [hitl]      bank ${b:-NOT FOUND under out/effect-binding-server-* (set HITL_BANK or the weekly pilot HOLDs)}"
REMOTE
}
if [ "$VERIFY_ONLY" = "1" ]; then verify; exit 0; fi

# 3. services: ollama, Desktop Commander keepalive, the scheduler supervisor
"${SSH[@]}" 'bash -s' <<'REMOTE' || die "service start on the pod failed (see above)" 7
set -u
L=/workspace/lanes; mkdir -p $L/logs
# /root is wiped on every container start; the pod->Oracle key and its Host block live on /workspace
# (the same line supervise.sh runs on start). Without it the oracle-mirror alias does not exist.
[ -f /workspace/secrets/ssh/config ] && { mkdir -p /root/.ssh; grep -qs "Include /workspace/secrets/ssh/config" /root/.ssh/config || { printf "Include /workspace/secrets/ssh/config\n" | cat - /root/.ssh/config 2>/dev/null > /root/.ssh/config.new || true; mv /root/.ssh/config.new /root/.ssh/config; chmod 600 /root/.ssh/config; }; }
if nvidia-smi -L >/dev/null 2>&1; then
  if ! curl -s --max-time 3 127.0.0.1:11434/api/tags >/dev/null; then
    [ -x /workspace/ollama-bin/bin/ollama ] || { echo "FAIL /workspace/ollama-bin/bin/ollama absent"; exit 2; }
    OLLAMA_MODELS=/workspace/ollama-models setsid nohup /workspace/ollama-bin/bin/ollama serve >>$L/logs/ollama-serve.log 2>&1 </dev/null &
    for i in $(seq 1 45); do curl -s --max-time 2 127.0.0.1:11434/api/tags >/dev/null && break; sleep 2; done
  fi
  n=$(curl -s --max-time 5 127.0.0.1:11434/api/tags | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["models"]))' 2>/dev/null) \
    || { echo "FAIL ollama :11434 not answering"; exit 2; }
  echo "GPU $(nvidia-smi -L | head -1); ollama :11434 up, $n models (OLLAMA_MODELS=/workspace/ollama-models)"
else
  echo "CPU-only pod (no nvidia-smi): Ollama NOT started - serving on CPU would change the instrument."
  echo "  mill-hourly/arena-hourly will HALT on the missing Ollama (intended); garak-weekly skips; cross-ledger + hitl run."
fi
if [ -x /workspace/tools/dc/keepalive.sh ]; then
  pgrep -f dc/keepalive.sh >/dev/null || { setsid nohup /workspace/tools/dc/keepalive.sh >/dev/null 2>&1 </dev/null & echo "Desktop Commander keepalive started"; }
else echo "Desktop Commander keepalive not present (skipped)"; fi
bash $L/loops/start.sh || { echo "FAIL loops/start.sh"; exit 3; }
p=$(cat $L/state/scheduler.pid 2>/dev/null); [ -n "$p" ] && [ -r /proc/$p/cmdline ] || { echo "FAIL no live scheduler pid"; exit 3; }
echo "scheduler pid=$p; $(grep ' START ' $L/logs/scheduler.log | tail -1)"
REMOTE

# 4. the ONE bundle, Oracle -> pod, checked by sha256 on both ends
osha=$(ssh -o BatchMode=yes "$ORACLE" "sha256sum lanes/$BUNDLE_NAME" </dev/null 2>/dev/null | cut -c1-64)
[ ${#osha} -eq 64 ] || die "Oracle has no lanes/$BUNDLE_NAME" 8
psha=$("${SSH[@]}" "sha256sum /workspace/ci/$BUNDLE_NAME 2>/dev/null | cut -c1-64" </dev/null)
if [ "$psha" != "$osha" ]; then
  if ! "${SSH[@]}" "scp -q -o BatchMode=yes -o ConnectTimeout=20 oracle-mirror:lanes/$BUNDLE_NAME /workspace/ci/$BUNDLE_NAME" </dev/null 2>/dev/null; then
    say "pod's oracle-mirror alias did not serve it (container /root/.ssh lost?); streaming through this machine's pipe"
    ssh -o BatchMode=yes "$ORACLE" "cat lanes/$BUNDLE_NAME" </dev/null | "${SSH[@]}" "cat > /workspace/ci/$BUNDLE_NAME" \
      || die "bundle transfer failed" 8
  fi
  psha=$("${SSH[@]}" "sha256sum /workspace/ci/$BUNDLE_NAME | cut -c1-64" </dev/null)
fi
[ "$psha" = "$osha" ] || die "bundle sha256 on pod ${psha:0:12} != Oracle ${osha:0:12}" 8
say "bundle $BUNDLE_NAME on pod, sha256 ${osha:0:12}… matches Oracle"

# 5. land via /workspace/ci/merge (under the lander's own lock), install loops, drift check, $REPO sparse set
"${SSH[@]}" "bash -s -- $BUNDLE_NAME $BUNDLE_BRANCH" <<'REMOTE' || die "landing on the pod stopped (see above); nothing further done" 9
set -u
B=/workspace/ci/$1; BR=$2
L=/workspace/lanes; LOOPS=$L/loops; MERGE=/workspace/ci/merge
G=(git -c user.name=CSOAI -c user.email=nicholas@csoai.org)
exec 6>$L/state/mill-hourly-land.lock
flock -w 900 6 || { echo "FAIL mill-hourly-land lock busy for 15 min"; exit 2; }
cd $MERGE || exit 2
git fetch -q origin && git checkout -q -f -B master origin/master || { echo "FAIL merge clone checkout"; exit 2; }
git bundle verify -q "$B" >/dev/null 2>&1 || { echo "FAIL git bundle verify $B (prerequisite commit missing from the bare repo?)"; exit 2; }
PRE=$(git rev-parse HEAD)
git fetch -q -f "$B" "$BR:refs/lanes/$BR" || { echo "FAIL fetch $BR from bundle"; exit 2; }
TIP=$(git rev-parse "refs/lanes/$BR")
if git merge-base --is-ancestor "$TIP" origin/master; then
  echo "ALREADY-LANDED $BR ${TIP:0:10} is in master"
else
  "${G[@]}" merge -q --no-ff --no-edit "refs/lanes/$BR" -m "Merge $BR: cross-ledger USDC pilot + pod loops (cross-ledger daily, hitl + garak weekly) + Layer O registration (unsigned)" \
    || { git merge --abort; echo "CONFLICT merging $BR; left for a human"; exit 3; }
  fail=0
  for f in scripts/pod-loops/cross-ledger.sh scripts/pod-loops/hitl-probe-weekly.sh scripts/pod-loops/garak-weekly.sh \
           scripts/pod-loops/supervise.sh scripts/pod-loops/scheduler.sh scripts/pod-loops/lib.sh scripts/pod-loops/mill-hourly-land.sh scripts/ops/resume-3090.sh; do
    bash -n "$f" || { echo "GATE bash -n $f"; fail=1; }
  done
  python3 -m unittest -q scripts/readers/test_cross_ledger_supply.py >/tmp/xl-unittest.log 2>&1 || { echo "GATE reader unittest"; tail -5 /tmp/xl-unittest.log; fail=1; }
  for j in public/interop/cross-ledger-usdc-2026-09-25.json council-os/layer-o-registrations/2026-09-25-measurement-harnesses.json scripts/pod-loops/INSTALLED.json; do
    python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$j" || { echo "GATE json $j"; fail=1; }
  done
  [ $fail -eq 0 ] || { git reset -q --hard "$PRE"; echo "HOLD gates failed; merge undone, nothing pushed"; exit 4; }
  git push -q origin master || { git reset -q --hard "$PRE"; echo "FAIL push master"; exit 4; }
  echo "LANDED $BR ${TIP:0:10} as $(git rev-parse --short HEAD) on master"
fi
HEADREV=$(git rev-parse HEAD)
# install: only over bytes that are exactly master-before-merge (or absent); anything else is a HOLD, never overwritten
held=0
for f in lib.sh supervise.sh cross-ledger.sh hitl-probe-weekly.sh garak-weekly.sh mill-hourly-land.sh scheduler.sh; do
  new=$(git show "$HEADREV:scripts/pod-loops/$f" | sha256sum | cut -c1-64)
  if git cat-file -e "$PRE:scripts/pod-loops/$f" 2>/dev/null; then base=$(git show "$PRE:scripts/pod-loops/$f" | sha256sum | cut -c1-64); else base=ABSENT; fi
  have=$(sha256sum "$LOOPS/$f" 2>/dev/null | cut -c1-64); have=${have:-ABSENT}
  if [ "$have" = "$new" ]; then echo "SAME      $f"; continue; fi
  if [ "$have" = "ABSENT" ] || [ "$have" = "$base" ]; then
    [ "$have" = "ABSENT" ] || cp -p "$LOOPS/$f" "$LOOPS/$f.pre-resume-$(date -u +%Y%m%dT%H%M%SZ)"
    git show "$HEADREV:scripts/pod-loops/$f" > "$LOOPS/.$f.tmp" && mv "$LOOPS/.$f.tmp" "$LOOPS/$f" && echo "INSTALLED $f ${new:0:12}"
  else
    echo "HOLD      $f pod=${have:0:12} is neither master-before-merge ${base:0:12} nor lane ${new:0:12}; not overwritten"; held=1
  fi
done
# the mirror must describe the pod: regenerate, drop PENDING_INSTALL repo_only entries now installed, check
POD_LOOPS_DIR=$LOOPS bash scripts/pod-loops-drift-check.sh --write
python3 - scripts/pod-loops/INSTALLED.json <<'PY'
import json, sys
p = sys.argv[1]; m = json.load(open(p))
ro = m.get("repo_only") or {}
for k in [k for k, v in ro.items() if k in m.get("installed", {}) and str(v).startswith("PENDING_INSTALL")]:
    del ro[k]
open(p, "w").write(json.dumps(m, indent=2) + "\n")
PY
if POD_LOOPS_DIR=$LOOPS bash scripts/pod-loops-drift-check.sh; then
  git add scripts/pod-loops/INSTALLED.json
  if ! git diff --cached --quiet; then
    "${G[@]}" commit -q -m "pod-loops: INSTALLED.json regenerated on the pod after the resume install (drift check OK)" \
      && git push -q origin master && echo "PUSHED INSTALLED.json $(git rev-parse --short HEAD)"
  fi
else
  git checkout -q -- scripts/pod-loops/INSTALLED.json; echo "DRIFT remains (lines above); INSTALLED.json not committed"
fi
# $REPO: the loops' sparse clone must carry scripts/readers, scripts/adapters, scripts/hitl
. $LOOPS/lib.sh
if [ ! -d "$REPO/.git" ]; then
  git clone -q --shared --no-checkout /workspace/git/councilof-ai.git "$REPO" && git -C "$REPO" sparse-checkout init --cone \
    && git -C "$REPO" sparse-checkout set $REPO_SPARSE && git -C "$REPO" checkout -q master && echo "RECLONED \$REPO sparse"
fi
if type repo_sparse_ensure >/dev/null 2>&1; then repo_sparse_ensure; else git -C "$REPO" sparse-checkout add scripts/readers scripts/adapters scripts/hitl; fi
git -C "$REPO" fetch -q origin master && git -C "$REPO" merge -q --ff-only origin/master
echo "\$REPO at $(git -C "$REPO" rev-parse --short HEAD); sparse: $(git -C "$REPO" sparse-checkout list | tr '\n' ' ')"
[ $held -eq 0 ] || { echo "HELD install(s) above need a human; deploy still queued for the landed master"; }
exit 0
REMOTE

# 6. one deploy of master, after any running one
"${SSH[@]}" 'bash -s' <<'REMOTE'
flock /workspace/ci/deploy.lock true
setsid nohup bash /workspace/lanes/loops/deploy-when-idle.sh > /workspace/lanes/logs/deploy-when-idle.log 2>&1 < /dev/null &
sleep 2; echo "deploy queued: $(cat /workspace/lanes/logs/deploy-when-idle.log 2>/dev/null | tail -1)"
REMOTE

# 7. what to look at
verify
say "done. Re-run with --verify in ~15 min for the artifact 200 and the deploy line."
