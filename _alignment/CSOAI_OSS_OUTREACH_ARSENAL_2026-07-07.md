# 🗡️ CSOAI Sovereign Outreach/Distribution — OSS Arsenal (deep-research, 2026-07-07)

Fan-out deep research: 6 angles → 26 sources → 111 claims → 25 adversarially verified.
**15 claims confirmed 3-0.** The 3 academic findings were finder-extracted from real arXiv papers
but their verifiers hit the session limit (errored, NOT refuted) — treat as **high-confidence,
not-yet-adversarially-confirmed**. License flags are for SaaS-wrapping (AGPL/GPL = copyleft risk).

## 1. Autonomous AI SDR / sales agents (OSS)
| Tool | License | Stars · pushed | MCP? | Note |
|---|---|---|---|---|
| **iPythoning/b2b-sdr-agent-template** | **MIT** ✅ | 135 · Jun 2026 | — | 10-stage pipeline, 10 cron jobs, 4-engine memory, WhatsApp+Telegram+Email. **Newer/more complete than kaymen99** (336★ but stale Jan 2025). Built on OpenClaw. |
| kaymen99/sales-outreach-automation-langgraph | MIT | 336 · Jan 2025 | — | Solid but stale (from earlier pass). |
| HuggingFace "Top 30 OSS lead-gen/outreach" (Sami Halawa) | — | curated list | — | The single best expansion map beyond the obvious repos. |

## 2. Clay replacement / enrichment (OSS)
| Tool | License | Stars · pushed | Note |
|---|---|---|---|
| **Othmane-Khadri/YALC-the-GTM-operating-system** | (verify) | 253 · Jul 2026 | AI-native, **CLI-first GTM OS** — most-starred active open Clay alt. |
| **BraaMohammed/bricks** | (verify) | 39 · Jun 2026 | **Fully-local** Clay.com alt with AI agents (TS). |
| **Fire Enrich** (Firecrawl) | **MIT** ✅ | 1.2k · Oct 2025 | Email → company profile + funding + tech stack. Staler. |

## 3. GEO / AEO citation tools ⭐ (CSOAI's #1 gap)
| Tool | License | Stars | MCP-native? | Verdict |
|---|---|---|---|---|
| **Auriti-Labs/geo-optimizer-skill** | **MIT** ✅ | 566 · v4.14.0 Jun 2026 | **YES — 10 MCP tools** (geo_audit/fix/citability/schema_validate/gap_analysis/trust_score…) | **★ THE pick** — plugs straight into SOV3, SaaS-safe |
| danishashko/geo-aeo-tracker | MIT ✅ | — | No (Next.js app) | Tracks 6 engines (ChatGPT/Perplexity/Gemini/Copilot/Google-AIO/**Grok**); good dashboard, not agent-callable |
| GetCito | MIT ✅ | — | No | Monitor/optimize across ChatGPT/Perplexity/Gemini |

## 4. Web agents / scraping (OSS)
| Tool | License | Stars | MCP? | Note |
|---|---|---|---|---|
| **Firecrawl core** | **AGPLv3** ⚠️ | **147k** · Jul 2026 | via server | Copyleft — **caution SaaS-wrapping**; use the API/MCP not a fork |
| **Firecrawl MCP server** | **MIT** ✅ | 6.9k · Jul 2026 | **YES** | Scrape+search into Claude/SOV3 |
| Skyvern / browser-use | AGPL / MIT | (earlier pass) | Skyvern MCP-ready | Vision browser agents |

## 5. Email deliverability (self-hosted)
| Tool | Role | Cost signal |
|---|---|---|
| **Postal** | Self-hosted **Postmark** — outbound sending, IP-pool, delivery tracking, webhooks | **Best for programmatic outreach at scale** |
| **Mailcow** | Full mail server | **$5 VPS ≈ Mailgun volume; saves $840–3,000/yr** at 50K–500K/mo |
| **Listmonk** | Go+PG single binary | **millions of subs on a $20 VPS**; basic (single-step) automation only |
| Stalwart | Modern Rust MTA | newer alt |
> Honest: deliverability = **you own domain reputation + warmup** (SPF/DKIM/DMARC/BIMI). This is the hard part, not the software.

## 6. Non-English / global OSS
| Tool | Note |
|---|---|
| **jnMetaCode/agency-agents-zh** | **266 plug-and-play AI agent roles**, 20 depts; **50 original agents wired to Chinese channels** (Xiaohongshu/Douyin/WeChat/Feishu/DingTalk) + a DAG orchestrator |
| Qwen-Agent (Alibaba) | ~16.7k★, MCP integration *(finder claim, verifier errored — verify)* |
| deepseek-ai/awesome-deepseek-integration | Chinese integration ecosystem map |

## 7. Academic — how to actually win citations (arXiv; finder-extracted, high-confidence)
- **GEO: Generative Engine Optimization** — Aggarwal et al., **arXiv:2311.09735** (KDD 2024). The foundational paper + GEO-BENCH (10k queries). **GEO tactics can lift visibility up to +40%.**
- **Citation mechanics** — **arXiv:2604.25707**. 🔑 **ChatGPT cites *few* sources (6.88) but each has high influence (0.27); Perplexity cites *many* (16.35) at low influence.** *Exposure ≠ absorption — optimize/measure them separately.* **Q&A formatting alone does NOT help (−5.74%)** — refutes a common AEO myth. What wins absorption: **length, modular structure, semantic alignment, and extractable evidence (definitions, numbers, comparisons, procedural steps)** — "evidence-container design."
- **LLM persuasion** — **arXiv:2411.06837**. LLMs reach **human/superhuman persuasiveness**; governed by interaction approach, model scale, prompt design, **personalization**, and **whether AI authorship is disclosed** (CSOAI's care-floor → disclose = the honest + compliant lane).

## ▶️ The "build-the-machine" 12-component shortlist (ranked)
1. **geo-optimizer-skill (MCP)** — GEO tracker/fixer wired to SOV3 ⭐ #1 leverage (closes the CSOAI invisibility gap).
2. **n8n** (you have it) — orchestration glue.
3. **Postal** — self-hosted sending MTA + warmup.
4. **Listmonk** — broadcast lists.
5. **Firecrawl MCP** (MIT) — scrape/search into SOV3.
6. **Fire Enrich / bricks** — local lead enrichment (Clay replacement).
7. **iPythoning/b2b-sdr-agent-template** — SDR pipeline reference.
8. **Twenty CRM** (MCP-native, earlier pass) — system of record.
9. **Postiz** (earlier pass) — social distribution.
10. **Mautic** — nurture automation.
11. **agency-agents-zh** — non-English channel agents (if China GTM).
12. **P9 "Governed Outbound"** (your L0 spec) — sign every send; the CSOAI moat.

## ⚠️ Honest gaps (no good OSS equal yet)
- **No turnkey "AI SDR in a box"** matching Instantly/Clay polish — the OSS path is *assembly via n8n* (more work, sovereign).
- **GEO OSS is real + MCP-native** (geo-optimizer-skill) — but the *content* is the moat, not the tool (see the crosswalk linkable-asset).
- **Firecrawl core + Skyvern are AGPL** — safe to self-host, risky to closed-SaaS-wrap; prefer their MIT MCP servers / APIs.
- **Deliverability + domain reputation** has no software shortcut — care-floor-gated, consented, disclosed outreach is both the compliant *and* the effective path (per the persuasion paper).
