# MEOK public documentation replacement — review candidate

This HTML is a proposed replacement for `https://meok.ai/docs`, not a production asset of Council of AI. It must not be copied into Council's public directory or deployed over an unverified MEOK build.

## Evidence and source boundary

The observed MEOK homepage describes a public evidence workspace, while the retrieved docs describe an older model prompt overlay. The 29 October human-operations review records a bounded public Ask → save → reopen check, unchanged answer content with no additional Ask request, rejection of a tampered digest, and a 390 × 844 mobile check. Those observations support this candidate; they do not prove external adoption, cross-device or new-session recovery, or authenticated execution.

Two local deployment-artifact copies contain the same stale 5,332-byte docs file (SHA-256 `ccf2f6ef61a0723a476496692cc81ba4068d402098281f254e813dc5983a752f`). Their homepage bytes differ from the observed live homepage. These copies therefore do not establish the current production source or authorise replacing the serving build. No private paths, credential material or deployment account identifiers are required in this public handoff.

## Adoption sequence

1. The existing MEOK release owner identifies the serving repository, commit and build configuration from a current deployment receipt.
2. Apply the candidate's content to that source's existing documentation component. Preserve the current design and build conventions; this standalone HTML retains the older page's visual tokens only as a review aid.
3. Verify the exact labels, Ask → export → reopen flow, source links, digest rejection, cancellation and narrow mobile layout against the release candidate. Confirm transcript and network handling before changing privacy/terms.
4. Keep `/docs#status` and the historical anchors `#overlay`, `#keys`, `#mcp`, `#verify`, `#boundary` working. The candidate preserves them without repeating stale endpoint or availability claims.
5. Use the existing governed MEOK release path. Record the serving commit and live `/docs#status` readback. Update the master checklist only after that evidence exists.

This change sets no new price, launches no private capability, issues no measurement or certification, changes no signing keys, and submits no Google indexing request. Google may choose page text or a meta description for its snippet; a source edit does not guarantee its selection or timing.
