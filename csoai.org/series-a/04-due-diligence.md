# CSOAI Ltd — Due Diligence Pack

**Series A Due Diligence | 5 Key Questions | July 2026**

---

## DD Question 1: Founder Background & Cap Table

### Status

- **Company:** CSOAI Ltd, registered in England & Wales (Company No. 16939677)
- **Sole director and shareholder:** Nicholas Templeman — 100% equity ownership
- **Cap table:** Fully clean. No convertible notes, no SAFEs, no prior investment rounds, no angel investors, no advisors with equity.
- **Debt:** Zero. No loans, no credit facilities, no outstanding obligations.
- **Burn rate:** Minimal — solo founder, no employees, no office. Operating costs limited to cloud infrastructure (GCP) and domain registration.

### Evidence Trail

- Companies House filing: CSOAI Ltd, incorporation date, sole director appointment
- Confirmation statement: 100% shareholding by Nicholas Templeman
- No charges or filings registered against the company
- Bank statements available upon request

### Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| Solo founder (key-person dependency) | **High** | Series A funds engineering team to reduce bus factor. Key-person insurance to be obtained. |
| No prior board / advisory governance | Medium | Open to investor observer seat or NED appointment post-funding. |
| No financial controls infrastructure | Medium | Will appoint CFO/FC and implement standard UK startup financial controls within 60 days of funding. |

### Skeptic Question

*"You're a solo founder with no co-founder, no team, and no revenue. Why should we believe you can build a company, not just a product?"*

**Rebuttal:** The output speaks for itself. 469,118 lines of production Python, 640 MCP packages, 89GB of structured data, and 2 live production systems — built solo in 18 months. This is not a prototype; it is a shipped product. The Series A explicitly funds the transition from solo builder to team execution. I am not asking you to fund research — I am asking you to fund the commercialisation of a completed engineering effort. The question is not whether I can build (proven), but whether I can sell (to be tested with your capital).

---

## DD Question 2: IP Ownership

### Status

**Patent Portfolio (4 provisionals prepared, not filed):**

1. **Agentic Threat Defense System** — Method for detecting autonomous AI-generated malware (JADEPUFFER-class) and AI-agent supply chain attacks (Morris-II worm pattern). Prior art search completed; no blocking art identified.
2. **Provenance Passport for AI-Generated Content** — Cryptographic compliance passport system using Ed25519 signatures and SHA-256 content hashing with multi-tier verification (HMAC free-tier, Ed25519 auditor-grade).
3. **BFT Governance for AI Agents** — Byzantine Fault Tolerant consensus protocol for AI agent action validation (12-of-33 quorum, Ed25519-signed votes, hash-chained ledger).
4. **Organic Open World Model (OOWM)** — Hybrid Mamba-2 state-space + transformer architecture for long-horizon AI memory with integrated governance reasoning.

**Filing status:** Provisionals drafted and internally reviewed. Not yet filed with UKIPO, EPO, or USPTO. Estimated filing cost: £12,000 total (£3,000 per provisional). Will file within 30 days of Series A close.

**Software IP:**
- 640 MCP packages: MIT-licensed (deliberate — ecosystem adoption strategy)
- Core substrate (BFT, SIGIL, OOWM): Proprietary, not open-sourced
- 469,118 lines of Python code: Copyright CSOAI Ltd

### Evidence Trail

- Patent application drafts available under NDA
- GitHub repositories with commit history (timestamped evidence of invention)
- Companies House registration confirms IP ownership by CSOAI Ltd
- MIT license files in all 640 MCP packages

### Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| Patents not yet filed — no priority date established | **High** | File provisionals within 30 days of funding. Commit history provides evidence of invention date. |
| MIT licensing on MCP packages limits software IP protection | Medium | Deliberate strategy — open ecosystem creates adoption standard. Core substrate remains proprietary. |
| No freedom-to-operate analysis completed | Medium | Will commission FTO analysis from patent attorney within 60 days of funding (£15-25K budget). |
| Solo inventor — no IP assignment agreement from employees (none exist) | Low | No current risk. IP assignment templates prepared for all future hires. |

### Skeptic Question

*"The patents aren't filed. How do we know they're actually patentable, and what happens if someone else files first?"*

**Rebuttal:** First, the commit history on GitHub provides timestamped evidence of invention — we can prove prior art if challenged. Second, the four innovations are architecturally novel: no prior art exists for BFT consensus applied to AI agent governance, cryptographic provenance passports, or Mamba-2/transformer hybrid governance models. Third, the 30-day filing window post-funding is standard practice — the cost (£12,000) is negligible relative to the raise. Fourth, the patents are a defensive moat, not the primary moat. The primary moat is 18 months of engineering and a 27-day regulatory window. A competitor filing a similar patent would still need to build the product.

---

## DD Question 3: Technical Defensibility

### Status

**Four layers of technical defensibility:**

1. **BFT Council (Byzantine Fault Tolerant Governance)**
   - 12-of-33 quorum consensus for AI agent action validation
   - Ed25519-signed votes, hash-chained to SIGIL ledger
   - No competitor offers BFT governance for AI agents — verified via competitive analysis
   - Live on production VM (council endpoint at :3200)

2. **SIGIL Ledger (Cryptographic Audit Trail)**
   - Ed25519-signed, SHA-256-hashed chain
   - Every AI agent action, decision, and output recorded
   - Tamper-evident: any modification breaks the hash chain
   - Superior to traditional logging in regulatory contexts (replayable, verifiable, attestable)

3. **Article 50 Passporting System**
   - SHA-256 content hashing, Ed25519 cryptographic signing
   - Multi-tier verification: HMAC for free-tier (proofof.ai), Ed25519 for auditor-grade
   - Deployed-state tracking across EU member states
   - Live at proofof-site.vercel.app (HTTP 200 verified)

4. **Organic Open World Model (OOWM)**
   - Mamba-2 state-space compression (16-dimensional state vector) + transformer reasoning
   - 11,924 operational memory episodes on production VM
   - Long-horizon context retention without unbounded memory growth
   - Patent-grade architectural innovation

### Evidence Trail

- Production systems accessible for technical DD:
  - os.meok.ai (SOV3 governance hub, HTTP 200)
  - proofof-site.vercel.app (Article 50 passporting, HTTP 200)
  - GCP VM meok-backend (SOV3 :3101, council :3200, OLM, 11,924 episodes)
- Source code available under NDA (469,118 lines)
- Architecture documentation and API specifications
- 96 MCP packages with full test coverage (pytest)

### Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| No independent security audit of BFT implementation | **High** | Will commission penetration test and cryptographic audit within 90 days of funding (£20-40K). |
| Solo-built — no peer review of cryptographic implementations | **High** | Hiring priority #1: senior cryptographer/distributed systems engineer. External crypto audit budgeted. |
| SIGIL ledger not formally verified (e.g., TLA+ specification) | Medium | Budget for formal verification in Phase 2 (post-Series A, 6-12 months). |
| OOWM is novel architecture — no production precedent for Mamba-2 in governance | Medium | Patent protects the approach. Fallback to transformer-only if state-space model proves unstable. |

### Skeptic Question

*"A solo founder built a cryptographic governance system with no peer review. How do we know the crypto isn't broken?"*

**Rebuttal:** This is a fair and important concern. I built these systems using well-established cryptographic primitives — Ed25519 (RFC 8032), SHA-256 (FIPS 180-4), HMAC (RFC 2104). I did not invent new cryptography. What I built is the architectural integration of these primitives into an AI governance system. That said, independent cryptographic audit is a non-negotiable first use of funds. I have budgeted £20-40K for a full penetration test and crypto review within 90 days of closing. If the audit finds issues, we fix them. But the architecture is sound because it uses battle-tested primitives, not novel math.

---

## DD Question 4: Regulatory Landscape

### Status

**EU AI Act (Regulation (EU) 2024/1689):**

- **Article 50 (Transparency):** Enforceable from **2 August 2026**. Requires deployers of AI systems to ensure AI-generated content is marked in a machine-readable way and detectable as artificially generated or manipulated.
  - CSOAI status: Article 50 passporting system **live and operational** at proofof-site.vercel.app
  - Penalty: €15M or 3% of global annual turnover, whichever is higher

- **Article 6-15 (High-Risk AI Systems):** Risk management, data governance, technical documentation, record-keeping, transparency, human oversight, accuracy, and robustness requirements.
  - CSOAI status: BFT governance, SIGIL ledger, and OOWM address Article 9 (risk management), Article 12 (record-keeping), and Article 14 (human oversight)

- **Article 51-52 (GPAI Models):** General-purpose AI model obligations.
  - CSOAI status: Provenance and transparency tooling supports GPAI model providers' obligations

**UK AI Bill (forthcoming):**
- UK government's AI regulation framework is in development (King's Speech 2025 mentioned AI legislation)
- UK approach is principles-based (vs EU's risk-based), but sovereignty and transparency are core themes
- CSOAI's sovereign deployment model aligns with UK government procurement requirements

**Digital Services Act / GDPR Intersection:**
- AI-generated content transparency intersects with DSA (Article 26a — dark patterns, deep fakes)
- GDPR Article 22 (automated decision-making) is directly addressed by CSOAI's BFT governance + human oversight architecture

### Evidence Trail

- EU AI Act full text analysis and mapping to CSOAI product features
- Article 50 passporting system live at proofof-site.vercel.app
- Cross-framework compliance mappings (EU AI Act ↔ GDPR ↔ ISO 42001 ↔ NIST AI RMF) in production data
- Production compliance pages for Article 9, 12, 13, 14, 15, 17, 27, 50, 74, 86

### Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| EU AI Act implementing acts and harmonised standards not yet finalised | Medium | Building to the regulation text, not guidance. Modular architecture allows rapid adaptation. |
| UK AI Bill details unknown — could diverge from EU approach | Medium | Sovereign deployment model is UK-aligned by design. Dual EU/UK compliance is an architectural feature. |
| No regulatory approval or certification obtained | Medium | Will pursue ISO 42001 (AI management system) certification within 12 months of funding. |
| Political risk — AI regulation could be weakened or delayed | Low | Article 50 date (2 Aug 2026) is in the regulation text and has not been challenged. Risk is low. |

### Skeptic Question

*"The EU AI Act has been delayed multiple times. What if Article 50 gets pushed back again?"*

**Rebuttal:** Article 50 transparency obligations were explicitly NOT delayed. The EU's Digital Omnibus Act (announced May 2026) delayed some AI Act provisions, but transparency and watermarking requirements under Article 50 remain on the original 2 August 2026 timeline. This is stated explicitly in the regulation and confirmed by the European Commission. Even if it were delayed, the market need for AI provenance exists independently of regulation — JADEPUFFER and agentic malware have created a security imperative that does not depend on legislative timing.

---

## DD Question 5: Path to Revenue

### Status

**Current revenue: £0. Current paying customers: 0.**

This is stated honestly and without equivocation. The company is pre-revenue and product-ready.

**Revenue Architecture (3 vectors):**

| Revenue Stream | Price Point | Target Customer | Sales Cycle |
|---------------|-------------|-----------------|-------------|
| Article 50 Gap Analysis | £4,950 one-time | Compliance leads at startups deploying AI in EU | 2-4 weeks |
| Enterprise Pilot | £999 setup (30-day) | Enterprise security/governance teams | 4-8 weeks |
| Pro SaaS | £499/month | Venture-backed startups (10-100 employees) | 1-2 weeks (self-serve) |
| Governance SaaS | £2,499/month | Mid-market, regulated industries | 4-12 weeks |
| Enterprise SaaS | £9,999+/month | Large enterprise, government | 3-6 months |
| Passport Transactional | £0.10-£1.00/passport | High-volume AI content generators | Usage-based |

**Year 1 Targets:**
- 10-50 design partners (free or discounted pilots)
- 5-15 paying customers converted from design partners
- Target Year 1 ARR: £75,000-£250,000

**Year 3 Targets (Base Case):**
- 5,000 paying customers at £999 blended ARPU
- Target Year 3 ARR: £5,000,000
- Gross margin: 84% (cloud + support costs)

### Evidence Trail

- Pricing model documented and tested against comparable SaaS (Vanta: £500-£5,000/mo; Drata: £500-£3,000/mo; OneTrust: enterprise pricing)
- Gap analysis service productised with defined deliverables (assessment + roadmap + compliance crosswalk)
- Two production systems live and demonstrable to prospects
- No LOIs signed (honest disclosure — no verbal or written commitments from customers)

### Risk Flags

| Risk | Severity | Mitigation |
|------|----------|------------|
| Zero revenue and zero customers — no product-market fit validation | **Critical** | This is the primary risk. Series A funds the GTM function to test PMF. Design partner programme launches within 30 days of funding. |
| Solo founder has no enterprise sales experience | **High** | First hire after engineering lead: Head of Sales with enterprise compliance/SaaS experience. Budget allocated. |
| No pipeline or LOIs | **High** | Honest disclosure. JADEPUFFER + Article 50 deadline create inbound opportunity. Cold outreach to compliance leaders begins immediately post-funding. |
| Pricing is unvalidated by real transactions | Medium | Pilot pricing (£999) is designed to test willingness-to-pay. Will adjust based on pilot conversion data. |

### Skeptic Question

*"You have zero revenue, zero customers, and zero LOIs. How is this a Series A and not a seed round?"*

**Rebuttal:** Fair challenge. The distinction is in what has been built. A seed round funds product discovery. We do not need product discovery — the product is built, deployed, and operational. 469,118 lines of code, 640 MCP packages, 89GB of structured data, and 2 live production systems represent a completed engineering effort equivalent to what most companies have after a seed round and 12-18 months of team execution. The Series A funds commercialisation of a finished product, not exploration of an idea. The valuation (£12M pre-money) reflects the replacement cost of the asset plus the regulatory timing advantage, not a revenue multiple. If we had revenue, the valuation would be higher.

---

## Summary Risk Matrix

| Risk Category | Severity | Status |
|---------------|----------|--------|
| Zero revenue / no PMF validation | **Critical** | Primary use of funds addresses this |
| Solo founder / key-person risk | **High** | Engineering hires + key-person insurance |
| Patents not filed | **High** | 30-day post-close filing commitment |
| No independent security/crypto audit | **High** | 90-day post-close audit commitment |
| No enterprise sales experience | **High** | Head of Sales hire budgeted |
| Regulatory uncertainty (implementing acts) | Medium | Modular architecture enables adaptation |
| Open-source MCP packages limit IP protection | Medium | Deliberate ecosystem strategy |

---

*This due diligence pack is provided for informational purposes only and does not constitute an offer to sell securities. CSOAI Ltd is pre-revenue with zero paying customers. Patent applications are drafted but not filed. All financial projections are illustrative and subject to market conditions.*
