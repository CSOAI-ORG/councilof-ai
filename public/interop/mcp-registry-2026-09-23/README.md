# Our presence in the official MCP registry — measured 2026-09-23

We published 354 servers to `registry.modelcontextprotocol.io` under `io.github.CSOAI-ORG/*`.
Most of them point strangers at things strangers cannot reach. We cannot edit or remove any of
them. This directory states what is there, why it stands, and what we have prepared instead.

Everything here is about **our own entries**. Nothing in it asserts any falsity about the
registry, its operators, or any other publisher. Where a link we published returns 404, that is
a finding about us.

## Files

| File | What it is |
|---|---|
| `census.json` | The measurement. Produced by `scripts/registry-census.py`; re-runnable by anyone. |
| `supersession.json` | The dated public statement: what we published, what is wrong with it, why we cannot fix it in place, and what we prepared instead. |
| `*.signed.json` | Ed25519 signature over a payload pinning the file by sha256, by `did:web:csoai.org#board-attestation-1`. Verified locally against the published DID document, with a failing control, before it was written. |
| `*.json.ots` + `*.ots.json` | OpenTimestamps proof and its honest state sidecar. **Submitted and pending, not anchored** — see below. |
| `prepared/ai.councilof-gspc.server.json` | The one new entry we prepared. Passes the registry's own `POST /v0/validate`. Not published. |

## The three numbers, and what each one is not

- **354** distinct server names. Not the number of rows.
- **1342** version rows across those names. Never added to 354, never substituted for it.
- **13** tools answering at `https://councilof.ai/mcp/` on 2026-09-23.

## State of the timestamps

The `.ots` files are **pending calendar commitments**. Three calendars accepted each digest and
promised future Bitcoin inclusion. That is a promise, not an attestation. Neither file is
anchored, and neither is described as anchored. Run `scripts/ots-upgrade.py` after several
hours and verify against the chain before anyone calls these timestamps Bitcoin-attested.

Independently checked at stamp time: each proof parses, and each binds the sha256 of the exact
file it sits beside.

## What still needs the owner

Each of these needs a credential this lane does not hold and did not create. Every field name
and header below was read from the registry's live OpenAPI document and its handler source, and
the unauthenticated failure modes were confirmed against the live API — not copied from prose.

**1. Produce or rotate the domain-proof private key.** This is the only blocker on the whole
non-GitHub route. We serve a valid Ed25519 record at
`https://councilof.ai/.well-known/mcp-registry-auth`, but the private half was not found in any
key store swept on this machine or on the deploy pod. It may still be in the Cloudflare Pages
secret store, which this lane cannot read.

```
python3 scripts/registry-http-login.py --key-file <path-to-the-ed25519-private-key>
```

That command refuses to send anything unless the key matches the published record, so it is
safe to try. If the key is genuinely gone, rotate instead — generate a new one, replace
`PUBKEY` in `functions/.well-known/mcp-registry-auth.ts`, deploy, then run the same command:

```
openssl genpkey -algorithm Ed25519 -out mcp-registry-auth.pem && openssl pkey -in mcp-registry-auth.pem -pubout -outform DER | tail -c 32 | base64
```

**2. Publish the prepared entry** (needs the token from step 1; grants `ai.councilof/*` only):

```
curl -X POST https://registry.modelcontextprotocol.io/v0/publish -H "Authorization: Bearer $REGISTRY_TOKEN" -H "Content-Type: application/json" --data-binary @public/interop/mcp-registry-2026-09-23/prepared/ai.councilof-gspc.server.json
```

**3. Deprecate the entries whose endpoint is dead** (needs **GitHub** auth as an Owner of the
organisation — a domain proof cannot reach `io.github.*`). `statusMessage` is now a released
field, so the deprecation notice itself can carry the pointer to the replacement:

```
curl -X PATCH "https://registry.modelcontextprotocol.io/v0/servers/io.github.CSOAI-ORG%2F<name>/status" -H "Authorization: Bearer $GH_REGISTRY_TOKEN" -H "Content-Type: application/json" -d '{"status":"deprecated","statusMessage":"Endpoint api.meok.ai no longer resolves. See https://councilof.ai/interop/mcp-registry-2026-09-23/supersession.json"}'
```

Note the method is `PATCH`, the status enum is `active|deprecated|deleted`, and the body key is
`statusMessage` in camelCase. Unauthenticated, that endpoint returns `422 required header
parameter is missing` — confirmed live on 2026-09-23, which is how the header name was checked.

**4. Republish the npm package if it should carry the new name.** `csoai-gspc-mcp` declares
`mcpName: io.github.CSOAI-ORG/gspc`, and the registry's npm validator compares that field
exactly. Until it is republished with `mcpName: ai.councilof/gspc`, no `ai.councilof/*` entry
can declare that package. (npm publishing on this account is WebAuthn, so it needs a
Bypass-2FA token; `--otp=` cannot work.)

## The trap in the request bodies

The auth request body is **snake_case**: `{"domain", "timestamp", "signed_timestamp"}`.
The `server.json` schema is **camelCase**: `websiteUrl`, `registryType`, `statusMessage`.
Mixing them is a 422 that reads like a server fault and is not one.

The signed timestamp is an Ed25519 signature over the **raw bytes of the RFC3339 timestamp
string**, hex-encoded, and the registry allows **±15 seconds** of clock skew. A stale timestamp
fails in a way that looks exactly like a wrong key.
