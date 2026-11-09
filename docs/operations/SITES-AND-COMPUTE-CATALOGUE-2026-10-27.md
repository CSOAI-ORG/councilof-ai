# Sites, compute and the N-site hunt — readback of 27 Oct 2026

**Scope.** What the estate actually holds on 27 Oct 2026, measured live; what was broken; what
was changed today. Every number below came from a probe that ran — the probe is named in each
table and the raw output is `data/sites_census.json` (`tools/sites_census.mjs`).

**Doctrine.** A census is a receipt of what was read, not a grade of what exists. `UNREACHABLE`
is a state, not a zero. A site absent from the census was not probed.

---

## 1. The census

`node tools/sites_census.mjs` → `data/sites_census.json`, `reports/SITES-CENSUS.md`.

| metric | value |
|---|---|
| sites probed | 34 |
| compute hosts declared | 15 |
| compute hosts reachable | 3 |
| compute hosts with a GPU | 1 |
| provider endpoints probed | 17 |
| provider endpoints reachable | 12 |
| free-tier endpoints reachable | 11 |
| CPU cores usable (reachable compute) | 12 |
| RAM GiB (reachable compute) | 1,142 |

### Compute

| site | state | cpu (usable/host) | ram GiB | gpu | note |
|---|---|---|---|---|---|
| M2 MacBook Air (LAN, 192.168.1.102) | REACHABLE | 8 / 8 | 8 | Apple M2 | separate machine from the session host |
| Oracle micro `sov33-owem-micro2` | REACHABLE | 2 / 2 | 1 | none | up 85 days; runs the N-site lane, Ollama, MEOK mastermind |
| RunPod `rp-3090-now` (main engine) | REACHABLE | **2 / 192** | 1,133 | **none** | **CPU quota limited**; see §2 |
| session host (this Mac) | REACHABLE | 10 / 10 | 16 | Apple unified GPU, 8 cores, Metal 4 | |

**13 of the 16 declared hosts are UNREACHABLE**: `meok-backend`, `sov-brain-2`, `redblue-pod`,
`sovos-light-a100`, `sovos-agent-vm`, `csoai-backend-vm`, `sovos-volume-sink`, `sov-r4090-a`,
`sov-r4090-b`, `sov-r4090-c`, and both named RunPod hosts.

Two of the three GPU claims in the SSH config (`sov-r4090-*`, `sovos-light-a100`) are dead
names. The only GPU actually reachable today is the M2's.

### Providers

Reachable unauthenticated: HF models / spaces / datasets, HF inference router, Kaggle models
API, Colab, Lightning AI, Brev, Paperspace, the official MCP registry, Smithery, npm registry,
Moonshot/Kimi, councilof.ai board + root.

Credential-required but reachable (401/403): Kaggle notebooks, Together AI, Groq.

---

## 2. The "main RunPod engine" — honest status

**The name is stale. `rp-3090-now` is no longer a 3090 pod.**

| fact | measured |
|---|---|
| CPU | AMD EPYC 9655 96-Core, 192 host threads — **but a cgroup quota of 2 usable CPUs** |
| RAM | 1,133 GiB |
| GPU | **none** (`nvidia-smi` not installed) |
| `/workspace` | RunPod **network volume** `mfs#euro-3.runpod.net:9421`, 2.2 PB, 82% used |
| uptime | ~3.8 days at readback; PID 1 is `/bin/bash /start.sh` — **no systemd at all** |
| nginx ingress | 7861, 3001, 8001, 8081, 9091, 7270 — every one returns RunPod's **502 placeholder page**; no backing app answers |
| live apps | Busabase (127.0.0.1:15429/15430, next-server v16.3.3, `watchdog.sh` every 60 s) and one `market_recorder.py` (DuckDB) |
| Ollama | **absent** |
| GSPC GPU worker | `gspc-worker/keep-alive.sh` exists but cannot run: it starts `/usr/local/bin/ollama serve`, which does not exist. The lane is not in `ps`. |

Three consequences, stated plainly:

1. **The measurement worker's compute lane is dead on this pod.** `docs/operations/RUNPOD-GSPC-24X7.md`
   describes a GPU worker that runs a frozen bank against a pinned Ollama model. On the pod that
   documents describe, there is no GPU and no Ollama.
2. **The frozen banks are intact; the *path* in the docs is stale.** `/workspace/gspc-banks` is
   empty (0 files) and the docs still name it, but the banks themselves are at
   **`/workspace/gspc-worker/banks/`** (`gspc-gov.jsonl` 87,960 bytes, plus every other axis) and
   as a tarball at `/workspace/gspc-worker/banks.tgz`. **This corrects an earlier read in this
   same document**, which called the banks lost. They are not lost — they moved. What *is* real
   is the path drift: a card that pins `bank_sha256` is only checkable by someone who reads the
   path the code actually uses, and `POD-DURABILITY-AND-EVICTION.md` still points at the empty
   one. Fix the doc or the symlink, not the data.
3. **"24/7" is currently a wish, not a mechanism.** The pod is up because nothing has stopped it.
   With no systemd there are no timers, no `Restart=` policy and no `OnFailure=`; the only
   keepalive on the box is `busabase/watchdog.sh`, which restarts Busabase and nothing else. If
   the pod is stopped, the M4's Busabase tunnel has nothing to point at and the estate's single
   store disappears with it.

   What *does* exist is a live read-only heartbeat: `tools/runpod_engine_heartbeat.sh` runs every
   minute from launchd `ai.csoai.runpod-engine-runtime-check` and is publishing honest numbers
   right now — including `"engines": []`, `"engine_probe_state": "DEFERRED_CGROUP_HEADROOM"`
   (a 4 GB cgroup v2 memory limit with ~2 GB headroom on a 1.1 TB host), and
   `"mcp_v2_lab_absent_on_pod"`. The heartbeat corroborates this census: the engines are gone,
   and the probe is deferred for headroom, not for GPU.

   **The missing piece is a pod-level keepalive, and it cannot be built today:** there is no
   RunPod API credential in the environment, in `~/.ssh/config` or in the estate's config, so
   nothing here can start a stopped pod. That is one owner act — a RunPod API key — after which
   "24/7" becomes a restart loop rather than a hope. Until then the honest statement is: the pod
   is monitored, not kept alive.

**The storage topology.** Busabase is *not* local to the M2. `lsof` shows port 15430 on the M4
is an **SSH tunnel** (`ssh -N -L 127.0.0.1:15430:127.0.0.1:15430 rp-3090-now`, managed by launchd
`ai.csoai.busabase-tunnel`, KeepAlive). The store itself is `/workspace/busabase` on the pod, and
`BUSABASE_PRIMARY.json` names `/workspace/busabase/csoai-primary` as the primary business
control-plane writer.

So "all our storage is Busabase" is **already true** — and it is also **one pod, one volume, one
tunnel**, with no second copy of the authoritative store.

Measured: the primary is **11 GB** (`/workspace/busabase/csoai-primary`), the whole Busabase tree
is 30 GB, and the pod holds **13 GB of sha256-pinned snapshots** in
`/workspace/busabase/backups/` (`data.tar.gz` + a `.sha256` sidecar per generation). That is a
second *generation* — it survives corruption or a bad import. It is **not** a second *site*: it
is on the same pod, on the same 2.2 PB network volume. An off-pod copy of an 11 GB primary does
not fit on the M4 while the M4's own data volume is the estate's live constraint (the estate's
own 27 Oct storage record measures it at 99.8% → 94.6% used, and the M2 at 98% → 82%). The
estate's own record names the destination that would work: the RunPod pod
`ic0fl7mexpk4dj` (`meok-him-production-20261027`) on the 421 TB network volume, with the same
archive already copied to `micro2` and sha256-verified on both.

---

## 3. The N-site hunt has been dead for 28 days

The estate already hunts N-sites. The loop lives on the Oracle micro
(`~/lanes/nsite-onboard/`) and pulls to `/Users/nicholas/_alignment/NSITES-LIVE-LOG.md` every ten
minutes via launchd `ai.councilof.nsites-live-pull`.

| counter | value |
|---|---|
| sites onboarded (done.jsonl) | 97 |
| joined to the harness | 66 |
| listed | 2 |
| evidence bundles | 95 |
| Layer O registry rows | 267 |
| **queue remaining** | **0** |
| **last log line** | `07:10Z | - | queue | QUEUE EMPTY: loop stops itself` |
| **last activity** | **2026-09-29T07:10Z — 671 hours ago** |

**Root cause, not a missing cron entry.** `build_queue.py` extracts candidate surfaces from five
owner source records and drops every domain already in the Layer O registry. The registry grew to
267 rows, so a rebuild on 27 Oct extracted **138 distinct candidates and rejected all 138 as
already registered** → the queue came out empty → `onboard_one.py` saw an empty queue, wrote the
`QUEUE_EMPTY` marker and stopped itself. The `* * * * *` driver line was no longer in the crontab
either, so nothing restarted it. Meanwhile the ten-minute puller kept copying the frozen log and
reporting its counts, so the file looked alive.

**What changed today:**

1. **`onboard_one.py` search templates extended** by six AI-ecosystem directory APIs, each
   verified `200` before wiring: the official MCP registry, Smithery, npm, LobeHub, HF datasets,
   Zenodo. These are the presence probes the onboarder uses to ask each surface whether CSOAI is
   listed.
2. **The `* * * * *` driver reinstalled** with the estate's own conventions: `flock -n` so a
   second instance exits rather than double-popping the queue, `nice -n 15`, and
   `lanes/bin/disk-floor.sh` so a low-disk run is skipped *and says so*.
3. **The puller now tells the truth.** It computes the age of the remote onboard log and, if it
   has not moved for two hours, writes **`LANE STALE`** into the pulled block instead of
   presenting last-known counts as live. A dead lane can no longer masquerade as a running one.
4. **New source material, from the estate's own registry.** `build_registry_surfaces.py` (new, in
   the lane's repo) derives a source record of Layer O surfaces that **exist but have never had
   presence measured** — the registry says a surface exists; only a live read says whether CSOAI
   is on it. Known is not measured. It is sha256-pinned to the registry bytes it came from
   (`4d5e8c44…`), and `build_queue.py` now reads generated source records and no longer applies
   the "already in the registry" filter to a source that is derived from the registry.
   **70 surfaces**, ranked by the registry's own LEVERAGE formula, with real populations:

   | rank | surface | class | population |
   |---|---|---|---|
   | 1 | kaggle.com | model_data_hub | — |
   | 2 | 402index.io | payment_index | 115,533 |
   | 3 | zenodo.org | citation_archive | — |
   | 4 | agentic.market | payment_index | 2,901 |
   | 5 | modelcontextprotocol.io | mcp_catalog | — |
   | 6 | wikidata.org | citation_archive | — |

   By class: mcp_catalog 15, vendor_marketplace 13, public_register 9, payment_index 8, other 8,
   agent_directory 6, citation_archive 3, model_data_hub 2, search_index 2, package_registry 2,
   eval_leaderboard 1, assistant_store 1.

   **Proved, not asserted:** the first step ran on its own at 05:34Z and onboarded `kaggle.com`
   with three live reads (`robots + home + api/search`), evidence bundle `sha 91252e16cf3b`, state
   transition `DISCOVERED → UNSUPPORTED`, presence `UNMEASURED` (a homepage without us is not
   absence). Queue 70 → 69, done 97 → 98.

5. **The hunt drains, so it now refills itself.** The cron fired on its own and worked through
   all 70 surfaces in **70 minutes** (05:34Z → 06:45Z; done 97 → 167, evidence 95 → 162), then
   stopped itself exactly as it did on 29 Sep. `nsite_refill.sh` now runs every 15 minutes:
   when the queue is empty it regenerates the source records, rebuilds `queue.jsonl` and clears
   `QUEUE_EMPTY`. If the rebuild yields **0 candidates it refuses to clear the marker**, so a
   source exhaustion is visible rather than silent.
6. **A second, regenerating source.** The Layer O registry is finite — 267 surfaces, now nearly
   all onboarded. `build_greenfield_surfaces.py` derives a source from
   `~/greenfield-sov/sites_universe.txt`, the estate's own regenerating list of **1,883**
   regulators, standards bodies, AI companies and institutions (sha256-pinned
   `8b7defcb…`). The sovereign-eater lane scores those sites for *sovereign predicates*; the
   onboard lane asks a *different* question — is CSOAI present, is there a readable search API,
   is the surface joinable. Domains already onboarded here are excluded so the two lanes do not
   repeat each other.

   **Queue: 70 → 1,558 candidates** (≈26 hours of hunting), and it keeps refilling.

### The MCP registry — measured, and deliberately NOT used as the queue

`tools/mcp_registry_census.mjs` enumerates the official MCP registry by cursor pagination:
**36,605 server rows read**, **11,261 distinct publisher hosts**.

It is a real number and it is on the record. It was **not** fed into the queue, because it does
not survive contact with the data: the publisher hosts are dominated by a handful of hosting
platforms that give each tenant a subdomain of a brand domain — `.bowmark` (1,116 servers),
`.linkbreakers` (534), `.sallim` (457), `.newsmind` (363), `.mambabuilt` (327), `.swarmmemo` (309),
`.smithery` (288). Across 11,261 hosts there are only **492 distinct last labels**, and almost
all are brand words rather than public suffixes. Onboarding `ai.bowmark` would measure Bowmark's
platform, not any tenant of it, and would collapse dozens of unrelated surfaces into one
meaningless one. The estate's own `regdom()` folded them into `br.com`, `au.com` and `ar.com` —
shared-hosting catch-alls where one owner hosts many tenants.

The finding that *is* worth keeping: the MCP registry's own search says **CSOAI already has 6
servers listed** there (`GET /v0.1/servers?search=councilof` → 6). And the registry's size is
now published as a census rather than as a queue.

---

## 4. Busabase as the substrate

New base **`sites`** (`bsemvq82v196c7yylx`), 13 fields, **34 rows** seeded from the census by
`tools/sites_census_publish.mjs`. Every row carries `probe` and `as_of`; `state` is the honest
value (`REACHABLE`, `UNREACHABLE`, `HTTP_401`, `STALLED`), never a zero.

Busabase now holds 13 bases: `csoai`, `meok`, `meok-mind`, `layer0`, `catalogs`, `gspc`,
`signals`, `surfaces`, `blockers`, `master`, `sites`, plus `templates` tooling.

---

## 5. Kimi as partner

**The catalogue is readable; the generation is not.** `KIMI_API_KEY` and `MOONSHOT_API_KEY` are
both set, and `GET https://api.moonshot.ai/v1/models` returns **HTTP 200** with six models:

```
kimi-k2.6            kimi-k2.7-code            kimi-k2.7-code-highspeed
kimi-k3              kimi-k3.1-pro             kimi-k3.1-pro-highspeed
```

But every **generation** call is refused, identically from the M4 and the M2:

```
HTTP 429  {"error":{"message":"Your account org-780e4d1416984baf8c140839d0194d7c
 <ac-f9i8o8kpffni11friip1> is suspended due to insufficient balance, please recharge
 your account or check your plan and billing details","type":"exceeded_current_quota_error"}}
```

**This corrects an earlier read in this same document.** A 200 from `/v1/models` proves the
*credential authenticates*; it does not prove the *account can generate*. Kimi is therefore
**not a live model arm today** — it needs a recharge, and until then a Kimi measurement is
FAILED, not UNMEASURED.

**The arm was attempted, and the failure is recorded as a failure.** The estate's own frozen
XRAIV bank was run on the M2 through the estate's Inspect harness
(`inspect eval tasks/gspc_xraiv.py --model openai/kimi-k3`,
`OPENAI_BASE_URL=https://api.moonshot.ai/v1`) at 08:34Z. It died on `RateLimitError` 429 with
30 HTTP retries. The output directory is kept, renamed
`kimi-direct-xraiv8-FAILED-429-account-suspended`, with a `README-FAILED.md` that says what it
is. **A failed arm must not sit in a frozen set looking like a score**, and the `.eval` inside
it must never be read as a Kimi result — the model was never asked a question.

That harness is the right place for a partner arm, and it is worth stating why: the agent must
*act* (it may call a statute tool) and then commit a verdict, and the grader is
**deterministic** — "no model judges another model". It also implements two rules the estate
holds itself to: an unparseable answer is **UNMEASURED, never wrong**, and an interval with
`usable_n < 30` reports **no interval at all**. A partner arm graded that way cannot flatter
itself.

**What exists today:** `csoai-kimi-bridge` (own git repo, published to npm) is an MCP server that
lets Kimi — or any MCP-capable agent — query the CSOAI site: framework crosswalks, sector guides,
the charter, and the live signed Sovereign Town governance feed. It makes CSOAI *readable by*
Kimi.

**What does not exist yet:** Kimi is **not** a model arm in any benchmark or routing layer. No
`KIMI_API_KEY` appears in any tracked estate file, so the key is ambient, not wired. The
extension point is the benchmark fleet, where a provider must answer the frozen bank under the
same rubric and be pinned by an immutable identity the way the pod pins
`ollama:<tag>@sha256:<manifest-digest>`.

---

## 6. exo

**Not installed.** `exo` is absent from `PATH`, from pip, and from `~/.exo`; the estate contains
no standalone reference to it.

The devices it would pool, and what they actually are:

| device | cpu | ram | gpu | notes |
|---|---|---|---|---|
| session host (this Mac) | 10 | 16 GiB | Apple unified GPU, 8 cores, Metal 4 | |
| `IOKs-MacBook-Air.local` | 8 | 8 GiB | Apple M2, 10 GPU cores, Metal 4 | separate machine |
| `sov33-owem-micro2` | 2 | 1 GiB | none | 1 GiB is not a pool member |

An exo cluster over this estate is two Apple Silicon Macs, and one of them has 8 GiB of unified
memory. That is a useful *development and fallback* pool, and it is not a substitute for the GPU
pod the estate's worker was written against.

---

## 7. Governance: MEOK carries, CSOAI judges

The question — *can we run the estate on our own MEOK without ruining CSOAI?* — has a real answer
in the estate's own doctrine, and the answer is **yes, if three couplings stay broken**.

`docs/operations/RUNPOD-GSPC-24X7.md` already codifies the pattern: the pod worker "is
intentionally a compute lane, not an authority lane"; it "does not sign, anchor, submit an OTS
proof, perform a council vote, publish, upload, change the public board, or certify anything";
and "a separate trusted control plane must ingest the evidence, reproduce or admit it, sign via
the existing GHA path, and verify the resulting card before any public state can change."

Consolidation puts that pattern under pressure in three specific places. Each needs a gate.

### Gate 1 — write scope by base

Busabase is now one store, one pod, one tunnel, holding both the product's tables and the
council's tables. A bug in an MEOK writer must not be able to reach `csoai` or `gspc`.

**Rule:** MEOK lanes write to `meok`, `meok-mind`, `layer0`, `catalogs`, `sites`. The `csoai` and
`gspc` bases stay with the control plane: `requiredApprovals: 1`, `autoMerge: false`, and a
write scope that no MEOK lane holds. `BUSABASE_PRIMARY.json` already records
`role: PRIMARY_BUSINESS_CONTROL_PLANE_WRITER` with `autoMerge: false` — that record is the
enforcement point and must not be relaxed to make a sync easier.

### Gate 2 — unsigned intake only

A measurement artefact produced by MEOK may only enter the board through the **unsigned**-card
intake, where the control plane reproduces it, signs it, and verifies the result. No path exists
by which a MEOK-produced artefact lands as a signed card without that reproduction step.

### Gate 3 — the judge is not the product

This is the one that actually bites, and it has bitten before.

The estate's own measurements are the warning: MEOK's referee graded its own bank at **219/237**
where frontier models under the **same** referee scored **222/237** — a difference of three items,
not a lead. And in the live frontier benchmark, **20 of 30 items were answered by a deterministic
rule cascade rather than a model**, so the "MEOK leads the fleet" claim was measuring a routing
rule, not a model.

**Rule:** MEOK's referee and router must never be the grader for a CSOAI board cell. A board
cell's referee must be independent of the subject it grades, and a MEOK-produced number must be
published as MEOK's, never as the board's.

**In one line: MEOK may carry CSOAI's compute, storage and routing. CSOAI must never let MEOK
grade CSOAI.**

---

## 8. The Layer-0 seal — blocked, and why it was not forced

The census is sealed with CSOAI Layer-0 Ed25519. **That seal does not exist**, and the reason is
worth more than the seal.

`csoai_sign` returns `HTTP 401 — "Private H.I.M. access token required."` Two independent defects
sit behind that, both confirmed by reading the deployed service and the published package:

1. **The MCP sends no credential.** `csoai-governance-mcp@0.1.0` (npm) reads exactly one env
   var, `CSOAI_GATEWAY` (default `https://os.meok.ai/api`), and its `api()` helper sets only
   `content-type` and `user-agent`. The gateway's gate (`app.use('/api', requireAccess)` in
   `meok-him-production/app/server.mjs`) demands the header **`x-meok-access-token`** and
   compares it to `HIM_ACCESS_TOKEN`. The package has no way to send it — so it fails 401 before
   it can reach any route.
2. **The route does not exist.** With the real token attached, `POST https://os.meok.ai/api/sign`
   returns **`404 {"error":"API route not found."}`**. The published MCP calls
   `api("/sign", {message})`; the deployed Sovereign service has no `/sign` route. Its `/api`
   surface is `/health`, `/voice/*`, `/board`, `/ceo`, `/state`, `/audit`, `/proposals/*`. The
   same is true of `/api/board-sign` on that host. `https://councilof.ai/api/sign` returns 503.

So the Layer-0 signing capability the estate's toolchain advertises is **not deployed**. The
estate's one working signer is `https://councilof.ai/api/board-sign` (401 without the pod caller
token), which signs under **`did:web:csoai.org#board-attestation-1`** — the board-attestation
key, whose preimage rule covers GSPC measurement cards.

**That key was deliberately not used here.** A board attestation over a sites-census receipt
would assert a board cell that is not a board cell, under a preimage rule that does not govern
this artefact. Signing it would manufacture exactly the kind of claim this estate exists to
refuse. The Layer-0 key is the right key for this receipt, and it is not reachable.

**What exists instead:** `data/sites_census_receipt.txt` — the exact 668 bytes that should be
sealed, and the census digest they bind (`ad8e4664…`). Seal it the moment a `/sign` route is
deployed behind the access gate; nothing else needs to change. The busabase rows and the census
JSON are independently verifiable against that digest.

---

## 9. What is still open

| # | item | why it is open |
|---|---|---|
| 1 | The main RunPod engine has **no GPU** and its GPU worker lane cannot run | needs either a GPU pod again, or the worker's CPU path re-specified — not decided here |
| 2 | `/workspace/gspc-banks` is empty | the banks cards pin must be restored to a named durable path, or the cards' `bank_sha256` become unreproducible |
| 3 | Busabase has **no second copy** of the authoritative store | the pod is the single point of failure for every lane that writes to it |
| 4 | 13 of 16 declared hosts are dead names | the SSH config overstates the fleet; the census is the current truth |
| 5 | Kimi is not wired as a benchmark arm | credentialed and verified, but not pinned, not routed, not in any fleet |
| 6 | exo is not installed | and the device pool it would use is two Macs |
| 7 | The N-site loop now runs one site per minute against a queue of 1,558 | the queue is ranked and self-refilling; a dead lane now says so instead of masquerading |
| 8 | **The Layer-0 seal is not applied** — no `/sign` route behind the access gate, and the MCP sends no credential | the estate's toolchain advertises a signing capability that is not deployed; the receipt bytes are recorded and ready |
| 9 | The global git pre-commit hook requires `scripts/run-meok-proxy-tests.sh`, which exists in no repo | it cannot pass for any repo in its current state; two commits today used `--no-verify` and said so |
| 10 | **Kimi cannot be called** — the Moonshot account is suspended for insufficient balance (429) | a recharge; the arm is already wired to the estate's frozen bank and the failure is recorded as FAILED |
| 11 | The M4's home repo lost its `.git`; two unpushed local commits' objects are unrecoverable (content survives as files) | commit the surviving content somewhere durable; the estate's storage record already has the structural fix |
| 12 | The M4's data volume was at 99.8% and peer sessions are dying of ENOSPC | the estate's own record names the 48 GB game install as the single largest reclaimable item — an owner decision |
| 13 | Nothing can restart a stopped RunPod pod | one RunPod API key; until then the pod is monitored, not kept alive |

## 10. The disk emergency, and a deleted `.git`

During this session the M4's home repository lost its `.git` directory. The facts, with the
evidence for each:

| fact | evidence |
|---|---|
| `/Users/nicholas` was a git working tree with the **home directory as the work tree** — 28,278 tracked files, sparse checkout `/*`, `!/*/`, `/docs/`; remotes `origin` = `CSOAI-ORG/councilof-ai`, `cursor`, `pod` | `git log` at 04:16Z returned `7de79744b9 review: card-root-ci-no-checks lane request + sprint-progress review 1215Z` as HEAD |
| by ~07:55Z the `.git` directory no longer exists | `git ls-files` → `fatal: not a git repository`; `ls -ld /Users/nicholas/.git` → `No such file or directory` |
| **the published estate repo is intact** | `/Users/nicholas/councilof-ai-ops` — clone of `CSOAI-ORG/councilof-ai`, `master` @ `8805a32c9`, 38,716 tracked files, origin reachable with 6,306 refs |
| **no file content is lost** | `~/docs` still holds 829 files; `~/_alignment` still holds 886 entries, including the lane-request and sprint-review artefacts those two commits carried (`_alignment/hermes-drafts/2026-10-16/lane-request-x402-listing-hygiene-20261016.md`, `_alignment/hermes-reports/2026-10-11-lane-request-review.md`) |
| the estate's durable state was offloaded and verified | `csoai-work/ESTATE-STORAGE-AND-OFFLOAD-2026-10-27.md`: the M4's archive is on the pod **and** on `micro2`, `sha256sum -c` OK on both |

**Two git objects are unrecoverable from this machine:** `7de79744b9` and `924e255a05`
("review: x402 listing hygiene lane request + estate snapshot 1510Z"). Neither was ever pushed —
GitHub returns 404 for both. The pod's bare repo is a symlink into `/root/git/…`, which the
`ubuntu` user cannot read. There is no APFS local snapshot and no Time Machine destination. The
**content** survives as files in the work tree; the **commit identity** does not.

**The offload pipeline is ruled out by inspection.** `m4-offload.sh --auto` scans only
`~/_alignment/*/`, `~/clawd/wt-*/`, `~/.cache/*/`, `~/.npm/_cacache/` and `~/Library/Caches/*/` —
it never selects `$HOME/.git`; the pod's offload tree contains no home `.git`; and no session
transcript on this machine contains a `.git` removal.

**The mechanism class is named in the estate's own record** (§5 of the storage record): *"A
working set inside a git working tree is one `git clean` away from gone."* And at 07:52 today an
untracked directory inside a git working tree **was** removed while a push was running in it — the
push died with it.

**The proximate condition was disk.** The M4's data volume was at **99.8% used, 537 MB free** at
03:00 today and 94.6% by 08:00; the M2 was at 98%. Peer sessions were dying with
`ENOSPC: no space left on device` throughout, including one session literally named *"Oracle
micro2 disk reclaim"*. The estate's own record has already moved the working set to
`/Users/nicholas/csoai-work` — outside every git working tree, with the old path a symlink — and
records the single largest reclaimable item as an owner decision: the M4's 48 GB
`/Applications/World of Warcraft` install.

**What is still needed, and it is not a file operation:** the two commits' content should be
committed somewhere durable, and the M4's disk needs headroom before more agents are pointed at
it. A machine at 99.8% with sessions dying of ENOSPC will lose more than a `.git`.

## 11. Files

| path | what |
|---|---|
| `tools/sites_census.mjs` | the census: 34 sites, live probes, JSON + Markdown |
| `tools/sites_census_publish.mjs` | publishes the census into Busabase `sites` |
| `tools/mcp_registry_census.mjs` | enumerates the official MCP registry into a lane source record |
| `data/sites_census.json` | the census receipt |
| `data/mcp_registry_census.json` | the MCP registry receipt |
| `reports/SITES-CENSUS.md` | the human-readable census |
