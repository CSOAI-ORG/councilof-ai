# Universal Measure → Sign → Root Factory

## The rule

There is one evidence lifecycle for every CSOAI subject. Instruments differ; proof plumbing does not.

subject → instrument → raw evidence → atomic observations → dispositions → cohort manifest → atomic Merkle root → signed cohort admission card → one public root → witnesses → served-byte readback → correction graph

## Why this scales

Do not sign 918 Ondo rows or 427 stablecoin rows one-by-one just to prove population integrity. Hash every row. Preserve the ordered leaf list and exact evidence pointer. Sign the compact cohort commitment. Root that signed commitment. Individual rows can still receive their own card when useful.

## Current bound population

The 20 September factory currently binds 2,912 atomic observations across 11 child cohorts, plus one hierarchical estate cohort. The estate cohort binds child manifest hashes under its own child-cohort Merkle root.

These are different populations and must never be silently added as if they were comparable scores.

## One root writer

scripts/adapters/measurement_cohorts.py validates cohort manifests and emits compact leaves.
scripts/publish_public_root.py remains the ONE root writer. It signs new cohort leaves, folds them into /root.json, produces proofs, and then the witness layer handles Rekor / OpenTimestamps.

No second Merkle authority was created.## Signer independence

The private Ed25519 key remains only in Cloudflare Pages.

/api/board-sign accepts short-lived OIDC identities:
- GitHub Actions for existing workflows.
- GitLab CI only when BOARD_SIGN_GITLAB_PROJECT_PATH is explicitly configured and the token is for an allowed protected branch.

No laptop or RunPod private-key fallback is added.

## One command

Safe build + verify:

python3 scripts/measure_sign_all.py --date 2026-09-20

After an allowed OIDC identity is available:

python3 scripts/measure_sign_all.py --date 2026-09-20 --root-dry-run

Then the authorised release lane can run the real root publish. A blocked signer is a BLOCKED result, never a fabricated signature.

## Adding a new domain

A new adapter only needs to:
1. produce deterministic JSON evidence;
2. define the row population pointer and measurement boundary in a cohort spec;
3. add the family to measurement/factory/families.json.

The factory handles hashing, Merkle construction, manifest binding, signer-size limits, admission, root integration and offline verification.## Verification

python3 scripts/verify_measurement_bundle.py <manifest> --root . --candidate <candidate>

The verifier recomputes source-file SHA-256, selected rows, atomic hashes, cohort roots, child-cohort roots and manifest digests without network access.

## Three signing levels

1. Atomic observation: always hashed. Individually signed only when a standalone public row/card is valuable.
2. Cohort admission: one signature binds the exact manifest SHA and atomic Merkle root for the whole cohort.
3. Estate root: one signed root binds every admitted cohort leaf plus the other existing root surfaces.

Witnesses are separate evidence:
- OpenTimestamps / Bitcoin
- Rekor / Sigstore
- SCITT or other transparency receipts where applicable

None is allowed to silently substitute for another.

## Doctrine

Measurement, not certification.

The signer authenticates exact bytes. It does not make a measurement correct, current, complete, safe, compliant, solvent, valuable or endorsed.

The instrument determines the observation. The admission gate determines whether the observation is allowed onto the signed fabric. The signature authenticates the admitted bytes. The root proves membership. The witness proves an external transparency/timestamp event. Readback proves what is actually served. Corrections preserve history.
