// Trust wall — the frameworks CSOAI aligns to, the open source it is built on,
// and the verifiable standards it implements. Every entry is TRUE and links to
// an official source. We deliberately do NOT label regulators/governments as
// "partners" or imply endorsement/API partnership we don't have — that would be
// a false-affiliation claim. Relationship labels are accurate:
//   align   — a regulation/framework the OS maps & helps you comply with
//   body    — a standards/oversight body whose guidance we track
//   built   — open-source software the OS is genuinely built on / runs
//   standard— an open protocol/spec we implement
//   maps    — a jurisdiction/alliance whose AI rules we chart (not a partner)
export type TrustKind = "align" | "body" | "built" | "standard" | "maps";

export interface TrustItem {
  label: string;   // short wordmark text
  full: string;    // full name (title/tooltip)
  kind: TrustKind;
  emblem: string;  // emoji/glyph stand-in (shown if no licensed logo / slug fails)
  url: string;     // official source — clicking proves the claim
  icon?: string;   // Simple Icons slug for open-source/tech marks (rights-clean); falls back to emblem on error
}

export const KIND_META: Record<TrustKind, { note: string; tint: string }> = {
  align:    { note: "Regulation we map & help you comply with", tint: "#34d399" },
  body:     { note: "Standards / oversight body we track",        tint: "#60a5fa" },
  built:    { note: "Open source the OS is built on",            tint: "#f59e0b" },
  standard: { note: "Open standard we implement",                 tint: "#c084fc" },
  maps:     { note: "Jurisdiction / alliance we chart (not a partner)", tint: "#94a3b8" },
};

export const TRUST: TrustItem[] = [
  // ── Regulations & frameworks we align to ──
  { label: "EU AI Act", full: "EU Artificial Intelligence Act (Reg. 2024/1689)", kind: "align", emblem: "🇪🇺", url: "https://artificialintelligenceact.eu/" },
  { label: "NIST AI RMF", full: "NIST AI Risk Management Framework 1.0", kind: "align", emblem: "📐", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
  { label: "ISO/IEC 42001", full: "ISO/IEC 42001 — AI Management System", kind: "align", emblem: "🌐", url: "https://www.iso.org/standard/81230.html" },
  { label: "ISO/IEC 27001", full: "ISO/IEC 27001 — Information Security", kind: "align", emblem: "🔒", url: "https://www.iso.org/standard/27001" },
  { label: "SOC 2", full: "AICPA SOC 2 Trust Services Criteria", kind: "align", emblem: "🧾", url: "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2" },
  { label: "GDPR", full: "EU General Data Protection Regulation", kind: "align", emblem: "🛡", url: "https://gdpr.eu/" },
  { label: "NIS2", full: "EU NIS2 Directive (cybersecurity)", kind: "align", emblem: "🕸", url: "https://digital-strategy.ec.europa.eu/en/policies/nis2-directive" },
  { label: "DORA", full: "EU Digital Operational Resilience Act", kind: "align", emblem: "🏦", url: "https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en" },
  { label: "CRA", full: "EU Cyber Resilience Act", kind: "align", emblem: "🔧", url: "https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act" },
  { label: "FedRAMP 20x", full: "US FedRAMP (OSCAL / 20x)", kind: "align", emblem: "🏛", url: "https://www.fedramp.gov/" },
  { label: "OMB M-24-10", full: "US OMB M-24-10 — federal agency AI use", kind: "align", emblem: "🇺🇸", url: "https://www.whitehouse.gov/omb/" },
  { label: "Colorado AI Act", full: "Colorado SB 24-205 (eff. 1 Jan 2027)", kind: "align", emblem: "🏔", url: "https://leg.colorado.gov/bills/sb24-205" },

  // ── Standards / oversight bodies we track ──
  { label: "OECD.AI", full: "OECD.AI Policy Observatory", kind: "body", emblem: "📊", url: "https://oecd.ai/" },
  { label: "NIST", full: "US National Institute of Standards & Technology", kind: "body", emblem: "🔬", url: "https://www.nist.gov/" },
  { label: "ENISA", full: "EU Agency for Cybersecurity", kind: "body", emblem: "⭐", url: "https://www.enisa.europa.eu/" },
  { label: "CISA", full: "US Cybersecurity & Infrastructure Security Agency", kind: "body", emblem: "🛰", url: "https://www.cisa.gov/" },
  { label: "UK AISI", full: "UK AI Safety Institute", kind: "body", emblem: "🇬🇧", url: "https://www.aisi.gov.uk/" },
  { label: "NCSC UK", full: "UK National Cyber Security Centre", kind: "body", emblem: "🔐", url: "https://www.ncsc.gov.uk/" },
  { label: "NATO", full: "NATO — AI strategy & DIANA (jurisdiction we chart)", kind: "maps", emblem: "🧭", url: "https://www.nato.int/cps/en/natohq/official_texts_227237.htm" },
  { label: "UN", full: "UN — Governing AI for Humanity", kind: "maps", emblem: "🕊", url: "https://www.un.org/en/ai-advisory-body" },

  // ── Open source the OS is genuinely built on ──
  { label: "OSCAL", full: "NIST OSCAL — machine-readable controls", kind: "built", emblem: "📄", url: "https://pages.nist.gov/OSCAL/" },
  { label: "OpenSSF", full: "Open Source Security Foundation", kind: "built", emblem: "🧱", url: "https://openssf.org/", icon: "openssf" },
  { label: "Sigstore", full: "Sigstore — signing & transparency", kind: "built", emblem: "✍", url: "https://www.sigstore.dev/", icon: "sigstore" },
  { label: "OPA", full: "Open Policy Agent (Rego)", kind: "built", emblem: "⚖", url: "https://www.openpolicyagent.org/", icon: "openpolicyagent" },
  { label: "Cedar", full: "Cedar policy language", kind: "built", emblem: "🌲", url: "https://www.cedarpolicy.com/" },
  { label: "Nmap", full: "Nmap — network scanner", kind: "built", emblem: "📡", url: "https://nmap.org/" },
  { label: "OpenVAS", full: "OpenVAS / Greenbone vulnerability scanner", kind: "built", emblem: "🔎", url: "https://openvas.org/" },
  { label: "Nuclei", full: "Nuclei — vulnerability templates", kind: "built", emblem: "⚡", url: "https://github.com/projectdiscovery/nuclei" },
  { label: "OWASP ZAP", full: "OWASP Zed Attack Proxy", kind: "built", emblem: "🕷", url: "https://www.zaproxy.org/", icon: "owasp" },
  { label: "Trivy", full: "Trivy — container/IaC scanner", kind: "built", emblem: "🐳", url: "https://trivy.dev/", icon: "trivy" },
  { label: "OSV", full: "OSV — open vulnerability database", kind: "built", emblem: "🗂", url: "https://osv.dev/" },
  { label: "Kubernetes", full: "Kubernetes", kind: "built", emblem: "☸", url: "https://kubernetes.io/", icon: "kubernetes" },
  { label: "Linux", full: "Linux / Linux Foundation", kind: "built", emblem: "🐧", url: "https://www.linuxfoundation.org/", icon: "linux" },
  { label: "Model Context Protocol", full: "Anthropic Model Context Protocol", kind: "built", emblem: "🔌", url: "https://modelcontextprotocol.io/" },

  // ── Open standards we implement ──
  { label: "Ed25519", full: "Ed25519 signatures (RFC 8032)", kind: "standard", emblem: "🔑", url: "https://ed25519.cr.yp.to/" },
  { label: "W3C DID", full: "W3C Decentralized Identifiers", kind: "standard", emblem: "🪪", url: "https://www.w3.org/TR/did-core/" },
  { label: "W3C VC", full: "W3C Verifiable Credentials", kind: "standard", emblem: "📇", url: "https://www.w3.org/TR/vc-data-model/" },
  { label: "x402", full: "x402 — HTTP-native payments", kind: "standard", emblem: "💳", url: "https://www.x402.org/" },
  { label: "OpenTelemetry", full: "OpenTelemetry — observability", kind: "standard", emblem: "📈", url: "https://opentelemetry.io/", icon: "opentelemetry" },
  { label: "OpenAPI", full: "OpenAPI Specification", kind: "standard", emblem: "🧩", url: "https://www.openapis.org/", icon: "openapiinitiative" },
];

export const trustByKind = (k: TrustKind) => TRUST.filter((t) => t.kind === k);
