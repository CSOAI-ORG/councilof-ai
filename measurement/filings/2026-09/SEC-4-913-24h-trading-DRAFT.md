# DRAFT — not submitted

| Field | Value |
|---|---|
| Regulator | U.S. Securities and Exchange Commission (SEC) |
| Ref | **SEC File No. 4-913**, *Roundtable on Preparations for 24-Hour Trading*; press release 2026-69 (23 Jul 2026) |
| Event | Roundtable, **Thursday 17 September 2026** |
| Official URL | https://www.sec.gov (press release 2026-69; EDGAR file 4-913) |
| Submission route | Web form or rule-comments@sec.gov with "File Number 4-913" in the subject |
| Comment deadline | **None stated** on the press release (25 comments received as of 11 Sep 2026) |
| Owner step | Nick: (1) proofread; (2) submit only if the content is timely; (3) note this is a roundtable observation, not a rulemaking comment |
| Work order | #042 |
| Relevance | LOW — CSOAI holds no evidence on equity-market trading hours. This is a narrow observation about measurement infrastructure for continuous-operation regimes. |

---

## Comment body (paste from here)

**To:** rule-comments@sec.gov
**Subject:** Comment — File Number 4-913, Roundtable on Preparations for 24-Hour Trading (CSOAI Ltd)

CSOAI Ltd (England and Wales, Companies House 16939677; 3rd Floor, 86-90 Paul Street, London EC2A 4NE; nicholas@csoai.org) is an independent measurement body that publishes signed, machine-readable evidence about AI system behaviour at https://councilof.ai. **Measurement, not certification.** We have no commercial relationship with any exchange, broker-dealer, or ATS. **An AI assistant helped draft this comment. A person at CSOAI reviewed it, and every claim is linked to its source.**

We write to offer one narrow observation from our experience operating continuous-computation infrastructure.

### The measurement problem

A move to 24-hour trading extends the operational surface area of every exchange system. Continuous operation means continuous drift — in matching-engine behaviour, in market-data dissemination latency, in risk-controls responsiveness. A system that passes a point-in-time test at 10:00 AM may behave differently at 3:00 AM under different load patterns, different connectivity conditions, and different participant mixes.

We suggest the Commission consider whether continuous-operation regimes benefit from **continuous, independent, machine-readable measurement** of system properties — not just periodic compliance reviews. This is not a recommendation about what to measure or how to measure it. It is an observation that the same cryptographic-inclusion discipline we use for AI system measurement (hash a claim, commit to a root, witness the root, publish the chain) is applicable to any system whose behaviour needs to be verifiably recorded over time.

### What we do not claim

- We hold no evidence about equity-market trading hours, matching-engine behaviour, or market-data dissemination.
- We do not offer a product or service for exchange compliance.
- We do not suggest that our measurement infrastructure (designed for AI systems) is directly applicable to equity-market infrastructure without adaptation.

### Source

Our public measurement infrastructure (signed cards, Merkle root, OpenTimestamps + Rekor witnesses) is documented at https://councilof.ai/methodology. The correction-history ledger at https://councilof.ai/api/corrections (52 entries as of 15 Sep 2026) demonstrates one model for how continuous measurement can self-correct publicly.

---

**AI-assistance disclosure:** An AI assistant helped draft this comment. Every source URL was verified by a person at CSOAI.
