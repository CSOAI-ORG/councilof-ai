# Revenue loops — the metered rail, honestly (2026-09-02)

**Doctrine (owner rulings, unchanged):** open source (Apache-2.0 / CC-BY) · no Stripe · no SaaS tiers ·
no public prices · verification free forever · a grade/rank is never sold · we measure, never certify ·
no token / credit / cash-settled index (financial-instrument firewall). Revenue = metered, permissionless
RaaS over **x402** (HTTP 402 → USDC on Base → the estate wallet), for issuance, assembly and cadence.

## 1. Inventory — bytes adjudicate (curl + code read, 2026-09-02 07:40Z)

| Loop | Where | Live probe | Verdict | Note |
|---|---|---|---|---|
| x402 discovery manifest | `/.well-known/x402.json` | 200 | was **STUB** → now REAL | Static file said `mode: mock` and pointed at `pack.councilof.ai` (a separate mock Worker). Now served by a Function: mode derived from env, resources on this origin. |
| 402 challenge builder (v2 + Bazaar) | `functions/api/_x402.ts` | 402 on 3 routes | REAL (challenge) | `payTo` was **null** live; `extra.name` was the ticker `USDC` (clients sign under the token's EIP-712 domain, which is `USD Coin`/`2` — every honest signature would have failed). Both fixed. |
| Settlement | `_x402.ts verifyX402Payment` | — | was **STUB** → now REAL (fail-closed) | Only `/verify` was called — `/verify` moves no money; `/settle` does. Requirements sent to the facilitator were rebuilt from bare env (`asset:null`, `amount:null`) instead of the advertised `accepts[]` entry. Now: same entry, `/verify` then `/settle`, grant only on settle success, v1/v2 dialect matched to the client. |
| Tier 1 — request-attestation | `/api/request-attestation` | 402 | deliverable was **STUB** (unsigned JSON "accepted") → now REAL | Paid path issues ONE card-v0 leaf, surface `ras.commission`, ≤3KB, Ed25519 under `#board-attestation-1` when `BOARD_SIGN_KEY_PKCS8_B64` is present (else `sig_ed25519:null` + declared). Re-serves every signed card already on file for the subject (read from `/signed/card-matrix.json`). Free preview in the 402 body. |
| Tier 2 — evidence bundle | `/api/evidence-bundle` (new) | n/a | was **MISSING** → REAL | Wires `scripts/evidence-pack-generate.mjs` (obligation map + relevance rule) into a Function: OSCAL 1.1.0 assessment-results of already-signed cards (observations, relevant-to, never findings) + signed manifest card + the existing signed `/packs/eu-article-50`. Obligations: article-50 (counsel-confirmed), article-53, dora, cra (honesty notes ship). |
| `/api/evidence-pack` | free | 200 | was **STUB claiming signed** → honest | `signature_envelope` named a kid with no signature. Now `signed:false, sig_ed25519:null` + pointer to the metered bundle. |
| Tier 3 — data feed | `/api/eunomia-data` | 402 | was v1 challenge over a 5-row fixture → REAL | Free preview = stream inventory read from the signed files. Paid = one feed document (signed signals index, signed First-Fine Watch, root.json, card index), each block with its published signature. |
| Tier 1b — XRPL asset evidence card | `/api/rwa/evidence?asset=<symbol\|issuer_address>` (new) | n/a | REAL | Per-request, canonical ≤3KB card-v0 (`public.notice` / `csoai.eater.xrpl-issuer/0.1` — the SAME schema as the free public-root leaf the eater stages): AccountRoot lsf flags, Domain, two-way TOML check (PASS/FAIL/UNCHECKABLE), gateway_balances obligation, holders as `/api/xrpl` has them, per-fetch sha256 + `inputs_sha256`, Ed25519 when the Pages key is present. `?preview=1` = free unsigned state without the raw hashes. Same accepts entry / facilitator / settle path as request-attestation. `/api/xrpl`, `/api/gspc`, `/root.json` stay free. |
| Proof bundle | `/api/proof?bundle=1` | 402 | REAL | Assembles Merkle inclusion proofs from root.json. Now passes the advertised accepts entry to settlement. |
| Witness a digest — attest what you're shown | `/api/witness` (GET `?sha256=`/`?url=`, POST bytes) + free `/api/witness/status` (new) | n/a | REAL (queue NOT_YET until `WITNESS_KV` is bound) | Hash-only: buyer bytes are hashed in the Function and dropped; a URL is fetched once with our UA, robots.txt honoured, never past a login/paywall/bot check (UNCHECKABLE, nothing charged). Paid = an RFC-3161 timestamp reply over the digest from a public TSA (`RFC3161_TSA_URL`, default freetsa.org; a QTSP contract is an owner step) + one `public.notice` leaf (`csoai.witness.hash/0.1`) in the next hourly signed root via `scripts/adapters/witness_queue.py` + the ONE root's Rekor/OTS anchors. Attests existence of the digest at the root's as_of — nothing about content, legality or provenance; a self-signed card carries no legal presumption. 503 `NOT_YET` before any settlement when the KV binding is absent. Same accepts entry / facilitator / settle path as request-attestation. |
| Revenue truth | `/api/revenue` | 200 | REAL | All counts null (never 0) until a receipt settles; KV tallies when `REVENUE_KV` is bound. |
| Catalog | `/api/x402` (new) | n/a | REAL | Tiers, resources, free previews, never[], rail mode, and an `mcp` block (free seven / paid five, routes, what each sells). **No amounts** — amounts live only in a 402. `/.well-known/x402.json` lists the receipts batch resource + the MCP door. |
| Explainer | `/pricing-free` (new) | n/a | REAL | Names no price. 4-way wired (route, prerender, PRIMARY_PATHS, linked from /products). |
| SKU price atoms | `functions/api/_skus.ts` | — | REAL | ESTIMATES, env-overridable, never rendered on a page (brand-gate + price-gate enforce). |
| Signing on Pages | `/api/board-sign` | 401 (OIDC gate first) | REAL | Key = Pages secret `BOARD_SIGN_KEY_PKCS8_B64`; the metered endpoints now reuse the same key + the one canonical rule (`functions/_lib/cardSign.ts`). |
| Signed Art-50 pack | `/packs/eu-article-50/*.sig.json` | 200 | REAL | Detached Ed25519; the Tier-2 bundle links it. |
| MCP server (stdio) | npm `csoai-gspc-mcp` 0.1.1 | published | REAL, free-only | Seven read tools. stdio carries no payment header, so paid tools are NOT mirrored here by design. |
| MCP paid tools (HTTP) | `POST /mcp` tools/call — `commission_card`, `art50_marking_evidence`, `rwa_evidence`, `witness_hash`, `receipts_batch` (`functions/mcp/paid-tools.json`, `_paid.ts`) | n/a (this PR) | REAL (wrapper) | Each wraps its x402 route on the same origin: unpaid → the route's 402 challenge as `structuredContent` (accepts[], PAYMENT-REQUIRED) so an MCP client pays from its own wallet and calls again with `x_payment`; paid → the deliverable + settle echo; route absent → `NOT_DEPLOYED` (three routes ship in PRs #1158/#1162/#1163). The seven free tools and `tools/list` stay free; no tool carries a trust label; "measurement, not certification" on every definition. |
| Receipts batch (historical) | `/api/receipts/batch?from=&to=` (`functions/api/receipts/batch.ts`, SKU `receipts_batch`, x402-or-invoice) | n/a (this PR) | REAL — smallest honest version | **What a receipt is here:** `/api/receipts/latest` is an UNPUBLISHED stub (no settlement-receipt stream exists), so there is no payment-receipt history and the endpoint never claims one. It batches the estate's *measurement* receipts — card-v0 leaves with their inclusion paths — and names the root(s) that carried each, from `public/receipts/root-history.json` (git history of `root.json`, indexed at build by `scripts/build-root-history.mjs`; 11 distinct roots at first build, compounds when the public-root workflow runs the script before `git add` — one-line follow-up left out of this PR to avoid colliding with #1163). Recent = current root, free at `/root.json`, `/cards/`, `/api/proof?sha=`. `?preview=1` is free: count, span, root count and the sha256 of the exact canonical batch bytes the paid path returns. Paid = the batch (≤200 leaves, deterministic) + one signed manifest card-v0 (`receipts.batch`) citing the batch sha256 and the settle tx. `/api/receipts/latest` unchanged. |
| Card verifier package | `packages/gspc-card-verifier` 1.0.0 | **not on npm** | MISSING (publish) | Owner `npm publish` — 37/37 tests under node:test. |
| `x402-pack-rail` Worker | `csoai-402-pack…workers.dev`, `pack.councilof.ai` | 402 / 200 | STUB (mock) | Separate box, `X402_MODE=mock`. No longer advertised by the manifest. Retire or repoint later. |
| `csoai-coinbase-x402-receipt-mcp` | GitHub (MEOK AI Labs, MIT) | public | REAL, not on disk | Referenced as `settle_mcp` in challenge bodies; not required by the rail. |
| `meok-compliance-gateway` `@paywalled` | sibling repo | `X402_ENABLED=0` | REAL code, MEOK side | Boundary: MEOK hosts the model; CSOAI measures. Not wired here on purpose. |
| Stripe remnants | `/api/checkout`, `/api/fulfill`, `/stripe-checkout.js` | closed / 410 | retired | Left as-is (doors closed, no prices). |

## 2. The money path (what a settled dollar looks like)

```
agent  GET /api/request-attestation?subject=<id>
   ← 402  accepts[]: exact · eip155:8453 · USDC 0x8335…2913 · payTo <estate wallet> · amount <atomic>
          csoai.preview: signed cards already on file · rail.mode
agent  signs EIP-3009 transferWithAuthorization (domain "USD Coin"/"2") → retry with X-PAYMENT
edge   POST {facilitator}/verify  → isValid
edge   POST {facilitator}/settle  → success, transaction  (USDC lands in payTo — the ONLY money move)
   ← 200  card-v0 (ras.commission, signed) + X-PAYMENT-RESPONSE {transaction}
```

Pay-to address: `functions/api/_x402_config.ts` (`ESTATE_PAY_TO`, read from the owner's config +
three estate docs that agree; env `X402_PAY_TO` overrides). No private key exists in the repo or
on Pages — an EIP-3009 authorization names the recipient; a facilitator can only pay gas.

## 3. Owner actions — the exact clicks that unlock the first dollar

1. **Switch settlement on (one env var).** Cloudflare dashboard → Workers & Pages → `councilof-ai` →
   Settings → Environment variables → Production → Add:
   - `X402_FACILITATOR_URL` — either
     - `https://facilitator.payai.network` (keyless; `/supported` lists `exact` on `base` mainnet, x402 v1), or
     - `https://api.cdp.coinbase.com/platform/v2/x402` plus `X402_FACILITATOR_TOKEN` (CDP API key — needed for Bazaar indexing).
   - (optional) `X402_PAY_TO` if the receiving wallet ever changes.
   Redeploy (any push to master). `/api/x402` flips `rail.mode` from `challenge-only` to `live`.
2. **Confirm the signing key is on Pages.** Same screen: `BOARD_SIGN_KEY_PKCS8_B64` must be present
   (it is what `/api/board-sign` uses). If absent, paid cards ship `sig_ed25519:null` with the reason declared —
   honest, but a design partner wants the signed one.
3. **Bind the tally store (optional, makes `/api/revenue` count).** `wrangler.jsonc` → `kv_namespaces` →
   add `{ "binding": "REVENUE_KV", "id": "<new namespace id>" }` after creating the namespace
   (dashboard → Storage & Databases → KV → Create → name `revenue`). Without it counts stay null (never 0).
4. **Publish the verifier.** `cd packages/gspc-card-verifier && npm publish --access public` — the
   third-party recompute story needs a one-line install.
5. **Fund nothing.** The receiving wallet needs no balance; buyers pay, the facilitator pays gas.
6. **First test purchase (owner, from the MetaMask wallet or any x402 client):**
   `npx @x402/fetch` (or `x402-fetch` v1) against
   `https://councilof.ai/api/request-attestation?subject=<a model on the board>` — the receipt card cites the
   tx on basescan; verify it at `/gspc-verify`.

## 4. Gates run for this change

`npx vitest run` — 83 files, 468 tests, 0 failing (was 79/449; +4 suites: `_x402`, `cardSign`, `_obligations`,
`PricingFree`). `npm run build:client` → `node scripts/brand-gate.mjs dist/client` → `node scripts/facts-gate.mjs dist/client`.
Untouched by rule: `*.signed.json`, `public/root.json`, Hugging Face, master.

## 5. Highest-leverage next move

**One paying design partner + one independent third-party recompute of a signed card.**
The rail can now take a dollar the moment step 3.1 is done; what it cannot manufacture is a stranger
who pays and a stranger who recomputes. Concretely: (a) pick one GPAI provider or insurer already in the
outreach registry, commission Tier 2 for `article-53` on their public model, invoice from CSOAI LTD if
they prefer fiat (agent never moves funds), and publish the settled tx + the card; (b) hand
`gspc-card-verifier` to any outside party (IETF SCITT contact, a university lab) and publish their
recompute as a card-v0 `public.notice` leaf. Everything else — Bazaar listing, MCP paid tool, A2A tasks —
compounds only after those two facts exist.
