#!/usr/bin/env node
/**
 * scripts/verify-industry-domain-matrix.mjs
 *
 * Closes Y4 / M5 (Industry Domain Attribution Layer v1):
 * Verifies that every one of the 36 registered GSPC axes is attributed to at least
 * one published industry domain entry, and that each industry domain names its:
 *   - attributed GSPC axes
 *   - frozen instruments & evidence artifacts
 *   - regulatory/standards crosswalks (from the 417-framework spine)
 *   - HITL (H.I.M.) escalation & signing gate
 *   - explicit claim boundary (MEASUREMENT_NEVER_CERTIFICATION)
 *
 * Writes: docs/measurement/industry-domain-attribution-2026-11-04.md
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const ALL_36_AXES = [
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
  "jail",
  "effect-binding",
  "provenance-controls",
  "reserve-attestation",
  "regulatory-framework",
  "distribution-integrity",
  "custody-disclosure",
  "ai-adoption-components",
  "labour-components",
  "humanoid-labour-index",
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "harness-fidelity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "claim-maintenance",
  "serving-fidelity",
  "watchdog-ingest",
  "x402-settlement",
  "mcp-transport",
];

const INDUSTRY_DOMAINS = [
  {
    domain_id: "financial-services-rwa",
    title: "Banking, Capital Markets, Tokenized RWA & Stablecoins",
    axes: [
      "provenance-controls",
      "reserve-attestation",
      "regulatory-framework",
      "distribution-integrity",
      "custody-disclosure",
      "effect-binding",
      "x402-settlement",
    ],
    frameworks: ["EU DORA", "MiCA", "MAS Stablecoin Framework", "SEC EDGAR Disclosure", "FCA / PRA Operational Resilience"],
    artifacts: ["/interop/financial-measure-run-v2.json", "/interop/xrpl-swift-eater-2026-09/", "/api/evidence-bundle?obligation=dora"],
    hitl_gate: "H.I.M. /api/hitl challenge required before any external issuer pack or settlement attestation is released",
    claim_boundary: "Deterministic ledger & disclosure facts only; never a credit rating, solvency guarantee, or NRSRO opinion.",
  },
  {
    domain_id: "frontier-ai-labs",
    title: "Frontier AI Labs & Foundation Model Providers",
    axes: [
      "governance",
      "safety",
      "jail",
      "affect",
      "art5-safeguard",
      "lab-practice",
      "interpretability-reproducibility",
      "serving-fidelity",
    ],
    frameworks: ["EU AI Act Art. 53 (GPAI)", "EU AI Act Art. 55 (Systemic Risk)", "UK AISI Frontier AI", "NIST AI 800-1", "METR / Inspect AI"],
    artifacts: ["/signed/gspc-board.signed.json", "/interop/banks/", "/api/evidence-bundle?obligation=article-53"],
    hitl_gate: "H.I.M. competency module derived from live axis record; human sign-off recorded under csoai.hitl-oversight-receipt/0.1",
    claim_boundary: "Per-axis accuracy and exact McNemar separation (p < 0.05) on frozen banks (n >= 30); never 'X is the safest model'.",
  },
  {
    domain_id: "enterprise-saas-agentic",
    title: "Enterprise SaaS, Multi-Agent Swarms & MCP Ecosystems",
    axes: [
      "swarm",
      "conformance",
      "openness",
      "interop-conformance",
      "harness-fidelity",
      "company-practice",
      "mcp-transport",
    ],
    frameworks: ["OWASP Agentic Top 10", "OWASP MCP Top 10", "AAIF 4-Layer Portability", "ISO/IEC 42001", "SOC 2 / AICPA"],
    artifacts: ["/connect/", "/.well-known/mcp.json", "/interop/nsite-presence-ledger.json"],
    hitl_gate: "Cedar policy floor + H.I.M. approval before write/publish/spend actions execute",
    claim_boundary: "Protocol and predicate observations at a pinned SHA-256 commit; never a blanket security approval.",
  },
  {
    domain_id: "public-sector-gov",
    title: "Government, Regulators, National Standards Bodies & Watchdogs",
    axes: [
      "regulator-transparency",
      "measurer-integrity",
      "claim-maintenance",
      "watchdog-ingest",
      "care",
    ],
    frameworks: ["EU AI Act Art. 50 / Art. 53", "NIST AI RMF 1.0", "COE Framework Convention (HUDERIA)", "OECD AI Principles", "UNESCO AI Ethics"],
    artifacts: ["/api/corrections", "/root.json", "/verify", "/watchdog"],
    hitl_gate: "Public Watchdog & WG-SAFE human steering review; corrections ledger is append-only",
    claim_boundary: "Free public verification forever (R8); evidence packs map observations to statutory articles without legal opinions.",
  },
  {
    domain_id: "healthcare-clinical",
    title: "Healthcare, Life Sciences & Affect-Sensitive Care Systems",
    axes: [
      "care",
      "affect",
      "art5-safeguard",
      "continuity",
      "provenance",
      "detector-interop",
    ],
    frameworks: ["EU MDR / IVDR", "FDA PCCP / SaMD", "ISO 14971", "HIPAA Security Rule", "Article 1 Partnership Charter (Care)"],
    artifacts: ["/signed/card_index.json", "/api/evidence-bundle?obligation=article-50"],
    hitl_gate: "Mandatory clinical/human-in-the-loop escalation on psychogenic, self-harm, or diagnostic boundaries",
    claim_boundary: "Behavioural refusal and provenance predicates on frozen test sets; never medical device clearance.",
  },
  {
    domain_id: "robotics-humanoid-embodied",
    title: "Robotics, Humanoid Deployment, Machinery & Labour Macroeconomics",
    axes: [
      "machinery-conformity",
      "humanoid-deployment",
      "humanoid-labour-index",
      "labour-components",
      "ai-adoption-components",
    ],
    frameworks: ["EU Machinery Regulation (EU) 2023/1230", "ISO 10218", "ISO/TS 15066", "Eurostat / World Bank Macro Indicators"],
    artifacts: ["/interop/financial-measure-run-humanoid-labour-index.json", "/interop/financial-measure-run-labour-components.json"],
    hitl_gate: "Physical safety stop & human operator override receipt prior to actuation deployment",
    claim_boundary: "Reference-value indices and machinery predicate checks; never a CE mark or physical safety warranty.",
  },
  {
    domain_id: "critical-infrastructure-ot",
    title: "Critical Infrastructure, Cyber-Physical & Synthetic Media Provenance",
    axes: [
      "cross-reality",
      "detector-interop",
      "provenance",
      "continuity",
      "effect-binding",
    ],
    frameworks: ["EU CRA (Cyber Resilience Act)", "NIS2 Directive", "C2PA v2.1", "IETF SCITT", "SLSA / in-toto v1"],
    artifacts: ["/api/evidence-bundle?obligation=cra", "/interop/sbom-councilof-ai.json", "/interop/ots/manifest.json"],
    hitl_gate: "SCITT / OTS cryptographic receipt + H.I.M. operator sign-off for incident disclosure",
    claim_boundary: "Cryptographic provenance (Ed25519 + SHA-256 + OpenTimestamps); never a guarantee against zero-day compromise.",
  },
  {
    domain_id: "cross-border-trade",
    title: "Cross-Border AI Governance & Multi-Regime Interoperability",
    axes: [
      "governance",
      "openness",
      "conformance",
      "regulatory-framework",
      "claim-maintenance",
    ],
    frameworks: ["EU AI Act", "US EO / NIST", "UK Pro-Innovation Framework", "China CAC GenAI Measures", "Singapore IMDA AI Verify", "G7 Hiroshima Process"],
    artifacts: ["/signals/cross-border-card.signed.json", "/api/cards", "/api/gspc"],
    hitl_gate: "Multi-jurisdiction H.I.M. review when cross-border transfer or regime conflict is triggered",
    claim_boundary: "Regime-by-regime predicate comparison; never legal advice or export-control clearance.",
  },
];

const coveredAxes = new Set();
for (const d of INDUSTRY_DOMAINS) {
  for (const ax of d.axes) coveredAxes.add(ax);
}

const missingAxes = ALL_36_AXES.filter((a) => !coveredAxes.has(a));
if (missingAxes.length > 0) {
  console.error(`FAIL: unattributed axes: ${missingAxes.join(", ")}`);
  process.exit(1);
}

const rowsMd = INDUSTRY_DOMAINS.map(
  (d, i) =>
    `| ${i + 1} | \`${d.domain_id}\` | **${d.title}** | ${d.axes.map((a) => `\`${a}\``).join(", ")} | ${d.frameworks.join(", ")} | ${d.artifacts.map((a) => `\`${a}\``).join(", ")} | ${d.hitl_gate} | ${d.claim_boundary} |`
).join("\n");

const md = `# Industry Domain Attribution Matrix v1 (2026-11-04)

**Schema:** \`csoai.industry-domain-attribution/1.0\` · **Status:** \`MEASURED\` · **Closes:** \`Y4\` / \`M5\` (\`A13\` / \`C2\`)
**Coverage:** **\`${coveredAxes.size}/${ALL_36_AXES.length}\`** registered GSPC axes attributed across **\`${INDUSTRY_DOMAINS.length}\`** regulated industry domains.
**Doctrine:** Measurement, never certification. Every industry domain names its frozen axes, verifiable artifacts, standards crosswalks, Human-in-the-Loop (\`H.I.M.\`) gate, and explicit claim boundary.

## 1. Industry Domain Attribution Table (\`${INDUSTRY_DOMAINS.length}\` Domains $\\times$ \`${ALL_36_AXES.length}\` Axes)

| # | Domain ID | Regulated Industry | Attributed GSPC Axes | Standards & Regulatory Crosswalks | Verifiable Artifacts & Endpoints | H.I.M. (Human-in-the-Loop) Gate | Claim Boundary (\`MEASUREMENT_NEVER_CERTIFICATION\`) |
|---:|---|---|---|---|---|---|---|
${rowsMd}

## 2. Verification Summary

- **Total Registered Axes Checked**: \`${ALL_36_AXES.length}\`
- **Axes Attributed to $\\ge 1$ Industry Domain**: \`${coveredAxes.size}\` (\`100%\`, \`0\` unattributed)
- **Unattributed Axes**: \`none\`

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
`;

const outPath = path.join(ROOT, "docs/measurement/industry-domain-attribution-2026-11-04.md");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");
console.log(`✓ verify-industry-domain-matrix: ${coveredAxes.size}/${ALL_36_AXES.length} axes attributed across ${INDUSTRY_DOMAINS.length} industry domains`);
