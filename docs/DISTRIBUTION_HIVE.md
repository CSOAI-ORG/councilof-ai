# CSOAI Distribution Hive — the finite-TAM, account-based engine

> The plan for turning CSOAI's *nameable* market into a data spine, a testing loop, and a live-demo close machine. Integrates with `ALIGNMENT.md` (what's live) and `ABSORPTION.md` (what we've absorbed). Read with the honesty guardrails at the bottom — they are non-negotiable.

---

## 0. The core insight (why this works)

The entire CSOAI ideal market is **finite, public, and can be listed by name**:

| Segment | Approx. count | All public? |
|---|---|---|
| National governments + regulators + AI/cyber authorities | ~400 | ✅ yes |
| Fortune 100 | 100 | ✅ yes |
| Fortune 500 (incl. the 100) | 500 | ✅ yes |
| Global 2000 net-new | ~1,500 | ✅ yes |
| High-exposure sectors (banks, insurers, health, defence, AI labs) | ~5,000 | ✅ yes |
| **Total addressable, nameable, public** | **< 10,000** | ✅ |

A market this small means **we don't need mass marketing — we need to know every account by name.** Every account becomes a row in a dataset that simultaneously powers the **globe**, **Sov Space**, the **Sovereign** view, **leads**, and **tailored demos**. One dataset, five products.

---

## 1. The Ecosystem Dataset (the spine)

A single, versioned, **org-level** dataset — the source of truth for globe layers, ABM, and demo targeting.

**Entity = an organisation (never a private individual).** Schema:
```
{ id, name, type: gov|regulator|fortune100|fortune500|global2000|sector,
  region, country, hq_geo:[lng,lat],           // → globe pin
  jurisdictions:[eu,us,uk,...],                 // → which regimes apply
  frameworks_in_scope:[eu-ai-act,dora,nis2,...],// derived from sector+jurisdiction
  ai_posture: none|emerging|mature,             // from their public disclosures
  current_vendor: none|vanta|drata|credo|onetrust|internal,
  play: absorb|integrate|displace,              // the CSOAI move (see §3)
  public_sources:[urls],                        // every claim is cited
  outreach_status: new|researched|contacted|demo|won|lost }
```
**Sources are public only:** the org's own website, trust/security/compliance pages, annual reports, regulator registers, job posts (signal of AI hiring), press. Contact data comes **only** from the user's connected, licensed B2B tools (Apollo / ZoomInfo) under a legitimate-interest basis — never scraped dossiers on individuals (see guardrails).

This dataset replaces today's hard-coded globe layers with **one real, cited, honest dataset** that the globe, Sov Space and leads all read from.

---

## 2. The Hive pipeline (per account)

```
 IDENTIFY → RECON → ACCOUNT REPORT → SIDE-BY-SIDE TEST → PLAY DECISION → LIVE DEMO → FIX-IN-DEMO → CLOSE
```

1. **Identify** — pull the next account from the finite list (prioritised by exposure × enforcement deadline × fit).
2. **Recon** (public web): their site, trust/security page, published AI-governance posture, current vendor (badges reveal it), tech stack, sector, jurisdictions → fills the dataset row, every field cited.
3. **Account Report** — a structured one-pager: profile · frameworks-in-scope · current posture · current vendor · the gaps CSOAI closes.
4. **Side-by-side test** — run the account through the **fixed testing rubric** (§4). Score CSOAI vs their current state on each capability. This is where we learn their weaknesses and our USPs, per account.
5. **Play decision** (§3): Absorb, Integrate, or Displace.
6. **Live demo** — Sovereign OS on the globe + SaaS/SAP + Layer 0 connect, **tailored to their report** (their frameworks, their jurisdiction, their gaps). Show how easy it is to connect.
7. **Fix-in-demo loop** — anything that breaks or is weak during a side-by-side gets **fixed then and there** and shipped. Every demo hardens the platform for everyone. (This is our compounding advantage.)
8. **Close + onboard** — MCP install / OS access / signed attestations.

---

## 3. The three plays (what CSOAI does per account)

- **ABSORB** — they have *no* real AI-governance tooling → CSOAI **is** their platform (OS + tools + attestation). Easiest win.
- **INTEGRATE** — they have point tools / an internal stack → CSOAI is the **governance layer *under* them** (the MCP, Layer 0 signing, the crosswalk). We don't replace, we prove.
- **DISPLACE** — they run Vanta/Drata/Credo/OneTrust → **clean house**: side-by-side on the axes those tools are weak (agentic-native, verifiable Ed25519 proof, 13-framework crosswalk, 300+ MCP fleet, sovereign data). Battlecards in `/compare` + `/competitors`.

---

## 4. The fixed testing rubric (know every weakness + USP)

Score CSOAI vs the account's current state (0–3) on each — same rubric every time, so results are comparable and the globe can visualise coverage:

| Axis | What we test |
|---|---|
| Framework coverage | Do all their in-scope regimes map to one control set? (crosswalk) |
| Agentic governance | Can they govern AI *agents* (cards, oversight, inter-agent risk)? |
| Verifiable proof | Signed, reproducible attestations vs screenshots? |
| Live tooling | Do the tools actually *run* (not a dashboard)? |
| Enforcement timing | Are they ready for their next deadline? (countdown) |
| Sovereignty / data | Do they own their data + models? |
| Integration effort | One command (MCP) vs a project? |

Output per account = a radar/score that feeds the report **and** a globe overlay ("coverage vs gap").

---

## 5. Integration with existing phases

- **Feeds the globe** (`globe3d.html`): the dataset becomes real, cited pins/layers (gov, fortune, regulators, sector) replacing hard-coded ones — honest, not decorative.
- **Feeds Sov Space**: each account is a simulate-able governance scenario.
- **Feeds `/agent-registry` + Sovereign**: our own signed agents demo against their stack.
- **Uses the built pages** as demo surfaces: `/crosswalk`, `/classifier`, `/agent-governance`, `/article-50`, `/dora`, `/nis2`, `/cra`, `/global-ai-regulation`.
- **Uses the MCP** (`csoai-governance-mcp`) as the "how easy to connect" moment.
- **Contacts** flow through the user's connected Apollo/ZoomInfo/HubSpot (their accounts, their legitimate-interest basis).

---

## 6. Ground-truth first (no LLM jargon — see FRAMEWORK_GROUND_TRUTH.md)

Every framework claim on the platform must trace to a **primary source**. We read each framework (NIST AI RMF, ISO 42001, EU AI Act, DORA, NIS2, CRA, TC260…) one at a time, verify every date/obligation on our pages against the official text, and mark it verified in the register. The globe, Sovereign and the account reports may only state what's in the register. **Truth is the product.**

---

## 7. Guardrails (non-negotiable)

- **Org-level intelligence only.** We profile *organisations* from *public* sources. We do **not** compile cross-source dossiers on private individuals. Individual contact data comes only from licensed B2B tools the user has connected, used under a documented legitimate-interest basis, honouring opt-outs.
- **Public sources, cited.** Every dataset field carries its source URL. No invented facts, ever.
- **Honest comparisons.** Competitor claims must be sourced and fair (no fabricated weaknesses). Battlecards cite.
- **No fabricated regulatory facts.** Only what's in FRAMEWORK_GROUND_TRUTH.md, with dates flagged indicative where not yet verified.
- **Respect their systems.** Public-web reading only; nothing abusive, no auth-walled scraping, no CAPTCHAs.

---

## 8. First executable steps

1. Stand up `client/src/data/ecosystem.ts` — the schema above + a small **seed of real, cited public accounts** (start with regulators + a few Fortune 100 with public AI posture).
2. Build `/intel` — an account-report view that renders a row + runs the §4 rubric + tailors demo links.
3. Point one globe layer at the dataset (proof it's real, not hard-coded).
4. Run the framework ground-truth loop (NIST first) and green the register.
5. Pick the first 10 accounts (highest exposure × nearest deadline) and run the full Hive pipeline end-to-end.

*One dataset, cited and true → the globe, Sov Space, Sovereign, leads and demos all become the same living thing. That's the true global platform.*
