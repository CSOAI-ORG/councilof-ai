# MASTER RUNDOWN + NEXT 100 MOVES — JEEVES lane · 2026-08-28
# Post-audit · grounded in live state · no guess, no duplication.

## STATE AUDIT (what's done, broken, incomplete)

### ✅ DONE — shipped, live, verified
| What | Surface | Evidence |
|---|---|---|
| 22-axis board truth | councilof.ai/api/gspc + gspc + HF | `22 axis · 22 measured` (0 unmeasured; after #1077) |
| Count-honesty sweep | gspc app.html + llms.txt | 0 stale "12 of 13"/"13 core"/"14 axes" references |
| HF mirror | csoai/gspc-board + 14 per-axis + gspc-bench-results | living-board.json (cite LIVE 22/22) + rwa-registry.json |
| MCP server | gspc /api/mcp + estate /mcp | both live, initialize → tools/list → tools/call proven |
| llms.txt (Grok-first-read) | gspc + HF | corrected from "13 measured" → 22/22 + MCP + RWA + verify |
| Wilson-CI axis cards | gspc renderAxes | live per-axis measured + Wilson 95% CI + n |
| Hero code-snippet (OpenRouter #1) | gspc renderOverview | "Try it — no sign-up, no key, £0" + copyable curl |
| Mobile-first CSS | gspc app.html | <600px card-stacking, centered header, full-width inputs |
| Cache + security headers | gspc _headers | max-age=300, X-Frame DENY, X-Content nosniff |
| Offline verifier | verify-card Action + card logic | VALID/INVALID/UNCHECKABLE proven with forged card |
| RAG corpus corrected | estate harness/rag_corpus.jsonl | 4 appended truth entries (22/22, catalog=11, signed surfaces, OpenSkill) |
| JCS canonicalization (roadmap #1) | gspc signlib | 4 signers now use JCS-correct canon (big-float 1e+100 fixed; 6/6 edge cases pass) |
| Parallel key-consumers | estate harness/rwa-attest/ | etherscan_source_verify.py + rwa_xyz_resolve.py + hf_publish.py (ready, honest when no key) |
| Spray map | estate docs/PRODUCT_DEMO_SPRAY_MAP.md | 11 products × 6 demographics × 364-venue DB × 3 lever orders |
| OpenRouter billing pattern | estate docs/opensRouter billing pattern | reference for Billing.tsx rebuild |

### ⬜ PENDING (owner-gated — Nick's signup/click stack)
| # | What | Owner action | Deadline |
|---|---|---|---|
| O1 | Rotate HF token | hf.co/settings/tokens — revoke `hf_akEsWbqu…` | NOW (exposed in chat) |
| O2 | Restart HF Space leaderboard | hf.co/spaces/csoai/gspc-governance-leaderboard → Settings → Restart | any time |
| O3 | Etherscan API key | etherscan.io/myapikey → "+ Add" → paste key | 30 seconds, free |
| O4 | RWA.xyz API key | app.rwa.xyz or docs.rwa.xyz → API access | may need application form |
| O5 | HF org profile fullname | hf.co/settings/organizations/csoai → set "Council of AI (CSOAI)" + mirror-of-source desc | 1 minute |
| O6 | DRCF Phase 2 response | email drcf@ofcom.org.uk | 2 Sep ⏰ |
| O7 | ICLR 2027 abstract | paper deadline | 18 Sep ⏰ |
| O8 | AIUC technical-contributor application | before 30 Sep | 30 Sep ⏰ |
| O9 | arXiv G6Y9SY reconciliation | deadline PASSED — reconcile | overdue |
| O10 | 68 owner-account signups | the signup stack (filter owner_needed=YES in OUTREACH CSV) | ongoing |

### 🟡 LANE-EXECUTABLE (Claude's lane — not mine, but I audited)
| What | State |
|---|---|
| Billing.tsx | STUB (10 lines, 301 redirect to lobby) — no payment page yet |
| AccountBrief.tsx | BUILT (101 lines, full per-account one-pager with 3D globe) |
| Settings.tsx | BUILT (144 lines, Profile/Org/Notifications/Security/API Keys/Appearance) |
| Payment (stripe) | STRIPE_SECRET_KEY present in ~/.env, BUT Billing.tsx is a stub → no payment surface wired yet |
| Compare.tsx | REWRITTEN (removed unsourced competitor false-cells → claims about US with artifacts) ✅ |
| Verify-card Action | ACTIONS ready, not listed on GitHub Marketplace (owner dash action) |

### ⚠️ BROKEN / DEGRADED
| What | Status | Fix |
|---|---|---|
| www.csoai.org SSL | TLS handshake failure (ticks 320-342) | CF dashboard — Nick |
| csoai.org content drift | serving "Council OS · Measurement (4,543b)" not "Council of AI" | CF dashboard — Nick |
| HF Space | paused (503) | owner restart |
| RWA 5 issuers | Aviva/DCP/JMWH (addr: "r"), ACRED/EURCV (addr: "0x") — not-located honest | needs Etherscan + RWA.xyz keys |
| Billing.tsx | no billing surface (stub) | Claude lane rebuild |
| HF token | exposed in chat | rotate |

### 🔑 KEY INVENTORY (what's present)
| Key | Status |
|---|---|
| STRIPE_SECRET_KEY | ✅ present (payment rail ready) |
| OPENROUTER / ANTHROPIC / OPENAI / GROQ / GEMINI / DEEPSEEK / QWEN / MOONSHOT / STEPFUN / CURSOR / LITELLM | ✅ present (LLM access) |
| KAGGLE_KEY | ✅ present (dataset mirror) |
| HF_TOKEN | ✅ present → ROTATE |
| GSPC_SIGN_PRIV | Cloudflare Pages secret (correct) |
| ETHERSCAN_API_KEY | ❌ missing (blocks EVM source_verified) |
| RWA_XYZ_API_KEY | ❌ missing (blocks RWA address resolution) |

---

## THE NEXT 100 MOVES — 4 levers, in priority order

### LEVER 1: Owner 1-hour blast (O1–O10 — these unblock everything else)
001. **Rotate HF token** (hf.co/settings/tokens, revoke exposed, mint fresh, paste back)
002. **Restart HF Space leaderboard** (one click)
003. **Grab Etherscan API key** (etherscan.io/myapikey, 30s, free)
004. **Apply for RWA.xyz API key** (app.rwa.xyz or docs.rwa.xyz)
005. **Set HF org fullname** (csoai → "Council of AI (CSOAI)")
006. **Send DRCF Phase 2 response** (email drcf@ofcom.org.uk before 2 Sep)
007. **Submit ICLR 2027 abstract** (bench paper, 18 Sep deadline)
008. **File AIUC application** (before 30 Sep)
009. **Reconcile arXiv G6Y9SY** (deadline passed — submit or formally withdraw)
010. **Sign-up stack kick-off** (the 68 owner-signup rows, filter owner_needed=YES)

### LEVER 2: Agent-lane permissionless spray (17 sites, JEEVES + Claude execute)
011. **PyPI csoai publish** (trusted publishing — live, verify + update description to 22/22)
012. **GitHub MCP registry PR** (one genuine PR for `io.github.CSOAI-ORG/gspc`)
013. **awesome-mcp-servers PR** (one entry, correct endpoint)
014. **cursor.directory PR** (rules/prompts listing)
015. **Docker MCP Catalog PR** (server.yaml)
016. **Goose recipes PR** (block.github.io/goose)
017. **VS Code Marketplace publisher** (start 6-month tenure clock)
018. **A2A registry listing** (a2aregistry.org — agent-card endpoint verified)
019. **Codabench RealPDE Track 2** (the today-critical form)
020. **Wikidata item** (Companies House + 2 independent refs, COI declared)
021. **ROR request** (cite Zenodo DOIs as outputs)
022. **Adopt AEF-1** (publish conformance — doc + lane page)
023. **awesome-mcp-servers / Cline MCP Marketplace** (400×400 logo + llms-install.md)
024–027. **HF ZeroGPU verifier Space** (ship the 3-state verifier as a live Space → the "moment IS the marketing")

### LEVER 3: RWA/XRPL resolution (when keys land — JEEVES executes immediately)
028. **Resolve EVM source_verified** (BUIDL/BENJI/ACRED via etherscan_source_verify.py)
029. **Resolve RWA address registry** (10 pending → verified via rwa_xyz_resolve.py)
030. **Cross-check XRPL issuers** (Aviva/DCP/JMWH → xrpl_verify.py probe + web-search)
031. **Update RWA card csoai/gspc-board/rwa-registry.json on HF** (post-resolution)
032–035. **4 XRPL issuer probes** (each Aviva/DCP/JMWH/ACRED → locate or honestly report NOT-located)

### LEVER 4: Billing + account UX rebuild (Claude's lane — the stub → real product)
036. **Billing.tsx rebuild** (from 10-line stub → real billing page: credit balance, usage, top-up, payment method, invoices)
037. **Wire Stripe checkout** (STRIPE_SECRET_KEY present — wire the Paddle/Stripe rails)
038. **Plan/role gating** (Free tier: trust engine forever; Pro tier: metered workflow/scale/assurance)
039. **Inner account dashboard** (overview, API key = the account, usage stats)
040. **Pricing page wiring** (the lobby is built — wire the billing to the checkout)
041–045. **5 end-to-end billing journeys** (free sign-up → measure → top-up → pay → verify payment card)
046. **GitHub Marketplace listing** (actions/verify-card — the one-click listing)
047. **API key management page** (Settings → API Keys page)
048. **Organization settings** (Settings → Organization = the entity a key is under)
049. **Notification settings wired** (to real email/webhook, not stub)
050. **CSOAI Foundation+LTD dual-structure** (entity formation — the blueprint is written, needs execution)

### LEVER 5: Front-end polish + competitive excellence (both lanes)
051. **E2E Playwright suite** across all 44 gspc + 267 estate surfaces
052. **WCAG accessibility audit** (focus-visible, aria labels, keyboard nav)
053. **Responsive audit** (all 267 pages at 3 breakpoints)
054. **Error-state hardening** (every GET should return something meaningful, not a crash edge)
055. **Loading-state polish** (skeleton cards, not "…" placeholders)
056. **Onboarding flow** (a new user's first 5 minutes: land → measure → verify → see the board → understand they're not paying)
057. **Empty-state design** (when a page has no data — honest UNMEASURED card, not white space)
058. **LMArena-style leaderboard** (live Elo/scoreboard on the estate, matching my gspc Wilson-CI cards)
059. **OpenRouter-style model catalog** (sortable columns: axis, accuracy, n, CI, model)
060. **Insurer white-label render** (the insurer role menu → actually fetches the tuned surface)
061. **Regulator white-label render** (ditto — free forever, branded)

### LEVER 6: Data + measurement engine (the 24/7 grind)
062–070. **Post-#1077:** financial/domain axes are MEASURED on LIVE GET. Keep risk-verdict UNMEASURED honesty; do not invent composites. (Historical wave text referred to 7 empty slots — retired.)
071. **Jail bank freeze** (the jailed-model evidence pack — frozen bank, consent gate, signed card)
072. **McNemar paired-test pipeline** (the differentiation nobody else publishes — re-probe every axis)
073. **OpenSkill multi-team rating** (wire the validated k=3 Plackett-Luce into the leaderboard — replaces pairwise Elo for team/swarm populations)
074. **Inspect AI harness integration** (UK AISI primary evaluation — sign each run as MEASUREMENT with config digest + instrument version)
075–080. **6 per-axis gold-bank updates** (refresh the frozen measurement banks with the latest data)
081. **Ongoing RWA re-measurement** (every 30 days, re-probe on-chain instruments — the living audit)
082. **Honey/flywheel data** (91,716 rows — republish to HF with updated 22/22 framing)
083. **AI-economy indices** (13.48% Eurostat, 57.58% World Bank — publish with signed evidence pack)
084. **RAG corpus refresh** (sync the corrected corpus to HF as a dataset)
085. **HF DOI minting** (every HF dataset gets a Zenodo-linked DOI — the cite-us flywheel)

### LEVER 7: Standards + memberships (early-signals + warm intros)
086. **BSI ART/1 application** (Nick as named expert → UK mirror of ISO SC 42, £0 — THIS WEEK)
087. **OpenSSF model-signing membership** (lane submits, free)
088. **OWASP AI/MCP membership** (lane submits, free)
089. **AI Verify Foundation** (lane submits, free)
090. **LF x402 Foundation** (track — membership pending)
091. **IETF internet-draft submission** (draft-nicholas-ai-measurement-attestation-00 — Nick submits via datatracker)
092. **NLnet NGI Zero** (call opens 3 Sep, UK eligible — Nick submits via portal)
093. **NIST AI Consortium letter of interest** (rolling — Nick sends)
094. **DSIT Portfolio of AI Assurance Techniques** (draft → Nick sends before 30 Sep)
095. **EIC Accelerator Step 1** (grant-only UK, ≤€2.5M non-dilutive — Nick applies, 2 Sep / 4 Nov cut-offs)

### LEVER 8: Business + revenue (the pipes behind ClaimGuard)
096. **x402 payment rail live-test** (USDC/Base, X402_USDC_RECEIVER → a real paid card flowing)
097. **Paddle/Stripe live-flip** (go from test to real — `keystone sync-vercel`)
098. **Insurer deck** (4 tailored one-pagers — AIUC-1, Armilla, Munich Re, HSB)
099. **Bond-desk data product** (signed asset-level assurance on >$450B AI-linked debt)

--- 100th move ---
100. 💎 **Quarterly truth-verification pass: the "100% 100/100" moment** — curl every surface listed here, verify every count derives from `/api/gspc`, confirm no stale numbers, run the verify-card Action against a freshly-signed card and a forged one, spot-check HF + MCP + llms.txt. **A checker that cannot observe its own failure is not a check.** Run this on day 90.

---

## For Nick: your 1-hour blast (do now, order matters)
1. **hf.co/settings/tokens** → rotate the exposed token → paste fresh token here
2. **hf.co/spaces/csoai/gspc-governance-leaderboard** → Settings → Restart
3. **etherscan.io/myapikey** → "+ Add" → paste ETHERSCAN_API_KEY here
4. **app.rwa.xyz** → check for API access / apply → paste RWA_XYZ_API_KEY here
5. **hf.co/settings/organizations/csoai** → fullname "Council of AI (CSOAI)"
6. **marvelapp.com/privateemail → drafts** → DRCF Phase 2 email (2 Sep deadline)

## For JEEVES (me): after Nick's blast
When keys land → execute etherscan_source_verify.py + rwa_xyz_resolve.py immediately.
When HF token rotates → sync any remaining datasets.
Continue permissionless spray waves. Continue E2E testing.
