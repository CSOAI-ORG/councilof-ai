# CSOAI evidence index

Schema `csoai.evidence-index/0.1` · as of **2026-09-25T14:13:10Z** · 212 items · index.json sha256 `951a813866ffc745f6a1f0bb9210865099f1aa5c232cb520d4439360b9e9d2e9`

Signed `did:web:csoai.org#board-attestation-1` at 2026-09-25T14:13:38.191Z (Ed25519, via POST /api/board-sign). Timestamp: PENDING_CALENDAR_COMMITMENT from 3 OpenTimestamps calendar(s) — a pending calendar commitment is **not** a Bitcoin attestation.

One machine-readable list of the evidence CSOAI has published, each item pinned by a sha256 computed from bytes fetched in this run, with the signature and timestamp state established by a check run in this build. verify.py re-runs those checks from nothing but public URLs.

## What this index does not show

- That any item is correct, safe, or complete: an index proves which bytes were published and who signed them, not that their claims are true.
- Any certification or endorsement: CSOAI measures; it does not certify, and inclusion here endorses nothing.
- Evidence not reachable from the enumerated sources (see enumeration.not_enumerated). A source absent from this list leaves no trace here.
- That live surfaces still serve these bytes: they are fetched LIVE and pinned only to this build's fetch.
- Bitcoin-anchored time for any proof whose state is pending.

## Verify it yourself

```bash
pip install cryptography opentimestamps   # opentimestamps is optional
python3 verify.py            # in a directory holding index.json + index.signed.json
python3 verify.py --deep     # also re-download every byte-checked file and re-verify every checked signature file
```

verify.py first checks that sha256(index.json) is the value signed in index.signed.json and that the signature verifies under `did:web:csoai.org#board-attestation-1` pinned from https://csoai.org/.well-known/did.json. Then, per item: Hugging Face repos are re-listed at the pinned commit and their manifest sha256 recomputed; signed records are re-downloaded and their signatures re-verified; package files are re-downloaded and re-hashed; live surfaces are re-fetched and reported PASS only if the bytes are identical, DRIFTED otherwise (a live surface is expected to change).

Result of running it at build time:

```
INDEX index.json sha256=951a813866ffc745f6a1f0bb9210865099f1aa5c232cb520d4439360b9e9d2e9 signature=VERIFIED key=did:web:csoai.org#board-attestation-1 bound_to_index=True
RESULT pass=212 drifted=0 fail=0 not_checked=0 of 212 items
```

## Totals (counts of indexed objects — not measurements; never add them to any other CSOAI count)

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

Signed records verified under `#board-attestation-1`: **32** of 32. Artifact binding: MATCH 32.

Hugging Face files listed: 44009; downloaded and re-hashed in this build: 2204; hash mismatches: 0; fetch failures: 0.

## Enumeration

- Hugging Face: GET https://huggingface.co/api/{datasets,spaces,models}?author=csoai — 161 repos listed, 161 indexed. every public repo the API listed for org csoai at build time, each pinned to its commit.
- PyPI: PyPI XML-RPC user_packages('nicholastempleman') + JSON API — 400 owned, 14 name candidates, 10 included by the ownership rule below. the account is shared by CSOAI, MEOK and CSGA Global; the other 386 projects it owns are not name candidates and are not indexed, including projects whose metadata names CSOAI Ltd but whose names lack 'csoai'/'gspc' (a known gap of this version). Only the latest release of each included project is pinned.
- npm: registry search maintainer:csga_global (a search index: PARTIAL by nature) + named seed ['csoai-gspc-mcp'] — 5 name candidates, 3 included by the ownership rule below.
- Web surfaces: https://csoai.org/.well-known/did.json, https://councilof.ai/api/gspc, https://councilof.ai/root.json, https://councilof.ai/api/state, https://councilof.ai/signed/card_index.json, https://councilof.ai/api/cards.
- Read state: **COMPLETE_FOR_STATED_SOURCES**.

Not enumerated:

- GitHub: the estate's GitHub accounts are flagged and the repos are not publicly readable; nothing from GitHub is indexed.
- Zenodo DOIs (e.g. 10.5281/zenodo.21991104 cited by /api/gspc): not enumerated in this version.
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


State words: VERIFIED = an Ed25519 check against a key pinned from the DID document returned true and a one-byte tamper control was rejected where recorded; FAILED = the stated rule was applied and the check returned false; PRESENT_NOT_VERIFIED = a signature is present but its preimage rule could not be recovered from the bytes (not evidence the signature is bad); PRESENT_KEY_NOT_IN_DID = signed by a key the DID document does not publish; UNSIGNED = no CSOAI signature found; PARTIAL = a mix, or caps stopped the check before every candidate was seen. OTS: pending = calendar commitment only; bitcoin-attested = a BitcoinBlockHeaderAttestation whose message equals the block header merkle root as served by a public block explorer (not a local node).

## trust-anchor (1)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [DID document holding the Ed25519 keys every signature here is pinned to](https://csoai.org/.well-known/did.json) | `1231cee4d60b` | NOT_APPLICABLE | none | NOT_DECLARED in the payload |  |

## board (2)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [GSPC board (live), site-attested snapshot](https://councilof.ai/api/gspc) | `be45a7ed47dc` | VERIFIED `board-attestation-1` | none | CC-BY-4.0 |  |
| [public Merkle root envelope over card_sha256 leaves](https://councilof.ai/root.json) | `ae8bbfcedf7c` | VERIFIED `board-attestation-1` | none | NOT_DECLARED in the payload |  |

## surface (3)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [living card registry](https://councilof.ai/api/cards) | `2fabc70062a8` | UNSIGNED | none | NOT_DECLARED in the payload |  |
| [live state: the numbers a lane may quote](https://councilof.ai/api/state) | `af1f451fadeb` | UNSIGNED | none | NOT_DECLARED in the payload |  |
| [signed card index (corpus 3 of 3)](https://councilof.ai/signed/card_index.json) | `4ff54c78dba0` | VERIFIED `card-attestation-1` (335 of 335 rows VERIFIED under did:web:csoai.org#card-attestation-1) | none | NOT_DECLARED in the payload |  |

## signed-record (32)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [csoai/a2a-card-census — record.signed.json](https://huggingface.co/datasets/csoai/a2a-card-census/resolve/4a952c85ed44f425a0c314b5c60e8bc9aafe5253/record.signed.json) | `b8caf1f8f4a5` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/claim-capture-census — artifacts/402index-services/402index-services-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/402index-services/402index-services-2026-09-22.signed.json) | `b0e03a9ba2d7` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/402index-services/402index-services-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/402index-services/402index-services-2026-09-23.signed.json) | `dfcedb3ff2bc` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/a2a-registry/a2a-registry-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/a2a-registry/a2a-registry-2026-09-22.signed.json) | `21b68f874451` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/a2a-registry/a2a-registry-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/a2a-registry/a2a-registry-2026-09-23.signed.json) | `a1646e1c3339` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/defillama-chains/defillama-chains-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-chains/defillama-chains-2026-09-22.signed.json) | `d8edb8eceed4` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/defillama-chains/defillama-chains-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-chains/defillama-chains-2026-09-23.signed.json) | `7d8fb25400f0` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/defillama-hacks/defillama-hacks-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-hacks/defillama-hacks-2026-09-22.signed.json) | `7b19e075a7a0` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/defillama-hacks/defillama-hacks-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-hacks/defillama-hacks-2026-09-23.signed.json) | `e4b661b10e8e` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/defillama-protocols/defillama-protocols-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-protocols/defillama-protocols-2026-09-22.signed.json) | `d19fded60452` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/defillama-protocols/defillama-protocols-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-protocols/defillama-protocols-2026-09-23.signed.json) | `c8d37b7b59f2` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/defillama-stablecoins/defillama-stablecoins-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-stablecoins/defillama-stablecoins-2026-09-22.signed.json) | `a2976f583481` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/defillama-stablecoins/defillama-stablecoins-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-stablecoins/defillama-stablecoins-2026-09-23.signed.json) | `b81cc486298f` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/defillama-yields/defillama-yields-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-yields/defillama-yields-2026-09-22.signed.json) | `51fcdb8964fa` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/defillama-yields/defillama-yields-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/defillama-yields/defillama-yields-2026-09-23.signed.json) | `5afc012e0a9e` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/mcp-registry/mcp-registry-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/mcp-registry/mcp-registry-2026-09-22.signed.json) | `ee2323c4255c` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/mcp-registry/mcp-registry-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/mcp-registry/mcp-registry-2026-09-23.signed.json) | `b67f2855dbcb` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-capture-census — artifacts/openrouter-models/openrouter-models-2026-09-22.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/openrouter-models/openrouter-models-2026-09-22.signed.json) | `6500a89a80cd` | VERIFIED `board-attestation-1` | pending | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-capture-census — artifacts/openrouter-models/openrouter-models-2026-09-23.signed.json](https://huggingface.co/datasets/csoai/claim-capture-census/resolve/6845417bcb6800c295aa6804c62d893e29fc2c1c/artifacts/openrouter-models/openrouter-models-2026-09-23.signed.json) | `df7070a275e9` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-23 |
| [csoai/claim-registries — ondo-chainlink/claimreg-ondo-chainlink-2026-09-22-rev2.signed.json](https://huggingface.co/datasets/csoai/claim-registries/resolve/0c846262d26f12ea08cc821e2278c0d6e6e3724e/ondo-chainlink/claimreg-ondo-chainlink-2026-09-22-rev2.signed.json) | `6938dc804232` | VERIFIED `board-attestation-1` | bitcoin-attested | NOT_DECLARED in the repo card | 2026-09-22 |
| [csoai/cross-ledger-supply — interop/cross-ledger-benji-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-benji-2026-09-25.signed.json) | `a82bfb795e58` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-bny-digital-cash-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-bny-digital-cash-2026-09-25.signed.json) | `dd76f430ce67` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-buidl-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-buidl-2026-09-25.signed.json) | `c65332b9c392` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-citi-token-services-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-citi-token-services-2026-09-25.signed.json) | `4cce291fc2d8` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-hsbc-tokenised-deposit-service-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-hsbc-tokenised-deposit-service-2026-09-25.signed.json) | `c95967c53dba` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-jpmd-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-jpmd-2026-09-25.signed.json) | `ea14b09b8b1c` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/cross-ledger-usdc-2026-09-25.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/cross-ledger-usdc-2026-09-25.signed.json) | `eee68d307c25` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/cross-ledger-supply — interop/institutional-evidence-links.signed.json](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/285b530070674e20b85e1bef61019cf7c4714af0/interop/institutional-evidence-links.signed.json) | `4382ebe4e5a1` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/hf-mcp-spaces-census — record.signed.json](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census/resolve/c66ca7ea8e89f87deb71ed63e40d708a316190b9/record.signed.json) | `80321ff86a6b` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/mcp-contract-parity — record.signed.json](https://huggingface.co/datasets/csoai/mcp-contract-parity/resolve/4b748fa270df65991a716f933533d07a900d0b16/record.signed.json) | `58458051bb7b` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/mcp-remote-census — record.signed.json](https://huggingface.co/datasets/csoai/mcp-remote-census/resolve/c3cd9c4876c6477122e2fccfc418bdc5537a0865/record.signed.json) | `99e0e2f0648c` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |
| [csoai/mcp-remote-census — record.v0.1.1.signed.json](https://huggingface.co/datasets/csoai/mcp-remote-census/resolve/c3cd9c4876c6477122e2fccfc418bdc5537a0865/record.v0.1.1.signed.json) | `9481ebd94a84` | VERIFIED `board-attestation-1` | bitcoin-attested | cc-by-4.0 | 2026-09-25 |

## dataset (120)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [csoai/a2a-card-census](https://huggingface.co/datasets/csoai/a2a-card-census/tree/4a952c85ed44f425a0c314b5c60e8bc9aafe5253) | `0a3a495998b8` | VERIFIED (VERIFIED 1) | mixed (3 proofs, 3 checked) | cc-by-4.0 | 2026-09-25 |
| [csoai/a2a-census](https://huggingface.co/datasets/csoai/a2a-census/tree/ab721dab02346c66c79d6878f3469fe06fa48612) | `9343a827bbea` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-09-01 |
| [csoai/agent-interop-census](https://huggingface.co/datasets/csoai/agent-interop-census/tree/c466fb8d4ad605b9238a2046cacaba7a96e3bea2) | `c62b13c44e9f` | UNSIGNED | none | cc-by-4.0 | 2026-09-05 |
| [csoai/agisafe-bench](https://huggingface.co/datasets/csoai/agisafe-bench/tree/365b27654fa03959e3b48930ebe47614352e9613) | `63656197f446` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/aiact-frozen-split-harness](https://huggingface.co/datasets/csoai/aiact-frozen-split-harness/tree/51332aeabdbd25d01113306e9dae6b75ffae8757) | `22c0a8bc0a4f` | UNSIGNED | none | cc-by-4.0 | 2026-08-02 |
| [csoai/arena-elo-by-axis](https://huggingface.co/datasets/csoai/arena-elo-by-axis/tree/a144ba7dd11b0db42a4c345cca1236602612bcb3) | `9db5ef293f7f` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/arena-matrices](https://huggingface.co/datasets/csoai/arena-matrices/tree/783eedde4d2e883714a76f666ae8eb9c26b5e187) | `41332f4c7257` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/arena-rounds](https://huggingface.co/datasets/csoai/arena-rounds/tree/3db3162357c34f517f17c342f44e82cb952f0ba9) | `b4a3495072fc` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/asisec-bench](https://huggingface.co/datasets/csoai/asisec-bench/tree/f8f980cf2213537e6f8939f184776df5cb689113) | `2a723ba64c21` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/attestation-network-2026-09-14](https://huggingface.co/datasets/csoai/attestation-network-2026-09-14/tree/33a6ce5bd9145c1a2bcccf6e94f29e555155108e) | `b273975c46fd` | UNSIGNED | none | cc-by-4.0 | 2026-09-14 |
| [csoai/cinematic-world-stills](https://huggingface.co/datasets/csoai/cinematic-world-stills/tree/08f7cd6ec3737f78ca5667a1a2310d7c4a6d4a1f) | `0c1b55e2fbaf` | UNSIGNED | none | cc-by-4.0 | 2026-08-30 |
| [csoai/claim-capture-census](https://huggingface.co/datasets/csoai/claim-capture-census/tree/6845417bcb6800c295aa6804c62d893e29fc2c1c) | `1310c04f37bd` | VERIFIED (VERIFIED 18) | mixed (36 proofs, 36 checked) | cc-by-4.0 | 2026-09-22 |
| [csoai/claim-registries](https://huggingface.co/datasets/csoai/claim-registries/tree/0c846262d26f12ea08cc821e2278c0d6e6e3724e) | `ee28243f33e6` | VERIFIED (VERIFIED 1) | mixed (6 proofs, 6 checked) | NOT_DECLARED in the repo card | 2026-09-22 |
| [csoai/claimguard](https://huggingface.co/datasets/csoai/claimguard/tree/988e74e419ebf84478fa56e9f3b70e5953ac88dd) | `3b78122a3c09` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/coai-bench](https://huggingface.co/datasets/csoai/coai-bench/tree/83c037647fe03b0e4a32331318590f71f94205f3) | `7b593ff6bfb2` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/compbench](https://huggingface.co/datasets/csoai/compbench/tree/2b1a46cf866d4ebcbaa28793d58484fa0bf040fa) | `3e891386955a` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/council-brand](https://huggingface.co/datasets/csoai/council-brand/tree/9d872bc9f14bd795df0f193dec9a541862d4dc37) | `cf43450e9136` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/council-of-ai](https://huggingface.co/datasets/csoai/council-of-ai/tree/9d8ed078557e2c8e30e725a88b46e4415300fdaf) | `d725553e6d7e` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/council-os](https://huggingface.co/datasets/csoai/council-os/tree/7506efa6ae49ffd9466a7ab6a3f4409c3d065b86) | `9ec3aa4e3a94` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/council-space](https://huggingface.co/datasets/csoai/council-space/tree/62d5824a16e192b1b88ee6433615156ba129871b) | `9b94f21e4e98` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/councilof-ai-mirror](https://huggingface.co/datasets/csoai/councilof-ai-mirror/tree/a781fa67c12581324c2fa2eb29639fff63259c46) | `5c62a465bd01` | NOT_CHECKED | mixed (20 proofs, 20 checked) | cc-by-4.0 | 2026-09-02 |
| [csoai/councilof-ai-source](https://huggingface.co/datasets/csoai/councilof-ai-source/tree/c6ec5c545301430c046cf0609cb8081986310538) | `364831442256` | NOT_CHECKED | PARTIAL (2435 proofs, 60 checked) | cc-by-4.0 | 2026-09-02 |
| [csoai/cross-ledger-supply](https://huggingface.co/datasets/csoai/cross-ledger-supply/tree/285b530070674e20b85e1bef61019cf7c4714af0) | `8acab7bb1a3d` | VERIFIED (VERIFIED 8) | mixed (16 proofs, 16 checked) | cc-by-4.0 | 2026-09-25 |
| [csoai/east-west](https://huggingface.co/datasets/csoai/east-west/tree/20d54397cb9489129889adc6a9793ddcd9fb8a13) | `9a5cbabd7957` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/eldorado-data-listing](https://huggingface.co/datasets/csoai/eldorado-data-listing/tree/20bc36b1587ba339a5b9f93defd1f68fe53a270f) | `6778d3e6b39a` | UNSIGNED | none | apache-2.0 | 2026-08-24 |
| [csoai/eldorado-eval-results](https://huggingface.co/datasets/csoai/eldorado-eval-results/tree/97b0a5b43040e9f208762ce03b28c5b9e16ec73e) | `6779d9f0dfb5` | UNSIGNED | none | cc-by-4.0 | 2026-08-24 |
| [csoai/erc8004-reader](https://huggingface.co/datasets/csoai/erc8004-reader/tree/da2835fb7e83cdc9aa9f4d494a5e0ebed71d8aa2) | `b2df65728b15` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-09-01 |
| [csoai/faq](https://huggingface.co/datasets/csoai/faq/tree/16d88a285e94844ff8e689399b18d6db1ef14d12) | `5deff2052ce9` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/fleet-status](https://huggingface.co/datasets/csoai/fleet-status/tree/f706ec3cdbbc66f34cf0cb5adb8dc6d4f5fa452c) | `179b7ab843d8` | UNSIGNED | none | cc-by-4.0 | 2026-09-25 |
| [csoai/games-catalog](https://huggingface.co/datasets/csoai/games-catalog/tree/73f16331b071c4e0d44ff78b0c531ae28d763928) | `a3847c2ecbde` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-affect](https://huggingface.co/datasets/csoai/gspc-affect/tree/eef3133b13b467c4f5dd04265a75a4c6b3511358) | `20c9841a0635` | UNSIGNED | none | cc-by-4.0 | 2026-08-12 |
| [csoai/gspc-agi](https://huggingface.co/datasets/csoai/gspc-agi/tree/175905fc7e2622162cc67f7d2fac0d202346f1e0) | `52c2a174a76a` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-ai-economy-index](https://huggingface.co/datasets/csoai/gspc-ai-economy-index/tree/9cfdd298e30bc4d397c6e0f21f4ee35e14181358) | `6de3a43c08cb` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-airbench-eu-mandatory-run](https://huggingface.co/datasets/csoai/gspc-airbench-eu-mandatory-run/tree/102b91dcb7e483065a48546d3782eba95091da6e) | `9e638a78fd99` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/gspc-arena-results](https://huggingface.co/datasets/csoai/gspc-arena-results/tree/57f5bdb02caf9ad0c2fa7d5b01d91c74ed074230) | `c2ebf5f4b0da` | PARTIAL (PRESENT_KEY_NOT_IN_DID 1) | none | cc-by-4.0 | 2026-08-06 |
| [csoai/gspc-art5](https://huggingface.co/datasets/csoai/gspc-art5/tree/ce4c973f75e46c8e4762c62328d45b2c5c41a84b) | `fe00fa4b8438` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-asi](https://huggingface.co/datasets/csoai/gspc-asi/tree/8734a981a460ec8b98d3f8ea4fe4ff23496d1a12) | `54ba5aecf645` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-autoeat](https://huggingface.co/datasets/csoai/gspc-autoeat/tree/f79ede4d497a553dedcca4bd5e199578d777f103) | `f264992ffcff` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-axis-corpus](https://huggingface.co/datasets/csoai/gspc-axis-corpus/tree/4f3df9377385e0b3b9c186f54997908435a073da) | `db14b1d1caf8` | PARTIAL (PRESENT_NOT_VERIFIED 1) | none | cc-by-4.0 | 2026-08-24 |
| [csoai/gspc-bench-results](https://huggingface.co/datasets/csoai/gspc-bench-results/tree/7c013b8d39c3467cba48fd660b168a9b0243ad68) | `ff8689b62cd8` | UNSIGNED | none | cc-by-4.0 | 2026-08-24 |
| [csoai/gspc-board](https://huggingface.co/datasets/csoai/gspc-board/tree/e64e1378354fae0f4b84a6d32bded66e57272a0c) | `c006b70dc834` | UNSIGNED | bitcoin-attested (3 proofs, 3 checked) | cc-by-4.0 | 2026-08-24 |
| [csoai/gspc-boards](https://huggingface.co/datasets/csoai/gspc-boards/tree/826305a325191b55a5f504aa26c8492a77e1a661) | `11f9ccc3f912` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-08-12 |
| [csoai/gspc-care](https://huggingface.co/datasets/csoai/gspc-care/tree/7a46ee2663cf6bb4e45720c4f25bd22a2906d1ea) | `ced5897dbf5f` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/gspc-compare](https://huggingface.co/datasets/csoai/gspc-compare/tree/2df85a5da6ae225b9fb41e838ab0ab075c2d7ad8) | `47fb41d30ba6` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-custody-disclosure](https://huggingface.co/datasets/csoai/gspc-custody-disclosure/tree/69f71faa65664a2ca05eb1d0257f79f76d844a70) | `999380a6438d` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-det](https://huggingface.co/datasets/csoai/gspc-det/tree/2c8d7a1df4aa070e2d65f3a07a1b5b31d79b690a) | `1a7e80dd1e4f` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-distribution-integrity](https://huggingface.co/datasets/csoai/gspc-distribution-integrity/tree/303b7bb63d8d70f62d99562afc740ecd0cb28125) | `56f0c264f851` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-drift](https://huggingface.co/datasets/csoai/gspc-drift/tree/93b87613925bcebe83694f73da13e1d51640c459) | `c37a94bac7ab` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/gspc-estate](https://huggingface.co/datasets/csoai/gspc-estate/tree/3294e1eb60d715721d275d4e06ee94591ae21f7c) | `200c640b8602` | PARTIAL (PRESENT_NOT_VERIFIED 20, VERIFIED 2413) | none | cc-by-4.0 | 2026-09-22 |
| [csoai/gspc-fleet](https://huggingface.co/datasets/csoai/gspc-fleet/tree/383f6552cf604efc3165092e24583ac4b00ad34a) | `1a2e91137f1c` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-gap-index](https://huggingface.co/datasets/csoai/gspc-gap-index/tree/390e0d0e268789404efed3f520bd670b4779a97a) | `dc229ff7fd07` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-genai-mil-notices](https://huggingface.co/datasets/csoai/gspc-genai-mil-notices/tree/1797831d55c4d99ad2d5945f2baacdfbf5cbd533) | `b19a6d427202` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-gov](https://huggingface.co/datasets/csoai/gspc-gov/tree/9da4e52225f1d88521225c09e7c2996159eeab29) | `02d33fabd788` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-hf-estate-index](https://huggingface.co/datasets/csoai/gspc-hf-estate-index/tree/181628ab4882c71c5809fb255df057308e3a9590) | `c603e0fd2993` | UNSIGNED | none | cc-by-4.0 | 2026-09-17 |
| [csoai/gspc-hf-model-census](https://huggingface.co/datasets/csoai/gspc-hf-model-census/tree/92a55cd7e0554e6e24abd0b7aad07d07c713d013) | `f71471f65bc2` | UNSIGNED | none | apache-2.0 | 2026-09-03 |
| [csoai/gspc-hub-cards](https://huggingface.co/datasets/csoai/gspc-hub-cards/tree/5f92d7556451dd75d88aa87c80e7616039b35725) | `2363085516ab` | PARTIAL (VERIFIED 150) | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-human-labour-index](https://huggingface.co/datasets/csoai/gspc-human-labour-index/tree/5f65f6c6c26893bf7688ff872fc2b6820488fd87) | `61f6e720ddca` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-humanoid-labour-index](https://huggingface.co/datasets/csoai/gspc-humanoid-labour-index/tree/aff4c241fa89eb626689ac1a8f90783761a748ad) | `c28b9c8c902a` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-interop](https://huggingface.co/datasets/csoai/gspc-interop/tree/a6b1d4042ff7327a4c5026827abdbd73e7d837c8) | `6ce865b86928` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-jail](https://huggingface.co/datasets/csoai/gspc-jail/tree/94d2819a8f731f4723e4973b512e95a1956fd279) | `2f803f1e48db` | UNSIGNED | none | cc-by-4.0 | 2026-08-13 |
| [csoai/gspc-jail-goldbank](https://huggingface.co/datasets/csoai/gspc-jail-goldbank/tree/7bf0395b15719a670d5d94db2d002009a3aabb08) | `3fb6a68c4812` | UNSIGNED | none | cc-by-4.0 | 2026-08-25 |
| [csoai/gspc-kernel-results](https://huggingface.co/datasets/csoai/gspc-kernel-results/tree/f1da8a922ca846ec1cbe30db8af87345714cf690) | `ad42535a50c0` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/gspc-leaderboard-results](https://huggingface.co/datasets/csoai/gspc-leaderboard-results/tree/4d2a3c424e4178b7133483d6bfa3225decff6983) | `fe3d7379429f` | UNSIGNED | none | cc-by-4.0 | 2026-08-25 |
| [csoai/gspc-mach](https://huggingface.co/datasets/csoai/gspc-mach/tree/6e7ec3dbe4965c313e1cb9861eea283f3180c0c4) | `0ab2cd257ba7` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-mcp](https://huggingface.co/datasets/csoai/gspc-mcp/tree/e26191c6aafcee6dca1034f7552503e43d0c9e06) | `0f302084f889` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-normalized](https://huggingface.co/datasets/csoai/gspc-normalized/tree/2d32f295fbea62ee234f266d1f040203a43de60c) | `c6136761e126` | UNSIGNED | none | cc-by-4.0 | 2026-08-08 |
| [csoai/gspc-ontology](https://huggingface.co/datasets/csoai/gspc-ontology/tree/b1c56a2c5dca8d98daff4ada9ac3d8ed8b9e356a) | `73999666fb64` | UNSIGNED | none | cc0-1.0 | 2026-09-22 |
| [csoai/gspc-oss](https://huggingface.co/datasets/csoai/gspc-oss/tree/f61745a2a6b1b7b8c8751a53347d965b13dcf6a7) | `1da414c04801` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-own-models-measured](https://huggingface.co/datasets/csoai/gspc-own-models-measured/tree/c8415c6403cf07b8bfdbaf67f2d31163542a04a2) | `f60d58c685a2` | UNSIGNED | none | apache-2.0 | 2026-09-01 |
| [csoai/gspc-papers](https://huggingface.co/datasets/csoai/gspc-papers/tree/c446cba1d78193be0eb48b62a2e8b472228b7ace) | `d55db579901f` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-provenance-controls](https://huggingface.co/datasets/csoai/gspc-provenance-controls/tree/5514f49c743722c72ddb3d5ac8dfa4e7498a9c53) | `fb3ae93130df` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-prv](https://huggingface.co/datasets/csoai/gspc-prv/tree/bd603ee0d03a78152febbd0599e85f6c18324254) | `64e5beee4a56` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/gspc-regulatory-framework](https://huggingface.co/datasets/csoai/gspc-regulatory-framework/tree/b357188aae02f4163624cfccf53df9b962416b75) | `e5d6d98c2b9b` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-reserve-attestation](https://huggingface.co/datasets/csoai/gspc-reserve-attestation/tree/d8bb19120526ea0aa6844c1723aa9856d3fc99df) | `5d2217164459` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-signed-boards](https://huggingface.co/datasets/csoai/gspc-signed-boards/tree/73b681ea484f7eaa8dad236bf3676197fbc2bbfe) | `6e367b30f300` | PARTIAL (PRESENT_NOT_VERIFIED 18, VERIFIED 2) | none | cc-by-4.0 | 2026-08-23 |
| [csoai/gspc-sim-cards](https://huggingface.co/datasets/csoai/gspc-sim-cards/tree/823f647fcf8471f1b9e1501a4a190c4a9e26fc96) | `f53609a8a10d` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/gspc-swarm](https://huggingface.co/datasets/csoai/gspc-swarm/tree/59fe75d3c3f7c62437f6a3192ba18fe244fcd899) | `05f18952a20e` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/gspc-swift-17](https://huggingface.co/datasets/csoai/gspc-swift-17/tree/5bb352e652a8193c244b88ba5731f814c99b7d88) | `503efca464ac` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-swift-26](https://huggingface.co/datasets/csoai/gspc-swift-26/tree/2fefb77496c7748e6c282f9430dcafeeb777ceb0) | `3c1592781b3a` | UNSIGNED | none | cc-by-4.0 | 2026-09-02 |
| [csoai/gspc-swift-50](https://huggingface.co/datasets/csoai/gspc-swift-50/tree/3cceda634104ec2b5e21b2952aad1051a7f2a33d) | `47afa2deb28c` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-top100](https://huggingface.co/datasets/csoai/gspc-top100/tree/2dc2739411a4e52a4ae7580aaeae9d9ef9cf92e1) | `242873bfae61` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-verify](https://huggingface.co/datasets/csoai/gspc-verify/tree/ee943149a458ab28a9b5df34f89e2e2d1b3f85a9) | `6d51aff6bdbd` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-xr](https://huggingface.co/datasets/csoai/gspc-xr/tree/9f67daad5911051b844e5cd854eda03fc869d949) | `1d289ababf64` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-xrpl-16](https://huggingface.co/datasets/csoai/gspc-xrpl-16/tree/74255c618f1725d616d1c2cea0377539ed386824) | `237efa9c6104` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-09-01 |
| [csoai/hf-mcp-spaces-census](https://huggingface.co/datasets/csoai/hf-mcp-spaces-census/tree/c66ca7ea8e89f87deb71ed63e40d708a316190b9) | `572e34fe3713` | VERIFIED (VERIFIED 1) | mixed (3 proofs, 3 checked) | cc-by-4.0 | 2026-09-25 |
| [csoai/hub-queue](https://huggingface.co/datasets/csoai/hub-queue/tree/5448f46498e9fee4dce5ddf3d9f8fdb890c96647) | `56ccf6a774e1` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/index-presence](https://huggingface.co/datasets/csoai/index-presence/tree/ac7d18152ad10ac41b0244155d72d7a8a3107f2d) | `28276450b0c2` | UNSIGNED | none | NOT_DECLARED in the repo card | 2026-09-22 |
| [csoai/jail-floor](https://huggingface.co/datasets/csoai/jail-floor/tree/d8aa0e55b7ab5a4083490f7e8f8207b766fd1fed) | `241dc82fa175` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/labour-economy-unmeasured](https://huggingface.co/datasets/csoai/labour-economy-unmeasured/tree/5dec57cf1adfdde9080cf5bdeaec5e5326096010) | `fa4004ed2cff` | UNSIGNED | none | mit | 2026-08-29 |
| [csoai/living-catalog](https://huggingface.co/datasets/csoai/living-catalog/tree/94ae4829295b50fcc7bcae745395910057bc96d1) | `fe9667efbaa1` | UNSIGNED | none | mit | 2026-08-28 |
| [csoai/living-gspc-board-2026-09-14](https://huggingface.co/datasets/csoai/living-gspc-board-2026-09-14/tree/bde45b3729f74592172a3804afd3e6f27f0016c8) | `0578e05df83e` | UNSIGNED | none | cc-by-4.0 | 2026-09-14 |
| [csoai/lmeval-official-format](https://huggingface.co/datasets/csoai/lmeval-official-format/tree/96422ec6a77ec07113bbdf8d018679330c9361f4) | `d92e144e6d77` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/mcp-census](https://huggingface.co/datasets/csoai/mcp-census/tree/412455bbe145e298b6e238ee9472bb354ed65a98) | `7166bc9a8d1d` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-09-01 |
| [csoai/mcp-contract-parity](https://huggingface.co/datasets/csoai/mcp-contract-parity/tree/4b748fa270df65991a716f933533d07a900d0b16) | `e9b99d9f74ae` | VERIFIED (VERIFIED 1) | mixed (2 proofs, 2 checked) | cc-by-4.0 | 2026-09-25 |
| [csoai/mcp-fabric](https://huggingface.co/datasets/csoai/mcp-fabric/tree/2d800e962f393bc32eb5bd5547f09a89f9cb2fc2) | `38c1a419bad4` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/mcp-registry-self-audit](https://huggingface.co/datasets/csoai/mcp-registry-self-audit/tree/33d94f9fa1f0dc7f0660941c2279795b47cb285a) | `0aad3451be9f` | UNSIGNED | none | cc-by-4.0 | 2026-09-05 |
| [csoai/mcp-remote-census](https://huggingface.co/datasets/csoai/mcp-remote-census/tree/c3cd9c4876c6477122e2fccfc418bdc5537a0865) | `07ff700d63f8` | VERIFIED (VERIFIED 2) | mixed (6 proofs, 6 checked) | cc-by-4.0 | 2026-09-25 |
| [csoai/mcp-scoreboard](https://huggingface.co/datasets/csoai/mcp-scoreboard/tree/a99a4a6095ea919babc4100001f2f605a7a3ecf0) | `05c70bafbd35` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/measured-vs-reported](https://huggingface.co/datasets/csoai/measured-vs-reported/tree/349b880e443a323655ff850ead71f56ae8c526ea) | `76ab4d014752` | UNSIGNED | none | cc-by-4.0 | 2026-08-23 |
| [csoai/omai-bench](https://huggingface.co/datasets/csoai/omai-bench/tree/13ce0f7a919603e38f00299441964a42f8ab3a9f) | `3da752106e30` | UNSIGNED | none | cc-by-4.0 | 2026-08-04 |
| [csoai/oss-model-census](https://huggingface.co/datasets/csoai/oss-model-census/tree/b2b3835d9696878917ddc053930ffbc50ffb7252) | `053d496ad2a5` | UNSIGNED | none | cc0-1.0 | 2026-09-01 |
| [csoai/poai-bench](https://huggingface.co/datasets/csoai/poai-bench/tree/587e176d54b1efe7ff7104f1c6ee2f9b12d3dd42) | `3c825cd731a6` | UNSIGNED | none | cc-by-4.0 | 2026-08-03 |
| [csoai/ras-assess](https://huggingface.co/datasets/csoai/ras-assess/tree/762ed5cb1dd81948eae3395006b0198e643a05e3) | `a8c027cbf2d8` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/registry-harvest-xrpl-mica-lei](https://huggingface.co/datasets/csoai/registry-harvest-xrpl-mica-lei/tree/dfe2b6c56273f9ed01242ca469d9f74662ea550c) | `bd3e882c42e6` | UNSIGNED | none | cc-by-4.0 | 2026-09-04 |
| [csoai/revenue-history](https://huggingface.co/datasets/csoai/revenue-history/tree/733ad14db6f2d4e2c89c16a4548f082b4ff670fc) | `5d69b03cc2e9` | UNSIGNED | none | cc-by-4.0 | 2026-09-14 |
| [csoai/rwa-attest](https://huggingface.co/datasets/csoai/rwa-attest/tree/9f68b6e870c013da82f7ed4c5196814e59f8b536) | `fd1a7975c0a1` | UNSIGNED (UNSIGNED 1) | none | cc-by-4.0 | 2026-08-25 |
| [csoai/rwa-onchain-measurement](https://huggingface.co/datasets/csoai/rwa-onchain-measurement/tree/f6cc29c677d3880507f7b60f1751e83506b58ed8) | `cef69a82e712` | UNSIGNED | none | cc-by-4.0 | 2026-08-26 |
| [csoai/rwa-testnet-unmeasured](https://huggingface.co/datasets/csoai/rwa-testnet-unmeasured/tree/5c0930808118c0fee55200c6f1f123536eec8872) | `53d6dd9df875` | UNSIGNED | none | mit | 2026-08-29 |
| [csoai/signed-fleet-boards-v2](https://huggingface.co/datasets/csoai/signed-fleet-boards-v2/tree/1c1f74f714c3c0dc89709d8da304882dc0641073) | `3418b1b4b75b` | PARTIAL (PRESENT_NOT_VERIFIED 150) | none | cc-by-4.0 | 2026-08-20 |
| [csoai/signed-measurement-records](https://huggingface.co/datasets/csoai/signed-measurement-records/tree/70a68271892bfd26da217c4efecd824291a2b70d) | `16018d347ed8` | UNSIGNED | none | cc-by-4.0 | 2026-08-22 |
| [csoai/swift-17](https://huggingface.co/datasets/csoai/swift-17/tree/72c70175b63f0fe9a53011f25877abe2ba3ab32d) | `975f63a67bdf` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/trust-chain-freshness](https://huggingface.co/datasets/csoai/trust-chain-freshness/tree/242b3cb18b398174b8db6a448ba11d7257c437c2) | `58ba465adfff` | UNSIGNED | PARTIAL (646 proofs, 60 checked) | cc-by-4.0 | 2026-09-22 |
| [csoai/unified-evidence-factory-2026-09-19](https://huggingface.co/datasets/csoai/unified-evidence-factory-2026-09-19/tree/fe7e9ca9d1680fe12da459830cf002852132e389) | `7e93c6ef5b63` | UNSIGNED (UNSIGNED 52) | none | cc-by-4.0 | 2026-09-19 |
| [csoai/white-label-eu-ai-act-regulator-findings](https://huggingface.co/datasets/csoai/white-label-eu-ai-act-regulator-findings/tree/81145a054b9a4438faadab14afc114a4defc6969) | `d026e370040a` | VERIFIED (VERIFIED 1) | none | other | 2026-08-26 |
| [csoai/wrapped-asset-parity](https://huggingface.co/datasets/csoai/wrapped-asset-parity/tree/f6c8daa90fba59ee0b0020f4e8c0333354ba3318) | `361d6bd972d0` | UNSIGNED | none | cc-by-4.0 | 2026-09-14 |
| [csoai/x402-bazaar-census](https://huggingface.co/datasets/csoai/x402-bazaar-census/tree/90d5f4f9c7fe3f7e07550011f07874e2ff67bfaf) | `b54023d340ba` | UNSIGNED | none | cc-by-4.0 | 2026-09-04 |
| [csoai/x402-bazaar-conformance](https://huggingface.co/datasets/csoai/x402-bazaar-conformance/tree/a37fa141559582bb008e37c5bce07d9792a2e3bb) | `54a10042221a` | UNSIGNED | mixed (4 proofs, 4 checked) | cc-by-4.0 | 2026-09-04 |
| [csoai/x402-free-discovery-2026-09-14](https://huggingface.co/datasets/csoai/x402-free-discovery-2026-09-14/tree/1b54a617be9ee5870050ece1fea9e893b5e0e908) | `9ec24793a084` | UNSIGNED | none | cc-by-4.0 | 2026-09-14 |
| [csoai/x402-settlement-census](https://huggingface.co/datasets/csoai/x402-settlement-census/tree/c8bfdb2f0d5d1d7f807e4602a2e1f151e4eedbfe) | `044d25b70163` | UNSIGNED | none | cc-by-4.0 | 2026-09-06 |
| [csoai/xrpl-16-reader](https://huggingface.co/datasets/csoai/xrpl-16-reader/tree/879f4642b3fb4b45ad1370fffcb50ba30fecda31) | `48212d4b7add` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |

## space (39)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [csoai/claimguard](https://huggingface.co/spaces/csoai/claimguard/tree/fa3d77350bdade56851a40f99fdab0fcf480e240) | `f1c430a68ee5` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/council-city](https://huggingface.co/spaces/csoai/council-city/tree/5f8254b42791c3fdfc5a1baf4dc6196723db33fe) | `fa37ecbc7538` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/council-coliseum](https://huggingface.co/spaces/csoai/council-coliseum/tree/59810ad0e7a68f09a5b0b23eda5418742ec8c177) | `8006283a3a2f` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/council-mcp-playground](https://huggingface.co/spaces/csoai/council-mcp-playground/tree/6fc01b6f03e6c9ee010b894d1ddaf44ae1a151d5) | `6cafacb2622c` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/council-os](https://huggingface.co/spaces/csoai/council-os/tree/bbe65b9083b1711dc9d86c9c252115aea5c4a60b) | `57ecc2fbb943` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/council-space](https://huggingface.co/spaces/csoai/council-space/tree/14a540053398a0e6cad2c87c65e63209be611812) | `268476dd5a01` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/csoai-gspc-mcp](https://huggingface.co/spaces/csoai/csoai-gspc-mcp/tree/2d81238e1b7f50769f93e370be6609ccac8aeda6) | `c8812b2c8609` | UNSIGNED | none | apache-2.0 | 2026-09-25 |
| [csoai/east-west](https://huggingface.co/spaces/csoai/east-west/tree/0352c625548c4b3e3227786370efc94a0a8ccce3) | `f1555c703aa3` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/faq](https://huggingface.co/spaces/csoai/faq/tree/29eff691610a6536ffe0ac4ddbd9e2af9dabf11f) | `7ab22ce842c2` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/games-catalog](https://huggingface.co/spaces/csoai/games-catalog/tree/6dd407a55c42bad544135f0e56df24da834b0655) | `7261ed0f5cdc` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-affect](https://huggingface.co/spaces/csoai/gspc-affect/tree/7fa05fceafc493745f3576f7125c608cdf44216e) | `d96238cb503b` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-agi](https://huggingface.co/spaces/csoai/gspc-agi/tree/e6b1f67a33a343fcf2df341bfe084877863cdf32) | `b1c82a47ceee` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-art5](https://huggingface.co/spaces/csoai/gspc-art5/tree/bea55116d8d22faa9746bf5feb90c6a76c039fb0) | `ced074ffac64` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-asi](https://huggingface.co/spaces/csoai/gspc-asi/tree/5c7529cc98615e12a892cae2d95c6ddb5b7c8b53) | `908a2257176e` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-board](https://huggingface.co/spaces/csoai/gspc-board/tree/cf9ede3a5aaa43279feb137c334384719aa47bb8) | `6b0c3f2b83c7` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-care](https://huggingface.co/spaces/csoai/gspc-care/tree/e372333770c985d4ef023653c40dbd90be9e0a5e) | `2348e2e7dff4` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-det](https://huggingface.co/spaces/csoai/gspc-det/tree/56e1bca9561b46815965830085dbfee282827c66) | `2b94a3432ef0` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-explorer](https://huggingface.co/spaces/csoai/gspc-explorer/tree/4b12a4f28ec9a6f727cffb946eab31d3fd5baefe) | `f163b94eda34` | UNSIGNED | none | cc-by-4.0 | 2026-09-01 |
| [csoai/gspc-gov](https://huggingface.co/spaces/csoai/gspc-gov/tree/a76e39b0f343a200130c7e4cd98895faebd3e18a) | `5249e838abfc` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-governance-leaderboard](https://huggingface.co/spaces/csoai/gspc-governance-leaderboard/tree/6912d590980b26964aabf59ce14e05c5ef7858fd) | `732e66d83ac4` | UNSIGNED | none | cc-by-4.0 | 2026-08-24 |
| [csoai/gspc-governance-leaderboard-spc](https://huggingface.co/spaces/csoai/gspc-governance-leaderboard-spc/tree/4e2261707fc4f1cf2c93f5f191f91cdfae2e0da3) | `11c18a1f3d38` | UNSIGNED | none | cc-by-4.0 | 2026-08-24 |
| [csoai/gspc-interop](https://huggingface.co/spaces/csoai/gspc-interop/tree/f022f30b133e884ecd49b54880d1e2d15c98125a) | `05fb2b1b41f7` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/gspc-live-board](https://huggingface.co/spaces/csoai/gspc-live-board/tree/28edea2fdc0d422458bce710610e5feb931bb6a7) | `130baf41c85f` | UNSIGNED | none | cc-by-4.0 | 2026-09-02 |
| [csoai/gspc-lookup](https://huggingface.co/spaces/csoai/gspc-lookup/tree/e1cd158242a98f8f7b31ac15a3336f861096a873) | `9cd09eb58f49` | UNSIGNED | none | cc-by-4.0 | 2026-09-02 |
| [csoai/gspc-mach](https://huggingface.co/spaces/csoai/gspc-mach/tree/bea264cb620498eb3fa43420a1120ef9af9015b4) | `9789f5f08e56` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-mcp](https://huggingface.co/spaces/csoai/gspc-mcp/tree/0367d257a42486de79ae3472bd2d867d1db57a8e) | `f2cfe292c48f` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-mill](https://huggingface.co/spaces/csoai/gspc-mill/tree/ee56995193d1848f5a1a037a0d3178468c621e24) | `f9f11d76b25e` | UNSIGNED | none | apache-2.0 | 2026-09-01 |
| [csoai/gspc-node](https://huggingface.co/spaces/csoai/gspc-node/tree/3ea8cf6f4222d7287295e7b2c8c0d7e6c27de74e) | `580625ee44b8` | UNSIGNED | none | mit | 2026-08-31 |
| [csoai/gspc-oss](https://huggingface.co/spaces/csoai/gspc-oss/tree/ceb15c290f7d884ead4d3db3f094842d880c43d8) | `f392ee3406ec` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-prv](https://huggingface.co/spaces/csoai/gspc-prv/tree/e73dd76d35e57299ab555a21e95e1da6292ccdfb) | `961f148c4a9e` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-swarm](https://huggingface.co/spaces/csoai/gspc-swarm/tree/aa82dc41e73d6652f2fe385f616ea3fd566055b8) | `3f944eb9353d` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/gspc-verify](https://huggingface.co/spaces/csoai/gspc-verify/tree/63b0b39f1a52ddfb4d8c1fb98e96f04f9ecb9c6f) | `644d22e0f91f` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/gspc-xr](https://huggingface.co/spaces/csoai/gspc-xr/tree/3974870f73ca91152379d3c94f8796241d66ffbc) | `d2a175a1c6c7` | UNSIGNED | none | cc-by-4.0 | 2026-08-05 |
| [csoai/jail-floor](https://huggingface.co/spaces/csoai/jail-floor/tree/adfb0eadbc82157b34dc6637813af6f7347c943f) | `5bb50466f55c` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/living-catalog](https://huggingface.co/spaces/csoai/living-catalog/tree/14a5bd0a29e2e2527ed5854ee6cbb693c70bafb7) | `279f0bf21251` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/mcp-fabric](https://huggingface.co/spaces/csoai/mcp-fabric/tree/9462708e0e54386f5655595b92b79c249a83d8b6) | `960be979a901` | UNSIGNED | none | cc-by-4.0 | 2026-08-29 |
| [csoai/measurement-card-verifier](https://huggingface.co/spaces/csoai/measurement-card-verifier/tree/4a997debc2a8b8ebd2a4363c26a6554fd0869afd) | `1d6d5505890a` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/ras-assess](https://huggingface.co/spaces/csoai/ras-assess/tree/d16769509ac3fbfb2fda1fd7d9de7bbb2793a6ad) | `f3c4bf8299a7` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |
| [csoai/verify-demo](https://huggingface.co/spaces/csoai/verify-demo/tree/0dca5f499afee5ee99bceaa5c1432c925461fd48) | `2a6ac10171ba` | UNSIGNED | none | cc-by-4.0 | 2026-08-28 |

## model (2)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [csoai/clan-csoai-plain](https://huggingface.co/csoai/clan-csoai-plain/tree/f5cacc92afb734dee56d253c1c1f14538bcb3505) | `de473a88fbc8` | UNSIGNED | none | apache-2.0 | 2026-09-01 |
| [csoai/council-safe](https://huggingface.co/csoai/council-safe/tree/28d654461ef3a4d62cd0497f867145406c19b6eb) | `2b636f28219e` | UNSIGNED | none | apache-2.0 | 2026-09-01 |

## package (13)

| item | sha256 | signature | OTS | licence | published |
|---|---|---|---|---|---|
| [npm csoai-gspc-mcp 0.2.2](https://www.npmjs.com/package/csoai-gspc-mcp/v/0.2.2) | `c3c1e7c2b949` | UNSIGNED | none | Apache-2.0 | 2026-08-28 |
| [npm csoai-lib2b 0.1.0](https://www.npmjs.com/package/csoai-lib2b/v/0.1.0) | `4faac436ba4f` | UNSIGNED | none | MIT | 2026-05-31 |
| [npm csoai-x402-rail-client 0.1.0](https://www.npmjs.com/package/csoai-x402-rail-client/v/0.1.0) | `a7a0e3c2afa9` | UNSIGNED | none | MIT | 2026-09-16 |
| [PyPI crewai-csoai 0.1.0](https://pypi.org/project/crewai-csoai/0.1.0/) | `92ae2c19253d` | UNSIGNED | none | Apache-2.0 | 2026-09-25 |
| [PyPI csoai-claimguard 0.1.0](https://pypi.org/project/csoai-claimguard/0.1.0/) | `25f94f9ab31a` | UNSIGNED | none | CC-BY-4.0 | 2026-08-22 |
| [PyPI csoai-council-ledger 0.1.0](https://pypi.org/project/csoai-council-ledger/0.1.0/) | `923a8d155201` | UNSIGNED | none | CC-BY-4.0 | 2026-08-22 |
| [PyPI csoai-defoneos-mcp 1.0.6](https://pypi.org/project/csoai-defoneos-mcp/1.0.6/) | `3001f0124d64` | UNSIGNED | none | MIT | 2026-07-28 |
| [PyPI csoai-gspc 0.2.20260915](https://pypi.org/project/csoai-gspc/0.2.20260915/) | `ca9baafd3182` | UNSIGNED | none | Apache-2.0 | 2026-09-04 |
| [PyPI csoai-scitt-ts 0.1.0](https://pypi.org/project/csoai-scitt-ts/0.1.0/) | `9b0d167affbf` | UNSIGNED | none | MIT | 2026-09-13 |
| [PyPI csoai 0.2.2](https://pypi.org/project/csoai/0.2.2/) | `a32da36e939d` | UNSIGNED | none | Apache-2.0 | 2026-08-13 |
| [PyPI inspect-gspc-scorer 0.1.0](https://pypi.org/project/inspect-gspc-scorer/0.1.0/) | `3fa06136529d` | UNSIGNED | none | MIT | 2026-09-13 |
| [PyPI langchain-csoai 0.1.0](https://pypi.org/project/langchain-csoai/0.1.0/) | `6891f661ea07` | UNSIGNED | none | Apache-2.0 | 2026-09-25 |
| [PyPI llama-index-tools-csoai 0.1.0](https://pypi.org/project/llama-index-tools-csoai/0.1.0/) | `2bbd674103f5` | UNSIGNED | none | Apache-2.0 | 2026-09-25 |

Every row's full record — pinned revision, what it does NOT show, the exact check — is in index.json.

