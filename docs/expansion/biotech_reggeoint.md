# Expansion Gap #3: Biotech / Genomics RegGeoInt
## CRISPR, Clinical Trials, and Gene Editing Governance

### Market Context
- **Global biotech market:** $500B+
- **Gene editing (CRISPR):** $15B by 2030
- **Clinical trials market:** $80B
- **Regenerative medicine:** $50B
- **Biotech regulatory compliance:** $20B by 2030

### The Problem
A gene therapy company wants to run a clinical trial across 5 countries. Each country has different rules for:
- **Ethics committee approval** (IRB / EC)
- **Genetic data protection** (beyond GDPR — genetic specificity)
- **Germline editing bans** (some total, some partial)
- **Clinical trial protocols** (FDA 21 CFR 312 vs EMA CT-1 vs PMDA)
- **Export of biological samples** (customs + biosafety)
- **Gene patent rules** (US allows, EU restricts, China encourages)

A CRISPR therapy approved in the US may be illegal in Germany. A stem cell treatment legal in Japan may be banned in France. **No platform maps these boundaries.**

### The Regulatory Landscape
| Jurisdiction | Area | Framework | Status | Key Rule |
|-------------|------|-----------|--------|----------|
| EU | Gene therapy | EMA ATMP | Enforcing | Centralized approval required |
| EU | Germline editing | Convention on Human Rights | Ban | Prohibited in all Member States |
| Germany | Gene editing | Embryo Protection Act | Ban | Germline editing criminal offense |
| UK | Gene editing | HFEA | Regulated | Case-by-case licensing |
| US | Gene therapy | FDA 21 CFR 312 | Enforcing | IND required, BLA for approval |
| US | Germline editing | FDA non-binding | Moratorium | No clinical applications funded |
| China | Gene editing | NHC / CAS | Restricted | He Jiankui scandal → strict controls |
| Japan | Regenerative medicine | PMDA | Enforcing | Conditional approval pathway |
| Singapore | Gene therapy | HSA | Enforcing | Clinical trial notification |
| Australia | Gene therapy | TGA | Enforcing | Gene technology regulator (OGTR) |
| India | Clinical trials | CDSCO | Enforcing | Phase I mandatory in India |
| Brazil | Clinical trials | ANVISA | Enforcing | Resolution RDC 9/2015 |

**CRISPR-specific complexity:**
- Somatic editing: Allowed in most jurisdictions with approval
- Germline editing: Banned in EU, restricted in US, unclear in China
- Gene drives: Moratorium in most jurisdictions
- Agricultural gene editing: Regulated as GMO in EU, unregulated in US

### Current "Competitors"
- **Veeva Systems:** Clinical trial management. No regulatory mapping.
- **Medidata:** EDC / clinical cloud. No cross-border compliance.
- **IQVIA:** Consulting + data. Manual regulatory intelligence.
- **Certara:** Biosimulation. No geospatial compliance.
- **Regulatory affairs consultancies (Parexel, ICON):** Bill $500/hour for manual research.

**Zero geospatial regulatory intelligence for biotech. Zero.**

### MEOK Biotech RegGeoInt: What We Build

#### Biotech-Specific MCP Tools
```python
BIOTECH_TOOLS = [
    "clinical_trial_jurisdiction_check",
    "gene_therapy_approval_pathway",
    "crispr_editing_legality_check",
    "biological_sample_export_rules",
    "genetic_data_protection_requirements",
    "stem_cell_treatment_regulatory_status",
    "agricultural_gmo_country_status",
    "biosafety_level_requirements",
]
```

#### Cross-Border Clinical Trial Advisory
```
GET /v1/biotech-compliance/trial/{protocol}/to/{jurisdictions}

Response:
{
  "protocol": "CRISPR-Cas9 Somatic Edit for Sickle Cell",
  "targets": ["US", "DE", "UK", "JP"],
  "approvals": {
    "US": {"status": "FDA BLA pathway", "timeline_months": 24, "cost_estimate": "$50M"},
    "DE": {"status": "EMA centralized", "timeline_months": 18, "cost_estimate": "€30M"},
    "UK": {"status": "MHRA + HFEA if germline", "timeline_months": 15, "cost_estimate": "£25M"},
    "JP": {"status": "PMDA conditional approval possible", "timeline_months": 12, "cost_estimate": "¥4B"}
  },
  "shared_requirements": ["GMP manufacturing", "Phase III RCT"],
  "divergent_requirements": {
    "DE": "Ethics committee approval in each Bundesland",
    "UK": "HFEA license if embryo involved",
    "JP": "QMS Ministerial Ordinance 169"
  },
  "compliance_cost_estimate": "$120M total across 4 jurisdictions"
}
```

#### Gene Editing Legality Matrix
| Edit Type | US | EU | UK | China | Japan | Singapore |
|-----------|-----|-----|-----|-------|-------|-----------|
| Somatic (therapeutic) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Somatic (enhancement) | 🟡 | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| Germline | ❌ | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| Gene drive | 🟡 | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| Agricultural | ✅ | ❌ (GMO) | 🟡 | ✅ | 🟡 | 🟡 |

### Revenue Model
| Segment | Price | Volume |
|---------|-------|--------|
| Big Pharma (Pfizer, Roche) | $1M/year | 20 companies |
| Biotech startups | $100K/year | 200 companies |
| CROs (Parexel, IQVIA) | $200K/year | 50 companies |
| Research hospitals | $25K/year | 500 institutions |
| **Total addressable** | | **$44.5M/year** |

### Go-To-Market
1. **Target:** Biotech startups first — highest pain, fastest decision-making
2. **Channel:** BIO International Convention, JP Morgan Healthcare
3. **Message:** "Run your trial in 5 countries without 5 regulatory teams"
4. **Partnership:** Veeva (they have clinical data, we have regulatory maps)
5. **Content:** "The CRISPR Map" — free gene editing legality guide

### Why MEOK Wins
- **Technical reuse:** Same geospatial engine, biological regulatory layer
- **High switching cost:** Trial protocols are sticky; changing compliance tools mid-trial = disaster
- **Data moat:** Gene therapy approval pathways are complex and rarely documented publicly
- **Ethics angle:** ASSTI transparency scores for biotech = public trust

### Strategic Value
Biotech is the most ethically regulated industry after nuclear weapons. Every country has different red lines. **A biotech company without a regulatory map is a biotech company that doesn't know where it's legal to operate.**

---

*Gap analysis: 2026-05-30*
*Market size: $500B+ biotech market, compliance layer = 2-4% = $10-20B*
*Competitor count in geospatial biotech compliance: 0*
