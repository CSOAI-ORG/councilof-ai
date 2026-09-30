#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# consumer-records-daily.sh -- lane L2 (2026-09-30): the consumer loop's candidates -> a signed, dated
# disclosure-completeness record set on councilof.ai, through the same gated path as every signed record.
#
#   The consumer loop (lanes pod, /workspace/lanes/consumers/loop.sh) re-computes the four measurements every 30 min
#   from its store and writes an UNSIGNED candidate only when an input or the method changed. Once a day the Oracle
#   trigger (~/lanes/consumer-records/trigger.sh, cron 20 9 * * *) runs, in order:
#     consumer-records-daily.sh --prepare DATE     newest candidate per measure; UNCHANGED (exit 3) when all four equal
#                                                  the newest published set; else archive the pinned input blobs, build
#                                                  the unsigned set with the CANON build_records.py, tar it to stdout
#     (Oracle signs each record with ~/lanes/measurement-signing/sign_record.py: POST /api/board-sign with the pod
#      caller token, which never leaves Oracle; local verify + 3 altered-preimage controls; OTS)
#     consumer-records-daily.sh --tar-stdin DATE   save the signed tarball, start --run detached, return
#     consumer-records-daily.sh --run DATE         copy the set into public/interop, point the page at it, commit, run the
#                                                  producer + recompute + page tests and the full build gates, land
#     consumer-records-daily.sh --land-clone       retry only the land step
#   ONE gated land per new set: merge --no-ff onto the current staging master; a rejected push re-fetches and re-merges
#   (never forced); a merge conflict fails closed. auto-land deploys it. Nothing publishes ungated, and nothing is
#   signed here: this script never sees the token.
# Result line: /workspace/staging/logs/consumer-records.log  (PUBLISHED | UNCHANGED | FAILED stage=... reason=...)
set -uo pipefail
M=/workspace/staging/mirror/councilof-ai.git
C=${CONSUMER_RECORDS_CLONE:-/workspace/lanes-clones/consumer-records-daily}
CONS=/workspace/lanes/consumers
BLOBS=/workspace/lanes/consumer-records/blobs
LOGD=/workspace/staging/logs; SUM=$LOGD/consumer-records.log; mkdir -p $LOGD/consumer-records /workspace/staging/consumer-records "$BLOBS"
SG=/workspace/csoai-scale-engine/release_guard
PY=$CONS/.venv/bin/python; [ -x "$PY" ] || PY=/root/venv/bin/python3
export PATH=/root/venv/bin:/workspace/tools/node/bin:$PATH
export PLAYWRIGHT_BROWSERS_PATH=/workspace/tools/ms-playwright NODE_OPTIONS=--max-old-space-size=6144 PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
summary() { echo "$(date -u +%FT%TZ) $*" >> $SUM; echo "$*" >&2; }
MEASURES="epoch.date_and_n_stated lmarena.publish_lag_and_n openrouter_hf.declared_field_agreement swebench.logs_pointer_share"

case "${1:-}" in
  --prepare)
    D=${2:?date}; [[ $D =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { summary "FAILED stage=prepare reason=bad date $D"; exit 64; }
    X=$(mktemp -d /workspace/staging/consumer-records/prep.XXXX); trap 'rm -rf "$X"' EXIT
    mkdir -p "$X/cands" "$X/code"
    for m in $MEASURES; do
      f=$(ls -1 $CONS/candidates/$m/*.json 2>/dev/null | sort | tail -1)
      [ -n "$f" ] || { summary "FAILED stage=prepare date=$D reason=no candidate for $m"; exit 1; }
      cp "$f" "$X/cands/"
    done
    git -C $M show master:scripts/measurements/disclosure-completeness/build_records.py > "$X/code/build_records.py" &&
      git -C $M show master:scripts/measurements/disclosure-completeness/verify.py > "$X/code/verify.py" ||
      { summary "FAILED stage=prepare date=$D reason=canon producer absent on staging master"; exit 1; }
    # Published candidate ids: the newest set on staging master.
    LAST=$(git -C $M ls-tree --name-only master public/interop/ | grep -E 'disclosure-completeness-[0-9]{4}-[0-9]{2}-[0-9]{2}$' | sort | tail -1)
    NEWIDS=$($PY -c 'import json,glob,sys; print(" ".join(sorted(json.load(open(f))["candidate_id"] for f in glob.glob(sys.argv[1]+"/*.json"))))' "$X/cands")
    OLDIDS=""
    if [ -n "$LAST" ]; then
      OLDIDS=$(for s in $(git -C $M show master:$LAST/set.json | $PY -c 'import json,sys; print(" ".join(r["path"] for r in json.load(sys.stdin)["records"]))'); do
                 git -C $M show master:$LAST/$s | $PY -c 'import json,sys; print(json.load(sys.stdin)["measurement"]["candidate_id"])'; done | sort | tr '\n' ' ' | sed 's/ $//')
    fi
    if [ "$NEWIDS" = "$OLDIDS" ]; then summary "UNCHANGED date=$D (candidates equal the published set $(basename "${LAST:-none}"))"; exit 3; fi
    [ "$(basename "${LAST:-x}")" = "disclosure-completeness-$D" ] && { summary "FAILED stage=prepare date=$D reason=a set for $D is already published; candidates changed again the same day (next run)"; exit 1; }
    # Archive every pinned input blob so the recompute gate (and any later check) can run after the store prunes.
    $PY - "$X/cands" "$CONS/store" "$BLOBS" <<'PYA' || { summary "FAILED stage=prepare date=$D reason=pinned input blob missing from the store"; exit 1; }
import glob, hashlib, json, os, shutil, sys
cd, store, blobs = sys.argv[1:4]
for f in glob.glob(cd + "/*.json"):
    for p in json.load(open(f))["inputs"]:
        dst = os.path.join(blobs, p["sha256"])
        if not os.path.exists(dst):
            src = os.path.join(store, p["sha256"][:2], p["sha256"])
            b = open(src, "rb").read()
            assert hashlib.sha256(b).hexdigest() == p["sha256"], src
            shutil.copyfile(src, dst + ".part"); os.replace(dst + ".part", dst)
PYA
    cp "$CONS/adapters.py" "$X/code/adapters.py"
    $PY "$X/code/build_records.py" --candidates "$X/cands" --adapters "$X/code/adapters.py" --date "$D" --out "$X/out" >/dev/null 2>"$X/build.err" ||
      { summary "FAILED stage=prepare date=$D reason=build_records: $(tail -1 $X/build.err)"; exit 1; }
    summary "PREPARED date=$D set=disclosure-completeness-$D (candidates changed: was ${OLDIDS:-none})"
    tar czf - -C "$X/out" "disclosure-completeness-$D"
    exit 0 ;;
  --tar-stdin)
    D=${2:?date}; [[ $D =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { summary "FAILED stage=trigger reason=bad date $D"; exit 64; }
    T=/workspace/staging/consumer-records/$D.tgz; cat > "$T.part" && mv "$T.part" "$T"
    [ -s "$T" ] || { summary "FAILED stage=trigger date=$D reason=empty tarball"; exit 1; }
    setsid nohup bash "$0" --run "$D" > /dev/null 2>&1 < /dev/null &
    echo "started consumer-records $D (detail $LOGD/consumer-records/)"; exit 0 ;;
  --run) D=${2:?date}; MODE=run ;;
  --land-clone) D=$(date -u +%F); MODE=land ;;
  *) echo "usage: $0 --prepare DATE | --tar-stdin DATE | --run DATE | --land-clone"; exit 64 ;;
esac
DL=$LOGD/consumer-records/$(date -u +%Y%m%dT%H%MZ)-$MODE.log
exec > >(tee -a "$DL") 2>&1
exec 7>/workspace/ci/consumer-records.lock
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
    git checkout -q -B land-consumer-records-$D "$BASE" || fail "checkout base"
    git -c user.name=CSOAI -c user.email=nicholas@csoai.org merge --no-ff -q "$TIP" -m "land: merge $BR ($(cat .git/CONSUMER_RECORDS_SUBJECT 2>/dev/null || echo "disclosure-completeness set $D"))

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" \
      || { git merge --abort 2>/dev/null; git checkout -q "$BR"; fail "merge conflict landing $BR on ${BASE:0:9} (never forced)"; }
    STAGE=land-push
    if git push -q origin "HEAD:refs/heads/master" 2>/tmp/consumer-records-push.err; then
      LANDED=$(git rev-parse HEAD); git checkout -q "$BR"; return 0
    fi
    echo "push rejected: $(tail -1 /tmp/consumer-records-push.err)"; git checkout -q "$BR"; sleep $((attempt * 20))
  done
  fail "push to staging master rejected 5 times"
}
if [ "$MODE" = land ]; then land; summary "LANDED ${LANDED:0:12} (land-only retry)"; exit 0; fi

step prepare
T=/workspace/staging/consumer-records/$D.tgz; [ -s "$T" ] || fail "no tarball $T"
if [ ! -d "$C/.git" ]; then
  for i in 1 2 3; do rm -rf "$C"; git clone -q --shared "$M" "$C" && break; sleep 15; done
  [ -d "$C/.git" ] || fail "clone"
fi
cd "$C" || fail "cd clone"
[ -z "$(git status --porcelain --untracked-files=no)" ] || fail "clone $C is dirty; refusing to overwrite"
git fetch -q origin master || fail "fetch"
BR=lane/consumer-records-$D
git checkout -q -B "$BR" origin/master || fail "checkout"
[ -e node_modules ] || { ln -s /workspace/ci/councilof-ai/node_modules node_modules && echo node_modules >> .git/info/exclude; } || fail "node_modules link"

step place
S=disclosure-completeness-$D
[ ! -e "public/interop/$S" ] || fail "public/interop/$S already on master"
tar xzf "$T" -C public/interop/ || fail "untar"
for r in public/interop/$S/*/record.json; do
  [ -s "${r%.json}.signed.json" ] && [ -s "$r.ots" ] || fail "$(dirname $r): signature or timestamp missing (Oracle signing step incomplete)"
done
[ -z "$(find public/interop/$S -name 'sign-extra.json' -o -name '._*' -o -name '__pycache__')" ] || fail "stray files in the signed tree"
DATA=client/src/data/measurements/disclosure-completeness
cp public/interop/$S/set.json $DATA/latest.set.json
$PY - "$DATA/sets.json" "$D" <<'PYS' || fail "sets.json append"
import json, sys
p, d = sys.argv[1:3]
j = json.load(open(p)); s = "disclosure-completeness-" + d
if s not in [x["set"] for x in j["sets"]]:
    j["sets"].append({"date": d, "set": s})
j["sets"].sort(key=lambda x: x["date"])
open(p, "w").write(json.dumps(j, indent=1) + "\n")
PYS
git add -A -- public/interop/$S $DATA
SUBJ=$($PY -c 'import json,sys; s=json.load(open(sys.argv[1])); print("disclosure-completeness set %s: %d signed records" % (s["date"], len(s["records"])))' public/interop/$S/set.json)
echo "$SUBJ" > .git/CONSUMER_RECORDS_SUBJECT
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "measurements: $SUBJ

Built by scripts/measurements/disclosure-completeness/build_records.py from the consumer loop's candidates (lanes pod
/workspace/lanes/consumers), each record board-signed on Oracle via POST /api/board-sign (pod caller token) with
OpenTimestamps; bytes unchanged here. Job: scripts/pod-loops/consumer-records-daily.sh (lane L2).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || fail "commit"

step tests
CONSUMER_BLOBS=$BLOBS $PY scripts/measurements/disclosure-completeness/test_build_records.py > /tmp/cr-pytest.log 2>&1 || fail "producer/recompute tests: $(tail -3 /tmp/cr-pytest.log | tr '\n' ' ')"
grep -q "skipped" /tmp/cr-pytest.log && fail "recompute test skipped (CONSUMER_BLOBS unreadable)"
node --test scripts/measurements/disclosure-completeness.node-test.mjs > /tmp/cr-node.log 2>&1 || fail "page/signature node test: $(grep -m3 'not ok' /tmp/cr-node.log | tr '\n' ' ')"
/root/venv/bin/python3 public/interop/$S/verify.py --dir public/interop/$S > /tmp/cr-verify.log 2>&1 || fail "verify.py: $(tail -3 /tmp/cr-verify.log | tr '\n' ' ')"

step source-gates
/usr/bin/python3 $SG/sitemap_guard.py --public-dir public --baseline $SG/sitemap-known-public.json --receipt /tmp/cr-sitemap-src.json > /tmp/cr-sitemap-src.log 2>&1 || fail "sitemap-source"

step build-gates
flock -w 5400 /workspace/ci/build-slot.lock bash -c '
  set -uo pipefail
  rm -rf dist/client
  npm run build:client > /tmp/cr-build.log 2>&1 || { echo "build FAILED"; tail -5 /tmp/cr-build.log; exit 4; }
  bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350 > /tmp/cr-prerender.log 2>&1 || { echo "prerender FAILED"; tail -4 /tmp/cr-prerender.log; exit 5; }
  node scripts/brand-gate.mjs dist/client > /tmp/cr-brand.log 2>&1 || { echo "brand-gate FAILED"; tail -5 /tmp/cr-brand.log; exit 6; }
  node scripts/signed-json-guard.mjs dist/client > /tmp/cr-sjg.log 2>&1 || { echo "signed-json-guard FAILED"; tail -5 /tmp/cr-sjg.log; exit 7; }
  { node scripts/canary-leak-gate.mjs --selftest && node scripts/canary-leak-gate.mjs dist/client public; } > /tmp/cr-canary.log 2>&1 || { echo "canary-leak-gate FAILED"; exit 15; }
  echo "build, prerender, brand-gate, signed-json-guard, canary ok: $(find dist/client -type f | wc -l) files"
' || fail "build gates (see $DL)"
rm -rf dist/client/functions dist/client/proofs dist/client/cards
node scripts/redirects-guard.mjs dist/client/_redirects > /tmp/cr-redir.log 2>&1 || fail "redirects-guard"
node scripts/pages-size-guard.mjs dist/client > /tmp/cr-size.log 2>&1 || fail "pages-size-guard: $(find dist/client -type f | wc -l) files"
$PY - "$S" <<'PYW' || fail "built set bytes differ from source, or the page lacks the set"
import sys
from pathlib import Path
s = sys.argv[1]
for p in Path("public/interop", s).rglob("*"):
    if p.is_file():
        rel = p.relative_to("public")
        assert (Path("dist/client") / rel).read_bytes() == p.read_bytes(), rel
page = Path("dist/client/measurements/disclosure-completeness/index.html").read_text()
assert s in page, "prerendered page does not name the newest set"
print("built set bytes == source; page names", s)
PYW
/usr/bin/python3 $SG/sitemap_guard.py --public-dir dist/client --baseline $SG/sitemap-known-public.json --receipt /tmp/cr-sitemap-built.json --built > /tmp/cr-sitemap-built.log 2>&1 || fail "sitemap-built"
echo "all gates ok"; rm -rf dist
if [ "${LAND:-1}" = 0 ]; then summary "GATED-NOT-LANDED date=$D $SUBJ (LAND=0; --land-clone to land)"; exit 0; fi
land
summary "PUBLISHED date=$D $SUBJ land=${LANDED:0:12} (deploys on the next auto-land tick)"
rm -f "$T"; ls -1t /workspace/staging/consumer-records/*.tgz 2>/dev/null | tail -n +4 | xargs -r rm -f
