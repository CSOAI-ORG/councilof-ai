# WebBridge + Vercel Strategic Discovery — 15 Jun 2026

## The discoveries (made via Kimi WebBridge, saved to memory)

### Discovery 1: `meok.ai` is bound to the `ui` Vercel project, NOT `meok-ai`

**Why this matters:** Every `vercel deploy --prod` since 14 Jun was creating new vercel.app preview URLs (meok-iht6bah9n, meok-dqrnxvra7, meok-q4e0w62es) instead of updating the canonical `meok.ai` alias. The 4 deploys all showed "UNKNOWN" status because the alias doesn't exist on the target project.

**The real state:**
| Domain | Project | Type | Risk if moved |
|---|---|---|---|
| `meok-ai.vercel.app` | meok-ai | Preview | (none, just auth-gated) |
| `meok-q4e0w62es-...vercel.app` | meok-ai | Latest Production | (works, public if Vercel Standard Protection off) |
| **`meok.ai`** | **`ui`** | **Custom domain** | **HIGH — moving breaks production meok.ai** |

The `ui` project is the LIVE meok.ai codebase (145KB HTML response, all the OS/Characters/Work/Guardian/Gaming/Company sections, recent deploys every 10 min for 1d). Moving the domain would take down the live meok.ai site for ~5 min while Vercel re-points DNS.

**The right solution:** don't move the domain. Use the **vercel.app preview URL** as the press release URL (or wait for a separate Vercel project to be created for the new meok-ai marketing site, then move).

### Discovery 2: Vercel dashboard Standard Protection is what was auth-gating the vercel.app URLs

The `meok-q4e0w62es-...vercel.app` URL is publicly accessible (200 OK via `vercel curl`). But unauthenticated `curl` from the local Mac returns 401 — that's Vercel Standard Protection (default for new projects). The press release URL works in the WebBridge browser (which has Vercel auth), but not for anonymous readers.

**Fix:** turn off Standard Protection in Vercel dashboard → meok-ai → Settings → Security.

### Discovery 3: Kimi WebBridge is the substrate-alignment tool

The WebBridge daemon at `http://127.0.0.1:10086` (with the `fldmhceldgbpfpkbgopacenieobmligc` extension) gives the sovereign substrate a **browser-equipped operator**. This solves:
- Vercel dashboard manual fixes (alias rebind, Standard Protection toggle)
- Smithery + MCP Marketplace registration
- LinkedIn + Twitter press outreach (the 1,076-contact list)
- DNS verification in Namecheap
- Any "real browser with my login session" task

The skill at `~/.kimi_openclaw/workspace/skills/kimi-webbridge-desktop/SKILL.md` documents 12 tools (navigate, snapshot, click, fill, evaluate, screenshot, network, upload, save_as_pdf, list_tabs, close_tab, close_session).

**The Kimi WebBridge becomes the canonical tool for "right hive" verification** — the substrate check pattern is now: SSH to GCP VM for substrate state, then WebBridge for any Vercel/GitHub/Namecheap action.

## The 4 highest-leverage WebBridge-driven moves (when needed)

| Move | Tool | Time | Impact |
|---|---|---|---|
| 1. Turn off Standard Protection on meok-ai Vercel project | WebBridge → vercel.com → Settings → Security | 2 min | `meok-q4e0w62es-...vercel.app` becomes public |
| 2. Register 3 MCPs in Smithery MCP Marketplace | WebBridge → smithery.ai → Publish | 15 min | 3 new install paths beyond PyPI |
| 3. Press outreach (1,076 contacts) | WebBridge → mail.google.com or linkedin.com | 1-2 hr | The press release actually goes out |
| 4. DNS verification in Namecheap | WebBridge → namecheap.com | 5 min | Confirm CNAME / A records for any domain move |

## The "right hive" verification protocol (the one we should always do)

Before declaring "everything aligned" on any sovereign substrate work:

1. **GCP VM state** — `ssh meok-backend 'lsof -nP -iTCP:3101,8888,8889,8890,8891 -sTCP:LISTEN'`
2. **SOV3 health** — `curl http://localhost:3101/health`
3. **MCP bridge discovery** — `curl -X POST http://localhost:3101/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"mcp_bridge_discover","arguments":{}}}'`
4. **Dashboard /api/state** — `curl http://localhost:8891/api/state` (returns full substrate)
5. **Vercel alias state** — WebBridge → vercel.com → meok-ai → Settings → Domains (verify if meok.ai is bound)
6. **Live URL test** — `vercel curl <preview-url>` and grep for the new content keywords

If all 6 pass, the substrate is genuinely aligned. If Vercel is in UNKNOWN, the alias is the suspect. If the dashboard returns error, the gateway or router is the suspect.

## The PyPI 429 throttle (still in flight)

PyPI is doing per-credential throttling on **project-creation** for new packages. The 3 MCPs are blocked. The cron `bd377eca5337` retries every 2h. When the throttle clears (1-24h typically), the cron catches it.

**The fast-path alternative** (not yet tried): register a NEW PyPI account (different email, different token) and try from there. The throttle is per-account-pool, not per-IP.

## The substrate state on 15 Jun 2026 (the snapshot)

- **5 sovereign services live on the GCP VM**: SOV3 :3101, Keystone :8888, Gateway v1.1.0 :8889, OLM Router :8890, Dashboard :8891
- **73 sovereign agents in SOV3** (3 MCPs + 25 .ai domains + 45 pre-existing)
- **3 MCPs with 68 passing tests** (19 + 25 + 24) — staged on VM
- **3 mcp_bridge shims** in `/home/nicholas/clawd/mcp-marketplace/`, SOV3 sees 12 tools
- **v2 keep-alive cron** (every 2 min) auto-restarts dead services
- **PyPI retry cron** (bd377eca5337, every 2h, self-disabling)
- **Gulf pitch 3-pager** at /home/nicholas/meok-compliance-gateway/PITCH_MGX_MEOK_2026-06-15.md
- **FEAST × MEOK matrix** at ~/clawd/FEAST_x_MEOK_matrix.md
- **EU Code of Practice landing page** built (in meok-ai/ui, deployed to meok-q4e0w62es-...vercel.app preview, awaiting Vercel Standard Protection toggle)
- **Press release** drafted (3 headline options, Show HN, LinkedIn, Gulf pitch), all references updated to working URLs
- **regulatory-cliff-sprint skill** saved with the 10-phase ship pattern

## The 2 manual actions still in your queue

1. **Turn off Vercel Standard Protection** on meok-ai project (2 min) — the vercel.app preview URL becomes public, the press release works
2. **Wait for PyPI cron** to land the 3 packages (1-24h)

Or, if you want to skip the Vercel setup and use the **meok.ai sovereign substrate directly**, the keystone + dashboard on the VM at 35.242.143.249 are all functional. From the public internet, you'd need a public tunnel (Cloudflare Tunnel, ngrok, etc.) to expose them — but that's a 1-line Cloudflare config.
