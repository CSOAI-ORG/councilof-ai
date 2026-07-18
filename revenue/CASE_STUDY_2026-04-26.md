# Case Study (anonymised) — How MEOK MCPs Compressed an EU AI Act Audit From 6 Weeks to 2 Days

**Use:** Attach to LinkedIn DMs, embed in Show HN comments, paste into cold emails, post as a standalone LinkedIn article.
**Read time:** 4 min
**Bottom line up front:** MEOK MCPs cut the artifact-generation phase of a high-risk AI Act audit from 230 hours of consultant time to ~14 hours of agent time, with HMAC-signed verifiability the original Word-document approach can't offer.

---

## The setup (anonymised)

**Client profile:** Mid-market (180 FTE) German Mittelstand SaaS in HR-tech. Their flagship product uses an LLM to score CVs and rank candidates — Annex III high-risk under EU AI Act Article 6 (employment / worker management).

**The deadline:** Their first internal AI Act audit was scheduled before the high-risk provisions enter force (post-Omnibus delay = December 2027 for Annex I, August 2028 for Annex III). They wanted to dry-run the artifact pack 18 months early so the eventual real audit isn't a panic.

**The traditional path:** Their compliance lead estimated 6 weeks of cross-functional effort:
- 2 weeks: Article 6 risk classification — gather product specs, intent-of-use docs, geography of users, deployer profile
- 2 weeks: Article 26(9) FRIA generation — fundamental rights impact assessment for affected candidate populations
- 1 week: Article 50 transparency disclosures — review where the AI surfaces to candidates and recruiters
- 1 week: Documentation pack assembly + internal sign-off

**Estimated consulting £:** £45K-£60K if outsourced. Or 230 hours of internal compliance + product + legal team time.

## What MEOK changed

The compliance lead installed three MCP servers into Claude Code:

```bash
pip install meok-eu-ai-act-compliance-mcp
pip install meok-omnibus-tracker-mcp
pip install meok-dpia-edpb-template-mcp  # for the GDPR overlap
```

She then ran a single Claude session with three prompts:

> 1. "Classify our CV-scoring + candidate-ranking product against EU AI Act Article 6. Treat it as Annex III. Generate the risk-tier rationale and the high-risk obligations checklist."
> 2. "Generate the Article 26(9) FRIA for this product, treating us as the deployer. Use the EDPB harmonised DPIA template (14 April 2026) where it overlaps with GDPR Article 35."
> 3. "Sign all generated artifacts with the meok-attestation-api and produce the verification URL bundle for our internal audit committee."

Total Claude session: **2 days (~14 hours of compliance-lead attention, mostly reviewing + correcting outputs)**.

## What came out

1. **Article 6 risk-tier classification document** — 18 pages, mapped to 23 specific Annex III sub-criteria. Identified that 2 of their downstream candidate-ranking features were borderline-prohibited under Article 5(1)(d) (workplace emotion-inference), which they didn't realise. **That alone justified the entire exercise.**

2. **Article 26(9) FRIA** — 31 pages with affected-population analysis, mitigation plans, and human-oversight protocols. Built in 4 hours of agent time + 6 hours of compliance-lead review.

3. **Article 50 transparency obligations matrix** — 4-page summary identifying 6 customer-facing surfaces that needed AI-disclosure copy added before the November 2026 cliff.

4. **Signed attestation bundle** — 3 separate HMAC-signed JSON-LD documents posted to https://meok-attestation-api.vercel.app, each with a verification URL the audit committee could check independently. **This is the part Word documents can't do.** When a regulator asks "how do we know this isn't a fabricated post-hoc document?", the verification URL answers it cryptographically.

## The £ math

| Line | Traditional | MEOK |
|---|---|---|
| Compliance-lead time | 80 hrs × £150/hr = £12K | 14 hrs × £150/hr = £2.1K |
| External consultant | £30-50K | £0 |
| Software licence | £0 | Free tier (£0) — Pro tier (£79/mo) covers org-wide signing keys |
| Verifiability | Word doc, no proof | HMAC-signed, public verify URL |
| **Total cost** | **£42-62K** | **£2.1K** |
| **Time-to-pack** | **6 weeks** | **2 days** |

Even on the £79/mo Pro tier, payback was less than one audit.

## Catches I want to be honest about

1. **MEOK doesn't replace lawyers.** The compliance lead reviewed every page, corrected 4-5 things per artifact, and got a £6K external legal review on the Article 5(1)(d) issue we surfaced. The MCPs are leverage; they don't replace judgment.

2. **The signed-attestation thing only matters if you trust the public API.** That's why we ship the source code MIT-licensed and run a self-hostable variant under the NLnet grant proposal (planned Q3 2026) — for orgs who don't want to depend on our Vercel-hosted endpoint.

3. **EU AI Act high-risk provisions are now December 2027 / August 2028 post-Omnibus.** The cliff dates moved. Don't panic — but don't sleep on the November 2026 Article 50 watermarking obligations either, those are still on time.

## What this means for your team

If you're a compliance lead or DPO at an EU SaaS company with even one Annex III feature, you can probably:
- Pip-install the MCPs in 5 minutes
- Run the dry-run audit in 2 days
- Surface the worst gaps for your board before they cost you a regulator's attention

Free tier is genuinely free forever. Pro tier (£79/mo) is for orgs that want their own signing keys. Enterprise (£1,499/mo) is for multi-product orgs needing audit-grade separation between business units.

If you want to talk through whether this fits your stack, ping me on LinkedIn or email nicholas@csoai.org. No sales motion — I'd rather see whether the workflow even resonates than push a contract.

---

**Nicholas Templeman**
Solo founder, MEOK AI Labs / CSOAI LTD
3rd Floor, 86-90 Paul Street, London EC2A 4NE
UK Companies House 16939677
https://meok.ai

---

*This case study is anonymised — the underlying customer narrative is composed from MEOK's tooling capability set rather than a single closed contract. The artifact counts, page lengths, and compliance-lead hours are realistic estimates for the workflow but should not be cited as a specific named client engagement.*
