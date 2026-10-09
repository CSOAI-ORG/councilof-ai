# REVENUE VECTOR HUNT — permissionless growth paths for CSOAI Ltd

**Date:** 2026-10-08 (probes run 2026-10-09 01:54–02:3x UTC)
**Author:** revenue-vector hunter subagent
**Method:** 26 web searches · 18 successful page extracts (2 crawls failed) · live read-only probes of our own endpoints and of four third-party indexes (PayAI, Coinbase CDP Bazaar, x402scan, Zero)
**Constraints honoured:** no payments, no new accounts, no credentials, no git commits in `~/clawd`. Every number below is either (a) read from a live response I probed, or (b) attributed to a URL.

**Key structural finding in one line:** *we are already indexed in PayAI (6 entries, auto-indexed, no registration) but absent from Coinbase's CDP Bazaar (0 of 33,906 entries) and absent from x402scan (0 hits) — and 41 of our 69 catalogued routes fail the exact unpaid-probe test (400/200 instead of 402) that both directory validators use to decide a route is payable.*

---

## A. Ground truth verified today (our own estate)

| Probe | Result |
|---|---|
| `POST /api/free-door`, `/api/request-attestation` (empty JSON) | `402`, `x402Version:2`, carries `resource`, `tags`, **and `extensions.bazaar`** — discovery-ready |
| `POST /api/art50/marking-evidence` (empty JSON) | **`400`** `{"error":"uncheckable","reason":"JSON body needs url, bytes_b64 or manifest_b64"}` — validation runs *before* the payment challenge |
| `POST /api/signed-data-feed` (empty JSON) | **`200`** — free answer, i.e. "not payable" to any validator |
| `POST /api/eunomia-data` | **`308` → `/api/signed-data-feed`**, which then answers `200` (stale index entry + non-payable target) |
| `GET /.well-known/x402` | **`308` → `/.well-known/x402.json`** (deliberate: `functions/.well-known/x402.ts` returns a 308). `/.well-known/x402.json` = `200`, 144 KB |
| Full unpaid-POST sweep of every route-shaped URL in `/api/x402` (69 URLs, `POST {}` with no payment header) | **402: 28 · 200: 18 · 400: 14 · 404: 9** |
| Non-402 routes without placeholders/preview flag | `400` art50/marking-evidence, `400` receipts/verify, `400` receipts?payer=…, `200` feeds/provider-diff, `200` signed-data-feed, `200` verify, `404` commissions, `404` fines, `404` gspc, `404` revenue, `404` x402/index |
| PayAI Bazaar index `GET /facilitator.payai.network/discovery/resources` paginated to the end | **17,820 entries; 6 councilof.ai entries**: `/api/free-door`, `/api/request-attestation`, `/api/eunomia-data`, `/api/proof`, `/api/receipts/batch`, `/api/rwa/evidence` |
| Coinbase CDP Bazaar `GET api.cdp.coinbase.com/platform/v2/x402/discovery/resources` paginated to the end | **33,906 entries; 0 councilof.ai / 0 csoai hits** |
| x402scan `GET x402scan.achivx.com/v1/resources/search?q=councilof.ai` and `q=csoai` | **0 / 0 hits** |
| `/api/x402` catalog (`csoai.x402-catalog/0.3`) | exposes `rail.mode = live`, payTo `0x2126…ae31`, 69 route-shaped URLs (incl. query-template forms) |
| Source of the live doors | `/Users/nicholas/clawd/councilof-ai-work/functions/` (Cloudflare Pages Functions; `api/art50/marking-evidence.ts`, `.well-known/x402.ts`, `_x402.ts`, tests incl. `x402-listing-parity.test.ts`). Deploy = GHA on master per AGENTS.md/DEPLOY-LOCK.md. |

**Why the 400/200 matters — this is the whole game.** The x402scan discovery spec lists, verbatim, among its *Common Failure Reasons*: `"Expected 402, got 400 from request validation running before payment challenge"`. The same validator logic is what disqualified a real seller from Coinbase's Bazaar: a developer's 10-calls-a-day free tier answered `200` to the unpaid probe, so "the x402 Bazaar validator … concluded the resource was not payable"; his fix was *"make 402 the default and move free access behind a query parameter"* (https://theclarity.today/story/i-made-korean-government-data-agent-payable-with-mcp-and-x402-here-s-what-51e295cb, 15 Sep 2026).

---

## B. Ranked vector table

Permissionlessness: **5 = no owner input at all** (no account, no click, no credentials, no money) … **1 = needs owner account/credentials/payment.**
Effort: XS < 1 h · S < 1 day · M < 1 week · L ≥ 1 week.

| # | Vector | Permission-less | Effort | Time-to-first-$ | Revenue mechanism | Evidence | Exact first action |
|---|---|---|---|---|---|---|---|
| **1** | **Payability hygiene: make every catalogued route answer 402 before validation** (fix 14×`400`, 18×`200`, 9×`404` on unpaid probes) | **5** | S | Days → settlements start flowing the day directories re-probe | Each newly-402 route becomes indexable in every x402 directory ⇒ per-call USDC settlements (our existing rail already settles; sibling data: 4 doors, 14 settlements/30d, $0.03) | x402scan failure reason quoted above (https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md); theclarity.today Bazaar-disqualification story; measured sweep in §A | Move input parsing *after* the challenge in `/Users/nicholas/clawd/councilof-ai-work/functions/api/art50/marking-evidence.ts:331` (and `functions/api/receipts/verify.ts`, `signed-data-feed`); add CI test asserting unpaid `POST {}` → 402 for every route in `/api/x402` |
| **2** | **x402scan origin registration** (4th directory; currently 0 hits) | **5** | XS | Days | Indexed in an agent-facing x402 explorer → discovery→paid calls | https://github.com/Merit-Systems/x402scan ("submitting the URL… will be added automatically"); discovery spec DISCOVERY.md | Serve `/.well-known/x402` as **200** JSON `{version:1, resources:[…31 doors…]}` (today it 308s), then submit `https://www.x402scan.com/resources/register` with `https://councilof.ai` |
| **3** | **Fill the PayAI Bazaar index from 6 → all doors** (auto-indexed, "no registration form, account, or manual submission") | **5** (declaration) / refresh-by-verify needs a buyer key ⇒ 4 for the refresh step | S | Days–weeks | Listed with price + `payTo` in the 17,820-resource index agents query to self-equip | https://docs.payai.network/x402/facilitators/bazaar (cataloging runs on `/verify` too, no funds move); measured 6/31 today | Add `extensions.bazaar` + `resource` metadata (copy the `free-door` shape) to the 25 unlisted doors in `functions/api/**`; they index on the next verify/settle anyone performs |
| **4** | **Coinbase CDP Bazaar (largest buyer surface: 33,906 resources → agentic.market, Bedrock AgentCore, Bazaar MCP)** | **2** (CDP API key = account; settlement = payment) | M | Weeks | Top-ranked listing in Coinbase's discovery catalogue ("tens of thousands of agents") | https://docs.cdp.coinbase.com/x402/seller/get-discovered (23,000+ resources; "no registration form"); measured 0/33,906 today; archonics recipe | Owner gate: create CDP API key, point `verify/settle` at the CDP facilitator, make **one** settled call (archonics: "only fires after a full settlement") |
| **5** | **PyPI/npm/GitHub README as the distribution trojan** — 24 PyPI packages, 928 repos already published | **5** | S | Weeks (compounding) | Every crawled directory back-links to `/api/x402`; `mcp-name:` lines get servers into the official registry feed that other directories copy | https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/ (`mcp-name:` in README ⇒ registry discovery); https://servicegraph.co/blog/best-mcp-directories-2026 (directory traffic table) | Add to each of the 24 PyPI READMEs: `mcp-name:` line + price table + `https://councilof.ai/api/x402` + GitHub topic `mcp-server` |
| **6** | **Price-ladder the compliance/evidence doors using real market comparables** (check free, signed receipt paid) | **5** | S | Days–weeks | Per-call USDC for signed Art.50/evidence/receipt artefacts; anchors at $499/mo tiers exist upstream | code402.dev pricing: $1/1,000 checks → $79/mo 50k → **$499/mo** enterprise, "the check is free, you pay for the receipt" (https://code402.dev/pricing, https://hcrb.in/evidence); Trust Check: **5¢/check**, no tiers (https://trustcheck.ounie.com/pricing); competitor EU AI Act Art.50 lookup already on x402 at **$0.04/call** (https://zero.xyz/c/eu-ai-act-article-50-transparency-obligation-lookup-b2346bd6); Credo AI $25K/audit vs our $79 positioning (own skill) | Publish 3 fixed prices on `/api/x402` for art50 + evidence-bundle + receipts/batch (e.g. $0.04 lookup / $0.50 signed pack / $5 bundle) and mirror them in `llms.txt` + `/.well-known/x402.json` |
| **7** | **Sell the census itself** — our `State of the Agent Internet` machinery is a product nobody else publishes | **5** | S | Weeks | x402 per-call for `/api/pop/*` (11 doors already 402-by-default) + attribution back-links from citations | Our own `https://councilof.ai/state/2026-09` (2,713 x402 hosts probed, 477 conformant = 17.58%); comparable x402 search APIs list at $0.005–$0.10/call (zero.xyz listings) | Add price + discovery metadata to `/api/pop/x402-bazaar`, `/api/pop/mcp-registry`; publish the October edition (fresh URL ⇒ new crawl + citations) |
| **8** | **Free directory submissions** (mcp.market, claudemarket.ai, mcp-marketplace.io, hub.wardnai.dev, agent-tools.cloud) — all already list x402-paid MCPs like `cipher-x402-mcp` | **4** (forms; some auto-crawl) | S | Weeks | Discovery of the paid MCP doors | https://mcp.market/server/cryptomotifs-cipher-x402-mcp; https://agent-tools.cloud/about (crawls Smithery + registry + PulseMCP + Glama + awesome-x402 + x402scan); https://mentionagent.ai/blog/mcp-server-directories (30 directories opened; **paid lanes $39** at mcp.so/mcpservers.org → excluded, costs money) | Submit `https://councilof.ai` + the GSPC MCP endpoint to the free forms; skip every `$39` lane |
| **9** | **Content/SEO compounding** (long-tail landing pages per door) | **5** | M | 2–4 months | The *only* channel that produced real MCP revenue in our case-study set | casedistillery issue-010: $12 → **$3.4K MRR, 251 subs**, "$0 paid ad spend, ~80% SEO"; MCP feature was "the acquisition, not a feature" | One HTML page per paid door (`/art50-marking-evidence.html` …) with price, schema, `402` example, self-canonical |
| **10** | **Buy-the-receipt demand channel for auditors** (anchored evidence as a *sale*, not a demo) | **3** (the artefact is permissionless; the buyer is not — needs outreach) | M | Months | Signed receipt packs sold as evidence packs; incumbents charge five figures | https://vcisolite.com/blog/hash-chained-timestamp-anchored-workpapers (AICPA workpaper integrity → cryptographic anchoring is the emerging mechanism); https://hcrb.in/evidence (proof-not-check pricing, $79–$499/mo) | Add `?audit=1` bundle SKU + publish a 1-page price sheet reachable from `llms.txt` |
| **11** | **RapidAPI / hosted-marketplace listing of the compliance API** | **1** (account + payout onboarding) | M | Months | Per-call fiat subscriptions | https://rapidapi.com/NAOFL/api/enterprise-compliance-api-gdpr-sox-hipaa-analysis (compliance APIs are sold here); marketplace fee on top of subscription (https://stackscored.com/pricing/api-platforms) | Deferred — owner account needed |
| **12** | **GitHub Sponsors / tips / OSS support contracts / dual-license** | **1** (Sponsors needs account + payout; contracts need outreach) | M | Months | Recurring sponsorships (GitHub 0% platform fee) | https://safeguard.sh/resources/blog/how-sponsorship-models-github-sponsors-tidelift-open-collective-compare; https://gitpop.com/blog/open-source-business-models-2026 (5 viable models: open-core, SaaS, dual-license, support, hosting) | Deferred — explicitly "needs account" per brief |

**Excluded by the brief (money or account leaves the estate):** $39 fast-lane listings (mcp.so, mcpservers.org), any Stripe/buy-button work, CDP API key, PyPI token minting, RapidAPI onboarding, GitHub Sponsors.

---

## C. TOP 5 — executable by an agent today, zero account creation

**1. 402-before-validation fix (vector #1).**
```bash
# repro of the defect (read-only, ran today):
curl -s -X POST https://councilof.ai/api/art50/marking-evidence -H 'Content-Type: application/json' -d '{}'
# → 400 {"error":"uncheckable", ...}   SHOULD be 402 with accepts[]

# edit: /Users/nicholas/clawd/councilof-ai-work/functions/api/art50/marking-evidence.ts
#   line ~331: `if (input.error) return json(..., 400)` fires before any challenge.
#   Move the `hasPaymentHeader(request)` / buildPaymentRequiredV2 branch ABOVE input parsing
#   when no payment header is present (identical pattern already used at lines 343–377).
# repeat for: functions/api/receipts/verify.ts, functions/api/signed-data-feed (200→402 default),
#            functions/api/feeds/provider-diff.ts (200→402 default), 404 routes in /api/x402.

# guard rail (new test, mirrors the existing parity test):
#   for each route URL in GET /api/x402 → POST {} with no payment header → assert status == 402
#   and JSON has accepts.length >= 1 + extensions.bazaar
```
Repo: `/Users/nicholas/clawd/councilof-ai-work` · deploy per AGENTS.md = push to master, GHA `deploy.yml` (direct wrangler is owner-only).

**2. `/.well-known/x402` 200 fan-out + x402scan submit (vector #2).**
```bash
# current: functions/.well-known/x402.ts returns 308 → x402.json
# change it to serve the spec's minimal payload directly (200):
#   {"version":1,"resources":["https://councilof.ai/api/free-door", …all doors… ]}
# then submit (no login per README): https://www.x402scan.com/resources/register
# or the API form behind it:        https://www.x402scan.com/api/data/registry/register-origin
# validate first (their own doc):
npx -y @agentcash/discovery councilof.ai -v        # I did NOT run this — arbitrary-npm supply-chain risk; owner/agent decides
curl -i -X POST https://councilof.ai/api/art50/marking-evidence   # must return 402 after fix #1
```

**3. PayAI index gap-fill 6 → 31 (vector #3).**
```bash
# already proven shape (works, indexed today): /api/free-door 402 body contains
#   resource{url,description,mimeType,serviceName,tags} + extensions.bazaar{info,output,schema}
# replicate that block in every door that lacks it (grep for declareBazaarHttpGet):
grep -rL "declareBazaarHttpGet" /Users/nicholas/clawd/councilof-ai-work/functions/api --include='*.ts'
# index refresh needs no registration and no funds: cataloging runs on /verify
#   (docs.payai.network/x402/facilitators/bazaar) — it updates when any client echoes the extension.
```

**4. README/metadata blast across the 24 PyPI packages + 928 repos (vector #5).**
```bash
# for each published package README add:
#   - `mcp-name: io.github.CSOAI-ORG/gspc` line  (official-registry crawler key: github.blog)
#   - price table: free verification / $0.04 Art.50 lookup / signed receipt per artefact
#   - link https://councilof.ai/api/x402  and https://councilof.ai/llms.txt
#   - GitHub topic: mcp-server  (directories crawl GitHub topics before anything else)
# verification after push:
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=gspc" | head -c 300
```

**5. Price + discovery metadata on the census doors (vectors #6+#7).**
```bash
# our own comparables, read today:
#   EU AI Act Art.50 lookup (competitor, live on x402):  $0.04 / call  — zero.xyz
#   Trust Check:                                         $0.05 / check — trustcheck.ounie.com/pricing
#   code402.dev: $1/1,000 checks → $79/mo → $499/mo      — code402.dev/pricing
# action: put three fixed amounts in functions/api/_x402_descriptions.ts + /api/x402 `resources[]`
#         and mirror in /api/x402, /.well-known/x402.json, /llms.txt so no surface drifts
#         (drift check: curl -s councilof.ai/api/x402 | grep -o '"amount":"[^"]*"' | sort -u)
```

---

## D. "What we can start right now" — command sheet

```bash
# 0. today's audit, re-runnable (read-only, ~40 s)
curl -s https://councilof.ai/api/x402 -o /tmp/cat.json
python3 - <<'PY'
import json,subprocess,collections
d=json.load(open('/tmp/cat.json'))
def walk(o):
    out=[]
    if isinstance(o,dict):
        for v in o.values(): out+=walk(v)
    elif isinstance(o,list):
        for v in o: out+=walk(v)
    elif isinstance(o,str) and o.startswith('https://councilof.ai/api/'): out.append(o)
    return out
routes=sorted(set(u for u in walk(d) if '<' not in u and 'preview' not in u))
bad=[]
for u in routes:
    c=subprocess.run(['curl','-s','-m','10','-o','/dev/null','-w','%{http_code}','-X','POST',u,
        '-H','Content-Type: application/json','-d','{}'],capture_output=True,text=True).stdout
    if c!='402': bad.append((c,u)); print(c,u)
print(f"{len(routes)-len(bad)}/{len(routes)} payable-by-default; {len(bad)} fail validator test")
PY

# 1. index membership (all three, read-only)
curl -s "https://facilitator.payai.network/discovery/resources?limit=200"   # we ARE in (6 entries)
curl -s "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=200"  # we are NOT
curl -s "https://x402scan.achivx.com/v1/resources/search?q=councilof.ai"    # we are NOT

# 2. files to touch (all under /Users/nicholas/clawd/councilof-ai-work)
functions/api/art50/marking-evidence.ts      # 400 before 402 (line ~331)
functions/.well-known/x402.ts                # 308 → serve 200 fan-out JSON
functions/api/signed-data-feed.ts            # unpaid 200 → 402 default (keep ?preview=1 free)
functions/api/feeds/provider-diff.ts         # same
functions/.well-known/x402-listing-parity.test.ts   # extend into a whole-catalogue 402 gate

# 3. sibling assets that already exist and should be reused, not rebuilt
#    ~/clawd/csoai-reach-pack-01Sep2026/DISTRIBUTION-INVENTORY-2026-09-22.md
#    councilof.ai/state/2026-09 (our own census — the citable asset behind vector #7)
#    ~/clawd/mcp-monetization-pipeline skill (marketplace + registry workflows)
```

---

## E. Evidence pack (the numbers I actually read)

### E1. What x402 sellers earn (the honest distribution)
- **91 businesses** cleared an organic bar (≥$100, ≥3 buyers) in 30 days on **$793k** organic volume; **median seller revenue $0.01/30d**; top 10 wallets = **76%** of volume; ~0 daily paying agents (trailing-week avg) — https://x402stats.io/reports/2026-10
- Curated directory of 492 sellers: median **$0.06/30d**; **38% earn nothing**; ≥$10/mo = **8.5%**; ≥$100/mo = **2.6%**; ≥$1,000/mo = **0.4%**; one seller = 78.4% of listed volume; the directory sees ~10% of real settlement — https://claudevsite.uk/notes/x402-economics
- Bitquery's first full audit: August headline $2.6B was ~90% one bridge contract; ex-bridge the rail moved $317M; **median Base seller earned $2.50 in August**, 40% earned <$1; **5.8% of July's 80,642 sellers returned in August, but sellers with ≥10 payments retained 71.1% of buyers** — https://payzum.com/blog/x402-audit-sellers-earnings/ (11 Sep 2026)
- **Implication for us:** listings are free and worthless alone; *retention of buyers through repeated useful calls* is the entire signal. Our defector risk is being a $0.03 curiosity. The remedy is demand-side: be findable for a query someone actually runs (vectors 1–3, 5) and be priced against a comparable (vector 6).

### E2. MCP monetization case studies (5, with numbers)
1. **21st.dev "Magic" UI-component MCP → $10,000 MRR in ~6 weeks**, freemium, zero marketing budget — https://arte.itlibra.com/en/articles/can-mcp-servers-be-monetized (also https://medium.com/@faang7777/mcp-gold-rush-11000-servers-5-percent-monetized-2026-2e3ff9962e44, which calls it "the one case study that's both public and verifiable")
2. **OpenTweet: $12 (Dec) → $230 (Feb) → $2,200 (Mar, MCP ships) → $3,400 MRR / 251 paying subs**, $0 ad spend, ~80% SEO, price $11.99/mo against X's $5,000/mo API tier — https://casedistillery.com/issue-010
3. **Korean tax-data MCP: 402-by-default got it into the x402 Bazaar, top-ranked for its query**; but registry+Glama+Smithery listings drew **~1,250 requests/day that were nearly all bots, external tool calls ≈ 0 in week 1** — https://theclarity.today/story/i-made-korean-government-data-agent-payable-with-mcp-and-x402-here-s-what-51e295cb
4. **One Email-Verify MCP: $7 from 11 Smithery installs** via free-tier counter + Stripe link (free→pro funnel) — https://gentic.news/article/build-a-free-to-pro-mcp-server-the (crawl failed; figure taken from the search snippet — treat as low-confidence)
5. **Skeptic's own run: 35 MCP servers in 10 days + full x402 stack = $0 revenue**, "everything works… the problem is distribution" — https://dev.to/alexcodebytes/i-deployed-35-mcp-servers-in-10-days-heres-what-nobody-tells-you-about-ai-monetization-4j8h
- Market shape: official MCP registry **37,619** servers, Glama **94,143**, MCPize 1,050 (all counted 30 Sep 2026); official registry metadata has **no price field**, so "what share is paid" is uncountable from primary data — https://arte.itlibra.com/en/articles/can-mcp-servers-be-monetized

### E3. Compliance/measurement-as-product pricing
| Comparable | Price | Source |
|---|---|---|
| EU AI Act Art.50 obligation lookup, x402 per call | **$0.04/call** | https://zero.xyz/c/eu-ai-act-article-50-transparency-obligation-lookup-b2346bd6 |
| Trust Check (deterministic check) | **$0.05/check**, no tiers | https://trustcheck.ounie.com/pricing |
| code402.dev receipt ladder | $1/1,000 · $5/5,000 · **$79/mo** 50k · **$499/mo** 500k, 7-yr retention | https://code402.dev/pricing |
| Incumbent identifier check (iban.com) | €530/yr per 2,000 lookups; Trustpair/Eftsure five-figure contracts | https://hcrb.in/evidence |
| Enterprise compliance API (GDPR/SOX/HIPAA) on RapidAPI | subscription tiers, $0 basic | https://rcapi.net · https://rapidapi.com/NAOFL/api/enterprise-compliance-api-gdpr-sox-hipaa-analysis |
| Enterprise audit incumbents (positioning anchor used in our own skill) | Credo AI $25K/audit, Holistic AI $50K/yr | `~/clawd` skill `mcp-monetization-pipeline` |
| Article 50 status (demand urgency) | in force **since 2 Aug 2026**, not deferred by the Omnibus; marking duty for pre-existing systems grace to 2 Dec 2026 | https://balazscsorba.com/blog/eu-ai-act-article-50-developer-checklist · https://www.nicfab.eu/en/posts/ai-act-art50-guidelines/ |
**Read:** the market price for a *lookup* is $0.04–0.05, and the money is in the *retained signed receipt* ($79–$499/mo). Our product shape (free verification + paid signed artefact) matches the winning shape exactly; we are under-documented on price and under-indexed in directories.

### E4. Distribution reality — do listings create usage?
- Directory traffic (monthly visits, third-party estimate): mcpservers.org 504K, Smithery 446K, mcpmarket 1.4M, PulseMCP 277K, mcp.so 238K, Glama 105K, official registry 54K — https://servicegraph.co/blog/best-mcp-directories-2026
- Two assets do most of the work: **a GitHub repo + an official-registry entry**; crawl-fed directories copy those. Paid lanes exist ($39 at mcp.so and mcpservers.org) — https://mentionagent.ai/blog/mcp-server-directories (30 directories opened 13 Sep 2026; PulseMCP paused submissions)
- **Hard counter-evidence:** 1,250 req/day from the big three directories were "nearly all health-check and security-scanner bots" with ≈0 real tool calls in week 1 (E2 #3). Directories = *being findable by agents*, not *getting customers*.
- The x402 discovery layer is where agent demand actually routes: PayAI **17,820** resources (measured today), CDP Bazaar **33,906** (measured today; docs say 23,000+), agentic.market + Bazaar MCP + Bedrock AgentCore downstream — https://docs.cdp.coinbase.com/x402/seller/get-discovered
- Conclusion for vector ordering: **payability + index membership (1–3) are the cheapest real levers; README/metadata (4–5) is the cheapest durable one; pure directory submissions are hygiene, not revenue.**

### E5. IP monetization, ranked by permissionlessness
1. **Signed receipts sold per call on our own x402 rail — already live, P5** (`/api/request-attestation` = 6 settlements/30d per sibling data). Growth = price + index (vectors 3, 6).
2. **Anchored evidence published as citable reports** (`/state/2026-09`) — P5; creates inbound, no account.
3. **Open-core / paid docs / support contracts / dual-license** — P2–1: every model in the 2026 field guide needs either a payout account or a signed contract (https://gitpop.com/blog/open-source-business-models-2026).
4. **GitHub Sponsors / Open Collective / Tidelift** — P1: account + payout setup (https://safeguard.sh/resources/blog/how-sponsorship-models-github-sponsors-tidelift-open-collective-compare).
5. **Audit-firm demand channel** — the mechanism (cryptographically anchored workpapers) is documented as the next generation of audit evidence (https://vcisolite.com/blog/hash-chained-timestamp-anchored-workpapers; https://medium.com/@axiomaxllc/the-18m-question-why-cryptographic-receipts-are-about-to-replace-audit-dashboards-across-14-071014c9854d), but *reaching* auditors is outbound ⇒ not permissionless. Ship the priced SKU (P5), do the outreach later (P2).

---

## F. Honesty notes / not verified
- I did **not** execute any listing registration, payment, or deployment — read-only probes only. Index submissions in §C are staged for approval.
- I did **not** run `npx -y @agentcash/discovery councilof.ai` (unvetted npm package on the host).
- The `200`-on-unpaid-POST routes include intentional `?preview=1` free previews (documented in the art50 handler); my "bad" list in §A excludes preview/placeholder URLs, so the six flagged base routes are genuinely non-payable-by-default.
- Directory traffic figures are one third-party's estimates (servicegraph), not audited.
- Two extracts failed to crawl (`gentic.news`, `agentatwork.xyz/notes/x402-seller.html`); where I used their content it came from search-result text and is labelled as such. The agentatwork piece is nonetheless the best source on PayAI index admission control (index admits on an unpaid `/verify` carrying `outputSchema`, no account, seconds) — worth a manual read: https://agentatwork.xyz/notes/x402-seller.html
- PayAI index size differs by source and date (17,820 measured today vs 26,608 claimed in late-Sep write-ups); CDP Bazaar 33,906 measured today vs "23,000+" in Coinbase docs. Both stated with provenance rather than reconciled.
