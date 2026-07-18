# Kimi China Research Brief — find MEOK AI Labs revenue + IP gaps in the Chinese ecosystem

**Date:** 2026-04-26
**Prepared by:** Claude (with Nick Templeman, MEOK AI Labs solo founder, London)
**Target researcher:** Kimi K2.5 (Moonshot AI, Beijing)
**Why Kimi:** Native zh-CN web, Baidu / Zhihu / Xiaohongshu / WeChat indexing, gov / standards / CAC document access, Mandarin technical documentation depth, China-specific MCP / agent / compliance ecosystem visibility that Western models cannot reach.

---

## 0. How to use this brief

Hi Kimi — I am asking you to do **deep web research** on the Chinese AI / compliance / MCP / open-source ecosystem to find revenue, partnership, IP, hardware, and regulatory opportunities for a London-based solo founder running MEOK AI Labs.

**Output format** (return as one Markdown doc):
1. Each numbered question gets its own section.
2. Cite primary sources (URLs in zh-CN are fine — include both 中文 and English translation of the title).
3. Where you find a gap MEOK could fill, mark it with `🟢 OPPORTUNITY:` and add a one-line action.
4. Where you find an existing competitor MEOK should learn from, mark `🔵 COMPETITOR:` with their pricing model.
5. Where you find a regulatory deadline, mark `⏰ DEADLINE:` with the date and what triggers.
6. Where you find a risk / blocker, mark `🔴 RISK:`.
7. Final section: ranked top-15 actions Nick should take in the next 30 days.

If a fact is genuinely unknown or speculative, say so — do not invent.

---

## 1. Who MEOK AI Labs is (full context — read this first)

**Founder:** Nicholas Templeman, sole proprietor, 100% ownership, no investors, bootstrapped from contracting income. Based London, UK. Solo.

**Existing assets (verifiable, all live):**
- **234 Python MCP packages on PyPI** under `MEOK_AI_Labs` user account. Coverage: EU AI Act (Reg 2024/1689 + the post-Omnibus delay regime), DORA (Reg 2022/2554), NIS2 (Dir 2022/2555), CRA (Reg 2024/2847 + Implementing Reg 2025/2392), CSRD (Dir 2022/2464), GDPR, UK AI Regulation framework, ISO 42001, NIST AI RMF, HIPAA, SOC 2, and 5 A2A (agent-to-agent) governance MCPs (rate-limiter, audit-logger, policy-enforcement, handoff-certified, prompt-injection-firewall).
- **Live signing API** at `meok-attestation-api.vercel.app`. Issues HMAC-SHA256 signed compliance attestations with public verify URLs. Migrating to Ed25519 + Sigstore via planned NLnet grant (€30K applied for, decision Sept 2026).
- **Public verifier**: `meok-attestation-verify` (zero-dep Python CLI on PyPI) + `meok-verify.vercel.app` browser interface.
- **Storefronts:** `councilof.ai` (consumer-facing 4-tier ladder), `meok-eu-ai-act.vercel.app` (5,200-word pillar), `meok-compliance.vercel.app` (conversion landing page).
- **6 live Vercel sites** + 1 ZIP host + 28 owned `.ai` / `.org` domains (25 currently routed).
- **Stripe live integration**: 5-tier pricing (£29 Starter / £79 Pro / £1,499 Enterprise / £5K bespoke / £499 one-offs), 100 payment links, 2 launch coupons (MEOKEAT 25% off 3mo, EARLY20 20% forever).
- **Honest revenue:** £0 all-time. Zero customers. Zero subscriptions. The whole stack is built but no outbound has converted yet.

**Adjacent assets:**
- **Sovereign Temple v3.0 / Jarvis** — agentic OS, 75+ MCP tools, 47 agents, care membrane (consciousness gating), local-first (Ollama, MLX, FSRS memory).
- **Asimov v1 humanoid** — open-source humanoid robot, WOLF actuators printing in PA12-CF on a Qidi Max4, target $15K BOM. CSOAI-stamped parts. Berkeley Humanoid Lite influenced.
- **3D printing capacity:** 1× Qidi Max4 (PA12-CF / PA6-CF / TPU mastery). Currently down on blocked filament. Active Facebook interest in printing services. Looking to scale to 3-5 printers.

**What Nick needs from this research:**
1. **Revenue paths into China** — anything from £79/mo subs via Chinese resellers, to consultancy, to white-label, to grants.
2. **Cheap MCPs Chinese devs would buy** — ≤2h build, £9-£29 entry, large addressable niche.
3. **Regulatory crosswalks** — CAC ↔ EU AI Act, PIPL ↔ GDPR, MLPS (等保) ↔ NIS2/DORA, DSL ↔ NIS2 — each crosswalk is a sellable MCP + £499 Kit.
4. **Hardware / printer suppliers** — cheaper printers (Bambu, Qidi, Creality, Anycubic), bulk PA12-CF / PA6-CF filament, robotics actuator cores (Unitree, GalaxBot, LeKiwi clones), gripper / sensor / motor sources.
5. **Bleeding-edge open-source we can fork/integrate** — Chinese AI models (Kimi K2.5, DeepSeek V3.5, Qwen3, GLM, Hunyuan, Doubao, Yi, MiniMax, Stepfun), Chinese RAG/agent frameworks, Chinese MCP-style protocols.
6. **Partner channels** — Alibaba Cloud Bailian, Tencent Yuanqi, ByteDance Coze, Baidu Qianfan, 商汤 SenseTime, iFlytek 讯飞 — do they accept third-party MCPs? Revenue share? Onboarding?
7. **Outbound channels** — where do Chinese B2B buyers go to buy compliance SaaS? What's the equivalent of Show HN, ProductHunt, LinkedIn DM for Chinese decision-makers?

---

## 2. Research questions (answer each in turn)

### Block A — Chinese AI regulatory landscape (the foundation for selling compliance)

**Q1.** What is the current full status (2026-04 snapshot) of China's AI / data / cyber regulations? Map each one with its effective date, regulator, scope, and registration / filing requirement:
- 生成式人工智能服务管理暂行办法 (Interim Measures for the Management of Generative AI Services, Aug 2023)
- 互联网信息服务深度合成管理规定 (Deep Synthesis Provisions, Jan 2023)
- 互联网信息服务算法推荐管理规定 (Algorithm Recommendation Provisions, Mar 2022)
- 个人信息保护法 (PIPL, Nov 2021)
- 数据安全法 (DSL, Sep 2021)
- 网络安全法 (CSL, Jun 2017)
- 网络安全审查办法 (Cybersecurity Review Measures, 2022)
- 数据出境安全评估办法 (Data Cross-Border Transfer Assessment Measures, 2022)
- 个人信息出境标准合同办法 (PI Cross-Border Standard Contract, 2023)
- 网络数据安全管理条例 (Network Data Security Management Regulations — when effective?)
- 等级保护制度 2.0 (MLPS 2.0 / Multi-Level Protection Scheme — current Levels 1-5 thresholds and reassessment cadence)
- GB/T 42755-2023 (AI ethics governance national standard)
- TC260 generative AI safety basic requirements (现行/草案)
- Beijing / Shanghai / Shenzhen / Hangzhou local AI regs (any divergence from CAC?)

**Q2.** What is the **CAC algorithm filing** (算法备案) process today? Which models are in the registry? What does a successful filing dossier contain? Is there any third-party SaaS that automates this filing? Pricing? **🟢 OPPORTUNITY** check: could MEOK ship a CAC-filing-prep MCP?

**Q3.** What is the **CAC GenAI registration** (生成式AI备案) status? Which providers have registered (Moonshot, DeepSeek, Alibaba, Baidu, Tencent, ByteDance)? Public list URL? Foreign companies — can they register? What about UK companies selling into China?

**Q4.** Is there a Chinese equivalent of the EU AI Act's **risk-tier classification** (prohibited / high-risk / limited / minimal)? Map the closest analogue. What about CRA's Class I / II / Annex IV product classifier?

**Q5.** What is the **AI watermarking** rule status in China? The new "AI-generated content labeling rule" (人工智能生成合成内容标识办法) effective from 1 Sept 2025 (per CAC announcement) — exact text, scope, technical requirements, penalties. **🟢 OPPORTUNITY** check: how does it compare to EU AI Act Article 50 (Nov 2026)? Could MEOK's `meok-watermark-attest-mcp` be ported to a CN-WATERMARK MCP?

**Q6.** **MLPS 2.0** — is there a SaaS or MCP that helps companies self-assess their MLPS Level? Pricing of incumbents (启明星辰, 安恒, 绿盟, 奇安信, 360政企, etc.)?

### Block B — Chinese MCP / agent / open-source ecosystem

**Q7.** Are Chinese developers publishing **MCP servers**? To which registries? Is there a Chinese MCP directory equivalent to Glama / Smithery / mcpservers.org? List by traffic.

**Q8.** **Anthropic Claude Marketplace** launched 6 March 2026 with 0% commission — is it accessible from China? What are the China-specific MCP listings? Any Chinese devs already monetising on it?

**Q9.** What are Alibaba's, Tencent's, Baidu's, ByteDance's **agent / MCP / function-calling marketplaces**? Specifically:
- 阿里百炼 (Alibaba Bailian) — third-party plugin/agent submission, revenue share, onboarding URL
- 腾讯元器 (Tencent Yuanqi) — same questions
- 字节扣子 / Coze CN + Coze Pro / Coze Studio — same questions
- 百度千帆 (Baidu Qianfan AppBuilder) — same questions
- 讯飞星火 (iFlytek SparkDesk plugin store) — same questions
- 智谱清言 (Zhipu Qingyan) — same questions
- 月之暗面 Kimi MCP — does Kimi have a public MCP registry?

For each: pricing model, payout currency, foreign-developer onboarding rules.

**Q10.** Top 20 **highest-grossing MCP-style products** built by Chinese teams in last 12 months. Revenue evidence (downloads, MRR, customer logos, news coverage). What are their pricing tiers in CNY? What can MEOK learn from each?

**Q11.** Top 10 Chinese **open-source agent frameworks** (LangChain CN equivalents): MetaGPT, AutoGen China forks, AgentScope (Alibaba), 灵活Agent, ModelScope-Agent, FastGPT, Dify, RAGFlow, etc. Which integrate MCP? Which export attestation-style logs?

**Q12.** Top 5 Chinese **RAG / knowledge-base** SaaS products (FastGPT, MaxKB, RAGFlow, Coze, etc.). Pricing. Does any of them ship a "compliance evidence" feature?

### Block C — Chinese AI models we could integrate / fork

**Q13.** Current state of **open-weight** models from China (license, parameter count, context window, training data provenance, MMLU / GSM8K / HumanEval scores, on-device feasibility):
- DeepSeek V3.5 / R1 / R2 (latest)
- Qwen3 (Alibaba, all sizes)
- GLM-4.5+ (Zhipu)
- Yi-2 (01.ai)
- Hunyuan (Tencent)
- Doubao open-source variants (ByteDance)
- Kimi K1.5 / K2 / K2.5 (Moonshot — what's the public release?)
- MiniMax M1
- StepFun Step-3
- Skywork (Kunlun) latest
- InternLM (Shanghai AI Lab) latest
- Baichuan latest
- Yuan 2 (Inspur / 浪潮)
- 求索 / Search variants

For each: licence terms (commercial use? attribution? export control?). **🟢 OPPORTUNITY** check: which models could power MEOK's compliance MCPs offline?

**Q14.** What is the status of **Kimi K2.5** (you, the model reading this) — public release date? Open weights? Context length? Pricing (Moonshot API)? Multilingual coverage? MCP support?

**Q15.** Are any of these models pre-validated against **EU AI Act requirements** (training data lineage, evaluation, watermarking)? If MEOK adds that validation layer, is there a market?

### Block D — Chinese compliance / trust / GRC SaaS competitors

**Q16.** **Vanta / Drata / Secureframe equivalents in China** — companies selling SaaS-based "trust center" / "compliance dashboard" products for ISO 27001, SOC 2, MLPS, GDPR, PIPL. Top 10 by ARR or funding. Pricing. Sales model (direct / channel partner / consultancy). Foreign customer eligibility.

**Q17.** **PIPL DPIA generators** — does anyone sell a Personal Information Impact Assessment (个人信息保护影响评估) generator? Pricing?

**Q18.** **CBDT (cross-border data transfer)** assessment tools — automated CAC standard-contract generators? PIPL-to-GDPR mapping tools?

**Q19.** **Algorithm filing services** (算法备案代办) — law firms and SaaS that handle CAC filings. Average price per filing? Volume? Top providers?

**Q20.** **GenAI registration services** (生成式AI备案代办) — same questions as Q19.

### Block E — Cross-border opportunities (China ↔ EU / UK)

**Q21.** Chinese SaaS / model / AI-agent companies **selling into the EU** that need EU AI Act, DORA, NIS2, CRA, GDPR compliance. Top 30 by EU revenue. Approach pattern: direct, via EU subsidiary, via partner, via reseller? Who is their EU compliance counsel?

**Q22.** EU / UK SaaS companies **selling into China** needing CAC / PIPL / MLPS compliance. Top 30. Their China entry channel? Compliance providers?

**Q23.** **Cross-border PIPL ↔ GDPR crosswalk** — best public mapping document? Gaps the market hasn't covered? **🟢 OPPORTUNITY** check: a £499 PIPL-GDPR Crosswalk Kit?

**Q24.** **MLPS ↔ NIS2 / DORA crosswalk** — same question.

**Q25.** **CAC GenAI ↔ EU AI Act Article 50 watermarking crosswalk** — same question.

**Q26.** Are there active **Chinese government grant programmes** for AI safety / governance / open-source compliance tooling? National (NSFC, MOST, MIIT), provincial (Shanghai AI Lab, Beijing AAII, Hangzhou DAMO), municipal (Shenzhen, Suzhou)? Eligibility for foreign / sole-proprietor applicants? Foreign-led joint applications?

**Q27.** **Hong Kong** angle — HKMA AI guidelines, Hong Kong Cyberport AI park grants, HKSTP grants, ASTRI partnerships. Eligibility for UK sole proprietor? Easier route to Mainland?

**Q28.** **Singapore** (overlap because many CN companies route through SG) — IMDA AI Verify Foundation status, MAS FEAT principles, AI Singapore grants, AISG-Synapxe partnerships.

### Block F — Chinese hardware / 3D printing / robotics opportunities

**Q29.** **3D printer market for prosumer-to-pro buyer** (Nick currently uses Qidi Max4). Compare current 2026 pricing + capability for these specific use cases (PA12-CF / PA6-CF / TPU at 280-320°C nozzle):
- Bambu Lab X1C / X1E / P1S / H2D
- Qidi Max3 / Max4 / Q1 Pro / Plus4
- Creality K2 Plus Combo
- Anycubic Kobra 3 Max Combo
- Elegoo Centauri Carbon
- FlashForge AD5M Pro / Creator 4
- Snapmaker J1s / U1
- Voron Trident / 2.4 (kit price from CN suppliers)

For each: latest CN-direct price (Taobao / 1688 / TMall), shipping to UK, voltage compatibility (220V), warranty for export units. **🟢 OPPORTUNITY** check: is there a UK reseller with stock? Bulk-buy possibility (3-5 units)?

**Q30.** **PA12-CF / PA6-CF / PEEK / PEKK filament suppliers** in China — eSUN, Polymaker, Sunlu, JAMG HE, FormFutura CN, Bambu Lab native, Qidi native. Compare per-kg cost direct from CN at 5-10 kg quantities. Shipping to UK with proper customs declaration. **🟢 OPPORTUNITY** check: bulk PA12-CF for under £40/kg vs UK £80+/kg.

**Q31.** **Robotics actuator vendors** in China (for Asimov v1 humanoid build):
- Unitree A1 / Go2 / H1 / G1 — buy actuator core only?
- GalaxBot
- HighTorque (LS06 line)
- CubeMars (AK series)
- T-Motor (AK10 / AK60)
- DAMIAO (DM-J series)
- robstride (Robstride 02 / 03 / 04)
- Hangzhou Kollmorgen / Maxon CN clones
- LeKiwi-style hobby actuators

Pricing per unit at 1, 5, 20 quantity. CAN bus protocol availability. Open firmware. Reverse-engineering risk. **🟢 OPPORTUNITY** check: can we hit the Asimov $15K BOM target sourcing 27 actuators from CN?

**Q32.** **6-axis force/torque sensor** suppliers in China — equivalents to ATI Mini40 / Robotous RFT60 — at hobbyist price points.

**Q33.** **Berkeley Humanoid Lite** — are there Chinese clones / forks / parts kits? Sellers on Taobao / 1688?

**Q34.** **Open-source CAD / Slicer / Printer firmware** activity from Chinese teams — Bambu Studio fork status, Qidi Studio fork, OrcaSlicer CN contributors, Klipper CN contributions, custom MCU firmware (Bigtreetech, Fly, MKS, FYSETC). What can MEOK contribute / fork?

### Block G — Outbound channels for Chinese B2B SaaS sales

**Q35.** Where do Chinese **CTO / CISO / Head-of-AI-Compliance** buyers go to discover SaaS tools?
- Zhihu (知乎) — top compliance / AI agent threads, paid promotion, expert posts
- Xiaohongshu (RedNote) — B2B presence today?
- WeChat Business Accounts (公众号) — top accounts in AI compliance / GRC space
- 36kr (36氪) — paid posts, sponsored content
- TigerBrokers / CSDN (开发者社区) — developer reach
- V2EX — startup-focused traction
- 即刻 (Jike) — micro-network founder traction
- Douyin (抖音) — B2B feasibility
- 视频号 (WeChat Channels) — B2B feasibility
- LinkedIn CN (still active?) — B2B reach into CN multinationals

For each: rough audience size, top accounts in our space, paid-promo cost, English-content acceptance.

**Q36.** **Chinese Show HN / Product Hunt equivalents** — best launch channels:
- IndieHackers CN
- Producter
- 创业邦
- 极客公园
- 卡片 (KaPian)
- 即刻 launch threads
- 轻日记
- DingTalk apps marketplace launches

For each: how to launch, what works, peak posting time (Beijing time).

**Q37.** **Chinese B2B trade shows / conferences** for AI / compliance / GRC in 2026 H2 / 2027 H1. Speaker slots, sponsorship costs, attendance numbers, virtual options.

**Q38.** **Chinese consultancies / law firms / Big-4 CN** that resell / white-label AI compliance tooling:
- 君合 (King & Wood Mallesons), 中伦, 金杜, 安杰世泽, 通商, 海问 — AI / data practice partners doing GenAI filings
- 普华永道 China, 安永 China, 毕马威 China, 德勤 China — GRC partner emails
- AI compliance specialist firms — 立信, 京东法律, etc.

What does an introduction-by-cold-DM look like? WeChat vs LinkedIn vs email? Best channel?

**Q39.** **Chinese government / state-owned-enterprise (SOE)** AI procurement — is there any plausible path for a UK solo founder? National SOE list of large GenAI buyers. Procurement channels (政府采购网, 中国招投标网). Are foreign vendors blacklisted? White-label via CN partner?

### Block H — Cheap China-flavoured MCPs MEOK could ship in ≤2h each

For each below: research the demand signal (search volume, registry demand, downstream pain), and propose pricing in £ + CNY-equivalent. Mark `🟢 SHIP THIS` for ones with clear demand and `🔴 SKIP` for ones with poor demand.

**Q40.** `meok-cac-algo-filing-helper-mcp` — generates draft 算法备案 filing dossier from a structured input.

**Q41.** `meok-cac-genai-filing-helper-mcp` — same for 生成式AI备案.

**Q42.** `meok-pipl-dpia-mcp` — PIPL Personal Information Impact Assessment generator.

**Q43.** `meok-mlps-self-assessor-mcp` — MLPS 2.0 Level 1-5 self-assessor with gap report.

**Q44.** `meok-cn-watermark-attest-mcp` — China AI-content labelling rule (per Sept 2025 CAC rule) compliance MCP.

**Q45.** `meok-cbdt-assessor-mcp` — Cross-border data transfer assessment, CN ↔ EU.

**Q46.** `meok-pipl-gdpr-crosswalk-mcp` — provision-by-provision crosswalk + diff.

**Q47.** `meok-mlps-nis2-crosswalk-mcp` — provision-by-provision crosswalk.

**Q48.** `meok-cac-eu-aiact-watermark-crosswalk-mcp` — Article 50 ↔ CN watermark rule mapping.

**Q49.** `meok-tc260-genai-checker-mcp` — TC260 generative AI safety basic requirements checklist.

**Q50.** Other ideas you (Kimi) generate based on Chinese-market-specific demand we should ship.

### Block I — Bleeding-edge open-source intel from China to integrate

**Q51.** Top 20 **trending Chinese AI / agent / MCP / compliance / robotics** GitHub repos right now (last 30 days). For each: stars, primary language, licence, what MEOK could fork / integrate / cite / contribute to.

**Q52.** Top 10 **trending Chinese papers** in AI safety / interpretability / agent governance / watermarking from 2025-2026 (CCF, NeurIPS CN authors, ICML CN authors, ICLR CN, AAAI CN). Each with a one-line MEOK-relevant takeaway.

**Q53.** Top 5 **Chinese AI safety / ethics labs / research groups** (Beijing AI Academy, Shanghai AI Lab, Tencent ARC Lab, Alibaba Tongyi Lab, Baidu IDL, Microsoft Research Asia, MSRA spin-outs). Active research lines aligned to compliance / governance.

**Q54.** **MoE / sparse activation / long-context / on-device** breakthroughs from CN labs in last 12 months that MEOK could leverage for offline-first compliance MCPs.

### Block J — Risks, blockers, and reality checks

**Q55.** What are the **legal risks** for a UK sole proprietor selling SaaS / MCPs into Mainland China?
- VAT / tax registration (do we need a 税号 for receiving CNY revenue?)
- Currency repatriation (SAFE rules on USD ↔ GBP transfer)
- Counterparty risk if reseller defaults
- IP risk (model weights, signing keys)
- Export control (UK / EU dual-use export licences for any cryptography / AI weights shipped)
- Sanctions risk (entity list / SDN intersections)

**Q56.** What are the **reverse risks**: us in the UK touching CN-origin code or weights — UK / EU restrictions, ITAR-style worries, ESG / customer scrutiny?

**Q57.** **Customer concentration / political risk** — what happens if CN-EU relations deteriorate further in 2026-2027? Should MEOK's CN-facing line be a separately-branded entity?

**Q58.** **CN payment rails** — Stripe doesn't accept CNY. Options: WeChat Pay, Alipay, Lemon Squeezy CN, Paddle, 2Checkout CN, Gumroad CN, Chinese reseller. Onboarding cost / FX cost / settlement lag for each. What's lowest-friction for a UK sole proprietor receiving £79 / month CN subs?

### Block K — Top-15 actions ranked

**Q59.** Synthesise everything above into a **ranked top-15 actions** Nick should take in the next 30 days. For each:
- Action description
- Why this rank (what it unlocks)
- Hours required
- Estimated 30-day £ revenue impact (floor / expected / ceiling)
- Specific URLs / contacts / repos to act on

Rank by: (revenue impact ÷ hours) × confidence.

---

## 3. Tone / quality / format guidance for Kimi

- **Be specific.** "There are some Chinese SaaS competitors" is useless. "TrustArc CN, OneTrust CN, and ZuJia 主架 charge ¥99K-¥299K/year for their PIPL-DPIA module" is useful.
- **Cite primary sources.** Government bulletins, the actual CAC website (cac.gov.cn), TC260 PDFs (tc260.org.cn), MIIT (miit.gov.cn), GB-standards portal. Plus pricing pages on actual SaaS sites.
- **Distinguish fact from speculation.** If you don't know, say "I don't know" — do not fabricate.
- **Translate carefully.** zh-CN regulatory terms have very specific English mappings — do not mistranslate. When in doubt, give both.
- **No marketing fluff.** This brief is for executive decision-making. Skip "in conclusion" and "this is exciting" — just facts + actions.
- **Length expected:** 8,000-15,000 English words across all blocks. Shorter than that means you've under-researched.
- **Output filename suggestion:** `KIMI_CN_RESEARCH_OUTPUT_2026-04-26.md` — return as a single Markdown doc Nick can drop into `~/clawd/_TOPOLOGY/CN_RESEARCH_2026-04-26/`.

---

## 4. After Kimi returns this brief

Nick / Claude will:
1. Triage the `🟢 OPPORTUNITY:` flags — pick top 3 to ship within 7 days.
2. Triage the `🔵 COMPETITOR:` flags — pick top 3 to copy / undercut within 14 days.
3. Triage the `⏰ DEADLINE:` flags — block calendar for any sub-30-day deadline.
4. Triage the `🔴 RISK:` flags — escalate to UK counsel where required.
5. Spawn build tasks for the 5 cheapest CN-flavoured MCPs.
6. Cold-DM top 10 CN consultancies / SOE buyers via the most appropriate channel.
7. Order printer + filament + actuator quotes from Q29-Q31 suppliers within 7 days.
8. Submit grant applications to any CN / HK / SG programmes Nick is eligible for.

---

## 5. Honest framing

MEOK has £0 revenue, 234 PyPI MCPs, a working signing API, but no proven sales channel. We are looking for **the cheapest, fastest, most concrete** wedge into Chinese-market revenue or partnership — not a 24-month strategic plan. Bias your output toward shippable actions Nick can take this week, not white-paper-style overviews.

If the answer to "should MEOK enter the Chinese market at all?" is "no, not until X is true" — say so, with X.

— end of brief —
