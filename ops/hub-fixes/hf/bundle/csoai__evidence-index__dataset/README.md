---
license: cc0-1.0
pretty_name: CSOAI evidence index
language:
- en
tags:
- provenance
- evidence
- ed25519
- opentimestamps
- measurement
- council-of-ai
size_categories:
- n<1K
configs:
- config_name: gspc-pulse-alerts
  data_files:
  - split: train
    path: gspc-pulse/*/alerts.jsonl
  default: true
- config_name: gspc-pulse-academy-curriculum-leaves
  data_files:
  - split: train
    path: gspc-pulse/*/academy/curriculum-leaves.json
- config_name: gspc-pulse-frameworks
  data_files:
  - split: train
    path: gspc-pulse/2026-11-04/frameworks/tui3-provision-mapping.json
- config_name: gspc-pulse-claims-claims-ledger
  data_files:
  - split: train
    path: gspc-pulse/*/claims/claims-ledger.jsonl
- config_name: manifests
  data_files:
  - split: train
    path: manifests/*.json
- config_name: measurement-index-rekor-receipt
  data_files:
  - split: train
    path:
    - measurement-index/2026-09-26/measurement-index-chain-head-2026-09-26.rekor-receipt.json
    - measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.rekor-receipt.json
    - measurement-index/2026-09-27/measurement-index-chain-head-2026-09-27.rekor-receipt.json
    - measurement-index/2026-09-27/measurement-index-v0.2-2026-09-27.rekor-receipt.json
    - measurement-index/2026-09-28/measurement-index-v0.2-2026-09-28.rekor-receipt.json
    - measurement-index/2026-09-29/measurement-index-v0.2-2026-09-29.rekor-receipt.json
    - measurement-index/2026-09-30/measurement-index-v0.2-2026-09-30.rekor-receipt.json
    - measurement-index/2026-10-01/measurement-index-v0.2-2026-10-01.rekor-receipt.json
    - measurement-index/2026-10-06/measurement-index-v0.2-2026-10-06.rekor-receipt.json
    - measurement-index/2026-10-07/measurement-index-v0.2-2026-10-07.rekor-receipt.json
    - measurement-index/2026-10-15/measurement-index-v0.2-2026-10-15.rekor-receipt.json
    - measurement-index/2026-10-16/measurement-index-v0.2-2026-10-16.rekor-receipt.json
    - measurement-index/2026-10-17/measurement-index-v0.2-2026-10-17.rekor-receipt.json
    - measurement-index/2026-10-18/measurement-index-chain-head-2026-10-18.rekor-receipt.json
    - measurement-index/2026-10-18/measurement-index-v0.2-2026-10-18.rekor-receipt.json
    - measurement-index/2026-10-19/measurement-index-v0.2-2026-10-19.rekor-receipt.json
    - measurement-index/2026-10-20/measurement-index-v0.2-2026-10-20.rekor-receipt.json
    - measurement-index/2026-10-21/measurement-index-v0.2-2026-10-21.rekor-receipt.json
    - measurement-index/2026-10-22/measurement-index-v0.2-2026-10-22.rekor-receipt.json
    - measurement-index/2026-10-23/measurement-index-v0.2-2026-10-23.rekor-receipt.json
    - measurement-index/2026-10-24/measurement-index-v0.2-2026-10-24.rekor-receipt.json
    - measurement-index/2026-10-25/measurement-index-chain-head-2026-10-25.rekor-receipt.json
    - measurement-index/2026-10-25/measurement-index-v0.2-2026-10-25.rekor-receipt.json
    - measurement-index/2026-10-26/measurement-index-v0.2-2026-10-26.rekor-receipt.json
    - measurement-index/2026-10-27/measurement-index-v0.2-2026-10-27.rekor-receipt.json
    - measurement-index/2026-10-28/measurement-index-v0.2-2026-10-28.rekor-receipt.json
    - measurement-index/2026-10-29/measurement-index-v0.2-2026-10-29.rekor-receipt.json
    - measurement-index/2026-10-30/measurement-index-v0.2-2026-10-30.rekor-receipt.json
    - measurement-index/2026-11-01/measurement-index-chain-head-2026-11-01.rekor-receipt.json
    - measurement-index/2026-11-01/measurement-index-v0.2-2026-11-01.rekor-receipt.json
    - measurement-index/2026-11-03/measurement-index-v0.2-2026-11-03.rekor-receipt.json
    - measurement-index/2026-11-04/measurement-index-v0.2-2026-11-04.rekor-receipt.json
- config_name: ots-upgraded-ots-upgrade
  data_files:
  - split: train
    path: ots-upgraded/*/OTS-UPGRADE.json
- config_name: checks-datasets-csoai-faq
  data_files:
  - split: train
    path: checks/datasets__csoai__faq.json
- config_name: checks-spaces-csoai-faq
  data_files:
  - split: train
    path: checks/spaces__csoai__faq.json
- config_name: checks-spaces-csoai-gspc-agi
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-agi.json
- config_name: checks-spaces-csoai-gspc-asi
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-asi.json
- config_name: checks-spaces-csoai-gspc-det
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-det.json
- config_name: checks-spaces-csoai-gspc-gov
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-gov.json
- config_name: checks-spaces-csoai-gspc-mcp
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-mcp.json
- config_name: checks-spaces-csoai-gspc-oss
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-oss.json
- config_name: checks-spaces-csoai-gspc-prv
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-prv.json
- config_name: checks-spaces-csoai-gspc-xr
  data_files:
  - split: train
    path: checks/spaces__csoai__gspc-xr.json
- config_name: enumeration-owners
  data_files:
  - split: train
    path: enumeration/owners.json
- config_name: gspc-pulse-academy-completions-schema
  data_files:
  - split: train
    path: gspc-pulse/*/academy/completions-schema.json
- config_name: checks-sample
  data_files:
  - split: train
    path:
    - checks/datasets__csoai__wrapped-asset-parity.json
    - checks/datasets__csoai__x402-bazaar-census.json
    - checks/datasets__csoai__x402-bazaar-conformance.json
    - checks/datasets__csoai__x402-free-discovery-2026-09-14.json
    - checks/datasets__csoai__x402-settlement-census.json
    - checks/datasets__csoai__xrpl-16-reader.json
    - checks/models__csoai__clan-csoai-plain.json
    - checks/models__csoai__council-safe.json
    - checks/spaces__csoai__claimguard.json
    - checks/spaces__csoai__council-city.json
    - checks/spaces__csoai__council-coliseum.json
    - checks/spaces__csoai__council-mcp-playground.json
    - checks/spaces__csoai__council-os.json
    - checks/spaces__csoai__council-space.json
    - checks/spaces__csoai__csoai-gspc-mcp.json
    - checks/spaces__csoai__east-west.json
    - checks/spaces__csoai__games-catalog.json
    - checks/spaces__csoai__gspc-affect.json
    - checks/spaces__csoai__gspc-art5.json
    - checks/spaces__csoai__gspc-board.json
    - checks/spaces__csoai__gspc-care.json
    - checks/spaces__csoai__gspc-explorer.json
    - checks/spaces__csoai__gspc-governance-leaderboard-spc.json
    - checks/spaces__csoai__gspc-governance-leaderboard.json
    - checks/spaces__csoai__gspc-interop.json
    - checks/spaces__csoai__gspc-live-board.json
    - checks/spaces__csoai__gspc-lookup.json
    - checks/spaces__csoai__gspc-mach.json
    - checks/spaces__csoai__gspc-mill.json
    - checks/spaces__csoai__gspc-node.json
    - checks/spaces__csoai__gspc-swarm.json
    - checks/spaces__csoai__gspc-verify.json
    - checks/spaces__csoai__jail-floor.json
    - checks/spaces__csoai__living-catalog.json
    - checks/spaces__csoai__mcp-fabric.json
    - checks/spaces__csoai__measurement-card-verifier.json
    - checks/spaces__csoai__ras-assess.json
    - checks/spaces__csoai__verify-demo.json
- config_name: measurement-index-sample
  data_files:
  - split: train
    path:
    - measurement-index/2026-10-25/measurement-index-v0.2-2026-10-25.json
    - measurement-index/2026-10-26/measurement-index-v0.2-2026-10-26.json
    - measurement-index/2026-10-27/measurement-index-v0.2-2026-10-27.json
    - measurement-index/2026-10-28/measurement-index-v0.2-2026-10-28.json
    - measurement-index/2026-10-29/measurement-index-v0.2-2026-10-29.json
    - measurement-index/2026-10-30/measurement-index-v0.2-2026-10-30.json
- config_name: measurement-index-signed-sample
  data_files:
  - split: train
    path:
    - measurement-index/2026-09-27/measurement-index-chain-head-2026-09-27.signed.json
    - measurement-index/2026-10-18/measurement-index-chain-head-2026-10-18.signed.json
    - measurement-index/2026-10-25/measurement-index-chain-head-2026-10-25.signed.json
    - measurement-index/2026-11-01/measurement-index-chain-head-2026-11-01.signed.json
- config_name: measurement-index-v2-sample
  data_files:
  - split: train
    path:
    - measurement-index/2026-10-18/measurement-index-chain-head-2026-10-18.json
    - measurement-index/2026-10-25/measurement-index-chain-head-2026-10-25.json
    - measurement-index/2026-11-01/measurement-index-chain-head-2026-11-01.json
- config_name: measurement-index-v3-sample
  data_files:
  - split: train
    path:
    - measurement-index/2026-10-19/measurement-index-v0.2-2026-10-19.json
    - measurement-index/2026-10-20/measurement-index-v0.2-2026-10-20.json
    - measurement-index/2026-10-21/measurement-index-v0.2-2026-10-21.json
- config_name: measurement-index-rekor-entry-sample
  data_files:
  - split: train
    path: measurement-index/2026-09-26/measurement-index-chain-head-2026-09-26.rekor-entry.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# CSOAI evidence index

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

One signed, machine-readable list of every piece of evidence CSOAI (Council of AI, councilof.ai) has published on the sources below, so a person or an agent can discover it and verify it in one place. Built 2026-09-25T14:13:10Z; **212 items**.

This is an index, not a measurement and not a certification. It proves which bytes were published and which of them carry a signature that verifies; it does not make any indexed claim true, and inclusion endorses nothing.

## Files

| file | what |
|---|---|
| `index.json` | the index (schema `csoai.evidence-index/0.1`), sha256 `951a813866ffc745f6a1f0bb9210865099f1aa5c232cb520d4439360b9e9d2e9` |
| `index.signed.json` | Ed25519 signature over a payload pinning index.json by sha256, `did:web:csoai.org#board-attestation-1`, signed 2026-09-25T14:13:38.191Z |
| `index.json.ots` / `index.ots.json` | OpenTimestamps proof over sha256(index.json): PENDING_CALENDAR_COMMITMENT (https://alice.btc.calendar.opentimestamps.org, https://bob.btc.calendar.opentimestamps.org, https://finney.calendar.eternitywall.com) |
| `index.md` | the same index for humans |
| `verify.py` | a stranger's one-command verifier (Apache-2.0) |
| `build_evidence_index.py`, `render_evidence_index.py` | the code that built this (Apache-2.0) |
| `manifests/` | the per-repo file manifests whose sha256 is each Hugging Face item's `content_sha256` |
| `checks/` | per-repo lists of the files downloaded and re-hashed and the signature files checked; each bound to index.json by `check.checks_sha256` |
| `enumeration/owners.json` | the PyPI / npm owner enumeration the package items were selected from |
| `verify.log` | the output of `python3 verify.py` at build time |

## Verify

```bash
pip install cryptography opentimestamps huggingface_hub
huggingface-cli download csoai/evidence-index --repo-type dataset --local-dir evidence-index
cd evidence-index && python3 verify.py
```

`verify.py` sends its own named User-Agent (csoai.org answers 403 to Python's default one). By hand:

```python
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
s = json.load(open("index.signed.json"))
c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
assert hashlib.sha256(open("index.json", "rb").read()).hexdigest() == s["payload"]["artifact"]["sha256"]
did = json.load(urllib.request.urlopen(urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)"})))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "==")).verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)
```

In words, the signature: in `index.signed.json` serialise `payload` as JSON with keys sorted recursively, no whitespace, UTF-8 literal. Its sha256 must equal `signature.payload_sha256`; `payload.artifact.sha256` must equal sha256 of `index.json`; `signature.sig_ed25519` (hex) must verify over those bytes under the `#board-attestation-1` key (`publicKeyJwk.x`, base64url) in https://csoai.org/.well-known/did.json. Change one byte and it must fail.

The timestamp: `ots upgrade index.json.ots && ots verify index.json.ots`. At publication it was a **pending calendar commitment** — calendars promised Bitcoin inclusion; it is not a Bitcoin attestation until `ots verify` says so against the chain.

Without a Bitcoin node (a full `ots verify` needs one), check an upgraded proof offline and compare the merkle root with a
public block explorer (two independent ones is better):

```sh
# (a pending proof must first be upgraded: ots upgrade <proof>)
ots --no-bitcoin verify -f index.json index.json.ots
# -> "To verify manually, check that Bitcoin block H has merkleroot M"
B=$(curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block-height/H)
curl -s -A "csoai-dataset-verify/1.0 (+https://huggingface.co/csoai)" https://mempool.space/api/block/$B | python3 -c 'import sys,json;print(json.load(sys.stdin)["merkle_root"])'
# must print M; repeat against https://blockstream.info/api/...
```

verify.py at build time:

```
INDEX index.json sha256=951a813866ffc745f6a1f0bb9210865099f1aa5c232cb520d4439360b9e9d2e9 signature=VERIFIED key=did:web:csoai.org#board-attestation-1 bound_to_index=True
RESULT pass=212 drifted=0 fail=0 not_checked=0 of 212 items
```

## What it contains

| kind | items | signature state | OTS state |
|---|---|---|---|
| trust-anchor | 1 | NOT_APPLICABLE 1 | none 1 |
| board | 2 | VERIFIED 2 | none 2 |
| surface | 3 | UNSIGNED 2, VERIFIED 1 | none 3 |
| signed-record | 32 | VERIFIED 32 | bitcoin-attested 24, pending 8 |
| dataset | 120 | NOT_CHECKED 2, PARTIAL 6, UNSIGNED 104, VERIFIED 8 | PARTIAL 2, bitcoin-attested 1, mixed 9, none 108 |
| space | 39 | UNSIGNED 39 | none 39 |
| model | 2 | UNSIGNED 2 | none 2 |
| package | 13 | UNSIGNED 13 | none 13 |

Counts of indexed objects, not measurements. Signed records verified under `#board-attestation-1`: 32 of 32.

## What it does not show

- That any item is correct, safe, or complete: an index proves which bytes were published and who signed them, not that their claims are true.
- Any certification or endorsement: CSOAI measures; it does not certify, and inclusion here endorses nothing.
- Evidence not reachable from the enumerated sources (see enumeration.not_enumerated). A source absent from this list leaves no trace here.
- That live surfaces still serve these bytes: they are fetched LIVE and pinned only to this build's fetch.
- Bitcoin-anchored time for any proof whose state is pending.

Not enumerated in this version:

- GitHub: the estate's GitHub accounts are flagged and the repos are not publicly readable; nothing from GitHub is indexed.
- Zenodo records: not enumerated in this version (methodology: <https://councilof.ai/methodology/>).
- Kaggle, MCP registries, Smithery, other directories: listings, not evidence CSOAI publishes; not indexed.
- Files inside the councilof.ai site beyond the surfaces listed above.
- Signature files inside Hugging Face repos whose names do not match (signed|attest|provenance_signed|\.sig$).

## Package inclusion rule (rule v2 (2026-09-25; supersedes v1, which included every name candidate))

CSOAI (the measurement body) and MEOK (training and gamification) are separate estate entities. A package is indexed only when the registry bytes name CSOAI as its publisher, never because its name contains 'csoai'.

1. Candidate: a PyPI project owned by, or an npm package maintained by, the estate registry account, whose name contains 'csoai' or 'gspc' (plus the named npm seed). The name only proposes; it never includes.
2. Registry ownership (necessary, not sufficient): the PyPI Owner role (XML-RPC package_roles) or the npm maintainers list must include the estate account. These accounts are shared by CSOAI, MEOK and CSGA Global, so this step cannot establish CSOAI as publisher.
3. npm scope: a scoped package is excluded unless its scope is a CSOAI scope (there are none). @meok-labs is MEOK's npm org; @csgaglobal is CSGA Global's.
4. Declared publisher of the pinned release (PyPI author, author_email, maintainer, maintainer_email, home page; npm author): any MEOK or CSGA marker excludes it as another entity's package, including co-branded strings such as 'MEOK AI Labs (CSOAI LTD)'.
5. Positive CSOAI identity required: the declared publisher names CSOAI Ltd / csoai.org / Council of AI / councilof.ai, or the declared source repository is under github.com/CSOAI-ORG. Otherwise the package is excluded as PUBLISHER_UNDECLARED (not evidence it is not CSOAI's; the registry bytes do not say).

Estate registry accounts: npm `csga_global`, pypi `nicholastempleman`. Decisions: EXCLUDED_OTHER_ENTITY 4, EXCLUDED_PUBLISHER_UNDECLARED 2, INCLUDED 13.

| registry | package | version | decision | reason | declared publisher |
|---|---|---|---|---|---|
| pypi | `crewai-csoai` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `csoai` | 0.2.2 | INCLUDED | declared publisher names CSOAI | author: Council of AI (CSOAI LTD, UK 16939677) |
| pypi | `csoai-affective-safety` | 0.1.0 | EXCLUDED_PUBLISHER_UNDECLARED | no publisher and no CSOAI-ORG source declared in the release metadata | (none declared) |
| pypi | `csoai-claimguard` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `csoai-council-ledger` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `csoai-defoneos-isr-mcp` | 1.0.0 | EXCLUDED_OTHER_ENTITY | declared publisher names MEOK | author_email: "MEOK AI Labs (CSOAI LTD)" <*@meok.ai> |
| pypi | `csoai-defoneos-mcp` | 1.0.6 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `csoai-governance-crosswalk-mcp` | 1.0.18 | EXCLUDED_OTHER_ENTITY | declared publisher names MEOK | author_email: MEOK AI Labs <*@meok.ai> |
| pypi | `csoai-gspc` | 0.2.20260915 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `csoai-scitt-ts` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author: CSOAI LTD |
| pypi | `inspect-gspc-scitt` | 0.1.0 | EXCLUDED_PUBLISHER_UNDECLARED | no publisher and no CSOAI-ORG source declared in the release metadata | (none declared) |
| pypi | `inspect-gspc-scorer` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author: CSOAI LTD |
| pypi | `langchain-csoai` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| pypi | `llama-index-tools-csoai` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author_email: CSOAI Ltd <*@csoai.org> |
| npm | `@csgaglobal/csoai-governance` | 1.0.0 | EXCLUDED_OTHER_ENTITY | npm scope @csgaglobal is not a CSOAI scope (CSGA Global) | author: CSGA Global — Cyber Security Global Alliance |
| npm | `@meok-labs/csoai` | 0.1.0 | EXCLUDED_OTHER_ENTITY | npm scope @meok-labs is not a CSOAI scope (MEOK) | (none declared) |
| npm | `csoai-gspc-mcp` | 0.2.2 | INCLUDED | declared source repository is under github.com/CSOAI-ORG (release published by github trusted publisher) | (none declared) |
| npm | `csoai-lib2b` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author: CSOAI, *@csoai.org |
| npm | `csoai-x402-rail-client` | 0.1.0 | INCLUDED | declared publisher names CSOAI | author: Nicholas Templeman, *@csoai.org |


Every item carries its own `does_not_show` list, its licence, its published date, and the exact check behind its signature and timestamp state.

## Contact, objections and re-checks

- **Contact:** nicholas@csoai.org (Council of AI / CSOAI). Please name this dataset and the repository, package or item you mean.
- **Ask for a re-check.** Reply with the repository, package or item. We re-measure it with the same read-only instrument and run a tamper
  control beside it (a deliberately altered copy must fail the same check, or the re-check does not count). A dated
  re-check record is published only with your knowledge. Published rows are never edited in place: a correction is a new,
  signed file that supersedes the old one, and both stay visible.
- **Object, or opt out of future reads.** Name the repository, package or item. It is added to the exclusion list
  (`scripts/census/probe-exclusions.json` in the census code, dated, public), and the next run honours it before sending
  any request and records the skip by name. The reader behind this dataset (`build_evidence_index.py`) does not yet read that list in code; until it does, an entry is honoured by hand before the next run, and the skip is still recorded by name.
- **Objections are recorded.** Every objection, opt-out and re-check request is logged with its date and what was done;
  nothing is removed silently.

<!-- OWNER: add acknowledgement time commitment if desired -->

## Citation

```bibtex
@misc{csoai_evidence_index_2026,
  author       = {{Council of AI (CSOAI)}},
  title        = {CSOAI evidence index},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/evidence-index}}
}
```

## Licence

Index data CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). verify.py and the build scripts Apache-2.0. Each indexed item keeps its own licence, stated per item; this index relicenses nothing.

<!-- measurement-index-chain:begin -->
## Measurement-index chain

`measurement-index/<date>/` holds CSOAI's daily measurement index as a hash chain: every day's index commits to the previous day's (SHA-256 and root) and declares any missed day. Each index is signed (`did:web:csoai.org#board-attestation-1`) and OpenTimestamps-stamped, and the chain starts at a signed genesis record (26 Sep 2026). How to verify it: [measurement-index/README.md](measurement-index/README.md).
<!-- measurement-index-chain:end -->

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *CSOAI evidence index*. 2026. Hugging Face dataset `csoai/evidence-index`. https://huggingface.co/datasets/csoai/evidence-index

```bibtex
@misc{csoai_evidence_index,
  title        = {CSOAI evidence index},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/evidence-index},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->

<!-- DATA-ACCESS:START -->
## Read this product

This is a structured evidence archive, not a training table. The automatic table viewer is disabled because the repository contains documents with different schemas, signatures or timestamp proofs. All original evidence files remain available.

```python
import json
from huggingface_hub import hf_hub_download
path = hf_hub_download("csoai/evidence-index", "index.json", repo_type="dataset")
with open(path, encoding="utf-8") as source:
    document = json.load(source)
records = document["items"]
```

For reproducible reuse, pass the repository commit SHA as `revision` and retain the downloaded bytes. Loading a file does not verify its signature; follow this card's verification instructions before relying on a claim. Dated snapshots remain historical measurements.
<!-- DATA-ACCESS:END -->


---

---
license: cc-by-4.0
tags:
- ai-safety
- measurement
- transparency
- time-series
- cisa-kev
- epss
- model-context-protocol
- x402
- a2a
- evidence
- open-data
configs:
- config_name: pulse-series
  data_files:
  - split: pulse
    path: gspc-pulse/2026-11-04/timeseries.csv
---

# GSPC evidence index

Public evidence mirror for the CSOAI / Council of AI estate: measurement-capsule
indexes, anchors, and the **GSPC live pulse** — an append-only, hash-chained,
Merkle-rooted, Ed25519-signed time series of global AI-safety, security and
model-ecosystem state. Dual-licensed CC BY 4.0 OR CC0-1.0. Measurement, not
endorsement — never a certification; UNREACHABLE is never zero.

## GSPC live pulse (gspc-pulse/2026-11-04/)

- `latest.json` — one-GET current state · `feed.json` — full append-only series
- `timeseries.csv` — flat counters (pandas/R ready)
- `pulse-freeze-manifest.json` + `.sig` + `pulse-leaves.json` — frozen series
  (verify from this mirror alone: chain + Merkle + signature)
- `RECONCILIATION.md` — measuring the measurer · `PULSE-NODE.md` — run a node
- `verification-log.jsonl` — card/inclusion/anchor/freeze verdict cadence
- `discovery/` — MCP registry, A2A card, x402 listing payloads

<!-- ACCESS-MODEL:START -->
## Access model

**Humans: free.** Browse, verify, and download everything here in your browser — no login, no paywall: [free verify](https://councilof.ai/gspc-verify/) · [full catalogue](https://councilof.ai/catalogue).
**Agents/machines:** every call in this catalogue is priced over [x402](https://www.x402.org) — USDC, pay-per-call, no keys, no subscription. Machine entry: [councilof.ai/mcp](https://councilof.ai/mcp).
Measurement, not certification.
<!-- ACCESS-MODEL:END -->


## Companion: gspc-pulse evidence series
Machine-readable, append-only time series of LIVE public-surface measurements
(GSPC board, capsules, signed cards, CISA KEV + EPSS + SSVC, HF ecosystem,
MCP/x402 censuses, leak-site ransomware sample). Rows carry meta.runner
(independent runners cross-check) and each source's own as_of timestamp;
tamper-evident via git. Fetch first: latest.json (one GET) -> feed.json
(schema csoai.gspc-pulse-feed/0.1) -> timeseries.csv (pandas/R ready).
Agent rules: UNREACHABLE = 0 is forbidden; slots and measurements are never
summed. Doctrine: measurement, not endorsement. License CC BY 4.0.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table. The viewer was previously disabled (`viewer: false`); it is re-enabled now that every subset loads.

| subset | files | rows (as verified) |
|---|---|---|
| `gspc-pulse-alerts` (default) | `gspc-pulse/*/alerts.jsonl` | 11 |
| `gspc-pulse-academy-curriculum-leaves` | `gspc-pulse/*/academy/curriculum-leaves.json` | 10 |
| `gspc-pulse-frameworks` | `gspc-pulse/2026-11-04/frameworks/tui3-provision-mapping.json` | 5 |
| `gspc-pulse-claims-claims-ledger` | `gspc-pulse/*/claims/claims-ledger.jsonl` | 3 |
| `manifests` | `manifests/*.json` | 161 |
| `measurement-index-rekor-receipt` | `measurement-index/2026-09-26/measurement-index-chain-head-2026-09-26.rekor-receipt.json`, `measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.rekor-receipt.json`, `measurement-index/2026-09-27/measurement-index-chain-head-2026-09-27.rekor-receipt.json` … (+29) | 32 |
| `ots-upgraded-ots-upgrade` | `ots-upgraded/*/OTS-UPGRADE.json` | 26 |
| `checks-datasets-csoai-faq` | `checks/datasets__csoai__faq.json` | 1 |
| `checks-spaces-csoai-faq` | `checks/spaces__csoai__faq.json` | 1 |
| `checks-spaces-csoai-gspc-agi` | `checks/spaces__csoai__gspc-agi.json` | 1 |
| `checks-spaces-csoai-gspc-asi` | `checks/spaces__csoai__gspc-asi.json` | 1 |
| `checks-spaces-csoai-gspc-det` | `checks/spaces__csoai__gspc-det.json` | 1 |
| `checks-spaces-csoai-gspc-gov` | `checks/spaces__csoai__gspc-gov.json` | 1 |
| `checks-spaces-csoai-gspc-mcp` | `checks/spaces__csoai__gspc-mcp.json` | 1 |
| `checks-spaces-csoai-gspc-oss` | `checks/spaces__csoai__gspc-oss.json` | 1 |
| `checks-spaces-csoai-gspc-prv` | `checks/spaces__csoai__gspc-prv.json` | 1 |
| `checks-spaces-csoai-gspc-xr` | `checks/spaces__csoai__gspc-xr.json` | 1 |
| `enumeration-owners` | `enumeration/owners.json` | 1 |
| `gspc-pulse-academy-completions-schema` | `gspc-pulse/*/academy/completions-schema.json` | 1 |
| `checks-sample` | `checks/datasets__csoai__wrapped-asset-parity.json`, `checks/datasets__csoai__x402-bazaar-census.json`, `checks/datasets__csoai__x402-bazaar-conformance.json` … (+35) | 38 |
| `measurement-index-sample` | `measurement-index/2026-10-25/measurement-index-v0.2-2026-10-25.json`, `measurement-index/2026-10-26/measurement-index-v0.2-2026-10-26.json`, `measurement-index/2026-10-27/measurement-index-v0.2-2026-10-27.json` … (+3) | 6 |
| `measurement-index-signed-sample` | `measurement-index/2026-09-27/measurement-index-chain-head-2026-09-27.signed.json`, `measurement-index/2026-10-18/measurement-index-chain-head-2026-10-18.signed.json`, `measurement-index/2026-10-25/measurement-index-chain-head-2026-10-25.signed.json` … (+1) | 4 |
| `measurement-index-v2-sample` | `measurement-index/2026-10-18/measurement-index-chain-head-2026-10-18.json`, `measurement-index/2026-10-25/measurement-index-chain-head-2026-10-25.json`, `measurement-index/2026-11-01/measurement-index-chain-head-2026-11-01.json` | 3 |
| `measurement-index-v3-sample` | `measurement-index/2026-10-19/measurement-index-v0.2-2026-10-19.json`, `measurement-index/2026-10-20/measurement-index-v0.2-2026-10-20.json`, `measurement-index/2026-10-21/measurement-index-v0.2-2026-10-21.json` | 3 |
| `measurement-index-rekor-entry-sample` | `measurement-index/2026-09-26/measurement-index-chain-head-2026-09-26.rekor-entry.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/evidence-index", "gspc-pulse-alerts", split="train")
```

<!-- csoai-card-fixes:end -->
