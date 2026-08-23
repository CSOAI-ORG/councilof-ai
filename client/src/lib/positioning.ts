/**
 * Canonical public positioning — governance router + measurement harness.
 * Import here; do not fork taglines across pages.
 */

export const POSITIONING = {
  /** One-line elevator */
  tagline: "Governance router and measurement harness — one monorepo, measurement not certification.",

  /** Hero / H1 support */
  headline: "Route governance instruments. Prove what happened downstream.",

  /** Subhead used on home, footer, OS shell */
  subhead:
    "Eunomia routes 291+ MCP governance instruments. GSPC signs what was measured. We do not compete on LLM toll roads — we prove routing was correct.",

  /** Router layer */
  router: {
    name: "Eunomia Router",
    short: "Governance router",
    blurb:
      "291+ MCP routing rules for frameworks, law, benchmarks, and compute — governance instruments, not model proxies.",
    href: "/instruments",
    cta: "Browse routes",
  },

  /** Harness layer */
  harness: {
    name: "Measurement harness",
    short: "Arena + GSPC",
    blurb:
      "Downstream proof: signed GSPC board, arena traces, RECEIPT-SPEC cards. Empty cells stay empty.",
    href: "/arena-harness",
    cta: "See the harness",
  },

  /** Council OS */
  os: {
    name: "Council OS",
    blurb: "One workspace — routes, board, models, MCP tools, AG-UI chat. Router and harness in one dock.",
    href: "/os",
    cta: "Open Council OS",
  },

  /** Firewall */
  firewall: "We measure and sign. We never operate the fixer.",

  /** What we are not */
  not: "Not an LLM router. Not a certification body. Not a GRC badge shop.",
} as const;

/** Shared primary CTA classes — emerald, accessible contrast */
export const CTA_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export const CTA_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600/40 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors";

export const CTA_GHOST_DARK =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors";
