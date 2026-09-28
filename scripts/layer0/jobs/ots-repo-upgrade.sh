#!/usr/bin/env bash
# STAGED (not installed). Daily 13:10Z on the build pod, after the Oracle flywheel OTS pass.
# Finds the repository's own public .ots proofs that are still pending, asks the calendars for the
# upgrade (scripts/ots-upgrade.py never rewrites a file that did not improve), checks every new Bitcoin
# attestation against two explorers, and - only if all check - commits them on branch
# lane/ots-upgrade-<day> for the integrator. PUSH=1 pushes that branch to the staging mirror; default
# is a bundle in $L0_STATE. Never master.
#
# A proof's bytes are not only its own. Before 2026-09-28T21Z this job would have landed 41 upgraded
# proofs whose old digests 18 other tracked files still pinned (ots-state sidecars saying
# PENDING + ots_sha256, a root witness, census records, fixtures), and 18 of the 41 sat under
# public/interop, whose derived manifest (and the llms.txt section read from it) the deploy gate
# requires to equal the proof bytes. So:
#   - a pending proof whose current sha256 appears in any tracked non-.ots file, or that has an
#     ots-state / stamp-batch sidecar (<subject>.ots.json, which records the proof's size or state), is
#     NOT upgraded here; it is reported PINNED with the files that pin it (their producer re-emits,
#     then this job lands it);
#   - the derived manifest is regenerated in the same commit. llms.txt (which prints the manifest's
#     counts) is regenerated BEFORE any upgrade first: if that alone changes it, canon's llms.txt was
#     already stale for reasons that are not this job's (on 2026-09-28 the board lid and the manifest
#     had both moved past it), so this job leaves it untouched and says so in its report rather than
#     landing someone else's lid change under an OTS commit message; otherwise it is regenerated too;
#   - scripts/pod-loops/root_ots_manifest_gate.py (the deploy-prod gate) must pass on the result;
#   - the commit may touch only the upgraded proofs and those three derived files.
. "$(dirname "$0")/_common.sh"
l0_floor
# llms-txt.mjs reads council-os/, functions/mcp/, public/signed/, public/evidence/ and top-level public/
l0_canon public/interop public/measurement-capsules public/claims public/measurements public/signed public/evidence council-os functions/mcp scripts
cd "$L0_CANON"
S="$L0_CANON/.git/l0"; mkdir -p "$S"   # scratch inside .git: never in git status
REPORT="$L0_STATE/ots-repo-upgrade-$L0_DAY.json"
DERIVED=(public/interop/ots/manifest.json)
LLMS_STALE_BEFORE=0
node scripts/llms-txt.mjs >/dev/null
if git diff --quiet -- public/llms.txt public/llms-full.txt; then
  DERIVED+=(public/llms.txt public/llms-full.txt)
else
  LLMS_STALE_BEFORE=1
  echo "NOTE: canon llms.txt is already stale before any upgrade ($(git diff --shortstat -- public/llms.txt public/llms-full.txt)); left untouched"
  git checkout -q -- public/llms.txt public/llms-full.txt
fi

python3 - > "$S/pending.tsv" <<'PY'
import hashlib, io, pathlib
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
from opentimestamps.core.serialize import StreamDeserializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile
def atts(t):
    yield from t.attestations
    for _o, s in t.ops.items(): yield from atts(s)
for p in sorted(pathlib.Path("public").rglob("*.ots")):
    raw = p.read_bytes()
    try:
        d = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(raw)))
    except Exception:
        continue
    if not any(isinstance(a, BitcoinBlockHeaderAttestation) for a in atts(d.timestamp)):
        print(f"{hashlib.sha256(raw).hexdigest()}\t{p}")
PY
echo "pending proofs: $(wc -l < "$S/pending.tsv")"
[ -s "$S/pending.tsv" ] || { echo "NO_CHANGE"; exit 0; }

# Pins are searched in the whole tree at HEAD (not only this sparse checkout); the derived files are
# excluded because this job regenerates them.
cut -f1 "$S/pending.tsv" > "$S/pat"
git grep -o -F -f "$S/pat" HEAD -- . ':(exclude)*.ots' ':(exclude)public/interop/ots/manifest.json' \
  ':(exclude)public/llms.txt' ':(exclude)public/llms-full.txt' > "$S/pins" || [ $? -eq 1 ]
git ls-tree -r --name-only HEAD > "$S/tree"
mapfile -t pending < <(python3 - "$S/pending.tsv" "$S/pins" "$REPORT" "$LLMS_STALE_BEFORE" "$S/tree" <<'PY'
import json, re, sys
pend = [l.rstrip("\n").split("\t") for l in open(sys.argv[1]) if l.strip()]
tree = set(l.rstrip("\n") for l in open(sys.argv[5]))
pins = {}
for line in open(sys.argv[2]):
    ref, path, dig = line.rstrip("\n").split(":", 2)  # HEAD:<path>:<digest>
    pins.setdefault(dig, set()).add(path)
def sidecars(proof):  # an ots-state / stamp-batch sidecar may pin the proof by size, not digest
    subj = proof[:-4]
    return {c for c in (re.sub(r"\.json$", "", subj) + ".ots.json", subj + ".ots.json", proof + ".json") if c in tree}
rows = [{"proof": p, "sha256": d, "pinned_by": sorted(pins.get(d, set()) | sidecars(p))} for d, p in pend]
json.dump({"schema": "csoai.ots-repo-upgrade/0.1", "pending": len(rows),
           "pinned": sum(1 for r in rows if r["pinned_by"]),
           "rule": "a pending proof whose sha256 another tracked file pins is not upgraded here; that file's producer re-emits first",
           "llms_txt_stale_on_canon_before_this_job": sys.argv[4] == "1",
           "rows": rows}, open(sys.argv[3], "w"), indent=1)
for r in rows:
    if not r["pinned_by"]: print(r["proof"])
PY
)
[ -s "$REPORT" ] || { echo "GATE: pin report not written - nothing done"; exit 1; }
echo "unpinned pending proofs: ${#pending[@]} (report $REPORT)"
[ "${#pending[@]}" -eq 0 ] && { echo "NO_CHANGE (every pending proof is pinned elsewhere)"; exit 0; }
set +e; python3 scripts/ots-upgrade.py "${pending[@]}"; set -e
changed=$(git status --porcelain -- public | awk '{print $2}')
[ -z "$changed" ] && { echo "NO_CHANGE (calendars have not committed yet)"; exit 0; }
# one flat dir for the checker (it globs *.ots, not recursively); path-mangled names so two proofs
# with the same basename in different directories cannot overwrite each other and go unchecked
mkdir -p "$S/bc"; n=0
for f in $changed; do cp "$f" "$S/bc/$(printf %s "$f" | tr / _)"; n=$((n+1)); done
python3 scripts/ots_block_check.py --dir "$S/bc" --out "$L0_STATE/ots-upgrade-check-$L0_DAY.json"
python3 - "$L0_STATE/ots-upgrade-check-$L0_DAY.json" "$n" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
files = d.get("files", {})
bad = {k: v for k, v in files.items() if k != "MATCHES_BLOCK_HEADER"}
if bad or files.get("MATCHES_BLOCK_HEADER", 0) != int(sys.argv[2]):
    print(f"GATE: {files} for {sys.argv[2]} changed proofs - nothing committed"); sys.exit(1)
PY
python3 scripts/ots_manifest_rebuild.py --apply >/dev/null
[ "$LLMS_STALE_BEFORE" = 0 ] && node scripts/llms-txt.mjs >/dev/null
python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir public \
  || { echo "GATE: root_ots_manifest_gate refused the result - nothing committed"; exit 1; }
stray=$(git status --porcelain | awk '{print $2}' | grep -vxF -f <(printf '%s\n' $changed "${DERIVED[@]}") || true)
[ -n "$stray" ] && { echo "GATE: files outside the upgraded proofs and derived files changed - nothing committed:"; echo "$stray"; exit 1; }
LLMS_NOTE=" with llms.txt"; [ "$LLMS_STALE_BEFORE" = 1 ] && LLMS_NOTE="; llms.txt was stale on canon before this job and is left to its producer"
BR="lane/ots-upgrade-$(date -u +%Y%m%d)"
git checkout -q -b "$BR"
git add -- $changed "${DERIVED[@]}"
git -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m "ots: upgrade $n pending proof(s) to Bitcoin attestations; each new attestation matches its block header as public explorers report it; manifest regenerated from the proof bytes$LLMS_NOTE (reports: ots-upgrade-check-$L0_DAY.json, ots-repo-upgrade-$L0_DAY.json)"
if [ "${PUSH:-0}" = 1 ]; then git push -q origin "$BR"; echo "pushed $BR"; else B="$L0_STATE/${BR//\//-}.bundle"; git bundle create "$B" "$L0_SHA..$BR" >/dev/null; echo "bundle $B (thin: $L0_SHA..$BR)"; fi
