# 🐝 MEOK-ONE TAB — TOP-HIVE ALIGNMENT CARD
> Copy-paste this whole file to align the top hive (King/SOV3) + any agent tab on everything this tab built. Date: 2026-06-09. Owner: Nick Templeman. Model: Claude Opus 4.8 (1M).

## ONE-LINE
This tab built + deployed the **King → 28 Queens → Honeycomb** system (live on the GCP VM), made the queens real domain SMEs with a closed learning flywheel, hardened it with a concurrency-safe tamper-evident SIGIL audit + public verify endpoint, ran a full security/bug/UX audit (fixed the criticals), and wired live Stripe revenue.

## LIVE STATE (verified 2026-06-09)
| Thing | Where | Status |
|---|---|---|
| King MCP server | GCP VM `meok-backend` :8077 (localhost-only, systemd `meok-king`) | ✅ active, 28 hives |
| SOV3 honeycomb | VM :3101 (systemd `sov3`, gunicorn) | ✅ healthy, reboot-safe |
| Public SIGIL verify | `POST https://www.proofof.ai/verify` | ✅ 200 (tamper-evident) |
| meok.ai (consumer/compliance) | Vercel `ui` project (team niks-projects-0a2ef942) | ✅ live |
| Inference | VM Ollama :11434 + OpenRouter (key on VM) | ✅ cloud councils ~25s |

## ARCHITECTURE (the model — grounded, not metaphor)
- **King = SOV3 sovereign.** One front door (`king_ask`); routes to the right hive queen or fans out + synthesizes. Routing kept thin/stateless.
- **28 Queens = per-domain SME experts.** Each is the ONE `meok-one` engine parameterised by `hive-staging/<domain>-hive/stack.yml` (NOT 28 separate stacks). MoE routing (`router.ask`) + BFT council (`sovereign_council`, system_override = domain-expert persona) + safe tools (`tunnels.safe_call`).
- **Honeycomb = SOV3 memory.** Queens gossip lessons UP as compact SIGIL lines → embedded (nomic-embed-text) → recalled DOWN hive-scoped. Closed flywheel: recall → answer smarter → gossip.
- **Tunnel = `tool_gateway.safe_call`** — 3-tier safety: read auto / write confirm / prohibited refused (now covers drop_table/run_command/wire_transfer/grant_admin/exfiltrate/etc).
- **SIGIL = tamper-evident hash-chained audit DSL** — honey, tool-calls, council. Cross-process file-locked (`fcntl`). `verify_chain()` + public `/verify`.

## KEY CODE (`/Users/nicholas/clawd/meok-one/meok_one/`)
`hive_king.py` (route/king) · `hive_queen.py` (queen: council, gossip `_deliver_to_sov3`, recall `_recall_from_sov3`, expert_sys, name-strip) · `sovereign.py` (council + `system_override`) · `router.py` (MoE; cloud roster gemini-or/deepseek/kimi when OPENROUTER set) · `tunnels.py` · `tool_gateway.py` · `sigil.py` · `constellation.py` (/constellation GEO page) · `auth.py` (fail-loud JWT) · `server.py` (`/mcp`, `/api/king`, `/api/checkout`, `/constellation`). TUIs: `tools/meok_tui.py` (exec console), `tools/m3_tui.py` (M3 auditor; loads AGENTS.md as shared brief).

## WHAT THIS TASK DID (full arc)
1. Reconciled 4 competing architectures → one model; built `hive_king.py`/`hive_queen.py` on the proven `meok-one` engine (reused, not rebuilt; OPENMOE repo is a complementary compliance lib).
2. Deployed King MCP server to the VM (systemd, auto-restart, reboot-safe). Made SOV3 reboot-safe (it was crash-looping on missing gunicorn — fixed).
3. Upgraded VM e2-standard-2→e2-standard-4 (RAM swap was the latency killer: single call 52s→2s).
4. Queens answer as **domain SMEs** (system_override overrides the care-companion persona; verified koi/haulage/EU-AI-Act).
5. Closed the **learning flywheel**: found SOV3 had 982/987 episodes UN-embedded (embedder never installed) → installed nomic-embed-text, backfilled 182 high-value, importance-gated new embeds. Recall now high-signal + hive-scoped.
6. **SIGIL**: honey gossip → compact hash-chained lines (70% fewer tokens), tamper-evident; fixed cross-process chain-fork (file-lock); tool-call audit trail; **public `/verify` endpoint deployed to proofof.ai**.
7. **Fast councils**: wired OpenRouter (key on VM EnvironmentFile) → 144s→25s frontier-MoE BFT councils.
8. **Full audit** (3 parallel agents): **CLOSED a CRITICAL live hole** — SOV3's 115 tools were public+unauth via `sovereign.templeman-opticians.com` (now `http_status:403` in cloudflared). Extended prohibited verbs. Scrubbed 4 live secrets from the repo. Fixed name-strip/sigil/count bugs. `auth.py` fail-loud + `MEOK_JWT_SECRET` set.
9. **Revenue wired** (see below) + enterprise undercharge bug fixed & deployed to meok.ai.

## REVENUE (verified live Stripe links — acct_1TLlEKQvIueK5Xpb "MEOK AI LTD", LIVE, balance £0)
- **Consumer MEOK ONE Pro £9/mo** → `https://buy.stripe.com/cNi28tdkE3cefUNeGY8k91q` (wired meok-one `/api/checkout?tier=pro`).
- **Enterprise £1,499/mo** → `https://buy.stripe.com/bJe4gB3K4002aAtgP68k91r` (NEW clean product; wired enterprise checkout; **deployed to meok.ai**, fixed the £79-undercharge bug).
- **Compliance Pro £79/mo** → `https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t` (existing, works; LAUNCH50 variant = 50% off 6mo).
- meok.ai consumer checkout = auth-gated dynamic Stripe Sessions (`createCheckoutSession`) — functional behind login.
- ⚠️ Pricing is a 3-way conflict across tabs (doc £/$ vs live £79–4950 vs £9 consumer) — **NEEDS NICK'S PRODUCT DECISION** on canonical pricing.

## ACCESS / OPS
- VM: `gcloud compute ssh meok-backend --zone=europe-west2-a`. King code `~/meok-king/`, hives `~/hive-staging/`, SOV3 `~/sov3/`. Secrets `~/meok-king/.env.secrets` (chmod 600: OPENROUTER_API_KEY, MEOK_JWT_SECRET, MEOK_PRO/ENTERPRISE_CHECKOUT_URL).
- gh: CSOAI-ORG (admin). Stripe MCP: live. Vercel CLI: team niks-projects + personal.
- Repos: meok-one work on `CSOAI-ORG/clawd-workspace` branch `claude/meok-one`. meok.ai on `clawd/meok` (main).

## ⚠️ HARD CONSTRAINTS (every tab respect)
- NEVER reference CSGA / James Castle / Terranova (severed).
- Test via the **service path** (`king_ask` on :8077), NOT bare `python3` on the VM — OpenRouter key only loads via the systemd EnvironmentFile.
- The 16GB Mac CANNOT run BFT councils — inference on the VM.
- Don't guess Stripe links (past wrong-product bugs); use verified prices.
- Keep SOV3 :3101 behind auth — the cloudflared :3101 ingresses are deliberately `http_status:403`.
- Never commit secrets.

## OPEN THREADS (handoff — most need NICK input)
1. **Pricing canonical decision** (compliance £79/£1499 vs consumer £9/£29 — which is meok.ai's primary?). → then I make it coherent + deploy.
2. **x402 machine economy**: set `MEOK_X402_ADDRESS` (crypto wallet) + `MEOK_X402_FACILITATOR` (URL). Wrong wallet = lost funds — needs Nick.
3. **Rotate keys** Nick pasted/scrubbed (OpenRouter live on VM, Vercel, GitHub PAT, Stripe live, Google) — Nick's dashboards; paste new OpenRouter key → I update VM.
4. Consider re-enabling SOV3 tunnel BEHIND `X-MEOK-Key` (paid remote capability vs the closed hole).

## AUTHORITATIVE MEMORY
`~/.claude/projects/-Users-nicholas/memory/project_hive_king_queen.md` (full build log) · `project_stripe_canonical_ladder.md` (revenue) · `MEOK_ONE_TAB_PROFILE.md` + `MEOK_HIVE_TUNNEL_HONEYCOMB_MAP.md` (architecture).
