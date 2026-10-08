# Read a pinned cross-ledger dataset without changing its evidence state

The [cross-ledger supply dataset](https://huggingface.co/datasets/csoai/cross-ledger-supply) is CC-BY-4.0. Attribute Council of AI / CSOAI Ltd and retain the source URL and revision when reusing it.

The dataset card includes signature and ledger-proof instructions. This smaller example acquires and inspects one historical BENJI artifact using Node 20+ and no installed packages, account, wallet or paid call. It preserves decimal strings, source dates, reconciliation limitations and unknown values.

From the Council of AI repository:

    node scripts/readers/read-hf-cross-ledger.mjs

The command reads only [this pinned JSON](https://huggingface.co/datasets/csoai/cross-ledger-supply/resolve/b4f117431874d07b074524a6dcaa14a00bbcbb8e/interop/cross-ledger-benji-2026-09-25.json), limited to 512 KiB with a 20-second request timeout, and prints JSON to stdout. It checks the exact SHA256 independently re-read on 8 October 2026: 51ec46fbe5ab0d30d0a68ed35bb63ee48517a08a9f7cc4b751b415c9544fed77. Revision: b4f117431874d07b074524a6dcaa14a00bbcbb8e.

For a previously downloaded copy, including a Kaggle notebook with the same exact file attached:

    node scripts/readers/read-hf-cross-ledger.mjs --file /path/to/cross-ledger-benji-2026-09-25.json

Local input must match the same pinned digest. An edited or different-version file exits nonzero as UNCHECKABLE; repinning is a reviewed source change, not an automatic silent update. No file is written by either mode.

## What the output establishes

- The bytes match the pinned artifact digest. This is a content check, not signature or issuer authentication.
- record_as_of comes from the historical artifact; retrieved_at records this example's read time separately.
- supply_decimal remains a string. Products and evidence kinds stay separate; the example makes no supply sum.
- reported_evidence_kind and reported_two_operators_agree preserve the producer's labels. They are not checks executed by this example.
- A missing supply or evidence field remains null; an empty row set is not a supply of zero.
- The issuer-reported block and reconciliation state remain separate from ledger observations.

All signature, issuer-authentication, ledger-proof and Bitcoin-anchor checks explicitly say NOT_PERFORMED. The record's own reported STATE_PROOF_VERIFIED label does not change those outcomes. Consult the [complete pinned card](https://huggingface.co/datasets/csoai/cross-ledger-supply/blob/b4f117431874d07b074524a6dcaa14a00bbcbb8e/README.md) for the applicable proof process. This reader does not establish current supply, AUM, NAV, reserves, backing, ownership or customer demand.

## Corrections and related data

The card's 26 September correction C-2026-0926-06 concerns the separate Tether daily record, not these unchanged 25 September BENJI bytes. Never use a historical version as a substitute for checking the relevant linked correction: [corrections ledger](https://councilof.ai/api/corrections).

The [model census card](https://huggingface.co/datasets/csoai/gspc-hf-model-census) describes a frozen UNMEASURED sample, not every Hub model or current grades. The [measurement capsules card](https://huggingface.co/datasets/csoai/measurement-capsules) explains its dated signed-batch/index structure and publication erratum. Neither dataset's listing nor this example demonstrates independent adoption.

Run the deterministic controls:

    node --test scripts/readers/read-hf-cross-ledger.node-test.mjs

The existing test:readers command discovers this test file. Controls cover precision, altered bytes, wrong schema, numeric supply rejection, preserved unknowns, pinned acquisition, HTTP failure and the byte ceiling.
