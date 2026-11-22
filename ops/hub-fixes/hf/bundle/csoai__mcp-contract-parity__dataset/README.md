---
license: cc-by-4.0
pretty_name: MCP contract parity (25 Sep 2026; current record 0.1.2)
tags:
- mcp
- model-context-protocol
- measurement
- interoperability
- x402
- a2a
- council-of-ai
configs:
- config_name: rows-v0.1.2
  default: true
  data_files: rows.v0.1.2.viewer.parquet
dataset_info:
- config_name: rows-v0.1.2
  features:
  - name: endpoint
    dtype: string
  - name: host
    dtype: string
  - name: inclusion
    dtype: string
  - name: in_watch_list
    dtype: bool
  - name: own_estate
    dtype: bool
  - name: shared_origin
    dtype: bool
  - name: attempted
    dtype: bool
  - name: registry_ids
    dtype: string
  - name: live_state
    dtype: string
  - name: live_http_status
    dtype: int64
  - name: live_protocol_version
    dtype: string
  - name: live_protocol_version_requested
    dtype: string
  - name: live_n_tools
    dtype: int64
  - name: live_tools_complete
    dtype: bool
  - name: live_tools_list_status
    dtype: string
  - name: live_tool_names_sha256
    dtype: string
  - name: live_server_version
    dtype: string
  - name: live_probe_source
    dtype: string
  - name: live_finished
    dtype: string
  - name: VERSION_state
    dtype: string
  - name: VERSION_reason
    dtype: string
  - name: VERSION_detail
    dtype: string
  - name: TOOLS_state
    dtype: string
  - name: TOOLS_reason
    dtype: string
  - name: TOOLS_detail
    dtype: string
  - name: AUTH_state
    dtype: string
  - name: AUTH_reason
    dtype: string
  - name: AUTH_detail
    dtype: string
  - name: PAYMENT_state
    dtype: string
  - name: PAYMENT_reason
    dtype: string
  - name: PAYMENT_detail
    dtype: string
  - name: PROTOCOL_state
    dtype: string
  - name: PROTOCOL_reason
    dtype: string
  - name: PROTOCOL_detail
    dtype: string
  - name: row_json
    dtype: string
size_categories:
- 1K<n<10K
# TODO task_categories: Growth proposes question-answering (verify against content)
# TODO language: Growth proposes en (verify)
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

> **Current record: 0.1.2** (26 Sep 2026) — `record.v0.1.2.json`, sha256 `5a9bedff1b6facbd9e19a1db1282b37fb6cedd9bf6c7dd14aeeeff387eae77ed`, signed 2026-09-26T07:32:39.698Z.
> It supersedes `record.v0.1.1.json` (0.1.1, sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`), which superseded `record.json` (0.1, sha256
> `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`). Both stay published byte for byte. **Every figure above the Corrections section is 0.1.2**; the
> dataset viewer loads the 0.1.2 rows. Earlier card text is kept verbatim at the end, collapsed.

# MCP contract parity — measured read, 25 September 2026 (record 0.1.2)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

**Question.** Does one remote MCP service tell a relying agent **one** current contract? A relying agent learns a
service's contract from several public surfaces — the MCP Registry entry, `/.well-known/mcp.json`, the server card,
the A2A agent card, the x402 manifest, and what the endpoint itself answers at discovery. When they disagree, the
agent cannot infer which one is current. This dataset records, per endpoint and per dimension, whether they agree.

Measurement, not certification. Nothing here grades a vendor. An `INCONSISTENT` row says two public statements
disagree and quotes both; it does not say which is right.

## Our own endpoint first (0.1.2)

| dimension | state | detail |
|---|---|---|
| VERSION | CONSISTENT |  |
| TOOLS | CONSISTENT |  |
| AUTH | CONSISTENT |  |
| PAYMENT | CONSISTENT | all 13 tools the x402 manifest names are in the live tools/list |
| PROTOCOL | SINGLE_SURFACE | no surface declares an MCP protocol version |

## Read state: **PARTIAL**

5828 of 5828 planned endpoints attempted, but not every surface answered:
247 endpoints had at least one surface read that did not answer
(41 of them behind an HTTP 429 stop), by state: ERROR 123, NOT_FETCHED 24, NOT_FETCHED (after HTTP 429 stop) 104, RATE_LIMITED 41, TIMEOUT 64, UNREACHABLE 181.
Rule: EXHAUSTED only if every planned endpoint's surfaces were attempted AND every surface read that was tried answered (no RATE_LIMITED, TIMEOUT, UNREACHABLE, non-2xx ERROR, or NOT_FETCHED after the origin failed); anything else is PARTIAL (0.1.2; 0.1 and 0.1.1 counted attempts only). Records 0.1 and 0.1.1 said EXHAUSTED; that label counted attempts only.
Population: auth_required+advertises_x402_or_a2a 20, responded 5807, watch_list 1. endpoints the 25 Sep 2026 census probe saw RESPOND (top-20% and first-party plans), plus AUTH_REQUIRED endpoints whose registry entry advertises x402 or an A2A card, plus the endpoints of registry entries named in an external watch list. Counts are over attempted endpoints of this plan: not frame totals, not population totals, never summed with other censuses.

## Per-dimension states, 0.1.2 (attempted endpoints)

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| VERSION | 3163 | 2644 | 20 | 1 |
| TOOLS | 908 | 219 | 4424 | 277 |
| AUTH | 928 | 5 | 4332 | 563 |
| PAYMENT | 112 | 4 | 558 | 5154 |
| PROTOCOL | 459 | 33 | 4909 | 427 |

Endpoints with at least one INCONSISTENT dimension: **2764** (0.1.1: 2768; 0.1: 2778).

UNCHECKABLE, by reason:
- **VERSION**: `SURFACE_UNREAD` 1
- **TOOLS**: `DECLARED_COUNT_SCOPE_UNSTATED` 1, `LIVE_TOOL_LIST_UNAVAILABLE` 158, `SUBSET_UNDER_AUTH` 7, `SURFACE_UNREAD` 111
- **AUTH**: `DECLARED_REQUIRED_SCOPE_UNSTATED` 406, `DECLARED_SCOPES_DIFFER` 18, `DISCOVERY_NOT_AUTH_OBSERVABLE` 3, `SURFACE_UNREAD` 136
- **PAYMENT**: `NO_PAYMENT_SURFACE` 5140, `SURFACE_UNREAD` 14
- **PROTOCOL**: `DECLARED_VERSION_NOT_REQUESTED` 247, `NO_NEGOTIATED_VERSION` 2, `NO_PROTOCOL_SURFACE` 22, `SURFACE_UNREAD` 156

## Method (0.1.2)

Surfaces, fetched GET-only from each endpoint's origin (robots.txt honoured for the product token `CSOAI-census`,
at most one connection and one request per second per host, User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)`):
`/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` (and any server-card URL the registry entry declares),
`/.well-known/agent-card.json`, `/.well-known/x402.json`, and a `/health` or `/version` URL **only** when the registry
entry or a fetched surface names it. Registry entries come from the census frame's full read of the official MCP Registry;
live answers come from the same day's read-only census probe (the first-party part is published under `probe/`, below).
No tool was called, no credential or payment sent.

- **Attribution.** An origin-level document is credited to an endpoint only if the origin serves one server in the census
  frame and the document does not describe another endpoint mount there, or the document names the endpoint.
- **VERSION** — registry `server.version`, live `serverInfo.version` and card `serverInfo.version` only (the registry schema
  defines them as the same thing); every other version string is recorded, not adjudicated.
- **TOOLS** — declared tool lists / counts vs the live credential-free `tools/list`. Compared as supersets when a surface names
  a public tool list, or when auth is declared required (`SUBSET_UNDER_AUTH` if the declaration holds every live tool and more);
  a bare count above live with a live dispatcher tool is not compared.
- **AUTH** — a registry remote header's `isRequired` and a card's `authentication.required` are claims of different scope, in
  both directions; they are adjudicated only through the observed discovery boundary (`DECLARED_SCOPES_DIFFER` otherwise).
- **PAYMENT** — presence parity only. **PROTOCOL** — declared MCP protocol versions vs the negotiated one.
- **Unread surfaces** — a dimension that only one surface speaks to, while another surface that could speak was tried and did
  not answer, is `UNCHECKABLE (SURFACE_UNREAD)`, not `SINGLE_SURFACE`.

## HOLD watcher

Every server whose registry `server.version` changed between reads is listed in `hold.jsonl.gz`, re-probed where possible:

| | n |
|---|---|
| HOLD_UNTIL_REMEASURED | 85 |
| REMEASURED_CHANGED | 6 |
| REMEASURED_NO_BASELINE | 14 |
| REMEASURED_SAME | 60 |
| REMEASURE_INCONCLUSIVE | 8 |

## What this does NOT show

- runtime auth enforcement beyond the discovery boundary (initialize + tools/list); tools/call is never sent
- backend behaviour, tool correctness, safety, or quality of any service or vendor
- which surface is right: an INCONSISTENT row says two public statements disagree, not which one is true
- anything from documentation prose, except a registry description's literal mention of x402 (payment presence only)
- anything about endpoints not in the plan or not attempted
- simultaneity: live answers and documents were read hours apart (see timing); a deploy in between can show as INCONSISTENT

## Files (sha256)

| file | status | sha256 |
|---|---|---|
| `correction.v0.1.1.evidence.json` | 0.1.1 (superseded) | `2f9f1c7d6da86da5ba9e4b00f271eb6750908dc744f4f92e0d0bbc278d2382e4` |
| `correction.v0.1.2.evidence.json` | current | `4aeb29819d605c018e51e656898a430deb1972e9f3728ef5affcd4f984e60fc2` |
| `hold.jsonl.gz` | HOLD watcher | `ec0a40f009eb571f766ccb71fa8b54cf1b6569d67ac2c68cb246a82f1b62f105` |
| `ots-bitcoin-check-2026-09-25.json` | 0.1 (superseded) | `1579b97378406ff46e4f0c1a9925b5c0dcf42e817c8a6292c5844b5235bb68a8` |
| `ots-bitcoin-check-2026-09-26.json` | current | `cb4df3c004adb4b67b90599870a4b4cf46cbaae2e1bf1877ef6b51bde9a3bc3f` |
| `probe/census-firstparty-2026-09-25.not_attempted.jsonl.gz` | current | `41f1295ad9dddfa4f38ae6086e9b35f2a9be0968d683176a265ab452dab7da5c` |
| `probe/census-firstparty-2026-09-25.plan.json` | current | `1ec209dc4401777924d11bb8b87c9b50f6aec57da45012ce240c8811b6defefa` |
| `probe/census-firstparty-2026-09-25.results.public.jsonl.gz` | current | `3c49a49038aeb0e131cfce423c143b37ce20844d012f140c32b13927c4b9676e` |
| `probe/census-firstparty-2026-09-25.summary.json` | current | `6b0b5ca7757b2952202bd5dc854918427dbd7692d1f83aaa61dbfc589eb35379` |
| `probe/record.firstparty-2026-09-25.json` | current | `f338012c259fe9790fc5cbb338447fae15078970b35b80cd037aa25fe3f7c212` |
| `probe/record.firstparty-2026-09-25.json.ots` | current | `159adde3f00bcd02600f2093cbcf6d6f40cf335a87ca5208ec5cb4c63dc6e9f7` |
| `probe/record.firstparty-2026-09-25.ots.json` | current | `67cab2c46d3b5a7b45fc9abddaa56e3ea86bbe05f3e5e0480806064397167498` |
| `probe/record.firstparty-2026-09-25.signed.json` | current | `165b534d70669e98c244c4aaee898c8548b1b7b1560d6be3c83441efa419c5c4` |
| `record.json` | 0.1 (superseded) | `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323` |
| `record.json.bitcoin.ots` | 0.1 (superseded) | `e38d524655a32a8acdca3be872165b3933dbfcdff8ea1ca3354d61a7f6d2e989` |
| `record.json.ots` | 0.1 (superseded) | `c168264381e3f2ed4af313c9315834c875dc62cb0b223c3020b8e8498fa505dd` |
| `record.ots.json` | 0.1 (superseded) | `6478a681448ee98800ea3cd35acac77b6c7c51e3d427acedecb31c71a00f4d70` |
| `record.signed.json` | 0.1 (superseded) | `58458051bb7b1db6a5d32f22ee08ad345434c8e57df74e4d62deab713904d5fa` |
| `record.v0.1.1.json` | 0.1.1 (superseded) | `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8` |
| `record.v0.1.1.json.bitcoin.ots` | 0.1.1 (superseded) | `7d163760e8304f4b64825cb44080a2022d2a7abe57bd195cc785421fb62b4209` |
| `record.v0.1.1.json.ots` | 0.1.1 (superseded) | `8b8190b7fa2cb07a777a6d77f631d6b2ad47bbc27f1e0279bfa16bf0cd747a51` |
| `record.v0.1.1.ots.json` | 0.1.1 (superseded) | `5b3ee53081188bc937a3017c5dcac26721d020512a2baabb84947055f05c21f3` |
| `record.v0.1.1.signed.json` | 0.1.1 (superseded) | `87e624558cd5b45df9357c6893e2f5dccdff1ea95b859375f03ae98465564e71` |
| `record.v0.1.2.json` | current | `5a9bedff1b6facbd9e19a1db1282b37fb6cedd9bf6c7dd14aeeeff387eae77ed` |
| `record.v0.1.2.json.ots` | current | `8425658e4921988f61841f4b6408d7533670fc311cfd8322e2d61bfd4bc55162` |
| `record.v0.1.2.ots.json` | current | `76befd3d81c4e5a68a8ae12f2530e893573dc9a278edd782faf3a50a090de926` |
| `record.v0.1.2.signed.json` | current | `e3cf8123c13ac9a6ddc494f93f8fbfcb2901c00f5fee5897e400e3cbbc46d096` |
| `rows.jsonl.gz` | 0.1 (superseded) | `92b0fae322d9711b3ea1700401caacc27b9f59a7dee872f3c14404018691edca` |
| `rows.v0.1.1.jsonl.gz` | 0.1.1 (superseded) | `eeeb2a0d9ae471ce6a980165e9022551116a00f3c0b3c8c010e9bba7e95de075` |
| `rows.v0.1.2.jsonl.gz` | current | `8fb15bcbb83db1ae6a61945c2f870a16d27adcc751c059439e63d8e910730492` |
| `rows.v0.1.2.viewer.parquet` | current | `3f502531b211d528a382bb948d238be6ddd145c3f6e2fa19ed988b2a4402ceae` |

Rows carry quoted values for conflicts only; tool names appear only as sha256 digests, counts, and at most 5 differing
names where a declared list and the live list disagree.

## First-party probe (`probe/`)

5296 of the 5828 parity rows take their live answer from the first-party
census probe (`live.probe_source` = `census-firstparty-2026-09-25`). It is published here so that evidence is visible:
`probe/census-firstparty-2026-09-25.results.public.jsonl.gz` (10187 attempted endpoints) and
`probe/census-firstparty-2026-09-25.not_attempted.jsonl.gz` (649), with the probe's own summary
and plan metadata. Same public fields as `csoai/mcp-remote-census`: `rank`, `ranked_by`, `endpoint`, `host`, `state`, `reason`, `http_status`, `transport`, `protocol_version`, `tools_list_status`, `tools_complete`, `n_tools`, `tool_names_sha256`, `started`, `finished`.
Not published: tool names, tool descriptions, serverInfo, capabilities, raw exchanges, response bodies. Rights gate (`MEASURE_PUBLIC`): a row is published only if a registry listing that advertises the endpoint has MEASURE_PUBLIC ALLOWED and none RESTRICTED, and no exclusion names it; withheld:
none. All 5296 citing parity rows match their
probe row on every live field they use. Signed record: `probe/record.firstparty-2026-09-25.json` (+ `.signed.json`, `.json.ots`).

## How to verify

**Signature.** In `record.v0.1.2.signed.json`: serialise `payload` as JSON with keys sorted, no whitespace, UTF-8; its sha256 must equal
`signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `record.v0.1.2.json`; verify `signature.sig_ed25519` (hex)
with the Ed25519 key `#board-attestation-1` in https://csoai.org/.well-known/did.json. Change one byte of the payload and it
must fail. csoai.org answers 403 to Python's default User-Agent, so the snippet sends a named one.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
UA = {"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"}
s = json.load(open("record.v0.1.2.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.v0.1.2.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers=UA)))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
print("signature verifies")
```

**Timestamp.** A full `ots verify` needs a Bitcoin node. Without one (`pip install opentimestamps-client`):

```sh
ots --no-bitcoin verify -f record.v0.1.2.json record.v0.1.2.json.ots
# -> "To verify manually, check that Bitcoin block H has merkleroot M" (one line per attestation)
```

then check each block's merkle root against a public block explorer (two independent ones is better):

```sh
H=<height>; B=$(curl -s -A "csoai-dataset-verify/1.0" https://mempool.space/api/block-height/$H)
curl -s -A "csoai-dataset-verify/1.0" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# repeat with https://blockstream.info/api/... ; the value must equal M
```

At publication `record.v0.1.2.json.ots` held 3 pending calendar attestations: a pending calendar commitment, not a Bitcoin attestation.

## Timestamp status

A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it.
BITCOIN_ATTESTED means each BitcoinBlockHeaderAttestation's commitment equals the merkle root of the block header at that
height as served by two independent public sources (blockstream.info, mempool.space), and each raw header double-SHA256s to
the block hash it is served under. No local Bitcoin node was used.

- `record.json` (0.1, sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`): **BITCOIN_ATTESTED** at block 968549 (upgraded proof `record.json.bitcoin.ots`, sha256 `e38d524655a32a8acdca3be872165b3933dbfcdff8ea1ca3354d61a7f6d2e989`, published 25 Sep; re-checked 2026-09-26T05:43:56Z against blockstream.info and mempool.space).
- `record.v0.1.1.json` (0.1.1, sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`): **BITCOIN_ATTESTED** at blocks 968624, 968635, 968626 (upgraded proof `record.v0.1.1.json.bitcoin.ots`, sha256 `7d163760e8304f4b64825cb44080a2022d2a7abe57bd195cc785421fb62b4209`, new 2026-09-26); the pending `record.v0.1.1.json.ots` is unchanged.
- `record.v0.1.2.json` and `probe/record.firstparty-2026-09-25.json`: pending calendar commitments (3 calendars) at publication.
Details: `ots-bitcoin-check-2026-09-26.json` (and `ots-bitcoin-check-2026-09-25.json` for the 25 Sep check).

## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the endpoint, card or row you mean.
- **Ask for a re-check.** Reply with the endpoint (or card URL). We re-measure it with the same read-only instrument and run a
  tamper control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future probing.** Name the endpoint or host. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), which the next run honours before sending any
  request (no robots.txt fetch, no discovery call) and records the skip by name. `scripts/census/mcp-remote-probe.py` and `scripts/census/contract-parity.py` read the list and skip a named endpoint or host before any request, with a test and a must-fail control (lane branch lane/contract-parity-fix-20260926, commit e087664, not yet merged); until that code runs on every probe host, entries are also honoured by hand.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Citation

```bibtex
@misc{csoai_mcp_contract_parity_2026,
  author       = {{Council of AI (CSOAI)}},
  title        = {MCP contract parity: measured read of 2026-09-25, record 0.1.2},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/mcp-contract-parity}},
  note         = {record.v0.1.2.json sha256 5a9bedff1b6facbd9e19a1db1282b37fb6cedd9bf6c7dd14aeeeff387eae77ed}
}
```

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *MCP contract parity, measured read 2026-09-25, record 0.1.2*, csoai/mcp-contract-parity.

## Sibling censuses

- [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) — the read-only remote MCP probe (top-20% plan).

## Corrections

### 30 September 2026 — ZenSched VERSION finding closed (vendor fixed)

The 25 Sep read recorded `https://mcp.zensched.com/mcp` (com.zensched/zensched) as VERSION INCONSISTENT: live initialize serverInfo.version 1.27.0 against registry server.version 1.0.0. Re-read at 2026-09-30T13:20:14Z, all three surfaces state **1.0.0** (registry, initialize serverInfo, server card), so the dimension is now **CONSISTENT**. ZenSched fixed it. The original row is kept below and in the records as what was read then; the signed records are not edited. Evidence: `rereads/2026-09-30/zensched.reread.json`.

### 0.1.2 — 26 September 2026 (supersedes `record.v0.1.1.json`; the 0.1 and 0.1.1 files stay published unchanged)

**Scope:** reclassification only: same plan, same stored surface fetches, same hold re-probe; no new network read. **Why.** a maintainer-persona audit on 26 Sep 2026 (before any notice was sent) found three rules that misread: an asymmetric AUTH scope rule (html2img), a tool list compared exactly under declared auth without a public list (zensched), and unread surfaces counted as silence (251 rows) with a rate-limited run labelled EXHAUSTED. Each was reproduced from the stored 25 Sep bytes: correction.v0.1.2.evidence.json.

**What was wrong, and the fix** (producer `scripts/census/contract-parity.py` 0.1.2, commit `e087664dd86c3b153ee81819cee260477e531511`):
- **D1-AUTH-SUBSET** (TOOLS). 0.1.1: a declared tool list was compared as a superset of the live credential-free tools/list only when a surface also named a public (no-credential) list; otherwise exactly. Why wrong: when auth is declared required, the credential-free listing may be the public subset whether or not the service also publishes a public_tools field (zensched: card n=74, live n=11, every live tool in the card) 0.1.2: with auth declared required on any surface, a list holding every live tool and more (or a bare count above live) is UNCHECKABLE (SUBSET_UNDER_AUTH); still INCONSISTENT when the live list holds a tool the declaration lacks, when a count is below live, or when no auth is declared.
- **D3-SYM** (AUTH). 0.1.1: registry header isRequired false vs card authentication.required true was UNCHECKABLE (DECLARED_SCOPES_DIFFER); the mirror pair, registry header isRequired true vs card authentication.required false, stayed INCONSISTENT. Why wrong: both pairs join a claim about sending one transport header to connect with a card flag of unstated scope. 'Header required, card: not required' with discovery answering without credentials is exactly 'discovery open, tools/call needs auth' -- the same reading 0.1.1 accepted for the other direction. A rule that excuses one direction and not the other is not a rule. 0.1.2: symmetric: a registry-header claim and a card / publisher-provided claim are adjudicated only through the observed discovery boundary. The side saying NOT required (either kind) is INCONSISTENT with a refused discovery; otherwise UNCHECKABLE (DECLARED_SCOPES_DIFFER). Claims of the same kind on two surfaces are still compared directly..
- **D6-SURFACE-UNREAD** (all). 0.1.1: a surface that was tried and did not answer (ERROR, TIMEOUT, RATE_LIMITED, UNREACHABLE, NOT_FETCHED after the origin failed) was treated as silent, so the dimension could be SINGLE_SURFACE; the run was labelled EXHAUSTED because every endpoint was attempted. Why wrong: an unread surface may state exactly the claim that would make a second voice. 251 rows had such a surface (41 of them behind an HTTP 429 stop, 104 surface reads never sent after the stop); 244 carried SINGLE_SURFACE. A rate-limited read is not an exhausted one. 0.1.2: a dimension that would be SINGLE_SURFACE while a surface able to speak to it (mcp.json, server-card; x402 for PAYMENT) was unread is UNCHECKABLE (SURFACE_UNREAD); read_state is EXHAUSTED only if every tried surface answered, else PARTIAL.

**Check.** the 0.1 and 0.1.1 producers re-run over the same inputs reproduce their published rows byte for byte, so every difference below is the 0.1.2 producer change and nothing else. Tests: scripts/census/test_contract_parity.py class Correction012: one fixture per rule with counter-cases that must stay INCONSISTENT; four must-fail controls each restore one 0.1.1 rule and fail the suite; the Correction012 fixtures also fail when run against the 0.1.1 producer.

**VERSION findings re-checked:**
- `https://agentberg.ai/mcp`: VERSION INCONSISTENT (live initialize serverInfo.version = 1.30.0; registry ai.agentberg/agentberg server.version = 0.2.0) — unchanged from 0.1.1
- `https://app.html2img.com/mcp`: VERSION INCONSISTENT (live initialize serverInfo.version = 1.1.0; registry com.html2img/html-to-image server.version = 1.0.0) — unchanged from 0.1.1
- `https://mcp.zensched.com/mcp`: VERSION INCONSISTENT (live initialize serverInfo.version = 1.27.0; registry com.zensched/zensched server.version = 1.0.0) — unchanged from 0.1.1
- **Correction, 30 Sep 2026 — fixed by the vendor.** `https://mcp.zensched.com/mcp` re-read at 2026-09-30T13:20:14Z: registry com.zensched/zensched server.version = 1.0.0, live initialize serverInfo.version = 1.0.0, server card version = 1.0.0. VERSION is now **CONSISTENT**; the 25 Sep finding in the line above is closed. The line above is kept as what was read on 25 Sep. Evidence: `rereads/2026-09-30/zensched.reread.json` (raw responses and sha256 beside it).

**Counts, 0.1.1 → 0.1.2** (attempted endpoints; recomputed from the rows):

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| VERSION | 3163 → 3163 | 2644 → 2644 | 21 → 20 | 0 → 1 |
| TOOLS | 908 → 908 | 226 → 219 | 4535 → 4424 | 159 → 277 |
| AUTH | 928 → 928 | 10 → 5 | 4468 → 4332 | 422 → 563 |
| PAYMENT | 112 → 112 | 4 → 4 | 572 → 558 | 5140 → 5154 |
| PROTOCOL | 459 → 459 | 33 → 33 | 5065 → 4909 | 271 → 427 |

Endpoints with at least one INCONSISTENT dimension: 2768 → 2764.

<details><summary><b>Every changed dimension state, by endpoint: 176 endpoints, 430 states</b> (by cause: D1-AUTH-SUBSET 7, D3-SYM 5, D6-SURFACE-UNREAD 418)</summary>

| endpoint | registry id | dimension | 0.1.1 | 0.1.2 | cause |
|---|---|---|---|---|---|
| `https://mcp.citybook.ai/mcp` | ai.citybook/citybook | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://mcp.datamerge.ai/` | ai.datamerge/mcp | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| `https://duskly.ai/mcp` | ai.duskly/duskly | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://duskly.ai/mcp` | ai.duskly/duskly | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://duskly.ai/mcp` | ai.duskly/duskly | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.limitguard.ai/mcp` | ai.limitguard.api/trust-intelligence | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| `https://signalharness.ai/api/agent/services/mcp` | ai.signalharness/mcp | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://animica.dev/mcp` | io.github.animicaorg/animica | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uk-due-diligence-mcp.fly.dev/mcp` | io.github.paulieb89/uk-due-diligence-mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uk-due-diligence-mcp.fly.dev/mcp` | io.github.paulieb89/uk-due-diligence-mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uk-due-diligence-mcp.fly.dev/mcp` | io.github.paulieb89/uk-due-diligence-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vaaya.ai/mcp` | ai.vaaya/mcp | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://api.velarion.ai/mcp` | ai.velarion/company-intelligence | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://dreamhall.app/mcp` | app.dreamhall/dreamhall | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dreamhall.app/mcp` | app.dreamhall/dreamhall | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dreamhall.app/mcp` | app.dreamhall/dreamhall | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://finn-tannlege.com/mcp` | io.github.slookisen/finn-tannlege-mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://finn-tannlege.com/mcp` | io.github.slookisen/finn-tannlege-mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://finn-tannlege.com/mcp` | io.github.slookisen/finn-tannlege-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mizan-bazar.higgsfield.app/mcp` | app.higgsfield.mizan-bazar/mizan | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mizan-bazar.higgsfield.app/mcp` | app.higgsfield.mizan-bazar/mizan | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mizan-bazar.higgsfield.app/mcp` | app.higgsfield.mizan-bazar/mizan | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.opendealer.app/rpc` | app.opendealer/mcp | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| `https://ownyourai.app/api/mcp` | app.ownyourai/ownyourai | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://ownyourai.app/api/mcp` | app.ownyourai/ownyourai | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://wikijuridica.com.br/mcp` | br.com.wikijuridica/acervo-juridico | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://wikijuridica.com.br/mcp` | br.com.wikijuridica/acervo-juridico | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://wikijuridica.com.br/mcp` | br.com.wikijuridica/acervo-juridico | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://ai-belarus.by/mcp` | by.ai-belarus/registry | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://ai-belarus.by/mcp` | by.ai-belarus/registry | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://ai-belarus.by/mcp` | by.ai-belarus/registry | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://myoutfitters.ca/mcp` | ca.myoutfitters/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://myoutfitters.ca/mcp` | ca.myoutfitters/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://myoutfitters.ca/mcp` | ca.myoutfitters/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.idescat.cat/mcp` | cat.idescat/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.idescat.cat/mcp` | cat.idescat/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-compliance` | cn.savantcat/ai-compliance | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-compliance` | cn.savantcat/ai-compliance | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-compliance` | cn.savantcat/ai-compliance | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-geo` | cn.savantcat/geo-cn | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-geo` | cn.savantcat/geo-cn | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp-geo` | cn.savantcat/geo-cn | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.acuris-geo.com/mcp` | com.acuris-geo/acuris-mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.acuris-geo.com/mcp` | com.acuris-geo/acuris-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adbutler.com/mcp` | com.adbutler/mcp-server | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adbutler.com/mcp` | com.adbutler/mcp-server | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adbutler.com/mcp` | com.adbutler/mcp-server | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://adcreator-ai.com/mcp-ads` | com.adcreator-ai/generate-ad-headlines | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://adcreator-ai.com/mcp-ads` | com.adcreator-ai/generate-ad-headlines | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://adcreator-ai.com/mcp-ads` | com.adcreator-ai/generate-ad-headlines | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adcritter.com/mcp/dev` | com.adcritter/mcp-dev | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adcritter.com/mcp/dev` | com.adcritter/mcp-dev | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.adcritter.com/mcp/dev` | com.adcritter/mcp-dev | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.adminlanding.com/mcp` | com.adminlanding/french-rental-compliance | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.adminlanding.com/mcp` | com.adminlanding/french-rental-compliance | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.adminlanding.com/mcp` | com.adminlanding/french-rental-compliance | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://agentdomainsearch.com/mcp` | com.agentdomainsearch/mcp-server | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://agentdomainsearch.com/mcp` | com.agentdomainsearch/mcp-server | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://agentdomainsearch.com/mcp` | com.agentdomainsearch/mcp-server | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.aiactradar.com/mcp/v1` | com.aiactradar/ai-act-radar | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| `https://www.aiwatercolorgenerator.com/api/mcp` | com.aiwatercolorgenerator/watercolor | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.aiwatercolorgenerator.com/api/mcp` | com.aiwatercolorgenerator/watercolor | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.alleskralle.com/mcp` | com.alleskralle/jobs | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.alleskralle.com/mcp` | com.alleskralle/jobs | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.alleskralle.com/mcp` | com.alleskralle/jobs | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://arc-relay.com/mcp` | com.arc-relay/mcp | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://awardsecrets.com/mcp` | com.awardsecrets/award-availability | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://awardsecrets.com/mcp` | com.awardsecrets/award-availability | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.cadencz.com/mcp` | com.cadencz/cadencz | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://crosswirepay.com/mcp` | com.crosswirepay/crosswire | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.danielsdesignstudio.com/mcp` | com.danielsdesignstudio/mirror-ai-citability | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.danielsdesignstudio.com/mcp` | com.danielsdesignstudio/mirror-ai-citability | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.danielsdesignstudio.com/mcp` | com.danielsdesignstudio/mirror-ai-citability | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dayze.com/api/mcp` | com.dayze/life-context | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dayze.com/api/mcp/key` | com.dayze/life-context | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dayze.com/api/mcp/key` | com.dayze/life-context | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dayze.com/api/mcp/key` | com.dayze/life-context | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dayze.com/api/mcp/key` | com.dayze/life-context | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.metroquadrado.workers.dev/mcp` | br.com.metroquadradosc/metro-quadrado | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.metroquadrado.workers.dev/mcp` | br.com.metroquadradosc/metro-quadrado | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.metroquadrado.workers.dev/mcp` | br.com.metroquadradosc/metro-quadrado | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.debitura.com/mcp` | com.debitura/mcp-server | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dechonet.com/mcp` | com.dechonet/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dechonet.com/mcp` | com.dechonet/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dechonet.com/mcp` | com.dechonet/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.decision-anchor.com/mcp` | com.decision-anchor/da | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.decision-anchor.com/mcp` | com.decision-anchor/da | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.decision-anchor.com/mcp` | com.decision-anchor/da | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.decision-anchor.com/mcp` | com.decision-anchor/da | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defaultverifier.com/mcp` | com.defaultverifier/settlement-witness | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defaultverifier.com/mcp` | com.defaultverifier/settlement-witness | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defaultverifier.com/mcp` | com.defaultverifier/settlement-witness | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defici.com/api/mcp` | com.defici/marketplace | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defici.com/api/mcp` | com.defici/marketplace | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defici.com/api/mcp` | com.defici/marketplace | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://defici.com/api/mcp` | com.defici/marketplace | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.delilahusa.com/` | com.delilahusa/legislation | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.delilahusa.com/` | com.delilahusa/legislation | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dentalsoftwarecompare.com/mcp` | com.dentalsoftwarecompare/site | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dentalsoftwarecompare.com/mcp` | com.dentalsoftwarecompare/site | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://dentalsoftwarecompare.com/mcp` | com.dentalsoftwarecompare/site | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.desafiocomunicacion.com/mcp` | com.desafiocomunicacion/services | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.desafiocomunicacion.com/mcp` | com.desafiocomunicacion/services | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.desafiocomunicacion.com/mcp` | com.desafiocomunicacion/services | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://desaira.com/mcp` | com.desaira/desaira | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://desaira.com/mcp` | com.desaira/desaira | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://desaira.com/mcp` | com.desaira/desaira | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp` | cn.savantcat/answers | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp` | cn.savantcat/answers | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://savantcat.cn/mcp` | cn.savantcat/answers | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://au.hortosapp.com/mcp` | com.hortosapp/au | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://au.hortosapp.com/mcp` | com.hortosapp/au | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://au.hortosapp.com/mcp` | com.hortosapp/au | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.html2img.com/mcp` | com.html2img/html-to-image | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| `https://imergea.com/mcp` | com.imergea/ma-advisory | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://imergea.com/mcp` | com.imergea/ma-advisory | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://imergea.com/mcp` | com.imergea/ma-advisory | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.kernelcad.com/mcp` | com.kernelcad/kernelcad | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.kernelcad.com/mcp` | com.kernelcad/kernelcad | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.kernelcad.com/mcp` | com.kernelcad/kernelcad | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.legendsoflearning.com/mcp` | com.legendsoflearning.app/catalog | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.legendsoflearning.com/mcp` | com.legendsoflearning.app/catalog | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.legendsoflearning.com/mcp` | com.legendsoflearning.app/catalog | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lillytechsystems.com/mcp` | com.lillytechsystems/ai-school | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lillytechsystems.com/mcp` | com.lillytechsystems/ai-school | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lillytechsystems.com/mcp` | com.lillytechsystems/ai-school | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mailcheer.com/api/mcp` | com.mailcheer/mailcheer | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://makespdf.com/api/v1/mcp` | com.makespdf/makespdf | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://makespdf.com/api/v1/mcp` | com.makespdf/makespdf | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mamanida.com/mcp` | com.mamanida/mamanida-mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mamanida.com/mcp` | com.mamanida/mamanida-mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mamanida.com/mcp` | com.mamanida/mamanida-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://medianfi.com/mcp` | com.medianfi/compliance | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://medianfi.com/mcp` | com.medianfi/compliance | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://medianfi.com/mcp` | com.medianfi/compliance | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://overlap-ai.com/api/mcp` | com.overlap-ai/overlap | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://overlap-ai.com/api/mcp` | com.overlap-ai/overlap | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://overlap-ai.com/api/mcp` | com.overlap-ai/overlap | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://playbluffo.com/mcp` | com.playbluffo/bluffo | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://playbluffo.com/mcp` | com.playbluffo/bluffo | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://playbluffo.com/mcp` | com.playbluffo/bluffo | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.precision-concretecoating.com/api/public/mcp` | com.precision-concretecoating/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.precision-concretecoating.com/api/public/mcp` | com.precision-concretecoating/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://app.precision-concretecoating.com/api/public/mcp` | com.precision-concretecoating/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://prismfact.com/mcp` | com.prismfact/hub | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://prismfact.com/mcp` | com.prismfact/hub | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://prismfact.com/mcp` | com.prismfact/hub | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://risetive.com/mcp` | com.risetive/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://risetive.com/mcp` | com.risetive/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://risetive.com/mcp` | com.risetive/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shipshapedata.com/mcp` | com.shipshapedata/shipshape-data | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shipshapedata.com/mcp` | com.shipshapedata/shipshape-data | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shipshapedata.com/mcp/docs` | com.shipshapedata/shipshape-data-docs | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shipshapedata.com/mcp/docs` | com.shipshapedata/shipshape-data-docs | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shipstatic.com/` | com.shipstatic/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shipstatic.com/` | com.shipstatic/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shipstatic.com/` | com.shipstatic/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shonanfarm.com/wp-json/zama/v1/mcp` | com.shonanfarm/zama-bike-kaitori | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shonanfarm.com/wp-json/zama/v1/mcp` | com.shonanfarm/zama-bike-kaitori | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shonanfarm.com/wp-json/zama/v1/mcp` | com.shonanfarm/zama-bike-kaitori | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.shotanvil.com/mcp` | com.shotanvil.api/shotanvil | VERSION | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.shotanvil.com/mcp` | com.shotanvil.api/shotanvil | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shotpulled.com/mcp` | com.shotpulled/shotpulled | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shotpulled.com/mcp` | com.shotpulled/shotpulled | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.shotpulled.com/mcp` | com.shotpulled/shotpulled | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shpbl.com/api/public/mcp` | com.shpbl/repository-audit-and-repair | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://shpbl.com/api/public/mcp` | com.shpbl/repository-audit-and-repair | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siftvo.com/mcp` | com.siftvo/site | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siftvo.com/mcp` | com.siftvo/site | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siftvo.com/mcp` | com.siftvo/site | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.sigaoli.com/mcp` | com.sigaoli/profile | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.sigaoli.com/mcp` | com.sigaoli/profile | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.sigaoli.com/mcp` | com.sigaoli/profile | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigistry.com/mcp` | com.sigistry/plugin-catalog | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigistry.com/mcp` | com.sigistry/plugin-catalog | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigistry.com/mcp` | com.sigistry/plugin-catalog | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.siglume.com/` | com.siglume/mcp-gateway | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.siglume.com/` | com.siglume/mcp-gateway | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigmadiario.com/api/mcp` | com.sigmadiario/datos-argentina | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigmadiario.com/api/mcp` | com.sigmadiario/datos-argentina | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sigmadiario.com/api/mcp` | com.sigmadiario/datos-argentina | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://signatureforever.com/mcp` | com.signatureforever/email-signatures | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.signed.com/investors` | com.signed/investors | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.signed.com/investors` | com.signed/investors | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.signed.com/investors` | com.signed/investors | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siliconfriendly.com/mcp` | com.siliconfriendly/directory | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siliconfriendly.com/mcp` | com.siliconfriendly/directory | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://siliconfriendly.com/mcp` | com.siliconfriendly/directory | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bible.simplecohortllc.com/mcp` | com.simplecohortllc.bible/shepherd-bible-api | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bible.simplecohortllc.com/mcp` | com.simplecohortllc.bible/shepherd-bible-api | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bible.simplecohortllc.com/mcp` | com.simplecohortllc.bible/shepherd-bible-api | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uml.singsk.com/mcp` | com.singsk/uml-plantuml | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uml.singsk.com/mcp` | com.singsk/uml-plantuml | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uml.singsk.com/mcp` | com.singsk/uml-plantuml | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.sinhvu.com/mcp` | com.sinhvu/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sittingly.com/mcp` | com.sittingly/site | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sittingly.com/mcp` | com.sittingly/site | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sittingly.com/mcp` | com.sittingly/site | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://render.skillforge99.com/mcp` | com.skillforge99/render-api | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://render.skillforge99.com/mcp` | com.skillforge99/render-api | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://render.skillforge99.com/mcp` | com.skillforge99/render-api | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skillmd.com/mcp` | com.skillmd/skillmd | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skillmd.com/mcp` | com.skillmd/skillmd | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skillmd.com/mcp` | com.skillmd/skillmd | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skipseek.com/mcp` | com.skipseek/skipseek | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skipseek.com/mcp` | com.skipseek/skipseek | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.skipshit.com/mcp` | com.skipshit/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.skipshit.com/mcp` | com.skipshit/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.skipshit.com/mcp` | com.skipshit/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skitransferquotes.com/mcp` | com.skitransferquotes/site | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skitransferquotes.com/mcp` | com.skitransferquotes/site | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skitransferquotes.com/mcp` | com.skitransferquotes/site | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skyaccess.com/mcp` | com.skyaccess/skyaccess | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skyaccess.com/mcp` | com.skyaccess/skyaccess | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.skyaccess.com/mcp` | com.skyaccess/skyaccess | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skyalo.com/chatgpt/mcp` | com.skyalo/travel-connectivity-guide | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skyalo.com/chatgpt/mcp` | com.skyalo/travel-connectivity-guide | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://skyalo.com/chatgpt/mcp` | com.skyalo/travel-connectivity-guide | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://smartmoney77.com/mcp` | com.smartmoney77/financial-calculators | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://smartmoney77.com/mcp` | com.smartmoney77/financial-calculators | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://smartmoney77.com/mcp` | com.smartmoney77/financial-calculators | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://squallstudio.com/api/mcp` | com.squallstudio/squall-studio | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://squallstudio.com/api/mcp` | com.squallstudio/squall-studio | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sumhound.com/mcp` | com.sumhound/sumhound-mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sumhound.com/mcp` | com.sumhound/sumhound-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.texasratedpros.com/api/mcp` | com.texasratedpros/rankings | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.texasratedpros.com/api/mcp` | com.texasratedpros/rankings | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.texasratedpros.com/api/mcp` | com.texasratedpros/rankings | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.therevenueaireport.com/mcp` | com.therevenueaireport/the-revenue-ai-report | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.therevenueaireport.com/mcp` | com.therevenueaireport/the-revenue-ai-report | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.therevenueaireport.com/mcp` | com.therevenueaireport/the-revenue-ai-report | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.uplika.com/mcp` | com.uplika/uplika | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.uplika.com/mcp` | com.uplika/uplika | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.uplika.com/mcp` | com.uplika/uplika | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.us-bike-travel.com/mcp-public.php` | com.us-bike-travel/touren | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.us-bike-travel.com/mcp-public.php` | com.us-bike-travel/touren | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.us-bike-travel.com/mcp-public.php` | com.us-bike-travel/touren | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vamosalicante.com/mcp` | com.vamosalicante/mcp-server | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vamosalicante.com/mcp` | com.vamosalicante/mcp-server | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.zensched.com/mcp` | com.zensched/zensched | TOOLS | INCONSISTENT | UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| `https://agent-commons.alexlabs.dev/mcp` | dev.alexlabs/agent-commons | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://agent-commons.alexlabs.dev/mcp` | dev.alexlabs/agent-commons | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://agent-commons.alexlabs.dev/mcp` | dev.alexlabs/agent-commons | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://nichedb.dev/mcp` | dev.nichedb/nichedb | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://nichedb.dev/mcp` | dev.nichedb/nichedb | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://nichedb.dev/mcp` | dev.nichedb/nichedb | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://belong.events/functions/v1/mcp-server/mcp` | events.belong/long-events | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://belong.events/functions/v1/mcp-server/mcp` | events.belong/long-events | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://belong.events/functions/v1/mcp-server/mcp` | events.belong/long-events | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://belong.events/functions/v1/mcp-server/mcp` | events.belong/long-events | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://long.events/functions/v1/mcp-server/mcp` | events.long/long-events | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://long.events/functions/v1/mcp-server/mcp` | events.long/long-events | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://long.events/functions/v1/mcp-server/mcp` | events.long/long-events | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://batru.gg/mcp` | gg.batru/batru-mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://batru.gg/mcp` | gg.batru/batru-mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://batru.gg/mcp` | gg.batru/batru-mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://origin.rootz.global/mcp` | global.rootz.origin/filings | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://origin.rootz.global/mcp` | global.rootz.origin/filings | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://tango.applayer.io/mcp` | io.applayer/tango | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://tango.applayer.io/mcp` | io.applayer/tango | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://acuity-scheduling.usefulapi.io/mcp` | io.usefulapi/acuity-scheduling | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://acuity-scheduling.usefulapi.io/mcp` | io.usefulapi/acuity-scheduling | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://aircall.usefulapi.io/mcp` | io.usefulapi/aircall | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://aircall.usefulapi.io/mcp` | io.usefulapi/aircall | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://amberflo.usefulapi.io/mcp` | io.usefulapi/amberflo | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://amberflo.usefulapi.io/mcp` | io.usefulapi/amberflo | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anvil.usefulapi.io/mcp` | io.usefulapi/anvil | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anvil.usefulapi.io/mcp` | io.usefulapi/anvil | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api2pdf.usefulapi.io/mcp` | io.usefulapi/api2pdf | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api2pdf.usefulapi.io/mcp` | io.usefulapi/api2pdf | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://apivideo.usefulapi.io/mcp` | io.usefulapi/apivideo | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://apivideo.usefulapi.io/mcp` | io.usefulapi/apivideo | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://autumn.usefulapi.io/mcp` | io.usefulapi/autumn | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://autumn.usefulapi.io/mcp` | io.usefulapi/autumn | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bannerbear.usefulapi.io/mcp` | io.usefulapi/bannerbear | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bannerbear.usefulapi.io/mcp` | io.usefulapi/bannerbear | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bettermode.usefulapi.io/mcp` | io.usefulapi/bettermode | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bettermode.usefulapi.io/mcp` | io.usefulapi/bettermode | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://betterstack.usefulapi.io/mcp` | io.usefulapi/betterstack | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://betterstack.usefulapi.io/mcp` | io.usefulapi/betterstack | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bird.usefulapi.io/mcp` | io.usefulapi/bird | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://bird.usefulapi.io/mcp` | io.usefulapi/bird | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://braintree.usefulapi.io/mcp` | io.usefulapi/braintree | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://braintree.usefulapi.io/mcp` | io.usefulapi/braintree | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://cronitor.usefulapi.io/mcp` | io.usefulapi/cronitor | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://cronitor.usefulapi.io/mcp` | io.usefulapi/cronitor | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://fireworks.usefulapi.io/mcp` | io.usefulapi/fireworks | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://fireworks.usefulapi.io/mcp` | io.usefulapi/fireworks | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://foxyio.usefulapi.io/mcp` | io.usefulapi/foxyio | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://foxyio.usefulapi.io/mcp` | io.usefulapi/foxyio | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://knowledgeowl.usefulapi.io/mcp` | io.usefulapi/knowledgeowl | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://knowledgeowl.usefulapi.io/mcp` | io.usefulapi/knowledgeowl | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lago.usefulapi.io/mcp` | io.usefulapi/lago | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lago.usefulapi.io/mcp` | io.usefulapi/lago | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lambda-labs.usefulapi.io/mcp` | io.usefulapi/lambda-labs | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lambda-labs.usefulapi.io/mcp` | io.usefulapi/lambda-labs | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://laravel-forge.usefulapi.io/mcp` | io.usefulapi/laravel-forge | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://laravel-forge.usefulapi.io/mcp` | io.usefulapi/laravel-forge | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lemonsqueezy.usefulapi.io/mcp` | io.usefulapi/lemonsqueezy | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lemonsqueezy.usefulapi.io/mcp` | io.usefulapi/lemonsqueezy | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://linear.usefulapi.io/mcp` | io.usefulapi/linear | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://linear.usefulapi.io/mcp` | io.usefulapi/linear | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lob.usefulapi.io/mcp` | io.usefulapi/lob | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://lob.usefulapi.io/mcp` | io.usefulapi/lob | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://loops.usefulapi.io/mcp` | io.usefulapi/loops | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://loops.usefulapi.io/mcp` | io.usefulapi/loops | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://magicbell.usefulapi.io/mcp` | io.usefulapi/magicbell | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://magicbell.usefulapi.io/mcp` | io.usefulapi/magicbell | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mailchimp.usefulapi.io/mcp` | io.usefulapi/mailchimp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mailchimp.usefulapi.io/mcp` | io.usefulapi/mailchimp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mailerlite.usefulapi.io/mcp` | io.usefulapi/mailerlite | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mailerlite.usefulapi.io/mcp` | io.usefulapi/mailerlite | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://maptiler.usefulapi.io/mcp` | io.usefulapi/maptiler | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://maptiler.usefulapi.io/mcp` | io.usefulapi/maptiler | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://maxmind-minfraud.usefulapi.io/mcp` | io.usefulapi/maxmind-minfraud | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://maxmind-minfraud.usefulapi.io/mcp` | io.usefulapi/maxmind-minfraud | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://memberful.usefulapi.io/mcp` | io.usefulapi/memberful | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://memberful.usefulapi.io/mcp` | io.usefulapi/memberful | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://stream.usefulapi.io/mcp` | io.usefulapi/stream | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://stream.usefulapi.io/mcp` | io.usefulapi/stream | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://swell.usefulapi.io/mcp` | io.usefulapi/swell | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://swell.usefulapi.io/mcp` | io.usefulapi/swell | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://tailscale.usefulapi.io/mcp` | io.usefulapi/tailscale | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://tailscale.usefulapi.io/mcp` | io.usefulapi/tailscale | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://twenty.usefulapi.io/mcp` | io.usefulapi/twenty | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://twenty.usefulapi.io/mcp` | io.usefulapi/twenty | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uploadcare.usefulapi.io/mcp` | io.usefulapi/uploadcare | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://uploadcare.usefulapi.io/mcp` | io.usefulapi/uploadcare | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vital.usefulapi.io/mcp` | io.usefulapi/vital | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vital.usefulapi.io/mcp` | io.usefulapi/vital | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://youcanbookme.usefulapi.io/mcp` | io.usefulapi/youcanbookme | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://youcanbookme.usefulapi.io/mcp` | io.usefulapi/youcanbookme | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://zendesk.usefulapi.io/mcp` | io.usefulapi/zendesk | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://zendesk.usefulapi.io/mcp` | io.usefulapi/zendesk | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.uxjobs.io/mcp` | io.uxjobs/jobs | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.uxjobs.io/mcp` | io.uxjobs/jobs | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.uxjobs.io/mcp` | io.uxjobs/jobs | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.xdataapi.io/mcp` | io.xdataapi/xdataapi | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.xdataapi.io/mcp` | io.xdataapi/xdataapi | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.xdataapi.io/mcp` | io.xdataapi/xdataapi | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://zerogex.io/mcp` | io.zerogex/gamma-levels | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://zerogex.io/mcp` | io.zerogex/gamma-levels | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://zerogex.io/mcp` | io.zerogex/gamma-levels | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.bijack.ir/mcp` | ir.bijack/loadboard | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.bijack.ir/mcp` | ir.bijack/loadboard | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.bijack.ir/mcp` | ir.bijack/loadboard | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.cbest.ir/lighting/api/mcp` | ir.cbest/lighting | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.cbest.ir/lighting/api/mcp` | ir.cbest/lighting | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.cbest.ir/lighting/api/mcp` | ir.cbest/lighting | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mink.is/wp-json/mink-mcp/v1/mcp` | is.mink/viking-experience | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mink.is/wp-json/mink-mcp/v1/mcp` | is.mink/viking-experience | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mink.is/wp-json/mink-mcp/v1/mcp` | is.mink/viking-experience | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcpserver.cup24.it/mcp` | it.cup24/availability | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcpserver.cup24.it/mcp` | it.cup24/availability | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcpserver.cup24.it/mcp` | it.cup24/availability | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://heera.it/wp-json/agentimus/v1/mcp` | it.heera/agentimus | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://heera.it/wp-json/agentimus/v1/mcp` | it.heera/agentimus | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://inviaggioallecanarie.it/api/mcp` | it.inviaggioallecanarie/canarie | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://inviaggioallecanarie.it/api/mcp` | it.inviaggioallecanarie/canarie | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://inviaggioallecanarie.it/api/mcp` | it.inviaggioallecanarie/canarie | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.physicalai.jobs/mcp` | jobs.physicalai/physical-ai-jobs | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.physicalai.jobs/mcp` | jobs.physicalai/physical-ai-jobs | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://www.physicalai.jobs/mcp` | jobs.physicalai/physical-ai-jobs | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://addresstozip.jp/mcp` | jp.addresstozip/address-to-zip | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://addresstozip.jp/mcp` | jp.addresstozip/address-to-zip | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://addresstozip.jp/mcp` | jp.addresstozip/address-to-zip | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.afdb.jp/mcp` | jp.afdb/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.afdb.jp/mcp` | jp.afdb/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.afdb.jp/mcp` | jp.afdb/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.agentfeeds.jp/mcp` | jp.agentfeeds.api/agentfeeds | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.agentfeeds.jp/mcp` | jp.agentfeeds.api/agentfeeds | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.agentfeeds.jp/mcp` | jp.agentfeeds.api/agentfeeds | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.agentfeeds.jp/mcp` | jp.agentfeeds.api/agentfeeds | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.avacast.jp/api/v1/mcp` | jp.avacast/avacast | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.avacast.jp/api/v1/mcp` | jp.avacast/avacast | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.contencial.co.jp/` | jp.co.contencial/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.contencial.co.jp/` | jp.co.contencial/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://glyt.net/mcp` | net.glyt/glyt | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.lawyerd.net/takedown` | net.lawyerd/takedown | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.lawyerd.net/takedown` | net.lawyerd/takedown | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.lawyerd.net/takedown` | net.lawyerd/takedown | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api-studio.reogrid.net/studio/mcp` | net.reogrid/studio | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api-studio.reogrid.net/studio/mcp` | net.reogrid/studio | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api-studio.reogrid.net/studio/mcp` | net.reogrid/studio | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://swaptitan.net/mcp` | net.swaptitan/swaptitan | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://swaptitan.net/mcp` | net.swaptitan/swaptitan | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://swaptitan.net/mcp` | net.swaptitan/swaptitan | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://filetourl.org/api/mcp` | org.filetourl/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://filetourl.org/api/mcp` | org.filetourl/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://filetourl.org/api/mcp` | org.filetourl/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://urltopdf.org/api/mcp` | org.urltopdf/webpage-to-pdf | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://urltopdf.org/api/mcp` | org.urltopdf/webpage-to-pdf | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://urltopdf.org/api/mcp` | org.urltopdf/webpage-to-pdf | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.anyskills.ru/` | ru.anyskills/anyskills | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.ru/mcp` | ru.quintadb/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.ru/mcp` | ru.quintadb/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.ru/mcp` | ru.quintadb/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vedarai.ru/api/mcp` | ru.vedarai/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vedarai.ru/api/mcp` | ru.vedarai/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://vedarai.ru/api/mcp` | ru.vedarai/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://buynearby.store/api/v1/mcp-server.php` | store.buynearby/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://buynearby.store/api/v1/mcp-server.php` | store.buynearby/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sleeperhit.studio/api/mcp` | studio.sleeperhit/public-discovery | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://sleeperhit.studio/api/mcp` | studio.sleeperhit/public-discovery | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://phion.systems/mcp` | systems.phion/evidence-engine | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://phion.systems/mcp` | systems.phion/evidence-engine | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://systra.tools/api/mcp` | tools.systra/systra-tools | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://systra.tools/api/mcp` | tools.systra/systra-tools | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.ourway.travel/mcp` | travel.ourway/camino-de-santiago | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.ourway.travel/mcp` | travel.ourway/camino-de-santiago | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.ourway.travel/mcp` | travel.ourway/camino-de-santiago | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.com.ua/mcp` | ua.com.quintadb/mcp | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.com.ua/mcp` | ua.com.quintadb/mcp | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://quintadb.com.ua/mcp` | ua.com.quintadb/mcp | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://latido.wedding/mcp` | wedding.latido/latido | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://latido.wedding/mcp` | wedding.latido/latido | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://latido.wedding/mcp` | wedding.latido/latido | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anamized.grok.me/mcp` | io.github.ANAMIZED/desk | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anamized.grok.me/mcp` | io.github.ANAMIZED/desk | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anamized.grok.me/mcp` | io.github.ANAMIZED/desk | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://anamized.grok.me/mcp` | io.github.ANAMIZED/desk | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://humanlineage.org/api/mcp` | io.github.HumanLineage/wt | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://humanlineage.org/api/mcp` | io.github.HumanLineage/wt | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://humanlineage.org/api/mcp` | io.github.HumanLineage/wt | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.helpmyagent.com/mcp` | io.github.helpmyagent/helpmyagent | TOOLS | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.helpmyagent.com/mcp` | io.github.helpmyagent/helpmyagent | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.helpmyagent.com/mcp` | io.github.helpmyagent/helpmyagent | PAYMENT | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://api.helpmyagent.com/mcp` | io.github.helpmyagent/helpmyagent | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.outdoorithm.com/mcp` | io.github.outdoorithm/outdoorithm | AUTH | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| `https://mcp.outdoorithm.com/mcp` | io.github.outdoorithm/outdoorithm | PROTOCOL | SINGLE_SURFACE | UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |

</details>

### 0.1.1 — 26 September 2026 (supersedes `record.json` 0.1; the 0.1 files stay published unchanged)

`record.v0.1.1.json` (sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`) supersedes `record.json` (sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`).
**Scope:** reclassification only: same plan, same stored surface fetches, same hold re-probe; no new network read. The rows are `rows.v0.1.1.jsonl.gz`; `rows.jsonl.gz`, `record.json`, `record.signed.json`,
`record.json.ots` and `record.ots.json` are kept byte for byte: superseded, not deleted, not edited.

**Why.** the 26 Sep 2026 notice lane re-checked candidates live before any contact and found that the 0.1 rows for immersivecommons (TOOLS), augenix (TOOLS) and klarix (AUTH) misread the service, and that transloadit (AUTH) and toolforte (TOOLS) held reasonable different meanings. All five were INCONSISTENT in 0.1. Reproduced from the stored 25 Sep bytes (each document's sha256 unchanged on the 26 Sep re-read): correction.v0.1.1.evidence.json.

**What was wrong, and the fix** (producer `scripts/census/contract-parity.py` 0.1.1, commit `4037f6bb2b7162b1679301846287b95934a85ad6`):
- **D1** (TOOLS). 0.1: every declared tool list was compared exactly with the live tools/list. Why wrong: the live tools/list is read WITHOUT credentials. A service that names the tools usable without credentials (public_tools, anonymousTools, ...) declares that its unscoped list is its full, partly authenticated surface; an unauthenticated listing may show the public subset or everything. The full list is not a claim about what unauthenticated discovery lists. 0.1.1: with a public-scoped list present, unscoped lists / counts are compared as supersets (every live tool must be in them); the public list is recorded, not compared (it scopes use, not listing).
- **D2a** (attribution (all)). 0.1: an origin's documents were credited to an endpoint whenever the census frame knew one server on that origin. Why wrong: the document itself can say it describes another endpoint mount on the same origin; the origin then serves more than one MCP endpoint and the instrument's own shared-origin rule applies 0.1.1: an MCP document naming another endpoint mount on this origin (and not this endpoint) is not credited; another host (www/apex, a custom domain) or another transport/version path of the same mount is not read as a second endpoint.
- **D2b** (attribution (all)). 0.1: facts were read from every nested block of a credited document. Why wrong: a nested block with its own url and its own tools/transport describes another endpoint (a docs MCP, an apps MCP, a hosted demo) 0.1.1: such a block is removed before facts are read: always when its endpoint is on this origin; on another host only when the document also describes an endpoint of its own outside the block.
- **D3** (AUTH). 0.1: a registry remote header with isRequired false and a card's authentication.required true were paired as a contradiction. Why wrong: isRequired false (the registry omits false; the schema default is false) says the client may CONNECT without the header; the card's 'required' does not say whether it applies to discovery or to tools/call. Two claims of different scope; tools/call is never sent, so which scope the card means is not observed. 0.1.1: UNCHECKABLE (DECLARED_SCOPES_DIFFER); still INCONSISTENT when discovery itself was refused without credentials.
- **D4** (TOOLS). 0.1: a bare declared tool count was compared with the live tool count. Why wrong: when the live list holds a dispatcher (run_tool, call_tool, ...), a count above the live count may count tools reached through it; the count does not say which it counts 0.1.1: not compared; UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) when it is the only declared figure; a count BELOW the live count is still INCONSISTENT.

**Check.** the 0.1 producer (commit d9e0f80) re-run over the same inputs reproduces all 5828 published 0.1 rows byte-identically, so every difference below is the producer change and nothing else. Tests: scripts/census/test_contract_parity.py class Correction011: one fixture per reported case, shapes copied from the stored bytes; five must-fail controls, each restoring one 0.1 rule, fail the suite.

**Rows that change state: 22 endpoints, 26 dimension states.**

| endpoint | registry id | dimension | 0.1 | 0.1.1 | cause |
|---|---|---|---|---|---|
| `https://app.augenix.ai/api/mcp/public` | ai.augenix/build | TOOLS | INCONSISTENT | SINGLE_SURFACE | D2a |
| `https://www.decisionlog.ai/api/mcp` | ai.decisionlog/mcp | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://mcp.myotp.app/mcp` | io.github.brntech/myotp | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://toolforte.com/api/mcp` | io.github.Toinedotcom/toolforte | TOOLS | INCONSISTENT | UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) | D4 |
| `https://scholar-sidekick.com/api/mcp` | io.github.mlava/scholar-sidekick-mcp | TOOLS | INCONSISTENT | CONSISTENT | D2b |
| `https://scholar-sidekick.com/api/mcp` | io.github.mlava/scholar-sidekick-mcp | AUTH | CONSISTENT | SINGLE_SURFACE | D2b |
| `https://mcp.klarix.ai/mcp` | ai.klarix/intelligence | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://ai-visibility.rowb.app/mcp` | app.rowb.ai-visibility/audit | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://auth-posture.rowb.app/mcp` | app.rowb.auth-posture/audit | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://stampcard.rowb.app/mcp` | app.rowb.stampcard/cards | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://veilpoint.ca/mcp` | ca.veilpoint/opportunity-exchange | TOOLS | INCONSISTENT | CONSISTENT | D2b |
| `https://dchub.cloud/mcp/registry` | cloud.dchub/mcp-server | TOOLS | INCONSISTENT | CONSISTENT | D2b |
| `https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp` | com.carsmultiverse/recall-record | TOOLS | CONSISTENT | SINGLE_SURFACE | D2a |
| `https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp` | com.carsmultiverse/recall-record | AUTH | CONSISTENT | SINGLE_SURFACE | D2a |
| `https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp` | com.carsmultiverse/recall-record | PROTOCOL | UNCHECKABLE (DECLARED_VERSION_NOT_REQUESTED) | SINGLE_SURFACE | D2a |
| `https://hotels.flightpowers.com/mcp` | com.flightpowers/booking | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://flights.flightpowers.com/mcp` | com.flightpowers/google-flights | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://www.immersivecommons.com/api/mcp` | com.immersivecommons/floor10 | TOOLS | INCONSISTENT | CONSISTENT | D2b, D1 |
| `https://itsnum.com/mcp` | com.itsnum/num | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://mcp.unifically.com/mcp` | com.unifically/mcp | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://mcp.usecarscout.com/mcp` | com.usecarscout/mcp | TOOLS | INCONSISTENT | CONSISTENT | D1 |
| `https://standoutmcp.io/api/mcp` | io.standoutmcp/standout | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://mcp.btcdecoded.org/mcp` | org.btcdecoded/intelligence | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| `https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp` | site.chatgpt.cursoraikk.agent-arcade-ai/agent-arcade | TOOLS | CONSISTENT | SINGLE_SURFACE | D2a |
| `https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp` | site.chatgpt.cursoraikk.agent-arcade-ai/agent-arcade | AUTH | CONSISTENT | SINGLE_SURFACE | D2a |
| `https://api2.transloadit.com/mcp` | io.github.transloadit/mcp-server | AUTH | INCONSISTENT | UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |

**Counts, 0.1 → 0.1.1** (attempted endpoints; recomputed from the rows):

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| VERSION | 3163 → 3163 | 2644 → 2644 | 21 → 21 | 0 → 0 |
| TOOLS | 905 → 908 | 233 → 226 | 4532 → 4535 | 158 → 159 |
| AUTH | 931 → 928 | 23 → 10 | 4465 → 4468 | 409 → 422 |
| PAYMENT | 112 → 112 | 4 → 4 | 572 → 572 | 5140 → 5140 |
| PROTOCOL | 459 → 459 | 33 → 33 | 5064 → 5065 | 272 → 271 |

Endpoints with at least one INCONSISTENT dimension: 2778 → 2768.
Every other row keeps its 0.1 states.

**Verify.** `record.v0.1.1.signed.json`: Ed25519 under did:web:csoai.org#board-attestation-1 (signed_at 2026-09-26T02:21:40.535Z),
same procedure as above with `record.v0.1.1.json`; its payload also carries `supersedes_sha256`. `record.v0.1.1.json.ots`:
3 pending calendar attestations at publication — a pending calendar commitment, not a Bitcoin attestation.

<details><summary><b>Earlier card text (0.1, 25 Sep 2026), kept verbatim — its figures are superseded</b></summary>

# MCP contract parity — measured read, 25 September 2026

**Question.** Does one remote MCP service tell a relying agent **one** current contract? A relying agent learns a
service's contract from several public surfaces — the MCP Registry entry, `/.well-known/mcp.json`, the server card,
the A2A agent card, the x402 manifest, and what the endpoint itself answers at discovery. When they disagree, the
agent cannot infer which one is current. This dataset records, per endpoint and per dimension, whether they agree.

Measurement, not certification. Nothing here grades a vendor. An `INCONSISTENT` row says two public statements
disagree and quotes both; it does not say which is right.

## Our own endpoint first

The measuring estate runs the same instrument on its own endpoint (`https://councilof.ai/mcp`) and publishes it first:

| dimension | state | quoted |
|---|---|---|
| VERSION | CONSISTENT |  |
| TOOLS | CONSISTENT |  |
| AUTH | CONSISTENT |  |
| PAYMENT | CONSISTENT | all 13 tools the x402 manifest names are in the live tools/list |
| PROTOCOL | SINGLE_SURFACE | no surface declares an MCP protocol version |

## Read state

**EXHAUSTED** — 5828 of 5828 planned endpoints attempted (EXHAUSTED only if every planned endpoint's surfaces were attempted; anything else is PARTIAL).
Population: auth_required+advertises_x402_or_a2a 20, responded 5807, watch_list 1. endpoints the 25 Sep 2026 census probe saw RESPOND (top-20% and first-party plans), plus AUTH_REQUIRED endpoints whose registry entry advertises x402 or an A2A card, plus the endpoints of registry entries named in an external watch list. Counts are over attempted endpoints of this plan: not frame totals, not population totals, never summed with other censuses.

## Per-dimension states (attempted endpoints)

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| VERSION | 3163 | 2644 | 21 | 0 |
| TOOLS | 905 | 233 | 4532 | 158 |
| AUTH | 931 | 23 | 4465 | 409 |
| PAYMENT | 112 | 4 | 572 | 5140 |
| PROTOCOL | 459 | 33 | 5064 | 272 |

Endpoints with at least one INCONSISTENT dimension: **2778**.

UNCHECKABLE, by reason:
- **TOOLS**: `LIVE_TOOL_LIST_UNAVAILABLE` 158
- **AUTH**: `DECLARED_REQUIRED_SCOPE_UNSTATED` 406, `DISCOVERY_NOT_AUTH_OBSERVABLE` 3
- **PAYMENT**: `NO_PAYMENT_SURFACE` 5140
- **PROTOCOL**: `DECLARED_VERSION_NOT_REQUESTED` 248, `NO_NEGOTIATED_VERSION` 2, `NO_PROTOCOL_SURFACE` 22

## Method

Surfaces, fetched GET-only from each endpoint's origin (robots.txt honoured for the product token `CSOAI-census`,
at most one connection and one request per second per host, User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)`):
`/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` (and any server-card URL the registry entry declares),
`/.well-known/agent-card.json`, `/.well-known/x402.json`, and a `/health` or `/version` URL **only** when the registry
entry or a fetched surface names it. The registry entry comes from the census frame's full read of the official MCP
Registry; the live answers (serverInfo, negotiated protocolVersion, tools/list names as a sha256) come from the
same day's read-only census probe. No tool was called, no credential or payment sent.

**Attribution.** An origin-level document is attributed to an endpoint only if the origin serves one server in the
whole census frame, or the document names the endpoint's URL. A gateway's card is not evidence about its tenants.

**Dimensions.**
- **VERSION** — only claims about the same declared thing are compared. The registry schema defines `server.version`
  as *"Version string for this server. SHOULD follow semantic versioning (e.g., '1.0.2', '2.1.0-alpha'). Equivalent of Implementation.version in MCP specification."*, i.e. `serverInfo.version`. Registry, live `initialize` and card `serverInfo.version`
  are compared; every other version string (card top-level `version`, A2A agent version, x402 manifest version,
  `/health` version) is recorded in `other_versions` and not adjudicated. Registry version vs live serverInfo:
  {"differ": 2632, "equal": 3170}.
- **TOOLS** — each declared tool list / count vs the live `tools/list` (sha256 of sorted names, as the probe computes it).
- **AUTH** — declared requirements vs each other and vs the observed discovery boundary. Declared *required* with
  discovery answering without credentials is `UNCHECKABLE (DECLARED_REQUIRED_SCOPE_UNSTATED)`: tools/call is never sent.
- **PAYMENT** — presence parity only: tools an x402 manifest names vs the live tool list; an x402 manifest linking
  this endpoint vs a payment statement on an MCP surface. Silence is not a statement.
- **PROTOCOL** — declared MCP protocol versions vs the negotiated one (conditional on the probe's request, 2025-11-25).

States: `CONSISTENT`, `INCONSISTENT` (both values quoted with surface + path), `SINGLE_SURFACE`, `UNCHECKABLE` (reason code).

## HOLD watcher (version changed -> hold until re-measured)

Registry reads compared: `2026-09-25T04:40:39Z (RAS lane read, file mtime)` -> `2026-09-25T05:45:50Z..05:54:05Z (census frame read)`, `2026-09-25T05:45:50Z..05:54:05Z (census frame read)` -> `2026-09-25T11:25:23Z (frame read + updated_since fetch)`.
Every server whose `server.version` changed between two reads is listed as `HOLD_UNTIL_REMEASURED` in `hold.jsonl.gz`.
Servers with a remote endpoint were then re-probed (read-only, prober 0.2, bounded at 300) and recorded by name as
`REMEASURED_SAME` or `REMEASURED_CHANGED` (tool-name set, auth boundary, or protocol changed vs the last census probe),
or kept on hold with a reason (no remote endpoint; no earlier probe row; not attempted).

| | n |
|---|---|
| HOLD_UNTIL_REMEASURED | 85 |
| REMEASURED_CHANGED | 6 |
| REMEASURED_NO_BASELINE | 14 |
| REMEASURED_SAME | 60 |
| REMEASURE_INCONCLUSIVE | 8 |

## What this does NOT show

- runtime auth enforcement beyond the discovery boundary (initialize + tools/list); tools/call is never sent
- backend behaviour, tool correctness, safety, or quality of any service or vendor
- which surface is right: an INCONSISTENT row says two public statements disagree, not which one is true
- anything from documentation prose, except a registry description's literal mention of x402 (payment presence only)
- anything about endpoints not in the plan or not attempted
- simultaneity: live answers and documents were read hours apart (see timing); a deploy in between can show as INCONSISTENT

## Files

| file | sha256 |
|---|---|
| `record.json` | `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323` |
| `hold.jsonl.gz` | `ec0a40f009eb571f766ccb71fa8b54cf1b6569d67ac2c68cb246a82f1b62f105` |
| `rows.jsonl.gz` | `92b0fae322d9711b3ea1700401caacc27b9f59a7dee872f3c14404018691edca` |

`record.signed.json` (Ed25519 signature, signed_at 2026-09-25T12:25:41.808Z), `record.json.ots` (OpenTimestamps proof),
`record.ots.json` (its stated state). Rows carry quoted values for conflicts only; tool names appear only as
sha256 digests, counts, and at most 5 differing names where a declared list and the live list disagree.

## How to verify

**Signature.** In `record.signed.json`: serialise `payload` as JSON with keys sorted, no whitespace, UTF-8; its
sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `record.json`; verify
`signature.sig_ed25519` (hex) with the Ed25519 key `#board-attestation-1` in https://csoai.org/.well-known/did.json.
Change one byte of the payload and it must fail.

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen("https://csoai.org/.well-known/did.json"))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

**Timestamp.** `ots upgrade record.json.ots` then `ots verify record.json.ots`. At publication the proof held
3 pending calendar attestations (https://alice.btc.calendar.opentimestamps.org, https://bob.btc.calendar.opentimestamps.org, https://finney.calendar.eternitywall.com): a **pending calendar
commitment, not a Bitcoin attestation**.

## Sibling censuses

- [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) — the read-only remote MCP probe these live answers come from.

## Licence

CC-BY-4.0. Cite as: Council of AI (CSOAI), *MCP contract parity, measured read 2026-09-25*, csoai/mcp-contract-parity.

## Timestamp status

Checked 2026-09-25T13:57Z by `ots upgrade` on a copy of each published pending proof. A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it. BITCOIN_ATTESTED means the proof carries a BitcoinBlockHeaderAttestation whose commitment (byte-reversed) equals the merkle root of the block header at that height as served by **two independent public sources** (blockstream.info and mempool.space; each raw header also double-SHA256s to the block hash it is served under). No local Bitcoin node was used. Details: `ots-bitcoin-check-2026-09-25.json`.

- `record.json` (sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`): **BITCOIN_ATTESTED at block 968549** (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `record.json.bitcoin.ots` (sha256 `e38d524655a32a8acdca3be872165b3933dbfcdff8ea1ca3354d61a7f6d2e989`); the published pending proof `record.json.ots` is unchanged.

</details>

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *MCP contract parity (25 Sep 2026; current record 0.1.2)*. 2026. Hugging Face dataset `csoai/mcp-contract-parity`. https://huggingface.co/datasets/csoai/mcp-contract-parity

```bibtex
@misc{csoai_mcp_contract_parity,
  title        = {MCP contract parity (25 Sep 2026; current record 0.1.2)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/mcp-contract-parity},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
