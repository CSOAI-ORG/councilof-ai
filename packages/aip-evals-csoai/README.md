# aip-evals-csoai: offline verifier for a CSOAI signed record

Apache-2.0. `verifyCard.ts` is one pure TypeScript function with no dependencies. It is meant to run where a custom evaluator gets its inputs passed in and has no network egress. It needs three inputs:

- the signed envelope (`csoai.signed-run/0.1`)
- the exact record text
- the pinned public key or keys, as `{kid: base64url x}`

It returns:

```ts
{ verified: boolean, state: "VALID" | "INVALID" | "UNVERIFIABLE_KEY", debug: string }
```

It checks four things, in this order:

1. The sha256 of the canonical payload.
2. The record's sha256.
3. That the key is pinned. If it is not, the result is UNVERIFIABLE_KEY and never VALID.
4. Ed25519 (RFC 8032). sha256, sha512 and the curve arithmetic are implemented in the file with BigInt.

```sh
node --experimental-strip-types --test verifyCard.test.ts     # Node >= 22.6
```

The test fixtures are our own board-signed SAFE-pack freeze record and a saved copy of `https://csoai.org/.well-known/did.json`. The tests prove:

- the real record is VALID
- a one-byte record tamper is INVALID
- a one-nibble signature change is INVALID
- an unknown kid is UNVERIFIABLE_KEY
- the RFC 8032 test 1 and FIPS 180-4 known answers hold

**Not measured.** The function has not been deployed as an evaluator on any hosted platform, because that needs an account. Running it there is UNMEASURED.

**Limit.** VALID shows who signed these bytes. It says nothing about whether any claim in the record is true.
