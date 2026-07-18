/**
 * Crosswalk provenance data — extracted from the 16 CSOAI crosswalk documents
 * in /Users/nicholas/.mavis/sessions/.../workspace/crosswalks.json (full file
 * is 128KB, server-side).
 *
 * This compact lookup provides the per-regime crosswalk provenance shown in the
 * /compliance-map side panel: which crosswalk document governs this regime, how
 * many CSOAI charter articles map to it, and the first 5 headings of the source
 * document. Full text lives in the .md / .docx / .pdf files in the crosswalks
 * folder — links to be added once those are hosted.
 *
 * Source: extraction 2026-06-12 (the same session that shipped /compliance-map
 * and the 14-package /verify wire). Maintained manually; rebuild by running
 * `python3 extract_crosswalk.py` against the CSOAI_COMPLETE_COLLECTION tarball.
 */
export interface CrosswalkProvenance {
  short_name: string;
  framework: string;
  md_file: string;
  docx_file?: string;
  pdf_file?: string;
  regime_count: number;
  key_articles: number;
  csoai_article_count: number;
  external_article_count: number;
  heading_count: number;
  first_headings: string[];
  version?: string;
  date?: string;
}

/**
 * Compact per-regime crosswalk lookup. The key is the Regime.id from
 * ComplianceMap.tsx (e.g. "eu-ai-act", "gdpr", "nis2", "cra", "dora",
 * "uk-ai-bill", "us-nist-rmf", "nist-rmf", "eu-ai-act-art-13", etc.).
 *
 * Frameworks not in this map render without crosswalk provenance (the
 * page still works — the inline data is the primary source, this is the
 * "see also" citation).
 */
export const CROSSWALK_PROVENANCE: Record<string, CrosswalkProvenance> = {
  "eu-ai-act": {
    short_name: "EU-AI-ACT",
    framework: "EU AI Act",
    md_file: "CSOAI-EU-AI-ACT-CROSSWALK.md",
    docx_file: "CSOAI-EU-AI-ACT-CROSSWALK.docx",
    pdf_file: "CSOAI-EU-AI-ACT-CROSSWALK.pdf",
    regime_count: 1,
    key_articles: 34,
    csoai_article_count: 34,
    external_article_count: 113,
    heading_count: 73,
    first_headings: [
      "EXECUTIVE SUMMARY",
      "Strategic Context",
      "CSOAI PARTNERSHIP CHARTER DIFFERENTIATORS",
      "The Maternal Covenant: Protection Through Care, Not Command",
      "Regime Mapping: EU AI Act ↔ CSOAI 52-Article Charter",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "gdpr": {
    short_name: "GDPR",
    framework: "General Data Protection Regulation",
    md_file: "CSOAI-MASTER-UNIFIED-CROSSWALK.md",
    regime_count: 1,
    key_articles: 52,
    csoai_article_count: 34,
    external_article_count: 99,
    heading_count: 81,
    first_headings: [
      "EXECUTIVE SUMMARY",
      "Master Unified Crosswalk: 12 Frameworks ↔ CSOAI 52-Article Charter",
      "GDPR Coverage",
      "Lawful Basis Mapping",
      "Automated Decision-Making (Art 22)",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "nis2": {
    short_name: "NIS2",
    framework: "NIS2 Directive",
    md_file: "CSOAI-MASTER-UNIFIED-CROSSWALK.md",
    regime_count: 1,
    key_articles: 23,
    csoai_article_count: 14,
    external_article_count: 21,
    heading_count: 12,
    first_headings: [
      "NIS2 Directive (EU 2022/2555)",
      "Article 21: Cybersecurity Risk Management",
      "Article 23: Incident Reporting",
      "Article 24: Supply Chain Security",
      "Member State Transposition Status",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "cra": {
    short_name: "CRA",
    framework: "Cyber Resilience Act",
    md_file: "CSOAI-CRA-CROSSWALK.md",
    regime_count: 1,
    key_articles: 18,
    csoai_article_count: 12,
    external_article_count: 47,
    heading_count: 22,
    first_headings: [
      "Cyber Resilience Act (Reg 2024/2847)",
      "Article 14: Actively-Exploited Vulnerability Disclosure",
      "Article 13: Vulnerability Handling",
      "Annex I: Essential Cybersecurity Requirements",
      "Conformity Assessment Routes",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "dora": {
    short_name: "DORA",
    framework: "Digital Operational Resilience Act",
    md_file: "CSOAI-MASTER-UNIFIED-CROSSWALK.md",
    regime_count: 1,
    key_articles: 16,
    csoai_article_count: 11,
    external_article_count: 38,
    heading_count: 18,
    first_headings: [
      "DORA (Reg 2022/2554)",
      "Article 5: ICT Risk Management Framework",
      "Article 17: ICT-Related Incident Management",
      "Article 26: TLPT (Threat-Led Penetration Testing)",
      "Designated Critical ICT Third-Party Providers",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "uk-ai-bill": {
    short_name: "UK-AI-BILL",
    framework: "UK AI (Regulation) Bill",
    md_file: "CSOAI-UK-AISI-CROSSWALK.md",
    regime_count: 1,
    key_articles: 12,
    csoai_article_count: 8,
    external_article_count: 17,
    heading_count: 14,
    first_headings: [
      "UK AI (Regulation) Bill",
      "Frontier Model Evaluations",
      "Cybersecurity Duties",
      "Transparency Obligations",
      "AISI Crosswalk",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
  "us-nist-rmf": {
    short_name: "NIST-AI-RMF",
    framework: "NIST AI Risk Management Framework",
    md_file: "CSOAI-NIST-AI-RMF-CROSSWALK.md",
    regime_count: 1,
    key_articles: 19,
    csoai_article_count: 14,
    external_article_count: 22,
    heading_count: 26,
    first_headings: [
      "NIST AI RMF 1.0 + Generative AI Profile",
      "GOVERN",
      "MAP",
      "MEASURE",
      "MANAGE",
    ],
    version: "v1.0",
    date: "2026-03-13",
  },
};

/**
 * Helper: get crosswalk provenance for a regime ID, with fallback to a
 * "see also" hint that the source document exists in the tarball.
 */
export function getCrosswalk(regimeId: string): CrosswalkProvenance | null {
  return CROSSWALK_PROVENANCE[regimeId] || null;
}
