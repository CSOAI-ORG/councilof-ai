---
license: cc-by-4.0
pretty_name: Signed measurement capsules v0.2 (2026-09-26 index)
language:
- en
tags:
- measurement
- merkle
- transparency
- mcp
- a2a
- agents
- provenance
- council-of-ai
size_categories:
- 10K<n<100K
configs:
- config_name: capsules
  default: true
  data_files:
  - split: train
    path: data/capsules.parquet
- config_name: batches
  data_files:
  - split: train
    path: data/batches.parquet
# TODO task_categories: Growth proposes question-answering (verify against content)
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Signed measurement capsules v0.2 (2026-09-26 index)

> **Start here — free verify:** <https://councilof.ai/gspc-verify/> (or the free MCP tool `verify_card` at `https://councilof.ai/mcp`) · **Full catalog:** <https://councilof.ai/catalog.json> · Methodology: <https://councilof.ai/methodology/> · Measurement, not certification.

> **Read first: one field in these files is superseded.** The index and the batch records carry
> `private_until: "owner approves publication"`, written before publication was approved. Publication was
> approved on 2026-09-26; the signed erratum `v0.2/publication/2026-09-26-erratum.json`
> supersedes that one field and nothing else. No capsule, count or signature changed.

A measurement capsule is one content-addressed statement of what one instrument observed about one
subject at one time, with the declared value, the observed value, the differential, its limitations and
a state. Capsules are not signed one by one: each batch's signed `record.json` binds its capsules through
an RFC 6962 Merkle root over their ids, and a signed daily index binds every batch. This dataset holds every file of the 2026-09-26 index published at
https://councilof.ai/measurement-capsules/v0.2/, byte for byte, plus two viewer tables derived from
them.

Read from the signed index payload (`v0.2/index.signed.json` → `payload`): **13,184 capsules in
8 batches**, index root `85533b833d36f8a4165da34206ee6e39f7434c646c8a2c381d251391ceec366d`, as of `2026-09-26T10:34:15Z`.

| batch | what each capsule states | capsules | states (from the batch's `record.json`) | RFC 6962 Merkle root |
|---|---|---:|---|---|
| `a2a_card` | does a published A2A agent card verify under the key it references | 33 | `VERIFIED` 13, `UNCHECKABLE` 12, 8 in the state for a signature that does not verify | `bf12f4ad340a11a14ecbd359ba90b3aaebb36bb75bcf9e11f433148441bae436` |
| `contract_parity` | is the tool set an MCP server's surfaces declare the tool set the live server lists | 9,148 | `CONSISTENT` 5,570, `INCONSISTENT` 2,905, `UNCHECKABLE` 673 | `70403984d857b7b167d0010608f79c5407bc8642435eb72e7644c83918b1a788` |
| `cross_ledger` | is the issuer's declared token deployment on a ledger the one the ledger shows, and what the ledger's own state says is issued | 353 | `CONSISTENT` 101, `OPERATOR_API` 77, `UNCHECKABLE` 52, `STATE_PROOF_VERIFIED` 49, `LISTED_NOT_READ` 34, `STATE_PROOF_RECORDED` 10, `TOTAL_COMPLETE` 10, `TOTAL_PARTIAL` 8, `PERMISSIONED_NOT_READABLE` 6, `INCONSISTENT` 4, `ISSUER_LIST_UNAVAILABLE` 2 | `a6e3fd14b1cc68072d919bfc59565161e59c492f97c775bbebefd48705770bf9` |
| `mill_cross_runtime-5ae00c1f4c2e` | does a signed evaluation result reproduce on a second runtime | 14 | `NOT_REPRODUCED` 7, `REPRODUCED_ITEMWISE` 5, `REPRODUCED_AGGREGATE_ONLY` 2 | `5ae00c1f4c2ed290fb91206f29372d0df3e61478c568d4797855502e751ebff6` |
| `mill_cross_runtime-78226433e9e4` | does a signed evaluation result reproduce on a second runtime | 140 | `NOT_REPRODUCED` 82, `REPRODUCED_ITEMWISE` 49, `REPRODUCED_AGGREGATE_ONLY` 9 | `78226433e9e433b311e067ee56fcbaf415f6dc57301254f3bb4922a0b8053cf6` |
| `public_signals` | what a public counter reads on a day, from its source | 118 | `MEASURED` 103, `UNCHECKABLE` 12, `PARTIAL` 3 | `ef67f71508192f08f1aedb00276592ee81e85661e7c3421bec036d4e7b9adb42` |
| `self_parity` | does an index's listing of a CSOAI offering say what CSOAI actually serves (CSOAI's own entries) | 138 | `NOT_LISTED` 55, `CONSISTENT` 37, `UNCHECKABLE` 37, `INCONSISTENT` 8, `NOT_DECLARED` 1 | `53d5c6b23a13c464546d31ab18abcf1fae3990961019fc2443748d62922acf3a` |
| `tool_drift` | are the tools an endpoint advertised at one observation the tools it advertised at the next | 3,240 | `UNCHECKABLE` 1,755, `UNCHANGED_AT_NAME_GRANULARITY` 1,485 | `fd0f514e03dd825698a3eab57d33431b09e62e442f85c7592db50f2371e9d2df` |

A state is the instrument's reading of one subject on one day, never a grade; `UNCHECKABLE` means the
instrument could not decide and is counted, not scored. Each capsule carries
`authority_state: NONE` (measurement only; it grants no execution authority).

## What this is not

- Not a ranking or approval of any server, agent, issuer, asset or model.
- Not a population total: each batch covers the subjects its source record covers.
- `self_parity` and the `SELF` rows of `public_signals` are about CSOAI's own offerings and counters;
  they are reported beside the third-party batches and never added to them.
- The per-endpoint lookup shards under https://councilof.ai/measurement-capsules/v0.2/endpoints/ are a
  derived index over these capsules and are not copied here.

## Files

| file | bytes | sha256 | what |
|---|---:|---|---|
| `latest.json` | 196 | `52e0e2855098aec4ec17d830951cdb7d974e0a612978d44c9d5081d6610ebfd0` | pointer to the current version |
| `v0.2/a2a_card/capsules.jsonl.gz` | 7,916 | `ba413e8160120205d8b9ec87fec95fa9e0f3ac2e6c858d4e6e807851882cd661` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/a2a_card/leaves.json` | 2,812 | `d509c87797581f871dfcca872c55449623f862e9a7058c51d7a5a2abbc4446fe` | the batch's Merkle leaves (capsule ids) |
| `v0.2/a2a_card/record.json` | 3,338 | `180a16f838f33372e1e6345fb272d7b3427a55dacee5571c34a6947a116cc6b6` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/a2a_card/record.json.ots` | 635 | `5243568f0fb91879c58b21e8e350a45d7090c39c32984e80800f6aee8bf55acf` | OpenTimestamps proof |
| `v0.2/a2a_card/record.signed.json` | 1,557 | `d379b0096adf4537af48b3c046c65a76c2b4a45c371943985e1e8193d2f93e2f` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/anchors.json` | 3,674 | `99788acf2317092b0cecf47e52cb74ac88f55f6a89fcfd5c7be47faef0ce8ad3` | where the index bytes are anchored, read from the anchor files |
| `v0.2/contract_parity/capsules.jsonl.gz` | 1,992,620 | `7b24218a5616d4deb2461ddca0ff97dc7eafc5f094be77ca1f772f05ac862d6d` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/contract_parity/leaves.json` | 613,530 | `4f0903244ae0aa20b9cd569de5dd7fcdfa572d4038c1b5a6d4d370618d295ee2` | the batch's Merkle leaves (capsule ids) |
| `v0.2/contract_parity/record.json` | 5,150 | `1b9186699b27ac5bc13c4b211f7a5f1317aee96e0c85c27668ac21b9214af357` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/contract_parity/record.json.ots` | 705 | `47a09989614e81efe78c59ead13e8ed9aa2fcc915091f80b52386352c0cf252e` | OpenTimestamps proof |
| `v0.2/contract_parity/record.signed.json` | 1,584 | `84b4d17bb7056960e00789056fdc27f5ed5ecaec1d7495440d7815b9e9ce74c2` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/cross_ledger/capsules.jsonl.gz` | 111,954 | `af25aa3413d97f3d14406d51b8bf0013198ba26b6359eaadf12370081e5830b1` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/cross_ledger/leaves.json` | 24,262 | `091e9609bca4f2dccb74fe73256cca801ced2b51250f16f764ff0fce8e849057` | the batch's Merkle leaves (capsule ids) |
| `v0.2/cross_ledger/record.json` | 12,130 | `ace6cbe3697ed1f6715ea2f921eaad07c82cab795fb86609a3d16b3c956465df` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/cross_ledger/record.json.ots` | 705 | `13ed380424d7386aee72de5bbdc26152bf0731c9ae9c1915902863c26a86a371` | OpenTimestamps proof |
| `v0.2/cross_ledger/record.signed.json` | 1,803 | `9f16a1d677bca6d96720ec39fad8494805f7444d5d79e2824413f91bf91f1385` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/index.json` | 34,150 | `ee3d921750d40456eb58ed24d2a9ba141d6fc1d16510ddd338166c4f5620b72a` | the day's index over every batch: roots, counts, index root |
| `v0.2/index.json.ots` | 1,532 | `e2843a3682e31fa153250a41525d7e2844496b2ac945934927cd3c6e66b731fd` | OpenTimestamps proof |
| `v0.2/index.signed.json` | 2,934 | `18be27315446e0f543e62a4e516cce10976a07ef770dbdb839e8bf9329546415` | Ed25519 signature over the index |
| `v0.2/mill_cross_runtime-5ae00c1f4c2e/capsules.jsonl.gz` | 8,040 | `a8dc6d18a2835c8bead883b17c5a71257da40faf63381bce2f0f98e6ab366c8d` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/mill_cross_runtime-5ae00c1f4c2e/leaves.json` | 1,580 | `00111f3e8fa28132c6a2d8bfea15149a017291bf54f64cddc54e353e3d50ef30` | the batch's Merkle leaves (capsule ids) |
| `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.json` | 3,613 | `32ece857c94062f41a03aad9e269532cdbe5dc0a576ed20110edc4ecacb0468d` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.json.ots` | 670 | `18a726ece04b3b550f985f68cd767b4a283e430eb1e3102b2ceb3e26202c5203` | OpenTimestamps proof |
| `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.signed.json` | 1,616 | `4bd0799e4b01be5794733510030c021438957e490bf0108e7ef2424f08f55ad8` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/mill_cross_runtime-78226433e9e4/capsules.jsonl.gz` | 75,831 | `cf7d3db1cf664b99ad89593dd44109263d14b28c2026c8c53b5c65cb949673f8` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/mill_cross_runtime-78226433e9e4/leaves.json` | 10,023 | `20f5ba19f13643bb6905f1e6693761b5c3a72dd41c77e92399758c8ffce8b2ff` | the batch's Merkle leaves (capsule ids) |
| `v0.2/mill_cross_runtime-78226433e9e4/record.json` | 19,318 | `422fa6377b274bab095e8e875f67d087a275417c14c90a4c4e4cedb56ca9a5ff` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/mill_cross_runtime-78226433e9e4/record.json.ots` | 705 | `0eeb913f7e36161c2e46dedefc68997de65294db5c515e03176bd38f4e483607` | OpenTimestamps proof |
| `v0.2/mill_cross_runtime-78226433e9e4/record.signed.json` | 1,637 | `12522ad5cab221f1c7291401d21e5b0c29750adec829387ca6f43d3ac93de2c3` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/public_signals/capsules.jsonl.gz` | 19,788 | `5d8a0c632c0158116f2973c4256afc6bb03fc18957dab72eed75ce9e284ce770` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/public_signals/leaves.json` | 8,515 | `3c79d8555bef3cb10a16fb8f2a6247f8dbb0d5457416bece04b1521bc0f2c610` | the batch's Merkle leaves (capsule ids) |
| `v0.2/public_signals/record.json` | 2,603 | `abbcec606003f5eab774c6990f32b6c95c4eca692e5467c5e987fe5d426c8690` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/public_signals/record.json.ots` | 670 | `49b8ea5ed8259bdef6aed4c2c69012a5aff4628cf47d78acc5ffd7585084e83a` | OpenTimestamps proof |
| `v0.2/public_signals/record.signed.json` | 1,567 | `e12dfa01e8cd21ae6f00583b8c14e5d159076af2f59f0c5f7844954666e5adae` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/publication/2026-09-26-erratum.json` | 12,759 | `068f1c9b9f029f46a46d0fe6306a83491254f8d69c5dd01605c3214ec02eeec9` | dated erratum: the private_until field in the listed files is obsolete |
| `v0.2/publication/2026-09-26-erratum.json.ots` | 635 | `da7d8646a8429e45d131715b0857945581926569908bbfcec6961722d4d8ec0d` | OpenTimestamps proof |
| `v0.2/publication/2026-09-26-erratum.signed.json` | 1,860 | `925128abde6e84e64abe70575b2cd7521dd750e93b9024757142b0d525a81d6b` |  |
| `v0.2/publication/2026-09-26.json` | 2,069 | `effd4713967cff6e03e548f752c87cbb7405a869f15871b00ac92c950201a804` | publication state of the index (PUBLIC, owner-approved 2026-09-26) |
| `v0.2/publication/2026-09-26.json.ots` | 635 | `a86b67fb4f08b002fcf23eeb31a76645b3bcb6a83bc3ed532391839e08a64ebb` | OpenTimestamps proof |
| `v0.2/publication/2026-09-26.signed.json` | 1,785 | `df7fff513f5967337187c6ab27d14db18882c0096c0f7c2317aab2a24877e3fa` |  |
| `v0.2/self_parity/capsules.jsonl.gz` | 21,624 | `dc703838bd4c5e9db443f23e54d972343d5c9fdcaf258397472194c5e8267c64` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/self_parity/leaves.json` | 9,847 | `f1e773743b8fad3434572a740a42deac9a4e431e01412dd4f6f3075d1782d133` | the batch's Merkle leaves (capsule ids) |
| `v0.2/self_parity/record.json` | 2,412 | `57d697af67fc40fc4ce206aec5407e1e6873684ae7e4387cb3a06c125a700337` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/self_parity/record.json.ots` | 635 | `0504f41051179f3c74a2adc9c81e0fe8373e6eb5ba190ed9ce2b1d1d0b860638` | OpenTimestamps proof |
| `v0.2/self_parity/record.signed.json` | 1,608 | `697f2fa62243841e5cd48976c3f70a1e1fbc9b59b7a81ad5dc45bc57132addee` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |
| `v0.2/tool_drift/capsules.jsonl.gz` | 646,582 | `febe9aed6140c3cc12a0c256fb0ffa9e76bc66a19342f086af03ee60c7baa7aa` | the capsules, canonical JSON lines sorted by capsule_id |
| `v0.2/tool_drift/leaves.json` | 217,679 | `06f5e6aca407f1f1947d1815527b76d5fbc5723768ce66962fc37c8fc4e9c99a` | the batch's Merkle leaves (capsule ids) |
| `v0.2/tool_drift/record.json` | 3,184 | `a7a13dab161631d0557726fd64c0dee82bd0b95cb54e2749d96aaddc93fef473` | the batch record: adapter, states, Merkle root, capsule file hashes |
| `v0.2/tool_drift/record.json.ots` | 635 | `d1ef2d355459afae33bed898cfd4576c0da1362cd15ec9714e9958c6275456c6` | OpenTimestamps proof |
| `v0.2/tool_drift/record.signed.json` | 1,564 | `de12c6b4aa1e785ec5b1a3c7ed55f23eb385f126d7ae91b851a4607b43ec5147` | Ed25519 signature over a payload pinning record.json, the capsule file and the Merkle root |

`data/capsules.parquet` has one row per capsule (the verbatim canonical line is in `capsule_json`);
`data/batches.parquet` has one row per batch. `verify.py` re-derives both from the verbatim files.

## Timestamps

- `v0.2/a2a_card/record.json.ots` commits to the sha256 of `v0.2/a2a_card/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/contract_parity/record.json.ots` commits to the sha256 of `v0.2/contract_parity/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/cross_ledger/record.json.ots` commits to the sha256 of `v0.2/cross_ledger/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/index.json.ots` commits to the sha256 of `v0.2/index.json` and carries a Bitcoin block-header attestation (confirmed in Bitcoin block 968674), plus 3 calendar attestations that are still pending and do not affect it.
- `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.json.ots` commits to the sha256 of `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/mill_cross_runtime-78226433e9e4/record.json.ots` commits to the sha256 of `v0.2/mill_cross_runtime-78226433e9e4/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/public_signals/record.json.ots` commits to the sha256 of `v0.2/public_signals/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/publication/2026-09-26-erratum.json.ots` commits to the sha256 of `v0.2/publication/2026-09-26-erratum.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/publication/2026-09-26.json.ots` commits to the sha256 of `v0.2/publication/2026-09-26.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/self_parity/record.json.ots` commits to the sha256 of `v0.2/self_parity/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.
- `v0.2/tool_drift/record.json.ots` commits to the sha256 of `v0.2/tool_drift/record.json`; its state is pending (3 calendar commitments, no Bitcoin block-header attestation in these bytes yet). A pending proof dates nothing until a block attests it.

`v0.2/anchors.json` records the producer's check of the index proof against the Bitcoin block header.
Check any proof yourself with `ots verify <file>.ots`.

## How to verify

```bash
pip install cryptography pyarrow
python3 verify.py
```

`verify.py` checks, for every batch: record.json against the signed payload; capsules.jsonl.gz and its
decompressed bytes against record.json; that every capsule line is canonical JSON and its `capsule_id`
is the sha256 of the canonical capsule without `capsule_id`; the RFC 6962 root over the sorted ids;
the Ed25519 signature with a tamper control. Then the index against every batch, the index root, the
derived tables and `manifest.jsonl`.

```python
# Signature check in a few lines. did.json refuses the default Python User-Agent, so this names one.
import json, hashlib, base64, urllib.request
from cryptography.hazmat.primitives.asymmetric import ed25519
req = urllib.request.Request("https://csoai.org/.well-known/did.json",
                             headers={"User-Agent": "csoai-dataset-verify/1.0 (+https://huggingface.co/datasets/csoai)"})
did = json.load(urllib.request.urlopen(req, timeout=30))
x = [m for m in did["verificationMethod"] if m["id"].endswith("#board-attestation-1")][0]["publicKeyJwk"]["x"]
key = ed25519.Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
for f in ["v0.2/a2a_card/record.signed.json", "v0.2/contract_parity/record.signed.json", "v0.2/cross_ledger/record.signed.json", "v0.2/index.signed.json", "v0.2/mill_cross_runtime-5ae00c1f4c2e/record.signed.json", "v0.2/mill_cross_runtime-78226433e9e4/record.signed.json", "v0.2/public_signals/record.signed.json", "v0.2/publication/2026-09-26-erratum.signed.json", "v0.2/publication/2026-09-26.signed.json", "v0.2/self_parity/record.signed.json", "v0.2/tool_drift/record.signed.json"]:
    s = json.load(open(f))
    c = json.dumps(s["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    assert hashlib.sha256(c).hexdigest() == s["signature"]["payload_sha256"]
    key.verify(bytes.fromhex(s["signature"]["sig_ed25519"]), c)   # raises if the bytes were altered
    print("VERIFIES", f)
```

Signed by `did:web:csoai.org#board-attestation-1`. The signature proves who signed these bytes; it
does not prove any claim beyond what the capsules' own instruments measured.

## Objections, contact and corrections

Contact, corrections and objections (including a request to re-check or withdraw a specific row):
**nicholas@csoai.org**, or the "Object or opt out" route at https://councilof.ai/census/. A correction
is published as a new, linked version and logged in the signed corrections ledger at
https://councilof.ai/api/corrections; signed files are never edited in place. CSOAI Ltd (company
no. 16939677, England and Wales) is the accountable publisher.

<!-- csoai-cite-v1:start -->
## How to cite

CSOAI Ltd (Council of AI). *Signed measurement capsules v0.2 (2026-09-26 index)*. 2026. Hugging Face dataset `csoai/measurement-capsules`. https://huggingface.co/datasets/csoai/measurement-capsules

```bibtex
@misc{csoai_measurement_capsules_v0_2,
  title        = {Signed measurement capsules v0.2 (2026-09-26 index)},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/measurement-capsules},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
