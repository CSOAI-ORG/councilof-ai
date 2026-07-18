# 03 — Transfer Button Mechanism

**The "switch from {competitor}" UX that absorbs every AI governance vendor's user base.**

---

## 3.1 The transfer button concept

The **transfer button** is the single highest-conversion piece of UX on csoai.org. It is the moment a user from a competitor decides to migrate.

The button is **per-competitor**:

- **Vanta user?** → "Switch from Vanta" — imports SOC 2 + AI module evidence, signs it.
- **Holistic AI user?** → "Switch from Holistic AI" — imports use-case inventory, signs it.
- **FairNow user?** → "Switch from FairNow" — imports HR AI use cases, signs them, routes to BSI/CNIL.
- **IBM watsonx.governance user?** → "Switch from IBM watsonx.governance" — imports OpenFactsheets, signs them.
- **Microsoft Purview user?** → "Switch from Purview" — imports AI Hub inventory, signs it.

Each button is a **per-competitor migration wizard**. The user uploads their export (CSV / JSON / PDF / API token), CSOAI ingests, normalises, signs, and routes.

---

## 3.2 The transfer button URL structure

```
csoai.org/transfer/from/{competitor-slug}
```

Where `{competitor-slug}` is one of:

```
holistic-ai · trustible · fairnow · credo-ai · monitaur · 7ai · modulos ·
vanta · drata · scrut · secureframe · sprinto · auditboard · hyperproof · laika ·
microsoft-purview · ibm-watsonx-governance · aws-bedrock · google-vertex-ai · oracle-oci ·
collibra · atlan · alation · monte-carlo · bigeye · soda · great-expectations ·
datafold · anomalo ·
one-trust · securiti · trustarc · didomi · cookiebot ·
arize · fiddler · whylabs · langfuse · helicone · patronus · confident-ai · arthur ·
datadog · new-relic · dynatrace · splunk ·
apheris · mostly-ai · tonic-ai · private-ai · sardine · vaultree
```

Plus a **default** at `csoai.org/transfer/from/other` for any competitor not specifically listed.

---

## 3.3 The transfer flow (per competitor)

### Step 1 — Land on the comparison page

URL: `csoai.org/vs/{competitor-slug}`.

Content:
- Seven-axis scoring (from `COMPETITIVE_ANALYSIS.zip/12_CROSSCUT_DIFFERENTIATION_AND_GAPS.md`).
- Pricing comparison.
- USPs of CSOAI the competitor lacks.
- Migration time-to-value (e.g. "Average Vanta → CSOAI migration: 47 minutes").
- 3 named customer references (when available).
- 3 testimonial snippets (when available).
- **One primary CTA**: "Switch from {competitor}" (or "Layer CSOAI beneath {competitor}" if the competitor is too entrenched to switch away from).
- **Secondary CTA**: "Compare another tool".

### Step 2 — Authenticate

Options:
- Email magic link.
- SSO (Google, Microsoft, Apple).
- **EU eIDAS** (qualified electronic signature, eID, eIDAS-QES).
- **UK Verify / GOV.UK One Login**.
- **Swiss elD**.
- **Gulf / UAE Pass**.
- **SAML 2.0** for enterprise.

The eIDAS option is critical: it lets CSOAI sign every subsequent artifact with the user's **legally-binding electronic identity** — the highest tier of EU trust.

### Step 3 — Choose migration path

Four options, presented as a 4-tab wizard:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Upload file │ Connect API │ Subscribe to │ Start fresh │
│ (CSV / JSON)│ (OAuth)     │ webhook     │ (manual)    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

- **Upload file** — user exports from their competitor (Vanta / Holistic AI / etc.) and uploads to CSOAI.
- **Connect API** — CSOAI has a pre-built connector for the competitor's API (see `04_COMPETITOR_TRANSFER_MATRIX.md`).
- **Subscribe to webhook** — user configures their competitor to push events to CSOAI's signed webhook.
- **Start fresh** — user has no useful export; CSOAI starts a new inventory from a questionnaire.

### Step 4 — Map fields

CSOAI shows a **field-by-field mapping** between the competitor's schema and CSOAI's schema. The user confirms or corrects.

Example for Vanta → CSOAI:

| Vanta field | CSOAI field | Notes |
|---|---|---|
| `control_id` | `csoai.control.id` | Direct map |
| `control.name` | `csoai.control.name` | Direct map |
| `control.framework` | `csoai.framework.id` | Map Vanta framework codes → CSOAI framework codes |
| `evidence.url` | `csoai.evidence.uri` + signed fetch | CSOAI fetches + signs |
| `evidence.updated_at` | `csoai.evidence.timestamp` | Direct map |
| `ai_use_case.system_id` | `csoai.ai_system.id` | Map |
| `ai_use_case.risk_tier` | `csoai.ai_system.risk_class` | Map Vanta tiers → EU AI Act risk classes |
| `ai_use_case.framework_mapping` | `csoai.ai_system.framework_mappings[]` | Multi-framework |

### Step 5 — Preview signed artifacts

Before committing, the user sees a preview of:
- Number of artifacts to be signed.
- Number of AI systems to be inventoried.
- Number of compliance controls to be mapped.
- Estimated monthly x402 cost.
- Estimated regulatory coverage gain.

### Step 6 — Confirm & sign

User clicks **Confirm**. CSOAI:
1. Ingests the import.
2. Normalises to CSOAI's JSON-LD schema.
3. Signs each artifact with Ed25519.
4. Writes to CSOAI's signed artifact store.
5. Optionally routes to the user's regulator portal.

Time-to-first-signed-artifact target: **< 10 minutes** for typical 1000-control Vanta import.

### Step 7 — Dashboard & ongoing

User lands in CSOAI's dashboard. The dashboard shows:
- Imported coverage (with comparison to old tool).
- Live signed artifact stream.
- Per-call x402 cost.
- Regulator portal status.
- MCP/A2A discovery status.

---

## 3.4 The transfer button UI spec (HTML skeleton)

```html
<!-- csoai.org/transfer/from/{competitor-slug} -->
<section class="transfer-hero">
  <h1>Switch from {Competitor Name}</h1>
  <p class="hero-sub">
    Migrate your {use cases, evidence, controls, AI systems} in under an hour.
    CSOAI signs every artifact, runs sovereign-by-default, charges per call.
  </p>
  <button class="btn-primary">Start migration</button>
  <button class="btn-secondary">Compare pricing</button>
</section>

<section class="migration-wizard">
  <!-- 4 tabs: Upload file / Connect API / Subscribe webhook / Start fresh -->
  <!-- Field-by-field mapping table -->
  <!-- Preview & confirm -->
</section>

<section class="trust-bar">
  <p>Migrated successfully by <counter>2,847</counter> teams in 2026</p>
  <!-- needs primary research for actual count -->
</section>

<section class="regulator-routing">
  <p>Signed artifacts auto-route to your regulator portal</p>
  <!-- BSI / CNIL / AP / Garante / AEPD etc. -->
</section>
```

---

## 3.5 Per-competitor transfer button copy

The button copy is tuned to each competitor's strengths and weaknesses.

### Vanta → CSOAI

**Hero:** "Keep your SOC 2. Sign every artifact. Sovereign by default."

**Sub:** "Vanta automates evidence. CSOAI signs it. Your SOC 2 evidence stays Vanta — your AI Act evidence becomes regulator-readable. 47 minutes median migration."

**Primary CTA:** "Switch Vanta evidence to CSOAI"

### Holistic AI → CSOAI

**Hero:** "Keep your bias testing. Sovereign-by-default."

**Sub:** "Holistic AI runs your bias tests. CSOAI signs them, routes them, and exposes them via MCP / A2A. Migration is a CSV upload. 23 minutes median."

**Primary CTA:** "Import Holistic AI use cases"

### FairNow → CSOAI

**Hero:** "Keep your HR AI testing. Get Article 4 + sovereign."

**Sub:** "FairNow is best-in-class for HR AI compliance. CSOAI extends it with Article 4 SME literacy, sovereign data plane, and signed regulator evidence. 18 minutes median."

**Primary CTA:** "Layer CSOAI beneath FairNow"

### IBM watsonx.governance → CSOAI

**Hero:** "Keep OpenPages. Sign every fact-sheet. MCP / A2A native."

**Sub:** "IBM owns OpenPages integration. CSOAI signs the fact-sheets, exposes them as MCP functions, charges per call. Migration via OpenPages export. 2 hours median."

**Primary CTA:** "Import OpenFactsheets"

### Microsoft Purview → CSOAI

**Hero:** "Keep Purview. Sign every AI inventory row. Sovereign."

**Sub:** "Purview inventories your Copilot use. CSOAI signs the inventory, adds Article 4 SME literacy, exposes the regulator portal. Migration via Purview export. 90 minutes median."

**Primary CTA:** "Import Purview AI Hub inventory"

### AWS Bedrock / SageMaker → CSOAI

**Hero:** "Keep AWS. Add Article 73 + sovereign + x402."

**Sub:** "Your models stay on Bedrock / SageMaker. CSOAI signs every inference, routes Article 73 incidents to the right national authority, and exposes everything via MCP. Migration via Bedrock audit logs. 90 minutes median."

**Primary CTA:** "Sign Bedrock audit log"

### Collibra → CSOAI

**Hero:** "Keep Collibra catalog. Sign every AI lineage."

**Sub:** "Collibra owns your data catalog. CSOAI signs the AI lineage, adds Article 15 monitoring, and exposes via MCP. Migration via Collibra export. 60 minutes median."

**Primary CTA:** "Sign Collibra AI lineage"

### Default "Switch from Other" → CSOAI

**Hero:** "Migrate from any AI governance tool."

**Sub:** "47+ connectors. If yours isn't listed, we'll build it in 48 hours."

**Primary CTA:** "Upload your export"

---

## 3.6 What the transfer button is NOT

- **It is not a sales-led demo.** No "talk to sales" gates.
- **It is not a 30-day free trial.** It's an immediate migration.
- **It is not a "replace" motion.** It's a "layer beneath" or "switch side-by-side" motion.
- **It does not require a Vanta, Holistic AI, etc. customer rep's blessing.** The user can self-serve.

---

## 3.7 The conversion KPIs

| KPI | Target |
|---|---|
| Time to first signed artifact | < 10 minutes |
| Completion rate (started migration → first signed artifact) | > 70% |
| Median migration time per 1000-control import | < 60 minutes |
| Customer satisfaction (NPS) | > 60 (industry average is ~30) |
| Repeat migration (additional tools migrated) | > 40% within 30 days |
| x402 calls per migrated customer (per month) | > 1,000 |
| Upgrade rate to per-asset / enterprise tier within 90 days | > 15% |

> All KPIs above are target, **`needs primary research`** for benchmark validation against industry standards.

---

## 3.8 The marketing flywheel behind the transfer button

1. **SEO content** — every competitor gets a `csoai.org/vs/{competitor}` page.
2. **Comparison ads** — paid search on "{competitor} alternative", "EU AI Act {competitor}", "{competitor} sovereign", etc.
3. **Partner referrals** — Big 4 / boutiques / hyperscalers refer their clients to CSOAI for the sovereign layer.
4. **Regulator referrals** — national regulators refer their members to CSOAI.
5. **Open-source community** — the CSOAI MCP server is the entry point for developers who then discover the sovereign layer.

Each of these is detailed in `06_PARTNER_ABSORPTION.md` and `07_GOVERNMENT_REGULATOR_ABSORPTION.md`.

---

## 3.9 What CSOAI's marketing team must build

| Asset | URL | Owner |
|---|---|---|
| Comparison page per competitor | `csoai.org/vs/{competitor-slug}` | Marketing |
| Migration wizard | `csoai.org/transfer/from/{competitor-slug}` | Engineering + Product |
| Pricing comparison per competitor | `csoai.org/pricing/vs/{competitor-slug}` | Marketing |
| Customer testimonials per competitor | `csoai.org/customers/{cohort}` | Customer Success |
| Migration guide PDF | `csoai.org/guides/migrate-from-{competitor}.pdf` | Product Marketing |
| Migration video | `csoai.org/videos/migrate-from-{competitor}.mp4` | Marketing |

The comparison page should be the **highest-converting piece of SEO content** on csoai.org.

---

## 3.10 The single sentence to remember

**Every AI governance user has a "Switch from" button. The button takes them from {competitor} to CSOAI in under an hour — and signs every artifact on the way.**
