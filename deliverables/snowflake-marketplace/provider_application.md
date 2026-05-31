# Snowflake Marketplace Provider Application
## RegGeoInt Compliance Dataset

---

## Provider Information

**Company Name:** CSGA Global  
**Company Website:** https://csgaglobal.org  
**Contact Email:** protocols@meok.ai  
**Company Description:** CSGA Global operates the MEOK Protocol Nexus, the world's first regulatory geospatial intelligence platform for AI systems. We map AI regulations across 50+ jurisdictions and provide real-time compliance data to enterprises, governments, and defense organizations.

**Dataset Name:** RegGeoInt Global AI Compliance Dataset  
**Dataset Version:** 3.0.0-phase3  
**Update Frequency:** Daily at 00:00 UTC  
**Data Category:** Regulatory / Compliance / Geospatial  

---

## Dataset Description

### Overview
The RegGeoInt Compliance Dataset is the only real-time mapping of AI regulations across global jurisdictions. Updated daily as laws change, this dataset enables enterprises to assess compliance requirements for AI deployments, calculate cross-border deployment costs, monitor enforcement actions and penalty structures, and generate audit-ready compliance reports.

### Tables Included

#### 1. JURISDICTIONS (50+ records)
- JURISDICTION_CODE, NAME, REGION, EU_MEMBER
- FRAMEWORKS, FRAMEWORK_COUNT, ENFORCEMENT_DATE
- COMPETENT_AUTHORITY, LATITUDE, LONGITUDE, NOTES

#### 2. FRAMEWORKS (40+ records)
- FRAMEWORK_ID, NAME, SCOPE, STATUS, PENALTIES_MAX

#### 3. CROSS_BORDER_RULES (2,500+ records)
- SOURCE, TARGET, SHARED_FRAMEWORKS, NEW_REQUIREMENTS
- RISK_CHANGE, COMPLIANCE_COST_ESTIMATE_USD

#### 4. COMPLIANCE_HEATMAP (50+ records)
- JURISDICTION_CODE, NAME, LATITUDE, LONGITUDE
- INTENSITY (framework count), FRAMEWORKS, EU_MEMBER

### Data Freshness
- Daily refresh at 00:00 UTC
- Breaking regulatory changes pushed within 4 hours
- All versions retained for trend analysis

### Data Quality
- Source verification against primary legal sources
- Accuracy rate >99.5% (human-reviewed quarterly)

---

## Pricing Model

| Tier | Annual Cost | Includes |
|------|------------|----------|
| Consumer (Free) | $0 | JURISDICTIONS table only, monthly updates |
| Professional | $5,000 | All tables, daily updates, 5 users, standard support |
| Enterprise | $50,000 | All tables + custom, real-time, unlimited users, API access |
| Government | $250,000 | All tables + enforcement feeds, classified support, on-premise option |

**Revenue Share:** Provider 75% / Snowflake 25%

---

## Sample Queries

```sql
-- EU Member States with high framework density
SELECT NAME, FRAMEWORK_COUNT, COMPETENT_AUTHORITY
FROM REGGEOINT.JURISDICTIONS
WHERE EU_MEMBER = TRUE
ORDER BY FRAMEWORK_COUNT DESC;

-- Cross-border deployment cost: US to EU
SELECT TARGET_NAME, NEW_FRAMEWORK_COUNT, COMPLIANCE_COST_ESTIMATE_USD
FROM REGGEOINT.CROSS_BORDER_RULES
WHERE SOURCE = 'US' AND TARGET IN ('DE', 'FR', 'GB');

-- Compliance heatmap for visualization
SELECT NAME, LATITUDE, LONGITUDE, INTENSITY
FROM REGGEOINT.COMPLIANCE_HEATMAP
WHERE INTENSITY >= 4;
```

---

## Technical Requirements

- **Format:** Snowflake Native Tables (auto-ingested)
- **Size:** ~5MB per table per update
- **Integration:** Native data sharing, zero-copy cloning, 90-day time travel
- **Security:** SOC 2 Type II (planned Q3 2026), GDPR-compliant, encrypted

---

## Marketing Description

**Short:** Real-time AI regulatory compliance data across 50+ global jurisdictions. Cross-border deployment rules, enforcement dates, penalty structures, and geospatial heatmaps. Updated daily.

**Keywords:** AI compliance, EU AI Act, GDPR, regulatory intelligence, geospatial compliance, cross-border deployment, AI governance, risk management, NIST, framework mapping

---

## Contact

**Primary:** protocols@meok.ai  
**Technical:** security@meok.ai  
**Go-Live Target:** 2026-06-15

---

*Application prepared: 2026-05-30*
