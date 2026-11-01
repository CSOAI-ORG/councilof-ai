---
name: sign-artifact
description: Seal a local file or eval receipt with the CSOAI Layer-0 Ed25519 key through the governance MCP. Use when the user says sign, seal, attest this output, or signed receipt. The seal is evidence of bytes at a time, not approval of the system.
---

# Sign / seal an artifact

## What this is

`csoai_sign` (MCP `csoai-governance`) binds an Ed25519 signature to the bytes you pass. That is a
**receipt**: these bytes, this key, this moment.

It is **not** a certificate that the model, the repo, the company or the person is safe, legal,
compliant or approved. A seal answers "did these bytes exist and were they unchanged?" — nothing
else.

## Steps

1. Identify the exact file or string. Prefer a file path in the workspace.
2. Call MCP `csoai_sign`. If the governance MCP is unavailable, say so plainly and point at
   `npx -y csoai-governance-mcp`. **Never fabricate a signature.**
3. Return the fingerprint, the signature and the public key.
4. Offer `csoai_verify` on the same payload so the user sees the round-trip.
5. If the artifact is an eval scoreboard, say plainly that a Council measurement card
   (`gspc.measurement-card`) is a **different object** produced by the measurement body, not by this
   local seal. Do not blur them.

## Forbidden

- Printing a badge, a shield, or the word "certified"
- Signing and then saying the product "passed Council of AI"
- Inventing a signature when the service is UNREACHABLE — return the error instead
- Writing the key, or any secret, into the artifact, the log, or the chat
