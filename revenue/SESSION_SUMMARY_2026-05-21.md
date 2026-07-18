# Session Summary — 2026-05-21

Single-session work log. What shipped, what's awaiting Nick, what the expected revenue impact is.

---

## 📦 What shipped this session

### 9 new MCPs live on GitHub + the official Anthropic Registry

| # | MCP | What it does | Cliff / driver |
|---|---|---|---|
| 1 | `oasf-agent-directory-mcp` | Bridges MCP / A2A → Cisco AGNTCY Directory (LF) | Cisco Outshift partnership |
| 2 | `eudi-wallet-mcp` | EU Digital Identity Wallet for AI agents (eIDAS 2.0) | EU EUDI rollout 2026 |
| 3 | `agent-replay-debugger-mcp` | Step-debug agent runs + signed audit replay | Anti-loop chain |
| 4 | `agent-incident-relay-mcp` | One incident → 5 regulators (AI Act + DORA + NIS2 + GDPR + ISO 42001) | EU AI Act Art 73 |
| 5 | `mcp-spec-compliance-mcp` | Audit any MCP server.json — meta-viral for MCP authors | 2,000+ MCPs missing cards |
| 6 | `agent-content-watermark-mcp` | Dedicated EU AI Act Article 50(2) watermark MCP | 2 Nov 2026 cliff |
| 7 | `agent-mcp-router-mcp` | One router → 67 MEOK MCPs (solves tool-count ceiling) | Claude Code + Cursor users |
| 8 | `meok-mcp-cardgen-mcp` | Generate signed `.well-known/mcp` discovery cards | Claude Desktop 2.1 + Cursor 2026.4 |
| 9 | `meok-nis2-nl-register-mcp` | Wbni-2 NCSC-NL registration packet | **30 June 2026 deadline** |
| 10 | `meok-x402-wrap-mcp` | 1-line USDC paywall for any FastMCP tool | Coinbase distribution channel |
| 11 | `meok-eu-aigc-icon-mcp` | EU Code-of-Practice icon emitter (C2PA + HTML + ICC + ID3 + video) | 2 Nov 2026 cliff |

**11 MCPs total this session.** All MIT-licensed, all on PyPI + Anthropic Registry. Each ships with passing tests + HMAC-signed attestation + Substrate banner cross-link.

### Site updates (meok.ai)

- `/anthropic-registry` — now lists 67 MCPs across 6 categories (governance/A2A/cybersec/platform/trade/devtool)
- `/a2a` — updated to "20 primitives, 1 signed event" (was 12)
- `/docs` — full developer docs hub generated from data.ts. Per-MCP page at `/docs/[slug]`.
- `/mcp-stack` — NEW bridging page showing how 6 MCPs chain into 1 signed compliance event
- **Nav update** — Marketplace pillar now surfaces `/anthropic-registry`, `/docs`, `/mcp-stack`, `/a2a`, `/governance`, `/cobol`, `/councilof`
- **UTM tracking + share buttons** — `<ShareButtons>` component live on `/a2a`, `/docs`, `/anthropic-registry`, `/governance`. UTM-tagged Stripe links via `withUtm()` helper.

### MCP polish

- "Wire it up" cross-reference block injected + pushed to: `bft-progress-council-mcp`, `agent-token-budget-mcp`, `agent-audit-logger-mcp`, `a2a-governance-bridge-mcp`, `agent-content-watermark-mcp`, `agent-mcp-router-mcp`
- All 11 new MCPs have OG banners committed to `.github/social-preview.png` + `social-preview.png` for HN/X/LinkedIn previews
- All 11 new MCPs are topic-tagged on GitHub (`mcp`, `compliance`, `eu-ai-act`, etc.) for search discovery
- All 11 new MCPs have `homepage` set to relevant Substrate landing page

### Content

- `revenue/SUBSTACK_POST_01_2026-05-21.md` — 1,500-word post: *"Why we built 59 compliance MCPs instead of one big compliance LLM"* (updateable to 67 + 11 new shipments)
- `revenue/SEND_BLITZ_2026-05-21.md` — **one-click Gmail compose URLs** for 25 prospects (NIS2-NL 10 + EU AI Act 5 + OEM 5 + dev community 5)
- `revenue/ANTHROPIC_PROGRAMS_2026-05-21.md` — verified application links for 5 Anthropic/LF programs Nick should apply to
- `revenue/BLEEDING_EDGE_RESEARCH_2026-05-21.md` — bootstrap-ideas research output (8 more MCP gaps + 5 business model copies + 6 standards cliffs)

---

## ✋ What's awaiting Nick (4 quick wins, ~30 minutes total)

### A. Apply to Claude for Open Source — 5 min, **HIGH VALUE** (~$1,200 free Claude)

- Open `revenue/ANTHROPIC_PROGRAMS_2026-05-21.md` → click the one-click compose link for Section 1
- Eligibility: "critical ecosystem" clause via 67 MCPs in Anthropic Registry
- **Deadline:** rolling, capped at 10,000 maintainers — apply before 30 June 2026

### B. Submit 5 MCPs to Anthropic Connectors Directory — 15 min, **HIGHEST VALUE** (in-product Claude UI surfacing)

- `revenue/ANTHROPIC_PROGRAMS_2026-05-21.md` → Section 2 has the email + the 5 MCPs to submit
- Submission form: <https://clau.de/mcp-directory-submission>
- Once approved, MEOK MCPs appear inside Claude.ai's Connectors UI — free distribution to every Claude user

### C. Click 25 Send Blitz emails — 10 min, **DIRECT REVENUE PATH**

- `revenue/SEND_BLITZ_2026-05-21.md` → click each link, review, hit Send
- Conservative 90-day weighted EV: **£1,700-£4,700**
- If 1 NIS2-NL closes (£499) + 1 OEM lands (£500/mo MRR × 12 = £6K) + 1 high-risk deal (£5K one-off): **£11,500 in 90 days**

### D. Reconnect Gmail MCP + rotate 3 exposed keys — 5 min (Task #8, still pending)

- 3 keys flagged in chat history: `VERCEL_TOKEN`, `RESEND_API_KEY`, `GITHUB_TOKEN`
- Reconnecting Gmail MCP unlocks me to **stage drafts directly in your inbox** instead of mailto: links

---

## 💰 90-day revenue projection (this session's work)

| Source | Optimistic | Realistic | Pessimistic |
|---|---|---|---|
| Send Blitz NIS2 NL (10 emails, 30 Jun cliff) | £5,000 | £1,500 | £500 |
| Send Blitz EU AI Act high-risk (5 emails) | £15,000 | £2,500 | £0 |
| Send Blitz OEM partnerships (5 emails) | £12,000 (MRR) | £2,000 | £0 |
| Send Blitz dev community (5 emails) | £500 indirect | £200 indirect | £0 |
| Anthropic Connectors Directory → org sign-ups | £3,000 | £1,000 | £0 |
| Claude for Open Source — recurring credit value | £950 | £950 | £0 |
| Substack post going viral on HN/X | £5,000 | £800 | £0 |
| 11 new MCPs surfacing in MCP author Discord chatter | £2,000 | £400 | £0 |
| **TOTAL** | **£43,450** | **£9,350** | **£500** |

**Realistic: ~£9K in 90 days** if Nick clicks Send Blitz + Anthropic apps this week.

---

## 🎯 Strategic next moves (when this work ships)

### Within 7 days

1. Submit MEOK to **MCPCon Europe CFP** (Sept 17-18 Amsterdam) — "Shipping 67 MCPs solo: what broke, what worked"
2. PR `meok-x402-wrap-mcp` into Coinbase x402 ecosystem directory
3. PR `oasf-agent-directory-mcp` into Cisco AGNTCY samples repo
4. Apply for **Anthropic Economic Futures Research** ($10K–$50K + credits) using the 67-MCP compliance-cost dataset as proposal angle

### Within 30 days

1. Ship 5 more MCPs from the bleeding-edge research list: `meok-ap2-mandate`, `meok-cra-art14-reporter`, `meok-c2pa-durable`, `meok-mcp-stateless-adapter`, `meok-agents-md-lint`
2. Bump 5 top compliance MCPs to v1.1.0 + republish to PyPI with cross-references to /mcp-stack
3. Write the **CRA Article 14 lead magnet** (Sept 11 2026 cliff — same playbook as Article 50 kit)
4. Stand up `api.meok.ai` gateway proper — route all 67 MCPs over HTTP streamable (Task #20)

### Within 90 days

1. **One enterprise OEM customer** — Filigran / Vanta / Drata / Cyberhaven embed the MEOK attestation API at £500-£2,000/mo
2. **First Substack viral post** → newsletter to 1,000+ readers via Buttondown
3. **MCPCon Europe talk** → recorded video → free YouTube/Twitter distribution
4. **First Substrate sign-up** — £499 Governance or £999 A2A through one of the Send Blitz channels

---

## 🛡️ Security + admin (untouched but flagged)

- Task #8: 3 API keys exposed in earlier chat history need rotation by Nick
- Task #20: api.meok.ai gateway scaffold deployed but not fully wiring 67 MCPs over HTTP yet
- Task #7: 3 awesome-mcp directory PRs still need a click (compare URLs were in earlier session notes)

---

## 🧠 Bridges + integrations created

The big strategic move this session was **wiring**, not just shipping. Specifically:

1. The `/mcp-stack` page demos how 6 MCPs chain together into 1 signed compliance event — turning the 67-MCP catalogue into ONE coherent revenue story
2. The `agent-mcp-router-mcp` is the technical glue — one MCP that bundles 30+ MEOK MCPs behind one connection slot
3. The `agent-incident-relay-mcp` is the regulatory glue — one incident drives 5 regimes simultaneously
4. The "Wire it up" stanza is in 6 top-MCP READMEs now, all pointing at `/mcp-stack`
5. The Substrate landing pages cross-link to each other via the nav

These bridges convert "67 things you could use" into "1 thing you should buy" — which is the move that gets a £499-£999/mo customer to commit.

---

*By MEOK AI Labs · CSOAI LTD · UK Companies House 16939677 · MIT-licensed MCPs*
