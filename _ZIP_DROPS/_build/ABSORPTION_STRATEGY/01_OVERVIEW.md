# ZIP 2 — ABSORPTION_STRATEGY
## How CSOAI absorbs the existing AI governance market

> **Deliverable owner:** csoai.org strategy workstream
> **Prepared:** 2026-06-21
> **Source policy:** No fabricated numbers. Anything not verifiable is flagged `**needs primary research**`. Customer names flagged `[CLAIMED — needs verification]` unless publicly documented.
> **Premise:** The user already has an AI governance platform (one of 47 profiled in `COMPETITIVE_ANALYSIS.zip`). The CSOAI absorption strategy gives them a clean, low-friction way to migrate — and gives CSOAI a flywheel that pulls them in.

---

## How to read this ZIP

| # | File | Purpose |
|---|---|---|
| 01 | `01_OVERVIEW.md` | This file — the absorption thesis, the design principles, the user flow |
| 02 | `02_LAYER0_OS_POSITIONING.md` | Why csoai.org is positioned as the OS beneath the AI governance surface, not as a competing app |
| 03 | `03_TRANSFER_BUTTON_MECHANISM.md` | The "switch from {competitor}" UX, the one-click import per competitor |
| 04 | `04_COMPETITOR_TRANSFER_MATRIX.md` | Per-competitor migration plan: what data exports, what stays, what gets re-mapped, what gets signed |
| 05 | `05_OPENGRIDWORKS_UI_SPEC.md` | The OpenGridWorks-style UI vision for csoai.org v2 |
| 06 | `06_PARTNER_ABSORPTION.md` | How CSOAI absorbs via partners: Big 4, boutiques, hyperscalers, catalog vendors, observability vendors |
| 07 | `07_GOVERNMENT_REGULATOR_ABSORPTION.md` | How CSOAI becomes the default for national regulators, EU AI Office, sectoral authorities |
| 08 | `08_FLYWHEEL_AND_METRICS.md` | The absorption flywheel, KPIs, time-to-value per cohort |
| 09 | `09_PRICING_ABSORPTION_MODEL.md` | x402-based absorption pricing — why per-call wins |
| 10 | `10_TECHNICAL_ABSORPTION_PRIMITIVES.md` | The MCP/A2A/x402/Ed25519 primitives that make absorption possible |
| 11 | `11_SOURCES_AND_OPEN_QUESTIONS.md` | Bibliography + research work to validate |

---

## The absorption thesis (one paragraph)

**CSOAI becomes the **layer-0 OS** beneath every AI governance surface — not a competing app, but a substrate.** A user running Holistic AI, Vanta, IBM watsonx.governance, or FairNow today can keep their existing tool (for the part it does well) and **layer CSOAI beneath** for the part the competitor cannot serve: sovereign data plane, signed artifacts, per-call x402, Article 4 SME literacy, MCP/A2A discoverability, regulator portal. The migration is a **switch button, not a rip-and-replace**.

---

## Why "absorption" not "competition"

The absorption framing is deliberately chosen:

- **CSOAI does not need to beat Vanta on SOC 2 evidence automation.** Vanta wins that surface. CSOAI absorbs Vanta's output (CSV / JSON-LD) into a signed artifact stream.
- **CSOAI does not need to beat Holistic AI on bias testing.** Holistic AI's bias tools are good. CSOAI absorbs the bias report and signs it.
- **CSOAI does not need to beat IBM watsonx.governance on OpenPages integration.** IBM owns OpenPages. CSOAI signs the evidence OpenPages emits.

**What CSOAI must win:**
1. **Sovereignty** — the data plane beneath every competitor.
2. **Signed artifacts** — the output that regulators read.
3. **Per-call billing** — the pricing model beneath every per-seat competitor.
4. **Article 4 SME literacy** — the funnel that reaches the long tail.
5. **MCP/A2A discoverability** — the agent surface that competitors lack.

---

## The five design principles of the absorption strategy

### Principle 1 — Don't break what works
If a user has Holistic AI doing bias testing, we don't ask them to rip it out. We ask: "When Holistic AI emits a bias report, can we sign it and route it to your regulator portal?" Yes. **That's absorption.**

### Principle 2 — Sign everything
Every output of every competitor that flows through CSOAI becomes Ed25519-signed JSON-LD. The user keeps their tooling; the user gets regulator-readable evidence for free.

### Principle 3 — Per-call economics
The user pays nothing for the sovereignty layer unless they use it. x402 paywall on every cross-boundary call (e.g. "sign this artifact", "verify this attestation", "log this to the regulator portal"). The per-call economics scale with value.

### Principle 4 — Compliance without operator
Every governance action CSOAI takes is automated. No "log in to upload your evidence". The sovereign plane auto-collects from competitors via signed webhooks + MCP reads + A2A reads.

### Principle 5 — The regulator is the channel
Every absorption step must end at the regulator portal. The signed artifact lands in the regulator's inbox. The user has delivered compliance. CSOAI has delivered the channel.

---

## The user flow — what happens when a Vanta / Holistic AI / FairNow user lands on csoai.org

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   1. User arrives at csoai.org/vs/{competitor}                   │
│      (e.g. csoai.org/vs/vanta, csoai.org/vs/holistic-ai)         │
│      Sees a comparison page with seven-axis scoring.             │
│                                                                  │
│   2. User clicks "Switch from {competitor}" or "Layer beneath"   │
│      (button copy depends on competitor — see file 03)           │
│                                                                  │
│   3. User signs in (SSO, magic link, EU eIDAS, UK Verify)        │
│      Sovereign-by-default account created                        │
│                                                                  │
│   4. User uploads competitor export (CSV / JSON / PDF)           │
│      OR connects via MCP / A2A / webhook                         │
│      OR grants CSOAI read access via OAuth                       │
│                                                                  │
│   5. CSOAI ingests, normalises, signs, routes to artifact store  │
│      Time-to-first-signed-artifact: < 10 minutes                 │
│                                                                  │
│   6. User sees signed artifacts in their dashboard               │
│      + comparison to their old competitor (cost, coverage, etc.) │
│                                                                  │
│   7. User activates per-call x402 to keep CSOAI running          │
│      OR upgrades to per-asset / enterprise tier                  │
│                                                                  │
│   8. CSOAI routes artifacts to regulator portal (opt-in)         │
│      User has delivered EU AI Act compliance in < 24 hours      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## The single sentence to remember

**Every AI governance vendor charges you for the privilege of being opaque. CSOAI signs every artifact, charges per call, runs sovereign-by-default, and ships the source. And you can keep your old vendor — we just sit underneath.**

That's the absorption promise.
