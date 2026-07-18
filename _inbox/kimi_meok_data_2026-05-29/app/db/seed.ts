import { getDb } from "../api/queries/connection";
import { datasets } from "./schema";

async function seed() {
  const db = getDb();

  // Seed datasets
  const datasetData = [
    {
      slug: "eu-ai-act-requirements",
      name: "EU AI Act Requirements",
      description: "Structured requirements mapping for the EU Artificial Intelligence Act across all risk categories",
      category: "governance" as const,
      sourceMcp: "meok-governance-engine",
      minTier: "free" as const,
      recordCount: 2847,
      status: "live" as const,
    },
    {
      slug: "gdpr-article-30-records",
      name: "GDPR Article 30 Records",
      description: "Processing activity records and ROPA templates for GDPR compliance",
      category: "governance" as const,
      sourceMcp: "meok-governance-engine",
      minTier: "free" as const,
      recordCount: 12401,
      status: "live" as const,
    },
    {
      slug: "hipaa-safe-harbor-mappings",
      name: "HIPAA Safe Harbor Mappings",
      description: "All 18 HIPAA identifier de-identification mappings and crosswalks",
      category: "healthcare" as const,
      sourceMcp: "healthcare-fhir-mcp",
      minTier: "free" as const,
      recordCount: 8920,
      status: "live" as const,
    },
    {
      slug: "fhir-r4-observations",
      name: "FHIR R4 Observations",
      description: "De-identified clinical observation data across vital signs, labs, and measurements",
      category: "healthcare" as const,
      sourceMcp: "healthcare-fhir-mcp",
      minTier: "pro" as const,
      recordCount: 1200000,
      status: "live" as const,
    },
    {
      slug: "mifid-ii-indicators",
      name: "MiFID II Indicators",
      description: "Regulatory indicator mappings and transaction reporting requirements",
      category: "financial" as const,
      sourceMcp: "meok-financial-mcp",
      minTier: "pro" as const,
      recordCount: 3456,
      status: "beta" as const,
    },
    {
      slug: "dora-ict-risk-metrics",
      name: "DORA ICT Risk Metrics",
      description: "Digital Operational Resilience Act risk metrics and compliance indicators",
      category: "financial" as const,
      sourceMcp: "meok-financial-mcp",
      minTier: "pro" as const,
      recordCount: 892,
      status: "beta" as const,
    },
    {
      slug: "nis2-compliance-gaps",
      name: "NIS2 Compliance Gaps",
      description: "Network and Information Security 2 Directive gap analysis data",
      category: "governance" as const,
      sourceMcp: "meok-governance-engine",
      minTier: "free" as const,
      recordCount: 1204,
      status: "live" as const,
    },
    {
      slug: "cross-framework-mappings",
      name: "Cross-Framework Mappings",
      description: "Correlation mappings between EU AI Act, NIST AI RMF, ISO 42001, and other frameworks",
      category: "governance" as const,
      sourceMcp: "meok-governance-engine",
      minTier: "pro" as const,
      recordCount: 5678,
      status: "live" as const,
    },
  ];

  for (const ds of datasetData) {
    await db.insert(datasets).values(ds).onDuplicateKeyUpdate({
      set: { updatedAt: new Date() },
    });
  }

  console.log(`Seeded ${datasetData.length} datasets`);
}

seed().catch(console.error);
