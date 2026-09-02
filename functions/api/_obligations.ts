// functions/api/_obligations.ts — the obligation map SKU-2 (evidence bundle) assembles against.
//
// Ported verbatim in spirit from scripts/evidence-pack-generate.mjs (the build-time assembler)
// so the Pages Function and the script cannot drift: same ids, same keyword relevance rule, same
// counsel gate. A card is "relevant-to" an obligation when its subject/surface/tags carry one of
// the obligation's keywords. Relevance is NEVER a determination: the bundle attaches cards as
// OSCAL observations, never as satisfied/not-satisfied findings.

export type Obligation = {
  id: string;
  control_id: string;
  title: string;
  obligation: string;
  regulator: string;
  /** Statutory maximum as a working anchor; counsel_confirmed says whether counsel signed it off. */
  statutory_maximum: string;
  keywords: string[];
  existing_pack: string | null;
  counsel_confirmed: boolean;
  honesty: string | null;
};

export const OBLIGATIONS: Record<string, Obligation> = {
  "article-50": {
    id: "article-50",
    control_id: "EU-AI-ACT-50",
    title: "EU AI Act Article 50 — transparency & marking of AI-generated content",
    obligation: "Article 50 — provider transparency + synthetic-content marking (machine-readable & detectable)",
    regulator: "eu-ai-act",
    statutory_maximum:
      "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art. 99) — confirm exact figure with counsel",
    keywords: ["article 50", "art50", "art 50", "disclosure", "transparency", "provenance", "c2pa", "watermark", "synthetic", "marking", "agent.disclosure"],
    existing_pack: "/packs/eu-article-50",
    counsel_confirmed: true,
    honesty: null,
  },
  "article-53": {
    id: "article-53",
    control_id: "EU-AI-ACT-53",
    title: "EU AI Act Article 53 — GPAI model provider obligations (technical documentation, downstream information, copyright policy, training-content summary)",
    obligation:
      "Article 53(1)(a)–(d) — GPAI provider documentation + downstream-provider information; in force since 2 August 2025 (Art 113)",
    regulator: "eu-ai-act",
    statutory_maximum:
      "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 101 for GPAI providers) — confirm with counsel",
    keywords: ["gpai", "article 53", "art53", "art 53", "system-card", "model card", "model", "provider", "behaviour", "frontier", "training", "copyright"],
    existing_pack: "/gpai-evidence",
    counsel_confirmed: false,
    honesty:
      "Art 53 evidence is independent third-party MEASUREMENT of a public model's behaviour, mapped to the " +
      "documentation duties. It is not the provider's technical documentation and never a conformity mark. " +
      "Obligation text confirmed against Reg (EU) 2024/1689 Art 53; penalty magnitude is counsel-pending.",
  },
  dora: {
    id: "dora",
    control_id: "DORA-28-30",
    title: "DORA Art. 28-30 — ICT third-party risk oversight + Register of Information",
    obligation:
      "DORA Art. 28-30 — ICT third-party oversight of an AI vendor's public model; feeds the financial entity's Register of Information",
    regulator: "eu-dora",
    statutory_maximum: "DORA supervisory / enforcement measures — magnitude to be confirmed with counsel",
    keywords: ["vendor", "system-card", "model", "provider", "behaviour", "dora", "ict", "third-party", "gemini", "claude", "gpt", "frontier", "fedramp"],
    existing_pack: null,
    counsel_confirmed: false,
    honesty:
      "DORA is NOT yet in the axis↔regulator crosswalk. This bundle maps SKU-1 signed measurement " +
      "cards of the PUBLIC model into a Register-of-Information-shaped OSCAL file. The Art.28-30 " +
      "obligation text and any penalty magnitude must be confirmed by regulatory counsel before " +
      "this appears in a customer quote.",
  },
  cra: {
    id: "cra",
    control_id: "CRA-ESSENTIAL",
    title: "Cyber Resilience Act — essential requirements + vulnerability handling for a product's AI digital element",
    obligation:
      "CRA essential requirements + vulnerability/drift evidence for the embedded public model (technical documentation)",
    regulator: "eu-cra",
    statutory_maximum: "CRA administrative fines — magnitude to be confirmed with counsel",
    keywords: ["vendor", "system-card", "model", "vulnerability", "drift", "behaviour", "cra", "digital element", "product", "frontier"],
    existing_pack: "/cra-readiness",
    counsel_confirmed: false,
    honesty:
      "CRA is a PIPELINE product (longer cycle) and is NOT in the crosswalk. This bundle assembles " +
      "behaviour + drift-recompute cards; the essential-requirements text and penalty magnitudes are " +
      "counsel-pending. Do not present as a conformity file.",
  },
};

/** Aliases a buyer might type ("art50", "EU AI Act Art 53", "gpai", "eu-dora"). Canonical id or null. */
export function resolveObligation(raw: string): Obligation | null {
  const k = (raw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!k) return null;
  if (OBLIGATIONS[k]) return OBLIGATIONS[k];
  const art = k.match(/(?:^|-)(?:article|art)-?(50|53)(?:-|$)/);
  if (art) return OBLIGATIONS[`article-${art[1]}`];
  if (/(?:^|-)gpai(?:-|$)/.test(k)) return OBLIGATIONS["article-53"];
  if (/(?:^|-)dora(?:-|$)/.test(k)) return OBLIGATIONS.dora;
  if (/(?:^|-)cra(?:-|$)/.test(k)) return OBLIGATIONS.cra;
  return null;
}

export type CardLite = {
  sha256: string;
  subject: string;
  surface: string;
  tags: string[];
  did: string | null;
  as_of: string | null;
  proof_len: number;
};

/** The relevance rule — identical to selectCards() in scripts/evidence-pack-generate.mjs. */
export function isRelevant(card: CardLite, subject: string, ob: Obligation): boolean {
  const subj = (subject || "").trim().toLowerCase();
  const hay = `${card.subject} ${card.surface} ${card.tags.join(" ")}`.toLowerCase();
  const subjectMatch = subj ? hay.includes(subj) : false;
  const regMatch = ob.keywords.some((k) => hay.includes(k));
  return subjectMatch && regMatch;
}
