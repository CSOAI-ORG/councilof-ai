# Merkle note explanatory correction — 19 September 2026

Status: proposed source correction and mirror patch; not a deployed algorithm change.

The public [17 September note](https://huggingface.co/datasets/csoai/councilof-ai-mirror/blob/main/corrections/merkle-count-binding-2026-09-17.md) attributes removal of duplicate-last padding ambiguity to leaf/node hash prefixes alone. That explanation is incorrect. Retaining duplicate-last padding retains the demonstrated ambiguity even when leaves use `0x00` and nodes use `0x01`.

[RFC 6962 section 2.1](https://www.rfc-editor.org/rfc/rfc6962#section-2.1) defines separate leaf/node hash domains **and** a recursive tree split at the largest power of two smaller than the list length. The latter avoids duplicate-last padding; the former provides the distinct leaf/interior second-preimage property. Authenticating the count rejects the specific padded presentation in our existing construction. It is not a general collection-membership proof, and an inclusion proof is not append-only consistency evidence.

A future construction produces new roots and proofs. Historical signatures, proofs and timestamps remain checkable against their original bytes and rules. This correction changes no root, signature, witness, proof or historical test output, and claims no deployed v2 construction.

## Exact source and readback

On 19 September, the following four sources returned identical root bytes: canonical `public/root.json` at master `67155160e18ab521617f064ddafb34ca98331d48`, [site root](https://councilof.ai/root.json), [API root](https://councilof.ai/api/root), and [HF root mirror](https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/public/root.json).

- Size: 24,454 bytes; SHA256: `dedb49d05cf8a37a65a5eb19332881d804240ef741171edf153cbe053b1368e4`.
- Root date: `2026-09-15T07:13:43Z`; declared and presented count: 305.
- Recomputed Merkle value: `07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2`.
- Appending the last leaf gives 306 entries with the same duplicate-last root; the unchanged authenticated count rejects that presentation. Adding hash-domain prefixes while retaining duplicate-last padding also leaves the pair equal. RFC 6962's recursive construction distinguishes them. The same controls were exercised on `[A,B,C]` versus `[A,B,C,C]`.

These are arithmetic/readback checks, not a new signature or witness validation.

## Reproducible proposed mirror update

The adjacent `root-note-erratum-2026-09-19.patch` is the complete proposed change to `corrections/merkle-count-binding-2026-09-17.md` in the existing `csoai/councilof-ai-mirror` dataset. It replaces the mistaken explanation and its residual migration/reference wording. All fenced executable examples and reported outputs remain byte-identical.

| Input | Identity |
| --- | --- |
| HF repository head observed | `6017deabc61604a1e278bbbc32d35cdbb44d4804` |
| Original note SHA256 | `5a4d839c4bb0b9ecb90a1d39528ed4c8a5b654c1071326698888ad8b38da8d94` |
| Proposed note SHA256 | `349e7f1bdf640887829cbb4599f81eb96185b205c5dd6c4116224cacb3b522a9` |

Fetch the note at the pinned HF revision, require the original digest, apply the zero-context patch with `git apply --unidiff-zero`, then require the proposed digest. Refuse a changed source instead of overwriting newer work. The HF review must cite this canonical source commit. Canonical review/merge and mirror acceptance remain separate gates; neither PR is public delivery at the original URL. The main-site guide correction travels through the existing protected release process separately.
