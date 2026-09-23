# Verify the delivered population rows

This verifier checks the same `payload.rows` serialization used by the existing population door. It does not initiate a payment, contact an endpoint, verify a signature, verify Bitcoin, or evaluate source truth.

1. Download the free manifest at `/api/pop/stablecoins/manifest` (or `?manifest=1`).
2. Retain that manifest and send its `evidence.rows_sha256` in the `x-csoai-expected-rows-sha256` header when requesting delivery through the existing authorised payment client. A mismatch returns409 before signing/settlement.
3. Save the delivered JSON as `payload.json`.
4. Run `node verify-population-delivery.mjs manifest.json payload.json`.
5. To enforce a consumer-defined freshness requirement, append the allowed age in hours, for example `24`. Historical frozen products can correctly fail that consumer requirement.

A pass is `CONTENT_VERIFIED_NOT_PAYMENT_OR_SIGNATURE_VERIFIED`. Compare payment receipts and verify the separate signature through their respective tools.

The frozen stablecoin corpus and newer public claim captures are different products. This manifest never substitutes one population's root, count or timestamp for another.
