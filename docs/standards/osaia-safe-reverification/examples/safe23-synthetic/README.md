# SAFE #23 — reproducible synthetic rule-evidence example

This extends CSOAI's retained 15 October eight-row example to cover the envelope
discussed in [SAFE #23](https://github.com/OpenSecureAIAlliance/wg-safe/pull/23),
at branch commit `d0e2912cae1000e72ddf3b24045ab51f55e54cd3`. It is a CSOAI
implementation example, not an official SAFE schema, accepted upstream card,
real incident report, operational security detector or model benchmark.

The author's [22 October reply](https://github.com/OpenSecureAIAlliance/wg-safe/pull/23#issuecomment-6351422347)
identified missing fields in the posted 400-row illustrative table. This runnable
example uses the **separate eight invented rows retained on 15 October**, with
actual local evaluation of an intentionally incomplete string rule. Its counts
must not be combined with the 400 invented figures in the public comment.

## Reproduce without a service or account

Use Python 3.10 or later; only the standard library is required. From this directory:

```sh
python3 safe23_synthetic_example.py
python3 safe23_synthetic_example.py --emit > safe23_synthetic_result.json
```

The tests cover label changes, swapped labels with the same multiset, formatting
rules, explicit false positives/negatives, duplicate fields, non-finite numbers,
malformed containers, zero denominators, missing observations and correlation.
The retained output includes its real local run window and evaluator version;
those fields can differ on another runtime. No network, model, credential,
payment, real tool action or secret is needed.

## Envelope coverage

| Requirement in the discussed envelope | Field / test |
| --- | --- |
| Rule identity and observed artifacts | `rule`, configuration digest and source-file digest |
| Evaluator and configuration versions | `evaluator`, Python implementation/version, Unicode version |
| Normalization and representation | `normalization`; sorted keys and unique row IDs, ASCII-escaped compact UTF-8 JSON; not a general RFC 8785 claim |
| Inputs, labels and their association | `corpus.bound_records_sha256`; row IDs bind all four declared input fields |
| Label provenance | Invented by the example author; no independently established ground truth |
| Taxonomy version | Synthetic-only taxonomy, version and technique; no real registry entry claimed |
| Observation window and evaluation unit | Actual local evaluator timestamps; one invented row |
| Population, denominator and base rate | Attempted, scored, excluded and named numerator/denominator fields |
| Replay / live and monitor / enforce | Local synthetic replay, offline monitor only, no real blocked-action count |
| Adjudicator identity, version and configuration | Same deterministic toy rule; independent agreement explicitly `NOT_MEASURED` |
| Correlation | Run ID and unique per-case observation references; no execution authority |
| Multiple-rule union / overlap | One rule only; no pooled or union rate |
| Per-case outcomes | TP/TN/FP/FN, injected timeout and unusable input; unexercised abstention/error remain explicit zero counts |
| Evidence accounting | Malformed, dropped, not-reached and unusable retained separately; no transport reliability claim |

Expected synthetic accounting: eight attempted, six scored, two excluded;
TP=2, TN=2, FP=1, FN=1, timeout=1, unusable=1. Rates refer only to their named
scored population. The injected timeout is not an observed service timeout.

The label-change and label-swap controls preserve input-only hashes while changing
the bound corpus digest. Formatting-only changes preserve the declared normalized
digest but change exact-byte hashes. These are discriminating controls, not a
claim that every software path or security property is covered.

## Provenance and integration

The original input file bytes are preserved unchanged (SHA-256
`a0122485021d1a2b9ac416be6cdfce71000175d8532c865ba120eb2af799e59a`).
Original 15 October Python source SHA-256:
`f7018a2f0b92fc86f86481c7a994e8d3108a8d46c7cea730211d275c5b7c8598`.
The generated result records the extended source digest rather than reusing that
historical pin. Historical artifacts remain unmodified.

SAFE v1.0 is published separately in `SAFE.md`; #23 still proposes more detailed
text against the retained RFC. This example does not assume that PR is merged.
It supplies portable evidence for review without requiring GSPC, a proprietary
runtime or a wallet. GSPC's frozen banks and canonical grader are unchanged.
