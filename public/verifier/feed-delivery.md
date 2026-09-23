# Retain and verify an assembled data feed

The existing Eunomia feed now publishes a free pre-payment byte contract at https://councilof.ai/api/eunomia-data?manifest=1. This is assembly of existing source artifacts, not new measurement. Each block keeps its original observation date.

1. Save the free manifest before payment. Its evidence.blocks_sha256 commits to the canonical payload.blocks, not the entire response or a separate capture corpus.
2. Supply that digest in x-csoai-expected-feed-sha256 on the subsequent feed request. A changed digest returns409 before facilitator verification or settlement. Missing source blocks return503 before payment. No payment is made by downloading the manifest or this checker.
3. Use your existing approved payment client. Keep the exact request URL/method, full response body, response headers, signed receipt and original payment terms privately. Do not submit another payment automatically after an ambiguous result.
4. Save the public checker and its checksum manifest, inspect the code, then run it on your retained files:

```sh
node verify_feed_delivery.mjs manifest.json payload.json
# Optional: also compare your retained exact response digest and request record.
node verify_feed_delivery.mjs manifest.json payload.json --payload-sha256 YOUR_SAVED_DIGEST --request-url 'https://councilof.ai/api/eunomia-data?feed=1' --method GET
```

Node20+ and built-in modules only. The script makes no network requests, installs no dependencies, executes no other downloaded code and never pays. Source SHA-256: 294a1f48d4dfc444d5778cc82b2ffb4bcd8c83a00f4b9dd48927b5efb554679b.

## Separate evidence scopes

The x-csoai-payload-sha256 header hashes the exact UTF-8 JSON payload bytes emitted by the handler (after content decoding at the client), including envelope and settlement metadata. It is a named CSOAI checksum, not an HTTP signature. Preserve bytes rather than pretty-printing the file first. The pre-payment feed digest instead hashes recursively key-sorted payload.blocks with the existing card-v0 serializer. The two digests serve different purposes.

The optional request_record hashes method + LF + Request.url. It is unsigned, retains query-order/encoding differences, and does not extend the existing path-scoped x402 signature. The original record cannot prove an omitted query retroactively.

A successful content check does not verify signatures within blocks, payment receipt signatures, ERC20transfers, receipt freshness, finality, order uniqueness, source truth or customer acceptance. Keep using https://councilof.ai/verifier/verify_receipt.py for the separate signed-receipt/transfer checks. Raw source HTTP response digests are provenance; the assembled feed contains parsed source JSON objects, not those original raw response bytes.

A simultaneous publisher update can legitimately make the pre-payment digest change: refresh the manifest, inspect the changed terms and follow the payment client's replay policy rather than automatically re-paying. Individual sources may have different dates; this is not an atomic snapshot of all systems.
