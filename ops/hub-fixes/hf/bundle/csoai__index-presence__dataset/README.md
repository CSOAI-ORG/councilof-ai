---
license: other
license_name: csoai-mixed-data
license_link: https://huggingface.co/datasets/csoai/index-presence/blob/main/README.md#licence-note
pretty_name: "index-presence"
tags:
- ai-governance
- measurement
- council-of-ai
configs:
- config_name: default
  data_files:
  - split: train
    path: "2026-09-22/listings-2026-09-22.json"
  field: "results"
- config_name: estate-presence-2026-11-04
  data_files:
  - split: train
    path: 2026-11-04/estate-presence-2026-11-04.jsonl
- config_name: estate-presence-2026-11-05
  data_files:
  - split: train
    path: 2026-11-05/estate-presence-2026-11-05.jsonl
size_categories:
- n<1K
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Index-presence board — measured 2026-09-22 from the pod (`rp-3090-now`)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Every row here was measured today from an unrestricted network, by asking each service's
own index or search route and recording what it rendered or returned. Nothing was
promoted from a ledger note, a prior audit, or a guessed URL.

**This file is the only source the home-page rebuild is allowed to publish from.** A row
in §1 has an evidence URL and a quote. A row in §2 is a service that answered and said no.
A row in §3 could not be settled and says why. **Never publish from §2 or §3.**

**Four states, never conflated.** SUBMITTED (we sent it), ACCEPTED (the service took it),
APPEARING (a third party shows it), PRESENT (it still does). Most of what follows is
APPEARING/PRESENT, verified by rendering. Where only submission or acceptance was
observed, the row says exactly that.

Raw artifacts: `/workspace/lanes/out/index-presence/` on the pod (18 JSON files,
58 screenshots), mirrored to `~/clawd/csoai-reach-pack-01Sep2026/` and to Hugging Face.

---

## 0. The finding that reframes the board

**Every repository this estate publishes is invisible to anyone who is not logged in as
us.** `https://api.github.com/users/CSOAI-ORG` → **404**. `https://github.com/CSOAI-ORG`
→ **404**. `git ls-remote` on `councilof-ai.git` → **401**. Authenticated with our own
token, the same API reports **755 public repositories**, none archived, `private: false`.

Control, from the same pod seconds apart: `torvalds` 200, `anthropics` 200,
`modelcontextprotocol` 200, `github.com/modelcontextprotocol/servers` 200. The network is
fine. The account is flagged (day 20 of a flag first seen 2 September). `CouncilofAI-CSOAI`
is **also** 404, anonymously *and* authenticated — the "clean business account" is not
reachable under that name either.

This one fact explains most of what the board used to call separate defects:

| Consequence | Measured today |
|---|---|
| Software Heritage cannot archive us from GitHub | save request 2492509 → `save_task_status: failed`, `visit_status: not_found` |
| "npm/PyPI packages point at dead links" | **7 of 7 dead URLs are `github.com/CSOAI-ORG/*`**; all three target repos exist and the paths are correct |
| Published surfaces pointing at a 404 | **14,121 references** — 13,428 in `public/`, 693 in `client/src` |

It is one owner action, and it is the highest-value item on this board by a wide margin.

---

## 1. VERIFIED PRESENT TODAY — publishable

### 1.1 MCP directories (rendered in a browser, entry URL captured)

| Directory | Our entry | Rendered evidence |
|---|---|---|
| **Glama** | `https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai` | Page titled *"Council of AI GSPC by CSOAI-ORG \| Glama"*; carries **50+ outbound links to councilof.ai** including every tool and a live inspector. Search page: *"Matching MCP Connectors: agent-orchestrator-mcp io.github.CSOAI-ORG…"* |
| **PulseMCP** | `https://www.pulsemcp.com/servers/csoai-org-csoai-governance-crosswalk-mcp` | *"Showing 1 - 42 of **221** servers for 'csoai' … CSOAI Governance Crosswalk, CSOAI-ORG … **EST VISITORS (WEEK) 47**"* — a third party's own traffic estimate |
| **LobeHub** | `https://lobehub.com/mcp/csoai-org-ecommerce-ai-mcp` (+ 20 more `csoai-org-*`) | *"E-Commerce AI MCP Server — CSOAI-ORG — Unvalidated … Sep 22, 2026"* |
| **Smithery** | `https://smithery.ai/servers/csoai/gspc` | *"Council of AI GSPC — csoai/gspc — Independent AI-governance measurement over MCP. Canonical remote: POST https://councilof.ai/mcp … Stdio package: csoai-gspc-mcp@0.2.2"* (also `smithery.ai/servers/csgaglobal/csoai-compliance-council`) |
| **mcpservers.org** | `https://mcpservers.org/servers/councilof-ai-mcp` | *"Showing 1-1 of 1 servers — Council of AI GSPC MCP — Independent AI governance measurement MCP. 11 HTTP tools (7 free + 4 x402)."* ⚠️ **stale: "Board 22·22·0 · Hub 885/885/0"** |
| **MCP Toplist** | `https://mcptoplist.com/server/io.github.CSOAI-ORG%2Fcsoai` | *"SERVER Councilof AI — **Rank #3,412** of 132,046 servers tracked — io.github.CSOAI-ORG/csoai"*; and `…%2Fcsoai-governance-crosswalk-mcp` at *"**Rank #16,651**"*. Org page: *"CSOAI-ORG (**368 servers**)"* |
| **mcpverify.ai** | `https://mcpverify.ai/archive` | Two dated observations: **`councilof.ai/mcp` 2026-09-17 OK 19**, and **`councilof.ai/api/assess` 2026-08-29 HTTP_4XX 10**. Site is self-declared *"Pre-launch build"*; the archive is live and carries us |
| **A2A Registry** | `https://a2aregistry.org/?q=csoai` | *"**1 matching agents of 387** … Council of AI — Measurement Agent, CSOAI Ltd, 1.0, **100.0% uptime, Reachable**, Last checked 7 days ago"* |

### 1.2 The crown jewel — an independent curated list

**EthicalML / awesome-artificial-intelligence-regulation** (UK Institute for Ethical AI & ML)
— `https://github.com/EthicalML/awesome-artificial-intelligence-regulation`. **PRESENT.**
Exact current wording, rendered 2026-09-22:

> *Council of AI - Independent AI-governance measurement board (not certification). Live
> ruling 22 measured of 22 via https://councilof.ai/api/gspc; signed datasets DOI
> 10.57967/hf/10114; MCP registry io.github.CSOAI-ORG/gspc 1.0.3.*

Two links to us on the page: `https://councilof.ai/` and `https://councilof.ai/api/gspc`.

**It is stale in our favour on two counts, and that is a correction we owe them, not a boast:**
1. "22 measured of 22" — the live board is **23 measured of 23** (read from `/api/gspc` at
   16:42Z today: `axes: 23, measured_axes: 23, unmeasured_axes: 0`, since the effect-binding
   flip on 22 September).
2. "io.github.CSOAI-ORG/gspc **1.0.3**" — that version exists but is **not `isLatest`**, and
   its remotes are `https://councilof.ai/api/assess` (**answers 400, not an MCP endpoint**)
   and a personal `*.workers.dev` URL. The current latest is **1.4.2**, remote
   `https://councilof.ai/mcp` (**verified alive**). A third party is publishing a pointer to
   a broken endpoint of ours, on our own numbers.

### 1.3 MCP registry — full walk, no stall

The prior census stalled at page 3 on a 20 s timeout. Walked to the end today with
backoff. **Window 2026-09-22T15:39:42Z → 16:32:08Z**, page size 100:

- **1,127 pages read, walk complete, no stop condition.**
- **112,606 version rows** (one row per published version — *a row is not a server*).
- **34,873 distinct server names**.
- **354 of them ours** (`io.github.CSOAI-ORG/*`), from 1,342 of our version rows.

MCP Toplist independently counts **368** for CSOAI-ORG. Different windows and definitions;
both are right about their own read, and they are not reconciled here.

### 1.4 402 Index — the "50 rows" correction, with the walk that proves it

| Probe | Reported `total` | Rows walked | Distinct councilof.ai URLs | Walk complete |
|---|---|---|---|---|
| `q=councilof.ai` | **73** | 73 (2 pages) | **23** | ✅ |
| `q=csoai` | 60 | 60 | 12 | ✅ |
| `domain=councilof.ai` | **111,293** | 10,000 (capped) | 22 | ❌ |
| `provider=councilof.ai` | **111,293** | 10,000 (capped) | 22 | ❌ |

**`domain=`, `provider=` and `search=` are silently ignored** — each returns the entire
111,293-row index. That is almost certainly where "50 rows" came from: a partial read of
the whole index, totalled as ours.

**The true figure is 23 distinct councilof.ai URLs**, all enumerated in
`402index-walk-2026-09-22.json`, and it is not the same number as the query's `total`.
(The coordinator measured `total=122` earlier today; I measured 73 at 16:29Z. The `total`
moves; the 23 did not.)

### 1.5 Anchors — pure third-party proof

| Anchor | State | Evidence |
|---|---|---|
| **Rekor 2810720876** | ✅ in the log, inclusion proof present | `kind: rekord`, integrated **2026-09-12T19:21:59Z**, uuid `108e9186e8c5677a16d7…`, tree size 2,787,973,462, sha256 `e2ce9569…` — `https://search.sigstore.dev/?logIndex=2810720876` |
| **Rekor 2837824756** | ✅ in the log, inclusion proof present | `kind: rekord`, integrated **2026-09-15T01:31:25Z**, uuid `108e9186e8c5677a6b5c…`, sha256 `708a3763…` |
| **DOI 10.5281/zenodo.22293340** | Archived snapshot of 5 Sep 2026 (superseded; counts differ from today). Current figures: https://councilof.ai/api/gspc and https://councilof.ai/methodology/. | status: `https://councilof.ai/interop/zenodo-status.json` |
| **Methodology** | live page: <https://councilof.ai/methodology/> | status: `https://councilof.ai/interop/zenodo-status.json` |
| **DOI 10.57967/hf/10114** | ✅ resolves, `findable` | → `https://huggingface.co/datasets/csoai/gspc-board` — the DOI the EthicalML entry cites |
| **Bitcoin block 966712** | exists, mined **2026-09-12T19:37:55Z**, hash `00000000000000000000016cb3408982b0e136f878b0dc60668b773472c29689` | ⚠️ **A block existing is not an anchoring claim.** Whether any of our `.ots` files carries an attestation *into* that block is decided by the proof bytes, per file, and is **not** established by this row. Say *submitted* unless the upgraded proof verifies. |

### 1.6 Archival permanence — Software Heritage

The save endpoint needs **no token** (measured: POST with no `Authorization` → HTTP 200,
`save_request_status: accepted`). GitHub is unusable as an origin (§0), so the public
Hugging Face git origins were archived instead. **8 origins now carry a permanent SWHID:**

| Origin | SWHID |
|---|---|
| `csoai/councilof-ai-source` (the repo's own mirror) | `swh:1:snp:67e55b8a4389b8c0d1c685d0201e155567ea6eb8` |
| `csoai/councilof-ai-mirror` | `swh:1:snp:8953e67a1cf1c01f9e59011d86d46cfaebba2d02` |
| `csoai/gspc-board` | `swh:1:snp:78a68e71ce0e56c77c481e6e0039710474097cca` |
| `csoai/gspc-boards` | `swh:1:snp:7aa4da09bf716bbd3e36b7122dae04235e16e7c8` |
| `csoai/gspc-hub-cards` | `swh:1:snp:0b81b7a475de3bfcfb8a16ec275f78b3c0bf6dba` |
| `csoai/gspc-swarm` | `swh:1:snp:136000dcd7ccbef9a080ef524185647d5a95e06e` |
| `csoai/hub-queue` | `swh:1:snp:c3d73c2f12b3796373484053ea136d48da7116cb` |
| `csoai/x402-bazaar-conformance` | `swh:1:snp:939cf08f92985856c6064737503b9fbb344660dc` |

Browse any of them at
`https://archive.softwareheritage.org/browse/origin/directory/?origin_url=<origin>`.

Measured constraint: **`X-Ratelimit-Limit: 10` per window**, anonymous. The remaining ~106
public origins are queued through a standing loop at 8/run (≈14 days). A SWHID says these
bytes existed on this date. It does not say anyone reads them.

### 1.7 Archival permanence — Wayback Machine

**councilof.ai is already in the Wayback Machine: 386 captures across the site**, the
earliest 2026-01-08. Per-URL, as of 16:40Z:

| URL | Captures | Latest | Read back |
|---|---|---|---|
| `/` | 8 | 20260922152706 | 38,867 bytes ✅ |
| `/api/gspc` | 7 | 20260922081158 | 16,887 ✅ |
| `/api/corrections` | 3 | 20260922081158 | 30,730 ✅ |
| `/.well-known/x402.json` | 4 | 20260917192224 | 3,056 ✅ |
| `/.well-known/did.json` | 3 | 20260917192248 | 1,922 ✅ |
| `/root.json` | 3 | 20260917192240 | 13,624 ✅ |
| `/dashboard/?tab=board` | 3 | **20260922152736** | ✅ (this is where `/gspc` lands) |
| `/memberships/` | **1** | **20260922160829** | ✅ (created today, was zero) |
| `/pay` | 1 | 20260917192227 | 6,680 ✅ |
| `/gspc` | **0** | — | 308 to `/dashboard/?tab=board`; SPN archives the destination, not the hop |
| `/memberships` | **0** | — | 308 to `/memberships/` |

**Save Page Now works anonymously, and lies about it in both directions.** Measured:
`GET https://web.archive.org/save/<url>` answers **HTTP 500** with the ordinary Internet
Archive error page — *and captures anyway*: `/memberships/` had **zero** CDX captures,
was requested at **16:07:01Z**, and appeared as capture **20260922160829**. Meanwhile
`POST https://web.archive.org/save` answers **401 `{"message":"You need to be logged in to
use Save Page Now."}`** for the same URL the GET route then captured. And it does not
always take: a GET /save for `/root.json` at 15:34Z produced no new capture at all.

**Therefore a save request's HTTP status is worthless as evidence, in both directions.** The
standing loop treats it as such: it requests, waits, and records a capture only when CDX
confirms it and the archived bytes read back.

---

## 2. VERIFIED ABSENT — a service that answered, and said no

| Surface | Evidence (rendered) |
|---|---|
| **mcp.so** | *"Search results for 'csoai' — **0 results** — No servers match 'csoai'"*. The term appearing on the page is the query echo, not a listing. Also checked `councilof`, `gspc`. |
| **Agentic.Market** | Settled against the site's **own search API**: `api.agentic.market/v1/search/services?q=councilof` → `{"services":[], "total":0}`; same for `csoai` and `gspc`. Directory holds **2,858 services** and runs ~$21k/day in x402 volume. We are not in it. |
| **x402.org** | *"Results For 'councilof' — Sorry, no results were found."* Not on `/members/` either — we are not an x402 Foundation member. |
| **x402scan.com** | No match for `councilof` on its index. |
| **Enterprise DNA (MCP)** | `mcp.enterprisedna.co` → **NXDOMAIN**. `enterprisedna.co/?s=csoai` (the company site) has no mention. Any board row citing this is citing a host that does not resolve. |
| **AgentNDX** | **Category error, not an absence.** `agentndx.com` is an AI-sales-chat-widget SaaS — *"Your AI sales team, live on the web"* — with no directory, index or submission route. There is nothing here to be listed in. Remove the row rather than chasing it. |

---

## 3. UNCHECKABLE — and exactly why

| Surface | Why |
|---|---|
| **Bing** (`site:councilof.ai`) | *"One last step — Please solve the challenge below to continue"* |
| **DuckDuckGo** | HTTP 202, *"Unfortunately, bots use DuckDuckGo too. Please complete the following challenge… Select all squares containing a duck"* |
| **Mojeek** | *"Verification required — Please complete the challenge to continue. Protected by ALTCHA"* |
| **Yandex** | *"Please confirm that you are not a robot… Yandex SmartCaptcha"* |
| **Marginalia** | Answered cleanly: *"No search results found."* Weak evidence — it is a small independent index — but it is a real measurement, recorded as such. |
| **mcpservers.org `/category/all`** | HTTP 403 behind a Cloudflare Turnstile (`cf-turnstile-response` input). The site's **search** route worked and is in §1. |

**So: APPEARANCE in a general search index cannot be verified from the pod at all.** Every
major engine walls automated queries. We can observe SUBMITTED and ACCEPTED; we cannot
observe APPEARING or PRESENT for Bing, Google or Yandex without a credentialed webmaster
console. Nothing published should claim otherwise.

The OTS row in §1.5 is also deliberately incomplete: a per-file audit of the served `.ots`
bytes is needed before any of them is described as *anchored*.

---

## 4. Package URLs — root-caused, and it is not what the board said

A prior audit called "npm/PyPI packages pointing at dead links" the highest-ROI repair.
Every declared URL of every package on `public/interop/footprint-packages.json` was fetched
anonymously from the pod. **7 of 20 are dead — and all 7 are the same fault.**

| Registry | Package | Field | Declared URL | HTTP |
|---|---|---|---|---|
| pypi | csoai-gspc | `Board mirror` | `github.com/CSOAI-ORG/gspc-board` | **404** |
| pypi | csoai-gspc | `Source` | `github.com/CSOAI-ORG/councilof-ai/tree/master/scripts/spray/pypi/csoai-gspc` | **404** |
| pypi | inspect-signed-receipt | `Repository` | `github.com/CSOAI-ORG/inspect-receipts` | **404** |
| npm | csoai-gspc-mcp | `repository` | `github.com/CSOAI-ORG/councilof-ai` | **404** |
| npm | csoai-gspc-mcp | `bugs` | `…/councilof-ai/issues` | **404** |
| npm | csoai-governance-mcp | `repository` | `github.com/CSOAI-ORG/councilof-ai` | **404** |
| npm | csoai-governance-mcp | `bugs` | `…/councilof-ai/issues` | **404** |

Checked authenticated: **`gspc-board`, `councilof-ai` and `inspect-receipts` all exist,
all `private: false`, none archived**, and `scripts/spray/pypi/csoai-gspc/LICENSE` is
there. The declared URLs are **correct**. They 404 because the account is invisible (§0).

**There is no correct URL to move to, so there is nothing to republish.** The repair is
the GitHub flag. All 13 live URLs (councilof.ai, csoai.org, huggingface.co/csoai, the PyPI
project pages) answer 200.

A separate, real gap: three packages declare almost nothing.
`claimguard` 0.1.0 and `agent-incident-reporter-mcp` 1.0.3 have **no project URLs at all**;
`csoai` 0.2.2 has only `Homepage`. That one *does* need a release to fix.

---

## 5. MCP listings pointing at a dead host — 39, and one DNS record fixes them

Of our **354** registry servers, **40** declare a remote on their `isLatest` version.
(The other 314 are stdio/PyPI packages with no remote — not a defect.)

- **1 alive:** `https://councilof.ai/mcp` → MCP `initialize` → **200**.
- **39 dead:** every one on **`api.meok.ai`**, which has **no DNS record at all**
  (NXDOMAIN — not a timeout, not a 5xx). `meok.ai` apex answers **200**; only the `api.`
  subdomain is missing.

Two ways to fix, and the cheaper one is not the one the board assumed:

**(a) One DNS record.** Point `api.meok.ai` at whatever serves those 39 A2A paths. **Zero
republishes, all 39 fixed at once.** Requires that something still serves
`/v1/a2a/*` — verify before creating the record, or 39 listings move from NXDOMAIN to 404,
which is worse because it looks deliberate.

**(b) 39 republishes.** Registry versions are immutable; a listing is corrected by
publishing a **new version of the same name**. The exact payload per listing is written out
in `mcp-remote-health-2026-09-22.json` → `broken[]`: current version, bumped, with
`remotes: [{"type":"streamable-http","url":"https://councilof.ai/mcp"}]`.

**This is an owner decision, not a lane one**, because it crosses the CSOAI/MEOK boundary:
CSOAI measures, MEOK hosts. Route (b) moves 39 MEOK-branded endpoints onto a CSOAI host.

A 40th, separate: `io.github.CSOAI-ORG/gspc` **1.0.3** points at `councilof.ai/api/assess`
(answers 400) and a personal `*.workers.dev` URL. It is not `isLatest` — but the EthicalML
list and mcpverify.ai both publish it, so a stale version is doing live damage (§1.2).

---

## 6. IndexNow — submission discipline, not setup

Setup was already done and I nearly duplicated it. **councilof.ai has three key files
committed under `public/`, and all three answer 200 live.** The current one is
`97a1aa3163534fae954108d8941eb361` (committed 2026-09-12, `ab8a035a4`) — the only one any
script references and the one the 2026-09-21 receipt verified. The other two
(`1ab9ec14…`, `529017b8…`, both 2026-08-19) stay served so that anything submitted under
them remains verifiable. **No fourth key was minted.**

What was missing was the discipline. The submitter derived its list from the sitemap and
refused dead URLs, but sent **every live URL on every run** — 552 of them. The protocol asks
publishers to notify *meaningful changes*, and the 21 September receipt for this host says
in as many words *"do not re-ping without a material public URL change"*.

`--changed-only` now keeps a per-URL content fingerprint and sends only what moved. Three
byte ranges are masked, each measured today by fetching the same URL twice seconds apart
and diffing — never masked on suspicion:

- Cloudflare's rotating email-obfuscation XOR key (the only difference between two fetches
  of the home page 3 s apart);
- a response's own generation time (`ts`, `as_of`, `<pubDate>`, and the guid derived from
  it). **Before this mask, `/api/feed.xml`, `/api/regulator-findings` and `/api/reported`
  were reported as changed on every single run** — which is exactly the resubmission the
  protocol asks us not to make.

Measured after the mask, on two consecutive runs: **553 live, 0 new, 0 changed, 0 submitted**.

First run through a fresh state **seeds and submits nothing**, because announcing 553 URLs
at once is a judgement the owner makes, not a script. Every result line ends
`indexing NOT_VERIFIED`, including the runs with nothing to do — an absent log line reads
like an absent run.

Also found and reported rather than papered over: `https://councilof.ai/merge-me/` is in the
sitemap and answers **404**.

---

## 7. Standing loops installed (pod, registered in the scheduler)

| Loop | Slot | What its receipt says |
|---|---|---|
| `indexnow-ping.sh` | 06:30Z | `live=N new=N changed=N unchanged=N submitted=N accepted=N; indexing NOT_VERIFIED` — verifies the key file is LIVE first, because a ping against a missing key file is a silent failure (the endpoint answers 200 and discards the batch at validation) |
| `swh-archive.sh` | 07:30Z | `due=N submitted=N succeeded=N rate_limited=N; ledger holds N origins with a SWHID` — 8 per run against the measured limit of 10 |
| `wayback-save.sh` | on demand | `targets=N due=N requested=N verified=N` — **verified** means CDX-confirmed and read back, never "SPN answered 200" |

All three take `--now`, none stamps itself, all three write a receipt on a run with nothing
to do, and all three hold a lock. Scheduler backed up before each edit
(`scheduler.sh.pre-indexnow-ping-*`, `scheduler.sh.pre-swh-archive-*`); scheduler verified
running (pid 954782).

---

## 8. Needs the owner — exact action, in order of value

1. **Lift the GitHub account flag on `CSOAI-ORG`** (and establish what happened to
   `CouncilofAI-CSOAI`, which is 404 even to our own token). GitHub Support → Account →
   appeal the flag; day 20, 5 escalations already logged. **Fixes 7 dead package URLs, 14,121
   published references and the Software Heritage route, with zero republishes.** Nothing else
   on this board is close.
2. **Decide the `api.meok.ai` route** (§5): create the DNS record *only if something still
   serves `/v1/a2a/*`, verified first*, or authorise 39 registry republishes onto
   `https://councilof.ai/mcp`. 39 listings are unreachable either way until this is decided.
3. **Open a correction PR on EthicalML/awesome-artificial-intelligence-regulation** —
   `22 measured of 22` → `23 measured of 23`, and `io.github.CSOAI-ORG/gspc 1.0.3` → `1.4.2`.
   We are the ones who should catch this; it currently points readers at an endpoint of ours
   that answers 400.
4. **Ask mcpservers.org to refresh** `Board 22·22·0 · Hub 885/885/0`, same reason.
5. **Decide whether to announce the 553-URL IndexNow baseline once.** One command, owner's
   call: `python3 scripts/monitoring/indexnow_submit.py --changed-only --state <state>`
   *without* `--seed-only`. The loop will never do it on its own initiative.
6. **An archive.org account would help but is not required.** The anonymous SPN route works
   (§1.7). A logged-in account or S3 keys (`https://archive.org/account/s3.php`) would make it
   reliable rather than intermittent. Currently no archive.org credential exists anywhere in
   the estate — grep of the pod secrets, `~/.config`, `~/.csoai-keys*` found none.
7. **Submit to Agentic.Market** (§2) if we want the x402 door discovered — it is a live
   directory with 2,858 services and ~$21k/day, and we are not in it. `agentic.market/validate`
   is its own route. Outward action, so it waits on the owner.
8. **Register `csoai` and `claimguard` project URLs** on the next PyPI release (§4). No urgency.

---

## 9. What this board does NOT say

- It does not say anyone reads our archived bytes, uses our MCP servers, or clicks a
  directory entry. Presence is presence.
- It does not say our pages are indexed by Bing, Google or Yandex. That is §3, and it is
  unverifiable from here.
- It does not reconcile 354 (our registry walk) with 368 (MCP Toplist) or 221 (PulseMCP).
  Three counters, three windows, three definitions. Each is right about its own read.
- It does not describe any `.ots` file as anchored. That needs the proof bytes.

*Measured 2026-09-22 by the index-presence lane, from `rp-3090-now`. Every number here
came from a live request made today; re-derive before quoting, because these go stale in days.*

## Licence note

Files written by CSOAI in this repository (the measurement JSON files and PRESENCE-BOARD.md) are CC-BY-4.0, the licence councilof.ai states for its data. `2026-09-22/mcp-registry-servers.jsonl` is a verbatim copy of third-party MCP registry records; it keeps the terms of its upstream source and is not relicensed by CSOAI.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *Index-presence board — measured 2026-09-22 from the pod (`rp-3090-now`)*. 2026. Hugging Face dataset `csoai/index-presence`. https://huggingface.co/datasets/csoai/index-presence

```bibtex
@misc{csoai_index_presence,
  title        = {Index-presence board — measured 2026-09-22 from the pod (`rp-3090-now`)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/index-presence},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: mixed. See the Licence note in this card.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- DATA-ACCESS:START -->
## Read this product

The default table contains the 21 listing checks from 2026-09-22. Other dated reports and the upstream registry copy remain separate files with their own terms.

```python
from datasets import load_dataset
rows = load_dataset("csoai/index-presence", name="default", split="train")
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->
