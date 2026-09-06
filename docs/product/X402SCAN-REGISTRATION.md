# x402scan registration — the owner's click path

> Pack assembly for a directory listing. Does not fill a cell, does not earn a cent by itself: x402scan
> (https://www.x402scan.com, Merit Systems, Apache-2.0) is a directory of x402 servers that agents browse.
> Listing there is distribution, never revenue (see `revenue-doctrine`). Nothing in this document moves
> funds; the two signatures it asks for are *message* signatures, not transactions.

Sources read on 2026-09-06 (everything below is traceable to one of these):
`Merit-Systems/x402scan` → `docs/DISCOVERY.md`, `apps/scan/src/lib/discovery/{register-origin,probe,catalog-auth}.ts`,
`apps/scan/src/app/api/x402/registry/register-origin/route.ts`, `apps/scan/src/lib/ownership-proof.ts`,
`apps/scan/src/app/(app)/(home)/integration-spec/_content/markdown.ts`; and the parser it calls, npm
`@agentcash/discovery@1.7.5` (`dist/index.js`).

## What x402scan reads, and what we serve

| x402scan expects | where | what `public/openapi.json` (served at `/openapi.json`) carries |
|---|---|---|
| the document at exactly `{origin}/openapi.json` | DISCOVERY.md §A | static file in `public/`; no Function owns the path, `_redirects`' SPA catch-all does not intercept a static asset (live GET returns the file) |
| `openapi`, `info.title`, `info.version`, `paths` | DISCOVERY.md §A required | all present; `info.version` = `0.2+<sha256 of the fixtures>` so it moves only when a source moves |
| `info.x-guidance`, `info.contact.email` | integration-spec (recommended) | derived guidance (network, payTo, catalog, verify URL, the lid); `nicholas@csoai.org` |
| per paid op: `x-payment-info` + `responses.402` | `inferAuthMode()` — presence of `x-payment-info` alone classifies the op as **paid** | every door: `x-payment-info.protocols = [{"x402":{}}]`, a documented 402 with the challenge shape and a real example |
| per paid op: an input schema (`parameters` / `requestBody`), required params samplable | `buildMinimalQueryParamsFromInputSchema()` samples `const > default > example > enum` for **required** query params, then re-probes | every door's query template is a parameter; literals are `const`, `<a\|b>` is `enum`, placeholders carry the door's own sampled `example` (from its live 402 `extensions.bazaar.info.input.queryParams`) |
| per paid op: an output schema | `L3` warnings | 200 response with the deliverable sentence from `/api/x402` and an object schema |
| per free op: `security: []` | `catalog-auth.ts` | 80 read operations whose only response is 200 |
| runtime 402: `accepts[]` non-empty, amounts in **atomic units**, `extensions.bazaar.schema…input` | DISCOVERY.md §C — "runtime 402 behaviour is authoritative" | the doors already do this; captured under `scripts/fixtures/x402scan/challenges/` (7 of 9) |
| `x-discovery.ownershipProofs[]` | `ownership-proof.ts` | **absent until the owner signs** (step 2) — trust tier stays below `ownership_verified` |
| `x-payment-info.price` (decimal USD) | DISCOVERY.md §A "valid pricing metadata" — in code a *budgeting hint*, absence is an info-level warning | **deliberately absent**: `/api/x402` `invariants.no_public_price` says amounts appear only in a 402 challenge. The only amounts in the document are inside each door's 402 example |
| `/.well-known/x402` | DISCOVERY.md §B "compatibility" | `@agentcash/discovery@1.7.5` **no longer parses it** — it only checks that it exists and emits `LEGACY_WELL_KNOWN_FOUND` (info). Our `/.well-known/x402` 308s to `x402.json`; harmless |

What x402scan will do with our nine doors (from the code, not observed — see UNVERIFIED):

- 8 doors register as paid, invocable resources (GET, sampled params reach the 402 — proven live for
  `evidence-bundle`, `eunomia-data`, `proof`, `art50/marking-evidence`, `feeds/provider-diff`, `receipts/batch`
  on 2026-09-06; `request-attestation` and `rwa/evidence` answer 402 on any well-formed input by their source).
- `/api/free-door` will be marked **skipped — "Missing input schema"**: its 402 declares an input with no
  `queryParams`/`body` schema, and the library reads exactly those. It stays in the document because it is a
  live 402 route the Bazaar indexes; fixing the skip is a one-line change in `functions/api/free-door.ts`
  (declare an empty `queryParams` object schema) that this PR does not make.
- `/api/evidence-bundle`'s `PAYMENT-REQUIRED` header is **17,244 bytes** — over Node's 16 KiB default, so the
  library's own fetch fails and x402scan falls back to its raw probe, registers the door, and attaches a
  `HEADERS_OVERFLOW` warning. Shrinking the challenge's `csoai.preview` block would clear it (not in this PR).
- 36 operations are facades (405/501/503, carrying `x-csoai-lifecycle`). They are neither paid nor `security: []`,
  so x402scan **probes them and records each as failed** ("Expected 402, got 501/503"). Nothing false gets
  listed; the failure count is cosmetic. If it bothers you, the governor can move facades out of `/openapi.json`
  — `functions/api/learn-loop.test.ts` and `truth-facades.test.ts` currently read them there.

## Step 0 — after this PR deploys, confirm the edge serves the new document

```
curl -s https://councilof.ai/openapi.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["openapi"], d["info"]["version"], len(d["x-x402"]["doors"]), "doors")'
python3 scripts/grants/x402scan_precheck.py                       # live document, 0 probes
python3 scripts/grants/x402scan_precheck.py --probe --max-requests 10   # what x402scan's registration does (9 GETs)
```

Expect `3.1.0 0.2+… 9 doors` and "every required condition holds". If the version printed is not the one in
`public/openapi.json` on master, the deploy has not landed (`councilof-deploy-starvation` memory).

## Step 1 — (optional, recommended) ownership proof: one message signature by the payTo key

x402scan's `ownership_verified` tier is earned by a signature **of the origin string** made by the
`payTo` key it sees in our 402s. Ours is `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (`functions/api/_x402_config.ts`,
`ESTATE_PAY_TO`). The check is `viem.recoverMessageAddress({ message: origin, signature })` → must equal `payTo`
— i.e. an **EIP-191 `personal_sign`**, not a typed-data or transaction signature.

1. In the wallet that holds `0x2126…ae31`, sign the exact message `https://councilof.ai` (no trailing slash,
   no newline). MetaMask: *Sign message* / `personal_sign`; a CLI: `cast wallet sign --from <addr> "https://councilof.ai"`.
   Nothing is broadcast; no gas.
2. Put the `0x…` signature in `scripts/fixtures/x402scan/ownership_proofs.json`:
   ```json
   { "origin": "https://councilof.ai", "proofs": ["0x<130 hex chars>"] }
   ```
3. `python3 scripts/build_openapi.py && python3 scripts/build_openapi.py --check` → commit → the governor
   merges → deploy. The document then carries `x-discovery.ownershipProofs`.

The signature is public by design (anyone may verify it); the private key never leaves the wallet.

## Step 2 — register (one wallet sign-in, no spend)

The registry API is SIWX-gated: `POST /api/x402/registry/register-origin` sits behind `router.siwx()`
(`register-origin/route.ts`). SIWX = Sign-In-With-X, a CAIP-122-style wallet-signature login. The browser is
the practical path:

1. Open **https://www.x402scan.com/resources/register** (page title "Add API | x402scan").
2. Connect a wallet and complete the sign-in signature when prompted (a message signature; it proves control
   of an address, it does not pay). Any address works for sign-in; using the payTo wallet is tidiest.
3. Enter the origin `https://councilof.ai` and choose **Add Server** (fan-out from `/openapi.json`).
   *Register This URL Only* is the fallback that registers one endpoint without discovery — use it only if
   fan-out fails (then give it a door URL with its sampled params, e.g.
   `https://councilof.ai/api/eunomia-data?feed=1`).
4. Read the result: `registered` (expect 8), `skipped` (expect 1: free-door — "Missing input schema"),
   `failed` (expect the facades: "Expected 402, got 501/503"), `warnings` (expect `HEADERS_OVERFLOW` on
   evidence-bundle, and `L3_PROTOCOLS_MISSING_ON_PAID`/price hints — info-level, caused by the absent
   `x-payment-info.price`).
5. The server page appears at `https://www.x402scan.com/server/<id>`; origin title/description/favicon are
   scraped from `https://councilof.ai/` (`scrapeOriginData`), with `info.title`/`info.description` as fallback.

Programmatic equivalent, for the record (needs the SIWX session cookie/header the site issues after sign-in;
this repo does not automate it):

```
curl -X POST https://www.x402scan.com/api/x402/registry/register-origin \
  -H 'content-type: application/json' -d '{"origin":"https://councilof.ai"}'   # 401 without SIWX
```

## Keeping it honest afterwards

- `public/openapi.json` is a **producer artefact**: never edit it. `python3 scripts/build_openapi.py` regenerates
  it from the fixtures; `--check` (gated in `docs/operations/PRODUCERS.json` once #1596 lands) fails on drift.
- Refresh the fixtures only deliberately: `python3 scripts/build_openapi.py --fetch` (3 requests) or
  `--fetch --fetch-challenges` (3 + 9 requests, cap `--max-requests`, default 12). Amounts in the 402 examples
  come from the captured challenges; for the two uncaptured doors they come from `functions/api/_skus.ts`
  default bands and say so under `x-csoai.challenge.amount_source`.
- Re-run `scripts/grants/x402scan_precheck.py` after any change to a door, `/.well-known/x402.json` or `/api/x402`.
  The vitest `functions/api/openapi-artifact.test.ts` pins: OpenAPI 3.1, paid ops == well-known doors, no
  numeric money, producer `--check` green, pre-check green.

## UNVERIFIED (what this document could not observe)

- The rendered `/resources/register` form: WebFetch returned only the page title ("Add API | x402scan") — the
  fields and button labels above are from the source (`docs/DISCOVERY.md` "Add Server" / "Register This URL Only").
- Whether `security: []` operations become **Public** catalog rows (what `register-origin.ts` does alongside a paid
  success) or are **skipped** (what the integration-spec page says). Code and page disagree; expect rows.
- x402scan's rate limits / probe concurrency (6 workers) against councilof.ai, and the exact SIWX challenge text.
- The two uncaptured doors' live amounts (`request-attestation`, `rwa/evidence`): source default `20000`
  (0.02 USDC), owner env overrides are not visible offline.
