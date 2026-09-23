# Pod loops — CSOAI's non-money loops on RunPod

> The balance and runtime observations recorded on 6 Sep 2026 were a historical
> snapshot, not a current readiness signal. Check the current pod, storage and
> billing state before installation; a passing local test proves none of them.

Installation has two commit-bound parts. A reviewed checkout at
`/workspace/council-of-ai` must contain the matching
`scripts/runpod_gspc_upload_heartbeat.py` and
`scripts/runpod_gspc_push_to_hf.py`. The shell files from that same commit go in
`/workspace/lanes/loops/`, along with
`scripts/census/x402-bazaar-conformance.py`. Do not update only the scheduler:
the heartbeat refuses an uploader without the reviewed atomic and explicit-token
interfaces. The scheduler invokes owned shell files through `bash`, so a fresh
0644 copy is supported and no broad executable-bit mutation is required.

Two similarly named source paths already have different duties; do not collapse
or silently substitute them during this maintenance:

- `/workspace/lanes/councilof-ai` is `$REPO` in `pod-loops/lib.sh` and remains
  the source used by older public-data shell loops.
- `/workspace/council-of-ai` is the dedicated intake checkout invoked directly
  by `scheduler.sh` for the heartbeat and atomic uploader.

The installation checklist must inspect and update each required path explicitly.
The new pre-merge selftest proves repository logic, not either live checkout.

The layout follows `/workspace/lanes/README-LANES.md`: durable state and output
stay under `/workspace`; scratch stays on the container disk. Do not touch the
worker's directories or the `sovos-merge-800` network volume.

## What runs when (UTC)

The pod has **no cron**. `loops/supervise.sh` holds one supervisor lease and runs
`loops/scheduler.sh`, a 60-second loop with its own lease. Each scheduled job
carries a once-per-slot stamp or its own durable due time, so restarts do not
silently duplicate work. `start.sh` reports readiness only when the recorded
scheduler child has the expected Linux `/proc` identity and holds the scheduler
lease.

**Where the stamp lives is not decoration.** For the jobs marked *(scheduler
stamps)* below, `scheduler.sh` calls `stamp <job>` and then runs the script with
`--now`; those scripts must never call `stamp()` again. A script that stamps
itself as well finds its own stamp already written, exits 0 having measured
nothing, and leaves a log line that reads like a successful run.

This table is checked, not asserted: `scripts/pod-loops-drift-check.sh` fails if
`scheduler.sh` dispatches a script this table does not name. On 2026-09-23 it
named 9 of the 25 registered jobs.

### Continuous

| when | loop | does | log |
|---|---|---|---|
| every 10 min | `watchdog.sh` | GSPC worker process + `GET :8888/health`, GGUF mill process, ollama :11434/:11500, `/workspace` free, GPU MiB. **Restarts only the worker**, only when no worker process exists AND free ≥ 20 GB AND ollama :11434 is up, and the restart passes `--commission-dispatch-report`: without it the worker serves `GET /commission-dispatch` as UNCHECKABLE with every field null and public `/api/worker` loses dispatcher telemetry (a manual restart did exactly that on 2026-09-15 01:21Z). The mill is logged as ALERT if dead, never restarted. | `logs/watchdog.log` |
| every 10 min | `commission-dispatch.sh` | Reads the public paid-commission feed and adds byte-pinned jobs only for models already installed in the worker's loopback Ollama. Unknown axes and absent models are reported as refused. It never downloads, grades, signs, anchors, publishes or settles. | `logs/commission-dispatch.log`, `out/commission-dispatch-latest.json` |
| hourly from :05 | `root-check.sh` | Collects the root self-check **run on Oracle** (`sov33-owem-micro2`) since 2026-09-22: `as_of`, `card_count`, merkle prefix, pointer `drift.status`; every line carries `via=oracle` or `via=pod-fallback`. **Fail-open by design** — if Oracle is unreachable or its receipt is older than `ROOT_CHECK_MAXAGE` (default 9000 s) the byte-identical pod probe `root-check-local.sh` runs instead. | `logs/root-check.log` |
| every 6 hours | `runpod_gspc_upload_heartbeat.py` | Freezes complete unsigned run triples and attempts an additive atomic copy to the private intake. Uses only the dedicated token file. Records `SUCCESS`, `NO_COMPLETE_RUNS`, `FAILED`, `TIMEOUT`, `FAILED_TO_START` or `UNCONFIRMED_OUTPUT`; this does not admit, sign or publish a run. | `logs/runpod-upload.log`, `state/runpod-upload/` |

### Hourly

| when | loop | does | log |
|---|---|---|---|
| :10 | `mill-hourly.sh` | One mill slice: ONE fleet model × all 14 behavioural axes on the frozen banks → verify → `chain_tools.py stage` → `land_mill_cards.py --require-evidence` → `sign_mill_cards.py` (n≥30 MEASURED, n<30 UNMEASURED "n<30 unquotable") → `card_root.py --stamp` + `--verify` → pushes `mill/auto-<hour>` to the bare repo. **Never merges.** | `logs/mill-hourly.log` |
| :15 | `durability-mirror.sh` *(scheduler stamps)* | Pushes the repository of record to every mirror and reads each mirror's tip **back**. The post-receive hook fires this after every landing; this pass is the backstop that goes loud when a mirror has quietly stopped moving. | `logs/durability-mirror.log` |
| :35 | `arena-hourly.sh` | One arena round between two Ollama models on a frozen bank (deterministic first-label grader) → `public/arena/rounds.jsonl` → `elo_reference.py` over the whole file → per-axis signals, board-signed → branch. | `logs/arena-hourly.log` |
| :40 | `drift-draft.sh` *(scheduler stamps)* | Snapshots the live surfaces (`/api/gspc`, `/api/state` corpora, every `/api/pop/{id}`, each door artifact in-repo **and** as served), diffs against the previous hour and against the typed claim surfaces, and writes a DRAFT correction per mismatch into the owner's approve-queue. **Never publishes.** | `logs/drift-draft.log` |
| :45 | `trust-chain.sh` *(scheduler stamps)* | Upgrades every published `.ots` whose calendar has completed, rebuilds the OTS manifest from the bytes, and re-derives the corrections-ledger signature from the **served** bytes. One RESULT line per run including "nothing changed". On 2026-09-22, 547 of 603 published proofs read pending and 543 were already attested. **Supersedes the retired `ots.sh`** — see `scripts/pod-loops/superseded/`. | `logs/trust-chain.log` |
| :50 | `mill-hourly-land.sh` | Merges every `mill/auto-<hour>` branch whose receipt says `rc=0` into master (`--no-ff`) in the merge clone, pushes to the bare repo, and queues one deploy. Branches with `rc!=0` are left for a human. | `logs/mill-hourly-land.log` |

### Daily

| when | loop | does | log |
|---|---|---|---|
| 02:20 | `register-402index.py` | Keeps every door in `/.well-known/x402.json` listed on the 402 Index (authless register, 10/h). | `logs/register-402index.log` |
| 02:40 | `settle-all-doors.py` | Walks every x402 door in the estate manifest and puts ONE settle through each, from the pod-generated burner payer. | `logs/settle-all-doors.log` |
| 03:00 | `bazaar-conformance.sh` | `x402-bazaar-conformance.py`: enumerates both public Bazaars (CDP, PayAI; keyless), one GET per distinct third-party host → snapshot, summary and diff → uploads to `csoai/x402-bazaar-conformance`. **Fails closed**: a non-zero producer, or an enumeration that is partial or cannot prove both indexes complete, is retained locally and neither uploaded nor promoted to `latest`. | `logs/bazaar-conformance.log` (+ `.run.log`) |
| 03:30 | `settlement-dry.sh` | `x402-settlement-census.py` **DRY** (no `SETTLE`, no `X402_PAYER_KEY` — that key is never on this pod) → `csoai/x402-settlement-census` as config `dry-<date>`. | `logs/settlement-dry.log` |
| 04:00 | `revenue-snapshot.sh` | `GET /api/revenue` → one row per UTC date appended to `out/revenue-history.jsonl` → `csoai/revenue-history`. The site pulls it back with `revenue-history-pull.yml`. | `logs/revenue-snapshot.log` |
| 05:00 | `hubcard-refresh.sh` | `hf-org-card.py --hubcard` on the loop-fed datasets, `--push`. Runs only with a token; otherwise logs `SKIPPED` and why. | `logs/hubcard-refresh.log` |
| 05:30 | `hf_upload.py --flush` | Pushes anything queued in `out/pending-upload.jsonl` once a token exists. Also supports `--folder` (one commit for a whole tree, not one commit per file). | `logs/hf-flush.log` |
| 06:00 | `corrections-watch.sh` | Re-fetches every page in "Corrections that did not travel" and publishes `corrections-watch/<date>.json` + `latest.json` to the HF mirror. No GitHub in the loop. | `logs/corrections-watch.log` |
| 06:30 | `indexnow-ping.sh` | Announces to IndexNow **only** the councilof.ai URLs whose content actually moved; skips with a receipt when the key file is not live. | `logs/indexnow-ping.log` |
| 07:00 | `census-capture.sh` *(scheduler stamps)* | Captures the public authless claim catalogues → canonical records → RFC 9162 root → OTS submit → detached board signature → `csoai/claim-capture-census` + `out/census`. Daily is the honest cadence: the upstreams' own `Cache-Control` is 60–1798 s and none publishes anything a finer tick could see. Runs **after** `corrections-watch` so the two HF pushes do not collide. | `logs/census-capture.log` |
| 07:00 | `distribution-measure.sh` *(scheduler stamps)* | Measures every confirmed PyPI/npm/HF package (~830 paced per-package reads that cannot happen inside a Cloudflare request) → `public/interop/distribution-<date>.json`. | `logs/distribution-measure.log` |
| 07:30 | `swh-archive.sh` | Software Heritage save-requests for the public git origins, 8 per run (the anonymous window allows 10); keeps the SWHIDs. | `logs/swh-archive.log` |
| 08:00 | `capability-probe.sh` *(scheduler stamps)* | Requests every surface `council-os/capabilities.json` declares against live and writes a DRAFT correction per mismatch into the **same** approve-queue `drift-draft` uses. **Never publishes, never merges.** | `logs/capability-probe.log` |

### Weekly

| when | loop | does | log |
|---|---|---|---|
| Sun 09:00 | `durability-hf-publish.sh` *(scheduler stamps)* | Browsable dated source snapshot + full-history bundle to the **public** `csoai/councilof-ai-source`. Weekly, not daily, because HF keeps every version; Oracle and the laptop are the copies that track the tip. HF refuses this repo as a git remote (15 blobs over 10 MiB). | `logs/durability-hf-publish.log` |
| Mon 09:20 | `claim-watch-measure.sh` *(scheduler stamps)* | Claim maintenance on the published registry's named subjects: extends the CL-1 counter series, re-reads and diffs the CL-4/ON-1/ON-2 presence baselines, recomputes CL-3 oracle share and CL-5 feed cadence from keyless public sources. Emits "observed change requiring review" and **never an allegation**; sends nothing to any party named. `CLAIM_WATCH_REF` names the branch carrying `scripts/claims`; the loop refuses a ref that does not carry it rather than running stale code. | `logs/claim-watch-measure.log` |

Every log line is `YYYY-MM-DDTHH:MM:SSZ <loop text>`. Absence of a line for a slot means the loop did
not run — a silent no-op is never reported as success.

## The repo copy is a mirror, and it is checked

`scripts/pod-loops/` is a **description** of `/workspace/lanes/loops/`, never the
other way round. The pod is the running system; a file that differs in the repo
is a second, wrong answer, and installing from the repo copy is how running loops
get switched off without a single log line to show for it.

```
bash scripts/pod-loops-drift-check.sh           # 0 agree · 1 drift · 2 pod unreachable
bash scripts/pod-loops-drift-check.sh --write   # regenerate scripts/pod-loops/INSTALLED.json
```

`INSTALLED.json` is **generated** from the pod and records the sha256 of every
installed file. The check fails when repo bytes, the manifest, or this document
disagree with the pod, and exits 2 `UNCHECKABLE` when it cannot reach the pod —
it never reports a pod it did not read as agreeing. File **mode** is deliberately
not compared: the repo keeps 0644 and the scheduler invokes every owned shell
through `bash`.

A repo file that is *not* installed must declare itself in the manifest's
`repo_only` map with a reason. There is one: `chain_tools.py`, which
`mill-hourly.sh` runs from the repo checkout (`$CLONE/scripts/pod-loops/`) and
which `tests/pod_chain/test_chain_determinism.py` covers.

## Separate credentials for separate duties

Do not infer current credential readiness from the 6 Sep snapshot. Verify it on
the running pod without printing token contents. Existing public loop outputs use
the legacy upload credential:

```
/workspace/lanes/.secrets/hf_token
```

The private GSPC intake heartbeat must not use that account-wide path. It uses
only this owner-placed, owner-owned, regular, non-symlink, owner-only file:

```
/workspace/lanes/.secrets/runpod-intake-hf-token
```

Provision the second file with a fine-grained token limited to read/write the
private dataset `csoai/runpod-gspc-intake`; 0600 is recommended. The scheduled
path never falls back to `HF_TOKEN`, `HUGGINGFACE_TOKEN` or the CLI cache. The
code verifies destination privacy, not the token's scope in account settings.
See `RUNPOD-POD-TO-HF-PUSH.md` for dry-run and byte-comparison acceptance.

## Files

```
/workspace/lanes/loops/     the installed loops. scripts/pod-loops/ MIRRORS this directory
                            byte-for-byte; scripts/pod-loops/INSTALLED.json records the sha256
                            of each installed file and is generated, never hand-edited
/workspace/lanes/logs/      <loop>.log (one line per run) and <loop>.run.log (the wrapped program's stderr)
/workspace/lanes/out/       revenue-history.jsonl, x402-bazaar-conformance/, x402-settlement-census/, pending-upload.jsonl
/workspace/lanes/state/     leases, process ids, *.stamp, root-check.last, runpod-upload receipts
/workspace/lanes/.secrets/  hf_token + dedicated runpod-intake-hf-token (owner-placed; 0700 dir)
/workspace/council-of-ai/   reviewed matching repo checkout containing the two intake Python files
```

## Start / stop / verify

```
bash /workspace/lanes/loops/start.sh # succeeds only with supervisor + verified scheduler child
bash /workspace/lanes/loops/start.sh # repeat is a no-op only when both are healthy
bash /workspace/lanes/loops/stop.sh  # stops the verified supervisor and its scheduler child only
tail -n 2 /workspace/lanes/logs/*.log
bash <loop>.sh --now                 # run one shell loop by hand, bypassing its stamp
python3 /workspace/council-of-ai/scripts/runpod_gspc_upload_heartbeat.py --dry-run
```

## Deploy reviewed control code without restarting the worker

The pod-local reviewed-control command closes the maintenance gap without
turning GitHub Actions or a browser into a pod shell. It accepts no token, key,
host, repository URL or ref. It only recognizes the canonical CSOAI origin and
`refs/heads/master`; it refuses a dirty checkout, a moving remote ref, concurrent
maintenance, a missing dispatcher, a failed dispatcher, or telemetry not bound
to the deployed commit. It never restarts or stops a process and its JSON output
contains counts rather than commission subjects or payer data.

Run the preflight on the active pod first:

```
python3 /workspace/council-of-ai/scripts/runpod_reviewed_control.py --dry-run
```

Only when that returns `DRY_RUN_OK`, apply the exact reviewed revision and run
one commission-dispatch pass:

```
python3 /workspace/council-of-ai/scripts/runpod_reviewed_control.py --apply
```

Success is `APPLIED_AND_DISPATCHED`, an exact `deployed_revision` equal to the
preflight's `reviewed_revision`, `restart_attempted: false`, `secrets_read:
false`, and sanitized dispatch counts. The operator must then verify the public
worker endpoint separately; this command does not claim that deployment of the
website or collection of pod telemetry occurred.

For restart persistence, first verify that `/start.sh` is the image's real current
entrypoint and inspect any `/post_start.sh` behavior. Only then configure the pod
start command to invoke
`bash /workspace/lanes/loops/container-start.sh`. That wrapper starts the
verified supervisor and then execs the existing `/start.sh`; it must not be
installed by guesswork. Without that configured and restart-tested, start the
supervisor manually and describe it as non-durable. The GSPC worker remains the
watchdog's job, not the supervisor's.

Deployment acceptance is: matching reviewed source files; `flock`, Python and
`huggingface_hub` available; no unmanaged scheduler; successful nonempty private
dry-run; one real private upload followed by byte comparison; a zero-write repeat;
and a restart test showing a later due attempt is invoked. No signing key belongs
on this compute pod.

## What the GSPC worker looked like on 6 Sep

It had died at 08:12Z with `OSError: [Errno 28] No space left on device` writing its health file, while
the GGUF mill's `ollama pull`s took `/workspace` from 55 GB free to under its 4 GiB low-water mark. By
08:25Z another lane had relaunched it. The watchdog's 20 GB rule exists so it never relaunches into the
same starvation; when the disk is the reason it says so (`NOT restarted: /workspace free NNG < 20G`).
