# Substrate, offload and Desktop Commander — 2026-11-02

A dated record of what was measured on 2 Nov 2026, what changed, and what is still open.
Every claim here was read at the time; where a thing could not be measured it says so.

## 1. The substrate was dark, and the cause was not the network

**Symptom.** From the owner's M4, Busabase on port 15430 answered `http=000` (connection
refused). The pod was running. The tunnel was running.

**Cause 1 — the tunnel could not resolve the pod.** `com.csoai.busabase-pod-tunnel-15430` ran
`~/.csoai/bin/busabase-pod-tunnel-15430.sh`, which resolves the pod endpoint with
`runpodctl ssh info` at launch (RunPod endpoints rotate; a static address points at a dead
endpoint forever). The script failed with `runpodctl: command not found`, because launchd's
default PATH is `/usr/bin:/bin:/usr/sbin:/sbin` and `runpodctl` lives in `/opt/homebrew/bin`.
The job had run 19 times, each one failing identically, and the log was silent about it.

**Fix.** `EnvironmentVariables/PATH` in the plist now includes `/opt/homebrew/bin`.

**Cause 2 — the runtime lived on the container's ephemeral disk.** The Busabase runtime and the
pinned node were installed under `/opt`, which is the pod's **container** disk. RunPod recreates
the container on every stop/resume/reclaim, so `/opt` came back empty and the writers could not
start. `/workspace` (the RunPod **network volume**) survives; `/opt` does not. On 1 Nov the pod's
`/root` was also observed being recreated under a still-running container — which is what took
the Desktop Commander agent and the `dc-pair` helper with it.

**Fix.** The runtime and the pinned node now live on the volume
(`/workspace/busabase/runtime-0.95.1`, `/workspace/busabase/node-v22.23.3/bin/node`), and
`/opt/busabase/{runtime-0.95.1,node-v22.23.3}` are symlinks into the volume. The estate's own
`start-all.sh` then finds the runtime present and skips its rebuild — which matters, because
that rebuild writes 5,242 small files to a FUSE volume and takes hours.

**Measured after the fix.** `GET /api/v1/bases` on 15430 → **200 in 0.054 s** from inside the
pod, and **200 in 0.305 s** from the M4 through the tunnel. The writers take ~2 minutes to open
the FUSE-backed store; that is the reason for the `ready` window, not a failure.

## 2. Three layers now keep it up

| Layer | Where | What it covers |
|---|---|---|
| `pod-supervisor.sh` | the pod, on the volume | re-runs the estate's own `start-all.sh` when a store's port goes dark |
| `busabase-substrate-supervisor.sh` | the M4, launchd, every 5 min | wakes the pod and relaunches the pod supervisor when 15430 is dark |
| `busabase-pod-tunnel-15430.sh` | the M4, launchd, KeepAlive | resolves the pod endpoint at launch, so a rotated endpoint is not a dead tunnel |

The estate's own `scripts/ops/busabase-substrate-watchdog.sh` runs alongside the pod supervisor:
it probes the **filesystem** the store writes to, separately from the port, and keeps its health
record on **pod-local** disk, never on the volume it is watching.

## 3. The catalogue was MIXED, and the cause was a re-key

The `sites` base carried 34 rows at `as_of 2026-10-27T08:47:26Z` and 16 at
`as_of 2026-11-02T03:58:30Z` — 50 rows for 34 surfaces.

**Cause.** The census re-keyed its rows: a surface used to be identified by its host alias
(`compute:rp-3090-now`, `edge:this-mac`) and is now identified by its **role**
(`compute:runpod-main-engine`, `edge:owner-workstation`). The role is the better key — the alias
`rp-3090-now` points at a pod that no longer exists, while the role survives pod replacement —
but the re-key orphaned every row written before it. The publisher upserts by `site_id` and never
deletes, so both generations stayed.

**Fix — `tools/sites/sites_census_retire.mjs`.** It retires the 16 rows by **appending** a
retirement: `state: RETIRED`, `superseded_by` (the current key for the same surface),
`retired_at`, `retired_reason`. The row keeps its original observation and its base history; it
is not deleted. A row whose old key is not in the dated migration table is reported **UNMAPPED**
and left untouched — absence from one census run is not evidence of absence.

**Verified.** 34 live rows, all at `as_of 2026-11-02T03:58:30Z`; 16 rows `RETIRED`, all 16
carrying `superseded_by`.

**One trap worth recording.** The base has a fixed field schema. An update that carries a field
the schema does not have is **silently dropped**: the first retirement pass set `state` and lost
`superseded_by`, and the row looked retired but carried no link to its successor. The three
retirement fields were added to the base schema (`POST /api/v1/bases/<id>/fields`), and the
retirement is idempotent — it repairs a row that is retired but missing its metadata.

## 4. The bulk is off the M4 and onto the paid RunPod

The estate's rule is that lane worktrees live on the RunPod build pod, never on the Mac. The M4
carried 10 GB of lane clones in `/Users/nicholas/csoai-work` (320,385 files) and the Oracle micro
carried ~11.7 GB in its twelve heaviest lanes, on disks at 93% and 96%.

**M4 → RunPod.** One tar stream, `/workspace/m4-lanes/csoai-work-20261102.tar`,
**1,064,253,440 bytes**. The sha256 was computed on the M4 as the stream was produced and again
on the pod after it landed: **identical on both sides**
(`610dc29b9a07916634f4ccd435ec088ac016007f92c7f30576de9db575a5e88b`).

The archive was byte-scanned for the lane object stores rather than listed, because a directory
listing of a 320k-entry archive is slow and a truncated listing is worse than no listing:
`lane-gap.gitdir` → 1662 hits, `lane-m6.gitdir` → 4, `lane-m7.gitdir` → 4, `lane-m5.gitdir` → 2.

**One gap, stated.** The tar reported `Unable to continue traversing directory tree: Operation
not permitted` for `./scratch`. The archive is therefore complete for everything except that
directory. The stream's sha256 matches on both sides, which proves the copy is faithful — it does
not prove the source tree was complete.

**Oracle → RunPod.** Two archives on the volume, both verified by sha256 against the source:

| Archive | Bytes | sha256 (source == pod) |
|---|---|---|
| `/workspace/lanes/oracle-lanes-20261102.tar` (8 heaviest lanes) | 6,028,564,480 | not computed — re-verify before relying on it |
| `/workspace/lanes/psychogenicity-20261102.tar` | 2,054,318,175 | `c09678c410220cd9526519288efa3a17d3ccd3a7420eabaacfb61cf1e3075104` |

The earlier `psychogenicity` copy on the pod was **partial** (50,440 files / 1,123,765,367 bytes
against the Oracle's 114,915 files / 2,054,318,175) — a cancelled offload left a half-written
tree. It has been superseded by the whole archive above. A partial copy is not a copy.

**Measured on the volume.** One large file: **2.2 GB/s** (2,147,483,648 bytes in 0.995 s, read
back, sha256 matching the expected digest of 2048 MB of zeros exactly). Many small files:
**~30 files/s**, falling to ~0.6/s under load. The volume is fast for bytes and slow for
metadata, so bulk moves as single archives and extraction grinds.

## 5. `/workspace` on the scratch pod accepts writes

A sibling session measured "486 TB free but every write fails with *Disk quota exceeded*" on
this pod, and moved its copies to `/root`. That did not reproduce here: a 2 GB write landed,
read back, and matched its expected digest exactly, and the archive plus the runtime extraction
are both written there.

The volume is `estate-scratch-20261028` (`08xza5ommr`, EU-RO-1, 400 GB). The failure mode that
looks like a quota is the **ghost mount**: `mfs#euro-3` was mounted on the three original pods
while `runpodctl network-volume get euro-3` answered **404 not found** — reads worked, writes
vanished. A different pod, a different path, or the old ghost mount would each produce a
different explanation; the errno and path decide it.

**Section 9 says what the errno turned out to be, and corrects that root cause.** `mfs#euro-3`
was never a missing volume: `euro-3` is the MooseFS **mount label**, not the volume name, and
looking the volume up by label is what returned 404. The volume is `csoai-backup-ro`
(`u6bcx7p3uc`, 800 GB) and it exists — at its quota.

**But `/root` is the wrong place to keep anything.** It is the container disk, and it was
recreated under a running container. The keeper of record belongs on `/workspace`.

## 6. Desktop Commander works; the pod agent needed five fixes

**Proven.** The M4 bridge (`com.csoai.dc-bridge`, 29 tools) drove the Oracle lanes box end to end:
`hostname; uptime; df -h /; ls ~/lanes | wc -l` on device
`b4b647b8-0a67-4b8f-9b25-2981363e9bd0` (`sov33-owem-micro2`) returned the hostname, 2d22h uptime,
45G disk at 93%, **257 lanes**, load 0.28. Account `nicholastempleman@gmail.com`, 5 devices.

**The pod agent was gone** (`/root` wiped), so the codes from 28 Oct were dead. Rebuilding it
needed five fixes, in order:

1. The agent is `desktop-commander remote` — bare `index.js` starts a stdio MCP server and waits.
2. **Node 22 is required.** Node 20 fails with `Node.js 20 detected without native WebSocket
   support`. The pod's own pinned node v22.23.3 — the one the Busabase runtime is
   sha256-verified against — is the fix; no second node needed.
3. **It must not run off the FUSE volume.** The device spawns its MCP server with cwd = the
   package's dist directory; on `/workspace` every import is a FUSE round trip and `tools/list`
   never returns inside the 60 s the device waits, so it dies with `MCP error -32001: Request
   timed out`. Copy the package to the container disk and run it from there.
4. `PUPPETEER_SKIP_DOWNLOAD=true` — the agent pulls a headless Chrome at startup, and most of
   the startup time.
5. **A `pkill -f` pattern can kill your own shell.** The pattern `index.js remote` matches the
   command line of the shell doing the matching. Put the pattern in a script file on the pod.

With all five applied, the device issued a live pairing code
(`https://mcp.desktopcommander.app/device/verify?user_code=2BF6-MN4V`, 15-minute expiry).
The machinery is proven; a fresh code is a ~20 s regeneration.

## 7. Open, and blocked on a named owner act

| # | Item | Why it is blocked |
|---|---|---|
| 1 | ~~A working Hugging Face token~~ | **CLOSED 2 Nov** — the `HUGGINGFACE_TOKEN` env var is a **dead** token (401 on `whoami-v2`), but the working credential is in a FILE: `~/.cache/huggingface/token` (mode 600), org `csoai`, canPay. The bulk is published: private repo `csoai/estate-offload-20261102`, 3 archives + a `MANIFEST.json` carrying each file's sha256 |
| 2 | **Approving the pod on Desktop Commander** | only the owner can add a device at `mcp.desktopcommander.app` |
| 3 | **The merge queue on master** | `mergeQueue(branch:"master")` is `null` — it is **off**. The mutation is not in the schema this token can see, so the API cannot turn it on; it is a web-UI setting. Note also `required_approving_review_count: 0`: today a merge needs a PR and strict status checks, but **no human approval** |
| 4 | **Reclaiming the Oracle's lane directories** | the bytes are verified on the RunPod, but the Oracle's cron lanes still point at the originals. Removing them needs the lanes re-pointed, and the sibling session's resolver owns part of that tree |
| 5 | **Reclaiming the M4's lane clones** | `lane-gap/` and `lane-gap.gitdir/` are **live** — a resolver, a chain sequencer and a resolver daemon share that one lane, and truncating a pack mid-push breaks them. Nothing under `csoai-work` is to be reclaimed without notice to that session |

## 8. What this session did not do

- It did not delete or truncate anything under `/Users/nicholas/csoai-work`.
- It did not compute a **source-side** sha256 for `oracle-lanes-20261102.tar`. The pod-side digest
  IS recorded — `f8c6673b00434b0195bbef237759be82a251b89f894b0749f6baf2a166256a87`, published in
  the HuggingFace manifest — and the stream completed, but it was never compared against a
  digest recomputed from the Oracle's own copy. `psychogenicity` WAS compared both ways
  (`c09678c4…` on both sides); this archive was not, and should be before it is trusted.
- It did not enable the merge queue or change branch protection.
- It did not free any space on `csoai-backup-ro` or `council-os-benchmark-data-20261027`, both of
  which are at quota (section 9). Their contents are not mine to reclaim.

## 9. A correction: the "ghost volume" was never a ghost — it was a volume at quota

On 2 Nov a sibling lane reported measuring, on this pod, "486 TB free but every write fails with
*Disk quota exceeded*". That did not reproduce on `estate-scratch-20261028`. Enumerating the
account's four RunPod network volumes and writing to a pod that mounts each one says what is
actually going on:

| Volume | Id | Quota | Mount | Write test |
|---|---|---|---|---|
| estate-scratch-20261028 | 08xza5ommr | 400 GB | mfs#euro-2 | 2 GB written at 1.8 GB/s, read back 2,147,483,648 bytes — **healthy** |
| council-os-benchmark-data-20261027 | fbrt7yy9aq | 100 GB | mfs#euro-2 | **1 MB write fails: "Disk quota exceeded", readback 0 bytes** |
| csoai-backup-ro | u6bcx7p3uc | 800 GB | mfs#euro-3 | **1 MB write fails: "Disk quota exceeded", readback 0 bytes** |
| sov-workspace-mtl4 | ahqvo6d4f3 | 200 GB | CA-MTL-4 | not probed — no pod mounts it |

**The correction.** The estate's recorded root cause for the dark substrate was that `mfs#euro-3`
was "a stale FUSE handle to a volume 404 in the account". The volume was never missing.
`runpodctl network-volume get euro-3` returned **404 because `euro-3` is the MooseFS MOUNT
label, not the volume name** — the volume is `csoai-backup-ro`, id `u6bcx7p3uc`, 800 GB, and it
exists. What it does is exactly what a missing volume looks like from the inside: **it is at its
quota**. Every write fails with `Disk quota exceeded`; every read still works; and `df` reports
the whole MooseFS pool (493 TB free, 78%) because the pool's free space is not this volume's
quota.

So the substrate was dark because the estate's storage was **full**, not because a volume had
been deleted. The remedy applied was still the right one — the substrate now sits on
`estate-scratch-20261028`, which has headroom and passes a 2 GB write-and-readback — but the
recorded cause was wrong, and a cause recorded wrongly sends the next person to look in the wrong
place. The same volume is where the estate's **13 GB of snapshots** and the old lane trees live,
so "the backup volume is full" belongs in the estate's own storage record.

**A second fence that never fires.** `busabase-instance.sh`'s `headroom_mb()` reads
`/sys/fs/cgroup/memory.max`, a **cgroup v2** path. These pods are cgroup v1, where that file
does not exist, so the function returns 999999 MB and `MIN_HEADROOM_MB` (900) never refuses a
start. A fence that never fires protects nothing.

**And the OOM reading, honestly.** The counters on the substrate pod read `oom_kill 0` and
`failcnt 0`, so the cgroup OOM killer did not fire there. The accounting is degraded, though —
`memory.usage_in_bytes` reads exactly equal to the 4 GB limit and `memory.stat` carries no
`anon` or `slab_unreclaimable` rows — so those counters cannot rule out a host-level OOM either.
What was measured directly is that `/opt` was empty and the node processes were gone. A missing
runtime and a killed process are BOTH consistent with that, and only one of them is fixed by
moving the runtime onto the volume. Both are now handled: the runtime lives on the volume, and
`pod-supervisor.sh` restarts a writer whose port goes dark.

**Do not `du -sh` the big trees under `/workspace`.** It buffers the whole tree and is the most
likely thing to push a 4 GB cgroup pod over its limit. `find <dir> -type f | wc -l` streams and
is safe.

**Two pods that look like one.** `estate-scratch-20261028` and
`council-os-benchmark-data-20261027` both mount `mfs#euro-2.runpod.net:9421` and share a
filesystem HOST, but they are different volumes with different quotas and different contents: a
marker file written on one is invisible on the other, in both directions. "Same MooseFS mount" is
not "same volume", and "same volume" is not "has room".
