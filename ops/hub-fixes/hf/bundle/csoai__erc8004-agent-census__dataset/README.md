---
license: cc-by-4.0
pretty_name: ERC-8004 agent census (measured read, 2026-09-26)
tags:
- erc-8004
- agents
- mcp
- a2a
- measurement
- census
- council-of-ai
configs:
- config_name: agents-2026-09-26
  data_files: agents.jsonl.gz
- config_name: declared-mcp-probe-2026-09-26
  data_files: probe-mcp.jsonl.gz
- config_name: declared-a2a-probe-2026-09-26
  data_files: probe-a2a.jsonl.gz
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

# ERC-8004 agent census - measured read, 2026-09-26

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Every agent id in the ERC-8004 Identity Registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) on Ethereum, Base and BNB Smart Chain, read with `eth_call` only (no transaction, no key), each with exactly one state. Published by CSOAI Ltd (Council of AI, https://councilof.ai). We **measure**; we do not certify, grade, rank or endorse any agent. Contact, objections and re-checks: nicholas@csoai.org (see below).

**Read state: PARTIAL.** Why:

- the agentURI of EVERY agent id 0..max on the three chains was read on-chain (EXHAUSTED at that level)
- off-chain registration files were fetched only for the top-20% plan, and not all of the plan within the fetch budget (NOT_FETCHED, counted)
- 8004scan's reach listing is capped at offset 10000 (Base truncated: agents with feedback beyond it are ordered by chain order)
- BSC was read at 'latest' across a block window, not at one pinned block (see limits)

Record `record.json` sha256 `60bd9728f22159351feb71ccd6e0c01faab582f0ccf661415e36f339e52d2538`, signed (Ed25519, `did:web:csoai.org#board-attestation-1`) at 2026-09-26T05:31:49.737Z; OpenTimestamps **PENDING_CALENDAR_COMMITMENT** at staging (a calendar commitment, not a Bitcoin attestation).

| chain | agent ids read | read at |
|---|---|---|
| ethereum | 51,458 | finalized block 26,058,367 |
| base | 95,776 | finalized block 51,798,319 |
| bsc | 358,401 | block tag latest across blocks 124,057,093 to 124,061,273 (a window, not one block; see Limits) |

| state | agents |
|---|---|
| DECLARES_ENDPOINT | 13,210 |
| NO_ENDPOINT | 187,513 |
| INVALID_JSON | 2,205 |
| URI_UNREACHABLE | 13,788 |
| NO_URI | 52,469 |
| URI_UNSUPPORTED_SCHEME | 5,436 |
| TOKEN_REVERTED | 0 |
| NOT_FETCHED | 231,014 |

DECLARES_ENDPOINT = a registration JSON object with a services entry named MCP, A2A or web whose endpoint is http(s). NOT_FETCHED (231,014) = a registration file that was not fetched: outside the top-20% plan, or refused by robots.txt, a 429, or a non-public address. It is unmeasured, not absent.

Plan: top ceil(0.2*N) agents: 8004scan total_feedbacks > 0 first (desc), ties and zero-feedback agents in chain order ethereum, base, bsc, then agent id ascending; 101,127 agents, 11,989 of them by 8004scan feedback.

## Declared endpoints probed (discovery only)

- **MCP: PARTIAL.** 2,113 attempted of 2,144 planned (31 not attempted: robots.txt HTTP n: treated as disallow-all (RFC 9309 server error; 429 = slow down) 15; robots.txt disallows this path for CSOAI-census 16). States: RESPONDED 580, AUTH_REQUIRED 32, MCP_ERROR 2, SSE_ENDPOINT_ONLY 3, NOT_MCP 1,092, UNREACHABLE 393, TIMEOUT 11. Sent: robots.txt, server/discover or initialize, tools/list; never tools/call, any credential or any payment.
- **A2A agent cards: EXHAUSTED in the prober's own sense** (every planned card URL has an outcome): 4,389 of 4,389. Not every one was requested: ROBOTS_DISALLOWED 26 and HF_SPACE_NOT_CONTACTED 1 are outcomes without a request. States: CARD_SERVED 886, CARD_INVALID 16, AUTH_REQUIRED 6, NOT_FOUND 3,407, UNREACHABLE 36, TIMEOUT 11, HF_SPACE_NOT_CONTACTED 1, ROBOTS_DISALLOWED 26. Sent: GET of the agent card only; never message/send or any task.
- Distinct endpoints declared: MCP 2,152, A2A 4,399. Declared but not planned (never requested): MCP - not an endpoint URL: unparseable host 1, rights gate MEASURE_PUBLIC RESTRICTED: templated endpoint: needs a caller-supplied value 1, rights gate MEASURE_PUBLIC RESTRICTED: advertised address is not public (loopback/private/local) 7; A2A - rights gate MEASURE_PUBLIC RESTRICTED: templated endpoint: needs a caller-supplied value 4, rights gate MEASURE_PUBLIC RESTRICTED: advertised address is not public (loopback/private/local) 6.

## Limits

- BSC was read at block tag 'latest' across a block WINDOW (window_start .. window_end in chains.bsc.pinned_block), not at one pinned finalized block: both keyless BSC RPCs refused eth_call against a numbered block (rpc-bsc.48.club: 'not supported'; bsc-rpc.publicnode.com: HTTP 403), measured 2026-09-26. Agents registered or re-pointed during the window may be read either side of the change.
- Ethereum and Base were read at one finalized block (number AND hash recorded).
- 8004scan offset cap: Base agents with feedback beyond offset 10000 are ordered by chain order, not by feedback.
- IPFS registration files were fetched only through gateway.pinata.cloud (ipfs.io and dweb.link answered 429 to a single request); a gateway failure is URI_UNREACHABLE, not proof the CID is gone.
- rpc.flashbots.net answered HTTP 403 and was not used; mainnet.base.org was used alongside Tenderly for Base after it matched the pinned block hash.
- fetch.requests is a LOWER BOUND: the fetcher's request counter was updated from 48 threads without a lock, so increments can be lost; per-row outcomes are exact.
- ipfs.io (listed directly as an https host by thousands of agents) answered 429 after one retry and was stopped for the run: those rows are NOT_FETCHED, not unreachable.
- POLITENESS INCIDENT: from 2026-09-26T02:31:28Z to about 03:02Z TWO copies of the classifier/fetcher ran at once (one started by a finisher script, one by this lane's agent), each with its own per-host gate. During that window a registration host could receive up to 2 requests/s instead of <= 1, and some registration files were fetched twice. The agent's copy was stopped at about 03:02Z (SIGTERM); the rows here are from the copy that ran to completion. No endpoint probe (MCP/A2A) was affected.

## Not evidence of

- that any agent is safe, honest, active, owned by who it names, or does what its registration says
- endorsement, ranking, grading or approval of any agent or operator
- anything about agents on other chains or other registries
- a count of distinct operators (ids are not operators)

## Files

| file | rows | sha256 |
|---|---|---|
| `record.json` | - | `60bd9728f22159351feb71ccd6e0c01faab582f0ccf661415e36f339e52d2538` |
| `agents.jsonl.gz` | 505,635 | `eafd6b18313df16a139114347f136afc527d7c349f01e7c348a436657e9b6995` |
| `probe-mcp.jsonl.gz` | - | `16b4d82f02a5570ba95589238f2b7e862be1ca6bd5712d11088f818fc9223a35` |
| `probe-a2a.jsonl.gz` | - | `2e9803edb9fa69ccfced7da563f9373ea135b0ec6d40d355bf05b01c1f27239f` |
| `declared-mcp.jsonl.gz` | - | `03cc39fdee2e6a88918fce7b0aae25abe1029eab81dbc4d2d9c6b0a0c9df5fa8` |
| `declared-a2a.jsonl.gz` | - | `58124a58de5c4926129404e053b089bab75296319512aaae2955190b21dec363` |

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state), `SHA256SUMS` (every file above).

## How to verify

**Signature.** In `record.signed.json`, serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8. Its sha256 must equal `signature.payload_sha256`, and `payload.artifact.sha256` must equal the sha256 of `record.json`. Verify `signature.sig_ed25519` (hex) over those bytes with the Ed25519 key `#board-attestation-1` in https://csoai.org/.well-known/did.json. Fetch it with a named User-Agent: the default Python-urllib one is refused (403).

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("record.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("record.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "erc8004-agent-census-verify/0.1 (+https://councilof.ai/contact)"})
did = json.load(urllib.request.urlopen(req, timeout=30))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
print("VERIFIES record.json")
```

**Files.** `sha256sum -c SHA256SUMS`. **Timestamp.** `pip install opentimestamps-client`, then `ots upgrade record.json.ots` and `ots verify record.json.ots`; until an upgrade returns a Bitcoin block attestation the proof is a pending calendar commitment and proves nothing about time.

## Contact, objections and re-checks

Publisher and accountable entity: **CSOAI Ltd** (Council of AI, https://councilof.ai). Contact: nicholas@csoai.org (also https://councilof.ai/contact).

- **Object to a row, or ask for a re-check.** If you control an agent id or an endpoint listed here and think its state is wrong, out of date, or should not be published, email nicholas@csoai.org with the chain and agent id (or the endpoint URL). We re-read it with the same read-only tools and reply with what we saw. If the published state was wrong, the correction is published here as a new file and listed under Corrections; published files are never edited in place. A re-check reports one read at one moment; it is not a grade.
- **Opt out of future fetches and probes.** Registration-file fetches and endpoint probes send the User-Agent `CSOAI-census/0.1 (+https://councilof.ai/census)` and honour robots.txt for the token `CSOAI-census`: a disallowed path is recorded NOT_FETCHED or NOT_ATTEMPTED and is not requested. A `Disallow` for `CSOAI-census` is enough; you can also email us. On-chain reads (`eth_call` against public RPCs) read the public registry and contact no agent.
- **Corrections.** Published in a Corrections section of this card and at https://councilof.ai/corrections. A superseding record never rewrites the earlier one. None so far.

## Licence

Data: CC-BY-4.0. Cite as: CSOAI Ltd (Council of AI), *ERC-8004 agent census, measured read 2026-09-26*, csoai/erc8004-agent-census, record.json sha256 `60bd9728f22159351feb71ccd6e0c01faab582f0ccf661415e36f339e52d2538`.

## Provenance

`record.json` was built by `erc8004_record.py` sha256 `d481a6d3c49f78ea7ef1e3944926f1bc034dc61363279e980140e838ffde7310` (named in the record's `producer`). This card was written at staging by the same script's stage step, sha256 `bdde522903151f3177050ce93ea82b31cfecd77748a48c2887f8ddf3b3d48bf0`; the stage step changes only this card, `SHA256SUMS` and the publish script.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *ERC-8004 agent census (measured read, 2026-09-26)*. 2026. Hugging Face dataset `csoai/erc8004-agent-census`. https://huggingface.co/datasets/csoai/erc8004-agent-census

```bibtex
@misc{csoai_erc8004_agent_census,
  title        = {ERC-8004 agent census (measured read, 2026-09-26)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/erc8004-agent-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
