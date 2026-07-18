# Outbound — 10 LinkedIn DMs + 5 Consultancy Cold Emails

**Goal:** convert 1-2 of these into £79/mo Pro subscriptions or £1,499 Enterprise calls. Even 1 conversion = first £ in the door.

**Tone rule:** these aren't cold pitches. They're "thought you'd find this interesting" notes. Hard sell = blocked / reported / hurts the brand.

---

## TARGET LIST: 10 LinkedIn DMs

The right targets are EU-based **DPOs (Data Protection Officers), Compliance Leads, AI Governance Heads, Information Security Officers** at:
- Mid-market German Mittelstand companies (NIS2 cliff is THIS month)
- EU SaaS firms with high-risk AI features (EU AI Act Annex III applicability)
- UK Fintechs handling EU customers (DORA + GDPR)
- EU consultancies that resell compliance (Vanta partners, Drata partners)

### How to find targets
LinkedIn Sales Navigator search:
- Job title: `("DPO" OR "Data Protection Officer" OR "Head of AI Governance" OR "Compliance Lead")`
- Geography: Germany OR Netherlands OR France OR Ireland
- Company size: 50-500 employees
- Recent activity: posted about "AI Act" or "NIS2" in last 30 days

### DM template — Variant A (NIS2 angle, German targets)

> Hi [First Name],
>
> Saw your post about [specific thing they posted — e.g. "BSI's Section 30 register ambiguity"]. Genuinely useful framing — the classification of "important entities" vs "essential entities" is where most of the Mittelstand projects I see get stuck.
>
> Quick share: I've open-sourced a Germany-specific NIS2 BSI register tool that auto-classifies your services and produces the Section 30/32 timelines per KRITIS sector. MIT-licensed, runs as an MCP server inside Claude Code or Cursor, ships with HMAC-signed compliance attestations.
>
> github.com/CSOAI-ORG/meok-nis2-de-register-mcp
>
> Not selling anything — happy if it just saves you the deadline scramble. If your team is using it and wants org-wide signing keys / paid support, I have a Pro tier (£79/mo) and Enterprise tier (£1,499/mo) but the free-forever core is genuinely complete.
>
> — Nick (MEOK AI Labs, UK)

### DM template — Variant B (EU AI Act Article 50 watermarking, Aug 2026 cliff)

> Hi [First Name],
>
> The Article 50 watermarking + AI-content disclosure stuff hits in November — most teams I'm talking to are nowhere near ready, and the implementing acts on synthetic content disclosure dropped quietly last month.
>
> I built a small open-source MCP that wraps C2PA, watermark detection, and Article 50 transparency obligations into a single tool an AI agent can call. Free / MIT.
>
> github.com/CSOAI-ORG/meok-watermark-attest-mcp
>
> Worth 30 sec of your time? Curious whether the "AI agent calls compliance MCP" workflow resonates or feels backwards.
>
> — Nick

### DM template — Variant C (DORA, fintech)

> Hi [First Name],
>
> If you're inside a DORA-scoped financial entity, the Article 28 register of ICT third-party providers is one of those things that needs to be **machine-readable + auditable** by 17 Jan 2025 and most teams I've seen are still keeping it in a spreadsheet.
>
> Open-sourced an MCP that generates the register per Article 28, classifies criticality, and exports the schema regulators expect. MIT.
>
> github.com/CSOAI-ORG/dora-compliance-mcp
>
> Useful or noisy? Happy to disappear if not your thing — just thought relevant given you're in [their company]. 
>
> — Nick

### Targets to find / DM
1. [ ] DPO of a top-50 German Mittelstand SaaS (NIS2 cliff)
2. [ ] AI Governance Lead at a Top-3 EU fintech (DORA + AI Act)
3. [ ] Compliance Director at an EU recruitment-AI firm (Annex III high-risk)
4. [ ] Information Security Manager at a Dutch healthcare AI firm (Annex III + GDPR)
5. [ ] Head of AI Risk at a UK insurer expanding into EU (DORA + AI Act)
6. [ ] Compliance Director at an EU education-AI firm (Annex III)
7. [ ] Compliance Lead at a French legal-AI firm (Annex III)
8. [ ] DPO at an Irish data-platform firm (GDPR + DORA)
9. [ ] Head of AI Governance at a Belgian gov-tech firm (Article 26(9) FRIA mandatory for public-sector deployers)
10. [ ] CISO at a German automotive supplier (NIS2 essential entity, CRA in 2027)

---

## CONSULTANCY COLD EMAILS — 5 firms

These firms make money reselling compliance — they're potential RESELLER partners, not just buyers. Closing one of these = recurring £.

**Subject line for all:** `Open-source compliance MCPs — partner / reseller idea?`

**Email body template:**

> Hi [First Name] / [Firm Compliance Team],
>
> Hope you're well. I'm Nick Templeman, solo founder of MEOK AI Labs (UK, Companies House 16939677). I've shipped 234 open-source MCP servers covering EU AI Act, DORA, NIS2, CRA, GDPR, UK AI Bill — all MIT-licensed, all running production with HMAC-signed compliance attestations.
>
> The flagship 5 are at:
> - github.com/CSOAI-ORG/meok-omnibus-tracker-mcp (EU AI Act + GDPR + DORA tracker)
> - github.com/CSOAI-ORG/meok-watermark-attest-mcp (Article 50, Nov 2026)
> - github.com/CSOAI-ORG/meok-cra-annex-iv-classifier-mcp (EU CRA)
> - github.com/CSOAI-ORG/meok-nis2-de-register-mcp (Germany NIS2)
> - github.com/CSOAI-ORG/meok-mcp-injection-scan-mcp (April 2026 RCE class)
>
> Why I'm reaching out: I've noticed [Firm Name] has been posting about [their specific thing — find this on LinkedIn/blog]. I think there's a clean partnership shape:
>
> 1. **You white-label the Pro tier (£79/mo)** for clients who need turnkey signed attestations
> 2. **I take 70%, you take 30%** as a standard reseller split
> 3. **You keep the consulting £** (advisory, audit prep, regulator-facing) — I just provide the toolchain
> 4. **No contract lock-in** — if it doesn't work in 90 days, no harm done
>
> Or if reseller doesn't fit, would you be open to a 20-minute call to see whether your clients would even use this kind of tooling? I'm at £0 revenue today — your honest reaction is genuinely useful even if you say "no thanks".
>
> Best,
> Nick
> nicholas@csoai.org · https://meok.ai
> MEOK AI Labs · CSOAI LTD · 3rd Floor, 86-90 Paul Street, London EC2A 4NE

### Target firms (in priority order)
1. [ ] **Bird & Bird LLP** — bigtech-friendly EU law firm, has dedicated AI Act compliance team. Email: hello@twobirds.com (general) or pick the AI/data partner from their Berlin office.
2. [ ] **Privitar** (now part of Informatica) — UK-based, GDPR-tooling vendor expanding into AI Act. Reseller potential.
3. [ ] **Squire Patton Boggs** — global firm, big cybersecurity / NIS2 practice in Frankfurt + Brussels.
4. [ ] **CyXcel** — UK cybersecurity-law boutique focused on regulated sectors. Tiny, fast, more likely to actually reply than BigLaw.
5. [ ] **Trail of Bits** — US security firm, has been acquiring open-source security tooling and would value the signed-attestation infrastructure.

---

## Process

**Daily:** Send 2 LinkedIn DMs + 1 consultancy email. Don't batch all 15 in one day — looks spammy.
**Track:** Use Notion / spreadsheet. Columns: Name, Company, DM Sent Date, Replied?, Status, Followup Date.
**Followup rule:** if no reply in 7 days, ONE polite followup ("Hi [Name], just bumping this in case it got buried — happy to disappear if not your thing"). After 14 days no reply, mark dead.

**Win definition for week 1:** 
- 1 reply that opens a 20-min call → success
- 1 sale (£29 or £79) → very good
- 1 reseller convo started → great

Don't expect more. The compliance buying cycle is 3-6 months minimum. We're planting seeds.

---

## After-action review (fill in once you've sent some)

| Date | Recipient | Channel | Sent? | Reply? | Outcome |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
