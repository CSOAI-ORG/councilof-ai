#!/bin/bash
# gspc-estate-spray.sh — build the whole GSPC estate publication bundle and push it to
# Hugging Face, then read every uploaded file back ANONYMOUSLY and compare the bytes.
#
#   /workspace/lanes/loops/gspc-estate-spray.sh --now            build + publish + verify
#   /workspace/lanes/loops/gspc-estate-spray.sh --now --build    build only, publish nothing
#
# It is a loop in the same shape as the others here: it sources lib.sh, stamps once per UTC
# day, logs one line per run, and writes nothing outside $LANES. It is NOT registered in
# scheduler.sh by this file — the owner adds it.
#
# WHY THIS EXISTS. hubcard-refresh.sh already refreshes the 16-point card on three
# loop-fed datasets via the repo's own scripts/hf/hf-org-card.py, and hf_upload.py already
# knows how to push one file and register one viewer config. Neither of them assembles a
# publication: the board, the signed cards, the per-item evidence, the frozen-bank digests,
# the chain states, the corrections, the harness and a reproduction test, as one coherent
# thing a stranger can act on. This composes those two existing tools rather than replacing
# either. Uploads go through hf_upload.py, so a pod with no token QUEUES instead of failing.
#
# ONE FORMAT PER DATASET. Every viewer config registered here points at a .jsonl file.
# The HF viewer picks one builder per DATASET, not per config, so a repo that mixes
# .jsonl and .parquet configs fails with a misleading "Parquet magic bytes not found".
# Other extensions may be published as plain files; they must not become configs.
#
# WHERE ITS SOURCES LIVE. Like every loop here, this script is the durable copy and the pod
# is where it runs: $SPRAY below is a /workspace path, not a repo path. The producers it
# calls are vendored in this repo under scripts/spray/, and deploying this loop means
# copying them to the pod in the layout $SRC and $ASSETS expect. The flat repo tree and the
# pod's src/assets split are NOT the same shape, so the mapping is written out here rather
# than left to be guessed:
#
#   scripts/spray/build_estate_bundle.py  ->  $SPRAY/src/build_estate_bundle.py
#   scripts/spray/make_cards.py           ->  $SPRAY/src/make_cards.py
#   scripts/spray/truncation_table.py     ->  $SPRAY/src/truncation_table.py
#   scripts/spray/verify_published.py     ->  $SPRAY/src/verify_published.py
#   scripts/spray/repro/*.py              ->  $SPRAY/assets/repro/
#   scripts/spray/ontology/make_ontology.py -> $SPRAY/assets/ontology/
#   scripts/pod-loops/hf_upload.py        ->  $LOOPS/hf_upload.py   (--folder lands here)
#
# $ASSETS/findings/*.md is a dated findings document written per publication, not tooling;
# it is not carried in the repo and step 2 below copies whatever the pod holds.
set -u
. "$(dirname "$0")/lib.sh"

BUILD_ONLY=0; REAP=0
for arg in "$@"; do
  [ "$arg" = "--build" ] && BUILD_ONLY=1
  # --reap deletes the working clone when the run finishes. The clone is ~1.2 GB (695 MB of
  # tree, 494 MB of .git) and this pod shares one volume with every other lane, so on a tight
  # disk it is cheaper to re-clone from the local bare repo than to hold it between runs.
  [ "$arg" = "--reap" ] && REAP=1
done
[ "${1:-}" = "--now" ] || stamp gspc-estate-spray || exit 0

SPRAY=${SPRAY_ROOT:-/workspace/lanes/spray}
SRC=$SPRAY/src
ASSETS=$SPRAY/assets
CLONE=$SPRAY/councilof-ai
BUNDLE=${SPRAY_BUNDLE:-$OUT/gspc-estate}
ONTO=${SPRAY_ONTO:-$OUT/gspc-ontology}
PY=${SPRAY_PY:-/workspace/tools/ots-venv/bin/python}   # carries python-opentimestamps
BARE=${SPRAY_BARE:-/workspace/git/councilof-ai.git}
EST_REPO=csoai/gspc-estate
ONT_REPO=csoai/gspc-ontology

log gspc-estate-spray "START build_only=$BUILD_ONLY bundle=$BUNDLE"

# 1. the tree the bundle is read from — one clone for this purpose, never a shared checkout
if [ ! -d "$CLONE/.git" ]; then git clone -q "$BARE" "$CLONE" || { log gspc-estate-spray "HALT clone failed"; exit 2; }; fi
git -C "$CLONE" fetch -q "$BARE" master && git -C "$CLONE" reset -q --hard FETCH_HEAD \
  || { log gspc-estate-spray "HALT fetch/reset failed"; exit 2; }
COMMIT=$(git -C "$CLONE" rev-parse --short HEAD)

# 2. build. build_estate_bundle.py recreates $BUNDLE from scratch, so everything that is
#    not read from the estate is copied in AFTERWARDS, never left in the output directory
#    between runs.
"$PY" "$SRC/build_estate_bundle.py" --repo "$CLONE" --out "$BUNDLE" > "$LOGS/gspc-estate-spray.build.log" 2>&1 \
  || { log gspc-estate-spray "HALT build failed (see $LOGS/gspc-estate-spray.build.log)"; exit 2; }

mkdir -p "$BUNDLE/repro" "$BUNDLE/findings"
cp "$ASSETS/repro/"*.py "$BUNDLE/repro/"
cp "$ASSETS/findings/"*.md "$BUNDLE/findings/"

# 3. the reproduction test, run for real, both cases, output captured verbatim.
#    A non-zero rc here stops the publish: we do not ship a repro script that does not
#    reproduce, and we do not ship a tamper control that fails to detect tampering.
( cd "$BUNDLE" && python3 repro/verify_estate.py ) > "$BUNDLE/repro/REPRO-PASS.txt" 2>&1
rc_pass=$?
( cd "$BUNDLE" && python3 repro/verify_estate.py --tamper ) > "$BUNDLE/repro/REPRO-TAMPER-FAIL.txt" 2>&1
rc_tamper=$?
if [ $rc_pass -ne 0 ] || [ $rc_tamper -ne 0 ]; then
  log gspc-estate-spray "HALT reproduction gate rc_pass=$rc_pass rc_tamper=$rc_tamper — not publishing"
  exit 3
fi

# 4. figures, the honesty table, the ontology, the cards — each from its own producer
( cd "$BUNDLE" && python3 repro/make_figures.py --bundle . --out figures ) >> "$LOGS/gspc-estate-spray.build.log" 2>&1
( cd "$CLONE" && python3 "$SRC/truncation_table.py" "$BUNDLE/findings/grading-honesty.json" ) >> "$LOGS/gspc-estate-spray.build.log" 2>&1
mkdir -p "$ONTO" && cp "$ASSETS/ontology/make_ontology.py" "$ONTO/"
( cd "$ONTO" && python3 make_ontology.py --out . ) >> "$LOGS/gspc-estate-spray.build.log" 2>&1
python3 "$SRC/make_cards.py" --bundle "$BUNDLE" --onto "$ONTO" >> "$LOGS/gspc-estate-spray.build.log" 2>&1
"$PY" - "$BUNDLE" <<'PYEOF' >> "$LOGS/gspc-estate-spray.build.log" 2>&1
import hashlib, json, pathlib, sys
out = pathlib.Path(sys.argv[1])
rows = [{"path": str(f.relative_to(out)), "bytes": f.stat().st_size,
         "sha256": hashlib.sha256(f.read_bytes()).hexdigest()}
        for f in sorted(out.rglob("*")) if f.is_file() and f.name != "manifest.jsonl"]
(out / "manifest.jsonl").write_text(
    "".join(json.dumps(r, sort_keys=True) + "\n" for r in rows))
print(f"manifest rebuilt: {len(rows)} files")
PYEOF

BYTES=$(du -sb "$BUNDLE" | cut -f1)
NFILES=$(find "$BUNDLE" -type f | wc -l)
log gspc-estate-spray "BUILT commit=$COMMIT files=$NFILES bytes=$BYTES repro=PASS tamper=DETECTED"
[ "$BUILD_ONLY" = "1" ] && { log gspc-estate-spray "STOP --build; nothing published"; exit 0; }

# 5. publish. ONE commit per dataset via hf_upload.py --folder, not one per file: a
#    publication of a thousand files is one publication, and a thousand commits makes the
#    repo slow and its history unreadable. hf_upload.py still queues rather than losing a
#    push when the pod holds no token. The viewer configs travel in the README front
#    matter that make_cards.py writes, so they land in the same commit as the files.
: > "$LOGS/gspc-estate-spray.upload.log"
python3 "$LOOPS/hf_upload.py" --repo "$EST_REPO" --folder "$BUNDLE" --create \
  --commit-message "GSPC estate snapshot: board $COMMIT, reproduction PASS + tamper control" \
  >> "$LOGS/gspc-estate-spray.upload.log" 2>&1
python3 "$LOOPS/hf_upload.py" --repo "$ONT_REPO" --folder "$ONTO" --create \
  --commit-message "GSPC measurement vocabulary: JSON-LD + SKOS + crosswalk" \
  >> "$LOGS/gspc-estate-spray.upload.log" 2>&1
UPLOADED=$(grep -c "^UPLOADED" "$LOGS/gspc-estate-spray.upload.log" || true)
FAILED=$(grep -c "^FAILED\|^UNCHECKABLE" "$LOGS/gspc-estate-spray.upload.log" || true)

# 6. read it back with NO token and compare the bytes. A push whose result was never
#    fetched anonymously is not a publication: it is a local success message.
python3 "$SRC/verify_published.py" --bundle "$BUNDLE" --repo "$EST_REPO" \
        --also "$ONTO:$ONT_REPO" > "$LOGS/gspc-estate-spray.readback.log" 2>&1
rc_rb=$?
log gspc-estate-spray "RESULT uploaded=$UPLOADED failed_or_queued=$FAILED readback_rc=$rc_rb | $(tail -2 "$LOGS/gspc-estate-spray.readback.log" | tr '\n' ' ' | cut -c1-300)"
if [ "$REAP" = "1" ]; then
  rm -rf "$CLONE"
  log gspc-estate-spray "REAPED $CLONE ($(df -h /workspace | tail -1 | awk '{print $4}') free); the next run re-clones from $BARE"
fi
exit $rc_rb
