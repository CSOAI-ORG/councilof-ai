# Where our bytes are already someone else's input

**Measured 2026-09-06.** The question is not "what could we integrate with" — it is **which formats
do we already publish that a third party's client can read with no new work from us?** Every client
below was resolved live on the public registry today.

## The finding that started this: Circle ships an x402 client

`@circle-fin/cli` **v1.0.0** (bin `circle`; keywords `wallet, usdc, cctp`) depends on
**`@x402/core`, `@x402/evm`, `@circle-fin/x402-batching`, `viem`**. From its own README:

```
circle services inspect <url>    # Inspect a paid endpoint and its pricing
circle services pay <url> --estimate
circle services search           # Search for paid x402 services
circle gateway balance           # "Gateway is used for nanopayments"
```

**The USDC issuer ships an x402 client, and we ship x402 doors.** `@x402/core` is at **v2.25.0**;
our `functions/.well-known/x402.json.ts` emits **`x402Version: 2`**, `scheme: "exact"`,
`network: eip155:8453`, `asset: USDC`, plus `payTo` — and already names `@x402/fetch` in its own
`agent_paths` list.

**Same protocol, same major version, same chain, same asset.** Nothing needs building for
`circle services inspect` to read our pricing. The integration work was done when we published to
spec.

> **A conflation worth avoiding:** `circle-cli` **unscoped** on npm is **CircleCI**, an unrelated
> product. Circle's package is `@circle-fin/cli`. Citing the wrong one in a funding document would
> be embarrassing and easy.

## The map

| Format we already emit | Where | Third-party client, live today | Evidence level |
|---|---|---|---|
| **x402 v2** challenge + discovery | `/.well-known/x402.json`, `/api/x402`, metered doors | `@x402/core` **2.25.0** · `@x402/fetch` **2.25.0** · `x402-fetch` **1.2.0** · **`@circle-fin/cli` 1.0.0** | **field-level match** — version, scheme, network, asset, payTo all align |
| **Hypercert metadata** | `docs/grants/2026-09-06/hypercerts/*.json` | `@hypercerts-org/sdk` **2.9.1** | **schema-validated, exit 0**, 5/5 |
| **MCP server records** | the official registry | `@modelcontextprotocol/sdk` **1.30.0** | **354 records accepted** by a third-party registry |
| **did:web + Ed25519 JWK** | `csoai.org/.well-known/did.json` | `web-did-resolver` **2.0.32** · `did-resolver` **5.0.1** | standard `verificationMethod` + `publicKeyJwk`; **5 keys**, all bound to cards/root |
| **A2A AgentCard** (JCS + JWS) | `/.well-known/agent-card.json` | `@a2a-js/sdk` **1.1.0** | spec §8.4 shape; signing input regenerated today |
| **AT-Protocol records** | `hypercerts/atproto/*.json` | `@atproto/api` **0.20.42** | records carry `$type`, `createdAt` |
| **EAS attestations (Base)** | staged root attestations | `@ethereum-attestation-service/eas-sdk` **2.10.0** | **staged, not yet on-chain** |
| **COSE_Sign1 / CBOR** | `draft-templeman-scitt-framing-space-00` | `cbor2` **2.3.0** | the draft *measures* this framing space |
| **C2PA-style manifests** | `/api/detect` | `c2pa` **0.30.17** | our own verifier; round-trip untested |

## Verified versus plausible — the distinction that makes this usable

**Verified by construction or test:** the hypercert files (validator exit 0 with a selftest proving
it can fail), the MCP records (a third-party registry accepted 354), and the x402 field alignment
(read from our emitter's source against the client's published version).

**Not verified:** that any third-party client successfully round-trips **our exact bytes**. A shared
format and a matching major version is strong evidence of compatibility and is **not proof of it** —
this session has already produced three cases where a matching-looking interface hid a real
mismatch.

The cheapest conversion of the x402 row from evidence into proof is one **read-only** command:

```
npx -y @circle-fin/cli services inspect https://councilof.ai/api/<a metered door>
```

**This lane did not run it.** Installing and executing a third-party CLI that manages wallets is not
a unilateral step, even for a read-only subcommand. Filed as one owner line. **`circle services pay`
must never be run by an agent** — that spends.

## Speaking the protocol is not the same as being findable

`circle services search` searches for paid x402 services — which means it queries an **index**, not
our origin. So the question is not only "do we speak x402" (we do) but "are we in the index".
Measured today against the two indexes our own census reads from:

| Index | Enumerated | Declared total | Distinct hosts | `councilof.ai` |
|---|---:|---:|---:|---|
| **PayAI** (`facilitator.payai.network/discovery/resources`) | 6000 | 28230 | 644 | **LISTED** |
| **CDP Bazaar** (`api.cdp.coinbase.com/platform/v2/x402/discovery/resources`) | **15768** | **15768 (100%)** | **2585** | **ABSENT** |

**We are in PayAI and not in the Coinbase index** — the larger of the two, at 2585 distinct hosts,
and the one nearest to Circle's and Coinbase's own tooling. That single absence is the difference
between an agent finding our doors and not.

**Method note, because the first pass got this wrong.** Page one of each index showed us absent from
both. Page one is 100 of 15768. I then enumerated with a loop capped at offset 5000, which reported
"CDP: absent" from **32%** of the index — that is *unmeasured*, not absent, and reporting it would
have been the estate's own R5 failure (a count is not a measurement until compared with the source's
declared total). CDP accepts `limit=1000`; the full 15768 were enumerated before the word "absent"
was written. **PayAI's listing was found only past page one**, which is exactly why the cap mattered.

## Why this matters more than building a new integration

Every row is distribution already paid for. This estate's recurring failure is building the artefact
and never wiring it to something that runs; this is the same shape one level up — **we published
into nine formats and never asked who else reads them.** Nine clients do, today.
