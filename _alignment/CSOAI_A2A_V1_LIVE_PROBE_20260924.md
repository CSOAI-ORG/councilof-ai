# CSOAI A2A v1 live task probe — 24 September 2026

The directory's failed `message/send` probe is a protocol-version signal, not proof that the current A2A v1 agent cannot answer a task. This is a bounded read-only probe of CSOAI's own public endpoint, not an external-registry write.

At 22:54 UTC, `POST https://councilof.ai/api/a2a` with `A2A-Version: 1.0`, JSON-RPC method `SendMessage`, and a public `gspc-board` skill request returned HTTP 200, no JSON-RPC error, and `result.message` with `ROLE_AGENT` and two parts. Response length 9,506 bytes; SHA-256 `a3f1491c0389de27621cf22f15cd5e9a36cf488c2986615603893a918e8aa330`. This demonstrates one public skill response, not full A2A conformance or adoption.

A second request with legacy method `message/send` and no `A2A-Version` header returned HTTP 200 carrying JSON-RPC error `-32009 VERSION_NOT_SUPPORTED`, with instructions to use the v1 method `SendMessage` and header `A2A-Version: 1.0`. The official A2A v1 migration guide identifies `message/send` -> `SendMessage`: https://github.com/a2aproject/A2A/blob/main/docs/whats-new-v1.md .

The public a2aregistry.org record says its task smoke test used `message/send` and failed at 02:05 UTC, while card health checks later passed 47/47. The observed v0.3 rejection is consistent with that failure, but the registry's worker log was not available, so the exact cause remains unconfirmed. A registry retest should send the card-declared v1 interface, header and method. Preserve the failed registry status until that retest is observed; do not label the registry task probe passed based on our direct probe.
