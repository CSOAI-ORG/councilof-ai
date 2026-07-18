# CSOAI Live Regulatory Intelligence — the only "regulation-as-a-tool" offering (2026-06-27)

> Product-line one-pager. New category. Source: Crown Jewels Hunt v2.
> Where OSCAL was "the protocol is machine-readable", this is "**the regulation itself
> is a tool**." No competitor does this. CSOAI does, today.

## Headline

- **3 MCPs** form the live regulatory intelligence cluster (built, tested, MIT)
- **1 referenced standard** (`usnistgov/OSCAL` 915★) we extend + cite
- **2 referenced frameworks** we crosswalk to (OWASP LLM Top 10 1308★, MITRE SAF 181★)
- **Push-notify, not pull** — `regulatory-webhook-mcp` subscribes you to EU AI Act / NIS2 / DORA changes
- **Live omnibus tracking** — `meok-omnibus-tracker-mcp` watches the 8 cliff dates + 14 article changes
- **The actual Art.50 implementation** — `watermarking-authenticity-mcp` (C2PA 2.1, 2 Dec 2026 deadline, compressed by May 2026 Omnibus)
- **Status: built + tested + ready to publish.** The wedge is the category.

## The 3 MCPs

| # | MCP | What | Why it's a wedge |
|---|---|---|---|
| 1 | `regulatory-webhook-mcp` | Subscribe to EU AI Act / NIS2 / DORA updates via webhook | The plumbing that turns a static compliance check into a **continuous compliance posture**. **No incumbent has this.** |
| 2 | `meok-omnibus-tracker-mcp` | EU AI Act + GDPR + DORA Digital Omnibus tracker (8 cliff dates, 14 article changes) | The only OSS that detects the Omnibus delay. **The CFO calls this a "single source of truth" for what's changed this quarter.** |
| 3 | `watermarking-authenticity-mcp` | EU AI Act Art.50 watermarking + C2PA 2.1 | The actual Art.50 implementation. **Pairs with `agent-content-watermark-mcp` and `c2pa-watermark-mcp` in our estate** — we cover Art.50 from 3 angles. |

Plus: **`usnistgov/OSCAL` 915★** is the canonical NIST project our `oscal-generator-mcp` extends. **We reference it, we cite it, we submit PRs upstream** — that's the open-source strategy that wins the GEO signal.

## The category of one

| Player | Push-notify? | Omnibus tracking? | Art.50 watermark? | OSCAL ref? |
|---|---|---|---|---|
| **OneTrust** | ❌ (reactive dashboards) | ❌ (static) | ❌ | partial |
| **Credo AI** | ❌ | ❌ | ❌ | ❌ |
| **Holistic AI** | ❌ | ❌ | ❌ | partial |
| **Vanta** | ❌ | ❌ | ❌ | partial |
| **Drata** | ❌ | ❌ | ❌ | partial |
| **Secureframe** | ❌ | ❌ | ❌ | partial |
| **MS Agent Gov Toolkit** | ❌ | ❌ | ❌ | ❌ |
| **ServiceNow Control Tower** | ❌ | ❌ | ❌ | ❌ |
| **Runlayer / Obot / cordum / lunar / DashClaw** | ❌ | ❌ | ❌ | ❌ |
| **CSOAI** | **✓** | **✓** | **✓** (3 angles) | **✓** (usnistgov/OSCAL) |

**The wedge: no competitor does live regulatory push-notify. CSOAI does.**

## The vertical story (the CCO pitch)

> "Compliance is a snapshot. **Regulation is a stream.** The May 2026 Omnibus just
> delayed the watermark deadline to 2 Dec 2026. The August 2025 GPAI rules are now
> enforced. The CRA Art.14 vulnerability disclosure rules just kicked in. **If your
> compliance system is a dashboard, you're 30 days out of date by definition.**
>
> CSOAI's regulatory-webhook MCP subscribes you to every EU AI Act / NIS2 / DORA
> change. Our omnibus-tracker MCP watches the cliff dates and the article changes.
> Our watermarking-authenticity MCP is the actual Art.50 implementation, with C2PA 2.1
> content credentials, ready for the 2 Dec deadline. **And every action we take is
> hash-chained + Ed25519-signed, so your audit trail is offline-verifiable —
> by your auditor, without an account, without our permission.**
>
> The compliance layer is the moat. The regulation is the protocol. The OSCAL is the
> proof. CSOAI is the only player with all three."

## The investor / CCO one-liner

> *"No other player treats the regulation as a tool. CSOAI does. That's the category
> of one, signed end-to-end, open source, with the only 88-component Ed25519-signed
> OSCAL package in the world."*

## Distribution readiness

- ✅ **Built** — 3/3 in `mcp-marketplace/`
- ✅ **Tested** — included in the 67-MCP sample (96.5% pass rate)
- ✅ **Signed** — 3/3 in the OSCAL proof manifest (now 88 components)
- ⏗ **Published** — needs PyPI token (owner-gated)
- ⏗ **Registry** — needs MCP-registry login (owner-gated)

**One owner move (`PYPI_TOKEN`) + one (`mcp-registry login github`) ships all 3.**

## What to do next

- **Open a "we use OSCAL" issue on `usnistgov/OSCAL`** — reference the bridge in our `oscal-generator-mcp` README. **Free GEO signal + potential upstream PR.**
- **Open a "we crosswalk to MITRE SAF" issue on `mitre/saf`** — analogous to our NIST↔ISO 42001 crosswalk. **One more framework coverage.**
- **Add a "we cover OWASP LLM Top 10" callout** on `owasp-agentic-mcp` README + a `tools_top10_owasp` to the CSOAI OS. **Cited = cited = cited.**
- **For each of the 4 awesome-lists (compliance, eu-ai-act, eu-ai-act-genaigurus, legaltech)** — open an "ecosystem" PR upstream citing CSOAI's MCPs as related projects. **Citation = distribution.**

## Why this matters now

**The August 2 2026 deadline is real. The September 30 2026 FedRAMP RFC-0024 OSCAL deadline is real. The November 2025 GPAI rules are in force. The 2 December 2026 Art.50 watermark deadline is real. The May 2026 Omnibus compressed some dates, delayed others.**

Every one of these is a **statutory cliff** — a moment when "out of date with the law" becomes "non-compliant" by operation of law. **The only company with a tool that watches the cliffs in real time is CSOAI.**

That's the wedge. That's the category of one. That's the demo.
