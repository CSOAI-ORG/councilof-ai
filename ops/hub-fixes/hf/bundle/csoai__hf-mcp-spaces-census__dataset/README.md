---
license: cc-by-4.0
pretty_name: Hugging Face MCP Spaces census (measured read, 2026-09-25)
tags:
- mcp
- model-context-protocol
- huggingface-spaces
- measurement
- census
- council-of-ai
configs:
- config_name: spaces-2026-09-25
  data_files: data/spaces.jsonl.gz
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

# Hugging Face MCP Spaces census - measured read, 2026-09-25

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Every Hugging Face Space tagged `mcp-server` in our 2026-09-25 census frame (10,822 Spaces): its runtime stage
from the Hub API, and - **only for Spaces that were RUNNING Gradio apps at that moment** - what its MCP endpoint answered to
`initialize` and `tools/list`, 2026-09-25T07:16:50Z to 2026-09-25T07:59:36Z, from one network location. Published by Council of AI (CSOAI).
We **measure**. We do not certify, grade, rank or endorse any Space.

**Read state: EXHAUSTED.** All 10,822 planned Spaces reached exactly one state (0 not attempted).
The stage listing walk was EXHAUSTED (11 pages, 10,825 listed Spaces).
The frame is the Spaces that carry the self-declared `mcp-server` tag; it is not a population total of MCP servers on Hugging Face.

Record: `record.json` sha256 `53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb906e`, signed (Ed25519, `did:web:csoai.org#board-attestation-1`) at 2026-09-25T08:22:30.245Z;
OpenTimestamps state **PENDING_CALENDAR_COMMITMENT** at publication. The builder cross-checked the run summary against the row files
(31 checks, all hold) before writing the record.

Siblings: [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) (remote MCP endpoints listed in public catalogues), [csoai/a2a-card-census](https://huggingface.co/datasets/csoai/a2a-card-census).

## 1. States

| state | Spaces | contacted |
|---|---|---|
| RUNTIME_ERROR | 3,059 | no |
| SLEEPING | 3,008 | no |
| RESPONDED | 2,232 | yes |
| PAUSED | 1,251 | no |
| BUILD_ERROR | 759 | no |
| SSE_ENDPOINT_ONLY | 401 | yes |
| CONFIG_ERROR | 46 | no |
| RUNNING_NOT_GRADIO | 35 | no |
| NOT_MCP | 19 | yes |
| STAGE_UNREADABLE | 5 | no |
| ROBOTS_DISALLOWED | 4 | yes |
| TIMEOUT | 1 | yes |
| AUTH_REQUIRED | 1 | yes |
| BUILDING | 1 | no |

## 2. Not contacted, and why

A Space is contacted only if its most recent Hub API stage read (at most 60 s old) said RUNNING and its sdk is gradio. Sleeping, paused and error Spaces are never requested. **8,164 Spaces received no request at all.**

| state | Spaces | why not contacted |
|---|---|---|
| RUNTIME_ERROR | 3,059 | stage is an error; a request could trigger a restart |
| SLEEPING | 3,008 | a request would wake the Space and spend its owner's compute |
| PAUSED | 1,251 | paused by its owner; a request could restart it or is refused |
| BUILD_ERROR | 759 | stage is an error; no app is served |
| CONFIG_ERROR | 46 | stage is an error; no app is served |
| RUNNING_NOT_GRADIO | 35 | RUNNING, but the sdk is not gradio, so there is no documented MCP path to request |
| STAGE_UNREADABLE | 5 | the Hub API gave no stage (HTTP 401 anonymously: private or removed since the frame); without a stage we do not contact |
| BUILDING | 1 | not yet serving; a request could interfere with start-up |

6 Spaces the listing walk showed RUNNING were SLEEPING at the per-id read moments before contact; they were not contacted. This is why SLEEPING is higher in the rows than in the listing walk.

## 3. Contacted Spaces (2,658)

Sent: GET /robots.txt; POST /gradio_api/mcp/ initialize; POST notifications/initialized; POST tools/list (<= 5 pages); DELETE (only if a session id was issued); GET /gradio_api/mcp/ or /gradio_api/mcp/sse with Accept: text/event-stream (endpoint event only). **Never sent:** any request to a Space whose last stage read was not RUNNING, tools/call, resources/read, prompts/get, any credential, any payment, any Gradio /call or /run.
Invariant: Spaces contacted whose last stage read was not RUNNING = **0**
(stage read to first request: median 0.0 s, max 0.98 s).

**Cost to Space owners.** A request to a RUNNING Space does not start it, but it counts as activity and can postpone the Space's sleep timer, so contact can keep a Space awake (and, on paid hardware, billing) longer than it otherwise would have been. Each contacted Space received at most 4 requests to its own host. Requests per contacted Space: 1 requests: 5 Spaces, 2 requests: 2 Spaces, 4 requests: 2,651 Spaces.
10,613 requests to Spaces in total, plus 2,732 Hub API reads (huggingface.co, not the Spaces).

### Tool surface (RESPONDED, tools/list complete)

Units: tools listed by one Space. A sum of tool counts is not a population figure. Method: median = statistics.median; p25/p75 = sorted[min(n-1, int(q*(n-1)+0.5))] (the probe's method).

| n | min | p25 | median | p75 | max | zero tools |
|---|---|---|---|---|---|---|
| 2,231 | 0 | 1 | 2 | 3 | 164 | 3 |

1,616 distinct tool-name sets; the largest identical set is served by 91 Spaces.

### protocolVersion answered (we requested `2025-11-25`)

| protocolVersion | Spaces |
|---|---|
| 2025-11-25 | 1,752 |
| 2025-06-18 | 480 |

**Protocol note.** The current MCP specification revision is 2026-07-28 (checked 2026-09-25). Our prober requested 2025-11-25, an earlier revision. A server answers with the requested version when it supports it, otherwise with one of its own; so this distribution is conditional on our request and says nothing about which Spaces support 2026-07-28.

## 4. Anomalies

- **H1** - 6 Spaces were RUNNING in the listing walk and SLEEPING in the per-id Hub API read made immediately before contact. The per-id read won: none was contacted.
- **H2** - The largest identical tool-name set (1 tool, sha256 6dca3766e1a4f4e1...) is served by 91 Spaces; 1,616 distinct sets over 2,231 complete listings. Duplicated Spaces weight per-Space counts.
- **H3** - serverInfo.version values (e.g. 1.10.1, 1.30.0, 1.29.0, 1.28.1) are not Gradio release numbers; we record them and do not interpret them.
- **H4** - Frame vs today's listing: 5 frame Spaces were no longer listed and 8 listed Spaces were not in the frame; 5 Spaces returned HTTP 401 to an anonymous Hub API read (private or removed) and were not contacted.
- **H6** - 1 contacted Space(s) answered the MCP request with a redirect to another host (*.webhook.site); redirects off the Space's host are never followed, so no request went there. Its subdomain and path are not published (they may be a capture token).
- **H5** - Correction inside the run: the 6 STAGE_UNREADABLE rows re-read with the committed Hub client (bounded-field per-id reads, same-host redirects followed); run 1 had read TabArena/leaderboard unbounded (>1 MB, truncated). 5 remain unreadable: /api/spaces/<id> HTTP 401 anonymously (private or removed since the frame); none was contacted. Transitions: STAGE_UNREADABLE -> RESPONDED 1, STAGE_UNREADABLE -> STAGE_UNREADABLE 5. Run 1 kept (its summary is published; its rows are not).

## 5. What this is not evidence of

- that any Space, tool or operator is safe, secure, correct, maintained, or fit for any purpose
- that a tool does what its name says; tools were listed, never called
- endorsement, ranking, grading, or approval of any Space or owner
- anything about a Space that was not contacted beyond its Hub API stage at that moment
- which MCP protocol revisions a Space supports (see protocol_version)
- a population total of MCP servers on Hugging Face: the frame is the Spaces tagged mcp-server on 2026-09-25, and a tag is self-declared
- reachability or stage at any other moment

## Files

| file | rows | sha256 |
|---|---|---|
| `record.json` | | `53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb906e` |
| `data/spaces.jsonl.gz` | 10822 | `7b9bb0d630444a41f5757499f14e096e0fb37431c69aed6ebbc2aa0ba415088c` |
| `run/summary.json` |  | `3fc79168dc18bac63c2c5ce276289c0177e14c70ada6cf98ad8886acbac9e672` |
| `run/summary.run1.json` |  | `19204b1e8c1f41a0ee070f169c7d0be144ac13932d8a793c919e41239920b6f1` |
| `run/listing-pages.json` |  | `9f4b2018d7acfa29ed9b90ddd611ea5eec06c5a323b5aea64b630434820788f2` |

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state).
Rows in `data/spaces.jsonl.gz` carry: rank, tier, id, likes_frame, sdk, stage, stage_source, state, reason, contacted, requests_to_space, endpoint, transport, http_status, protocol_version, tools_list_status, tools_complete, n_tools, tool_names_sha256. They carry **no** tool names, tool descriptions or serverInfo;
`tool_names_sha256` is sha256 of the sorted tool names joined by `\n`, UTF-8. `contacted` is false for every Space that received no request.

## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8.
Its sha256 must equal `signature.payload_sha256`. `payload.artifact.sha256` must equal sha256 of `record.json`, and
`payload.published_files` pins every data file by sha256. Verify `signature.sig_ed25519` (hex) over those bytes with the
Ed25519 key `#board-attestation-1` (`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json.
Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
for f, h in s["payload"]["published_files"].items():
    assert hashlib.sha256(open(f, "rb").read()).hexdigest() == h, f
# csoai.org answers 403 to Python's default User-Agent, so send a named one
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"})))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
pk = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # must pass
from cryptography.exceptions import InvalidSignature
try:                                                          # control: one extra byte must fail
    pk.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c + b" ")
    raise SystemExit("CONTROL VERIFIED - do not trust this check")
except InvalidSignature:
    pass
```

**Timestamp.** `pip install opentimestamps-client`, then `ots upgrade record.json.ots` and `ots verify record.json.ots`
(verification needs a Bitcoin node or a block explorer). At publication the proof held 3 pending
calendar attestations from https://alice.btc.calendar.opentimestamps.org, https://bob.btc.calendar.opentimestamps.org, https://finney.calendar.eternitywall.com: a **pending calendar commitment, not a Bitcoin
attestation**. It proves nothing about time until it is upgraded and verified against the chain.

Without a Bitcoin node (a full `ots verify` needs one), check an upgraded proof offline and compare the merkle root with a
public block explorer (two independent ones is better):

```sh
# (a pending proof must first be upgraded: ots upgrade <proof>)
ots --no-bitcoin verify -f record.json record.json.bitcoin.ots
# -> "To verify manually, check that Bitcoin block H has merkleroot M"
B=$(curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block-height/H)
curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# must print M; repeat against https://blockstream.info/api/...
```

## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the Space id or endpoint you mean.
- **Ask for a re-check.** Reply with the Space id or endpoint. We re-measure it with the same read-only instrument and run a tamper
  control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future probing.** Name the Space id or endpoint. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. The reader behind this dataset (`the HF Spaces census probe`) does not yet read that list in code; until it does, an entry is honoured by hand before the next run, and the skip is still recorded by name.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Citation

```bibtex
@misc{csoai_hf_mcp_spaces_census_2026,
  author       = {{Council of AI (CSOAI)}},
  title        = {Hugging Face MCP Spaces census: measured read of 2026-09-25},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hf-mcp-spaces-census}}
}
```

## Licence

Data: CC-BY-4.0. Cite as: Council of AI (CSOAI), *Hugging Face MCP Spaces census, measured read 2026-09-25*, csoai/hf-mcp-spaces-census.

## Timestamp status

Checked 2026-09-25T13:46Z by `ots upgrade` on a copy of each published pending proof. A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it. BITCOIN_ATTESTED means the proof carries a BitcoinBlockHeaderAttestation whose commitment (byte-reversed) equals the merkle root of the block header at that height as served by **two independent public sources** (blockstream.info and mempool.space; each raw header also double-SHA256s to the block hash it is served under). No local Bitcoin node was used. Details: `ots-bitcoin-check-2026-09-25.json`.

- `record.json` (sha256 `53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb906e`): **BITCOIN_ATTESTED at block 968527** (also blocks 968533, 968537, via other calendars) (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `record.json.bitcoin.ots` (sha256 `63425c7f98d07ce274d9ab4e50569fef04dce4d1e7a618a9bdfa0737e12b0b08`); the published pending proof `record.json.ots` is unchanged.
- Reconciliation: an earlier same-day upgrade of the same pending proofs is published under `ots-upgraded/2026-09-25/` (checked against one header source). It commits to the same file digests; calendars can return different block paths, so the heights may differ. Either proof suffices; neither replaces the pending original.

<!-- flywheel:revisions:start -->
## Weekly revisions (generated from the records)

Each revision ADDS dated files; nothing published earlier is changed. Changes are listed by name in `CHANGES.<date>.json`.

| date | record | read state | attempted | added | dropped | out of plan | state changed |
|---|---|---|---|---|---|---|---|
| 2026-09-27 | `record.2026-09-27.json` | EXHAUSTED | 10,888 | 94 | 28 | 0 | 1,016 |
| 2026-10-04 | `record.2026-10-04.json` | EXHAUSTED | 11,136 | 319 | 71 | 0 | 1,272 |
| 2026-10-11 | `record.2026-10-11.json` | EXHAUSTED | 11,394 | 318 | 60 | 0 | 1,241 |
| 2026-10-18 | `record.2026-10-18.json` | EXHAUSTED | 11,666 | 330 | 58 | 0 | 1,231 |
| 2026-10-25 | `record.2026-10-25.json` | EXHAUSTED | 11,929 | 337 | 74 | 0 | 1,178 |
| 2026-11-01 | `record.2026-11-01.json` | EXHAUSTED | 12,194 | 340 | 75 | 0 | 1,295 |
<!-- flywheel:revisions:end -->

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Hugging Face MCP Spaces census (measured read, 2026-09-25)*. 2026. Hugging Face dataset `csoai/hf-mcp-spaces-census`. https://huggingface.co/datasets/csoai/hf-mcp-spaces-census

```bibtex
@misc{csoai_hf_mcp_spaces_census,
  title        = {Hugging Face MCP Spaces census (measured read, 2026-09-25)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/hf-mcp-spaces-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
