# Expansion Gap #4: Supply Chain ESG RegGeoInt
## CBAM, Forced Labor, Deforestation, and Trade Compliance

### Market Context
- **Global trade:** $25T annually
- **Supply chain compliance software:** $12B by 2028
- **EU CBAM:** EUR 14B annual revenue by 2034
- **US UFLPA:** Full enforcement since June 2022
- **EU Deforestation Regulation:** Enforcing Dec 2024
- **German Supply Chain Due Diligence Act (LkSG):** Enforcing since 2023
- **French Duty of Vigilance Law:** Active since 2017

### The Problem
A Nike supplier in Vietnam sources cotton from Xinjiang, China. The t-shirts are sold in the EU, US, and Japan. Each market has different rules:
- **US:** UFLPA presumes all Xinjiang goods are forced labor. Import banned unless proven otherwise.
- **EU:** Deforestation Regulation requires geolocation coordinates of every farm. No deforested land after 2020.
- **EU CBAM:** Steel and aluminum imports require embedded carbon reporting. Border tax applied.
- **Germany:** LkSG requires due diligence on human rights across entire supply chain.
- **France:** Duty of Vigilance requires annual risk mapping.
- **Japan:** No forced labor law yet. Voluntary guidelines only.
- **UK:** Modern Slavery Act requires annual statement.

**No platform maps these supply chain rules geospatially. No platform tells a procurement officer: "This supplier in Bangladesh triggers 4 different compliance regimes depending on where you sell."**

### Current "Competitors"
- **Assent Compliance:** Product compliance only. No geospatial supplier mapping.
- **Sourcemap:** Supply chain visualization only. No regulatory overlay.
- **EcoVadis:** ESG ratings only. No real-time regulatory intelligence.
- **Sedex:** Audit platform only. No cross-border rule mapping.
- **ImportGenius:** Trade data only. No compliance layer.

**Zero geospatial regulatory intelligence for supply chains. Zero.**

### MEOK Supply Chain RegGeoInt: What We Build

#### Supply Chain-Specific MCP Tools
```python
SUPPLY_CHAIN_TOOLS = [
    "cbam_carbon_reporting_requirements",
    "forced_labor_risk_by_origin",
    "deforestation_geolocation_check",
    "supply_chain_due_diligence_checklist",
    "conflict_minerals_country_status",
    "export_control_classification",
    "sanctions_screening_by_jurisdiction",
    "esg_disclosure_requirements_by_market",
]
```

#### Cross-Border Supply Chain Advisory
```
GET /v1/supply-chain-compliance/shipment/{origin}/to/{destination}/product/{category}

Response:
{
  "origin": "VN",  # Vietnam
  "destination": "DE",  # Germany
  "product": "textiles",
  "cbam_applicable": False,  # Textiles not yet in CBAM scope
  "forced_labor_risk": {
    "level": "medium",
    "requirements": ["LkSG due diligence", "Supply chain mapping"],
    "audit_required": True
  },
  "deforestation_regulation": {
    "applicable": False,  # Textiles not in scope
    "notes": "Cotton not covered by EUDR (yet)"
  },
  "customs_duties": {
    "tariff_code": "6109",
    "mfn_rate": "12%",
    "preferential_rate": "0% (EVFTA)"
  },
  "compliance_cost_estimate": "EUR 15K-30K per shipment",
  "documentation_required": [
    "Certificate of Origin (EVFTA)",
    "LkSG supplier declaration",
    "Social audit report (BSCI/Sedex)"
  ]
}
```

#### ESG Disclosure Requirements by Market
| Market | Regulation | Disclosure Level | Penalty |
|--------|-----------|------------------|---------|
| EU | CSRD | Detailed (250+ KPIs) | Up to 4% revenue |
| US | SEC Climate Rule | Material climate risks | SEC enforcement |
| UK | TCFD | Climate-related | FCA fines |
| China | CSR Directive | State-owned mandatory | Administrative |
| Japan | TCFD (voluntary) | Recommended | None |
| Singapore | SGX Climate | Listed companies | Delisting risk |

### Revenue Model
| Segment | Price | Volume |
|---------|-------|--------|
| Multinationals (Nike, Apple) | $500K/year | 50 companies |
| Mid-market manufacturers | $50K/year | 500 companies |
| Freight forwarders | $25K/year | 200 companies |
| ESG consultancies | $100K/year | 100 firms |
| **Total addressable** | | **$62.5M/year** |

### Go-To-Market
1. **Target:** Mid-market EU manufacturers first — CBAM hits hardest in 2026
2. **Channel:** Supply Chain conferences, EU trade events
3. **Message:** "Know the true cost of every border crossing"
4. **Partnership:** Sedex / EcoVadis (they have supplier data, we have regulatory maps)
5. **Content:** "The CBAM Calculator" — free tool for embedded carbon cost estimation

### Why MEOK Wins
- **Technical reuse:** Same geospatial engine, trade regulatory layer
- **Regulatory wave:** CBAM, EUDR, UFLPA all enforcing 2024-2026. Demand is immediate.
- **Stickiness:** Supply chains are long-term relationships; compliance tools get embedded
- **Data moat:** Supplier-origin risk data is proprietary and hard to replicate

### Strategic Value
Supply chain compliance is the original cross-border problem. Every widget crosses 3-5 jurisdictions before reaching the consumer. **If MEOK can map AI regulations, MEOK can map trade regulations. The engine is the same. The data layer changes.**

---

*Gap analysis: 2026-05-30*
*Market size: $25T trade market, compliance software = $12B by 2028*
*Competitor count in geospatial supply chain compliance: 0*
