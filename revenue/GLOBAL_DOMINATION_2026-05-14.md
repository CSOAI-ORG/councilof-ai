# Global Domination Distribution Surfaces — 2026-05-14

> Status as of end of 2026-05-14 session. All channels positioned. Compounding effects begin once the registry publish goes through and Nick clicks the 6 human-only buttons.

---

## ✅ What shipped today (this session)

| Surface | State | Detail |
|---|---|---|
| **npm: `meok-setup`** | LIVE | `npx meok-setup --pack {governance,a2a,trade,industry,cybersec,all}` |
| **PyPI: 34 governance MCPs** | LIVE | Patch-bumped, `readme = "README.md"` set so PyPI hosts the README + ownership marker |
| **GitHub: CSOAI-ORG** | LIVE | 38 repos created/polished, org profile README pushed |
| **Official MCP Registry** | ⏳ | Auth in flight, 34 packages queued to publish — watcher auto-fires on Nick's auth |
| **meok.ai /mcp/[slug]** | LIVE in commit, deploying | 38 SEO-rich detail pages — closes a sitemap 404 leak |
| **meok.ai widgets** | LIVE in commit | `meok-trust-bar.js` + `scorecard.html` — drop-in distribution |
| **Blog: 38 MCPs in 3 weeks** | LIVE in commit | Build narrative |
| **Blog: Article 50 + C2PA + Sigstore** | LIVE in commit | Technical pillar for the 2 Nov 2026 cliff |

Commit: `64d74d2 feat: 38-MCP catalog page + 2 blog posts + 2 drop-in widgets`

---

## 🌍 Distribution channel inventory

### Top of funnel (discovery)
1. **MCP Registry** — primary discovery surface. PulseMCP + Glama + Smithery + mcp.so all sync from here. One publish cascades to ~6 directories within a week.
2. **Awesome lists** — wong2/awesome-mcp-servers, appcypher/awesome-mcp-servers. Blocked on `gh auth refresh -s public_repo,repo` cross-org PR permissions (verify now that scopes look complete).
3. **GitHub: CSOAI-ORG** — org profile README is the public landing for the suite; deep-links to each repo + npx meok-setup.
4. **meok.ai/mcp/<slug>** — per-MCP SEO-rich detail pages with install + Claude Desktop config.

### Search-engine surfaces
1. **Google Search Console** — sitemap submitted (status: verify resolves).
2. **Bing Webmaster Tools** — needs Nick action: bing.com/webmasters → import from Google or add `https://www.meok.ai` manually.
3. **Brave Search / DuckDuckGo / Kagi** — passive: they crawl public pages.

### Social / community
1. **Show HN** — drafted (`revenue/SHOW_HN_*.md`). Nick action: build comment karma first (5–10 thoughtful comments).
2. **r/mcp + r/LocalLLaMA + r/programming** — drafted pitches in revenue/.
3. **HN front page** — only fires once karma is up; meanwhile post in Ask HN threads.
4. **LinkedIn** — Nick's account self-deleted under James Castle's manipulation. Recovery form drafted at `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md`. Without LinkedIn, fall back to Twitter/X + Mastodon + Bluesky.
5. **Twitter/X** — needs 1-tweet announcement per pack (5 tweets, drafts in `revenue/`).

### Direct outreach
1. **CRM**: 50 prospects, 5 OEM emails sent (April 27).
2. **Care homes**: 50-strong cold list ready in `revenue/CARE_HOME_COLD_LIST_2026-04-29.md`. Nick action: 2h with Apollo + Smartlead.
3. **Trade press**: 5 pitches ready in `revenue/PRESS_PITCHES_2026-04-29.md`.
4. **NIS2-DE Mittelstand**: cold-mail batch ready, deadline this month.

### Trust + conversion
1. **meok-verify.vercel.app** — public attestation verifier (live).
2. **meok.ai/scorecard** — 60-sec readiness scorecard (live).
3. **meok-compliance.vercel.app** — conversion landing page (live).
4. **councilof.ai** — 4-tier ladder (live).

### Newsletter / nurture
1. **Buttondown: meok-eu-ai-compliance-brief** — Issue #1 drafted, Issue #2 draft saved. Nick action: sign up + send #1.

### Paid acceleration (optional)
1. **Google Ads** — high-intent keywords like "EU AI Act Article 50 compliance", "DORA implementation tool".
2. **LinkedIn Ads** — once Nick's account is back, sponsored posts to AI risk officers.
3. **Sponsorships** — MCP Discord, AI Engineer Foundation newsletter.

---

## 🎯 Next-level moves (the global domination tier)

### Tier 1 — within a week (compounding effects)
- **MCP Registry publish completes** → cascades into PulseMCP + Glama + Smithery + mcp.so within 7 days
- **Show HN with karma built** → top-of-page exposure to AI engineers
- **First Buttondown issue sends** → starts an owned audience
- **First 50 cold emails go out** → first replies = first revenue

### Tier 2 — within a month (multiplier effects)
- **Press placement** in one of: The Register, TechCrunch EU, Sifted — produces a 30-day search demand spike
- **YouTube demo videos** — one per pack, 3-5 min each; high CPM in compliance niche
- **Conference proposal accepted** — AI Engineer Summit, NeurIPS workshop, EU AI Forum
- **Innovate UK grant submission** — £4.5M ceiling, 27 May 2026 deadline

### Tier 3 — within a quarter (moat effects)
- **First enterprise design partner** — typically a Tier-1 EU bank or pharma → reference + case study
- **C2PA / Coalition for Content Provenance membership** — credibility moat
- **EU AI Act notified-body adjacent positioning** — if a notified body wants automation, MEOK is at the table
- **First 100 paying customers** — flywheel: each customer = trust signal + word-of-mouth + case-study

### Tier 4 — exit / dominance
- **NLnet grant + Innovate UK grant** stack to ~£35K + ~£500K dilution-free runway
- **Sovereign defence variant** (private Dagon repo) — restricted-tier pricing for HMG/MoD
- **Acquisition signal** from one of: Drata, Vanta, OneTrust, BigID, Securiti

---

## 🚫 Blockers / Nick-only actions

### Tier 0 — one-click actions (90 sec total)

These 9 PRs and 1 device auth are all queued. Click each link → green "Create PR" button.

| # | Action | Stars | URL |
|---|---|---|---|
| 1 | **MCP Registry auth: enter `D247-E0B1` at github.com/login/device** (watcher re-armed, fires 38 publishes instantly. Previous codes C1AC-46EC, ACFD-EA43, B43C-5405 expired) | — | https://github.com/login/device |
| 2 | PR to **punkpeye/awesome-mcp-servers** (FLAGSHIP) | 86,853★ | https://github.com/punkpeye/awesome-mcp-servers/compare/main...CSOAI-ORG:awesome-mcp-servers:meok-governance-suite?expand=1 |
| 3 | PR to **appcypher/awesome-mcp-servers** | 5,538★ | https://github.com/appcypher/awesome-mcp-servers/compare/main...CSOAI-ORG:appcypher-awesome-mcp-servers:meok-governance-compliance?expand=1 |
| 4 | PR to **wong2/awesome-mcp-servers** | 4,059★ | https://github.com/wong2/awesome-mcp-servers/compare/main...CSOAI-ORG:wong2-awesome-mcp-servers:meok-governance-suite-entry?expand=1 |
| 5 | PR to **rohitg00/awesome-devops-mcp-servers** | 984★ | https://github.com/rohitg00/awesome-devops-mcp-servers/compare/main...CSOAI-ORG:awesome-devops-mcp-servers:meok-governance-suite?expand=1 |
| 6 | PR to **MobinX/awesome-mcp-list** | 879★ | https://github.com/MobinX/awesome-mcp-list/compare/main...CSOAI-ORG:awesome-mcp-list:meok-governance-suite?expand=1 |
| 7 | PR to **Puliczek/awesome-mcp-security** (5 cybersec MCPs) | 692★ | https://github.com/Puliczek/awesome-mcp-security/compare/main...CSOAI-ORG:awesome-mcp-security:meok-security-suite?expand=1 |
| 8 | PR to **TensorBlock/awesome-mcp-servers** | 677★ | https://github.com/TensorBlock/awesome-mcp-servers/compare/main...CSOAI-ORG:awesome-mcp-servers-1:meok-governance-suite?expand=1 |
| 9 | PR to **PipedreamHQ/awesome-mcp-servers** | 271★ | https://github.com/PipedreamHQ/awesome-mcp-servers/compare/main...CSOAI-ORG:awesome-mcp-servers-2:meok-governance-suite?expand=1 |

**Combined audience: ~100,000 stars of distribution surface.** Even at 30% PR acceptance rate that's exposure to ~30K developers per merged PR.

### Tier 1 — Nick handler actions (longer)

| # | Action | Time | Lever |
|---|---|---|---|
| 10 | Verify haulage.app DNS A-record → 76.76.21.21 (currently parking) | 5 min | Trade-pack domain live |
| 11 | Smithery namespace registration at smithery.ai | 5 min | Smithery distribution unblocks |
| 12 | MCPize GitHub password to grant org-wide app access | 1 min | All 38 MCPs reach MCPize |
| 13 | Buttondown signup + send Issue #1 | 7 min | Newsletter live |
| 14 | 50 care home cold emails via Apollo + Smartlead | 2h | First revenue path |
| 15 | LinkedIn recovery form | 10 min | Unblocks 80+ drafted DMs |
| 16 | NLnet grant submission (deadline 1 June 2026) | 1h review | €30K potential |
| 17 | Innovate UK submission (deadline 27 May 2026) | 2h | £4.5M ceiling |

---

## 📊 Where Stripe stands

Stripe: still £0. Funnel is mechanically complete (server-side tier check, webhook hardened, 100 payment links carry `?redirect=thanks`, attestation signing API live at meok-attestation-api.vercel.app). What's missing is **traffic at the top of funnel**. Every item in Tier 1 above is a traffic injection.

---

## 🔑 The 7-day weighted-EV bet

If Nick completes:
- Items 1, 2, 5, 6 from the blockers (today + tomorrow)
- The registry publish lands and cascades

Then by Day 7:
- ~6 new directories list MEOK
- ~50 cold-email replies (assume 4-8% reply rate → 2–4 conversations)
- ~30–80 newsletter signups from existing site traffic
- Show HN delivers if karma + timing right

Weighted Day-30 EV: **£3–8K cash** + £200–500 MRR seed.
