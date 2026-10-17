# Contact and report-enquiry receipts

Private source revision, 18 September 2026. This document does not authorise deployment or describe a completed customer engagement.

## Purpose
The existing `/api/contact` and `/api/lead` now acknowledge a message only after reading back the exact stored record from the existing LEADS namespace. The Contact page uses that acknowledgement instead of assuming that opening an email application means the business received the enquiry. Its manual email option remains an explicitly unsent draft.

A confirmed receipt is not an email sent, human review, a booking, a signed report, paid execution or a successful customer outcome. Those states are deliberately false or unclaimed in the response.

## Request and response identity
Callers may supply a UUID in `submission_id`. The built Contact and assessment-enquiry interfaces keep it unchanged while retrying an unchanged submission. Both the UUID and the normalized, typed enquiry content participate in the receipt identity. The record key retains the existing `contact:` or `lead:` prefix with a v2 segment.

A changed enquiry obtains a different content-bound key, preserving the previous message. A matching stored record reuses its observed receipt and timestamp without another write. Malformed or conflicting content already stored at the derived key is not overwritten. Older records are not migrated, removed or reclassified by this change.

A caller that omits the UUID receives a generated one, but cannot expect deduplication after losing the entire response unless it supplied and retained an identity itself. No distributed lock or atomic multi-request transaction is claimed.

## Input boundaries
Both endpoints require a bounded JSON object and typed string fields. The whole body is limited to 24,576 bytes. Email, name, subject and message have separate limits; null/array/scalar bodies, oversized values, contradictory report identifiers, undeclared fields and cross-origin browser requests are rejected before a storage write. Absence of an Origin header does not authenticate an API client.

Report enquiries preserve the caller's `result_id` as the stored `report_id`, plus the supplied screening state and explanation. These are retained caller context, not a new assessment, legal interpretation or signed finding. When both report-id fields are supplied they must agree.

## Failure and retry behaviour
`stored:true` requires `STORED_READBACK_CONFIRMED`, the expected submission UUID, a receipt identifier, a valid recorded timestamp and explicit non-delivery/non-review states. A bare HTTP 200, an empty body, an unrelated receipt, or a Boolean alone cannot produce the success UI.

No store returns an explicit unavailable state. A failed read/write or unreadable readback returns uncertainty, including the same stable identifiers when they have been derived. The client retains entered text and offers a manual retry or email fallback. It does not automatically retry or automatically pay anything.

Cloudflare KV is eventually consistent, including negative lookups; immediate read-after-write visibility is not guaranteed. A positive local readback therefore cannot prove global durability, global single execution or delivery to a human. The implementation and tests preserve that distinction.

Primary reference: https://developers.cloudflare.com/kv/concepts/how-kv-works/
Local storage reference: https://developers.cloudflare.com/workers/testing/miniflare/storage/kv/

## Public diagnostic and privacy
The GET diagnostic reports binding shape only. It no longer lists keys from a namespace that also contains other private records. No customer data is returned in acknowledgement bodies. Contact information is sent only when the visitor deliberately submits the form; no marketing consent is inferred and no automatic outgoing email is added. Existing enquiry data-retention policy remains unchanged.

This change does not create a CRM, a public receipt lookup, a new notification service, a new scheduler or a different storage authority. It is not a spam-resistance or whole-application security certification. Any further abuse controls and private operator workflows require their own review.

## Acceptance evidence
The unit tests exercise uncertain storage, readback failure, duplicate retries, conflicts, malformed input, report-context retention, response identity and non-delivery wording. The native acceptance executes the actual compiled Pages Worker against a new local fixture namespace, including disposal and restart of that runtime.

The browser acceptance deliberately withholds the first response after the local Worker has successfully stored a synthetic message. The real form must keep the message, refuse a success badge, retry under the same submission ID and then show the original receipt. A changed message must invalidate the previous success and obtain a different receipt. The test must also verify phone-width layout and explicit unsent email fallback.

Synthetic test submissions are neither leads, customers, revenue nor outside adoption. Production and remote preview namespaces are never supplied to these tests. The existing production and preview namespaces were previously observed to overlap, so a remote preview is not assumed to be an isolated testing environment.
