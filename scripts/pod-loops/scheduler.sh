#!/bin/bash
# The pod has no cron. This is the supervised loop that stands in for it: wakes every 60 s, runs
# whatever is due (UTC), and relies on each job's own stamp() so a job runs at most once per slot
# even if the scheduler is restarted mid-slot. Start via `loops/start.sh`.
#
#   every 10 min   watchdog.sh              logs/watchdog.log
#   every 10 min   commission-dispatch.sh   logs/commission-dispatch.log
#   hourly  :05    root-check.sh            logs/root-check.log
#   every 6 hours runpod upload heartbeat  state/runpod-upload/latest.json
#   hourly  :40    drift-draft.sh            logs/drift-draft.log  (snapshot live surfaces, diff, draft corrections for the owner; never publishes)
#   hourly  :45    trust-chain.sh           logs/trust-chain.log  (upgrade every published .ots whose calendar has completed, rebuild the OTS manifest from the bytes, re-verify the corrections ledger signature from the served bytes; one RESULT line per run including "nothing changed")
#   03:00Z         bazaar-conformance.sh    logs/bazaar-conformance.log
#   03:30Z         settlement-dry.sh        logs/settlement-dry.log
#   04:00Z         revenue-snapshot.sh      logs/revenue-snapshot.log
#   05:00Z         hubcard-refresh.sh       logs/hubcard-refresh.log
#   05:30Z         hf_upload.py --flush     logs/hf-flush.log   (pushes anything queued while no token existed)
#   06:00Z         corrections-watch.sh     logs/corrections-watch.log  (re-fetch the 15 stale pages, publish to the HF mirror)
#   07:00Z         census-capture.sh        logs/census-capture.log  (claim-capture census: 9 public authless
#   08:00Z         capability-probe.sh      logs/capability-probe.log  (request every surface council-os/capabilities.json declares against live; DRAFT one correction per mismatch into drift-draft's queue; never publishes)
#                                           catalogues -> canonical records -> RFC 9162 root -> OTS submit ->
#                                           detached board signature -> HF csoai/claim-capture-census + out/census.
#                                           DAILY, and daily is the honest cadence: DefiLlama's own responses
#                                           declare Cache-Control max-age 1798, OpenRouter 120, 402index 60 —
#                                           none of these catalogues publishes anything a finer tick could see,
#                                           and a finer tick would multiply the disk and the review load without
#                                           adding a single checkable fact. Runs AFTER corrections-watch so the
#                                           two daily HF pushes do not collide.)
#   06:30Z         indexnow-ping.sh         logs/indexnow-ping.log  (announce ONLY the councilof.ai URLs whose content moved; skips with a receipt when the key file is not live)
#   hourly  :15    durability-mirror.sh     logs/durability-mirror.log  (push the repository of record to
#                                           every mirror and read each mirror's tip BACK; the post-receive
#                                           hook on /workspace/git/councilof-ai.git already fires this after
#                                           every landing, so this is the backstop that catches the hours when
#                                           nothing landed or the hook was bypassed)
#   Sun 09:00Z     durability-hf-publish.sh  logs/durability-hf-publish.log  (weekly: browsable source/
#                                           snapshot + full-history bundle to the PUBLIC csoai/councilof-ai-source;
#                                           HF refuses this repo as a git remote -- 15 blobs over 10 MiB)
#   07:30Z         swh-archive.sh           logs/swh-archive.log  (Software Heritage save-requests for the public git origins, 8 per run; the anonymous window allows 10)
#   08:30Z         swh-visit-readback.sh    logs/swh-visit-readback.log  (read Software Heritage VISITS
#                                           back for the source origins and record a failed visit as a FACT.
#                                           Not a duplicate of swh-archive.sh: that loop submits save requests
#                                           and keeps only origins that returned a SWHID, so a starved or
#                                           failing origin -- the canonical GitHub one, appended last to a
#                                           ~109-origin queue behind a budget of 8 and an HTTP 429 -- never
#                                           appeared in it at all. Runs AFTER swh-archive so it reads back
#                                           the visits today's requests produced. Submits nothing.)
#   07:00Z         distribution-measure.sh  logs/distribution-measure.log  (measure every confirmed PyPI/npm/HF package; publish public/interop/distribution-<date>.json)
#   Mon 09:20Z     claim-watch-measure.sh   logs/claim-watch-measure.log  (WEEKLY claim maintenance on
#                                           the published registry's named subjects: extend the CL-1
#                                           counter series, re-read the CL-4/ON-1/ON-2 presence
#                                           baselines and diff them, recompute CL-3 oracle share and
#                                           CL-5 feed cadence from keyless public sources. Emits
#                                           "observed change requiring review" and NEVER an
#                                           allegation; sends nothing to any party named. Weekly is
#                                           the honest cadence: the counter and the adopter list are
#                                           editorial surfaces that move on no schedule, and a finer
#                                           tick would add reading load without adding a fact.)
#
# A daily job is "due" for the whole hour after its start minute, so a scheduler that was down at
# 03:00 and back at 03:40 still runs it once that day. Jobs run in the background so a slow census
# never delays the watchdog.
set -u
. "$(dirname "$0")/lib.sh"
exec 8>"$STATE/scheduler.lock"
flock -n 8 || exit 0
log scheduler "START pid=$$ loops=$LOOPS"
while true; do
  H=$(date -u +%H); M=$(date -u +%M)
  # Repository shell files are intentionally safe to install as 0644. Invoke
  # each owned shell explicitly through bash instead of depending on mode bits.
  bash "$LOOPS/watchdog.sh" 8>&- >/dev/null 2>&1
  bash "$LOOPS/commission-dispatch.sh" 8>&- >/dev/null 2>&1
  [ "$M" -ge 5 ] && bash "$LOOPS/root-check.sh" 8>&- >/dev/null 2>&1
  # The one-shot helper owns its durable six-hour due time and upload lock.
  # Close the scheduler lease in children so a long upload cannot block recovery.
  python3 /workspace/council-of-ai/scripts/runpod_gspc_upload_heartbeat.py \
    --state-dir "$STATE/runpod-upload" 8>&- >>"$LOGS/runpod-upload.log" 2>&1 &
  due() { [ "$H" = "$1" ] && [ "${M#0}" -ge "${2#0}" ]; }
  if due 03 00 && stamp bazaar-conformance; then nohup bash "$LOOPS/bazaar-conformance.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 03 30 && stamp settlement-dry;      then nohup bash "$LOOPS/settlement-dry.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 04 00 && stamp revenue-snapshot;    then nohup bash "$LOOPS/revenue-snapshot.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 05 00 && stamp hubcard-refresh;     then nohup bash "$LOOPS/hubcard-refresh.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 05 30 && stamp hf-flush;            then (exec 8>&-; python3 "$LOOPS/hf_upload.py" --flush 2>&1 | while read -r l; do log hf-flush "$l"; done) & fi
  # Refresh the public GSPC HF snapshot and default viewer from the same verified live board.
  if [ "${M#0}" -ge 20 ] && stamp gspc-hf hour; then
    (exec 8>&-; if hf_token_present; then
      mkdir -p "$OUT/gspc-spray"
      if python3 "$LOOPS/gspc-spray.py" --hf --out "$OUT/gspc-spray/current" --report "$OUT/gspc-spray/latest.json" >>"$LOGS/gspc-spray.log" 2>&1; then
        if python3 -c 'import json,sys; r=json.load(open(sys.argv[1]))["results"]; sys.exit(0 if {x["surface"] for x in r}=={"hf-dataset","hf-space"} and all(x["status"] in {"PUBLISHED","UNCHANGED"} for x in r) else 1)' "$OUT/gspc-spray/latest.json"; then
          log gspc-spray "SUCCESS exit=0 surfaces=published-or-unchanged with byte readback"
        else log gspc-spray "FAILED process_exit=0 surface_gate=1; inspect latest.json"; fi
      else rc=$?; log gspc-spray "FAILED process_exit=$rc; inspect latest.json and log"; fi
    else log gspc-spray "SKIPPED no HF token"; fi) &
  fi
  if due 06 00 && stamp corrections-watch;   then nohup bash "$LOOPS/corrections-watch.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 07 00 && stamp census-capture;      then nohup bash "$LOOPS/census-capture.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 06 30 && stamp indexnow-ping;       then nohup bash "$LOOPS/indexnow-ping.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 07 30 && stamp swh-archive;         then nohup bash "$LOOPS/swh-archive.sh" --now 8>&- >/dev/null 2>&1 & fi
  if due 08 30 && stamp swh-visit-readback;  then nohup bash "$LOOPS/swh-visit-readback.sh" --now 8>&- >/dev/null 2>&1 & fi
  # 07:00Z the distribution counters: ~830 paced per-package reads that cannot happen inside a
  # Cloudflare request. THE STAMP IS THIS SCHEDULER'S. The script gets --now and must not stamp
  # itself: a second stamp finds the first already written and the run exits 0 having measured nothing.
  if due 07 00 && stamp distribution-measure; then nohup bash "$LOOPS/distribution-measure.sh" --now 8>&- >/dev/null 2>&1 & fi
  # 08:00Z the capability probe: every surface the ONE declaration names, requested against
  # live, and a DRAFT correction per mismatch into the SAME approve-queue drift-draft uses.
  # THE STAMP IS THIS SCHEDULER'S. The script gets --now and must not stamp itself: a second
  # write finds the first already there and the run exits 0 having measured nothing.
  if due 08 00 && stamp capability-probe;    then nohup bash "$LOOPS/capability-probe.sh" --now 8>&- >/dev/null 2>&1 & fi
  # Mondays 09:20Z, claim maintenance on named subjects. THE STAMP IS THIS SCHEDULER'S. The script
  # gets --now and refuses to run without it, and writes no stamp of its own: a second stamp would
  # find the first already written and the run would exit 0 having measured nothing. The day gate is
  # %u=1 and the stamp is daily, so a scheduler down at 09:20 still runs it once that Monday.
  # CLAIM_WATCH_REF names the branch carrying scripts/claims until that lane lands on master; the
  # loop refuses a ref that does not carry it rather than running stale code.
  if [ "$(date -u +%u)" = "1" ] && due 09 20 && stamp claim-watch-measure; then
    CLAIM_WATCH_REF=${CLAIM_WATCH_REF:-origin/master} nohup bash "$LOOPS/claim-watch-measure.sh" --now 8>&- >/dev/null 2>&1 &
  fi
  if due 02 20 && stamp register-402index;   then nohup python3 "$LOOPS/register-402index.py" 8>&- >>"$LOGS/register-402index.log" 2>&1 & fi
  if due 02 40 && stamp settle-all-doors;    then nohup python3 "$LOOPS/settle-all-doors.py" 8>&- >>"$LOGS/settle-all-doors.log" 2>&1 & fi
  # hourly mill slice (registered 2026-09-22 by the coordinator): one model x every axis -> verify -> sign -> land on mill/auto-<hour>
  if [ "${M#0}" -ge 10 ] && stamp mill-hourly hour;      then nohup bash "$LOOPS/mill-hourly.sh" --now 8>&- >/dev/null 2>&1 & fi
  # and forty minutes later land every finished slice into master and queue one deploy
  if [ "${M#0}" -ge 50 ] && stamp mill-hourly-land hour; then nohup bash "$LOOPS/mill-hourly-land.sh" --now 8>&- >/dev/null 2>&1 & fi
  if [ "${M#0}" -ge 35 ] && stamp arena-hourly hour;    then nohup bash "$LOOPS/arena-hourly.sh" --now 8>&- >/dev/null 2>&1 & fi
  # :40 drift? -> corrections AUTO-DRAFT -> owner approve-queue (never auto-publish); the stamp is the scheduler's, the script gets --now
  if [ "${M#0}" -ge 40 ] && stamp drift-draft hour;     then nohup bash "$LOOPS/drift-draft.sh" --now 8>&- >/dev/null 2>&1 & fi
  # :45 the trust chain. An OTS stamp is a promise; the Bitcoin attestation exists only once a calendar
  # commits AND somebody fetches the completed path back, and nothing does that on its own - 547 of 603
  # published proofs read "pending" on 2026-09-22 and every one of them was already committed in Bitcoin.
  # The same run re-derives the corrections ledger signature from the served bytes.
  # THE STAMP IS THIS SCHEDULER'S. The script gets --now and must not stamp itself: a second stamp
  # finds the first already written and
  # the run exits 0 having measured nothing.
  if [ "${M#0}" -ge 45 ] && stamp trust-chain hour;    then nohup bash "$LOOPS/trust-chain.sh" --now 8>&- >/dev/null 2>&1 & fi
  # :15 the second home. This repository is the repository of record -- the site deploys from it and
  # every lane pushes to it -- and until 2026-09-22 `git remote -v` on it was EMPTY. The post-receive
  # hook mirrors after every landing; this hourly pass is the backstop, and it is the thing that goes
  # LOUD when a mirror has quietly stopped moving. THE STAMP IS THIS SCHEDULER'S; the script gets --now.
  if [ "${M#0}" -ge 15 ] && stamp durability-mirror hour;  then nohup bash "$LOOPS/durability-mirror.sh" --now 8>&- >/dev/null 2>&1 & fi
  # Sundays 09:00Z the offsite copy: one ~500 MB full-history bundle to Hugging Face. Weekly and not
  # daily because HF keeps every version; Oracle and the laptop are the copies that track the tip.
  # THE STAMP IS THIS SCHEDULER'S; the script gets --now and must not stamp itself.
  if [ "$(date -u +%u)" = "7" ] && due 09 00 && stamp durability-hf-publish; then nohup bash "$LOOPS/durability-hf-publish.sh" --now 8>&- >/dev/null 2>&1 & fi
  sleep 60 8>&-
done
