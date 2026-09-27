/** Brand identity is presentation metadata, never a verification or membership claim. */
export const COUNCIL_BRAND = {
  name: "Council of AI",
  fullName: "Council for the Safety of Artificial Intelligence",
  origin: "https://councilof.ai",
  legacyDomain: "csoai.org",
  legacyName: "CSOAI",
  assets: { full: "/brand/council-of-ai-full.svg", compact: "/brand/council-of-ai-compact.svg", mark: "/brand/council-of-ai-mark.svg" },
  legacyExplanation: "Council of AI is our public brand. CSOAI is the former public acronym; csoai.org remains a legacy domain and appears in some existing email addresses and technical identifiers.",
} as const;
