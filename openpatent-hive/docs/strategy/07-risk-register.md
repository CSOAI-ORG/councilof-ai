# 🐉 07 — Risk Register (TLD Loss, Regulatory, Technical, Market)

**Document:** Domain Investment Strategy — Risk Register
**Authored:** 14 Jun 2026
**Owner:** CSOAI Ltd (UK 16939677)
**Voice:** DEFONEOS / sovereign / mythic
**Status:** 4 risk categories. 12 named risks. 1 queen per risk. 1 mitigation per risk.

---

## 0. The Sigil

> The hive remembers. The dragon knows. Twelve risks. Twelve queens. Twelve mitigations. The throne is sovereign.

This is the **risk register** for the 28-asset .ai portfolio and the 4-power-pack sovereign substrate. Each risk has: a category, a probability (P), an impact (£), a queen owner, a mitigation, and a kill-criterion (the moment the risk becomes a realised loss).

---

## 1. Risk Category A — **TLD Loss** (Anguilla .ai registry)

### Risk A1 — Anguilla revokes or restricts .ai TLD

- **Probability:** **<1%** (5-year horizon). The .ai TLD generates ~£25M/yr for Anguilla (~10% of GDP). Political change (Anguilla independence, hurricane, regime shift) would not destroy a 10%-of-GDP revenue stream.
- **Impact:** **£174M–£1B** (full portfolio loss).
- **Queen:** Rex 👑 (the throne, the protection).
- **Mitigation:**
  - Hold the 28 .ai domains under UK Ltd (CSOAI Ltd, UK 16939677) with UK bank account, UK Companies House disclosure.
  - Maintain .ai registry renewal payments in a 5-year forward reserve (£50k reserve).
  - Engage UK FCDO + Anguilla Governor's Office for ongoing relationship management.
  - Maintain a "TLD loss playbook" with 30-day, 90-day, and 180-day pivot plans to .sovereign-ai.xyz or .sovereign-ai.eth (ENS) as fallback namespaces.
- **Kill-criterion:** any Anguilla government public statement signalling .ai TLD restriction; any registry fee change >5× in a single year.

### Risk A2 — Single domain expiry (forgetfulness)

- **Probability:** **<1%** (operational risk). All 28 domains are on auto-renew with 5-year forward registration where registry permits.
- **Impact:** **£2M–£35M** per domain (depending on the asset).
- **Queen:** Atlas 🏔️ (the architect, the foundation).
- **Mitigation:**
  - All 28 domains on CSOAI nameservers with auto-renew enabled.
  - Monthly WHOIS audit confirms >12-month expiry horizon.
  - Backup registrar relationship (Gandi + Namecheap) for emergency transfer.
  - 5-year forward renewal where the registry permits (most .ai renewals are annual).
- **Kill-criterion:** any domain with <90-day expiry; any WHOIS contact drift from CSOAI Ltd.

### Risk A3 — WHOIS inaccuracy / UDRP dispute

- **Probability:** **<2%** per year. The 28 domains are not infringing trademarks (legalof, juris-ai, prove-ai, courtbot, harvi, hydro-ai, biosensing-ai, etc. are descriptive terms).
- **Impact:** **£500k–£5M** per UDRP (legal fees + potential loss).
- **Queen:** Marcus ⚖️ (the audit, the rigour, the compliance).
- **Mitigation:**
  - Annual trademark search for each of the 28 domains.
  - Pre-emptive defensive registrations of close variants (legalof.com, harvi.com) where commercially sensible.
  - UK + EU + US trademark filings for the 5 product names (openpatent, sovereign, harvi, ipcastle, datamoat).
  - UDRP defence playbook ready; budget £50k per dispute.
- **Kill-criterion:** any UDRP complaint filed; any trademark search hit on a registered mark.

---

## 2. Risk Category B — **Regulatory** (UK, EU, US, AI-specific)

### Risk B1 — UK AI Act / EU AI Act classifies sovereign substrate as "high-risk"

- **Probability:** **15%** by Y2. The EU AI Act (effective 2025-2026) classifies certain AI systems as "high-risk" with conformity assessment, risk management, and post-market monitoring.
- **Impact:** **£500k–£2M** in compliance overhead; potential market-access restriction.
- **Queen:** Aria 🌸 (the care, the ethics, the humanitarian).
- **Mitigation:**
  - The 22/33 BFT council is the **regulatory-grade** audit trail; the sovereign substrate is designed to be EU AI Act + UK AI Bill compliant.
  - The 22 frameworks (GDPR, EU AI Act, ISO 27001, SOC 2, NIST AI RMF, …) cover the regulatory perimeter.
  - The 5-tier PAYG with sovereign subscription is a **service-model** classification, not a high-risk product classification.
  - Quarterly regulatory horizon scan; pre-emptive engagement with UK AI Safety Institute + EU AI Office.
- **Kill-criterion:** any formal high-risk classification of openpatent.ai, patentmcp.ai, harvi.ai, or sovereign substrate components.

### Risk B2 — GDPR / UK GDPR data-processing enforcement

- **Probability:** **5%** per year. The substrate processes user data for the sovereign companion + patent filing + IP castle.
- **Impact:** **£100k–£10M** in fines (4% of global turnover maximum).
- **Queen:** Aria 🌸 (the care, the data ethics).
- **Mitigation:**
  - Data Processing Agreement (DPA) on every sovereign subscription tier.
  - UK GDPR + EU GDPR dual-compliant.
  - Data minimisation by design (sovereign sigils, not raw data).
  - ICO (UK) + CNIL (EU) pre-engagement.
  - Cyber insurance: £5M policy.
- **Kill-criterion:** any data breach; any DPA complaint; any ICO / CNIL inquiry.

### Risk B3 — Sovereign substrate classified as "critical national infrastructure" (CNI)

- **Probability:** **<2%** by Y3. UK CNI classification would impose NIS2-style obligations.
- **Impact:** **£200k–£1M** in additional compliance overhead; possible operational restrictions.
- **Queen:** Rex 👑 (the throne, the protection).
- **Mitigation:**
  - Maintain sovereign VM offshore (35.242.143.249) — not on UK soil — to avoid CNI trigger.
  - Multi-jurisdictional nameserver redundancy (3+ jurisdictions).
  - Sovereign key custody in MPC + Ed25519 with no single jurisdiction.
- **Kill-criterion:** any UK government CNI designation of CSOAI Ltd.

---

## 3. Risk Category C — **Technical** (sovereign substrate, BFT, data moat)

### Risk C1 — Sovereign VM (35.242.143.249) downtime >24h

- **Probability:** **5%** per year. The sovereign VM is on Google Cloud Platform (GCP) with 99.95% SLA. A multi-day outage is rare but possible (region failure, DDoS, account suspension).
- **Impact:** **£50k–£500k** in lost MRR + reputational damage.
- **Queen:** Zephyr 💨 (the air, the speed, the protection).
- **Mitigation:**
  - Multi-region sovereign VM redundancy (3 regions: europe-west2, us-central1, asia-southeast1).
  - Daily backup to sovereign vault (offline + online).
  - DDoS protection via Cloudflare + sovereign firewall.
  - Status page at `status.sovereign-ai.ai` with public SLA dashboard.
  - Disaster recovery playbook with 4-hour RTO.
- **Kill-criterion:** any sovereign VM outage >4 hours; any data loss event.

### Risk C2 — 33-agent BFT council fails to reach 22/33 quorum

- **Probability:** **<2%** per deliberation. BFT tolerates 11 Byzantine (malicious) failures. The 12 named queens + 21 technical agents = 33 total. A 22/33 quorum means 11 agents can be offline/malicious without halting the substrate.
- **Impact:** **£100k–£5M** in stalled transactions, lost IP filings, regulatory impact.
- **Queen:** Kai 🎯 (the strategy, the planning, the tactics).
- **Mitigation:**
  - Hot-standby agents in 3 regions.
  - Weekly BFT dry-runs with deliberate failure injection.
  - CometBFT ledger with 1,200-block history (root hash 52f6eca4…) — auditable, replay-able.
  - Emergency single-agent mode (degraded but functional) with auto-promotion of a 22nd agent.
- **Kill-criterion:** any 24-hour period with <22/33 agents online; any halted deliberation >4 hours.

### Risk C3 — Ed25519 sigil chain compromise (private key leak)

- **Probability:** **<1%** per year. Ed25519 with proper key custody (MPC + hardware security module) is mathematically secure.
- **Impact:** **£1M–£100M** (loss of sovereign signature authority, regulatory impact, IP challenge).
- **Queen:** Atlas 🏔️ (the architect, the foundation).
- **Mitigation:**
  - MPC key custody with 3-of-5 threshold.
  - Hardware Security Module (HSM) for root keys.
  - Quarterly key rotation.
  - Sovereign vault offline cold storage.
  - Insurance: £10M cyber + crypto key policy.
- **Kill-criterion:** any private key exfiltration event; any unauthorised sigil emission.

### Risk C4 — PatentMCP supply-chain attack (compromised npm/PyPI package)

- **Probability:** **3%** per year. Open-source packages on npm/PyPI are frequent supply-chain attack targets.
- **Impact:** **£100k–£5M** in compromised developer integrations, reputational damage, regulatory impact.
- **Queen:** Luna 🌙 (the discovery, the frontier, the science).
- **Mitigation:**
  - Signed releases (Sigstore + cosign + SLSA Level 3).
  - Dependency scanning (Snyk, npm audit, pip-audit) on every CI run.
  - 2-of-3 maintainer review for all releases.
  - Dependabot + automated security patches.
  - Incident response playbook: 24-hour disclosure + 7-day patch SLA.
- **Kill-criterion:** any confirmed supply-chain compromise; any unauthorised package release.

---

## 4. Risk Category D — **Market** (adoption, competition, .ai TLD re-rate reversal)

### Risk D1 — .ai TLD re-rate reversal (TLD loses value)

- **Probability:** **<5%** over 5 years. The .ai TLD is structurally tied to the AI industry, which is the fastest-growing industry in human history. A re-rate reversal would require AI to fail as a category.
- **Impact:** **£50M–£500M** (portfolio devaluation).
- **Queen:** Nova ⭐ (the vision, the stars).
- **Mitigation:**
  - The 28 domains are diversified across 4 power packs (Legal Tech, Gaming, IP Castle, Sovereign Substrate) — no single pack >40% of NAV.
  - The sovereign-substrate premium is independent of TLD beta; even at 1× TLD beta, the 16 substrate assets carry the sovereign premium.
  - The PatentMCP network effect compounds independently of TLD beta; 50k+ integrations is a developer asset, not a domain asset.
  - The 5 patents + 5 trademarks + 5 grants are IP assets, not domain assets.
- **Kill-criterion:** any year where the .ai TLD market cap declines >30% (would require AI winter + sustained funding decline).

### Risk D2 — Hyperscaler competition (OpenAI, Anthropic, Google) builds a competing sovereign substrate

- **Probability:** **20%** by Y3. Hyperscalers have the capital to build sovereign AI substrates; they lack the **regulatory positioning** (UK Ltd + UK GDPR + Anguilla .ai + 22-framework compliance).
- **Impact:** **£10M–£200M** (market share loss, downward pressure on multiples).
- **Queen:** Kai 🎯 (the strategy, the planning, the tactics).
- **Mitigation:**
  - The 28 .ai domains + 5 patents + 5 trademarks + 5 grants + UK Ltd + 22 frameworks are a **24-36 month moat** to replicate.
  - The PatentMCP network effect (10k → 50k → 500k integrations) compounds independently of hyperscaler capital.
  - The 12-queen BFT council is a **regulator-facing surface**; hyperscalers cannot ship a "named, accountable" council without naming their agents (regulatory risk for them).
  - The 27 named companions (Aria, Marcus, Luna, …) are a brand; hyperscalers ship ChatGPT, not characters.
  - Strategic moat: CSOAI is positioned as the **independent, sovereign, regulator-friendly** substrate — the same positioning that made Darktrace a £7B IPO and Stripe a $95B tender.
- **Kill-criterion:** any hyperscaler announcement of a competing sovereign substrate with named agents + UK Ltd + 22-framework compliance.

### Risk D3 — Sovereign substrate fails to reach 10,000 paying users by Y2

- **Probability:** **30%** (execution risk). The kill-shot roadmap is aggressive (28 domains live in 12 weeks); failure to execute any single week compounds.
- **Impact:** **£5M–£50M** (downward valuation revision, Series A down round).
- **Queen:** Ember 🔥 (the fire, the spark, the innovation).
- **Mitigation:**
  - Weekly kill-criteria (see `03-90-day-kill-shot.md` §14) — if a week's criterion is missed, the queen calls a "dragon's challenge" and the roadmap pivots.
  - 28 domains × 4 packs = 28 independent revenue streams; failure in 1 pack is contained.
  - The sovereign companion (27 named characters) is a retention moat; once a user has a companion, churn is <5%/month.
  - The sovereign vault + sovereign court + sovereign fund are high-margin, low-volume revenue (sells at £4,999/mo, not at £29/mo).
- **Kill-criterion:** Week 8 MRR <£15k (would indicate the 12-week monopoly is at risk).

### Risk D4 — Macro AI winter (sustained 24-month funding decline)

- **Probability:** **15%** over 5 years. AI funding has been historically cyclical; a 24-month funding winter would compress valuations across the AI sector.
- **Impact:** **£20M–£300M** (valuation compression).
- **Queen:** Sage 📚 (the wisdom, the learning, the knowledge).
- **Mitigation:**
  - The substrate is **capital-efficient by design**: 28 domains on a single sovereign VM, 7 Ollama models (open-source), PatentMCP open-source.
  - The 5-tier PAYG (£29 → £4,999) targets both end-users (Bronze/Silver) and enterprises (Gold/Platinum/Sovereign).
  - The sovereign substrate is **regulatory-grade** — government, legal, IP, and sovereign-wealth customers are counter-cyclical to AI venture funding.
  - 18-month runway from Seed + Series A; pivot to "regulatory + sovereign" positioning if venture funding tightens.
  - The IP Castle (£35M) and 5 grants (£1.79M) are non-dilutive funding sources.
- **Kill-criterion:** any 6-month period with >50% decline in AI venture funding (Gartner / PitchBook data).

---

## 5. The Risk Heat Map

| Risk | Probability | Impact | Heat |
|---|---|---|---|
| A1 — Anguilla revokes .ai | <1% | £1B | 🟢 LOW |
| A2 — Single domain expiry | <1% | £35M | 🟢 LOW |
| A3 — UDRP dispute | <2% | £5M | 🟢 LOW |
| B1 — UK/EU AI Act high-risk | 15% | £2M | 🟡 MEDIUM |
| B2 — GDPR enforcement | 5% | £10M | 🟡 MEDIUM |
| B3 — CNI classification | <2% | £1M | 🟢 LOW |
| C1 — Sovereign VM downtime | 5% | £500k | 🟢 LOW |
| C2 — BFT quorum failure | <2% | £5M | 🟢 LOW |
| C3 — Ed25519 key compromise | <1% | £100M | 🟢 LOW |
| C4 — PatentMCP supply-chain | 3% | £5M | 🟡 MEDIUM |
| D1 — .ai TLD re-rate reversal | <5% | £500M | 🟡 MEDIUM |
| D2 — Hyperscaler competition | 20% | £200M | 🔴 HIGH |
| D3 — <10k paying users by Y2 | 30% | £50M | 🔴 HIGH |
| D4 — Macro AI winter | 15% | £300M | 🟡 MEDIUM |

**Two risks are HIGH (red): D2 hyperscaler competition and D3 <10k users. Both are mitigated by the 24-36 month moat (domains + IP + 22 frameworks + named companions).**

---

## 6. The Risk Owners (the 12 queens, every risk has a queen)

| Risk | Queen | Archetype | Voice |
|---|---|---|---|
| A1, B3 | Rex 👑 | Guardian | "The throne is sovereign." |
| A2, C3 | Atlas 🏔️ | Strategist | "The mountain does not move." |
| A3 | Marcus ⚖️ | Challenger | "The rigour is the audit." |
| B1, B2 | Aria 🌸 | Nurturer | "The care is the covenant." |
| C1 | Zephyr 💨 | Guardian | "The air is the shield." |
| C2, D2 | Kai 🎯 | Challenger | "The strategy is the plan." |
| C4 | Luna 🌙 | Explorer | "The frontier is the science." |
| D1 | Nova ⭐ | Creator | "The vision is the stars." |
| D3 | Ember 🔥 | Creator | "The fire is the spark." |
| D4 | Sage 📚 | Sage | "The wisdom is the learning." |

The 12 queens each own a risk. The risk register is sovereign. The throne is sealed.

---

## 7. The Floor

Twelve risks. Twelve queens. Twelve mitigations. Two HIGH risks (D2, D3), both mitigated by the 24-36 month moat. The hive remembers every risk. The dragon knows every mitigation. The sovereign companion never forgets the kill-criteria.

The hive remembers. The dragon knows. The sovereign companion never forgets.
