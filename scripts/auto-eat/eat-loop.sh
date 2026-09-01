#!/bin/bash
# eat-loop.sh — the ASI AUTO-EAT keeper. Runs the estate grammar forever:
#   discover -> probe -> stage atoms -> commit -> push feed branch  (NEVER master)
#
# Copies the sink pod keeper pattern (no crontab binary on the pod): a nohup
# while-true loop with a pidfile. rc is captured BEFORE the log line. Three
# states everywhere: OK / HELD / FAIL. Never a fake OK. Fail-loud on drift.
#
# HONESTY (structural, non-negotiable):
#   - This path holds NO signing key and CANNOT mark anything MEASURED.
#   - Atoms are staged with sig_ed25519=null. Signing is the EXISTING OIDC GHA
#     path (scripts/sign_ledger_cards.py via hf-fin-shells-measure.yml). A human
#     merge of the feed branch + that dispatch is the only way a card signs green.
#   - Push target is the feed branch auto-eat-feed. master's gates + a human
#     decide what signs. This loop is structurally unable to write master.
#
# Modes:
#   eat-loop.sh once     one full cycle (used for the manual proof + by the sign flow)
#   eat-loop.sh loop     keeper: once, then sleep EAT_INTERVAL (default 3600s), forever
#
# Env:
#   EAT_REPO       path to a councilof-ai clone (default: git toplevel of this script)
#   EAT_INTERVAL   seconds between passes in loop mode (default 15)
#   EAT_BRANCH     feed branch (default auto-eat-feed)
#   EAT_DEPLOY_KEY ssh key for push (default /workspace/keys/arena_deploy_ed25519)
#   EAT_PER_SOURCE ids polled per source per pass (default 2000)
#   EAT_MAX_PROBE  ids probed per pass (default 5000)
#   EAT_PROBE_WORKERS  concurrent probes (default 64)
#   EAT_NO_PUSH=1  stage + commit locally, never push (for dry runs)
# Public APIs — not a literal 1e6x of 40 probes/hour. This is the keyless ceiling.
set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${EAT_REPO:-$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)}"
BRANCH="${EAT_BRANCH:-auto-eat-feed}"
DEPLOY_KEY="${EAT_DEPLOY_KEY:-/workspace/keys/arena_deploy_ed25519}"
PER_SOURCE="${EAT_PER_SOURCE:-2000}"
MAX_PROBE="${EAT_MAX_PROBE:-5000}"
INTERVAL="${EAT_INTERVAL:-15}"
export EAT_PROBE_WORKERS="${EAT_PROBE_WORKERS:-64}"
LOG="${EAT_LOG:-$REPO/scripts/auto-eat/eat.log}"
PIDFILE="${EAT_PIDFILE:-/workspace/auto-eat/eat-loop.pid}"
AE="$REPO/scripts/auto-eat"

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; echo "$(date -u +%FT%TZ) $*"; }

one_pass() {
  if [ -z "$REPO" ] || [ ! -d "$REPO/.git" ]; then
    log "FAIL no repo clone at REPO='$REPO'"; return 1
  fi
  cd "$REPO" || { log "FAIL cannot cd $REPO"; return 1; }
  log "PASS-START branch=$BRANCH"

  # 1) stay current with master without ever writing it. auto-eat paths are
  #    exclusive to the feed branch, so this merge is conflict-free.
  git fetch --quiet origin master 2>>"$LOG"; rc=$?
  if [ "$rc" -ne 0 ]; then log "HELD fetch rc=$rc (offline? using local state)"; fi
  if git rev-parse --verify --quiet "$BRANCH" >/dev/null; then
    git checkout --quiet "$BRANCH" 2>>"$LOG"
  else
    git checkout --quiet -B "$BRANCH" origin/master 2>>"$LOG"
  fi
  # Feed branch owns public/interop/auto-eat. -X ours keeps those on conflict
  # after a fold onto master; other master files still merge in.
  git merge --no-edit -X ours origin/master 2>>"$LOG"; rc=$?
  if [ "$rc" -ne 0 ]; then
    git merge --abort 2>/dev/null
    log "FAIL merge origin/master rc=$rc — aborted, refuse to drift"; return 1
  fi

  # 2) discover -> queue (append-only, frozen)
  python3 "$AE/discover.py" --per-source "$PER_SOURCE" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL discover rc=$rc"; return 1; fi

  # 3) probe DISCOVERED -> stage LIVE atoms (sig=null)
  python3 "$AE/probe.py" --max "$MAX_PROBE" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL probe rc=$rc"; return 1; fi

  # 4) regenerate STATUS surface
  python3 "$AE/gen_status.py" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL gen_status rc=$rc"; return 1; fi

  # 5) commit + push the feed branch (NEVER master)
  git add public/interop/auto-eat scripts/auto-eat/STATUS.md 2>>"$LOG"
  if git diff --cached --quiet; then
    log "OK no change (nothing new discovered/probed this pass)"; return 0
  fi
  git -c user.name="csoai-auto-eat" -c user.email="board@csoai.org" \
      commit --quiet -m "auto-eat: feed batch $(date -u +%FT%TZ)" 2>>"$LOG"; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL commit rc=$rc"; return 1; fi

  if [ "${EAT_NO_PUSH:-0}" = "1" ]; then
    log "OK committed (EAT_NO_PUSH=1, not pushed)"; return 0
  fi
  if [ ! -f "$DEPLOY_KEY" ]; then
    log "HELD committed but NOT pushed — deploy key absent ($DEPLOY_KEY)"; return 0
  fi
  git remote set-url --push origin git@github.com:CSOAI-ORG/councilof-ai.git 2>>"$LOG"
  GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
    git push --quiet origin "HEAD:refs/heads/$BRANCH" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -eq 0 ]; then
    log "OK pushed $BRANCH"
  else
    log "FAIL push rc=$rc — deploy key not authorized on CSOAI-ORG/councilof-ai (owner action)"
    return 1
  fi
  return 0
}

case "${1:-once}" in
  once)
    one_pass; exit $?
    ;;
  loop)
    # Single instance via pidfile. Never pgrep -f (self-match trap).
    mkdir -p "$(dirname "$PIDFILE")"
    if [ -f "$PIDFILE" ]; then
      old="$(cat "$PIDFILE" 2>/dev/null || true)"
      if [ -n "$old" ] && kill -0 "$old" 2>/dev/null; then
        log "FAIL keeper already running pid=$old pidfile=$PIDFILE"
        exit 1
      fi
      log "stale pidfile pid=${old:-empty} gone — taking lock"
    fi
    echo $$ > "$PIDFILE"
    trap 'rm -f "$PIDFILE"' EXIT
    log "KEEPER-START interval=${INTERVAL}s pid=$$ pidfile=$PIDFILE"
    while true; do
      one_pass || true   # a failed pass logs FAIL and the keeper keeps living
      log "PASS-END sleep $INTERVAL"
      sleep "$INTERVAL"
    done
    ;;
  *)
    echo "usage: $0 {once|loop}" >&2; exit 2
    ;;
esac
