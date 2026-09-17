# Checks that cannot fail

_2026-09-17T00:00:00Z · `CSOAI-ORG/councilof-ai` · branch `fix-cards-truncation-17sep` · DERIVED from `public/interop/checks-that-cannot-fail-2026-09-17.json`. Regenerate both together; never hand-edit one._

On 17 Sep 2026 six defects were traced to a single root cause: a check that reports PASS because it is structurally incapable of reporting anything else. This is the estate-wide sweep for that defect class. It is an inventory of holes in our own assurance, published because a guard nobody has shown to go red is a guard nobody should read as green.

> This document measures our own checks, not any model, product or third party. A finding here is a statement about a predicate in this repository — it is not a claim that any published number is wrong. Nothing here is a certification, and nothing here was fixed by this pass: every entry is a report.

## The defect class

A check whose only possible outcome is PASS. Not a check that is wrong — a check that has no failing input.

Six instances were traced to this cause on 17 Sep 2026, and they are why this sweep exists:

- scripts/test_signer_authority.py — asserted a literal against itself and never called the production signer
- a root-churn check that looked for leaves/cards/entries, found none, compared empty sets, and reported '13 of 13 append-only' (the real key is card_sha256)
- a census walker looking for next_cursor where the field is nextCursor — one page, labelled ENUMERATED_COMPLETE, a 327-fold undercount reported as certainty
- a harness-liveness check that counted a harness alive if its LOG FILE EXISTED; all six logs were in fact missing
- scripts/brand-gate.mjs — a correct gate that runs only inside the deploy pipeline; publishing to Hugging Face took the gate with it
- a verifier that reported ('VALID', <attacker-supplied DID>) because it resolved keys by fragment suffix and echoed the card's own unsigned field

The shapes hunted here:

- an assertion comparing a literal to itself, or to a value assigned in the same function
- a .get()/?. on a key the real data never carries — None == None, or `?? 0` turning absence into a measured zero
- an existence check standing in for a liveness, freshness or content check
- try/except (or .catch) that swallows the failure and yields a pass value
- a loop that breaks on the first page, first item, or a cap, and then reports completeness
- a predicate that is always truthy — a non-empty literal, `X || always()`, a regex that always matches
- a fixture that mocks the upstream into a shape the real endpoint never returns
- a gate that exists but is not wired into the path actually used
- a check that exits 0 when it cannot reach its own inputs

## Method

Read the assertion and ask: what input would make this fail? If no such input can be constructed, it is a finding. Where possible the input that SHOULD fail was constructed and run, alongside a control proving the check can go red on some other input. Findings marked ARGUED carry a precise argument from the code and its producer; findings marked DEMONSTRATED carry a transcript. Scope: scripts/, functions/, harness/, tools/, mcp/, e2e/, .github/workflows/ and every *test* file in this worktree.

**DEMONSTRATED** means the input that should fail was constructed and run, and a control shows the check going red on some other input. **ARGUED** means a precise argument from the code and its producer, with no input constructed. A claim that a check is vacuous is worth little; a transcript is worth a lot — which is why the two are labelled separately and never totalled as one number.

## Totals

| | |
|---|---|
| findings | **43** |
| demonstrated | **9** |
| argued | **34** |

By tier:

| tier | findings |
|---|---|
| publication | 11 |
| signing | 8 |
| testing | 7 |
| counts | 5 |
| payment | 4 |
| completeness | 3 |
| merge-gate | 2 |
| build | 1 |
| doctrine | 1 |
| routing | 1 |

### Soft-fail census across `.github/workflows` (91 files)

- `continue-on-error: true` — **18**
- `|| true` / `|| echo` / `|| :` — **52**
- total — **70**, of which **16** sit on steps whose name contains gate/guard/verify/check/validate/test/audit

Most of the 70 are cosmetic (gh pr merge --auto || echo, ls -la || true). The findings above are mostly NOT || true — they are gates that compute a verdict and then never act on it.

## Ranked findings

By consequence, not by count. A vacuous gate on signing or publication outranks a vacuous unit test.

| # | id | finding | file:line | status |
|---|---|---|---|---|
| 1 | CF-01 | Every content gate is bound to dist/client; all 20 outward-publishing workflows produce no dist/client | `scripts/brand-gate.mjs` | argued |
| 2 | CF-02 | The one outward brand check that does exist is three words wide | `scripts/spray/gspc-spray.py`:84 | argued |
| 3 | CF-03 | The estate's whole-chain signature verifier exits 0 under CI when it cannot reach its inputs | `scripts/verify-estate.mjs`:139 | **DEMO** |
| 4 | CF-04 | Two card-landing workflows compute an Ed25519 verdict per card and never act on it | `.github/workflows/hub-queue-land.yml`:111 | argued |
| 5 | CF-05 | The four content gates and the master-push refusal do not run on this machine | `scripts/pre-push-gates.sh` | **DEMO** |
| 6 | CF-06 | The PR scope regex exempts the workflow file that contains the gates | `.github/workflows/pr-gates.yml`:97 | **DEMO** |
| 7 | CF-07 | The signed-artifact deploy gate exits 0 when the whole signed tree is absent | `scripts/signed-json-guard.mjs`:275 | **DEMO** |
| 8 | CF-08 | The only assertion on where money is sent accepts any string starting 0x | `functions/.well-known/x402.json.test.ts`:213 | argued |
| 9 | CF-09 | The network assertion passes the one value that matters | `functions/.well-known/x402.json.test.ts`:212 | argued |
| 10 | CF-10 | A test titled 'routes payment to the estate address' accepts every well-formed address | `functions/api/free-door.test.ts`:55 | argued |
| 11 | CF-11 | Two published artifacts are pinned to each other and to nothing else | `functions/api/openapi-artifact.test.ts`:88 | argued |
| 12 | CF-12 | 'enumeration_complete' is true for every value its producer can actually write | `scripts/census/build-agent-interop-census.py`:221 | **DEMO** |
| 13 | CF-13 | Six KV listings stop at 5000 keys and still report MEASURED | `functions/api/revenue.ts`:130 | argued |
| 14 | CF-14 | A test named 'summary totals reconcile' asserts only that the reconciliation flag is a boolean | `functions/api/coverage-truth.test.ts`:27 | argued |
| 15 | CF-15 | An absent census field is published as a measured zero | `functions/api/compute.ts`:85 | argued |
| 16 | CF-16 | The publish gate's generic branch supports any claim that is a substring of the serialised body — including its key names | `scripts/claimguard-publish-gate.py`:82 | **DEMO** |
| 17 | CF-17 | The append-only root guard exits 0 unconditionally, and runs nowhere | `scripts/root-consistency-guard.mjs`:107 | argued |
| 18 | CF-18 | DID keys are resolved by fragment alone; the method and host are discarded before lookup | `scripts/verify-estate.mjs`:144 | **DEMO** |
| 19 | CF-19 | Deleting the file the guard is named for turns the guard green | `scripts/one-door-guard.mjs`:74 | **DEMO** |
| 20 | CF-20 | A workflow named post-deploy-verify cannot report a failure | `.github/workflows/post-deploy-verify.yml`:54 | argued |
| 21 | CF-21 | The live-count gate silently degrades to comparing the pages against the number they were written from | `scripts/facts-gate.mjs`:493 | argued |
| 22 | CF-22 | A never-spent guard greps for two strings its producer cannot emit, in a hardcoded dated directory | `.github/workflows/x402-door-conformance.yml`:38 | argued |
| 23 | CF-23 | Four `if:` conditions in one workflow can never be true; the weekly cron does nothing and reports success | `.github/workflows/lightning-train-s3-sync.yml`:35 | argued |
| 24 | CF-24 | Three live checks are gated on environment variables that no workflow sets | `scripts/outward-claims-guard.mjs`:688 | argued |
| 25 | CF-25 | A guard against unbacked axis-mapping claims accepts an empty array as the mapping | `scripts/well-known-claim-guard.mjs`:36 | argued |
| 26 | CF-26 | Three Playwright assertions have their rejection swallowed and are incapable of failing | `e2e/tests/routes.spec.ts`:275 | argued |
| 27 | CF-27 | A Playwright suite generating one test per route, with zero assertions | `e2e/tests/surface-sweep.spec.ts`:67 | argued |
| 28 | CF-28 | Assertions behind an isVisible().catch(() => false) gate vanish when the element is absent | `e2e/tests/production-surfaces.spec.ts`:211 | argued |
| 29 | CF-29 | Nine skipped e2e tests, two of which are the only assertions that the homepage claims no partnership or accreditation | `e2e/tests/production-surfaces.spec.ts`:67 | argued |
| 30 | CF-30 | The gate's key fixture is structurally unreachable in CI, and its corpus check is a sample of one | `.github/workflows/inspect-adoption-gate.yml`:35 | argued |
| 31 | CF-31 | The sweep is soft-failed, its exit code is never captured, and its one gating `if:` is a tautology | `.github/workflows/claimguard-sweep.yml`:67 | argued |
| 32 | CF-32 | The evidence-contract gate's push trigger names a branch that is not the production branch | `.github/workflows/evidence-smoke.yml`:10 | argued |
| 33 | CF-33 | A required-looking check named CI compiles nothing and asserts its own pass first | `.github/workflows/ci.yml`:14 | argued |
| 34 | CF-34 | A 40-minute poll that exits 0 when the CLI fails on every attempt | `.github/workflows/kaggle-community-cells.yml`:113 | argued |
| 35 | CF-35 | The only signed-artifact gate on the deploy path never performs an Ed25519 verification | `scripts/signed-json-guard.mjs`:110 | argued |
| 36 | CF-36 | An empty or comments-only manifest verifies the wheelhouse | `scripts/ceremony/verify_offline_bundle.py`:20 | **DEMO** |
| 37 | CF-37 | Census dedupe returns exit 0 when it cannot fetch its own input | `scripts/census/dedupe-agent-interop.py`:117 | argued |
| 38 | CF-38 | Malformed rows are silently dropped, then a discrimination rate is computed over what survived | `harness/gspc-top100/check_bank_discriminates.py`:83 | argued |
| 39 | CF-39 | The no-public-prices doctrine gate reads only the top level of public/ | `functions/api/_no_typed_prices.test.ts`:21 | argued |
| 40 | CF-40 | Eight of twenty-four assertions in the observability suite are shape-only | `functions/api/observability.test.ts`:30 | argued |
| 41 | CF-41 | A self-disabling escape hatch in the tools-match-door test, with a stale justification | `mcp/gspc-server/tools-match-door.test.ts`:65 | argued |
| 42 | CF-42 | Six guards and verifiers that no workflow, package.json script or shell script invokes | `scripts/claims-register-lint.mjs`:3 | argued |
| 43 | CF-43 | The pre-push hook silently no-ops if the gate script loses its executable bit | `.githooks/pre-push`:40 | argued |

---

### 1. CF-01 — Every content gate is bound to dist/client; all 20 outward-publishing workflows produce no dist/client

`scripts/brand-gate.mjs` · tier `publication` · ARGUED

Also at: `scripts/facts-gate.mjs`, `scripts/price-gate.mjs`, `scripts/content-promise-gate.mjs`, `scripts/signed-json-guard.mjs`, `scripts/link-gate.mjs`

**The assertion**

```
Gates are invoked only in .github/workflows/deploy.yml and pr-gates.yml, and only against dist/client.
```

**Why it cannot fail** — The six content gates take a filesystem path that the outward-publishing workflows never build. There is no input any of them can see on an HF / Kaggle / Zenodo / PyPI / npm / MCP-Registry publish, so on those 20 paths the gates have no possible verdict at all — not a soft pass, an absence.

**What SHOULD fail it** — An HF dataset README, Kaggle kernel description, Zenodo deposit or npm description containing a banned public string (an internal codename, a $ price, a certification overclaim). brand-gate blocks every one of these on the website; each publishes silently on the other 20 paths.

**Evidence** — Enumerated all workflows that push bytes to a third party: gspc-spray.yml (HF, Kaggle, Zenodo DOI, PyPI, CSOAI-ORG/gspc-board), hf-gspc-surface-sync.yml, hub-queue-flip.yml, hf-fin-shells.yml, hf-inference-mill.yml, hf-jobs-mill-launch.yml, hf-card-link-repair.yml, hf-coverage-probe.yml, wrapper-dataset-refresh.yml, eat-overnight.yml, agent-interop-census.yml, census-delta.yml, runpod-intake.yml, kaggle-community-cells.yml, npm-gspc-release.yml, mcp-registry-publish.yml, csoai-site-deploy.yml, public-root.yml, card-root.yml. Content gates before publish: zero, in all of them.

**Precedent** — This is instance 5 of 17 Sep (brand-gate bypassed by the HF path), generalised: it is not one hole, it is 20.

---

### 2. CF-02 — The one outward brand check that does exist is three words wide

`scripts/spray/gspc-spray.py:84` · tier `publication` · ARGUED

**The assertion**

```
BANNED = re.compile(r"\b(certified|bft|sovereign)\b", re.IGNORECASE)
```

**Why it cannot fail** — Not vacuous, but ~15 of brand-gate.mjs's rules have no counterpart here (internal_codenames, defoneos_codename, cert_overclaim, pricing_leak, internal_strategy_codename, framework_overclaim, gpai_code_signature). A string that is forbidden on the website passes this regex and reaches five public surfaces including a minted Zenodo DOI, which cannot be retracted.

**What SHOULD fail it** — An internal codename or a public $/card price in a sprayed artifact.

---

### 3. CF-03 — The estate's whole-chain signature verifier exits 0 under CI when it cannot reach its inputs

`scripts/verify-estate.mjs:139` · tier `signing` · **DEMONSTRATED**

Also at: `scripts/verify-estate.mjs:183`

Wired into: `.github/workflows/pr-gates.yml:258 (the only stranger-verification PR gate)`, `.github/workflows/verify-estate-full.yml:26`

**The assertion**

```
process.exit(process.env.CI ? 0 : 2)  — on an unreachable DID document (:139) and on an unreachable card_index.json (:183)
```

**Why it cannot fail** — GitHub Actions sets CI=true. Any failure to fetch https://csoai.org/.well-known/did.json or https://councilof.ai/signed/card_index.json ends the process at exit 0 having verified nothing — including the --did-drift comparison. The workflow cannot distinguish 'every card verified' from 'nothing was checked'. A 522 on the csoai.org apex is a documented recurring condition in this estate, so the condition that makes this gate vacuous is not hypothetical.

**What SHOULD fail it** — DNS failure, a 5xx, or a timeout on either host while a PR carries a broken signature.

**Demonstration**

```
$ CSOAI_DID=https://did-host-that-does-not-resolve.invalid/... node scripts/verify-estate.mjs --limit 2
  -> CANNOT-RUN ... Nothing was checked.   exit 2   (control: red outside CI)
$ CI=true CSOAI_DID=<same> node scripts/verify-estate.mjs --limit 2 --did-drift public/.well-known/did.json
  -> CANNOT-RUN ... Nothing was checked.   exit 0   (the PR gate step goes GREEN)
```

---

### 4. CF-04 — Two card-landing workflows compute an Ed25519 verdict per card and never act on it

`.github/workflows/hub-queue-land.yml:111` · tier `signing` · ARGUED

Also at: `.github/workflows/mill-jobs-land.yml:124`

**The assertion**

```
The embedded python builds rows of (name, verdict, why) with verdict in {VALID, INVALID, UNCHECKABLE, UNSIGNED}, prints a markdown table, and posts it as a PR comment. There is no sys.exit on a bad verdict.
```

**Why it cannot fail** — grep -c 'sys.exit': hub-queue-land.yml = 0, mill-jobs-land.yml = 0, runpod-land.yml = 1. runpod-land.yml:141 does the identical work and does sys.exit(2) when bad. A card whose signature does not verify under the live DID produces a green step and a comment saying {'INVALID': 1}. Compounding: (a) the signer-wait loops (hub-queue-land.yml:116-124, mill-jobs-land.yml:129-134) swallow every `gh run list` failure with `|| true` and never assert conclusion == success, so they 'verify' even when the signer job failed outright; (b) `git checkout FETCH_HEAD -- public/interop/mill-cards-signed || true` means a failed checkout turns every row into UNSIGNED — still green.

**What SHOULD fail it** — One landed card with a flipped signature byte. runpod-land blocks it; these two comment and merge.

**Evidence** — Verified directly: sys.exit count 0 / 0 / 1 across the three land workflows.

**Fix** — Copy runpod-land.yml:105 (assert signer conclusion) and :141-143 (sys.exit(2) on any non-VALID).

---

### 5. CF-05 — The four content gates and the master-push refusal do not run on this machine

`scripts/pre-push-gates.sh` · tier `publication` · **DEMONSTRATED**

Also at: `.githooks/pre-push`

**The assertion**

```
The repo ships .githooks/pre-push (executable) which runs scripts/pre-push-gates.sh.
```

**Why it cannot fail** — core.hooksPath is set in ~/.gitconfig to /Users/nicholas/.config/git/hooks, NOT to .githooks. That directory contains post-checkout, post-commit, post-merge and pre-push.bak-20260823 — no pre-push. core.hooksPath REPLACES the hooks directory outright, so .githooks/pre-push is never resolved. wallet-credential-gate, facts-gate, brand-gate and price-gate — and the refusal of direct pushes to master — are all inert. The hook's own header documents this exact failure happening once before on 2026-09-05 (~40 direct pushes to master in 90 minutes, four gates red in sequence); the remedy has since been undone.

**What SHOULD fail it** — A push carrying a banned public string, a stale axis count, or a direct push to master.

**Demonstration**

```
$ git config --show-origin --get core.hooksPath
  file:/Users/nicholas/.gitconfig   /Users/nicholas/.config/git/hooks
$ ls /Users/nicholas/.config/git/hooks
  post-checkout  post-commit  post-merge  pre-push.bak-20260823      <- no pre-push
$ test -x "$(git rev-parse --git-path hooks/pre-push)"  -> false
```

**Corroboration**

```
Run on this worktree at the time of writing, both gates the inert hook would have run are ALREADY RED on committed bytes, and nobody was told:
  node scripts/brand-gate.mjs public -> exit 1, internal codename in a committed public JSON (public/interop/exclusion-ratio-audit-2026-09-17.json, landed today in b643cf65)
  node scripts/facts-gate.mjs public  -> exit 1, 16 contradictions across 8 committed interop files
Both take about one second. Both would have blocked the push that introduced them.
```

_Machine configuration, not a repo defect. The repo's half is correct; the install is not in effect._

---

### 6. CF-06 — The PR scope regex exempts the workflow file that contains the gates

`.github/workflows/pr-gates.yml:97` · tier `merge-gate` · **DEMONSTRATED**

**The assertion**

```
gated=$(printf '%s\n' "$changed" | grep -E '^(client/|public/|functions/|scripts/|harness/x402-census/|docs/operations/PRODUCERS\.json$|package\.json$|package-lock\.json$|wrangler\.jsonc$|\.github/workflows/pr-gates\.yml$)' || true)
```

**Why it cannot fail** — .github/workflows/deploy.yml is not in the list. A PR that deletes the brand-gate, facts-gate, price-gate and signed-json-guard steps from deploy.yml, and touches nothing else, sets gated=false; the whole suite is skipped and the required `gates` context reports green. Only pr-gates.yml protects itself.

**What SHOULD fail it** — Any PR modifying .github/workflows/** .

**Demonstration**

```
$ printf '.github/workflows/deploy.yml\n' | grep -E '<the regex above>'
  -> no match: gated=false, 'no gated path changed - the suite below is skipped and gates passes by scope.'
```

---

### 7. CF-07 — The signed-artifact deploy gate exits 0 when the whole signed tree is absent

`scripts/signed-json-guard.mjs:275` · tier `signing` · **DEMONSTRATED**

Also at: `scripts/signed-json-guard.mjs:147`

Wired into: `.github/workflows/deploy.yml:215`, `.github/workflows/pr-gates.yml:192`, `.github/workflows/honest-board-floor.yml:49`, `scripts/deploy-site.sh`

**The assertion**

```
auditSignedTree :147  catch { return { files: [], failures: [], missingDir: true }; }
main            :275  if (missingDir) { console.log("... nothing to guard"); process.exit(0); }
```

**Why it cannot fail** — The absence of the artifact is treated as the absence of a problem. A build that stops copying public/signed into dist/client (client/vite.config.ts publicDir/outDir), or a wrong argv[2], makes the gate print a friendly line and exit 0 on an unguarded tree. The file's own header states the estate rule it breaks: 'a component must be STRUCTURALLY UNABLE to report success on a path it did not complete.' Its 15-case --selftest has a control for 'the whole cards/ directory is missing' and none for 'the whole signed/ directory is missing', so this exact path has never been shown to go red.

**What SHOULD fail it** — rm -rf dist/client/signed, then run the guard.

**Demonstration**

```
$ node scripts/signed-json-guard.mjs <tmp>/dist/client            # signed/ absent
  signed-json-guard: no <tmp>/dist/client/signed directory — nothing to guard     exit 0
$ mkdir signed && echo '{"kind":"card_index","n_cards":335,"cards":[]}' > signed/card_index.json
$ node scripts/signed-json-guard.mjs <tmp>/dist/client            # control
  DEPLOY BLOCKED: header lie / below size floor / no signed/cards/ directory        exit 1
```

**Secondary** — line 158: `if (f !== "card_index.json") continue;` — every other signed/*.json gets only a stub-marker scan and a JSON parse, never a signature binding.

---

### 8. CF-08 — The only assertion on where money is sent accepts any string starting 0x

`functions/.well-known/x402.json.test.ts:213` · tier `payment` · ARGUED

**The assertion**

```
expect(a.payTo).toMatch(/^0x/i);
```

**Why it cannot fail** — This is the sole payTo coverage of the x402 DISCOVERY DOCUMENT — the artifact x402 clients and Bazaar indexers read to decide where to send USDC. functions/.well-known/x402.json.ts:26,44 sets payTo: resolvePayTo(env), and functions/api/_x402_config.ts:42-45 gives X402_PAY_TO strict priority over ESTATE_PAY_TO. '0xdeadbeef', a two-character stub, or a stranger's wallet all pass. ESTATE_PAY_TO appears in ZERO files under functions/.well-known/ — nothing pins the published address to the estate's.

**What SHOULD fail it** — env.X402_PAY_TO set to any address other than ESTATE_PAY_TO.

**Evidence** — grep -c ESTATE_PAY_TO over functions/.well-known/ and functions/api/openapi-artifact.test.ts = 0.

**Fix** — expect(a.payTo).toBe(ESTATE_PAY_TO) — the shape functions/api/wrapper.test.ts:87 and witness.test.ts:168 already use.

---

### 9. CF-09 — The network assertion passes the one value that matters

`functions/.well-known/x402.json.test.ts:212` · tier `payment` · ARGUED

**The assertion**

```
expect(a.network).toMatch(/base/i);
```

**Why it cannot fail** — "base-sepolia" matches /base/i. A testnet network published in the mainnet discovery document passes.

**What SHOULD fail it** — network: "base-sepolia" or "eip155:84532".

---

### 10. CF-10 — A test titled 'routes payment to the estate address' accepts every well-formed address

`functions/api/free-door.test.ts:55` · tier `payment` · ARGUED

**The assertion**

```
it("routes payment to the estate address, like every other door", ...) → expect(b.accepts[0].payTo).toMatch(/^0x[0-9a-fA-F]{40}$/);
```

**Why it cannot fail** — The title names one address; the regex admits 2^160 of them.

**What SHOULD fail it** — Any 40-hex address other than the estate's.

**Secondary** — The same file at :205 hardcodes a DIFFERENT address (0x2126864…) than ESTATE_PAY_TO.

---

### 11. CF-11 — Two published artifacts are pinned to each other and to nothing else

`functions/api/openapi-artifact.test.ts:88` · tier `payment` · ARGUED

**The assertion**

```
expect(a.payTo).toBe(wellKnown.payTo);
```

**Why it cannot fail** — public/openapi.json is what x402scan crawls. It is pinned only to the .well-known fixture, which is itself pinned only to /^0x/i (CF-08). Two artifacts agreeing with each other is not an anchor — they drift together and the test stays green.

**What SHOULD fail it** — Both artifacts moving to the same wrong address.

---

### 12. CF-12 — 'enumeration_complete' is true for every value its producer can actually write

`scripts/census/build-agent-interop-census.py:221` · tier `completeness` · **DEMONSTRATED**

Also at: `scripts/census/collect-mcp-registry.py:45`, `scripts/census/collect-mcp-registry.py:47`

**The assertion**

```
"mcp_registry_enumeration_complete": mcp["stop_reason"] != "in-progress"
```

**Why it cannot fail** — 'in-progress' is written by collect-mcp-registry.py:45 ONLY into the every-50-pages checkpoint, and the terminal write at :47 always overwrites it when the loop exits. The four terminal values the producer can emit are 'fetch failed after retries' (:12), 'cursor exhausted — clean end of registry' (:36), 'CURSOR REPEATED … server-side pagination defect' (:39) and 'page N returned 0 new rows' (:42). All four satisfy != 'in-progress'. A total network failure yielding zero rows is published as enumeration_complete: true. The only value that makes the predicate false is one the consumer can never read.

**What SHOULD fail it** — A run that dies mid-registry — which is precisely the case the field exists to report.

**Demonstration**

```
For each terminal stop_reason the producer can write:
  'fetch failed after retries'                 -> enumeration_complete = True
  'cursor exhausted — clean end of registry'   -> enumeration_complete = True
  'CURSOR REPEATED at page 7 …defect'          -> enumeration_complete = True
  'page 3 returned 0 new rows'                 -> enumeration_complete = True
```

**Precedent** — Family of instance 3 of 17 Sep (nextCursor). The cursor bug there is fixed; this is the completeness LABEL, still vacuous.

---

### 13. CF-13 — Six KV listings stop at 5000 keys and still report MEASURED

`functions/api/revenue.ts:130` · tier `counts` · ARGUED

Also at: `functions/api/yield.ts:151`, `functions/api/receipt-status.ts:47`, `functions/api/_x402_receipt.ts:176`, `functions/api/_x402_receipt.ts:200`, `functions/feeds/receipts.xml.ts:94`

**The assertion**

```
} while (cursor && keys.length < 5000);   — then functions/api/revenue.ts:197 returns status: "MEASURED"
```

**Why it cannot fail** — No truncation flag is emitted anywhere in the six files. /api/revenue's one_number.all_time is the estate's headline revenue figure; past the cap it under-reports while labelling itself MEASURED. The reason no test catches it: every mock hardcodes completion — functions/api/revenue.test.ts:15-19 and revenue-zero-value.test.ts:19 both return { keys: [...], list_complete: true, cursor: "" }, a shape the real KV binding does not return past a page.

**What SHOULD fail it** — A mock returning list_complete:false plus a cursor, over >5000 settled:tx:* keys.

**Precedent** — Instance-7 family (a fixture that invents the upstream) crossed with 'partial read totalled as population'.

---

### 14. CF-14 — A test named 'summary totals reconcile' asserts only that the reconciliation flag is a boolean

`functions/api/coverage-truth.test.ts:27` · tier `counts` · ARGUED

**The assertion**

```
it("summary totals reconcile signed card IDs to root card_count", ...) → expect(typeof body.summary.reconciliation_ok).toBe("boolean");
```

**Why it cannot fail** — false is a boolean. The one check that would catch a bad card reconciliation admits the failing value.

**What SHOULD fail it** — reconciliation_ok: false.

**Secondary** — Lines 32-38 are the same shape: indexed_total, runnable_total, measured_total and signed_total are each asserted only as typeof === 'number', so -1, 0 and NaN all pass, in a file named coverage-truth. This sits directly on the three-corpora problem (1072 / 152 / 335) the estate keeps having to relitigate.

---

### 15. CF-15 — An absent census field is published as a measured zero

`functions/api/compute.ts:85` · tier `counts` · ARGUED

**The assertion**

```
n_measured: (hubCensus as { n_measured?: number }).n_measured ?? 0,
```

**Why it cannot fail** — Every sibling on lines 82-92 uses ?? null or ?? "UNMEASURED" or ?? "DISCOVERED". This one coerces absence to 0 — a number a reader will take as a measurement. There is no functions/api/compute.test.ts. It currently coincides (the artifact carries n_measured: 0), which is exactly what hides it.

**What SHOULD fail it** — Regenerating public/signed/hub-census-baseline.json without the field — the endpoint then publishes '0 measured' rather than 'unread'.

_The estate has a test named functions/api/dashboard/absent-is-not-zero.test.ts. This is the same doctrine, unenforced one endpoint over._

---

### 16. CF-16 — The publish gate's generic branch supports any claim that is a substring of the serialised body — including its key names

`scripts/claimguard-publish-gate.py:82` · tier `publication` · **DEMONSTRATED**

**The assertion**

```
if cl in str(body).lower(): return True, "claim text appears in the signed body"
```

**Why it cannot fail** — str(body) is the Python repr of the whole dict, so it contains every KEY NAME, every punctuation character and the literal 'True'/'False'. Any claim short enough, or named after a field, is 'supported by the signed artifact'. The numeric branch above it ('N measured of M') is sound; this fallback is not.

**What SHOULD fail it** — A claim the artifact does not make. Demonstrated below that a single letter passes.

**Demonstration**

```
$ python3 scripts/claimguard-publish-gate.py --artifact public/signals/gov.signed.json --claim 'e'
  GATE: PASS — claim text appears in the signed body          exit 0
$ ... --claim 'not_a_certification'   (a KEY NAME, not a value)
  GATE: PASS — claim text appears in the signed body          exit 0
$ ... --claim 'status'                -> PASS  exit 0
control:
$ ... --claim '13 measured of 14'     -> FAIL  exit 1   (the numeric branch does work)
$ ... --claim 'CSOAI certifies this model as safe' -> FAIL exit 1
```

**Secondary** — Line 94 prints 'GATE: artifact verified (content_id OK)' unconditionally, but the style-A branch (:27-34, string signature) never checks content_id. And: the gate is wired into NOTHING — no workflow, no package.json script, no shell script references it.

---

### 17. CF-17 — The append-only root guard exits 0 unconditionally, and runs nowhere

`scripts/root-consistency-guard.mjs:107` · tier `signing` · ARGUED

**The assertion**

```
if (!existsSync(BASELINE)) { console.log("  no baseline — run --update-baseline …"); process.exit(0); }
```

**Why it cannot fail** — Three compounding facts: (a) scripts/root-consistency-baseline.json does not exist in the repo; (b) --update-baseline is not implemented — the string occurs exactly once, in this message; (c) the script is referenced by no workflow, no package.json script and no scripts/*.sh. So the default path is an unconditional exit 0 that is never reached because nothing calls it.

**What SHOULD fail it** — droppedEver rising — which its own header says has happened 14 times ('421 distinct cards… 281 absent from the current one').

_Everything above line 107 — --strict, analyseHistory, the selftest at 61-84 — is sound. Only the default path is dead._

---

### 18. CF-18 — DID keys are resolved by fragment alone; the method and host are discarded before lookup

`scripts/verify-estate.mjs:144` · tier `signing` · **DEMONSTRATED**

Also at: `scripts/verify-estate.mjs:236`, `scripts/verify-estate.mjs:271`, `scripts/verify-estate.mjs:163`

**The assertion**

```
keys = Object.fromEntries(did.verificationMethod.filter(...).map(v => [v.id.split("#").pop(), ...]))
rootKid = String(root.did_intended || "").split("#").pop();
const kid = String(sig.kid || "").split("#").pop();
```

**Why it cannot fail** — The check 'does this artifact name OUR did:web:csoai.org?' is never performed, so it cannot fail. Any did_intended or sig.kid whose fragment is one of our five published fragments resolves to our key and is reported VALID against #<fragment>. This is not a forgery path — the signature must still verify under the real key — but the issuer line the verifier prints is not a fact it checked.

**What SHOULD fail it** — did_intended: "did:web:evil.example#board-attestation-1" on an otherwise correctly signed root.

**Demonstration**

```
Replaying verify-estate.mjs:143-146 and :236 against the real public/.well-known/did.json:
  key map keyed by: site-release-1, estate-chain-1, board-attestation-1, card-attestation-1, gspc-board-22axis-2026
  "did:web:csoai.org#board-attestation-1"            -> RESOLVES, prints VALID against #board-attestation-1
  "did:web:evil.example#board-attestation-1"         -> RESOLVES, prints VALID against #board-attestation-1
  "did:key:z6MkTOTALLY-DIFFERENT#board-attestation-1"-> RESOLVES, prints VALID against #board-attestation-1
  "literally-not-a-did#board-attestation-1"          -> RESOLVES, prints VALID against #board-attestation-1
  "#board-attestation-1"                             -> RESOLVES, prints VALID against #board-attestation-1
```

**Precedent** — Exactly instance 6 of 17 Sep. harness/gspc-top100/verify_card.py has been fixed; verify-estate.mjs has the same shape and has not.

---

### 19. CF-19 — Deleting the file the guard is named for turns the guard green

`scripts/one-door-guard.mjs:74` · tier `routing` · **DEMONSTRATED**

Also at: `scripts/one-door-guard.mjs:38`, `scripts/one-door-guard.mjs:63`

Wired into: `.github/workflows/deploy.yml:33`, `.github/workflows/one-door-guard.yml`, `scripts/deploy-site.sh`

**The assertion**

```
const src = read(rel).content;
if (!src) continue;   // read() returns {content:"", missing:true} for a missing file
```

**Why it cannot fail** — The `missing` flag is discarded at all three sites (only the branch at :58-60 uses it). A missing or empty public/_redirects removes eight assertions — /ag-ui, /agui, /sov-os, /chat, /enterprise — and the guard prints the same headline sentence with no mention of the checks that did not run. It runs first in deploy.yml:33.

**What SHOULD fail it** — public/_redirects going missing, or losing its canonical 308s.

**Demonstration**

```
control (real files)            : 11 checks, all ✓, PASS, exit 0
hostile _redirects (/chat -> an external host):
                                  4 ✗, 'ONE-DOOR-GUARD: FAIL — 4 check(s)', exit 1   <- it DOES bite
same hostile file DELETED instead of fixed:
                                  3 checks, 'ONE-DOOR-GUARD: PASS — one public Council OS door', exit 0
empty tree (every guarded file absent):
                                  0 checks, same PASS sentence, exit 0
```

---

### 20. CF-20 — A workflow named post-deploy-verify cannot report a failure

`.github/workflows/post-deploy-verify.yml:54` · tier `publication` · ARGUED

**The assertion**

```
if [ "$FAIL" -gt 0 ]; then echo "::warning::$FAIL endpoint(s) failed post-deploy verification"; fi   (under `set -uo pipefail`, no -e)
```

**Why it cannot fail** — 23 probes (2 hosts x 10 endpoints at :32-55, plus 3 content probes at :58-97) and the only consequence of any failure is an annotation. No step exits non-zero. If /api/gspc, /root.json and /.well-known/agents/index.json all 500 on both hosts, the run is green.

**What SHOULD fail it** — Any non-200 on a published endpoint after a deploy.

**Secondary** — (a) :39 accepts 301 as a pass for EVERY endpoint — /api/gspc redirecting anywhere counts as verified. (b) :120-135 comments on prs[0] of pulls.list(state:'open') — the most recently updated open PR, i.e. an arbitrary unrelated PR, not the one that triggered the deploy. Same shape at .github/workflows/post-merge-prover.yml:149.

---

### 21. CF-21 — The live-count gate silently degrades to comparing the pages against the number they were written from

`scripts/facts-gate.mjs:493` · tier `counts` · ARGUED

Also at: `scripts/facts-gate.mjs:505`, `scripts/facts-gate.mjs:517`, `scripts/facts-gate.mjs:165`, `scripts/facts-gate.mjs:287`

**The assertion**

```
if (!ep || process.env.FACTS_GATE_OFFLINE === "1") return ac?.observed?.axes ?? null;
} catch { console.warn("could not reach …; falling back to recorded observation (non-binding)"); }
function ruleAxisCount(... liveCount ...) { if (liveCount == null) return; }
```

**Why it cannot fail** — Two modes. (a) When https://councilof.ai/api/gspc is unreachable — a documented recurring condition — the gate grades every count claim against client/src/data/facts.json's own recorded number, still prints '(live axis count = N)' using the word live, and still prints 'facts-gate OK'. (b) If counts.axis_count.observed is ever removed, liveCount and liveMeasured are null, both count rules return at their first line, and the gate prints OK having applied neither.

**What SHOULD fail it** — The endpoint down while a page types a stale axis count; or a facts.json without the observed block.

_FACTS_GATE_OFFLINE is set in no workflow, so nothing pins whether CI is grading online or offline._

---

### 22. CF-22 — A never-spent guard greps for two strings its producer cannot emit, in a hardcoded dated directory

`.github/workflows/x402-door-conformance.yml:38` · tier `publication` · ARGUED

**The assertion**

```
if grep -rq '"settle_tx"\|"X-PAYMENT"' public/interop/x402-door-conformance-2026-09/; then echo "FAIL: a spend artifact appears in a read-only probe pack" >&2; exit 1; fi
```

**Why it cannot fail** — scripts/probes/x402_door_conformance.py contains ZERO occurrences of settle_tx or X-PAYMENT. It issues GETs via urllib.request with a fixed UA header (:48-51) and emits {discovery, doors, generated_at, limitations, schema, summary}. No input to this producer can trip the pattern. Second, the path is a hardcoded dated constant (PACK = "x402-door-conformance-2026-09", probe script :31): when the pack rolls to a new month, grep -r on a non-existent directory returns 2, the `if` is false (an `if` condition does not trip set -e), and the step prints 'read-only held' — a silent, permanent pass.

**What SHOULD fail it** — A probe pack that did carry a settlement artifact — which is the whole premise of the guard.

---

### 23. CF-23 — Four `if:` conditions in one workflow can never be true; the weekly cron does nothing and reports success

`.github/workflows/lightning-train-s3-sync.yml:35` · tier `build` · ARGUED

Also at: `:56`, `:71`, `:83`

**The assertion**

```
- if: env.AWS_ACCESS_KEY_ID != ''        (:35, with AWS_ACCESS_KEY_ID defined only in that same step's env:)
- if: ${{ github.event.inputs.train == true }}      (:56)
- if: ${{ github.event.inputs.dry_run == false }}   (:71 and :83)
```

**Why it cannot fail** — Step-level `if:` is evaluated BEFORE step env is applied, so env.AWS_ACCESS_KEY_ID is always empty and the credential step never runs. github.event.inputs.* are always STRINGS; GitHub casts a string/boolean comparison to number, so 'true' -> NaN, NaN == 1 is false, and 'false' -> NaN != 0 — both conditions are permanently false, and on the weekly schedule the inputs object is null anyway. Net: the cron installs boto3, writes a config, and reports success. Nothing trains, nothing syncs to S3, no manifest is ever committed.

**What SHOULD fail it** — Nothing — there is no run in which this workflow does its job.

_The modern typed `inputs.x` context IS correct in this repo (gspc-spray.yml:167, hub-queue-flip.yml:35), which is what makes these four a bug rather than a convention._

---

### 24. CF-24 — Three live checks are gated on environment variables that no workflow sets

`scripts/outward-claims-guard.mjs:688` · tier `publication` · ARGUED

Also at: `:842`, `:976`, `:264`, `:351`, `:436`

**The assertion**

```
if (!process.env.LIVE_HF) return skip("hf org cards", ...)
if (!process.env.LIVE_PLATFORMS) return skip("platform proof urls (live)", "proof URLs NOT probed")
if (!process.env.LIVE_REGULATORS) return skip("regulator doors (live)", "doors NOT re-probed")
```

**Why it cannot fail** — grep over .github/workflows: LIVE_HF, LIVE_PLATFORMS and LIVE_REGULATORS are set by no workflow at all. Those three checks SKIP on 100% of automated runs and are excluded from the 'N FAIL' tally the deploy job reports and files as an issue. CHECK_REGISTRY (three more checks) is set only on `schedule` or explicit dispatch, so a push-triggered deploy's outward-claims pass is a partial read presented as a tally.

**What SHOULD fail it** — A published HF card, platform proof URL or regulator door that no longer answers.

_The job is deliberately and honestly non-blocking (deploy.yml:398 job-level continue-on-error, :420 set +e, and a comment at :386 explaining why). The finding is not the non-blocking design — it is that the tally it reports counts only the checks that ran._

---

### 25. CF-25 — A guard against unbacked axis-mapping claims accepts an empty array as the mapping

`scripts/well-known-claim-guard.mjs:36` · tier `signing` · ARGUED

**The assertion**

```
const namesAnAxis = AXES.some((a) => raw.includes(a)) || /"axes"\s*:\s*\[/.test(raw);
```

**Why it cannot fail** — "axes": [] satisfies the regex. A door can claim "mapped to CSOAI measurement axes" and carry nothing. The selftest at :22-29 only exercises the AXES.some(...) branch, never this one. Compounding: zero doors under public/.well-known/ currently match CLAIMS, so bad.length is always 0 and :47 prints "✓ no door claims a mapping it does not carry" over an empty input set; and the script is referenced by no workflow or script.

**What SHOULD fail it** — {"notes":["X mapped to CSOAI measurement axes"],"axes":[]}

**Precedent** — Instance 2 of 17 Sep — success reported from an empty set.

---

### 26. CF-26 — Three Playwright assertions have their rejection swallowed and are incapable of failing

`e2e/tests/routes.spec.ts:275` · tier `testing` · ARGUED

Also at: `e2e/tests/routes.spec.ts:288`, `e2e/tests/routes.spec.ts:289`

**The assertion**

```
await expect(page.getByRole('heading', { name: /Training/i }).first()).toBeVisible({ timeout: 3000 }).catch(() => {});
```

**Why it cannot fail** — A Playwright expect rejects on failure; .catch(() => {}) discards the rejection. These are timed waits wearing assertion syntax.

**What SHOULD fail it** — The heading not rendering — the only thing they were written to detect.

---

### 27. CF-27 — A Playwright suite generating one test per route, with zero assertions

`e2e/tests/surface-sweep.spec.ts:67` · tier `testing` · ARGUED

**The assertion**

```
// The sweep records; it does not assert.   (:104)
```

**Why it cannot fail** — navStatus, pageErrors, consoleErrors and failedRequests are written to JSON and never checked, and page.goto sits inside a try/catch (:83-90) so even a navigation failure is a green test. Every route passes forever. scripts/sweep-report.mjs classifies NAV-FAIL / HTTP-4xx / JS-ERROR but only writes a markdown checklist — it never exits non-zero.

**What SHOULD fail it** — A route that 404s or throws in the console.

_Honest in its own comment; the hazard is that a green Playwright run reads as a passing surface sweep. Renaming the file would fix the reading._

---

### 28. CF-28 — Assertions behind an isVisible().catch(() => false) gate vanish when the element is absent

`e2e/tests/production-surfaces.spec.ts:211` · tier `testing` · ARGUED

Also at: `:234`, `:309`, `e2e/tests/routes.spec.ts:268`, `e2e/tests/routes.spec.ts:285`

**The assertion**

```
if (await el.isVisible({ timeout: 3000 }).catch(() => false)) { ...the assertion... }
```

**Why it cannot fail** — 'the element disappeared' and 'the element is correct' produce an identical green. :211 is the Sign-In redirect-loop check — the regression it was written for; :309 asserts the /signup password input is type=password, a security assertion that evaporates if the input is renamed.

**What SHOULD fail it** — The element being removed or renamed.

---

### 29. CF-29 — Nine skipped e2e tests, two of which are the only assertions that the homepage claims no partnership or accreditation

`e2e/tests/production-surfaces.spec.ts:67` · tier `testing` · ARGUED

Also at: `:121`, `:28`, `:32`, `:36`, `:46`, `:58`, `:74`, `e2e/tests/dashboard-shell.spec.ts:350`

**The assertion**

```
test.skip('no partner/endorsement claims in strip', ...) and test.skip('BuiltOnFooter strip explicitly denies partnership', ...)
```

**Why it cannot fail** — A skipped test is exit 0. The skips are honestly explained (the component was retired).

**What SHOULD fail it** — A partnership or accreditation claim appearing on the homepage — now unasserted anywhere; only :110-118 covers accreditation, and only on a separate route.

---

### 30. CF-30 — The gate's key fixture is structurally unreachable in CI, and its corpus check is a sample of one

`.github/workflows/inspect-adoption-gate.yml:35` · tier `signing` · ARGUED

Also at: `harness/arena/test_inspect_adoption_gate.py:167`, `.github/workflows/inspect-adoption-gate.yml:40`

**The assertion**

```
- run: pip install cryptography          # inspect_ai is NOT installed
test_f08_inspect_ai_version_honest → self.skipTest("UNCHECKABLE: inspect_ai is not installed")
CARD=$(ls public/signed/cards/*.json | head -1); python3 tools/verify_any_card.py --quiet "$CARD"
```

**Why it cannot fail** — The install step never installs inspect_ai, so the version-honesty fixture skips on every run, forever, and unittest skips are exit 0. The second step verifies 1 of 335 cards — the alphabetically first — with no set -euo pipefail, standing in for the corpus.

**What SHOULD fail it** — Corrupting card #200. Currently invisible.

---

### 31. CF-31 — The sweep is soft-failed, its exit code is never captured, and its one gating `if:` is a tautology

`.github/workflows/claimguard-sweep.yml:67` · tier `publication` · ARGUED

Also at: `:22`, `:27`

**The assertion**

```
python3 scripts/claimguard-estate-sweep.py --json > /tmp/claimguard-report.json
echo "exit_code=$?" >> "$GITHUB_OUTPUT"
continue-on-error: true
...
if: steps.sweep.outputs.exit_code != '0' || always()
```

**Why it cannot fail** — Three ways. (a) The runner shell is bash -e, so a non-zero python exit kills the step BEFORE the echo runs — the output is never set on precisely the run where it matters. (b) continue-on-error: true with no downstream failure step means a trust-destroying finding yields a green weekly run. (c) `X || always()` is identically true; the first clause is decoration.

**What SHOULD fail it** — Any claimguard finding.

---

### 32. CF-32 — The evidence-contract gate's push trigger names a branch that is not the production branch

`.github/workflows/evidence-smoke.yml:10` · tier `merge-gate` · ARGUED

**The assertion**

```
on:
  push:
    branches: [main, counter-canon-enforcement]
```

**Why it cannot fail** — The production branch is master; main is a stale side branch. Of 91 workflows this is the only one whose push.branches omits master, so the push leg of 'Gates the evidence contract the product rests on' has never fired on a real merge. Only the 6-hourly cron keeps it alive — an evidence-contract regression ships and stays live for up to six hours with no merge-time signal.

**What SHOULD fail it** — An evidence-contract regression merged to master.

---

### 33. CF-33 — A required-looking check named CI compiles nothing and asserts its own pass first

`.github/workflows/ci.yml:14` · tier `testing` · ARGUED

**The assertion**

```
run: |
  echo "CSOAI-ORG repository CI check passed"
  test -f README.md && echo "README.md exists"
  test -f LICENSE && echo "LICENSE exists"
```

**Why it cannot fail** — It runs on every push and PR to main/master and publishes a check named CI. It builds nothing and runs no test. The only constructible failure is deleting README.md or LICENSE, and its first line prints the pass before any check is made.

**What SHOULD fail it** — A compile error, a failing test, a broken build — none of which it can see.

---

### 34. CF-34 — A 40-minute poll that exits 0 when the CLI fails on every attempt

`.github/workflows/kaggle-community-cells.yml:113` · tier `publication` · ARGUED

**The assertion**

```
st=$(kaggle kernels status "$KERNEL" 2>/dev/null || true)
...
echo "still running after 40 min — artifact harvest skipped"
exit 0
```

**Why it cannot fail** — With an expired token or a renamed kernel, st is empty on every poll, neither *COMPLETE* nor *ERROR* matches, the loop runs out and the step exits 0. Combined with :133-140's `kaggle kernels output … || true` and `ls -la … || true`, a totally broken credential path reports a green run with an empty artifact.

**What SHOULD fail it** — An expired Kaggle token.

---

### 35. CF-35 — The only signed-artifact gate on the deploy path never performs an Ed25519 verification

`scripts/signed-json-guard.mjs:110` · tier `signing` · ARGUED

Also at: `scripts/signed-json-guard.mjs:124`, `scripts/signed-json-guard.mjs:72`

**The assertion**

```
const isEd25519SigHex = (v) => typeof v === "string" && /^[0-9a-f]{128}$/.test(v);
```

**Why it cannot fail** — The check is a shape check. 64 bytes of any hex passes — the selftest's own fixture is SIG = "ab".repeat(64). A card whose signature is cryptographically invalid but well-formed ships. The success line 'every indexed card bound to signature bytes' is literally true and reads as more.

**What SHOULD fail it** — A card body whose 128-hex signature does not verify under the pinned public key.

_Real cryptographic verification exists in scripts/verify-estate.mjs — which is CF-03, green under CI on an unreachable input._

---

### 36. CF-36 — An empty or comments-only manifest verifies the wheelhouse

`scripts/ceremony/verify_offline_bundle.py:20` · tier `completeness` · **DEMONSTRATED**

**The assertion**

```
for line in MANIFEST.read_text().splitlines(): ... return errors   # errors == [] over an empty manifest
```

**Why it cannot fail** — Zero lines to check produces zero errors, and main() then prints 'offline_bundle: VERIFIED'. Empty set compared to empty set.

**What SHOULD fail it** — A truncated manifest — which is how a manifest most plausibly breaks.

**Demonstration**

```
real manifest, empty wheelhouse -> 3 error(s)  (control: it does bite)
EMPTY manifest                  -> 0 error(s)  VERIFIED, nothing checked
comments-only manifest          -> 0 error(s)  VERIFIED, nothing checked
```

_Not wired into any workflow — a manual ceremony tool. Ranked low for that reason, not because the shape is benign._

---

### 37. CF-37 — Census dedupe returns exit 0 when it cannot fetch its own input

`scripts/census/dedupe-agent-interop.py:117` · tier `completeness` · ARGUED

Also at: `:125`

**The assertion**

```
except Exception as e:
    print(f"census manifest UNCHECKABLE: {type(e).__name__}")
    return 0
```

**Why it cannot fail** — A network failure on the manifest or the census download is a success exit. No register is written, and any caller reading the exit code sees a pass.

**What SHOULD fail it** — HF unreachable.

_It returns before writing anything, so it produces no false artifact — only a false green._

---

### 38. CF-38 — Malformed rows are silently dropped, then a discrimination rate is computed over what survived

`harness/gspc-top100/check_bank_discriminates.py:83` · tier `counts` · ARGUED

**The assertion**

```
try:
    rows.append(json.loads(line))
except json.JSONDecodeError:
    pass
```

**Why it cannot fail** — Partial corruption shrinks the population invisibly; only total corruption (zero rows) is reported, as 'empty'. The rate is then quoted against --max-parrot as if the population were whole.

**What SHOULD fail it** — A bank file with 30% malformed lines.

**Precedent** — 'Partial read totalled as population'.

---

### 39. CF-39 — The no-public-prices doctrine gate reads only the top level of public/

`functions/api/_no_typed_prices.test.ts:21` · tier `doctrine` · ARGUED

**The assertion**

```
readdirSync(PUBLIC)   — non-recursive
```

**Why it cannot fail** — It covers 45 of the 148 HTML files under public/. Any product page shipped under public/<dir>/ escapes it entirely. The 103 nested files are currently third-party mirrors, which is defensible; the doctrine the test is named for is not scoped that way.

**What SHOULD fail it** — A $ price in public/<anything>/page.html.

---

### 40. CF-40 — Eight of twenty-four assertions in the observability suite are shape-only

`functions/api/observability.test.ts:30` · tier `testing` · ARGUED

Also at: `:37`, `:38`, `:49`, `:62`

**The assertion**

```
expect(typeof body.root.card_count).toBe("number");
```

**Why it cannot fail** — NaN, -1 and 0 are all numbers. Not strictly vacuous (:31 and :50 add toBeGreaterThan(0)), and :39's `expect(signed + unsigned).toBe(total)` is a real invariant — but the card-count assertions are not among them.

**What SHOULD fail it** — card_count: -1.

---

### 41. CF-41 — A self-disabling escape hatch in the tools-match-door test, with a stale justification

`mcp/gspc-server/tools-match-door.test.ts:65` · tier `testing` · ARGUED

Also at: `:76`

**The assertion**

```
if (!existsSync(p)) return; // written at pack time; absent in a clean tree
```

**Why it cannot fail** — The comment is stale — gspc-tools.json and paid-tools.json ARE git-tracked, so the test runs today. But the hatch means 'the shipped tool list equals the door's' self-disables the moment those files move to .gitignore. Same at :76: `.filter(existsSync)` over the four surfaces — an empty surfaces array makes 'no dropped mill-tool is advertised' pass with an empty loop.

**What SHOULD fail it** — Either file being untracked.

---

### 42. CF-42 — Six guards and verifiers that no workflow, package.json script or shell script invokes

`scripts/claims-register-lint.mjs:3` · tier `publication` · ARGUED

Also at: `scripts/recomputability-audit.mjs`, `scripts/redirects-shadow-guard.mjs`, `scripts/route-surface-truth-gate.mjs`, `scripts/verify_signed.py`, `scripts/verify_public_root.py`

**The assertion**

```
claims-register-lint.mjs:3 — "fail the build when /claims-register would render fewer…"   (it is in no build)
```

**Why it cannot fail** — A guard nobody calls cannot fail. recomputability-audit.mjs additionally exits 0 at :64 if public/interop is absent and at :90 if there is no baseline.

**What SHOULD fail it** — The regressions each was written for.

---

### 43. CF-43 — The pre-push hook silently no-ops if the gate script loses its executable bit

`.githooks/pre-push:40` · tier `publication` · ARGUED

**The assertion**

```
[ -x "$ROOT/scripts/pre-push-gates.sh" ] || exit 0
```

**Why it cannot fail** — A chmod, a fresh clone with a different umask, or a sparse checkout turns the whole content-gate suite into a silent pass.

**What SHOULD fail it** — scripts/pre-push-gates.sh being non-executable — which should be an error, not a skip.

_Moot today because of CF-05, but it is the second lock on the same door and it is also open._

---

## Highest-value single edits

1. CF-04: copy runpod-land.yml:105 and :141-143 into hub-queue-land.yml and mill-jobs-land.yml — assert the signer succeeded, then sys.exit(2) on any non-VALID verdict.
2. CF-06: add '\.github/workflows/' to the pr-gates.yml:97 scope regex, so a PR cannot delete the gates and pass by scope.
3. CF-03: drop the `process.env.CI ? 0 :` in verify-estate.mjs — a CANNOT-RUN must be a distinct non-zero exit the workflow reports as neither pass nor fail, never as a pass.
4. CF-08: expect(a.payTo).toBe(ESTATE_PAY_TO) in functions/.well-known/x402.json.test.ts.
5. CF-01: run brand-gate and price-gate over the bytes each outward publisher is about to push, not over dist/client.

## Checked and found sound

Checked and found sound. Recorded so this document is not read as 'everything is broken'.

- scripts/signed-json-guard.mjs --selftest — 15 mutation controls including a positive control; genuinely proves it can fail (its one open door is CF-07/CF-35)
- scripts/brand-gate.mjs --selftest — every rule carries a must-catch and a must-allow case
- scripts/evidence-integrity-gate.mjs — negative controls at 311-399
- scripts/interop/x402-bazaar-audit.py scan_with_meta — raises rather than guessing absence; population_complete is real
- scripts/outward-claims-guard.mjs walkRegistry — returns an error rather than reporting a prefix as a total
- scripts/probes/mcp_liveness_sample.py — UNCHECKABLE states and explicit limitations; PROBED is not MEASURED
- scripts/root-witness-release-gate.py — live_bytes >= 0 looked weak but exact_match still binds live_bytes == len(raw)
- functions/api/gspc.separation-truth.test.ts — three explicit failing controls
- functions/api/dashboard/absent-is-not-zero.test.ts — fixture is the verbatim live payload, and says so
- functions/api/receipts/verify.test.ts — DID fixture matches public/.well-known/did.json; authorization-vs-cryptography control at 106-119
- packages/gspc-card-verifier/test/* — asserts >=3 INVALID and >=4 UNCHECKABLE fixtures so agreement cannot be vacuous
- the ~30 verifiers whose except-handlers return INVALID — rekor_inclusion_verify.py, verify_signed.py, verify_receipt.py, harness/owem/*, tools/verify/* — all fail closed
- .github/workflows: drift-guard.yml, public-root.yml (HALT->exit 1), runpod-land.yml (asserts signer success AND sys.exit(2)), hub-index-drift.yml, conflict-guard.yml, lane-guard.yml, a2a-contract-selftest.yml, mcp-protocol-contract.yml — all selftest-first, all fail closed

---

Nothing in this document was fixed by the pass that produced it. Every entry is a report. The estate's doctrine is that a component must be structurally unable to report success on a path it did not complete; these are the places where it still can.
