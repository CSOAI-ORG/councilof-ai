# X402 INDEX-ELIGIBILITY PR — 2026-10-09

**Outcome: shipped as PR #2978, open, not merged.** Every catalogued door now answers `402` with `accepts[]` and `extensions.bazaar` to the directory validators' unpaid `POST {}` probe, `/.well-known/x402` serves a 200 fan-out instead of a 308, and a parity test ratchets both. Live status on `councilof.ai` changes only after merge + GHA `deploy.yml`.

* **PR:** https://github.com/CSOAI-ORG/councilof-ai/pull/2978 — `fix/x402-challenge-order` → `master`, state OPEN / MERGEABLE, 2 commits: `6e0d498ea5b9ed835e44d3436ff1f2ccc8aeb561` (the fix) + `cb389c50c` (capability declaration + re-rendered catalogues).
* **Title:** `fix(x402): 402 challenge before input validation on unpaid POST + 200 /.well-known/x402 fan-out`
* **Not merged, no branch protection touched, no direct wrangler, no master push.**

---

## 1. Before → after, per route

**Probe method (before):** `curl -X POST <url> -H 'content-type: application/json' -d '{}'`, **no payment header**, against live `https://councilof.ai`, 2026-10-09 01:54–03:21 UTC. Route sets computed from the live catalogue, not from the brief's enumeration:

* `GET /api/x402` → `resources[]` = 29 rows (placeholders concretised with valid sample values);
* `GET /.well-known/x402.json` → `resources[]` = 31 concrete probe URLs (the list directory indexes actually GET);
* 27 extra route-shaped URLs found in the catalogue payload (`free_forever`, `free_preview`, `verify_free`, `by_payer`, aliases).

**After column** = asserted by `functions/api/x402-challenge-order.test.ts` calling the same handlers with the same unpaid `POST {}` (unit-verified; **live after merge+deploy**).

### 1a. Catalogued doors that failed (the defect)

| Route probed (POST {}, no payment header) | Before | Cause | After (unit-verified) |
|---|---|---|---|
| `/api/art50/marking-evidence?url=https://councilof.ai/og-image.png` | **400** `uncheckable: JSON body needs url, bytes_b64 or manifest_b64` | body parsed before the challenge | **402** + accepts[] + bazaar |
| `/api/art50/marking-evidence` (bare) | **400** | same | **402** |
| `/api/wrapper/changes?id=usdc.e:arbitrum` | **404** `/api` catch-all JSON | file exported no `onRequestPost` | **402** + accepts[] + bazaar |
| `/api/wrapper/changes` (bare) | **404** | same | **402** |
| `/api/wrapper?id=usdc:ethereum` (off-roster pair) | **404** | roster lookup before the challenge | **402** |
| `/api/wrapper?id=usdc.e:arbitrum%3C` (malformed id) | **400** | id regex before the challenge | **402** |
| `/api/signed-data-feed` (bare) | **200** free preview | bare path served the preview | **402** |
| `/api/feeds/provider-diff` (bare) | **200** free preview | bare path served the preview | **402** |
| `/.well-known/x402` (GET) | **308** → `/.well-known/x402.json`, empty body | deliberate redirect | **200** `{"version":1,"resources":[…31]}` |

### 1b. Catalogued doors already conformant (26 of 29 rows / 29 of 31 probe URLs — unchanged)

| Before | Route |
|---|---|
| 402 | `/api/free-door`, `/api/discover/chainlink`, `/api/discover/ondo`, `/api/discover/ondo-ousg`, `/api/request-attestation?subject=…`, `/api/evidence-bundle?obligation=article-50&bundle=1`, `/api/signed-data-feed?feed=1`, `/api/proof?bundle=1`, `/api/rwa/evidence?asset=RLUSD`, `/api/wrapper?id=usdc.e:arbitrum`, `/api/wrapper/asset/{usdc,usdt,dai}`, `/api/measurement/fresh-capsule`, `/api/feeds/provider-diff?history=1`, `/api/receipts/batch?from=…`, `/api/ras/{mcp-probe,x402-check,supply}`, `/api/pop/{stablecoins,swift,xrpl,x402-bazaar,mcp-registry,a2a,ots-proofs,layer0,corrections,claim-watch}` |
| 402 | bare-path forms: `/api/wrapper`, `/api/discover/chainlink`, `/api/request-attestation`, `/api/evidence-bundle`, `/api/rwa/evidence`, `/api/measurement/fresh-capsule`, `/api/ras/*` (3), `/api/receipts/batch`, `/api/feeds/provider-diff?history=1`, `/api/signed-data-feed?feed=1` |

All 31 of these remain 402 — covered by the parity test, which reads the list from the listing handler rather than a typed copy.

### 1c. Probed but deliberately NOT changed (free surfaces, not doors)

| Route | Before | Why unchanged |
|---|---|---|
| `/api/receipts/verify` | 400 | `verify_free` — the file's own header: “Free forever, like every verification surface in this estate”. A 402 here would contradict a published promise. |
| `/api/verify` | 200 | in `free_forever` |
| `/api/gspc`, `/api/fines`, `/api/commissions`, `/api/revenue`, `/api/x402/index` | 404 (POST) | in `free_forever`; GET surfaces with no POST handler. Advertising them as payable would be false. |
| `/api/eunomia-data` | 308 → `signed-data-feed` | legacy alias; its target's POST now answers 402 |
| `/api/receipts` | 404 | `by_payer` pointer, not a door |
| `/api/witness` | 503 | `QUARANTINED_PRE_RELEASE` (documented) |
| `/api/proof` (bare) | 307 | redirect to the priced `?bundle=1` door, which answers 402 |

The `41/69` figure in `REVENUE_VECTOR_HUNT_2026-10-08.md §A` is these free surfaces **plus** the 1a doors. After this PR: **every route the catalogue sells answers 402 first; every route the catalogue declares free still answers what it declared.**

---

## 2. What changed (7 files, +519/−86)

| File | Change |
|---|---|
| `functions/api/art50/marking-evidence.ts` | New shared `unpaidChallenge()` builder (the old inline challenge, now one source of truth). An unpaid POST whose input cannot be used gets the challenge instead of 400. Exempt and byte-identical: request with a payment header, `?preview=1` (published free preview), `?invoice=gbp` (GBP invoice rail — moves no x402 payment, so it has no challenge to issue). GET untouched. |
| `functions/api/signed-data-feed.ts` | `wantFeed` now also true for an **unpaid** POST → reaches the existing challenge. Paid bare POST still serves the free preview; `?manifest=1` unchanged; GET untouched. |
| `functions/api/feeds/provider-diff.ts` | Same shape for `wantHistory` (+ `hasPaymentHeader` import). |
| `functions/api/wrapper.ts` | Unpaid POST with malformed/off-roster `id` → challenge before the 400/404. GET still 404s an unknown pair with `known_ids`; paid POST unchanged. |
| `functions/api/wrapper/changes.ts` | Adds `onRequestPost`: unpaid → challenge via a new shared `doorChallenge()` (GET refactored onto the same builder, output unchanged); paid → the exact `/api` catch-all 404 it has always answered (same `json()` shape, same `NOT_FOUND_HINT`). |
| `functions/.well-known/x402.ts` | 308 → **200** `{"version":1,"resources":[…]}` derived at request time from the `./x402.json` manifest handler — a second list cannot drift. Absolute-https filter, dedupe, HEAD drops the body. `/.well-known/x402.json` itself is untouched. |
| `functions/api/x402-challenge-order.test.ts` | **New parity test (13 cases)** — see §3. |
| `council-os/capabilities.json` | Declares `POST /api/wrapper/changes` (`payment: x402`, probe `expect_status: [402]`, `safe: false` like every other POST entry). Required: `scripts/capability-registry.mjs` fails the build with *“served by … and declared by no capability entry”*. |
| `client/src/data/capability-nav.json`, `capabilities/registry.json`, `public/llms.txt` | Re-rendered from the registry (`node scripts/capability-render.mjs all`, `node scripts/llms-txt.mjs`) — additive only, 56 insertions / 0 deletions. |

No prices, tiers, processor names or amounts were added to any public surface (OWNER RULING 6 Sep); no new endpoints beyond the POST handlers above; no payments, accounts or credentials used.

---

## 3. Test evidence

Run in a clean checkout of the branch (see §5 for why not the assigned worktree):

| Command | Result |
|---|---|
| `npx vitest run functions council-os` (after the capability commit) | **242 files, 0 failed · 2535 tests, 0 failed** (exit 0) |
| `npx vitest run functions` | **240 files, 0 failed · 2508 tests, 0 failed** (exit 0) |
| `npm run capabilities:check` | registry selftest 8/8 ✓ · **259 entries agree with `functions/`** · 5 rendered artefacts match · openapi selftest 3/3 ✓ · `public/openapi.json` matches (160 paths, 31 x402 doors) |
| `node scripts/llms-txt.mjs --check` | ✓ both `public/llms.txt` and `public/llms-full.txt` match their derivation |
| `npx vitest run functions/api/x402-challenge-order.test.ts functions/api/art50 functions/api/signed-data-feed.delivery.test.ts functions/api/feeds functions/api/wrapper.test.ts functions/api/wrapper functions/api/metered-endpoints.test.ts functions/.well-known functions/api/x402.test.ts functions/api/x402-catalogue-urls.test.ts functions/api/x402-listing.test.ts` | **21 files, 243 tests, 0 failed** |
| `npx tsc -p tsconfig.functions.json --noEmit` | exit 0 |
| `node --test <NODE_TEST_FILES from vitest.config.ts>` | 108/108 pass |
| `bash scripts/pre-push-gates.sh` (and again inside the push hook) | ✓ wallet-credential + facts + brand + canary-leak + price gates clean |
| `npx vitest run client/src scripts` | 274 files: 272 pass; the 2 failures are both 5 s **timeouts** — `scripts/sandbox-wall-guard.test.mjs` (its `public/` scan takes 9–10 s; reproduced with this branch’s changes stashed → pre-existing here) and `client/src/lib/cardVerifyTwin.test.ts` (11/11 pass in isolation). No assertion failures. |

**CI on the PR: every check passes on this head** (`gates` 4m9s, `build`, `CI`, `conflict-guard`, `eval-ci`, `lane-guard`, `crawler-view-production`, `bank-gate-and-delta`, `selftest`, `stamped-bytes`, `wallet-credentials`, `third-party-identifiers`, `card-verifier-parity`, `hold-guard`, Cursor Approval + Security — `gh pr checks 2978 --repo CSOAI-ORG/councilof-ai`). It did not start there: the first `gates` run went red on a real consequence of the change — `capability registry: POST /api/wrapper/changes is served by functions/api/wrapper/changes.ts and declared by no capability entry`. Fixed by declaring the entry and re-rendering the three derived artefacts (commit `cb389c50c`); recorded on the PR as https://github.com/CSOAI-ORG/councilof-ai/pull/2978#issuecomment-6074061787.

Baseline control: with the 6 modified files stashed and the new test removed, the same `functions` run fails the same 4 files (2 missing-directory artefacts of the sparse checkout + `momentum-selfread` + `tool-counts`, both identical before/after). The only delta in the first comparison was `functions/_lib/reach/reach.test.ts` hitting its 5 s timeout under parallel load — it passes in isolation with the changes applied (44/44).

**The parity test** (`functions/api/x402-challenge-order.test.ts`):

1. Reads the door list from `./x402.json`'s handler, imports each door's own module, POSTs `{}` with no payment header → requires `402` + `accepts.length ≥ 1` + `extensions.bazaar`, for **all 31** doors (fails if fewer than 30 are checked, so it cannot pass vacuously).
2. Re-probes the eight defect shapes from §1a, including the off-roster pair, the malformed id, both bare paths and both `wrapper/changes` forms.
3. **No-drift pins:** art50 still 400s validation-first when `x-payment` is present; both feeds still serve the free preview on a paid bare POST; `wrapper/changes` still 404s a paid POST (with the catch-all's exact `error`/`path`); `wrapper` still 404s a paid off-roster pair; bare GET previews still 200; unknown pair on GET still 404 with `known_ids`.
4. **Fan-out:** `/.well-known/x402` is 200 JSON `{version:1}`, ≥30 absolute `https://councilof.ai/` URLs, no `<` placeholders, no `preview=1`, no `free_forever`-only path, a superset of every `/api/x402` resource row, and HEAD keeps headers with an empty body.

---

## 4. What remains (owner actions, staged — nothing executed)

### 4.1 x402scan submission — run AFTER merge + `deploy.yml` completes

```bash
# (1) verify the deploy landed — all of this must be 402 / 200 before you submit:
for u in /api/art50/marking-evidence /api/wrapper/changes /api/wrapper /api/signed-data-feed /api/feeds/provider-diff; do
  printf '%-34s ' "$u"
  curl -s -o /dev/null -w '%{http_code}\n' -X POST "https://councilof.ai$u" \
       -H 'content-type: application/json' -d '{}'
done                                   # expect 402 x5
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     'https://councilof.ai/api/wrapper?id=usdc:ethereum' -H 'content-type: application/json' -d '{}'   # expect 402
curl -s https://councilof.ai/.well-known/x402 | head -c 300   # expect {"version":1,"resources":[…31]}

# (2) run their own documented validator (arbitrary-npm supply-chain risk — owner decision, not run here):
npx -y @agentcash/discovery councilof.ai -v

# (3) submit the origin (no login per their README). Browser form — verified reachable today (HTTP 200):
#        https://www.x402scan.com/resources/register
#    or the API behind that form (cited in REVENUE_VECTOR_HUNT §C2; NOT verified, NOT executed here —
#    the documented surface is the form):
curl -sS -X POST 'https://www.x402scan.com/api/data/registry/register-origin' \
     -H 'content-type: application/json' -d '{"origin":"https://councilof.ai"}'
```

Discovery precedence at x402scan is OpenAPI first, `/.well-known/x402` second — so after this PR the fan-out alone is enough for registration; `openapi.json`-level `x-payment-info` declarations are a possible follow-up, not a blocker.

### 4.2 Also remaining (out of this PR's scope)

* **PayAI Bazaar (6 → 31 doors):** needs no registration — cataloguing runs on `/verify`. It refreshes when any client echoes `extensions.bazaar`; every door already emits it (asserted by the parity test), so listings follow settlements, not this PR.
* **Coinbase CDP Bazaar (0/33,906):** owner-gated (CDP API key + one settled call) per `REVENUE_VECTOR_HUNT` vector #4. This PR removes the response-shape disqualification; the key and the settlement remain the owner's.
* **Re-check PR CI:** `gh pr checks 2978 --repo CSOAI-ORG/councilof-ai` (at time of writing: `card-verifier-parity` and `hold-guard` passing, `gates`/`build`/`stamped-bytes`/`wallet-credentials`/… pending).

---

## 5. Environment note — the assigned worktree is not where the work happened

The task named `/Users/nicholas/clawd/councilof-ai-work`. Timeline observed (all times BST):

1. **03:15–03:50** — work proceeded there: branch `fix/x402-challenge-order` created from up-to-date `origin/master` (`21f63a29c`), live before-probes taken, all 6 source edits and the new test written there, targeted suites green (21 files / 243 tests).
2. **~04:00** — a second lane ran `git checkout` in that same shared worktree (`HEAD@{6}: checkout: moving from fix/x402-challenge-order to fix/agent-json-measurement-data-20261008`) and committed on top (`9b7bbda2c`). My uncommitted edits were discarded by that operation; the branch ref survived with no commits.
3. **~04:18–04:25** — simultaneously, **6,775 tracked files and the whole `node_modules/` disappeared from that working tree** (`git status`: 6775 × ` D`, 1850 untracked intact, not a sparse checkout). Disk was at 98–99 % (≈4 GB free). `functions/api/_head.ts`, `signed-data-feed.ts`, etc. were simply gone, which is what turned every test run red with `Cannot find module './_head'`.
4. Rather than check out my branch over another lane's in-flight work (my brief forbids disturbing other lanes), the work was **re-applied from scratch in a clean local shared-object clone**: `/Users/nicholas/.hermes/cache/scratch/x402-lane` — `git clone --shared` of this repo, branch `fix/x402-challenge-order`, sparse cone (`functions public scripts client shared fixtures .github mcp docs data evidence measurement … plugins fleet distribution spaces`), `origin` re-pointed at `git@github.com:CSOAI-ORG/councilof-ai.git`. Every test result in §3 comes from there. No object data was copied (alternates → no extra disk cost beyond the ~760 MB checkout).

**Needs owner attention:** `/Users/nicholas/clawd/councilof-ai-work` is currently on `fix/agent-json-measurement-data-20261008` with ~6.8 k tracked files missing from the working tree and an empty `node_modules/`. I did not restore, delete or commit anything there. `git -C ~/clawd/councilof-ai-work status` will show it; a `git -C ~/clawd/councilof-ai-work restore .` (or `git checkout -- .`) by whoever owns that lane, plus `npm ci`, would bring it back. The repo's disk is also at 98–99 %.

---

## 6. Constraints honoured

* No payments, no accounts, no credentials, no keys; probes were read-only `GET`/`POST {}` with no payment header.
* No prices/tiers/processor names on public surfaces — amounts still appear only inside `accepts[]`.
* No new endpoints beyond the POST handlers and the `/.well-known/x402` payload this task asked for.
* PR only: pushed branch `fix/x402-challenge-order`, opened #2978 against `master`, **never merged**, never touched branch protection, never pushed master, never ran wrangler.
* Staged files by name (7 files), never `git add -A`; no other commits made under `~/clawd`.
