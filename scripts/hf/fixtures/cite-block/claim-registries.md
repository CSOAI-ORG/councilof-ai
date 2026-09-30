---
license: cc-by-4.0
---
# claim-registries

Claim-maintenance registries (measurement, not certification), mirrored byte-for-byte from
`https://councilof.ai/claims/`, each with its OpenTimestamps receipt beside it.

**No claim of falsity is made about any entry.** A registry records what a named party's own
public record says, what our harness measured, the window and denominator of each reading, and —
for every claim — an explicit list of what the reading does **not** establish. Where a search
could not reach an organisation's own record, that is recorded as `SEARCH_INCONCLUSIVE` and never
as an absence. Nothing here is sent to any party named in it. No financial advice, no valuation,
no solvency or adequacy opinion.

## Contents

`ondo-chainlink/` — eight claims captured from chain.link and ondo.finance on 2026-09-22.

| File | What it is |
|---|---|
| `claimreg-ondo-chainlink-2026-09-22.json` | rev1: the eight claims as captured, all `CLAIM_CAPTURED`, each with a measurement plan. Superseded, never edited. |
| `claimreg-ondo-chainlink-2026-09-22-rev2.json` | rev2: the same eight after the measurements ran. 5 `CLAIM_MEASURED`, 2 `UNMEASURED`, 1 `CLAIM_CAPTURED`. |
| `claimreg-ondo-chainlink-2026-09-22-rev2.signed.json` | the Ed25519 signature over rev2's bytes by `did:web:csoai.org#board-attestation-1`. A signature cannot live inside the bytes it covers, so it is a sidecar that pins the file by sha256. |
| `series/CL-1.jsonl` | the published dated series for a cumulative counter that cannot be recomputed. One reading is not a measurement; the claim stays `UNMEASURED` until the series holds two dates. |
| `findings-ondo-chainlink-2026-09-22.md` | the readable note: what was measured, what was found, what was explicitly not established, and how to re-run it. |
| `*.ots` | OpenTimestamps receipts. These are **calendar-pending**: a calendar's promise of future Bitcoin inclusion, which is not a Bitcoin attestation and is not described as one until upgraded and verified. |

rev2 supersedes rev1 **by reference**: rev1's bytes are unchanged, still served at their own URL
and still covered by their own receipt.

## Verifying a registry

The eight claim records in rev2 are committed to an **RFC 9162 §2.1.1 Merkle root** (0x00 leaf /
0x01 node, largest-power-of-two split, no odd-leaf duplication), with an inclusion proof for each
record in the file — so any single claim can be proved to have been in this registry without
republishing the rest.

```python
# root and inclusion proofs
import json, hashlib
d = json.load(open("claimreg-ondo-chainlink-2026-09-22-rev2.json"))
leaf = lambda b: hashlib.sha256(b"\x00" + b).digest()
node = lambda l, r: hashlib.sha256(b"\x01" + l + r).digest()
canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
recs = {c["id"]: dict(c, subject=s) for s, v in d["subjects"].items() for c in v["claims"]}
entries = [canon(recs[l["id"]]) for l in d["merkle"]["leaves"]]
def mth(e):
    if len(e) == 1: return leaf(e[0])
    k = 1 << (len(e) - 1).bit_length() - 1
    return node(mth(e[:k]), mth(e[k:]))
assert mth(entries).hex() == d["merkle"]["root"]
```

The signature verifies against `#board-attestation-1` in
`https://csoai.org/.well-known/did.json`; the sidecar carries the exact canonicalisation rule.

## Re-running the measurements

The harness is `scripts/claims/` in <https://github.com/CSOAI-ORG/councilof-ai>. Python standard
library only, and keyless **by construction** rather than by promise: the fetch helper raises if a
harness tries to send an `Authorization` header, an API key or a cookie, and a source that answers
HTTP 402 is recorded as paid and dropped rather than worked around.

```
python3 scripts/claims/test_claim_harness.py            # 21 tests
python3 scripts/claims/test_claim_harness.py --controls # the planted input each harness must reject
python3 scripts/claims/run_all.py /tmp/run
python3 scripts/claims/build_rev2.py /tmp/run /tmp/rev.json
```

Every measurable claim type ships with a control that proves it can fail — a doubled heartbeat
gap, an implausible on-chain timestamp, 99% of a slice that is 1% of the market, a counter that
goes down, a term that exists only inside a `<script>` tag. A harness that has never failed has
not been tested.

Licence: CC-BY-4.0. We measure; we never certify.

<!-- csoai-cite-v1:start -->
## Objections, contact and corrections

To object to a row, ask for a re-check, request a correction or ask for a record to be withdrawn, email **nicholas@csoai.org** or use the appeals and dispute route at https://councilof.ai/dispute/. Corrections are listed in the corrections ledger at https://councilof.ai/api/corrections, with what changed and when. CSOAI Ltd (company no. 16939677, England and Wales) is the accountable publisher.

## How to cite

CSOAI Ltd (Council of AI). *claim-registries*. 2026. Hugging Face dataset `csoai/claim-registries`. https://huggingface.co/datasets/csoai/claim-registries

```bibtex
@misc{csoai_claim_registries,
  title        = {claim-registries},
  author       = {{CSOAI Ltd}},
  year         = {2026},
  howpublished = {Hugging Face dataset, https://huggingface.co/datasets/csoai/claim-registries},
  note         = {Corrections: https://councilof.ai/api/corrections}
}
```

Licence: CC-BY-4.0. Attribute Council of AI, CSOAI Ltd (16939677), https://councilof.ai.

## Corrections and verification

- Corrections ledger (signed): https://councilof.ai/api/corrections. Corrections to CSOAI's published records are logged there with what changed and when.
- Verify a signed record yourself, free and without an account: https://councilof.ai/gspc-verify/ (step by step: https://councilof.ai/signed/HOW-TO-VERIFY.md).
- Conformance kit for signed-receipts/v1, with test vectors for implementers: https://councilof.ai/spec/signed-receipts/v1/conformance/
<!-- csoai-cite-v1:end -->
