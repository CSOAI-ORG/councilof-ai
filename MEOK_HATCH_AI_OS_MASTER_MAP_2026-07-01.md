# MEOK Hatch → the master map: turn any SaaS / OS / website into a sovereign AI OS

_2026-07-01. Renamed from "SAP" (clashed with SAP SE). **MEOK Hatch** = hatch a sovereign AI as a signed, portable mini-OS. Research-grounded (cited below); honest verdicts throughout._

## The one line
> **Today:** a website is a website; you bolt a chatbot widget on the side (Chatbase/SiteGPT).
> **The new way:** the website *becomes* a sovereign AI OS — you drop in a signed **MEOK Hatch** and it gains an agent (dual-brain, offline/online), a governed + **offline-verifiable identity**, an OS shell + 3D-world body, and it's portable (the same Hatch runs on-device). One artifact, any host.

## The landscape (why this is the moment — cited)
- **Agentic web is standardizing the plumbing:** the **official MCP Registry** (registry.modelcontextprotocol.io, ~2,000 servers) + mcp.so (~20k), smithery, glama, MCP.Directory (one-click install to Claude/Cursor/VS Code/ChatGPT). **NLWeb** (Microsoft: every NLWeb endpoint *is* an MCP server), **WebMCP**, **llms.txt** (~10% of sites), **schema.org/JSON-LD**. `[web-search cited]`
- **Identity/packaging is being standardized:** **AGNTCY** (Linux Foundation) = OASF records as OCI artifacts, Sigstore-signed, DID/VC; **A2A** agent cards; **Letta .af** portable state. `[cited; verifier was rate-limited → treat AGNTCY specifics as strong leads]`
- **Incumbents for "AI on your site" = chatbots:** Chatbase, SiteGPT, SiteSpeakAI, Botpress ($0–50/mo, RAG on your content, one script). `[cited]`

## The honest differentiation (what nobody else has)
Everyone is building **plumbing** (MCP/registries/NLWeb) or **chatbots** (Chatbase). Neither ships:
1. a **sovereign, self-owned, OFFLINE-verifiable identity** (theirs is keyless/CA/OIDC — needs an online authority),
2. **embedded governance** (care-floor + immutable hard-stops) that verifies *with* the identity,
3. a portable **AI-OS experience** (dock + agent + 3D world) that is the *same artifact* on a website, on-device, or in a host.
**MEOK Hatch is the sovereign, governed, portable AI-OS layer that rides the plumbing.** We do not out-standardize the Linux Foundation — we're the trust+experience profile on top. (Same moat as the signed System Card.)

## What a Hatch is (live now)
`os.meok.ai/api/hatch` → one Ed25519-signed artifact: **A2A card + MCP endpoint + Letta .af state + dual-brain (offline/online, L/R) + bootable 3D-OS body + governance**. `?format=af` (Letta import) · `?format=oasf` (AGNTCY-shaped + `meok.sovereign-governance.v1` extension). Verify at `/api/verify`.
Also live: `/api/agentcard` (signed A2A) · `/api/mcp` (MCP server) · `/runner/meok-sap-runner.mjs` (run a Hatch offline on-device, verify offline, offline-first brain) · `/llms.txt` · `/.well-known/agent-card.json`.

## The full roadmap — all remaining steps
**P1 · Core artifact — ✅ DONE** (hatch, agentcard, mcp, verify, runner, oasf export, dual-brain, boot, llms.txt).

**P2 · Discoverability (make agents + the web find it)**
- ✅ `llms.txt`, `.well-known/agent-card.json`.
- ▢ `schema.org`/JSON-LD on the OS pages (agentic-web SEO).
- ▢ **WebMCP surface** (browser-side MCP so a host's in-page AI can call the site's tools).
- ▢ **List on the MCP Registry** + mcp.so + smithery + MCP.Directory → any host one-click-installs the sovereign agent. *(owner: publish/account)*

**P3 · "Hatch-ify any site" — the killer demo (NEXT build)**
- ▢ Extend **`sovereign-embed.js`**: one `<script>` loads a **signed Hatch**, verifies it **client-side (Web Crypto Ed25519)**, mounts the AI-OS layer (dock + agent + optional 3D) + a **"✓ Sovereign-verified SOV:…" badge**. → any SaaS/website becomes a governed AI OS in one line. *(fully buildable now)*

**P4 · Runtime / the mini-PC**
- ✅ on-device runner + ✅ zero-daemon embedded model (`--model`).
- ▢ bundle **Kokoro-82M** (Apache) for the right-brain local **voice**.
- ▢ **per-character memory/persona** in the MCP server (so Aria ≠ Sol).
- ▢ **dedicated VM** body for premium/always-on. *(owner: infra)*

**P5 · Marketplace + business**
- ✅ `/api/registry` (signed index) → grow into a **Hatch marketplace** (browse/verify/install hatches).
- ▢ pricing: free hatch (serverless) · Pro (voice+memory+VM) · white-label (SaaS embeds it) · defence/enterprise (governed, signed).
- Moat vs Chatbase: they sell a chatbot; we sell a **signed, portable, governed AI OS** you own and can verify.

**P6 · Standards leadership (be IN the standard)**
- ✅ sovereign-governance extension drafted (`MEOK_SOVEREIGN_GOVERNANCE_EXTENSION`).
- ▢ verify exact OASF/A2A field names vs `spec.dir.agntcy.org`; open issues on **A2A (#1672)** + AGNTCY proposing an **offline/sovereign signing profile** beside the keyless one.

## Honest risks / caveats
- **Model cost & "AI inside":** the model isn't embedded (weights too big); it's BYO/host/on-device. The *mind + brain-routing + governance + identity* travel signed — that's the honest "AI inside the container."
- **Adoption vs AGNTCY (Linux Foundation):** don't fight it — ride it, contribute the sovereign profile. Our wedge is trust+governance+sovereignty, not packaging.
- **Browser embedding:** CSP/X-Frame-Options; the embed injects a script (not an iframe) — keep it that way.
- **Name check:** "Hatch" alone has other users (Hatch Baby, hatch.co) — **"MEOK Hatch"** as the product name is fine, but do a trademark check before a big public push.
- **`SIGIL_SEED`:** until set, every hatch signs under the demo key — the one owner action that makes the identity permanently *yours*.

## First 3 moves (highest leverage)
1. **Build P3** — the `sovereign-embed.js` Hatch loader + client-side verify badge (the "any site → sovereign AI OS in one line" demo).
2. **Publish to the MCP Registry** (owner) — distribution to every agent host.
3. **Set `SIGIL_SEED`** (owner) — make the sovereign identity real, then open the A2A/AGNTCY extension issue.
