---
license: cc-by-4.0
pretty_name: A2A agent card census (measured read, 2026-09-25)
tags:
- a2a
- agent2agent
- agent-card
- jws
- measurement
- census
- council-of-ai
configs:
- config_name: cards-2026-09-25
  data_files: data/cards.v0.1.1.jsonl.gz
  default: true
- config_name: cards-v0.1-superseded
  data_files: data/cards.jsonl.gz
size_categories:
- n<1K
# TODO task_categories: Growth proposes question-answering (verify against content)
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

> **Current record: 0.1.1** — `record.v0.1.1.json`, sha256 `4a2b46bb42aa727363ca04d8a2cc21ed76b50a4c6937a62f80d6fcfda191af91`, supersedes `record.json` (0.1, sha256 `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c`), which stays published unchanged. Figures in sections 1–3 are 0.1 unless the Corrections section below restates them; the dataset viewer loads the 0.1.1 rows (`data/cards.v0.1.1.jsonl.gz`).

# A2A agent card census - measured read, 2026-09-25

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

Every a2aregistry listing in our 2026-09-25 census frame (443 listings): whether its A2A agent card was served,
and whether the card's signatures verify under a key the card itself points to, 2026-09-25T07:24:34Z to 2026-09-25T07:25:59Z, from one
network location. Published by Council of AI (CSOAI). We **measure**. We do not certify, grade, rank or endorse any agent.

**Read state: EXHAUSTED.** All 443 listings reached exactly one state. The frame is one registry's listings;
it is not a population total of A2A agents.

Record: `record.json` sha256 `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c`, signed (Ed25519, `did:web:csoai.org#board-attestation-1`) at 2026-09-25T08:22:33.567Z;
OpenTimestamps state **PENDING_CALENDAR_COMMITMENT** at publication. The builder cross-checked the run summary against the row files
(21 checks, all hold) before writing the record.

Siblings: [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census) (remote MCP endpoints listed in public catalogues), [csoai/hf-mcp-spaces-census](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census).

## 1. States (per listing)

| state | listings | meaning |
|---|---|---|
| CARD_SERVED | 422 | a JSON object that parses as an agent card |
| ROBOTS_DISALLOWED | 9 | robots.txt forbids the card paths for CSOAI-census; only robots.txt was requested |
| NOT_FOUND | 5 | every candidate answered 404/410 (or another 4xx) |
| UNREACHABLE | 5 | DNS, refused, TLS, reset, 5xx, or an off-host redirect only |
| AUTH_REQUIRED | 2 | 401/403 and no candidate served a card |

States with zero listings: CARD_INVALID, HF_SPACE_NOT_CONTACTED, INVALID_URL, NON_PUBLIC_ADDRESS, TIMEOUT.
Not contacted: no request to a host that resolves to a non-global address (checked for every candidate host) and none to *.hf.space (a request could wake a sleeping Space); robots.txt honoured. The one listing whose card URL is on *.hf.space is recorded UNREACHABLE, not HF_SPACE_NOT_CONTACTED, because its other candidate (an unqualified internal hostname from the listing's url) failed DNS. It received no request in this run; the DNS query for the internal name went to our resolver only.

## 2. Signatures (denominator: 422 cards served)

| | cards | % of served |
|---|---|---|
| signed (at least one signature) | 33 | 7.82 |
| VERIFIED | 18 | 4.27 |
| FAILED | 3 | |
| UNCHECKABLE | 12 | |
| NO_SIGNATURES | 389 | |

Canonicalisation: JCS (RFC 8785) of the card with `signatures` removed; detached JWS (RFC 7515). VERIFIED by key source: jku 17, embedded_jwk 1
(embedded_jwk = the card vouches for its own key: integrity, not identity). FAILED = no verification over JCS(card without signatures) under the key the card points to; alt_serialisations_verifying is a diagnostic of 4 non-spec serialisations, never a pass.
FAILED cards that verify under any of 4 non-spec serialisations: 0.

| key source / result (per signature) | signatures |
|---|---|
| jku / VERIFIED | 17 |
| none / UNCHECKABLE | 9 |
| jku / FAILED | 3 |
| embedded_jwk / VERIFIED | 1 |
| did_web / UNCHECKABLE | 1 |
| jku / UNCHECKABLE | 1 |
| None / UNCHECKABLE | 1 |

| why UNCHECKABLE | signatures |
|---|---|
| no jku, no embedded jwk, no did:web kid: the card points to no key | 9 |
| key document has no key matching kid | 2 |
| signature object lacks protected/signature strings | 1 |

Card protocolVersion is what the card declares (3 differ from their listing); no A2A call was made.
No MCP request is made by this census. For the sibling MCP censuses: the current MCP specification revision is 2026-07-28 (checked 2026-09-25), and our MCP probers request 2025-11-25.

## 3. Anomalies, including a disclosed breach of our own rule

- **B1** (DISCLOSED BREACH OF OUR OWN RULE (superseded run kept)) - Run 1 of this census (2026-09-25T07:18:59Z to 2026-09-25T07:19:54Z) applied the non-public-address check to the first candidate host only and did not exclude *.hf.space. It sent ONE request, GET /robots.txt, to vishalmysore-a2amcpdemo.hf.space without first reading the Space's stage from the Hub API - the stage check our rule requires. It also asked our resolver for the unqualified internal hostname in that listing; DNS failed and no connection was made. Run 1 is superseded by run 2 (this record) and kept for audit; its rows are not published as data.
- **B2** - 2 served cards carry a `signatures` key with zero entries; they count as NO_SIGNATURES. So 35 cards have the key and 33 are signed.
- **B3** - 7 listings the registry marks healthy served no card to us.
- **B4** - 2 served cards are byte-identical to another listing's card (420 distinct of 422).
- **B5** - 3 cards declare a protocolVersion different from their registry listing; declared values include strings that are not A2A release numbers (see cards_served.protocolVersion_declared).

Hub API read of that Space (the Hub API, not the Space itself): stage **RUNTIME_ERROR** at 2026-09-25T08:20:51Z.
Run 1 is kept for audit (`run/superseded-run1-summary.json`, `run/superseded-run1-SUPERSEDED.txt`); its rows are not published as data.

## 4. What this is not evidence of

- that any agent works, is safe, is who it says, or does what its skills say
- that a VERIFIED signature proves identity: it proves only that the key the card points to signed these bytes (embedded_jwk: integrity only)
- that a FAILED or UNCHECKABLE card is malicious; it may be a canonicalisation or key-publication mistake
- endorsement, ranking, grading, or approval of any agent or operator
- a population total of A2A agents: the frame is one registry's listings on 2026-09-25
- reachability at any other moment or from any other network location

## Files

| file | rows | sha256 |
|---|---|---|
| `record.json` | | `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c` |
| `data/cards.jsonl.gz` | 443 | `9d5eaf5bb0866aa16521f1b95064091ce9914d4f957ca75ef273063e4ee4f160` |
| `run/summary.json` |  | `f32890d749cde7c15dafd61ce848661b5a0aeac440b0289a32ff7796c3651c34` |
| `run/superseded-run1-summary.json` |  | `ac4a25a88a9a5b9280b26cbee90aa8b9642ce3d4a15caa80d63d6513bbec990d` |
| `run/superseded-run1-SUPERSEDED.txt` |  | `a773870ff1cdf49a5206da354a0cf3f742c42e40cff8c77e3aa35e42d48eb2f4` |

`record.signed.json` (signature), `record.json.ots` (OpenTimestamps proof), `record.ots.json` (its stated state).
Rows in `data/cards.jsonl.gz` carry: order, id, host, state, reason, card_url, card_source, card_sha256, card_protocolVersion, listed_protocolVersion, signed, n_signatures, sig_state, verify_results, key_source_kinds, algs. They carry **no** card text (names, descriptions, skills);
`card_sha256` pins the card bytes we received. `card_url` is the URL the card was served from, or the listed wellKnownURI when none was served.

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

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the agent card URL or host you mean.
- **Ask for a re-check.** Reply with the agent card URL or host. We re-measure it with the same read-only instrument and run a tamper
  control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future probing.** Name the agent card URL or host. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. The reader behind this dataset (`scripts/census/a2a-card-probe.py`) does not yet read that list in code; until it does, an entry is honoured by hand before the next run, and the skip is still recorded by name.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Citation

```bibtex
@misc{csoai_a2a_card_census_2026,
  author       = {{Council of AI (CSOAI)}},
  title        = {A2A agent card census: measured read of 2026-09-25},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/a2a-card-census}}
}
```

## Licence

Data: CC-BY-4.0. Cite as: Council of AI (CSOAI), *A2A agent card census, measured read 2026-09-25*, csoai/a2a-card-census.

## Timestamp status

Checked 2026-09-25T13:46Z by `ots upgrade` on a copy of each published pending proof. A pending `.ots` is never rewritten: an upgraded proof is published as a NEW file `<name>.bitcoin.ots` beside it. BITCOIN_ATTESTED means the proof carries a BitcoinBlockHeaderAttestation whose commitment (byte-reversed) equals the merkle root of the block header at that height as served by **two independent public sources** (blockstream.info and mempool.space; each raw header also double-SHA256s to the block hash it is served under). No local Bitcoin node was used. Details: `ots-bitcoin-check-2026-09-25.json`.

- `record.json` (sha256 `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c`): **BITCOIN_ATTESTED at block 968527** (also blocks 968533, 968537, via other calendars) (checked against 2 header sources: blockstream.info, mempool.space). Upgraded proof: `record.json.bitcoin.ots` (sha256 `fc4d44231bc385bf0b582484e868c211d936071f1b5caee3c111716068d141d3`); the published pending proof `record.json.ots` is unchanged.
- Reconciliation: an earlier same-day upgrade of the same pending proofs is published under `ots-upgraded/2026-09-25/` (checked against one header source). It commits to the same file digests; calendars can return different block paths, so the heights may differ. Either proof suffices; neither replaces the pending original.


## Corrections

### 0.1.1 — 26 September 2026 (supersedes `record.json` 0.1; the 0.1 files stay published unchanged)

`record.v0.1.1.json` (sha256 `4a2b46bb42aa727363ca04d8a2cc21ed76b50a4c6937a62f80d6fcfda191af91`) supersedes `record.json` (sha256 `b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c`). The rows are
`data/cards.v0.1.1.jsonl.gz`; `data/cards.jsonl.gz`, `record.json`, `record.signed.json`, `record.json.ots`, `record.ots.json` and every other
0.1 file are kept byte for byte: superseded, not deleted, not edited.

**Why.** A2A spec 8.4.3 (Signature Verification) step 3 - 'Remove properties with default values from the received Agent Card' - was not applied by the 0.1 prober, which verified every card over JCS(card as served, minus signatures). **Rule now:** judge each card against the spec version it declares (ruling 2026-09-26). A card declaring 1.x (or nothing recognisable) is verified over the
8.4.3 payload (default values removed per the A2A proto, `signatures` excluded, JCS). A card declaring 0.x is verified over
JCS of its served bytes: protocol 0.3 defines no canonicalisation step. Fix: `scripts/census/a2a-card-probe.py` commits
`96959268d`, `33d0dfa64`.

**Check.** The 0.1 row projection over the stored run reproduces the published 0.1 rows byte for byte. 19 signed
cards (those whose payload step 3 alters) were re-checked on their stored bytes; key documents were re-fetched 2026-09-26 and the 0.1
rule on them reproduces every 0.1 verdict, so no change below is a key rotation. Every other card has the same signing input under both rules.

**Agents whose verdict changes: 7** (VERIFIED -> FAILED: 6, FAILED -> VERIFIED: 1)

| agent id (a2aregistry) | host | declares | 0.1 | 0.1.1 | why |
|---|---|---|---|---|---|
| `fbbc1e43-6975-46d2-a066-7e8ad90357b3` | api.getemboss.ai | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |
| `ee821d2a-b667-40b7-9dda-b1170aaefa7f` | philongevity.com | 1.x | FAILED | VERIFIED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the card with default values removed, as 8.4.1-8.4.2 require, and now verifies |
| `6f97c159-43ed-49de-92b6-1d5aa5ae8ce7` | www.smklog.com | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |
| `41d157e0-cdec-4431-a6e1-07e070f35b08` | api.cogdepot.com | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |
| `125be81b-7326-41cd-85a2-7e0c2aa031b8` | agent.co-legal.be | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |
| `77c18a1a-bc34-4314-9cd3-8192f9f288a2` | emem.dev | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |
| `ee3508f9-9a8d-4221-8668-fef137ff9fff` | planets.agentexchange.work | 1.x | VERIFIED | FAILED | declares 1.x: A2A 8.4.3 step 3 (remove default values) applied; the signature was made over the served bytes WITH default values, so it no longer verifies |

**Cards declaring 0.3 that keep their verdict, with a note:**

| agent id | host | verdict (declared 0.3) | under 1.x rules | note |
|---|---|---|---|---|
| `87426082-ec97-488d-beea-1bd717216445` | codex-autonomous-worker.rwdburley.chatgpt.site | VERIFIED | FAILED | protocol 0.3 defines no canonicalisation step; verdict under the declared version; under 1.x rules this card would FAIL |
| `c59ee47c-4565-4fa9-bf98-807b0501c58a` | b612-a2a.vercel.app | VERIFIED | FAILED | protocol 0.3 defines no canonicalisation step; verdict under the declared version; under 1.x rules this card would FAIL |
| `f9da91fd-c17c-4dd2-8349-f5fd53108d5c` | api1.ilovechicken.co.uk | VERIFIED | FAILED | protocol 0.3 defines no canonicalisation step; verdict under the declared version; under 1.x rules this card would FAIL |

**Signature counts, 0.1 → 0.1.1** (denominator: 422 cards served):

| | 0.1 | 0.1.1 |
|---|---|---|
| verified | 18 | 13 |
| failed | 3 | 8 |
| uncheckable | 12 | 12 |
| no_signatures | 389 | 389 |
| signed | 33 | 33 |
| pct_verified | 4.27 | 3.08 |

**Verify.** `record.v0.1.1.signed.json`: Ed25519 under did:web:csoai.org#board-attestation-1 (signed_at 2026-09-26T04:06:22.149Z);
its payload carries `supersedes_sha256`. `record.v0.1.1.json.ots`: 3 pending calendar attestations at publication —
a pending calendar commitment, not a Bitcoin attestation. Per-card evidence: `correction.v0.1.1.evidence.json`.

<!-- flywheel:revisions:start -->
## Weekly revisions (generated from the records)

Each revision ADDS dated files; nothing published earlier is changed. Changes are listed by name in `CHANGES.<date>.json`.

| date | record | read state | attempted | added | dropped | out of plan | state changed |
|---|---|---|---|---|---|---|---|
| 2026-09-27 | `record.2026-09-27.json` | EXHAUSTED | 444 | 7 | 4 | 0 | 9 |
| 2026-10-04 | `record.2026-10-04.json` | EXHAUSTED | 504 | 72 | 13 | 0 | 12 |
| 2026-10-11 | `record.2026-10-11.json` | EXHAUSTED | 502 | 42 | 44 | 0 | 8 |
| 2026-10-18 | `record.2026-10-18.json` | EXHAUSTED | 558 | 82 | 26 | 0 | 11 |
| 2026-10-25 | `record.2026-10-25.json` | EXHAUSTED | 604 | 58 | 12 | 0 | 17 |
| 2026-11-01 | `record.2026-11-01.json` | EXHAUSTED | 638 | 54 | 20 | 0 | 16 |
<!-- flywheel:revisions:end -->

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *A2A agent card census (measured read, 2026-09-25)*. 2026. Hugging Face dataset `csoai/a2a-card-census`. https://huggingface.co/datasets/csoai/a2a-card-census

```bibtex
@misc{csoai_a2a_card_census,
  title        = {A2A agent card census (measured read, 2026-09-25)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/a2a-card-census},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->
