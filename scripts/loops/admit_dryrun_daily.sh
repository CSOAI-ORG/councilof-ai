#!/usr/bin/env bash
# admit_dryrun_daily.sh — daily DRY-RUN of scripts/admit_mill_cards.py over every Kaggle mill slice
# (NEXT-LEVEL-PLAN-2026-09-28 #12, dry-run half; CARD-ADMISSION-PROPOSAL-2026-09-28 step 2).
#
# Installed on oracle-micro-2 as ~/lanes/admit-dryrun/run.sh, cron 16:20Z (after the 10:40Z mill
# slice and its 5 h worst case). It APPLIES NOTHING: admit_mill_cards.py is dry-run by default and
# this script never passes --apply or --out-dir, and refuses to log a run whose output says APPLY.
#
# For each OK slice in ~/lanes/logs/mill-kaggle-daily.log that has no line yet in
# ~/lanes/logs/admit-dryrun.log, it:
#   1. resolves the slice branch in the mill's own clone (read-only: git archive, never checkout),
#      and checks it is the commit the mill logged;
#   2. extracts ONLY the admission inputs of that commit into a temp dir on /evac-bulk
#      (~45 MB, removed after), so the mill's clone and working tree are never touched;
#   3. runs admit_mill_cards.py --json on the cards that slice ADDED to public/interop/mill-cards-signed,
#      passing any csoai.mill-runtime-declaration/0.1 side file the slice produced;
#   4. writes ONE line per slice to ~/lanes/logs/admit-dryrun.log with the per-reason-code counts,
#      and the full JSON report to /evac-bulk/admit-dryrun/reports/<slice>.json.
# Every run also writes a heartbeat line to stdout (the cron log), including runs with nothing new,
# so "no line" always means "did not run", never "ran and found nothing".
set -uo pipefail
CLONE=${ADR_CLONE:-/evac-bulk/mill-kaggle-daily/clone}
MILL_LOG=${ADR_MILL_LOG:-$HOME/lanes/logs/mill-kaggle-daily.log}
LOG=${ADR_LOG:-$HOME/lanes/logs/admit-dryrun.log}
REPORTS=${ADR_REPORTS:-/evac-bulk/admit-dryrun/reports}
TMPROOT=${ADR_TMP:-/evac-bulk}
FLOOR_KB=$((2 * 1024 * 1024))   # skip below 2 GB free
now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
beat() { echo "$(now) admit-dryrun $*"; }

mkdir -p "$(dirname "$LOG")" "$REPORTS"
free_kb=$(df -Pk "$TMPROOT" | awk 'NR==2 {print $4}')
if [ "${free_kb:-0}" -lt "$FLOOR_KB" ]; then beat "SKIPPED_LOW_DISK free_kb=$free_kb floor_kb=$FLOOR_KB"; exit 0; fi
if pgrep -f "lanes/mill-kaggle-daily/run.sh" >/dev/null 2>&1; then beat "SKIPPED_MILL_RUNNING"; exit 0; fi
[ -f "$MILL_LOG" ] || { beat "NO_MILL_LOG $MILL_LOG"; exit 0; }
[ -d "$CLONE/.git" ] || { beat "NO_MILL_CLONE $CLONE"; exit 1; }

INPUTS=(scripts/admit_mill_cards.py scripts/land_mill_cards.py scripts/verify_hub_mill_evidence.py
        scripts/verify_runpod_gspc_intake.py scripts/runpod_gspc_bank_allowlist.current.json
        harness/gspc-top100 harness/instrument-guard public/.well-known/did.json
        public/interop/instrument-guard public/interop/mill-evidence public/interop/mill-cards-signed
        public/interop/mill-cards-unsigned)

new=0; seen=0
while IFS= read -r line; do
  slice=$(awk '{print $2}' <<<"$line")
  model=$(awk '{print $3}' <<<"$line")
  branch=$(grep -o ' branch=[^ ]*' <<<"$line" | cut -d= -f2)
  logged=$(grep -o ' commit=[^ ]*' <<<"$line" | cut -d= -f2)
  out=$(grep -o ' out=[^ ]*' <<<"$line" | cut -d= -f2)
  [ -n "$slice" ] || continue
  seen=$((seen + 1))
  grep -q " slice=$slice " "$LOG" 2>/dev/null && continue
  new=$((new + 1))
  head="$(now) slice=$slice model=$model branch=$branch"
  commit=$(git -C "$CLONE" rev-parse --verify -q "$branch^{commit}" 2>/dev/null)
  if [ -z "$commit" ]; then echo "$head commit=- state=BRANCH_NOT_IN_CLONE dry_run=1" >> "$LOG"; continue; fi
  if [ -n "$logged" ] && [ "${commit:0:${#logged}}" != "$logged" ]; then
    echo "$head commit=${commit:0:9} logged=$logged state=COMMIT_MISMATCH dry_run=1" >> "$LOG"; continue
  fi
  T=$(mktemp -d "$TMPROOT/admit-dryrun.XXXXXX")
  if ! git -C "$CLONE" archive --format=tar "$commit" "${INPUTS[@]}" | tar -x -C "$T"; then
    echo "$head commit=${commit:0:9} state=EXTRACT_FAILED dry_run=1" >> "$LOG"; rm -rf "$T"; continue
  fi
  mapfile -t cards < <(git -C "$CLONE" diff --name-only --diff-filter=A "$commit^" "$commit" -- public/interop/mill-cards-signed \
                       | grep -E '/signed-[^/]*\.json$')
  decl=()
  if [ -n "$out" ] && [ -d "$out" ]; then
    while IFS= read -r f; do decl+=(--runtime-declaration "$f"); done \
      < <(find "$out" -maxdepth 2 -name '*runtime-declaration*.json' -type f 2>/dev/null)
  fi
  if [ ${#cards[@]} -eq 0 ]; then
    echo "$head commit=${commit:0:9} cards=0 state=NO_SIGNED_CARDS_IN_SLICE dry_run=1" >> "$LOG"; rm -rf "$T"; continue
  fi
  rep="$REPORTS/$slice.txt"
  ( cd "$T" && python3 scripts/admit_mill_cards.py --cards "${cards[@]}" "${decl[@]}" --json ) > "$rep" 2>&1; rc=$?
  if grep -q '^mill-admission APPLY' "$rep"; then
    echo "$head commit=${commit:0:9} state=REFUSED_APPLY_SEEN rc=$rc dry_run=0" >> "$LOG"; rm -rf "$T"; exit 1
  fi
  summary=$(python3 - "$rep" "$REPORTS/$slice.json" <<'PY'
import collections, json, sys
txt = open(sys.argv[1], encoding="utf-8").read()
i = txt.find("\n{")
if i < 0:
    print("state=NO_JSON_REPORT"); sys.exit(0)
rep = json.loads(txt[i + 1:])
json.dump(rep, open(sys.argv[2], "w", encoding="utf-8"), indent=1, sort_keys=True)
ds = rep["decisions"]
c = collections.Counter(r for d in ds for r in d["reasons"])
adm = sum(d["state"] == "ADMITTED" for d in ds)
reasons = ",".join(f"{k}:{v}" for k, v in sorted(c.items())) or "-"
print(f"cards={len(ds)} admitted={adm} not_admitted={len(ds) - adm} reasons={reasons} "
      f"notes={len(rep.get('notes', []))} dry_run={int(bool(rep.get('dry_run')))}")
PY
)
  echo "$head commit=${commit:0:9} $summary declarations=$(( ${#decl[@]} / 2 )) rc=$rc report=$REPORTS/$slice.json" >> "$LOG"
  rm -f "$rep"; rm -rf "$T"
done < <(grep ' state=OK ' "$MILL_LOG")
beat "OK slices_in_mill_log=$seen new_lines=$new log=$LOG"
