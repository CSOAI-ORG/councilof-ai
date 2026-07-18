# MEOK — All-Hives Distribution & Execution Plan (T-18 to July 4)
**2026-06-16. 30 hives × the distribution stack. Set + executing. Honest about autonomous vs human-gated.**

> Strategy (from the 3 playbooks): distribution is the moat's amplifier. The "Octopus" — one capability, 8 marketplace tentacles. The "Agent Card Network" — make all 30 hives discoverable by ANY agent on Earth. The "Free Tool Flywheel" — each hive's free tool feeds the data moat. Run on the VM, 24/7, cloud-free.

## The 30 hives (one engine, 30 configs)
**flagship:** meok · **governance (12):** csoai, councilof, proofof, accountabilityof, transparencyof, ethicalgovernanceof, safetyof, agisafe, asisecurity, biasdetectionof, dataprivacyof, compliance-gateway · **verticals (13):** fishkeeper, koikeeper, landlaw, optimobile, cobolbridge, commercialvehicle, grabhire, muckaway, planthire, diyhelp, pokerhud, socialmediamananger, loopfactory · **infra (3):** openMCP, openmoe, openpatent

## The per-hive execution unit (the repeatable "hive kit")
Each hive ships 5 things. Generate once, replicate across 30:
1. **A2A agent card** (`/.well-known/agent.json`) — discoverable by any agent ⟶ *executing now (autonomous)*
2. **Free tool** (the flywheel: free calculator/checker → collects vertical data) ⟶ template + per-hive
3. **Landing/conversion page** (Vercel) ⟶ generator exists (`build_hive_conversion_pages.py`)
4. **MCP server listing** (the hive's domain MCP, x402-priced) ⟶ marketplace submission
5. **Verified-compliance binding** (the West-to-East trust layer) ⟶ already live via the engine

## Distribution channels (the Octopus — 8 tentacles)
| Channel | Action | Gate |
|---|---|---|
| **A2A registries** | publish 30 signed agent cards | autonomous ✅ |
| **mcp.so** | list 271 MCPs (install-click optimized) | needs account (gated) |
| **Smithery** | list (production-ready docs) | needs API key (gated) |
| **PulseMCP** | list (newsworthy angle) | submission |
| **GPT Store** | 5+ custom GPTs w/ Actions → MCPs | OpenAI acct (gated) |
| **Claude Skills** | 5 lead-magnet skills per vertical | publish |
| **HuggingFace** | domain models + datasets | acct |
| **Vercel/Cloudflare** | 30 hive pages on edge | autonomous (deploy) |

## The 18-day wave plan (to July 4)
**WAVE A — Discoverability (days 1-4, NOW):**
- ✅ A2A agent cards for all 30 hives (executing) → publish to `/.well-known/agent.json` per domain
- Master agent directory (`agents.meok.ai/index`) — the discovery hub
- Deploy 30 hive landing pages (generator)

**WAVE B — The flywheel + MCP distribution (days 5-9):**
- Free tool per top-5 vertical (fishkeeper health checker, grabhire quote calc, muckaway permit checker, councilof scanner, koikeeper tracker) → data ingestion
- Flywheel ingests gov data (data.gov.uk → per-hive corpus) — *engine live on VM*
- MCP marketplace submissions (mcp.so + Smithery + PulseMCP) — **needs Nick: accounts/keys**

**WAVE C — Monetisation rails (days 10-14):**
- x402 payment headers on every MCP ($0.002/call)
- Verified-compliance `/verified` Stripe-gated per governance hive
- GPT Store + Claude Skills lead magnets

**WAVE D — Train + launch (days 15-18):**
- Free GPU credits land (NVIDIA/DigitalOcean) → train 5 domain models from the flywheel corpus (Unsloth/TRL)
- Benchmark domain models vs GPT-4 (the fundraising proof)
- **JULY 4: launch** — Product Hunt, Show HN, the 8-tentacle blast

## Autonomous (I execute now, on the VM/code) vs Human-gated (Nick)
**Autonomous:** A2A agent cards (×30), landing pages, flywheel ingestion, x402 header wiring, GPT/Skill drafts, IP disclosures, the verified-compliance bindings.
**Human-gated:** marketplace accounts (mcp.so/Smithery/GPT Store), Stripe keys, DNS (openpatent.ai + 9 subdomains), Groq/compute signups, the Hermes patch. *These are the ~22-min kingpin list.*

## Execution order (what I'm doing right now)
1. **Generate 30 A2A agent cards** from the hive configs → the discoverability layer (Wave A, autonomous).
2. Then per-hive landing pages.
3. Then wire x402 + the free-tool template.
The data flywheel is already ingesting in parallel on the VM.
