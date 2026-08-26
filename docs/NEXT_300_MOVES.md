# NEXT 300 moves — open backlog (honest, unmeasured)

This file is a **planning backlog**, not a MEASURED labour ledger and not a claim that any of these items are shipped.

Rules:

- Prefer **shipped** work over expanding this list.
- Do **not** invent MEASURED labour IDs, TFLOPs, or Wilson-bank claims for backlog items.
- Tick items only when the linked PR / commit / receipt exists on `main` (or the stated branch).
- Keep entries short; link out to issues/PRs for detail.

---

## Recently shipped (do not re-open without cause)

| # | Item | Where |
| --- | --- | --- |
| — | Instruments catalog + RWA product cards (honest MEASURED / UNMEASURED) | `/instruments`, product pages |
| — | Contact registry schema + public contact surface | `/.well-known/schemas/contact-registry.schema.json` |
| — | Lobby task allowlist + surface-hits | `lobbyTaskIds.ts`, `functions/api/surface-hits.ts` |
| — | RWA verify path (GSPC) | `GSPCVerify.tsx` |
| — | Wilson frozen-banks + no-GPU contract-churn lints | `scripts/*-lint.mjs` |
| — | Aviva XRPL adapter stub + adapters catalog | `adapters/` |
| — | TESTNET unsigned RWA fixtures (unmeasured) | `datasets/rwa-testnet-unmeasured/`, `scripts/rwa-fixtures/` |

---

## Open moves (300-scale backlog — pick from top)

### Product / surfaces

| # | Move | Notes |
| --- | --- | --- |
| 238 | Indices hub FAQ block parity | Confirm `FaqBlock` on IndicesHub; a11y pass |
| 239 | Contact axis × RWA index matrix doc | Keep `CONTACT_AXIS_RWA_INDEX_MATRIX.md` current |
| 240 | Signed-card rate metrics (ops only) | Doc only until MEASURED receipts exist |
| 241 | Broken-link crawl in CI | Wire `scripts/broken-link-crawl.mjs` |
| 242 | I18n indices note follow-through | `I18N_INDICES_NOTE.md` — no fake locale coverage |
| 243 | A11y indices products checklist | `A11Y_INDICES_PRODUCTS.md` |
| 244 | Export-control note review | Legal + eng quarterly |
| 245 | HF labour index honesty gate | Refuse invented MEASURED rows |

### Protocol / data

| # | Move | Notes |
| --- | --- | --- |
| 246 | EAS indexer compose path | `EAS_INDEXER_COMPOSE.md` |
| 247 | Parallel archive RPC runbook | `PARALLEL_ARCHIVE_RPC.md` |
| 248 | Issuer public artifact refresh cadence | `ISSUER_PUBLIC_ARTIFACT_REFRESHES.md` |
| 249 | Quarterly freshness reviews | `QUARTERLY_FRESHNESS_REVIEWS.md` |
| 250 | RWA bad-card corrections log | `RWA_BAD_CARD_CORRECTIONS.md` |
| 251 | MCP tools × OS/DSH parity | `MCP_TOOLS_OS_DSH_PARITY.md` |
| 252 | DPA measurement-cards annex | `compliance/DPA_MEASUREMENT_CARDS.md` |
| 253 | Contact registry schema v1 freeze | Public `.well-known` |

### Adapters / RWA

| # | Move | Notes |
| --- | --- | --- |
| 254 | Aviva adapter: real TESTNET probe (unsigned) | No mainnet claims |
| 255 | Second XRPL adapter stub (non-Aviva) | Catalog only until receipts |
| 256 | RWA fixture: additional unsigned card shapes | Keep UNMEASURED |
| 257 | Product page: link TESTNET fixtures clearly | Never imply mainnet |
| 258 | Adapter README: failure modes | Honest timeouts / empty books |

### Legal / trust

| # | Move | Notes |
| --- | --- | --- |
| 259 | Terms: opinion-not-advice pass | `#236` family |
| 260 | DPA: measurement cards section | `#237` family |
| 261 | Privacy: retention table refresh | Annual |
| 262 | Subprocessor list public page | If applicable |

### Engineering hygiene

| # | Move | Notes |
| --- | --- | --- |
| 263 | `signal-dry-run.mjs` in pre-push optional | Local only |
| 264 | Surface-hits allowlist drift test | CI |
| 265 | Package.json script escape audit | After overnight packs |
| 266 | Guard sizes: AppLazy / NewHome | Do not touch without cause |
| 267 | AppRoutesA children form invariant | Route tests |
| 268 | Delete overnight escape-test artifacts | `tmp/overnight5-escape-test.txt` |

### Docs / ops

| # | Move | Notes |
| --- | --- | --- |
| 269 | Broken-link crawl schedule | Weekly |
| 270 | Archive RPC health dashboard | Ops |
| 271 | Signed-card metrics scrape (non-MEASURED) | Counters only |
| 272 | Contact matrix CSV export | Optional |
| 273 | Schema changelog in well-known | Patch bumps |

### Backlog filler (274–300) — unprioritized

| # | Move |
| --- | --- |
| 274 | Status page copy pass |
| 275 | Lobby empty-state illustration |
| 276 | Instruments filter URL state |
| 277 | RWA card print stylesheet |
| 278 | Verify page deep-link tests |
| 279 | Adapter CI typecheck |
| 280 | Datasets README link check |
| 281 | Docs nav for overnight pack |
| 282 | Compliance index page |
| 283 | HF honesty lint in CI |
| 284 | Export-control FAQ |
| 285 | A11y axe on indices |
| 286 | I18n string freeze |
| 287 | MCP tool list screenshot |
| 288 | DSH parity checklist |
| 289 | Freshness calendar ICS |
| 290 | Issuer refresh Slack hook |
| 291 | EAS compose smoke |
| 292 | Archive RPC failover drill |
| 293 | Bad-card correction template |
| 294 | Contact schema examples |
| 295 | NEXT_300 quarterly prune |
| 296 | Remove stale overnight branches |
| 297 | Guard-size bot comment |
| 298 | Legal pages visual QA |
| 299 | Package engines field audit |
| 300 | Close this file’s oldest ticked row |

---

## How to tick

1. Land the change on the integration branch / `main`.
2. Replace the row’s Notes with `done: <sha or PR>`.
3. Move the row to **Recently shipped** if it is user-visible.
4. Never invent MEASURED labour to justify a tick.
