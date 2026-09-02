# Revenue research — x402 as "our MetaMask", and the legal ways to yield off the value (2026-09-02)

**Lane:** revenue-research (read-only on master; this document + nothing else).
**Question asked:** "How can we make x402 into our MetaMask today, from all we have, and what are the
legal ways to yield off the value we create?"
**Doctrine honoured throughout:** open source · no Stripe · no SaaS tiers · no public prices in prose
(amounts live only in a 402 `accepts[]`) · verification free forever · a rank is never sold ·
measurement, never certification · financial-instrument firewall (no token, no redeemable credit, no
cash-settled index; staking / treasury yield / anything security-shaped = **COUNSEL GATE**, listed, not
recommended). Not licensed advice: business-revenue research only. Nothing here moves money, touches a
key, or posts anything.

Everything in §0 was read from bytes on 2026-09-02 ~08:00–08:10Z. Everything in §1–§4 cites a URL and a
date; anything I could not confirm is marked **UNVERIFIED**.

---

## 0. Bytes first — what is actually live vs what is on master

| Surface | Live probe (08:04Z) | On master (`d004cb9e`, PR #1150 merged 08:02Z) | Verdict |
|---|---|---|---|
| `GET /api/x402` (catalogue, no amounts) | **404** `not_found` | `functions/api/x402.ts` exists | prod behind master |
| `GET /.well-known/x402.json` | 200, **static stub**: `mode:"mock"`, resource `pack.councilof.ai/v1/pack/assemble`, `mode_note: "not a live settle path (404)"` | `functions/.well-known/x402.json.ts` (mode derived from env, resources on this origin) | prod behind master |
| `GET /api/request-attestation` (Tier 1) | 402, v2 body, Bazaar block present, **`payTo: null`**, `extra.name:"USDC"` | `payTo` = `ESTATE_PAY_TO` (`_x402_config.ts`), `extra.name:"USD Coin"/"2"` | prod behind master — the live challenge is **unpayable** (no address, wrong EIP-712 domain) |
| `GET /api/evidence-bundle` (Tier 2) | **404** | `functions/api/evidence-bundle.ts` exists (OSCAL 1.1.0 assembly of signed leaves) | prod behind master |
| `GET /api/proof?bundle=1` | 402, v2 body, `payTo: null` | passes the advertised accept entry into settlement | prod behind master |
| `GET /api/revenue` | 200, all counts `null` (never 0), "no live settle path yet" | same | REAL and honest |
| `GET /api/eunomia-data` (Tier 3) | not re-probed (previously 402) | v2 challenge + assembled feed | — |
| Settlement (`_x402.ts verifyX402Payment`) | — | fail-closed until `X402_FACILITATOR_URL`; `/verify` **then** `/settle`; grant only on `settle.success`; v1/v2 dialect matched to the client | REAL (code read) |
| Pay-to wallet `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` | Base RPC `balanceOf(USDC)` = **0**; `eth_getTransactionCount` = **0**; Blockscout `token-transfers` = `[]` | — | the wallet has **never** received a USDC transfer. `settled_usdc` really is null. |
| `csoai-gspc-mcp` on npm | `0.1.1`, modified 2026-09-01T09:45Z | 7 read tools, no paid tool | REAL |
| `gspc-card-verifier` on npm | **E404** (`gspc-card-verifier` and `@csoai/gspc-card-verifier`) | `packages/gspc-card-verifier` 1.0.0 Apache-2.0, 37 tests | MISSING — owner `npm publish` |
| Signed corpus | `/signed/card_index.json` → 335 positions, 313 bodies verify, 22 withheld (verifier README) | — | REAL, with the 21-unsigned-tombstone caveat the README states |
| `gh` on this Mac | `gh auth status`: **keyring token invalid**; `gh run list` → HTTP 401; yet `gh pr create` succeeded (PR #1152) via the git-credential path | — | GHA run inspection is blind from here until `gh auth refresh -h github.com`; PR creation works |

**Reading of the table.** The rail described in `docs/REVENUE-LOOPS.md` is real on master but was *not yet
on prod* at probe time. PR #1150 merged at 08:02Z; the probe was 08:04–08:09Z; `deploy.yml` (prerender +
gates) normally takes 20–45 minutes, so this is most likely a deploy still in flight, not a broken pipe.
**Re-probe `GET /api/x402` after ~08:50Z.** If it is still 404 then, the GHA path is starved or the
Cloudflare token is missing (both have happened before — see the deploy memory notes), and step 1 below
becomes "get the deploy through" before anything else.

Also still live and now unadvertised: the separate mock Worker at `pack.councilof.ai` (`X402_MODE=mock`).
Retire or repoint it after the new manifest lands so no agent follows a stale door.

---

## 1. x402 today — and the exact path to the first USDC in the owner's MetaMask

### 1.1 Facilitators that settle on Base mainnet (verified 2026-09-02)

| Facilitator | Account needed? | Base mainnet | x402 versions | Fees | Verified how |
|---|---|---|---|---|---|
| **PayAI** `https://facilitator.payai.network` | **No** for the free tier: "Up to 1,000 free settlements" per receiving wallet, then $0.001/tx; "No API key is required for the free tier" ([pricing](https://docs.payai.network/x402/facilitators/pricing.md), fetched 2026-09-02) | yes | v1 `exact/base` **and** v2 `exact/eip155:8453` | free ≤1,000 settlements, then $0.001 | `GET /supported` lists both kinds; unauthenticated `POST /verify` with a junk body returned **HTTP 400 `invalid_payment_requirements`** — i.e. reachable without auth (a keyed endpoint would 401) |
| **Coinbase CDP** `https://api.cdp.coinbase.com/platform/v2/x402` | **Yes** — CDP API key; `GET /supported` without a key → **401 Unauthorized** (probed) | yes | v1 + v2 | "first 1,000 onchain Facilitator transactions each month are free, then $0.001" ([wavect comparison](https://wavect.io/blog/x402-payments-comparison-2026/), [Phemex](https://phemex.com/news/article/coinbase-to-introduce-0001-fee-for-x402-facilitator-transactions-41549)); KYT/OFAC on every tx | doc + probe |
| x402.org public facilitator `https://x402.org/facilitator` | no | **no** — `/supported` lists only `eip155:84532` (Base Sepolia) plus Solana/Algorand/Aptos | v2 | — | probed: testnet-only for EVM |
| MetaMask facilitator (Smart Accounts Kit, ERC-7710 delegations) | MetaMask smart account | yes (Base 8453, Base Sepolia, Monad) | v2, `PAYMENT-SIGNATURE` | UNVERIFIED | [SKILL.md](https://github.com/MetaMask/smart-accounts-kit/blob/main/skills/x402-payments/SKILL.md) — requires smart accounts, **not** a plain EOA, and a different scheme; not a drop-in for our `exact`/EIP-3009 rail |
| xpay `facilitator.xpay.sh` | no key claimed | claimed | — | "zero fees, gas-sponsored" | **UNVERIFIED** (vendor blog only, [xpay](https://www.xpay.sh/blog/article/xpay-x402-facilitator/)) |

**Choice for today: PayAI.** Keyless, mainnet, both dialects our `_x402.ts` speaks, 1,000 free settlements
is more than the estate will see before any of this matters. CDP later, only if Bazaar listing turns out to
be worth a CDP account (see 1.3).

### 1.2 Who actually pays 402s right now (clients)

- **`@x402/fetch` 2.24.0** (npm, modified 2026-08-27) with `@x402/evm` 2.24.0 — a raw viem account pays:
  `wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }] })`
  ([README](https://raw.githubusercontent.com/x402-foundation/x402/main/typescript/packages/http/fetch/README.md), fetched 2026-09-02). Legacy v1 `x402-fetch` 1.2.0 still on npm.
- **Coinbase AgentKit** — `make_http_request_with_x402` / auto-retry on 402 ([agentkit README](https://github.com/coinbase/agentkit/blob/main/typescript/agentkit/README.md)); LangChain/CrewAI/Vercel AI SDK integrations sit on top of it.
- **Vercel `x402-mcp`** — `server.paidTool(name, { price }, schema, handler)`; default facilitator = CDP, CDP-managed wallets on the client side ([Vercel blog, 2025-09-12](https://vercel.com/blog/introducing-x402-mcp-open-protocol-payments-for-mcp-tools); [changelog](https://vercel.com/changelog/402-mcp-enables-x402-payments-in-mcp)).
- **MetaMask Smart Accounts Kit x402 skill** — pays via ERC-7710 delegation (smart accounts only).
- **Open alternatives** — `agentpay-mcp` (non-custodial MCP payment layer, [GitHub](https://github.com/up2itnow0822/agentpay-mcp)); Zuplo/Nodit/Simplescraper guides all use `@x402/fetch` + viem.
- **CDP buyer quickstart** uses `CdpX402Client` (CDP-managed wallet) — a CDP account is needed *for that path*, not for x402 in general ([quickstart](https://docs.cdp.coinbase.com/x402/buyer/quickstart)).

Our 402 body is x402 **v2** (`x402Version: 2`, CAIP-2 network, `PAYMENT-REQUIRED` header) with the v1
fields kept (`maxAmountRequired`, `resource`), and `verifyX402Payment` answers in whichever dialect the
payload declares — so every client above can pay once `payTo` and the facilitator are live.

### 1.3 Bazaar (discovery) — honest state

- Bazaar is CDP's catalogue; it "builds itself from payments it has already settled" through the **CDP**
  facilitator. Discovery reads need no key ([CDP Bazaar docs](https://docs.cdp.coinbase.com/x402/bazaar)).
- Our routes already ship the conformant `extensions.bazaar { info, schema }` block and correctly omit the
  non-existent `discoverable:true` (`docs/X402_BAZAAR_DISCOVERABLE_2026-09-02.md`).
- **Known breakage:** [x402-foundation/x402#2112](https://github.com/x402-foundation/x402/issues/2112)
  (opened 2026-04-23, open, no maintainer reply): a service with 8 settled payments never appeared in the
  catalogue and the documented `EXTENSION-RESPONSES` header is never emitted. The reporter's hypothesis —
  Bazaar indexes only `payTo` wallets under a registered CDP developer account — is **UNVERIFIED**.
- **Therefore:** Bazaar is not a today-lever. Settle on PayAI now; revisit CDP + a CDP-registered payTo only
  if a paying counterparty asks to find us through Bazaar.

### 1.4 The today-path: first USDC landing in `0x2126…ae31` (numbered, owner does every step)

1. **Confirm the deploy shipped.** `curl -s https://councilof.ai/api/x402 | head` → expect `csoai.x402-catalog/0.1`
   with `rail.mode: "challenge-only"` and `pay_to: "0x2126…ae31"`. If still 404 after ~08:50Z:
   `gh auth refresh -h github.com` then `gh workflow run deploy.yml --ref master` and watch it; the
   3-hourly cron (`20 */3 * * *`) is the fallback. Do not `wrangler pages deploy` from the laptop (CLAUDE.md).
2. **Switch settlement on (one env var).** Cloudflare → Workers & Pages → `councilof-ai` → Settings →
   Environment variables → Production → add `X402_FACILITATOR_URL = https://facilitator.payai.network`.
   No `X402_FACILITATOR_TOKEN` needed on PayAI's free tier. Redeploy (any push to master, or re-run
   deploy.yml). `GET /api/x402` → `rail.mode: "live"`.
3. **Confirm the signing key is on Pages.** `BOARD_SIGN_KEY_PKCS8_B64` present in the same screen
   (it is what `/api/board-sign` uses). Without it paid cards ship `sig_ed25519:null` — honest but not what
   a buyer wants.
4. **Optional, makes `/api/revenue` count:** create KV namespace `revenue`, bind as `REVENUE_KV` in
   `wrangler.jsonc`. Without it, counts stay null (never 0) and issuance receipts are not stored.
5. **Fund nothing.** The receiving wallet needs no ETH and no USDC. The buyer signs an EIP-3009
   `transferWithAuthorization` under the token domain `USD Coin`/`2`; PayAI submits it and pays gas.
6. **Self-test purchase from your own wallet (the honest way to do it).**
   - In MetaMask, **create a fresh account** (Account → Add account). Treat it as a *burner*. Never
     export the key of your main account.
   - Send it a few dollars of **USDC on Base** from the main account (Base network in MetaMask; USDC
     contract `0x8335…2913`). No ETH is needed on the burner — EIP-3009 is gasless for the payer.
   - Export **only the burner's** private key (MetaMask → account details → show private key) into a
     local shell variable on your own machine. No agent handles it; it never goes into a repo, a Pages env,
     or a chat.
   - Run, on your machine (Node 20+):
     ```bash
     mkdir x402-selftest && cd x402-selftest && npm init -y >/dev/null
     npm i @x402/fetch@2.24.0 @x402/evm@2.24.0 viem
     cat > pay.mjs <<'EOF'
     import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
     import { ExactEvmScheme } from "@x402/evm";
     import { privateKeyToAccount } from "viem/accounts";
     const account = privateKeyToAccount(process.env.BURNER_KEY);
     const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
       schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }],
     });
     const url = "https://councilof.ai/api/request-attestation?subject=" + encodeURIComponent(process.argv[2] || "qwen2.5:7b");
     const r = await fetchWithPayment(url);
     console.log(r.status, r.headers.get("x-payment-response") || r.headers.get("payment-response"));
     console.log(await r.text());
     EOF
     BURNER_KEY=0x... node pay.mjs qwen2.5:7b
     ```
     (Exact import names are as the `@x402/fetch` README shows on 2026-09-02; if the package has moved
     on, `npx @x402/fetch --help` / the README is the source of truth. Verify the amount in the 402
     `accepts[0].amount` before running — it is the only place a price is stated.)
   - Expected: `200`, a `card-v0` with `surface: "ras.commission"`, `payload.settle.transaction` = a
     Base tx hash, and USDC arriving at `0x2126…ae31` — visible in MetaMask (main account, Base network)
     and at `https://basescan.org/address/0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`.
   - Verify the card at `https://councilof.ai/gspc-verify`.
7. **Book it honestly.** A self-purchase is a *rail test*, not revenue. `/api/revenue` will count it once
   `REVENUE_KV` is bound. Recommended follow-up (small code change, separate PR): treat receipts whose
   `payer` is a declared owner-test address as `test`, excluded from `settled_usdc`. Do not let the first
   number on the revenue surface be a dollar you paid yourself.
8. **Publish the verifier** so a stranger's recompute is a one-liner: `cd packages/gspc-card-verifier && npm publish --access public`.
9. **Retire `pack.councilof.ai` mock** (or 301 it to `/api/x402`) so no agent follows the stale door.

What "our MetaMask" means after step 6: any agent with a funded Base wallet can pay any of the three
tiers with no account, no Stripe, no invoice, and the USDC is in the owner's self-custody wallet within
one block. That is the whole rail. The thing it cannot do is make anyone want to pay — §2.

### 1.5 Tax and VAT facts that come with the first receipt (accountant gate, not counsel)

- HMRC CRYPTO40350: a company that "accepts exchange tokens as payment from customers … will need to
  account for [them] within the taxable trading profits" — sterling value on receipt
  ([gov.uk](https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto40350)).
- VAT is charged "in the normal way" on the service; the token movement itself is exempt/out of scope.
  An anonymous wallet is a B2C customer unless it hands over a VAT number; digital services to non-UK
  consumers raise place-of-supply questions. Below the UK VAT threshold this is moot; the accountant
  decides when it stops being moot ([ICAEW](https://www.icaew.com/technical/tax/tax-faculty/taxline/articles/2024/the-basics-of-taxing-cryptoassets), [Fonoa](https://www.fonoa.com/resources/blog/vat-invoice-requirements-in-the-united-kingdom)).
- Keep the on-chain tx hash + card sha as the invoice record. The chain is the ledger; the card is the
  deliverable.

---

## 2. Demand hunt — who pays for signed measurement or obligation evidence, with a public signal

The pattern across every buyer below is the same: they already spend money collecting *evidence* about
AI systems for someone else (an underwriter, an auditor, the AI Office, an authorising official), and
they cannot manufacture independence themselves. We sell **issuance, assembly and an independent
signature** into their existing evidence flow — never a grade, never a determination.

| # | Counterparty | Public signal (URL, date) | The one-line offer they will understand | Tier |
|---|---|---|---|---|
| 1 | **Armilla AI** (Lloyd's coverholder; Chaucer + Axis capacity; up to $25M) | Runs "performance & accuracy testing, bias, red-team, compliance alignment (EU AI Act, NIST RMF, ISO 42001)" before/alongside cover; deliverable = internal report + seal ([armilla.ai/assessments](https://www.armilla.ai/assessments), fetched 2026-09-02; [Chaucer launch](https://www.insurancebusinessmag.com/reinsurance/news/breaking-news/chaucer-and-armilla-ai-launch-ai-liability-insurance-533243.aspx)) | "An independent, Ed25519-signed, re-runnable measurement leaf per model × axis your assessors can cite in the technical report — you keep the verdict, we supply the bytes." | 1 + 2 |
| 2 | **AIUC / Schellman** (AIUC-1 agent standard; Schellman first accredited auditor, 2026-02-03) | "The vendor chooses its auditor, which collects evidence and writes reports while AIUC conducts the technical testing"; partner categories include *adversarial testing providers* and GRC integrators (Drata, IBM) ([schellman.com](https://www.schellman.com/blog/news/schellman-becomes-the-first-accredited-auditor-for-aiuc-1), [aiuc-1.com](https://www.aiuc-1.com/)) | "A signed observation feed that drops straight into AIUC-1 evidence collection — reliability/safety pillars, no pass/fail, recomputable by the auditor." | 3 |
| 3 | **Munich Re aiSure** | "AI solutions must undergo Munich Re's thorough technical due diligence" before a premium; aiSure pays out on a missed accuracy benchmark ([munichre.com](https://www.munichre.com/en/insights/cyber/the-new-frontier-of-underwriting-ai-risk.html)) | "A frozen-bank, independently signed performance baseline for the model you are pricing — the 'prediction vs outcome' data your SLA trigger needs, from a body with no stake in the outcome." | 2 |
| 4 | **Relm Insurance** (NOVAAI / PONTAAI / RESCAAI, launched 2025) | Products cover bias, IP, regulatory issues for AI vendors ([relminsurance.com](https://relminsurance.com/relm-insurance-launches-ai-suite/)) | "Signed evidence bundle mapped to the obligation your policy names (Art 50/53, DORA, CRA) — observations only, your underwriter keeps the call." | 2 |
| 5 | **Mistral AI** (GPAI provider, Code of Practice signatory) | Pebblous review (2026-08-07): Google/Meta/Microsoft/OpenAI filled the Art 53(1)(d) template; **Mistral, Anthropic, xAI "replaced the boxes with narrative prose"**; AI Office enforcement powers live since 2026-08-02 ([pebblous](https://blog.pebblous.ai/blog/eu-training-data-summary-gap/en/); [WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/european-commission-releases-mandatory-template-for-public-disclosure-of-ai-training-data)) | "An OSCAL-wrapped, signed Article-53 evidence bundle over your public models — third-party observations you can attach to the template, from an EU-adjacent UK body; never a conformity claim." | 2 |
| 6 | **xAI** | Same Pebblous finding (prose, not template) | Same offer as #5. | 2 |
| 7 | **Drata** (AIUC-1 framework integrator, "8,000+ companies") | Listed by AIUC-1 as GRC integrator ([aiuc-1.com](https://www.aiuc-1.com/)) | "License the Tier-3 signed feed as an evidence source your customers connect — every block carries its own signature, nothing is a score." | 3 |
| 8 | **Credo AI** (vendor-risk portal, GenAI Vendor Registry, "AI agents that retrieve evidence") | Product page ([credo.ai/product](https://www.credo.ai/product)) | "A machine-readable, signed third-party measurement feed for your vendor registry — independent evidence your retrieval agents can pull, not a rating." | 3 |
| 9 | **Paramify / RegScale** (OSCAL-first FedRAMP 20x tooling) | FedRAMP RFC-0024 mandates machine-readable (OSCAL) packages by **Sept 2026**; AI/LLM-as-a-service named among the most affected categories ([Quzara](https://quzara.com/fedramp/oscal), [Platform28](https://www.platform28.com/blog/fedramp-20x-complete-guide)) | "OSCAL 1.1.0 assessment-results you can import today — signed observations over public AI components, relevant-to a control, never a finding." | 2 + 3 |
| 10 | **Epoch AI** (benchmarking hub; MirrorCode with METR) | Hiring a *Software Engineer, Benchmarking* to "run and maintain benchmarking infrastructure" ([lever](https://jobs.lever.co/epoch-ai/d172645e-a11f-44a0-88d0-7a989e0a28f6), Dec 2025 brief); eval costs "tens of thousands of dollars per benchmark run" ([EvalEval, 2026-04-29](https://evalevalai.com/research/2026/04/29/eval-costs-bottleneck/)) | "Paid reproduction: we re-run your published eval on a frozen split on our public harness and sign the result; you get an independent replication line for the paper, we get a card." | recompute contract |

Also worth one line each (not in the ten, but real signals):
- **UK AISI / Inspect** — Inspect is the UK's eval framework; the repo already has `inspect-adoption-gate.yml`. Their evals bounty paid "£3,000–£15,000 for a successful task" but closed 2025-03-15 ([aisi.gov.uk](https://www.aisi.gov.uk/blog/evals-bounty)); watch for the next round.
- **Enzai** — its EU AI Act Compliance Framework "continuously measure[s] … AUC, Bias, Fairness through a comprehensive API" ([OECD.AI](https://oecd.ai/en/catalogue/tools/enzai-eu-ai-act-compliance-framework)) — a natural signed-feed consumer.
- **Vanta** — has a formal *integration partner program*; requires an OAuth push integration, not a SaaS tier on our side ([developer.vanta.com](https://developer.vanta.com/docs/guides/become-partner)).
- **GCA (ex-CCS) AI DPS RM6200 + QA & Testing DPS RM6148** — UK public-sector doors for "AI testing" suppliers ([gca.gov.uk](https://www.gca.gov.uk/agreements/RM6200)); ATRS is mandatory for departments and needs evidence behind each record.
- **DataTrails** — SCITT transparency service, co-author of the SCITT reference APIs (draft-ietf-scitt-scrapi, updated 2026-02-04); interop partner for the signed-statement layer rather than a buyer.
- **Hugging Face Community Evals / Every Eval Ever** (Feb 2026) — distribution, not revenue: cross-post signed cards so the corpus is findable where labs look ([HF blog](https://huggingface.co/blog/community-evals)).

**No outreach by any agent.** The owner sends. Each line above is provable via the free verify path,
which *is* the pitch.

---

## 3. Legal, non-speculative income on the value created

Ranked by expected value ÷ effort for a UK Ltd (CSOAI LTD, 16939677) with this estate. "EV" is my
judgement, not a number anyone measured.

| Rank | Line | Eligibility signal for this estate | Effort | Timeline | Gate |
|---|---|---|---|---|---|
| 1 | **UK R&D tax relief** (merged scheme: 20% RDEC, ≈15% net payable for a loss-maker; **ERIS** for loss-making SMEs with ≥30% R&D intensity ≈ 27p per £1) | The harness, fix_loop, signed-attestation chain and frozen-bank measurement are textbook qualifying R&D; the estate is almost entirely R&D spend | Low–medium (accountant + technical narrative; the docs/ tree is the narrative) | Claim with the CT return; **claim notification within 6 months of period end** for a first-time claimant — check the date now | Accountant. Sources: [HMRC merged-scheme guidance](https://www.gov.uk/guidance/research-and-development-rd-tax-relief-the-merged-scheme-and-enhanced-intensive-support), [Limestone Grey](https://www.limestonegrey.com/rd-tax-relief/merged-scheme/) |
| 2 | **Cloudflare for Startups credits** (tiers from $5k up to $350k) | The whole site *is* Cloudflare Pages/Workers/KV; direct application, no accelerator referral needed ([cloudflare.com/startups](https://www.cloudflare.com/startups/), [blog](https://blog.cloudflare.com/expanding-cloudflares-startup-program/)) | Low (one form) | Weeks | None. Credits, not cash — but they replace cash |
| 3 | **Tier-2 evidence bundle to one design partner, invoiced** (`rail: x402-or-invoice` in `_skus.ts`) | Counterparties 1–6 in §2; the deliverable exists on master | Medium (one conversation + one bundle) | 4–8 weeks | Counsel note on the obligation record (`counsel_confirmed` flag already carried per obligation; Art 50 is confirmed, the others ship an honesty note) |
| 4 | **NVIDIA Inception** (free, no equity; DGX Cloud / AWS / Nebius credits, DLI) | Incorporated, <10 years, has a developer and a website; **"cryptocurrency companies" are ineligible** — CSOAI is a measurement body that *accepts* USDC, not a crypto company; say so plainly on the form ([nvidia.com/startups](https://www.nvidia.com/en-us/startups/), [Thunder guide](https://www.thundercompute.com/blog/nvidia-inception-program-guide)) | Low | 2–4 weeks to first response | None |
| 5 | **Innovate UK / DSIT AI assurance money** | £11M AI Assurance Innovation Fund, round 1 "from Spring 2026" ([delivery.ai.gov.uk/29](https://delivery.ai.gov.uk/29/)) — **UNVERIFIED whether round 1 is still open; check the Innovation Funding Service**. *Frontier AI Discovery* (£25–50k Phase 1) closed 2026-06-10 ([IFS 2422](https://apply-for-innovation-funding.service.gov.uk/competition/2422/overview/a5c16dd4-c60d-4cc1-8035-33fe76a52489)) — watch for Phase 2 / next call | Medium–high (bid writing) | Months | None beyond eligibility |
| 6 | **Tier-3 signed feed licence to a GRC vendor** (Drata / Credo / Enzai / Paramify) | Feed exists on master (`/api/eunomia-data?feed=1`); vendors named above ingest third-party evidence | Medium (integration + a licence letter) | Quarter | Licence terms = counsel-light (Apache/CC-BY data + a signed-cadence SLA; no exclusivity, no rank) |
| 7 | **GitHub Secure Open Source Fund** ($10k per project, rolling) | Open-source verifier + MCP server; security-focused programme ([github.com/open-source/github-secure-open-source-fund](https://github.com/open-source/github-secure-open-source-fund)) | Low | Rolling sessions | None |
| 8 | **Paid reproduction / recompute contracts** (Epoch, a university lab, METR-style) | The harness is public; the frozen splits are published; eval costs are now "the new compute bottleneck" | Medium | Per contract | None; it is consulting-shaped income, invoiced |
| 9 | **Bounties / prizes** | AISI evals bounty (closed 2025-03-15; next round unannounced); Anthropic evaluation-development funding (programme exists, **UNVERIFIED** whether currently accepting); MLRC/NeurIPS reproducibility track is credit, not cash | Low to watch | Episodic | None |
| 10 | **Crypto-native public-goods funding** | Gitcoin GG24 distributed ~$1.8M across six mechanisms (Oct 2025); GG25 "lessons carried forward", dates **UNVERIFIED** ([gov.gitcoin.co](https://gov.gitcoin.co/t/gg24-structure-strategy-and-timeline/22878)). **Optimism Retro Funding will not run for at least 12 months** (May 2026, [optimism.io](https://www.optimism.io/blog/retro-funding-2025)). Base Batches 2026 ($10k grants) student-track deadline passed (April) ([basebatches.xyz](https://www.basebatches.xyz/)). Protocol Guild = Ethereum L1 core devs only — not us | Low | Episodic | Grants paid in tokens are trading income at sterling value on receipt (HMRC); a grant is not a security. **Counsel gate only if any programme requires holding/staking/voting a token to receive it** |
| 11 | **GitHub Sponsors / Drips** for `gspc-card-verifier` + `csoai-gspc-mcp` | Set-up is trivial; income is usually small | Low | Ongoing | None |

**Top 5 by EV/effort:** (1) R&D tax relief, (2) Cloudflare credits, (3) one invoiced Tier-2 bundle,
(4) NVIDIA Inception credits, (5) Innovate UK assurance funding. Everything in 6–11 compounds after a
paying stranger exists.

The two facts that unlock the whole list are the ones `REVENUE-LOOPS.md §5` already named: **one paying
design partner** and **one independent third-party recompute of a signed card**. Nothing in §3 is
faster than sending offer #1 or #5 above with the free verify link.

---

## 4. What NOT to do — one line each, and why

| Do not | Why (one line) |
|---|---|
| **Treasury staking / "yield" on the USDC balance as a product** | Under the UK cryptoasset regime, *staking* and *issuing a qualifying stablecoin* become FCA-authorised activities; applications open 2026-09-30, authorisation required from 2027-10-25, unauthorised activity is a criminal offence ([FCA](https://www.fca.org.uk/news/press-releases/fca-sets-landmark-crypto-rules-cement-uks-place-global-hub), [Fox Williams](https://www.foxwilliams.com/2026/07/23/fca-expands-uk-cryptoasset-regime/)). Any yield *product* = COUNSEL GATE, not a step. Holding operating USDC in the estate wallet and converting to GBP for opex is ordinary treasury, not a product. |
| **A CSOAI token, "credits", or redeemable balance** | It is the financial-instrument firewall; a prepaid credit is e-money-shaped and a token is security-shaped in both the UK and US frames. x402 exists precisely so you never need one. |
| **Passing stablecoin "rewards" to buyers or partners** | GENIUS Act §4(a)(11) bars issuers paying yield; the OCC NPRM (2026-03-02) presumes third-party pass-through yield violates it — comment period closed 2026-05-01, final rule pending ([CRS IF13174](https://www.congress.gov/crs-product/IF13174), [Perkins Coie](https://perkinscoie.com/insights/update/stablecoin-interest-yield-and-rewards-occ-proposes-sweeping-regulations-under)). Not our fight. |
| **Revenue-share on ranks, "pay to be measured higher", or any fee from a ranked party tied to position** | A rank is never sold; the moment a ranked party's money correlates with its position the board is worthless and the measurement claim is gone. |
| **Selling a certificate, seal, pass/fail, or "compliant" determination** | Measurement, never certification; `assertNoSaleOfGrade()` throws at import if a SKU tries. Evidence bundles carry `determination: NONE`. |
| **Publishing prices in prose or on the board** | Doctrine + `price-gate`; amounts appear only in a 402 `accepts[]`. |
| **Stripe, SaaS seats, tiers** | Doctrine; also the x402 rail already does account-less metering. |
| **A cash-settled index, prediction market, or "insurability score" product** | Cash-settled anything is derivative-shaped; an index that pays out is a security. The feed is *data*; what an insurer builds on it is theirs. |
| **Running an unregistered custody or exchange function for buyers** | Custody/arranging deals are FCA-regulated activities under the 2026 Regulations; we never hold a buyer's funds — EIP-3009 moves buyer → estate directly. |
| **Mass or automated outreach; fabricated passports; unsolicited badge PRs** | Outreach boundary (`docs/OUTREACH-PACK-2026-09-01.md`); it also poisons the one asset that matters — trust in the signature. |

### Counsel gates (flagged, not recommended)
1. Any *product* whose return depends on holding USDC/ETH/OP or on a treasury position (staking, lending, "yield").
2. Any token, credit, voucher, or redeemable unit issued by CSOAI.
3. Any cash-settled index, trigger, or payout derived from the board.
4. Accepting a grant that requires holding, staking, or governance-voting a token as a condition.
5. Widening any obligation record from `counsel_confirmed:false` to `true` (Art 53, DORA, CRA) — legal gates widen only via counsel.
6. Whether an anonymous x402 buyer must be treated as a B2C consumer for VAT place-of-supply (accountant first, counsel if the answer is "it depends on the buyer's jurisdiction").

---

## 5. Sources (fetched/probed 2026-09-02 unless dated otherwise)

Estate bytes: `https://councilof.ai/api/x402` (404), `/.well-known/x402.json`, `/api/request-attestation`,
`/api/evidence-bundle` (404), `/api/proof?bundle=1`, `/api/revenue`, `/api/health`; Base RPC
`https://mainnet.base.org` (`eth_call balanceOf`, `eth_getTransactionCount`); `https://base.blockscout.com/api/v2/addresses/0x2126…ae31/token-transfers`;
npm registry (`csoai-gspc-mcp`, `gspc-card-verifier`, `@x402/fetch`, `@x402/evm`, `x402-fetch`);
`functions/api/_x402.ts`, `_x402_config.ts`, `_skus.ts`, `x402.ts`, `request-attestation.ts`,
`evidence-bundle.ts`, `eunomia-data.ts`, `revenue.ts`; `docs/REVENUE-LOOPS.md`;
`docs/X402_BAZAAR_DISCOVERABLE_2026-09-02.md`; `packages/gspc-card-verifier/README.md`; `.github/workflows/deploy.yml`.

x402: [PayAI pricing](https://docs.payai.network/x402/facilitators/pricing.md) · [PayAI reference](https://docs.payai.network/x402/reference) · `https://facilitator.payai.network/supported` · `https://x402.org/facilitator/supported` · [CDP Bazaar](https://docs.cdp.coinbase.com/x402/bazaar) · [CDP buyer quickstart](https://docs.cdp.coinbase.com/x402/buyer/quickstart) · [x402#2112](https://github.com/x402-foundation/x402/issues/2112) · [@x402/fetch README](https://raw.githubusercontent.com/x402-foundation/x402/main/typescript/packages/http/fetch/README.md) · [Vercel x402-mcp](https://vercel.com/blog/introducing-x402-mcp-open-protocol-payments-for-mcp-tools) · [AgentKit](https://github.com/coinbase/agentkit/blob/main/typescript/agentkit/README.md) · [MetaMask x402 skill](https://github.com/MetaMask/smart-accounts-kit/blob/main/skills/x402-payments/SKILL.md) · [wavect fee comparison](https://wavect.io/blog/x402-payments-comparison-2026/).

Demand: [Armilla assessments](https://www.armilla.ai/assessments) · [Schellman/AIUC-1](https://www.schellman.com/blog/news/schellman-becomes-the-first-accredited-auditor-for-aiuc-1) · [AIUC-1](https://www.aiuc-1.com/) · [Munich Re](https://www.munichre.com/en/insights/cyber/the-new-frontier-of-underwriting-ai-risk.html) · [Relm](https://relminsurance.com/relm-insurance-launches-ai-suite/) · [Pebblous Art 53 gap, 2026-08-07](https://blog.pebblous.ai/blog/eu-training-data-summary-gap/en/) · [WilmerHale template note](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/european-commission-releases-mandatory-template-for-public-disclosure-of-ai-training-data) · [Credo AI](https://www.credo.ai/product) · [Quzara RFC-0024](https://quzara.com/fedramp/oscal) · [Epoch AI role](https://jobs.lever.co/epoch-ai/d172645e-a11f-44a0-88d0-7a989e0a28f6) · [EvalEval cost note](https://evalevalai.com/research/2026/04/29/eval-costs-bottleneck/) · [AISI bounty](https://www.aisi.gov.uk/blog/evals-bounty) · [Enzai (OECD.AI)](https://oecd.ai/en/catalogue/tools/enzai-eu-ai-act-compliance-framework) · [Vanta partner](https://developer.vanta.com/docs/guides/become-partner) · [GCA RM6200](https://www.gca.gov.uk/agreements/rm6200) · [HF Community Evals](https://huggingface.co/blog/community-evals) · [EU AI Office evaluator workshop](https://digital-strategy.ec.europa.eu/en/news/call-evaluators-participate-european-ai-office-workshop-general-purpose-ai-models-and-systemic).

Income + law: [HMRC merged scheme](https://www.gov.uk/guidance/research-and-development-rd-tax-relief-the-merged-scheme-and-enhanced-intensive-support) · [HMRC CRYPTO40350](https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto40350) · [Cloudflare for Startups](https://www.cloudflare.com/startups/) · [NVIDIA Inception](https://www.nvidia.com/en-us/startups/) · [delivery.ai.gov.uk/29](https://delivery.ai.gov.uk/29/) · [IFS Frontier AI Discovery](https://apply-for-innovation-funding.service.gov.uk/competition/2422/overview/a5c16dd4-c60d-4cc1-8035-33fe76a52489) · [GitHub Secure OSS Fund](https://github.com/open-source/github-secure-open-source-fund) · [Gitcoin GG24](https://gov.gitcoin.co/t/gg24-structure-strategy-and-timeline/22878) · [Optimism Retro Funding pause](https://www.optimism.io/blog/retro-funding-2025) · [Base Batches](https://www.basebatches.xyz/) · [FCA crypto rules](https://www.fca.org.uk/news/press-releases/fca-sets-landmark-crypto-rules-cement-uks-place-global-hub) · [Fox Williams, 2026-07-23](https://www.foxwilliams.com/2026/07/23/fca-expands-uk-cryptoasset-regime/) · [CRS IF13174](https://www.congress.gov/crs-product/IF13174) · [Perkins Coie OCC NPRM](https://perkinscoie.com/insights/update/stablecoin-interest-yield-and-rewards-occ-proposes-sweeping-regulations-under).
