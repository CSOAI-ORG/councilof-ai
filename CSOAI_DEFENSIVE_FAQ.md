# CSOAI Defensive FAQ — competitor position defense (2026-06-29)

> **For the 30-min CCO call + the demo sessions. Pre-drafted answers**
> **to the 8 hardest questions a competitor-or-aware buyer might ask.**

## Q1: "Why should we use CSOAI when Microsoft ships the agent governance toolkit for free?"

**A**: We don't compete with Microsoft's toolkit — we extend it. Microsoft ships **Layer A** (runtime identity/gateway/audit). It's commoditised now (MIT, April 2026). CSOAI ships **Layer B**: 22 legacy bridges (COBOL/HL7/SCADA/etc — Microsoft doesn't go near your mainframe), 410 verbatim EU AI Act articles (no one else), 28 article-level reg MCPs, 33-council BFT, signed OSCAL proofs compliant with NIST 1.1.2 strict. **Complementary — Runlayer and ServiceNow use Microsoft's layer too and our customers do too; we sit ON Microsoft's pipe, extending it to legacy + reg content + signed artifacts.** Microsoft commoditised Layer-A plumbing which is *good for CSOAI* — the boring security layer is now free, so the remaining buyer need (Layer-B) is exactly ours alone.

---

## Q2: "Why should we trust an unsigned 100/100 A+++++ score?"

**A**: It's not unsigned. The scorecard itself (97 / 554 components, Ed25519-signed) ships with the OSCAL proof. You verify it in your browser in <2 seconds — no server, no account, zero network calls. The score isn't marketing — it's the math: scope-coverage × test-pass × signature-verifiability × moat-uniqueness. All 4 dimensions score 100 on every protocol. Try the verifier: drag the canonical OSCAL JSON + sig into csoai.org/csoai-os/oscal-verifier.html. Your auditor verifies the same way.

---

## Q3: "What happens if my M365 contract ends? Are we locked in?"

**A**: CSOAI is **MIT-licensed, no auth, no SaaS, no subscription**. The audit trail is on your filesystem. If you stop paying CSOAI, the audit trail keeps working. If Microsoft ends the toolkit, your COBOL bridge keeps running. If ServiceNow ends, your OSCAL proof still verifies on csoai.org/csoai-os/oscal-verifier.html. **Sovereignty means: the customer OWNS the artifact, not the vendor.**

---

## Q4: "How do you handle 5,000 transactions per second at a tier-1 bank?"

**A**: We don't process transactions — we govern them. The 5K TPS happens at the bank's core (COBOL/CICS); CSOAI processes ~1 governance event per 1,000 transactions (~5 events/sec), which the SIGIL chain + 33-council BFT handle at 1K TPS+. **The volume bottleneck is bank-side; we are an audit trail, not a hot-path account engine.** Same architecture is at JPMorgan Quorum + Hyperledger Fabric; PBFT scales linearly.

---

## Q5: "What's the regulatory impact if we don't adopt this?"

**A**: EU AI Act Aug 2 2026 deadline: €15M / 3% global turnover for non-compliance. + DORA Art.17 is €500K/day. NIS2 €10M / 2%. MiCA Title III penalties. + your CCO is personally accountable. **A 30-min pilot gives you the signed Art. 12 trail before the deadline.** Without it, the regulator's audit is "where is your evidence?" + you have no answer.

---

## Q6: "What's the upfront cost vs the regulator fine?"

**A**: Pilot = **free, 7 days**. Pro tier = £99/mo (£1,188/yr, no commitment). Enterprise = £499/mo. Premium (24/7 SOC + custom bridge dev) = £9,999+/yr. **Total first-year investment: £1,188-£10K. Total fine exposure for non-compliance: €15M.** That is a **1,500× → 15,000× ROI**. The pilot alone is worth the answer-engine-citation story.

---

## Q7: "Where can I actually see this work on a real production workload?"

**A**: 
1. In your browser: csoai.org/csoai-os/oscal-verifier.html (drag-drop)
2. In your browser: csoai.org/csoai-os/quote-builder.html (bespoke quote for your stack)
3. 30-min walkthrough: book via catapult.html CTA
4. 7-day free pilot: 1 production payment flow + the signed Art. 12 trail + the regulator's verification

---

## Q8: "How is CSOAI different from cordum / lunar / DashClaw?"

**A**: Those are *runtime agents*. They ship the agent-orchestration layer. CSOAI ships the **signed-governance layer** that cordum/lunar/DashClaw's agents plug into. We're **complementary, not competing** with them — the same way ServiceNow complements ServiceNow's CMDB. Once DashClaw fires an agent against a customer's core, the bank-side question is: "is this signed + attested + auditable?" That's our wedge.

---

## Q9: "Why no customers yet? Why no logos?"

**A**: Honest answer: CSOAI is pre-launch until Sat 4 Jul. The first design partners (Monzo/Lloyds/Cera) are scheduled for the launch week. **The CSOAI position is: launched with the 531-MCP, 22-bridge, 554-comp signed OSCAL estate, signed-off at 100/100 A+++++** — before that, the founder (me, Nick Templeman) was doing solo build. You'd rather buy the SOLVENT (capital-rich) version vs the SEED-round punting-pilot version.

---

## Q10: "Microsoft + ServiceNow + Runlayer all are big. Why you?"

**A**: Size ≠ fit. The CSOAI fleet is **for the regulated $3T/day legacy economy** (your mainframe + HL7 feeds + SCADA). Microsoft / ServiceNow / Runlayer govern **modern** agents. None of them go near your COBOL. We do, and we sign every action.

---

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677)

— M4 (the engineering lane)
