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
#   EAT_INTERVAL   seconds between passes in loop mode (default 3600; hourly)
#   EAT_BRANCH     feed branch (default auto-eat-feed)
#   EAT_DEPLOY_KEY ssh key for push (default /workspace/keys/arena_deploy_ed25519)
#   EAT_PER_SOURCE ids polled per source per pass (default 2000)
#   EAT_MAX_PROBE  ids probed per pass (default 5000)
#   EAT_PROBE_WORKERS  concurrent probes (default 64)
#   EAT_NO_PUSH=1  stage + commit locally, never push (for dry runs)
# Public APIs — not a literal 1e6x of 40 probes/hour. This is the keyless ceiling.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${EAT_REPO:-$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)}"
BRANCH="${EAT_BRANCH:-auto-eat-feed}"
DEPLOY_KEY="${EAT_DEPLOY_KEY:-/workspace/keys/arena_deploy_ed25519}"
PER_SOURCE="${EAT_PER_SOURCE:-2000}"
MAX_PROBE="${EAT_MAX_PROBE:-5000}"
INTERVAL="${EAT_INTERVAL:-3600}"
export EAT_PROBE_WORKERS="${EAT_PROBE_WORKERS:-64}"
LOG="${EAT_LOG:-$REPO/scripts/auto-eat/eat.log}"
PIDFILE="${EAT_PIDFILE:-/workspace/auto-eat/eat-loop.pid}"
AE="$REPO/scripts/auto-eat"

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; echo "$(date -u +%FT%TZ) $*"; }

one_pass() {
  # `-d "$REPO/.git"` accepts only a full clone. In a git WORKTREE, .git is a FILE
  # containing "gitdir: …", so this rejected exactly the layout the lane protocol
  # requires. That mattered: run against the shared checkout instead, the loop switches
  # it to auto-eat-feed — and council-os/LANE-PROTOCOL.md is explicit that flipping the
  # shared checkout's branch is what rewound 3e5116ac. So the one safe way to run this
  # hourly was the one way it refused to start. Accept either.
  if [ -z "$REPO" ] || { [ ! -d "$REPO/.git" ] && [ ! -f "$REPO/.git" ]; }; then
    log "FAIL no repo clone or worktree at REPO='$REPO'"; return 1
  fi
  cd "$REPO" || { log "FAIL cannot cd $REPO"; return 1; }
  if [ -n "$(git status --porcelain 2>>"$LOG")" ]; then
    log "FAIL dirty keeper worktree — refusing branch switch or unrelated commits"; return 1
  fi
  log "PASS-START branch=$BRANCH"

  # 1) stay current with master without ever writing it.
  git fetch --quiet origin master 2>>"$LOG"; rc=$?
  if [ "$rc" -ne 0 ]; then
    log "FAIL fetch origin/master rc=$rc — refuse stale-source cycle"; return 1
  fi
  # Never create a replacement feed from master if remote feed history exists.
  # Fetch the feed ref explicitly; fresh GitHub Actions clones may not track it.
  git fetch --quiet origin "$BRANCH:refs/remotes/origin/$BRANCH" 2>>"$LOG" || {
    log "FAIL fetch canonical feed branch $BRANCH"; return 1
  }
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout --quiet "$BRANCH" 2>>"$LOG" || { log "FAIL checkout $BRANCH"; return 1; }
    git merge-base --is-ancestor "origin/$BRANCH" HEAD || {
      log "FAIL local feed history diverged from canonical remote"; return 1
    }
  else
    git checkout --quiet -b "$BRANCH" "origin/$BRANCH" 2>>"$LOG" || {
      log "FAIL checkout canonical feed branch $BRANCH"; return 1
    }
  fi
  # The legacy feed branch may have unrelated history. In that case build a
  # two-parent merge commit whose tree is current master plus ONLY the feed-owned
  # paths. The feed is first parent (normal fast-forward push); master is second.
  if git merge-base HEAD origin/master >/dev/null 2>&1; then
    git merge --no-edit -X ours origin/master 2>>"$LOG"; rc=$?
    if [ "$rc" -ne 0 ]; then
      git merge --abort 2>/dev/null
      log "FAIL merge origin/master rc=$rc — aborted, refuse to drift"; return 1
    fi
  else
    git show origin/master:scripts/auto-eat/sync_feed_branch.py 2>>"$LOG" | python3 - --branch "$BRANCH" --master origin/master >>"$LOG" 2>&1; rc=$?
    if [ "$rc" -ne 0 ]; then
      log "FAIL legacy feed ancestry migration rc=$rc — no discovery/probe run"; return 1
    fi
  fi

  # 2) Materialise feed data before any network query. A sparse worktree can
  #    otherwise hide the old queue/probed files; discovery then invents a fresh
  #    count from zero and reports a false successful batch.
  if [ "$(git config --bool core.sparseCheckout 2>/dev/null)" = "true" ]; then
    git sparse-checkout add public/interop/auto-eat scripts/auto-eat 2>>"$LOG" || {
      log "FAIL sparse checkout feed hydration"; return 1
    }
  fi
  for f in public/interop/auto-eat/queue.jsonl public/interop/auto-eat/cards-compact.json public/interop/auto-eat/probed.json; do
    if [ ! -f "$f" ]; then log "FAIL expected feed file absent: $f"; return 1; fi
    expected=$(git rev-parse "HEAD:$f" 2>>"$LOG") || {
      log "FAIL feed file absent from HEAD: $f"; return 1
    }
    actual=$(git hash-object "$f" 2>>"$LOG") || {
      log "FAIL cannot read feed file: $f"; return 1
    }
    if [ "$actual" != "$expected" ]; then
      log "FAIL feed file does not match HEAD: $f"; return 1
    fi
  done

  # 3) discover -> queue (append-only, frozen)
  python3 "$AE/discover.py" --per-source "$PER_SOURCE" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL discover rc=$rc"; return 1; fi

  # 4) probe DISCOVERED -> stage LIVE atoms (sig=null)
  python3 "$AE/probe.py" --max "$MAX_PROBE" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL probe rc=$rc"; return 1; fi

  # 5) regenerate STATUS surface
  python3 "$AE/gen_status.py" >>"$LOG" 2>&1; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL gen_status rc=$rc"; return 1; fi

  # 6) commit + push the feed branch (NEVER master). Check staging's rc;
  #    a sparse-path add can fail and otherwise yield a false OK or partial commit.
  git add --sparse -- public/interop/auto-eat scripts/auto-eat/STATUS.md 2>>"$LOG"; rc=$?
  if [ "$rc" -ne 0 ]; then log "FAIL staging feed paths rc=$rc"; return 1; fi
  if [ -n "$(git status --porcelain -- public/interop/auto-eat scripts/auto-eat/STATUS.md | grep '^ [MADRCU]')" ]; then
    log "FAIL unstaged feed changes after git add"; return 1
  fi
  if git diff --cached --quiet; then
    log "OK no feed content changes; will still publish any master-sync commit"
  else
    git -c user.name="csoai-auto-eat" -c user.email="board@csoai.org" \
        commit --quiet -m "auto-eat: feed batch $(date -u +%FT%TZ)" 2>>"$LOG"; rc=$?
    if [ "$rc" -ne 0 ]; then log "FAIL commit rc=$rc"; return 1; fi
  fi

  if [ "${EAT_NO_PUSH:-0}" = "1" ]; then
    log "OK committed (EAT_NO_PUSH=1, not pushed)"; return 0
  fi
  # GitHub Actions has a scoped checkout credential with contents:write on
  # this feed branch only. No signing key, ID token or production deployment.
  if [ "${EAT_PUSH_CHECKOUT_CREDENTIALS:-0}" = "1" ]; then
    if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
      log "FAIL checkout-credential push requested outside GitHub Actions"; return 1
    fi
    git push --quiet origin "HEAD:refs/heads/$BRANCH" >>"$LOG" 2>&1; rc=$?
  else
    if [ ! -f "$DEPLOY_KEY" ]; then
      log "HELD committed but NOT pushed — deploy key absent ($DEPLOY_KEY)"; return 1
    fi
    GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
      git -c remote.origin.pushurl=git@github.com:CSOAI-ORG/councilof-ai.git \
        push --quiet origin "HEAD:refs/heads/$BRANCH" >>"$LOG" 2>&1; rc=$?
  fi
  if [ "$rc" -eq 0 ]; then
    log "OK pushed $BRANCH"
  else
    log "FAIL push rc=$rc — no canonical feed revision published"
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
