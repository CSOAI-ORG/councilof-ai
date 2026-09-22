# Verified claim-capture delivery integration

## Shipped outside production
On 22 September 2026 the existing pod collected 10,552 records twice. Public, pinned Hugging Face releases now include complete upstream stablecoin/protocol responses, partial MCP/x402 windows, before/after change reports, population slices, exact-byte inclusion proofs, a buyer verifier and detached capture-key signatures. Identity assurance remains self-published capture key, not the board key or institutional certification.

Public discovery pointer: https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/claim-capture/latest.json

The pod dispatcher ticks each minute and does no external work unless a job is due. The current external cycle remains four-hourly; broad collection remains once daily. A 100-subject watchlist revisits exact source API identities separately. Existing Mac publication checks hourly and promotes a release only after digest-checked anonymous readback. Both machines must remain available. No new compute was provisioned.

## Production source reconciliation gate
Remote master at inspection was 077f72dc888e156f85e2ce7fd1805b18676fcc3c. The already-live population routes came from local commit ce050d503, whose files were absent from that master. Deploying old master would risk removing live functionality. This PR therefore adds an independent free /api/claim-capture adapter and supplies population-door-integration.patch for the reconciled population branch. It does not overwrite production or bypass DEPLOY-LOCK.

The adapter pins and verifies the release digest, caps stream bytes, checks freshness, validates counts and duplicate identities, and preserves CLAIM_CAPTURED versus measured truth. The population patch adds an opt-in latest-capture path while keeping default frozen evidence intact, and blocks settlement for UNCHECKABLE data.

## Tests
- `node --experimental-strip-types --test scripts/claim-capture/claim_capture.node-test.mjs`
- `cd scripts/claim-capture && python3 test_delivery_pipeline.py && python3 test_buyer_verifier.py`
- Actual USDT membership proof validated against the full 10,552-record tree; tamper control rejected.
- Production free previews: ten HTTP 200 responses; unpaid and malformed-payment controls returned 402. No paid settlement or external customer delivery was verified.

## Limits
No Bitcoin confirmation, source truth, customer revenue, global directory completeness, or ASI/recursive-intelligence improvement is inferred from hashes, signatures, crawler volume or directory flags. Original root files remain immutable. Detached signatures are separate later evidence. A hash supplied by the publisher is not an independently trusted root.
