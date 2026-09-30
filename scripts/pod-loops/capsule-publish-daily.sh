#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# capsule-publish-daily.sh -- lane L1 (2026-09-28). Daily republish of the measurement-capsule day index to
# councilof.ai/measurement-capsules/ (the public copy stalled at the 26 Sep index: nothing laid out the chained 0.3 index).
#
#   Oracle ~/lanes/capsule-publish-20260928/trigger.sh (cron 40 8 * * *, after capsule-daily 08:05Z) lays out DATE's signed
#   index with scripts/measurement_capsule_layout.py (canon copy) and streams the tree as a tarball:
#     capsule-publish-daily.sh --tar-stdin DATE      save the tarball, start the run detached, return
#     capsule-publish-daily.sh --run DATE            replace public/measurement-capsules/v0.2 (index, anchors, batch dirs,
#                                                    endpoint shards; publication/ records kept), commit, gate, land
#     capsule-publish-daily.sh --land-clone          retry only the land step
#   ONE gated land per day: merge --no-ff onto the current staging master; a rejected push re-fetches and re-merges
#   (never forced); a merge conflict fails closed. auto-land (20 */3) deploys it. Installed at /workspace/ci/.
# Result line: /workspace/staging/logs/capsule-publish.log  (PUBLISHED | UNCHANGED | FAILED stage=... reason=...)
set -uo pipefail
M=/workspace/staging/mirror/councilof-ai.git
C=${CAPSULE_PUBLISH_CLONE:-/workspace/lanes-clones/capsule-publish-20260928}
LOGD=/workspace/staging/logs; SUM=$LOGD/capsule-publish.log; mkdir -p $LOGD/capsule-publish /workspace/staging/capsule-publish
SG=/workspace/csoai-scale-engine/release_guard
export PATH=/root/venv/bin:/workspace/tools/node/bin:$PATH:/root/otsvenv/bin
export PLAYWRIGHT_BROWSERS_PATH=/workspace/tools/ms-playwright NODE_OPTIONS=--max-old-space-size=6144 PYTHONUNBUFFERED=1
summary() { echo "$(date -u +%FT%TZ) $*" >> $SUM; echo "$*"; }
case "${1:-}" in
  --tar-stdin)
    D=${2:?date}; [[ $D =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { summary "FAILED stage=trigger reason=bad date $D"; exit 64; }
    T=/workspace/staging/capsule-publish/$D.tgz; cat > "$T.part" && mv "$T.part" "$T"
    [ -s "$T" ] || { summary "FAILED stage=trigger date=$D reason=empty tarball"; exit 1; }
    setsid nohup bash "$0" --run "$D" > /dev/null 2>&1 < /dev/null &
    echo "started capsule-publish $D (detail $LOGD/capsule-publish/)"; exit 0 ;;
  --run) D=${2:?date}; MODE=run ;;
  --land-clone) D=$(date -u +%F); MODE=land ;;
  *) echo "usage: $0 --tar-stdin DATE | --run DATE | --land-clone"; exit 64 ;;
esac
DL=$LOGD/capsule-publish/$(date -u +%Y%m%dT%H%MZ)-$MODE.log
exec > >(tee -a "$DL") 2>&1
exec 7>/workspace/ci/capsule-publish.lock
flock -n 7 || { summary "FAILED stage=lock date=$D reason=another run holds the lock"; exit 1; }
STAGE=init
fail() { summary "FAILED stage=$STAGE date=$D reason=$* (detail $DL)"; exit 1; }
step() { STAGE=$1; echo "=== $(date -u +%T) $1"; }

land() {
  cd "$C" || fail "clone $C absent"
  BR=$(git rev-parse --abbrev-ref HEAD); TIP=$(git rev-parse HEAD)
  for attempt in 1 2 3 4 5; do
    step "land-attempt-$attempt"
    git fetch -q origin master || fail "fetch staging master"
    BASE=$(git rev-parse origin/master)
    git checkout -q -B land-capsules-$D "$BASE" || fail "checkout base"
    git -c user.name=CSOAI -c user.email=nicholas@csoai.org merge --no-ff -q "$TIP" -m "land: merge $BR ($(cat .git/CAPSULE_PUBLISH_SUBJECT 2>/dev/null || echo "measurement-capsule index $D"))" \
      || { git merge --abort 2>/dev/null; git checkout -q "$BR"; fail "merge conflict landing $BR on ${BASE:0:9} (never forced)"; }
    STAGE=land-push
    if git push -q origin "HEAD:refs/heads/master" 2>/tmp/capsule-publish-push.err; then
      LANDED=$(git rev-parse HEAD); git checkout -q "$BR"; return 0
    fi
    echo "push rejected: $(tail -1 /tmp/capsule-publish-push.err)"; git checkout -q "$BR"; sleep $((attempt * 20))
  done
  fail "push to staging master rejected 5 times"
}
if [ "$MODE" = land ]; then land; summary "LANDED ${LANDED:0:12} (land-only retry)"; exit 0; fi

step prepare
T=/workspace/staging/capsule-publish/$D.tgz; [ -s "$T" ] || fail "no tarball $T"
if [ ! -d "$C/.git" ]; then git clone -q "$M" "$C" || fail "clone"; fi
cd "$C" || fail "cd clone"
[ -z "$(git status --porcelain --untracked-files=no)" ] || fail "clone $C is dirty; refusing to overwrite"
git fetch -q origin master || fail "fetch"
BR=lane/capsule-publish-$D
git checkout -q -B "$BR" "${CAPSULE_PUBLISH_BASE:-origin/master}" || fail "checkout"   # BASE: first land carries the code change
[ -e node_modules ] || { ln -s /workspace/ci/councilof-ai/node_modules node_modules && echo node_modules >> .git/info/exclude; } || fail "node_modules link"
BASE0=$(git rev-parse HEAD)

step replace
V=public/measurement-capsules/v0.2
X=$(mktemp -d /workspace/staging/capsule-publish/x.XXXX); tar xzf "$T" -C "$X" || fail "untar"
NEW=$X/measurement-capsules; [ -f "$NEW/v0.2/index.json" ] && [ -f "$NEW/v0.2/index.signed.json" ] && [ -f "$NEW/latest.json" ] || fail "tarball lacks index/signature/latest"
/root/venv/bin/python3 - "$NEW/v0.2/index.json" "$D" <<'PY' || fail "tarball index is not DATE's chained index"
import json, sys
d = json.load(open(sys.argv[1])); assert d["schema"] == "csoai.measurement-capsule-index/0.3", d["schema"]; assert d["date"] == sys.argv[2], d["date"]
PY
for b in "$V"/*/; do [ -f "$b/leaves.json" ] && git rm -rq --ignore-unmatch "$b" && rm -rf "$b"; done   # old batch dirs (publication/ stays)
rm -rf "$V/endpoints"; rm -f "$V/index.json" "$V/index.signed.json" "$V/index.json.ots" "$V/anchors.json"
cp -r "$NEW/v0.2/." "$V/" && cp "$NEW/latest.json" public/measurement-capsules/latest.json || fail "copy"
rm -rf "$X"
git add -A -- public/measurement-capsules
# Keep the public VC projection in lock-step with the current self_parity batch.
# The capsule ID and Merkle path change when the daily batch changes even if the
# generator code does not, so regenerate before deciding that the tree is unchanged.
node scripts/mechanism/capsule-vc.mjs || fail "capsule-vc regenerate"
git add -- public/mechanism/vc.json
git diff --cached --quiet && { summary "UNCHANGED date=$D (the laid-out tree and mechanism VC equal master)"; exit 0; }
IR=$(/root/venv/bin/python3 -c 'import json;d=json.load(open("public/measurement-capsules/v0.2/index.json"));print(d["index_root"][:16],d["n_capsules_total"],len(d["batches"]),d["as_of"])')
set -- $IR; SUBJ="measurement-capsule index $D: $3 batches, $2 capsules, root $1…, as_of $4"
echo "$SUBJ" > .git/CAPSULE_PUBLISH_SUBJECT
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "measurement capsules: $SUBJ

Laid out by scripts/measurement_capsule_layout.py from the signed, OTS-stamped, Rekor-anchored day index that
capsule-daily (oracle-micro-2 08:05Z) wrote; bytes unchanged (the board signature pins them). Job:
scripts/pod-loops/capsule-publish-daily.sh (lane L1)." || fail "commit"

step tests
/root/venv/bin/python3 scripts/test_measurement_capsule_layout.py > /tmp/capsule-publish-pytest.log 2>&1 || fail "layout tests: $(tail -2 /tmp/capsule-publish-pytest.log | tr '\n' ' ')"
npx vitest run functions/_lib/measurementCapsule.test.ts > /tmp/capsule-publish-vitest.log 2>&1 || fail "vitest measurementCapsule: $(tail -3 /tmp/capsule-publish-vitest.log | tr '\n' ' ')"

step source-gates
/usr/bin/python3 $SG/sitemap_guard.py --public-dir public --baseline $SG/sitemap-known-public.json --receipt /tmp/cp-sitemap-src.json --observe-live > /tmp/cp-sitemap-src.log 2>&1 || fail "sitemap-source"
/usr/bin/python3 scripts/root-witness-release-gate.py --phase candidate --public-dir public > /tmp/cp-rw.log 2>&1 || fail "root-witness-candidate"
/usr/bin/python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir public > /tmp/cp-rots.log 2>&1 || fail "root-ots-source"

step build-gates
flock -w 5400 /workspace/ci/build-slot.lock bash -c '
  set -uo pipefail
  rm -rf dist/client
  npm run build:client > /tmp/cp-build.log 2>&1 || { echo "build FAILED"; tail -5 /tmp/cp-build.log; exit 4; }
  bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350 > /tmp/cp-prerender.log 2>&1 || { echo "prerender FAILED"; tail -4 /tmp/cp-prerender.log; exit 5; }
  node scripts/brand-gate.mjs dist/client > /tmp/cp-brand.log 2>&1 || { echo "brand-gate FAILED"; tail -5 /tmp/cp-brand.log; exit 6; }
  node scripts/signed-json-guard.mjs dist/client > /tmp/cp-sjg.log 2>&1 || { echo "signed-json-guard FAILED"; tail -5 /tmp/cp-sjg.log; exit 7; }
  { node scripts/canary-leak-gate.mjs --selftest && node scripts/canary-leak-gate.mjs dist/client public; } > /tmp/cp-canary.log 2>&1 || { echo "canary-leak-gate FAILED"; exit 15; }
  echo "build, prerender, brand-gate, signed-json-guard, canary ok: $(find dist/client -type f | wc -l) files"
' || fail "build gates (see $DL)"
rm -rf dist/client/functions dist/client/proofs dist/client/cards
node scripts/redirects-guard.mjs dist/client/_redirects > /tmp/cp-redir.log 2>&1 || fail "redirects-guard"
node scripts/pages-size-guard.mjs dist/client > /tmp/cp-size.log 2>&1 || fail "pages-size-guard: $(find dist/client -type f | wc -l) files"
/usr/bin/python3 - <<'PYW' || fail "built capsule bytes differ from source"
from pathlib import Path
for rel in ["measurement-capsules/latest.json", "measurement-capsules/v0.2/index.json", "measurement-capsules/v0.2/index.signed.json"]:
    assert (Path("dist/client") / rel).read_bytes() == (Path("public") / rel).read_bytes(), rel
print("built capsule bytes == source")
PYW
/usr/bin/python3 $SG/sitemap_guard.py --public-dir dist/client --baseline $SG/sitemap-known-public.json --receipt /tmp/cp-sitemap-built.json --built > /tmp/cp-sitemap-built.log 2>&1 || fail "sitemap-built"
/usr/bin/python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir dist/client > /tmp/cp-rots-built.log 2>&1 || fail "root-ots-built"
echo "all gates ok"; rm -rf dist
if [ "${LAND:-1}" = 0 ]; then summary "GATED-NOT-LANDED date=$D $SUBJ (LAND=0; --land-clone to land)"; exit 0; fi
land
summary "PUBLISHED date=$D $SUBJ land=${LANDED:0:12} (deploys on the next auto-land tick)"
rm -f "$T"; ls -1t /workspace/staging/capsule-publish/*.tgz 2>/dev/null | tail -n +4 | xargs -r rm -f
