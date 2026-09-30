#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# owm-publish.sh -- lane owm-autopublish-20260930. Keeps GET /api/owm (csoai.owm-snapshot/0.1, stale_after_s 21600)
# fresh without a hand refresh. /api/owm serves the COMMITTED public/owm/v0.1/latest.json, so freshness needs a land.
#
#   Oracle fleet/owm/publish-trigger.sh (cron 55 2-23/3 * * *, 6 min after the :49 OWM cycle, 25 min before each
#   auto-land tick at 20 */3) streams the cycle's PUBLIC snapshot (~/lanes/state/owm/public/latest.json) here:
#     owm-publish.sh --stdin        save the candidate, start --run detached, return
#     owm-publish.sh --run FILE     decide with the canon fleet/owm/publish_candidate.py (validates counts, host paths,
#                                   UNSIGNED boundary; lists compared as multisets); only when it says publish: write
#                                   the exact candidate bytes, commit, test, gate, ONE land: merge onto staging master
#     owm-publish.sh --land-clone   retry only the land step
#   Never forced: a rejected push re-fetches and re-merges; a conflict fails closed. auto-land (20 */3) deploys it
#   through deploy-prod.sh's full gate set; this job deploys nothing and signs nothing. Installed at /workspace/ci/.
# Result line: /workspace/staging/logs/owm-publish.log  (PUBLISHED | UNCHANGED | FAILED stage=... reason=...)
set -uo pipefail
M=/workspace/staging/mirror/councilof-ai.git
C=${OWM_PUBLISH_CLONE:-/workspace/lanes-clones/owm-publish}
LOGD=/workspace/staging/logs; SUM=$LOGD/owm-publish.log; IN=/workspace/staging/owm-publish
mkdir -p $LOGD/owm-publish $IN
export PATH=/root/venv/bin:/workspace/tools/node/bin:$PATH
MAX_INTERVAL_S=${OWM_MAX_INTERVAL_S:-7200}   # < the 3 h trigger period, so every tick refreshes; semantic changes always do
TARGET=public/owm/v0.1/latest.json
summary() { echo "$(date -u +%FT%TZ) $*" >> $SUM; echo "$*"; }
case "${1:-}" in
  --stdin)
    T=$IN/candidate-$(date -u +%Y%m%dT%H%M%SZ).json
    head -c 4000000 > "$T.part" && mv "$T.part" "$T"
    /usr/bin/python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$T" 2>/dev/null \
      || { summary "FAILED stage=trigger reason=candidate is empty or not JSON"; rm -f "$T"; exit 1; }
    setsid nohup bash "$0" --run "$T" > /dev/null 2>&1 < /dev/null &
    echo "started owm-publish $(basename "$T")"; exit 0 ;;
  --run) T=${2:?candidate file}; MODE=run ;;
  --land-clone) MODE=land ;;
  *) echo "usage: $0 --stdin | --run FILE | --land-clone"; exit 64 ;;
esac
DL=$LOGD/owm-publish/$(date -u +%Y%m%dT%H%MZ)-$MODE.log
exec > >(tee -a "$DL") 2>&1
exec 7>/workspace/ci/owm-publish.lock
flock -n 7 || { summary "FAILED stage=lock reason=another run holds the lock"; exit 1; }
STAGE=init
fail() { summary "FAILED stage=$STAGE reason=$* (detail $DL)"; exit 1; }
step() { STAGE=$1; echo "=== $(date -u +%T) $1"; }

land() {
  cd "$C" || fail "clone $C absent"
  BR=$(git rev-parse --abbrev-ref HEAD); TIP=$(git rev-parse HEAD)
  for attempt in 1 2 3 4 5; do
    step "land-attempt-$attempt"
    git fetch -q origin master || fail "fetch staging master"
    BASE=$(git rev-parse origin/master)
    git checkout -q -B land-owm "$BASE" || fail "checkout base"
    git -c user.name=CSOAI -c user.email=nicholas@csoai.org merge --no-ff -q "$TIP" \
      -m "land: merge $BR ($(cat .git/OWM_PUBLISH_SUBJECT 2>/dev/null || echo "OWM public snapshot refresh"))" \
      || { git merge --abort 2>/dev/null; git checkout -q "$BR"; fail "merge conflict landing $BR on ${BASE:0:9} (never forced)"; }
    STAGE=land-push
    if git push -q origin "HEAD:refs/heads/master" 2>/tmp/owm-publish-push.err; then
      LANDED=$(git rev-parse HEAD); git checkout -q "$BR"; return 0
    fi
    echo "push rejected: $(tail -1 /tmp/owm-publish-push.err)"; git checkout -q "$BR"; sleep $((attempt * 20))
  done
  fail "push to staging master rejected 5 times"
}
if [ "$MODE" = land ]; then land; summary "LANDED ${LANDED:0:12} (land-only retry)"; exit 0; fi

step prepare
[ -s "$T" ] || fail "no candidate $T"
[ -d "$C/.git" ] || git clone -q --no-checkout "$M" "$C" || fail "clone"
cd "$C" || fail "cd clone"
git config gc.auto 0 && git config maintenance.auto false || fail "config"   # a detached auto-gc inherits fd 7 and holds the lock
git fetch -q origin master || fail "fetch"
BR=lane/owm-publish
# sparse cone: the publisher + its tests, the owm door + vitest, the gate scripts, and the canary commitments record
git sparse-checkout init --cone && git sparse-checkout set fleet/owm functions scripts public/owm public/interop/instrument-guard || fail "sparse"
git checkout -q -f -B "$BR" origin/master && git reset -q --hard origin/master || fail "checkout"   # each run starts from canon
[ -e node_modules ] || { ln -s /workspace/ci/councilof-ai/node_modules node_modules && echo node_modules >> .git/info/exclude; } || fail "node_modules link"

step decide
/usr/bin/python3 fleet/owm/publish_candidate.py --source "$T" --target "$TARGET" --max-interval-s "$MAX_INTERVAL_S" --apply > /tmp/owm-publish-decide.json \
  || fail "publish_candidate: $(head -c 300 /tmp/owm-publish-decide.json)"
read -r PUB REASON GEN < <(/usr/bin/python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d["publish"], d["reason"], d.get("source_generated_at","?"))' /tmp/owm-publish-decide.json)
if [ "$PUB" != True ]; then rm -f "$T"; summary "UNCHANGED reason=$REASON candidate=$GEN (publish_candidate held it; nothing landed)"; exit 0; fi
git add -- "$TARGET"
git diff --cached --quiet && { rm -f "$T"; summary "UNCHANGED reason=identical-bytes candidate=$GEN"; exit 0; }
SUBJ="OWM public snapshot generated_at $GEN ($REASON)"
echo "$SUBJ" > .git/OWM_PUBLISH_SUBJECT
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "owm: $SUBJ

The exact bytes the Oracle OWM cycle wrote to its public snapshot, admitted by fleet/owm/publish_candidate.py
($REASON). Unsigned (a new kind). Job: scripts/pod-loops/owm-publish.sh (lane owm-autopublish-20260930)." || fail "commit"

step tests
/usr/bin/python3 -m unittest discover -s fleet/owm -p 'test_publish_candidate.py' > /tmp/owm-publish-py.log 2>&1 || fail "publisher tests: $(tail -2 /tmp/owm-publish-py.log | tr '\n' ' ')"
npx vitest run functions/api/owm.test.ts > /tmp/owm-publish-vitest.log 2>&1 || fail "vitest owm: $(tail -3 /tmp/owm-publish-vitest.log | tr '\n' ' ')"

step gates
G=$(mktemp -d /tmp/owm-publish-gate.XXXX); mkdir -p "$G/owm/v0.1"; cp "$TARGET" "$G/owm/v0.1/latest.json"
node scripts/brand-gate.mjs "$G" > /tmp/owm-publish-brand.log 2>&1 || fail "brand-gate: $(tail -3 /tmp/owm-publish-brand.log | tr '\n' ' ')"
{ node scripts/canary-leak-gate.mjs --selftest && node scripts/canary-leak-gate.mjs "$G"; } > /tmp/owm-publish-canary.log 2>&1 || fail "canary-leak-gate"
rm -rf "$G"
[ "$(git diff --name-only origin/master HEAD)" = "$TARGET" ] || fail "commit touches more than $TARGET"
echo "tests and gates ok"
if [ "${LAND:-1}" = 0 ]; then summary "GATED-NOT-LANDED $SUBJ (LAND=0; --land-clone to land)"; exit 0; fi
land
summary "PUBLISHED $SUBJ land=${LANDED:0:12} (deploys on the next auto-land tick)"
rm -f "$T"; ls -1t $IN/candidate-*.json 2>/dev/null | tail -n +9 | xargs -r rm -f
git -c gc.auto=6700 -c gc.autoDetach=false gc --auto --quiet 7>&- || true   # housekeeping in the foreground, lock fd closed
