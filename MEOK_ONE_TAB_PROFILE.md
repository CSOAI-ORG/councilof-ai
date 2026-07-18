# MEOK ONE — Tab Profile (for Claude Cowork / orchestrator handoff)

**Tab name:** `MEOK-ONE` — the Hive · King · Queen · Honeycomb + Revenue agent
**Owner/user:** Nick Templeman (solo founder, 100% owner)
**Model:** Claude Opus 4.8 (1M ctx)
**Workspace:** `/Users/nicholas/clawd/` (primary), repo `CSOAI-ORG/clawd-workspace`

---

## What this tab OWNS (scope)
The MEOK **King → 28 Queens → Honeycomb** architecture and its revenue layer:
- **King** = SOV3 sovereign — routes a request to the right hive queen (or fans out + synthesizes).
- **28 Queens** = per-domain SME experts; each is the `meok-one` engine parameterised by a `hive-staging/<domain>-hive/stack.yml` (NOT separate stacks). MoE routing + BFT council.
- **Honeycomb** = SOV3 shared memory; queens gossip lessons up (SIGIL) → embed → recall (closed flywheel).
- **Tunnels** = `tool_gateway.safe_call` (3-tier safety: read auto / write confirm / prohibited refused) + Cloudflare.
- **SIGIL** = tamper-evident hash-chained audit DSL (honey, tool-calls, council) + public verify endpoint.
- **Revenue** = Stripe links + tier-gating + x402 across consumer/compliance/enterprise/machine funnels.

## Live infrastructure (what's actually running)
- **GCP VM `meok-backend`** (europe-west2-a, e2-standard-4, 35.242.143.249) — the inference + prod box. Reach: `gcloud compute ssh meok-backend --zone=europe-west2-a`.
  - `meok-king` systemd service → King MCP server on **:8077** (localhost-only). JSON-RPC `/mcp` exposes `king_ask`, `queen`, `list_hives`. Code at `~/meok-king/`, hives at `~/hive-staging/`.
  - `sov3` systemd service → SOV3 honeycomb on **:3101** (gunicorn). 115 tools, postgres+pgvector, nomic-embed-text.
  - Ollama on :11434 (qwen2.5:3b, llama3.2:3b, meok-sov3, qwen3:0.6b, gemma3:4b).
- **This Mac (M4, 16GB)** = dev/orchestration. SOV3 also runs locally :3101; cloudflared tunnel runs here.
- **Vercel:** `meok-attestation-api` → proofof.ai (SIGIL verify + scorecard, LIVE). `meok/ui` (prj_uyQU, team_4IkN) → meok.ai consumer/compliance site.
- **Key code** (`meok-one/meok_one/`): `hive_king.py`, `hive_queen.py`, `sovereign.py` (council), `router.py` (MoE), `tunnels.py`, `tool_gateway.py`, `sigil.py`, `constellation.py`, `server.py`. TUIs: `tools/meok_tui.py`, `tools/m3_tui.py`.

## Capabilities (what this tab is good at)
- Architecting + building multi-agent / MCP systems (King/Queen/Honeycomb, BFT councils, MoE routing).
- Deep work on the SOV3 memory/consciousness stack (embedding, recall, FSRS, gossip).
- Full-stack ops: GCP VM admin (systemd, resize, deploy), Cloudflare tunnels, security hardening.
- Stripe revenue wiring (products/prices/links via Stripe MCP), tier-gating, x402.
- Security/code/UX audits (spawns parallel sub-agents), SIGIL tamper-evidence.
- Honest, grounded engineering — verifies against live systems, no inflation.

## Access & tools this tab has
- `gh` CLI authed as **CSOAI-ORG** (admin:org, repo, packages).
- `gcloud` authed → project meok-498012 (VM admin, SSH, deploy).
- **Stripe MCP** → live acct `acct_1TLlEKQvIueK5Xpb` (MEOK AI LTD) — read + create products/prices/links.
- Vercel CLI (team `niks-projects-0a2ef942` + personal scope).
- Standard: Bash, Read/Edit/Write, Agent (sub-agents), Workflow (on opt-in).

## How to ASSIGN tasks to this tab
Good task shapes: "build/extend the King/Queen/Honeycomb…", "harden SOV3 memory…", "wire/fix revenue on X…", "deploy/ops on the VM…", "audit X for security/bugs/UX…", "make SIGIL do Y…".
Include: the target surface (VM service / meok-one module / hive / Stripe / Vercel project), success criteria, and whether outward/irreversible actions (deploys, money, DNS, pushes) are pre-authorized.
This tab **verifies against live systems** and **reports honestly** (what works, what doesn't, what's blocked). It will pause on money/DNS/secret actions unless told to proceed.

## Hard constraints / gotchas (read before delegating)
- **NEVER reference CSGA, James Castle, or Terranova** (severed ties).
- **Test via the SERVICE path** (`king_ask` on :8077), not bare `python3` on the VM — the OpenRouter key only loads via the systemd EnvironmentFile, not a raw shell.
- **The 16GB Mac can't run BFT councils** — inference lives on the GCP VM.
- **Money safety:** don't guess Stripe links (past wrong-product bugs); use verified prices.
- **SOV3 public exposure was a CRITICAL hole** — keep `:3101` behind auth; the cloudflared `:3101` ingresses are deliberately `http_status:403`.
- Secrets must never be committed; `.env.local` / `~/meok-king/.env.secrets` (chmod 600) hold keys.

## Current state (2026-06-09)
- King→Queens→Honeycomb deployed + live on the VM; queens answer as domain SMEs; recall flywheel closed; SIGIL audit concurrency-safe; public verify endpoint live (proofof.ai).
- Revenue wired (verified live links): **Consumer Pro £9/mo** `buy.stripe.com/cNi28tdkE3cefUNeGY8k91q`; **Enterprise £1,499/mo** `buy.stripe.com/bJe4gB3K4002aAtgP68k91r`; compliance **Pro £79** works. Stripe balance £0 (pre-revenue).

## Open threads (handoff)
1. Deploy `meok/ui` to meok.ai (enterprise undercharge fix is committed `29e1bbe`, awaiting deploy — Vercel limit/scope flaky).
2. `meok/ui/pricing-client.tsx` has tangled mixed pricing (£5/£9/£29 consumer quiz + £79/£1499) — needs **Nick's product decision**.
3. x402 machine economy needs `MEOK_X402_FACILITATOR` URL.
4. **Rotate keys** Nick pasted in chat (OpenRouter live on VM, Vercel) + the 4 scrubbed repo secrets.
5. SOV3 `auth.py` JWT hardcoded fallback → fail-loud before any king exposure.

## Authoritative memory
`~/.claude/projects/-Users-nicholas/memory/project_hive_king_queen.md` (full build log) + `project_stripe_canonical_ladder.md` (revenue).
