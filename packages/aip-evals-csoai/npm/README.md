# csoai-verify

Apache-2.0. One ES module with no dependencies that verifies a CSOAI board-signed record (`csoai.signed-run/0.1`) **offline**. sha256, sha512 and Ed25519 (RFC 8032) are implemented in the file. It is written for places where an evaluator gets its inputs passed in and has no network egress (for example a custom TypeScript evaluator), and it runs in browsers, Node, Deno and Bun.

```js
import { verifyCard, keysFromDid } from "https://councilof.ai/lib/csoai-verify.mjs";   // or: npm install csoai-verify
const keys = keysFromDid(savedDidJson);   // a saved copy of https://csoai.org/.well-known/did.json; pin it
const r = verifyCard({ signed: signedEnvelope, recordText: exactRecordText, keys });
// r = { verified: boolean, state: "VALID" | "INVALID" | "UNVERIFIABLE_KEY", debug: string }
```

It checks, in order: the sha256 of the canonical payload, the record's sha256, that the key is pinned (if not: UNVERIFIABLE_KEY, never VALID), and the Ed25519 signature.

Tests (`node --test test.mjs`) run against the built file: our real board-signed SAFE-pack freeze record is VALID; a one-byte record edit, a one-nibble signature edit and an unpinned key are each rejected.

**Limit.** VALID shows who signed these bytes. It does not show that any claim in the record is true.

**Not measured.** Running it as an evaluator on a hosted platform needs an account; that is UNMEASURED. This is our code, not a Palantir integration. More: https://councilof.ai/connect/
