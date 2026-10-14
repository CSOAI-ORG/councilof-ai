#!/bin/bash
# ots-upgrade-loop.sh — turn STAMPED proofs into ANCHORED ones, automatically.
#
# A stamp is a request; Bitcoin commits on its own schedule, usually within hours. The
# proof only becomes evidence once a calendar's commitment lands in a block AND the local
# .ots is UPGRADED to carry that attestation. Nothing does that upgrade on its own, so
# proofs sit pending indefinitely and the estate reads as "anchored" when it is not — the
# exact gap that let "N atoms OTS-anchored" be written while nothing was anchored.
#
# Also: scripts/ots-upgrade.py defaults to ONE hardcoded path. Run bare, it upgrades a
# single file and exits 0, which looks like success. This walks every proof in public/.
#
# SAFETY. Upgrading is strictly additive — it adds a BitcoinBlockHeaderAttestation and
# removes nothing. But we re-check COVERAGE after every upgrade and refuse to commit if a
# proof no longer covers its file, because an anchored proof over the wrong bytes is worse
# than a pending one: it reads as settled.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
# Self-locating: this script lives in <repo>/scripts/, so the repo root is one level up.
# Never hardcode a checkout path — the last hardcoding ($HOME/clawd/councilof-ai) made the
# launchd job exit 127 for weeks when that checkout lost the scripts.
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO" || exit 1
LOG="$HOME/clawd/_evacuation/logs/ots-upgrade-loop.log"
mkdir -p "$(dirname "$LOG")"
TS() { date -u +%Y-%m-%dT%H:%M:%SZ; }

BEFORE=$(python3 scripts/ots-coverage-audit.py --served 2>/dev/null | grep -c "COVERS" || echo 0)
# bash-3.2 portable (macOS ships bash 3.2; `mapfile` is bash-4 and silently killed the job).
PROOFS=()
while IFS= read -r _p; do PROOFS+=("$_p"); done < <(find public -name "*.ots" 2>/dev/null)
[ ${#PROOFS[@]} -eq 0 ] && { echo "$(TS) no proofs in public/" >> "$LOG"; exit 0; }

python3 scripts/ots-upgrade.py "${PROOFS[@]}" > /tmp/ots-upgrade.out 2>&1
UPGRADED=$(grep -ci "upgraded\|bitcoin" /tmp/ots-upgrade.out 2>/dev/null || echo 0)

# Coverage must still hold. Exit 1 from the audit means a proof disagrees with its file.
if ! python3 scripts/ots-coverage-audit.py --served > /tmp/ots-cov.out 2>&1; then
  echo "$(TS) REFUSING TO COMMIT — coverage audit failed after upgrade:" >> "$LOG"
  sed 's/^/    /' /tmp/ots-cov.out >> "$LOG"
  exit 1
fi

# The current public root has a strict witness sidecar.  An OTS upgrade changes
# the proof bytes (and can add Bitcoin block heights), so publish those proof
# facts atomically with the proof itself.  The old loop committed only the .ots
# file; the next deploy then failed closed because the sidecar still described
# the previous bytes.  Refresh just the OTS-derived fields and run the candidate
# gate before any commit.
ROOT_SHA=$(shasum -a 256 public/root.json 2>/dev/null | awk '{print $1}')
CURRENT_PROOF="public/interop/root-${ROOT_SHA:0:8}.json.ots"
if [ -n "$ROOT_SHA" ] && [ -f "$CURRENT_PROOF" ] && ! git diff --quiet -- "$CURRENT_PROOF" 2>/dev/null; then
  if ! python3 scripts/witness_public_root.py --refresh-ots >> "$LOG" 2>&1; then
    echo "$(TS) REFUSING TO COMMIT — current-root OTS metadata refresh failed" >> "$LOG"
    exit 1
  fi
  python3 -c '
import hashlib, json, pathlib
p = pathlib.Path("public/interop/ots-exact-bindings-v1.json")
if p.is_file():
    d = json.loads(p.read_text())
    changed = False
    for rel, row in (d.get("bindings") or {}).items():
        f = pathlib.Path("public") / rel
        if f.is_file():
            sha = hashlib.sha256(f.read_bytes()).hexdigest()
            if row.get("proof_sha256") != sha:
                row["proof_sha256"] = sha
                changed = True
    if changed:
        p.write_text(json.dumps(d, indent=2) + "\n")
' 2>/dev/null || true
  if ! python3 scripts/root-witness-release-gate.py --phase candidate >> "$LOG" 2>&1; then
    echo "$(TS) REFUSING TO COMMIT — root witness candidate gate failed after OTS refresh" >> "$LOG"
    exit 1
  fi
  PYTHONPATH=scripts python3 scripts/build_stablecoin_readiness.py >> "$LOG" 2>&1 || true
fi

# OTS_NO_GIT=1: upgrade in place and stop. The pod's outputs reach a branch by their own step;
# no loop pushes master from a pod. Added for the pod-chain ots.sh, which was retired on
# 2026-09-23 without ever having been installed (scripts/pod-loops/superseded/). The pod's
# hourly :45 trust-chain.sh runs a DIFFERENT upgrader, scripts/pod-loops/ots_trust_upgrade.py,
# so this flag currently has no scheduled caller — it is a by-hand switch only.
if [ "${OTS_NO_GIT:-0}" = "1" ]; then
  echo "$(TS) OTS_NO_GIT=1 — upgrades left in the working tree; no commit, no push" >> "$LOG"
elif ! git diff --quiet -- public 2>/dev/null; then
  python3 scripts/ots_manifest_rebuild.py --apply >> "$LOG" 2>&1 || true
  node scripts/llms-txt.mjs >> "$LOG" 2>&1 || true
  node scripts/mechanism/capsule-vc.mjs >> "$LOG" 2>&1 || true
  git add public/**/*.ots public/*.ots 2>/dev/null
  git add public/interop/root-witness-latest.json \
    public/interop/root-witness-pointer.json \
    public/interop/ots-exact-bindings-v1.json \
    public/interop/ots/manifest.json \
    public/interop/stablecoin-universe-2026-09/readiness.json \
    public/mechanism/vc.json \
    public/llms.txt \
    public/llms-full.txt \
    public/interop/root-witness-????-??-??-*.json 2>/dev/null
  git commit -q -m "ots: upgrade pending stamps to Bitcoin attestations

Automated by scripts/ots-upgrade-loop.sh. Upgrading is additive — it attaches the
BitcoinBlockHeaderAttestation a calendar has now committed, and removes nothing.
Coverage re-audited after the upgrade and still holds; the commit is refused otherwise.

$(grep -iE 'bitcoin|upgraded' /tmp/ots-upgrade.out | head -6)" 2>/dev/null
  # Busy-master race (measured 2026-09-12): master moves dozens of commits a day,
  # so a blind push rejects and the upgrades stay stranded locally (backfilled via
  # PR #2072). Rebase onto the fetched remote first; if master is branch-protected,
  # push to origin/ots/pending-upgrades so upgrades are never stranded locally.
  git fetch -q origin master 2>/dev/null
  git rebase -q origin/master 2>/dev/null
  CSOAI_ALLOW_MASTER_PUSH=1 git push -q origin master 2>/dev/null && echo "$(TS) pushed upgrades" >> "$LOG" \
    || git push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease 2>/dev/null && echo "$(TS) pushed upgrades to origin/ots/pending-upgrades" >> "$LOG" \
    || echo "$(TS) upgrades committed locally; push deferred (remote moved) — next run retries" >> "$LOG"
fi

# Flush stranded commits even on quiet runs. A deferred push otherwise waits for the
# next run that happens to have NEW upgrades (measured 2026-09-13: one commit stranded
# 8 behind until flushed by hand). Unstaged upgrade leftovers are stashed around the
# rebase so it cannot refuse on a dirty tree.
if [ "${OTS_NO_GIT:-0}" != "1" ] && [ "$(git rev-list --count origin/master..master 2>/dev/null || echo 0)" != "0" ]; then
  STASH_BEFORE=$(git rev-parse -q --verify refs/stash 2>/dev/null || true)
  git stash -q 2>/dev/null || true
  STASH_AFTER=$(git rev-parse -q --verify refs/stash 2>/dev/null || true)
  git fetch -q origin master 2>/dev/null
  if git rebase -q origin/master 2>/dev/null; then
    CSOAI_ALLOW_MASTER_PUSH=1 git push -q origin master 2>/dev/null && echo "$(TS) flushed stranded upgrade commit(s)" >> "$LOG" \
      || git push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease 2>/dev/null && echo "$(TS) synced stranded upgrade commit(s) to origin/ots/pending-upgrades" >> "$LOG" \
      || echo "$(TS) stranded commit(s) still local; push deferred — next run retries" >> "$LOG"
  else
    git rebase --abort 2>/dev/null
    echo "$(TS) stranded commit(s) could not rebase cleanly — left local, needs an operator" >> "$LOG"
  fi
  if [ -n "$STASH_AFTER" ] && [ "$STASH_AFTER" != "$STASH_BEFORE" ]; then
    git stash pop -q 2>/dev/null || true
  fi
fi

AFTER=$(grep -oE "[0-9]+  COVERS" /tmp/ots-cov.out | head -1 | awk '{print $1}')
echo "$(TS) walked ${#PROOFS[@]} proofs; covers=${AFTER:-?}; upgrade output lines=$UPGRADED" >> "$LOG"
tail -300 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
