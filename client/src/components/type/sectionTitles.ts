/**
 * Homepage section titles with a rotating, emerald-highlighted keyword.
 *
 * Each section speaks to every audience in turn — enterprise, regulator,
 * insurer, developer, citizen — which both widens comprehension and multiplies
 * the keyword surface answer engines can match. Every variant is rendered in the
 * DOM (see RotatingHighlight), so the keywords are readable without JS.
 *
 * Rule: the rotating words must all be TRUE of the section. This is a
 * comprehension device, never a keyword-stuffing device — a word that misleads
 * about what the section does is an overclaim like any other.
 */
export type RotatingTitle = { before?: string; words: string[]; after?: string };

export const SECTION_TITLES: Record<string, RotatingTitle> = {
  problem: {
    before: "A PDF cannot prove your AI to",
    words: ["a regulator", "an insurer", "procurement", "your board", "a customer"],
    after: "— it cannot be recomputed.",
  },
  card: {
    before: "One signed card",
    words: ["anyone can verify", "no login can gate", "no vendor can edit", "outlives us"],
    after: "",
  },
  board: {
    before: "The open board",
    words: ["regulators read", "insurers price on", "engineers debug with", "citizens can check"],
    after: "— live, and recomputable.",
  },
  arena: {
    before: "Model versus model —",
    words: ["graded by fixed rules", "never by another model", "ties stay ties", "every round signable"],
    after: "",
  },
  humanBaseline: {
    before: "Measured against",
    words: ["a published human baseline", "other models", "the law it must meet"],
    after: "— not against a vibe.",
  },
  independence: {
    before: "Nobody we measure pays us —",
    words: ["not vendors", "not labs", "not sponsors"],
    after: "and verification is free forever.",
  },
  boundary: {
    before: "We measure. We do not",
    words: ["certify", "accredit", "enforce", "endorse"],
    after: "— the boundary is the point.",
  },
  living: {
    before: "When the law moves we re-measure for",
    words: ["the EU AI Act", "UK regulators", "US state law", "your auditor"],
    after: "— the old card stays.",
  },
  corrections: {
    before: "We publish our own",
    words: ["errors", "retractions", "unmeasured gaps"],
    after: "— including the claim we withdrew.",
  },
};
