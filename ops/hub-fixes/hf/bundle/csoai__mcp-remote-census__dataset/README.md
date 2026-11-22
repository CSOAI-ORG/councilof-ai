---
license: cc-by-4.0
pretty_name: Remote MCP endpoint census (current v0.2, 2026-09-26)
tags:
- mcp
- model-context-protocol
- measurement
- census
- council-of-ai
configs:
- config_name: population-v0.2-2026-09-26
  data_files: results.v0.2.public.jsonl.gz
- config_name: probe-2026-09-25
  data_files: probe/results.public.jsonl.gz
- config_name: not-attempted-2026-09-25
  data_files: probe/not_attempted.jsonl.gz
size_categories:
- 10K<n<100K
# TODO task_categories: Growth proposes question-answering (verify against content)
# TODO language: Growth proposes en (verify)
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Remote MCP endpoint census - measured read, 2026-09-25

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

> **Current version: v0.2.1 (2026-09-26).** `record.v0.2.1.json` (sha256 `3155502aa629a3e0e8dd0240862933e475cc2afaf3417d03c0efa314d139c4bd`, a correction of the read_state label of `record.v0.2.json`; see Corrections) and `results.v0.2.public.jsonl.gz` supersede `record.json` (0.1) and `record.v0.1.1.json` (0.1.1) as the current record. The earlier files are kept byte for byte; everything from here down to the section "v0.2 - full population" describes the 2026-09-25 read.
>
> **The 2026-09-26 probe was PARTIAL:** 10,039 of the 10,983 endpoints planned for it were contacted; 944 were not (934 because of robots.txt, 10 hf.space endpoints whose sleep state was not checked). The record's read_state is **PARTIAL** (0.2 said EXHAUSTED; corrected in 0.2.1). What 0.2 called EXHAUSTED is an accounting fact, now `population_accounting`: each of the 22,196 catalogue endpoints has exactly one row, 1,070 of them NOT_ATTEMPTED with a reason and 11,087 reused from the 2026-09-25 runs (under 48 h old). It does not mean every endpoint was contacted, and it is not a count of all MCP servers.
>
> Published by CSOAI Ltd. Objections, re-check requests and opt-outs: nicholas@csoai.org (see "Contact, objections and re-checks" below).

What remote MCP endpoints listed in public catalogues answered to `initialize` and `tools/list`,
on 2026-09-25T06:38:51Z to 2026-09-25T06:54:10Z, from one network location. Published by Council of AI (CSOAI).
We **measure**. We do not certify, grade, rank or endorse any server.

**Read state: PARTIAL.** 4,144 endpoints attempted of 4,376 planned
(232 not attempted: robots.txt). The plan is the top 20% of an ordered frame; every
count below is over the attempted endpoints and is **not** a population total of MCP servers.

Record: `record.json` sha256 `c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84`, signed (Ed25519, `did:web:csoai.org#board-attestation-1`) at
2026-09-25T07:07:20.977Z, OpenTimestamps state **PENDING_CALENDAR_COMMITMENT** at publication (see below).

## Corrections

### 2026-09-26: record 0.2.1 supersedes 0.2 (read_state)

`record.v0.2.1.json` (sha256 `3155502aa629a3e0e8dd0240862933e475cc2afaf3417d03c0efa314d139c4bd`) supersedes `record.v0.2.json` (0.2, sha256 `a18447e5bb27decbc7d20c1542994811f47dee94b4650faed7b231af5c5d72bd`). The 0.2 record, its signature, its timestamp proof and `results.v0.2.public.jsonl.gz` are kept here unchanged. **Scope:** the read_state label only; no measurement re-run; every count, state, row and published file identical to 0.2.

**What was wrong.** `read_state` said "EXHAUSTED". 0.2 redefined read_state to mean 'every endpoint has one row' and so published EXHAUSTED while the 2026-09-26 probe contacted 10,039 of the 10,983 endpoints planned for it (944 not attempted; 1,070 of 22,196 population endpoints NOT_ATTEMPTED in all). The same field meant 'every endpoint attempted' in 0.1/0.1.1 (PARTIAL, 232 not attempted) and in the probe summary (PARTIAL), and the signed payload carries the bare word without the redefinition. Read beside 0.1.1 it says the read became complete; it did not.

**What is right**

- read_state PARTIAL: 21,126 of 22,196 endpoints have an observed state; 1,070 are NOT_ATTEMPTED with their reasons.
- population_accounting.every_endpoint_exactly_one_row = true: the fact 0.2 called EXHAUSTED, under its own name.
- The 2026-09-26 probe run is PARTIAL (its summary.json read_state): 10,039 of 10,983 attempted.
- The catalogue frame reads (mcp-registry, docker-mcp-registry) remain EXHAUSTED; population.frame_sources is unchanged.

**Verify 0.2.1.** `record.v0.2.1.signed.json`: Ed25519 by `did:web:csoai.org#board-attestation-1`, signed 2026-09-26T07:33:47.357Z, payload sha256 `67120bed88a05dfb2493ffcf99fdaea3173599926f7074258375fe4f394b8cb2`; verify with the snippet under How to verify. `record.v0.2.1.json.ots`: 3 pending calendar attestations at publication, **PENDING_CALENDAR_COMMITMENT**, not a Bitcoin attestation.

### 2026-09-25: record 0.1.1 supersedes 0.1 (how to read protocolVersion)

`record.v0.1.1.json` (sha256 `fd5c8a7a65f23f7080f2859e386afe474f8a2d1d8316e5be60be4304dff7118a`) supersedes `record.json` (0.1, sha256
`c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84`). The 0.1 record, its signature and its timestamp proof are kept here unchanged.
**Scope:** interpretation of protocolVersion only; no measurement re-run; every count, state, row and published file identical to 0.1. Text further down this card that repeats the 0.1 wording is superseded by this section.

**What was wrong**

- `anomalies[A1].what_we_do_not_say` said: "anything about the operator's intent, or whether the version string is correct". It left open whether '2026-07-28' is a real MCP protocol version. It is the current published MCP specification revision, released 2026-07-28, 59 days before this probe. We had not checked; one fetch settles it.
- `protocol_version.note (README: 'protocolVersion answered')` said: "a server answers with the requested version when it supports it, otherwise with one of its own; this distribution is conditional on the request and is not a census of what servers support". It stated the legacy negotiation rule without saying that the version we requested, 2025-11-25, is itself a legacy revision and that we sent nothing in the current one. The distribution could be read as describing what current servers support; it describes what they negotiated against an older request.

**What is right**

- 2026-07-28 is a published MCP specification revision; the specification site labelled it '(latest)' when fetched (evidence below).
- It removes the initialize/initialized handshake and sessions: each request carries its protocol version in _meta and, on HTTP, the MCP-Protocol-Version header; servers MUST implement server/discover; an unsupported version is answered with UnsupportedProtocolVersionError (-32022) listing the supported ones. Revisions 2025-11-25 and earlier are 'legacy'.
- Our 0.1 prober requested 2025-11-25 through a legacy initialize only. The protocolVersion distribution (2025-11-25: 1,419, 2025-06-18: 297, 2025-03-26: 116, 2026-07-28: 95, 2024-11-05: 80, 2025-11-05: 1) is therefore servers' negotiation against an older requested version, not their maximum supported version. Under the 2025-11-25 lifecycle a server that supports the requested version MUST answer with it, so the 1,419 endpoints that answered 2025-11-25 include any that also support 2026-07-28; this probe could not see which.
- The 95 endpoints that answered '2026-07-28' (94 getvda.ai hosts, plus oceanalt.com) named it inside a legacy initialize exchange, a handshake that revision retired. Under the 2025-11-25 lifecycle a server answers a version other than the one requested only when it does not support the requested one. We record what they answered and do not say which revision's behaviour they implement.

**Primary sources** (fetched, hashed, quotes checked against the fetched bytes; `evidence/mcp-2026-07-28-primary-sources.json` in the repo,
sha256 `e4a50b37b3f7215b477bee3fdc4a526a4e6baa8985dd18a8a6142607803d8099`):

| URL | fetched (UTC) | sha256 of bytes | quoted |
|---|---|---|---|
| https://blog.modelcontextprotocol.io/posts/2026-07-28/ | 2026-09-25T08:04:56Z | `9e3c347f359baa66725fffe8e88f348299905d236dea320cd8457e8c4619e520` | "pushing the release button on the next version of the MCP specification, 2026-07-28" / "officially retired the initialize / initialized exchange" |
| https://modelcontextprotocol.io/specification/2026-07-28 | 2026-09-25T08:04:57Z | `e434010502918455ebe12ede0d8719c3e3dec25ed9655d2a7fc0e4944de021c7` | "Version 2026-07-28 (latest)" |
| https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning.md | 2026-09-25T08:04:57Z | `28c417b3c38345ae8350b9be20ed1b53fcec564b65c13c25d96ab9cfe7e44e9f` | "There is no negotiation handshake." / "establish a session with an initialize handshake (2025-11-25 and earlier)" |
| https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http.md | 2026-09-25T08:04:57Z | `761f1cd04bfdc4f2c16a362502725ea684341cb7ad99607df927017713af19fc` | "Every POST request to the MCP endpoint MUST include an MCP-Protocol-Version header." |
| https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle.md | 2026-09-25T08:04:58Z | `884720004be3ab0e2c65562c33ce8903b30e7c763c4764baed04a2ef8dfd7fa6` | "Otherwise, the server MUST respond with another protocol version it supports." |

**Prober.** `scripts/census/mcp-remote-probe.py` (csoai.census-probe/0.2, commit `61da72861`)
offers 2026-07-28 first (server/discover with _meta and modern headers), follows -32022 to a listed version it speaks, never falls back past a recognised modern error, otherwise falls back to a legacy initialize requesting 2025-11-25; each row records protocol_versions_offered, protocol_version_requested, protocol_version_negotiated and era separately. It has not been re-run as a census.

Smoke test of the corrected prober (5 endpoints, not a census; these rows are all of it):

| endpoint | era | requested | negotiated | server lists | answered to the 0.1 initialize |
|---|---|---|---|---|---|
| https://mcp.context7.com/mcp | modern | 2026-07-28 | 2026-07-28 | 2026-07-28 | 2025-11-25 |
| https://mcp.svelte.dev/mcp | modern | 2026-07-28 | 2026-07-28 | 2026-07-28 | 2025-06-18 |
| https://www.basealpha.fun/mcp | legacy | 2025-11-25 | 2025-03-26 | - | 2025-03-26 |
| https://oceanalt.com/api/mcp | modern | 2026-07-28 | 2026-07-28 | 2026-07-28, 2025-06-18 | 2026-07-28 |
| https://auth-token-mcp-service.getvda.ai/mcp | legacy | 2025-11-25 | 2026-07-28 | - | 2026-07-28 |

**Verify 0.1.1.** `record.v0.1.1.signed.json`: Ed25519 by `did:web:csoai.org#board-attestation-1`, signed 2026-09-25T08:05:36.586Z,
payload sha256 `e72452958a012bc2e9d5fed50505ef090fde0b1a65fd4b7d9eb22ef904aa5d54`; verify exactly as for 0.1 below, with the 0.1.1 file names.
`record.v0.1.1.json.ots`: 3 pending calendar attestations at publication, **PENDING_CALENDAR_COMMITMENT**,
not a Bitcoin attestation.

## 1. The frame (what the catalogues list)

| source | read_state | rows read | distinct endpoints | population total |
|---|---|---|---|---|
| mcp-registry | EXHAUSTED | 35,873 | 21,958 | 35,873 |
| hf-spaces | EXHAUSTED | 10,822 | 10,822 | 10,822 |
| a2aregistry | EXHAUSTED | 443 | 440 | 443 |
| docker-mcp-registry | EXHAUSTED | 328 | 77 | 328 |
| smithery | PARTIAL | 500 | 0 | null |

Endpoints read across sources: 33,261 on 25,526 hosts.
**Combined population total: null**, because smithery: PARTIAL.
endpoints_read counts what was read. It is not a population total: Smithery was read PARTIAL (264 distinct of a declared 17,186; the anonymous API stops at 5 pages and lists no endpoint URL).

### An independent second read of the MCP registry (cited, not merged)

Two readers of the official MCP registry, written separately, ran about an hour apart on the same day. Their row counts are CITED side by side. The data is not merged, and this is not a reconciliation: the registry changed between the reads, so a difference is expected and is not an error in either.

| reader | user agent | endpoint | when (UTC) | read state | pages | rows | summary sha256 |
|---|---|---|---|---|---|---|---|
| census frame (this record) | `CSOAI-census/0.1 (+https://councilof.ai)` | `https://registry.modelcontextprotocol.io/v0/servers?limit=100&version=latest` | 2026-09-25T05:45:50Z to 2026-09-25T05:54:05Z | EXHAUSTED | 359 | 35,873 | `ce4bb52a70a6077c3f2ab004e04da616578bcad362bf712e86f63c9da48428e2` |
| RAS discovery lane (a different lane, different code) | `CSOAI-RAS-Discovery/0.1` | `https://registry.modelcontextprotocol.io/v0.1/servers?limit=100&version=latest` | finished 2026-09-25T04:40:39Z (file mtime) | COMPLETE | 359 | 35,859 | `8ec4692760de6a30b9687704fba33c36327d70a2258bccb16da33f0b4dd323f2` |

Time gap: the RAS read finished at about 04:40Z; the frame read ran 05:45:50Z-05:54:05Z, roughly 65-74 minutes later. Ids in both: 35,859; only in the frame read: 14; only in the RAS read: 0; shared ids with a different latest version: 29. Every id in the earlier RAS read (35,859) is also in the later frame read, which has 14 more; 29 shared ids carry a different latest version. That is consistent with publications made between the reads, and the two reads agree to within that churn. 'remote' (RAS) and 'entries with an endpoint' (frame) are defined differently and are not compared. The RAS lane also diffed its read against the estate's canonical public MCP corpus (`mcp-corpus-diff-20260925.json`, sha256 `6c8c41b133320154acd558cf34e1710bdbbb3f90d97b37dfc735f54ddf82e116`): 4,364 new, 312 absent from the current registry, 3,509 version changes against 31,807 canonical ids.

## 2. The plan (which 20% we probed, and why that 20%)

21,880 probeable candidates; top 4,376 planned.

- **Tier 1, reach-signalled (1,575):** dockerhub_pull_count 16, npm_weekly_downloads 1,276, smithery_use_count 6, pypi_downloads_7d 277. ordered by standing WITHIN the endpoint's own signal (reach_pct); signals are different units and are never added or converted.
- **Tier 2, ALPHABETICAL FILL - not a reach signal (2,801):** the remaining plan slots filled in MCP registry listing order, then Docker catalogue order. Registry listing order is byte-ascending server name
  (35,872 of 35,872 adjacent pairs ascending);
  the fill stopped at `com.backgroundcheckquotes/site`. io.github.* names: 0 of 2,801 in the fill vs
  11,324 of 21,705 registry entries with a probeable endpoint. the fill favours reverse-DNS names early in the byte order; it is a deterministic tie-break, not a sample of the registry.
- GitHub stars were not used: api.github.com serves 60 unauthenticated requests/hour; no key is used by rule.

## 3. The probe (what the endpoints answered)

| state | endpoints | meaning |
|---|---|---|
| RESPONDED | 2,008 | answered initialize with an MCP result |
| AUTH_REQUIRED | 1,428 | refused without a credential (401/402/403 or an auth error); no credential was ever sent |
| NOT_MCP | 346 | answered, but not with MCP (HTML, 404, non-JSON-RPC) |
| UNREACHABLE | 255 | no usable answer: DNS, TLS, connect failure, or HTTP 5xx |
| TIMEOUT | 62 | no answer within 10 s connect / 15 s read |
| SSE_ENDPOINT_ONLY | 37 | legacy SSE transport: served an endpoint event; no session was opened |
| MCP_ERROR | 8 | answered with a JSON-RPC error to initialize |

Sent: GET /robots.txt (once per host); POST initialize; POST notifications/initialized; POST tools/list (<= 5 pages); DELETE (only when a session id was issued); GET with Accept: text/event-stream (legacy SSE; endpoint event only). **Never sent:** tools/call, resources/read, prompts/get, any credential, any payment.
One connection and at least 1.0 s between requests per host; at most one retry. 12,739 requests in total.
Correction recorded: re-probe after a client fix: an SSE data line longer than one 64 KiB readline was split and dropped, so large tools/list results over SSE read as no_response (93 re-probed; first run kept, not published).

### Tool surface (RESPONDED, tools/list complete)

Units: tools listed by one endpoint. Percentiles by nearest rank. A sum of tool counts is not a population figure.

| view | n | p25 | median | p75 | max |
|---|---|---|---|---|---|
| per endpoint | 1,983 | 4 | 7 | 16 | 627 |
| per host (best-ranked endpoint) | 1,781 | 4 | 7 | 13 | 627 |
| per endpoint, excluding getvda.ai and a2awire.com | 1,777 | 4 | 7 | 14 | 627 |

1,701 distinct tool-name sets; the largest identical set covers 92 endpoints.

### protocolVersion answered (we requested `2025-11-25`)

| protocolVersion | endpoints |
|---|---|
| 2025-11-25 | 1,419 |
| 2025-06-18 | 297 |
| 2025-03-26 | 116 |
| 2026-07-28 | 95 |
| 2024-11-05 | 80 |
| 2025-11-05 | 1 |

a server answers with the requested version when it supports it, otherwise with one of its own; this distribution is conditional on the request and is not a census of what servers support.

## 4. Anomalies

- **A1** - 92 distinct getvda.ai subdomains answered with the identical 2-tool set ['invoke', 'selftest'] and every getvda.ai endpoint answered protocolVersion '2026-07-28' to a request for '2025-11-25'. They are 94 of the 2008 RESPONDED endpoints and the single largest identical tool-name set. Counts per endpoint therefore over-weight one operator.
- **A2** - 109 of 112 a2awire.com endpoints fall into two tool-name sets (59 with 16 tools, 50 with 23 tools). One host is the largest single contributor of RESPONDED endpoints.
- **A3** - 231 attempted endpoints are listed at hostnames that do not resolve (EAI_NONAME/EAI_NODATA at the robots.txt fetch); 1 more had a temporary resolver failure and is not counted as dead. 39 of the 231 are our own (see own_entries).

## 5. Our own dead entries

39 remote endpoints published under our own namespace io.github.CSOAI-ORG in the official MCP registry point at api.meok.ai, which does not resolve in DNS. They were probed like everyone else's and are counted in UNREACHABLE above. This is our defect, not the registry's. Deprecating or deleting any io.github.CSOAI-ORG/* entry requires GitHub authentication as an Owner of the organisation; a domain proof for councilof.ai grants ai.councilof/* only. The reasons, from the registry's own source, are recorded in the supersession record. Record: https://councilof.ai/interop/mcp-registry-2026-09-23/supersession.json
(sha256 `7802f6641c41ce2deb8b3c16cebfa064cd1dd86638d2567d7d08a3e20ef9fb81`). To exclude the measuring estate's own rows: drop rows whose host is api.meok.ai or councilof.ai.

## 6. What this is not evidence of

- that any server is safe, secure, correct, maintained, or fit for any purpose
- the quality of any server or its tools, or that a tool does what its name says
- endorsement, ranking, grading, or approval of any server or operator
- anything about the ~80% of the frame outside the top-20% plan, or the 232 planned endpoints not attempted
- a population total of MCP servers or endpoints: the frame is PARTIAL (Smithery) and the probe is PARTIAL
- reachability at any other moment or from any other network location
- what AUTH_REQUIRED servers expose behind their credential

## Files

| file | sha256 |
|---|---|
| `record.v0.2.1.json` (current) | `3155502aa629a3e0e8dd0240862933e475cc2afaf3417d03c0efa314d139c4bd` |
| `record.v0.2.json` (0.2, superseded by record.v0.2.1.json: read_state only) | `a18447e5bb27decbc7d20c1542994811f47dee94b4650faed7b231af5c5d72bd` |
| `results.v0.2.public.jsonl.gz` (current, 22,196 rows) | `a9b644a17e116c1c6f12c4ecacbb013bab62b3d04f5e84f4715578406984fc70` |
| `record.json` (0.1, superseded by record.v0.2.json) | `c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84` |
| `probe/results.public.jsonl.gz` | `f29c89c910f1677ab570de701494415806a9796770323e5c50a79fc2664b2bb3` |
| `probe/not_attempted.jsonl.gz` | `663cc83fa46fbe103f69a540c6ab1ddcc43374328e0b5e735c1f7b68b14a6be1` |
| `frame/summary.json` | `ce4bb52a70a6077c3f2ab004e04da616578bcad362bf712e86f63c9da48428e2` |
| `frame/plan-top20.json` | `493c81c10a2b91c0707e2df3e6e6c07f614898d881282ae18766b703c8d53565` |
| `probe/summary.json` | `991ef00bf40c6c56960ff08110fdf3ebceb366f5d1f8b15aadf3f85cb8ef9ae1` |

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state): these three belong to the 0.1 record and are superseded, with it. Current: record.v0.2.1.signed.json, record.v0.2.1.json.ots, record.v0.2.1.ots.json. The 0.2 files record.v0.2.signed.json, record.v0.2.json.ots, record.v0.2.ots.json are superseded by those 0.2.1 files (read_state only). The 2026-09-25 probe files above are the rows of the 0.1 read; the current rows are results.v0.2.public.jsonl.gz.
Per-endpoint rows carry: rank, ranked_by, endpoint, host, state, reason, http_status, transport, protocol_version, tools_list_status, tools_complete, n_tools, tool_names_sha256, started, finished. They carry **no** tool names, tool descriptions or serverInfo;
`tool_names_sha256` is sha256 of the sorted tool names joined by `\n`, UTF-8 (as the probe computes it). Rows are derived from public catalogue listings.

## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8.
Its sha256 must equal `signature.payload_sha256`. `payload.artifact.sha256` must equal sha256 of `record.json`.
Verify `signature.sig_ed25519` (hex) over those bytes with the Ed25519 key `#board-attestation-1`
(`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
rec, sig = "record.v0.2.1.json", "record.v0.2.1.signed.json"  # current; earlier pairs: record.v0.2.json / record.v0.2.signed.json, record.json / record.signed.json
s = json.load(open(sig))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open(rec, "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "mcp-remote-census-verify/0.1 (+https://councilof.ai/contact)"})
did = json.load(urllib.request.urlopen(req, timeout=30))  # a named User-Agent: the default Python-urllib one is refused (403)
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
print("VERIFIES", rec)
```

**Timestamp.** `pip install opentimestamps-client`, then `ots upgrade record.json.ots` and `ots verify record.json.ots`
(verification needs a Bitcoin node or a block explorer). At publication the proof held
3 pending calendar attestations from https://alice.btc.calendar.opentimestamps.org, https://bob.btc.calendar.opentimestamps.org, https://finney.calendar.eternitywall.com: a **pending calendar
commitment, not a Bitcoin attestation**. It proves nothing about time until it is upgraded and verified against the chain.

Without a Bitcoin node (a full `ots verify` needs one), check an upgraded proof offline and compare the merkle root with a
public block explorer (two independent ones is better):

```sh
# (a pending proof must first be upgraded: ots upgrade <proof>)
ots --no-bitcoin verify -f record.v0.1.1.json record.v0.1.1.json.bitcoin.ots
# -> "To verify manually, check that Bitcoin block H has merkleroot M"
B=$(curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block-height/H)
curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# must print M; repeat against https://blockstream.info/api/...
```

## Contact, objections and re-checks

Publisher and accountable entity: **CSOAI Ltd** (Council of AI, https://councilof.ai). Contact: nicholas@csoai.org (also https://councilof.ai/contact).

- **Object to a row, or ask for a re-check.** If you operate an endpoint listed here and think its state is wrong, out of date, or should not be published, email nicholas@csoai.org with the endpoint URL (and its registry name if you have it). We re-probe it with the same read-only prober and reply with what it answered. If the published state was wrong, the correction is published here as a new file and noted under Corrections; published files are never edited in place. A re-check reports what one endpoint answered at one moment; it is not a grade.
- **Opt out of future probes.** The prober sends the User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)` and honours robots.txt for the token `CSOAI-census`: an endpoint whose robots.txt disallows the path is recorded NOT_ATTEMPTED and is not contacted. A `Disallow` for `CSOAI-census` is enough; you can also email us.
- **Corrections.** Published in the Corrections section of this card and at https://councilof.ai/corrections. A superseding record never rewrites the earlier one.
- **Object, or opt out of future probing.** Name the endpoint. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. `scripts/census/mcp-remote-probe.py` and `scripts/census/contract-parity.py` read the list and skip a named endpoint or host before any request, with a test and a must-fail control (lane branch lane/contract-parity-fix-20260926, commit e087664, not yet merged); until that code runs on every probe host, entries are also honoured by hand.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Citation

```bibtex
@misc{csoai_mcp_remote_census_v02_2026,
  title        = {Remote MCP endpoint census, v0.2 (2026-09-26)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  howpublished = {\url{https://huggingface.co/datasets/csoai/mcp-remote-census}},
  note         = {record.v0.2.json, sha256 a18447e5bb27decbc7d20c1542994811f47dee94b4650faed7b231af5c5d72bd; CC-BY-4.0}
}
```

## Licence

Data: CC-BY-4.0. Cite as: CSOAI Ltd (Council of AI), *Remote MCP endpoint census, v0.2 (2026-09-26)*, csoai/mcp-remote-census (the 2026-09-25 read: *measured read 2026-09-25*).

## Sibling censuses

Two further measured reads from the same 2026-09-25 census frame, each with its own signed record and OpenTimestamps proof
(pending calendar commitment at publication). They are separate populations and are never added to the figures above.

| dataset | what it measures | read state | record.json sha256 |
|---|---|---|---|
| [csoai/hf-mcp-spaces-census](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census) | the 10,822 Hugging Face Spaces tagged mcp-server: Hub API stage for all; initialize + tools/list only for the 2,658 RUNNING Gradio Spaces (sleeping, paused and error Spaces are never requested) | EXHAUSTED | `53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb906e` |
| [csoai/a2a-card-census](https://huggingface.co/datasets/csoai/a2a-card-census) | the 443 a2aregistry listings: agent card served, and card signatures checked under the key the card points to | EXHAUSTED | that dataset's current record.v0.1.1.json: `4a2b46bb42aa727363ca04d8a2cc21ed76b50a4c6937a62f80d6fcfda191af91` (its 0.1 record.json `b290b53d…` superseded) |

This remote-endpoint census refuses every *.hf.space host; the Spaces census exists so those endpoints are measured without waking a sleeping Space.

### Sibling census added 2026-09-25: contract parity

| dataset | what it measures | read state | record.json sha256 |
|---|---|---|---|
| [csoai/mcp-contract-parity](https://huggingface.co/datasets/csoai/mcp-contract-parity) | whether one remote MCP service's public surfaces (registry entry, /.well-known/mcp.json, server card, agent card, x402 manifest, live discovery answers) agree on version, tools, auth, payment and protocol; plus a HOLD list of servers whose registry version changed, re-measured | PARTIAL (5828 of 5828 attempted; some surface reads rate-limited or unanswered; record 0.1.2 relabels the EXHAUSTED of 0.1 / 0.1.1) | current `record.v0.1.2.json` `5a9bedff1b6facbd9e19a1db1282b37fb6cedd9bf6c7dd14aeeeff387eae77ed` (0.1 `45e3fd63…` and 0.1.1 superseded) |

A separate population built on this census's RESPONDED endpoints; never added to the figures above.

## Timestamp status

Checked 2026-09-25T13:46Z by `ots upgrade` on a copy of each published pending proof. A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it. BITCOIN_ATTESTED means the proof carries a BitcoinBlockHeaderAttestation whose commitment (byte-reversed) equals the merkle root of the block header at that height as served by **two independent public sources** (blockstream.info and mempool.space; each raw header also double-SHA256s to the block hash it is served under). No local Bitcoin node was used. Details: `ots-bitcoin-check-2026-09-25.json`.

- `record.json` (sha256 `c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795dce84`): **BITCOIN_ATTESTED at block 968519** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `record.json.bitcoin.ots` (sha256 `7ba5fd4a0b39cd188b4b0df0eaa4426046790303391f4080ae943c22e15d1170`); the published pending proof `record.json.ots` is unchanged.
- `record.v0.1.1.json` (sha256 `fd5c8a7a65f23f7080f2859e386afe474f8a2d1d8316e5be60be4304dff7118a`): **BITCOIN_ATTESTED at block 968527** (also blocks 968533, 968537, via other calendars) (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `record.v0.1.1.json.bitcoin.ots` (sha256 `b95f283e37d1e7624302b01ed823c96576eec0320eef286c9faa5808061a5a55`); the published pending proof `record.v0.1.1.json.ots` is unchanged.
- Reconciliation: an earlier same-day upgrade of the same pending proofs is published under `ots-upgraded/2026-09-25/` (checked against one header source). It commits to the same file digests; calendars can return different block paths, so the heights may differ. Either proof suffices; neither replaces the pending original.

## v0.2 - full population, 2026-09-26

Record `record.v0.2.json` sha256 `a18447e5bb27decbc7d20c1542994811f47dee94b4650faed7b231af5c5d72bd`, signed (Ed25519, `did:web:csoai.org#board-attestation-1`) at 2026-09-26T07:04:34.530Z; OpenTimestamps state **PENDING_CALENDAR_COMMITMENT** at publication (calendar commitment, not a Bitcoin attestation).

**Read state: EXHAUSTED** (superseded by record 0.2.1: the read state is PARTIAL; see Corrections). Every one of the 22,196 remote endpoints the official MCP registry and the Docker MCP catalogue list in the 2026-09-26 frame has exactly one state. EXHAUSTED means every endpoint is accounted for; 1,070 were NOT_ATTEMPTED and are counted with their reasons. It is the population of those two catalogues' remote endpoints, not of all MCP servers.

| state | endpoints |
|---|---|
| RESPONDED | 13,087 |
| AUTH_REQUIRED | 4,948 |
| MCP_ERROR | 65 |
| SSE_ENDPOINT_ONLY | 144 |
| NOT_MCP | 1,411 |
| UNREACHABLE | 1,259 |
| TIMEOUT | 212 |
| NOT_ATTEMPTED | 1,070 |

NOT_ATTEMPTED by reason: robots.txt disallows this path for CSOAI-census: 670; robots.txt HTTP n: treated as disallow-all: 264; templated URL: path needs a caller-supplied value: 123; hf.space: sleep state not checked; a request could wake the Space: 10; rights gate MEASURE_PUBLIC RESTRICTED: advertised address is not public (loopback/private/local): 3.

Where each row comes from: census-v0.2-2026-09-26: 10,039; census-firstparty-2026-09-25: 10,184; census-v0.2-2026-09-26 (not attempted): 944; census-probe-2026-09-25: 903; plan (not contacted): 126. Rows from 2026-09-25 (prober 0.1, legacy initialize requesting 2025-11-25) are reused only when < 48 h old at build; rows from 2026-09-26 are prober 0.2 (MCP 2026-07-28 `server/discover` first, then legacy initialize).

Protocol requested -> negotiated (RESPONDED rows): prober_0.1_rows (2026-09-25, reused): 2025-11-25 -> 2025-11-25 (4,005), 2025-11-25 -> 2025-06-18 (1,146), 2025-11-25 -> 2025-03-26 (285), 2025-11-25 -> 2024-11-05 (257), 2025-11-25 -> 2026-07-28 (109), 2025-11-25 -> 2025-11-05 (3) | prober_0.2_rows (2026-09-26): 2025-11-25 -> 2025-03-26 (4,162), 2025-11-25 -> 2025-11-25 (2,169), 2026-07-28 -> 2026-07-28 (392), 2025-11-25 -> 2025-06-18 (300), 2025-11-25 -> 2024-11-05 (247), 2025-11-25 -> 2026-07-28 (12).

Against v0.1.1 (`record.v0.1.1.json`, the 2026-09-25 top-20% plan), by endpoint: 4,373 in both, 17,823 added (202 new to the catalogues since 2026-09-25), 3 dropped, 15 with a different state. A reused row is the same observation and cannot differ; a change is a different answer at a different moment.

Files: `record.v0.2.json`, `record.v0.2.signed.json`, `record.v0.2.json.ots`, `record.v0.2.ots.json`, `results.v0.2.public.jsonl.gz` (22,196 rows, sha256 `a9b644a17e116c1c6f12c4ecacbb013bab62b3d04f5e84f4715578406984fc70`). Earlier files in this dataset are unchanged.

Never sent: tools/call, resources/read, prompts/get, any credential, any payment. We measure; we do not certify, grade, rank or endorse any server.

<!-- flywheel:revisions:start -->
## Weekly revisions (generated from the records)

Each revision ADDS dated files; nothing published earlier is changed. Changes are listed by name in `CHANGES.<date>.json`.

| date | record | read state | attempted | added | dropped | out of plan | state changed |
|---|---|---|---|---|---|---|---|
| 2026-09-27 | `record.2026-09-27.json` | PARTIAL | 11,382 | 7,714 | 6 | 0 | 210 |
| 2026-10-04 | `record.2026-10-04.json` | PARTIAL | 12,853 | 1,600 | 22 | 3 | 335 |
| 2026-10-11 | `record.2026-10-11.json` | PARTIAL | 14,305 | 1,617 | 57 | 1 | 370 |
| 2026-10-18 | `record.2026-10-18.json` | PARTIAL | 16,394 | 2,386 | 57 | 2 | 245 |
| 2026-10-25 | `record.2026-10-25.json` | PARTIAL | 18,674 | 2,544 | 62 | 2 | 322 |
| 2026-11-01 | `record.2026-11-01.json` | PARTIAL | 21,941 | 4,294 | 52 | 74 | 326 |
<!-- flywheel:revisions:end -->

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Remote MCP endpoint census (current v0.2, 2026-09-26)*. 2026. Hugging Face dataset `csoai/mcp-remote-census`. https://huggingface.co/datasets/csoai/mcp-remote-census

```bibtex
@misc{csoai_mcp_remote_census,
  title        = {Remote MCP endpoint census (current v0.2, 2026-09-26)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/mcp-remote-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
