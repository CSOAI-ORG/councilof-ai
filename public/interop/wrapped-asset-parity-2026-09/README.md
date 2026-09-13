# Wrapped-asset parity — staged atoms (2026-09)

One unsigned card-v0 atom per bridged-stablecoin pair, emitted by
`node scripts/readers/wrapped-asset-parity-reader.mjs --stage public/interop/wrapped-asset-parity-2026-09`.
The board signer (public-root.yml via scripts/adapters/staged_leaves.py) signs admitted atoms into the ONE
public root; nothing here signs. `state` is PROBED (a public RPC was read) or UNMEASURED (a read failed);
the read outcome is `payload.parity_state` — ESCROW_PARITY_READ / UNCHECKABLE_NATIVE_ISSUANCE / UNMEASURED.
A ratio, not a rate, not a grade, not a reserve attestation. Spec: measurement/wrapped-asset-ledger-spec.md.
