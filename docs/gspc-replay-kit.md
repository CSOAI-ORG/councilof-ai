# Buyer-side evidence replay kit

Review a small selection of public measurement cards without a Council account or a new verifier. The kit uses the existing Apache-2.0 `gspc-card-verifier` package at an explicit Git commit. Node 22+ and Git are sufficient to capture; verification then works offline with Node alone. No dependencies are installed, keys generated, uploads made, or paid requests sent.

## Capture one published card

From a reviewed checkout containing this script:

```bash
node scripts/gspc-replay-kit.mjs capture \
  --out /tmp/council-buyer-replay-example \
  --commit bbb50e8d5ebdf5c2719b711cb7a933633508afed \
  --url https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json
```

The destination must not exist. Keep the printed `manifest_sha256` outside the kit, through a trusted channel. Up to eight distinct explicit public Council card URLs are accepted; redirects, credentials, query strings and private/local URLs are refused. This does not scrape a catalog.

This historical example demonstrates verification, **not current model quality**. Its signed body lacks a sample size and exact model revision. The export preserves those gaps; it does not fill them in or turn its old framing into a current coverage claim.

The kit also accepts published `/interop/mill-cards-signed/signed-<axis>-<12-hex-prefix>.json` URLs. Select the exact URL from the board, and pass the full reviewed commit containing the compatible verifier profile. The filename prefix is not the trust anchor: the entire returned content ID and signature must verify. Declared model-manifest digests and `UNMEASURED` small-sample states are preserved; a valid signature does not promote a result into a grade. A review-branch card returning 404 is not published and cannot be captured as public evidence.

## Replay offline

```bash
node scripts/gspc-replay-kit.mjs verify \
  --dir /tmp/council-buyer-replay-example \
  --manifest-sha256 THE_64_HEX_DIGEST_PRINTED_AT_CAPTURE
```

Alternatively, after checking the copied `replay.mjs` against the reviewed source, run that file with the same arguments. The kit contains the existing verifier source, its profile/public key pins, licence/notices, exact card bytes, a local manifest and `buyer-evidence.json`.

Replay checks every manifest-bound file before loading the copied verifier, verifies each card under the pinned profile, changes a signed axis string in memory, and requires `INVALID` for that tamper control. Nothing in the verification path fetches from the network. A changed card, export, verifier or manifest fails closed. Nonzero exit is not a measurement grade; read the reason.

## What a buyer receives

`buyer-evidence.json` is a machine-readable procurement/underwriting **review appendix**, not a decision. It carries original signed measurement bodies, source URLs, exact-byte SHA-256 values, signature-check outcomes, the tamper-control result, declared scope/date/sample size and explicit missing fields. The original card is retained; the derived export is not independently signed. A copied signed body authenticates the issuer's statement, not the correctness of that statement.

The manifest pins the verifier repository, full commit, source-file hashes and profile. It is an **unsigned local capture manifest**. Its digest protects against later alteration only when you retain or obtain that digest independently. Trust in the verifier code and publisher public key remains an explicit trust input: inspect the reviewed commit and validate the key out of band. Do not let an untrusted sender supply both executable code and its claimed trust anchor unchecked.

This verifies selected cards only. It does not rerun the model, prove corpus completeness, check revocation/currentness, validate Bitcoin timestamps, determine compliance, certify a model, bind insurance coverage or set premiums. Missing evidence remains missing. For a fresh measurement or an underwriting use case, separately establish the model revision, method, data rights, sample policy and decision-maker's requirements.

## Tests

```bash
node --test scripts/test_gspc_replay_kit.mjs
```

Tests use existing package fixtures and mocked HTTP responses; no network, paid calls or private outputs are required. The repaired `actions/verify-card` Action now calls the same pinned-key package for one retained local card. Use a reviewed commit containing that repair; older Action revisions used a different envelope/key model. The Action does not replace this kit's capture manifest, file-integrity checks or tamper replay.
