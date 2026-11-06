# Exact paid-output retention and private recovery

The common successful paid-response helper retains the original prepared HTTP body in the existing REVENUE_KV binding under delivery:body:v1:tx:<transaction>. The unsigned delivery:tx:<transaction> metadata and receipt JSON remain body-free. Existing paid emitters use this common seam; no new paid door or customer download endpoint is added.

The engineering bound is 1 MiB per body, plus 8 KiB for the original status text and allowlisted artifact headers. This is a storage bound, not an offer or commercial output limit. Larger outputs are returned unchanged and explicitly report NOT_RETAINED_TOO_LARGE. Empty successful output bytes remain eligible. This change adds no automatic expiry/deletion and no retention SLA.

The existing 250 ms storage budget is shared by metadata get/put and body get/put. It is not restarted for retention. Metadata state is separate from x-csoai-output-retention-state: a confirmed settlement and WRITTEN metadata do not establish retained bytes. An invoked put that exceeds the deadline reports UNKNOWN, may commit later, and is never automatically retried. Reconcile through authorised reads. KV get-then-put remains non-atomic across concurrent writers and regions; the recovery verifier rejects mismatched pairs.

Existing metadata is never backfilled from a later regenerated response, even if its bytes appear identical. An existing body value is never replaced. A historical metadata-only transaction remains without recovery bytes unless the actual original body was already retained. Missing bytes must not trigger a second payment, signing call or provider request.

Only these response headers enter the private envelope: content-type, content-disposition, content-language, content-encoding, etag, last-modified, x-csoai-card-sha256, x-csoai-feed-sha256, x-csoai-sig-ed25519, x-csoai-did, x-csoai-payload-sha256, x-payment-response and payment-response. Cookies, authorisation and other headers are excluded. The final settlement echo override is captured when present. HTTP output body, status and original headers remain unchanged apart from bookkeeping state/exposure headers.

An operator with existing authority to read the private KV values can export the exact delivery:tx value and delivery:body:v1:tx value using the ordinary approved KV access route. This change grants no export authority, creates no credentials and performs no remote export itself. Combine those JSON objects locally:

    {"delivery_record": <delivery metadata object>, "retained_output": <private body envelope>}

Use an existing private directory and an explicit new output filename:

    python3 scripts/recover_paid_output.py --input private-export.json \
      --transaction ORIGINAL_TRANSACTION --resource EXACT_ORIGINAL_RESOURCE \
      --output /absolute/private/directory/original.bin

The tool checks the transaction, exact resource including query, reference keys, body SHA256 and byte count, original timestamp, status, content type and allowlisted headers. It writes the body and original.bin.receipt.json with mode 0600 and exclusive creation. It refuses existing destinations, non-regular/blocking inputs, malformed or missing envelopes and mismatched/tampered bytes. It derives no filename or shell command from transaction/resource data.

Recovery is offline and unsigned. It verifies consistency of the supplied private server records; it does not independently verify settlement, a receipt signature, payment finality, buyer receipt or acceptance. Qualify settlement and receipt separately through their existing routes. No re-settlement, re-signing, regeneration, notification or anonymous transaction/JWS retrieval occurs.

The existing scripts/test_paid_delivery_records.mjs gate calls 22 additional retention controls and 16 Python recovery controls. The focused pair ran on admitted Linux, including exact binary/Unicode/empty bytes, at/above-cap bodies, unknown late commits, one shared deadline, no backfill, refusal and private file creation. Full paid-route regression results and hosted checks are recorded separately; a source PR is not a live deployment or buyer acceptance.


The browser payment path now keeps received response bytes separately from parsed JSON and offers an exact-byte download. It captures the echoed payment reference before reading the response stream. An unreadable/malformed reply or HTTP402 after signed dispatch remains unconfirmed and is excluded from automatic re-payment. Signed payloads use manual redirects, omit ambient credentials and require the original page origin/resource before wallet approval and dispatch. The UI describes a session as settled only when the facilitator reported success and a transaction.

These browser bytes belong to the current page session and its downloaded files. This patch does not yet provide an authenticated, buyer-owned server recovery endpoint or account/wallet lifecycle binding; the private export recovery above remains an operator tool. No historical buyer ownership is inferred.
