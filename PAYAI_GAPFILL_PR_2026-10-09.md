# PAYAI GAP-FILL — PR #2978, Commit 3

**Date:** 2026-10-09 (probe window 04:13–04:35 UTC)
**Lane:** PAYAI GAP-FILL, x402-lane clone (`/Users/nicholas/.hermes/cache/scratch/x402-lane`, branch `fix/x402-challenge-order`)
**Commit:** `0e3a44554` — *fix(x402): echo the bazaar block from the 13 doors that advertised but never sent it*
**PR:** https://github.com/CSOAI-ORG/councilof-ai/pull/2978 — state **OPEN**, head `0e3a44554`, **updated-at 2026-10-09T04:34:33Z** (body re-read after edit; section `## Commit 3: PayAI bazaar-extension gap-fill (6→31 doors)` present)
**Not done, as instructed:** never merged, `origin/master` untouched (still `21f63a29c`), no wrangler, no deploy, no commits written in `~/clawd`.

---

## 1. Headline — the brief's premise did not hold, and the real gap was found instead

| Brief said | Measured |
|---|---|
| "~25 of 31 doors lack the bazaar extension block" | **0 of 31 lack it.** All 31 already answer unpaid `POST {}` with `402` + `resource{url,description,mimeType,serviceName,tags}` + `extensions.bazaar{info{input,output},schema}` — in the body **and** in the base64 `PAYMENT-REQUIRED` header. Verified two ways: live against production (2026-10-09 04:16 UTC) and in-repo against this branch. |
| "grep -rL `declareBazaarHttpGet` finds the doors lacking it" | The grep is a trap: `free-door.ts` and `discover/_subject.ts` build the identical block **inline** instead of via the helper, so they appear in `-L` while being fully conformant. Only a *behavioural* probe (call each door, read the 402) tells the truth. |
| The gap to close | **13 of 31 doors advertised the block and then called `verifyX402Payment` WITHOUT `opts.bazaar`**, so their payment payload reached the facilitator with **no `extensions` at all** — settleable, permanently unindexed. Those are the three `/api/discover/*` doors and all ten `/api/pop/*` doors. That is the code gap this commit closes. |

Why the distinction matters: PayAI never reads our 402. It catalogues from the payload it receives on `/verify`/`/settle`. A door can be perfectly conformant on the wire and still be invisible because the echo never happens (see §6, the citation).

---

## 2. Doors covered (all 31 catalogued doors, from `GET https://councilof.ai/api/x402` `resources[]` = 29 rows → 31 concrete doors; `/api/discover/<a|b|c>` expands to 3, `/api/wrapper/asset/{usdc,usdt,dai}` are 3)

Legend — **declared**: unpaid `POST {}` returns 402 with `resource{…}` + `extensions.bazaar{…}` · **echoed**: the same block is passed to `verifyX402Payment` so it lands in `paymentPayload.extensions` · **indexed**: present in PayAI's `GET https://facilitator.payai.network/discovery/resources` (all 17,822 rows walked).

| # | Door | declared (live prod) | resource.tags | echoed **before** | echoed **after** | in PayAI index |
|---|---|---|---|---|---|---|
| 1 | `/api/free-door` | 402 ✅ | **missing → added** | ✅ | ✅ | ✅ `lastUpdated 2026-09-24T13:01:01.339Z` |
| 2 | `/api/discover/chainlink` | 402 ✅ | **missing → added** | ❌ | ✅ **fixed** | — |
| 3 | `/api/discover/ondo` | 402 ✅ | **missing → added** | ❌ | ✅ **fixed** | — |
| 4 | `/api/discover/ondo-ousg` | 402 ✅ | **missing → added** | ❌ | ✅ **fixed** | — |
| 5 | `/api/request-attestation` | 402 ✅ | ✅ | ✅ | ✅ | ✅ `2026-09-07T04:58:46.448Z` |
| 6 | `/api/evidence-bundle` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 7 | `/api/signed-data-feed` | 402 ✅ | ✅ | ✅ | ✅ | ✅ under its **legacy** path `/api/eunomia-data`, `2026-09-07T04:58:50.159Z` |
| 8 | `/api/proof` | 402 ✅ | ✅ | ✅ | ✅ | ✅ `2026-09-07T04:58:52.174Z` |
| 9 | `/api/rwa/evidence` | 402 ✅ | ✅ | ✅ | ✅ | ✅ `2026-09-07T04:58:54.445Z` |
| 10 | `/api/wrapper` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 11 | `/api/wrapper/changes` | **404 live** → 402 on this branch (commit 1) | ✅ | ✅ | ✅ | — |
| 12 | `/api/wrapper/asset/usdc` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 13 | `/api/wrapper/asset/usdt` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 14 | `/api/wrapper/asset/dai` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 15 | `/api/art50/marking-evidence` | **400 live** → 402 on this branch (commit 1) | ✅ | ✅ by call site | ✅ by call site | — |
| 16 | `/api/feeds/provider-diff` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 17 | `/api/receipts/batch` | 402 ✅ | ✅ | ✅ | ✅ | ✅ `2026-09-07T04:59:01.499Z` |
| 18 | `/api/measurement/fresh-capsule` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 19 | `/api/pop/stablecoins` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 20 | `/api/pop/swift` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 21 | `/api/pop/xrpl` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 22 | `/api/pop/x402-bazaar` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 23 | `/api/pop/mcp-registry` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 24 | `/api/pop/a2a` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 25 | `/api/pop/ots-proofs` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 26 | `/api/pop/layer0` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 27 | `/api/pop/corrections` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 28 | `/api/pop/claim-watch` | 402 ✅ | ✅ | ❌ | ✅ **fixed** | — |
| 29 | `/api/ras/mcp-probe` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 30 | `/api/ras/x402-check` | 402 ✅ | ✅ | ✅ | ✅ | — |
| 31 | `/api/ras/supply` | 402 ✅ | ✅ | ✅ | ✅ | — |

**Totals**

| Claim | Before | After |
|---|---|---|
| Declared (402 + `resource{…}` + `extensions.bazaar{…}`, body and header) | 31/31 on this branch (29/31 live: `art50` 400, `wrapper/changes` 404 — both fixed by commits 1–2, undeployed) | 31/31 |
| `resource.tags` present | 27/31 | **31/31** |
| **Block echoed to the facilitator** | **18/31** | **31/31** (30 probed behaviourally; `art50` by its own call site) |
| Listed in PayAI | **6/31** | 6 — the other 25 are now *cataloguable* (see §7) |

**Doors whose code changed:** `discover/_subject.ts` (3 doors), `_population_door.ts` (10 doors), `free-door.ts` (1 door, tags only) = **14 doors touched, 13 with the functional fix**. The other 17 already echoed correctly; nothing was changed on them.

---

## 3. Exclusions, with reasons

| Excluded surface | Reason |
|---|---|
| `/api/verify`, `/api/receipts/verify` | Free verification, forever. 6 Sep owner ruling: free surfaces stay free; no payment or bazaar claim may be added. Never in the 31-door list. |
| `/api/gspc`, `/api/fines`, `/api/commissions`, `/api/x402/index`, `/api/corrections`, `/root.json`, `/gspc-verify`, `/methodology` | `free_forever` — answer 200 with no handshake, are not doors, and are asserted absent from both the door list and the `/.well-known/x402` fan-out. |
| Quarantined witness | Not a door; absent from the list (now asserted). |
| `/api/free-door` | **Not excluded from the shape** — it is a zero-priced *door*, not a free surface, and it is one of the six already-indexed rows. Only `resource.tags` was added to it (metadata, no price, no new claim); its 402, its amount of 0, and its fulfilment path are byte-for-byte unchanged. |
| Nothing else | No door was left out of the parity assertions. The test enumerates the list *from the listing handler*, so an exclusion can only exist by being absent from `/.well-known/x402.json`. |

No new endpoint, no price on any public page, no free-surface conversion, measurement language only ("Measurement, not certification", "never a grade/rank/certificate" strings untouched).

---

## 4. What was changed (4 files, +293 / −50)

```
functions/api/_population_door.ts           |  52 ++++---
functions/api/discover/_subject.ts          |  71 ++++++----
functions/api/free-door.ts                  |   4 +
functions/api/x402-challenge-order.test.ts  | 216 ++++++++++++++++++++++++++++-
```

1. **`functions/api/discover/_subject.ts`** — the bazaar object is hoisted out of `buildPaymentRequiredV2` into one `const bazaar` (the free-door *computed once, used twice* pattern) and passed to both `buildPaymentRequiredV2` **and** `verifyX402Payment(…, { allowZeroAmount: true, bazaar })`. Added `resource.tags: ["discovery", <subject>, "links", "x402"]`.
2. **`functions/api/_population_door.ts`** — same hoist for the ten population doors (block content verified byte-identical to before by a scripted diff of the `declareBazaarHttpGet({…})` argument), plus a single `attemptPayment()` wiring point used by both call sites (the unpaid reason-probe and the paid settle), so both hand the facilitator the same object.
3. **`functions/api/free-door.ts`** — `resource.tags: ["board","public-root","discovery","x402"]`. Deliberately no price word: amounts live only in `accepts[]`.
4. **`functions/api/x402-challenge-order.test.ts`** — 13 → 16 cases (§5).

Staged **by name** (never `git add -A`); tree was clean before the change; sparse-checkout quirks not hit (`core.sparseCheckout=true`, full working tree present for all touched paths).

---

## 5. Before / after test output

### `npx vitest run functions council-os`

**Before (branch at `cb389c50c`; the two numbers below are net of the 2 throwaway probe files I had in the tree while measuring):**

```
 Test Files  243 passed | 1 skipped (244)     →  242 real files
      Tests  2537 passed | 11 skipped (2548)  →  2535 real tests
   Duration  14.13s
```

**After (head `0e3a44554`, probes removed):**

```
 Test Files  241 passed | 1 skipped (242)
      Tests  2538 passed | 11 skipped (2549)
   Duration  23.14s
exit=0
```

Net: **242 files → 242 files; 2,535 → 2,538 tests passed (+3), 11 skipped unchanged, 0 failures, no baseline pre-existing failures to report.**

### `functions/api/x402-challenge-order.test.ts`

| | Before | After |
|---|---|---|
| cases | 13 passed | **16 passed** (`Test Files 1 passed (1) / Tests 16 passed (16)`) |

New cases:
1. **Indexed shape, field by field** — every listed door's 402 must carry `resource.url|description|mimeType|serviceName|tags` (tags non-empty) and `extensions.bazaar.info.input`, `info.output`, `schema` — not merely `"bazaar" in extensions`.
2. **Free/verify exclusion guard** — the door list must contain none of the ten free-forever/verify paths and no `witness` path (the 6 Sep ruling, made executable).
3. **The echo ratchet** — `vi.spyOn(x402, "verifyX402Payment")` drives each door's own unpaid probe and fails on an absent **or rebuilt** block (JSON-string equality against that door's own 402). 30 of 31 doors are reached; `art50` is the single named allowlist entry because it answers 402 before its payment path (this PR's own fix). A paid population-door probe (public/ served from disk, facilitator stubbed) then captures what the facilitator is actually told and asserts the payload carries that door's block, non-vacuously (`≥1` `/verify` captured).

**Ratchet proven non-vacuous:** temporarily reverting `discover/_subject.ts` to `{ allowZeroAmount: true }` produced

```
Test Files  1 failed | 15 passed (16)
  https://councilof.ai/api/discover/chainlink: verifyX402Payment called with no bazaar block
  https://councilof.ai/api/discover/ondo: verifyX402Payment called with no bazaar block
  https://councilof.ai/api/discover/ondo-ousg: verifyX402Payment called with no bazaar block
```

…and was then restored (the same revert accidentally wiped the file once via `git checkout --`; it was re-applied and re-verified green).

### Other gates

| Gate | Result |
|---|---|
| `npm run capabilities:check` | **exit 0** — `capability registry: 259 entries agree with functions/`, `capability-render all: 5 artifact(s) match`, `openapi: … 160 paths, 31 x402 doors, version 0.3+b0886b1cbf96` |
| `npx tsc -p tsconfig.functions.json` | **exit 0**, no diagnostics (`noEmit: true`, nothing emitted) |
| `bash scripts/pre-push-gates.sh` | **exit 0** — `wallet-credential-gate + facts-gate + brand-gate + canary-leak-gate + price-gate clean` |
| pre-push hook (global `hooksPath`) on `git push` | ran `scripts/pre-push-gates.sh` again → `Council content/release gates passed`; push accepted `cb389c50c..0e3a44554` |
| pre-commit hook | `(skip) MEOK MCP proxy-path suite not in this repo — x402-lane` |

---

## 6. PayAI refresh mechanism — what was actually read

Source: **https://docs.payai.network/x402/facilitators/bazaar** (fetched 2026-10-09), plus the facilitator's own developer reference at `https://facilitator.payai.network/developers` (base URL, `GET /discovery/resources`, rate limits).

Verbatim, the lines that decide this work:

* *"Listing is automatic: there is no registration form, account, or manual submission. **The facilitator indexes your resource from the payments it processes — if they carry your discovery declaration.**"*
* *"**Your server declares.** Your 402 response includes a bazaar discovery declaration…"* → *"**The buyer's client echoes.** The client copies your declaration from the 402 response into the payment payload it sends to the facilitator."* → *"**The facilitator catalogs.** On `/verify` and `/settle`, the facilitator extracts the declaration from the payment payload and upserts your catalog entry asynchronously."*
* *"**Since 2026-07-29, cataloging runs on `/verify` as well as `/settle`. Verification moves no funds**, so you can list or refresh a resource without a settled payment."*
* *"The optional **`serviceName`, `tags`, and `iconUrl`** fields on the `resource` object are service-level metadata the Bazaar uses to present your listing; **they are persisted along with `description` and `mimeType`**."* ← the reason the four missing `tags` were filled.
* *"Entries are **upserted on every payment that carries the extension**… Refresh is **forward-only**… There is **no TTL and no eviction**… **There is no re-index endpoint.** To force a refresh, make one verify-shaped payment against your own endpoint through a client that echoes extensions — `/verify` catalogs and moves no funds."*
* Opting out, v2: *"simplest is to **omit the `bazaar` extension from your 402** — with nothing to echo, nothing is indexed."* (The mirror image of our defect: declaring it in the 402 but omitting it from the payload has the same effect.)
* The catalog endpoint walked for the 6/31 figure: `GET https://facilitator.payai.network/discovery/resources` → `{items, pagination{limit,offset,total}, x402Version}`, `total: 17822`, `discovery` rate limit 25 req/s.

The in-repo statement of the same rule, already on this branch in `functions/api/_x402.ts`: *"`opts.bazaar` is the SAME info+schema block the door advertised under `extensions.bazaar` in its 402 (compute once, use twice). It is echoed into the v2 PaymentPayload sent to the facilitator… **a door that omits it stays settleable and stays unindexed**."* And the spec line both cite: *"If the extension is omitted, discovery cataloging will not occur"* (`specs/extensions/bazaar.md`).

---

## 7. What is left, and why this lane stopped here

* **25 doors are now cataloguable, not yet catalogued.** Indexing happens only when an extension-carrying payload reaches PayAI `/verify` or `/settle`. There is no registration endpoint and no re-index endpoint. Producing that payload means signing a verify-shaped payment — a **payment-shaped action with a credential**, explicitly outside this lane's hard limits (no payments, no accounts, no credentials). It is an owner action; the doc's own wording is that `/verify` moves no funds, but it still requires a signed payload, so it was not attempted.
* **Production still runs the old code.** `art50` (400) and `wrapper/changes` (404) are broken on live only because commits 1–2 are undeployed; GHA deploy runs on `master` only and was not touched. After the merge + deploy, a live re-probe should show 31/31 declared.
* **One stale index row:** PayAI still holds `/api/eunomia-data`, the pre-rename path of `/api/signed-data-feed`. It will not be evicted (no delisting semantics in the spec); the honest fix is a verify-shaped call against the new URL.
* **Suggested owner follow-up** (not executed): one zero-funds verify-shaped call per door, through a client that echoes `extensions.bazaar`, then re-walk `GET /discovery/resources` and re-run the "in index" column above.

---

## 8. Hard-limit compliance

| Limit | Status |
|---|---|
| No payments | ✅ every facilitator call in tests is stubbed; the only live HTTP was read-only `GET /api/x402`, unpaid `POST {}` challenges, and `GET /discovery/resources`. No `X-PAYMENT` was ever sent to production. |
| No accounts / no credentials | ✅ none created, none used; the PayAI catalog is public and unauthenticated. |
| No new endpoints | ✅ no route added or changed. |
| No prices on public pages | ✅ added strings are `board`, `public-root`, `discovery`, `x402`, `links`, `<subject>` — amounts remain only in `accepts[]`. |
| No free-surface conversion | ✅ free/verify/quarantined surfaces untouched and now asserted absent from the door list. |
| Measurement language only | ✅ no certification/grade/rank wording added; existing `never[…]` lists unchanged. |
| Never merge / never master / never wrangler | ✅ PR #2978 remains **OPEN** at head `0e3a44554`; `origin/master` unchanged at `21f63a29c`; no deploy command run. |
| No other commits in `~/clawd` | ✅ `PAYAI_GAPFILL_PR_2026-10-09.md` written as a plain file; `~/clawd` is not a git workdir touched by this lane. |
