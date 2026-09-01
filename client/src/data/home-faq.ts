/**
 * FAQ data — 12 questions, ceiling 12.
 *
 * 2026 pattern: Google killed FAQ rich results (7 May 2026), so we do not
 * chase SERP stars. FAQPage + BreadcrumbList still valid Schema.org — ship
 * on /faq only. Schema text MUST match visible HTML exactly.
 *
 * Each answer: 40–60 words, one living URL, no second question inside.
 * If a count is mentioned, the API wins: GET https://councilof.ai/api/gspc.
 */

export type FaqItem = { q: string; a: string; url?: string };

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

/**
 * The 12 FAQ questions. A 13th replaces one; it does not append.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is Council of AI?",
    a: "Council of AI is an independent measurement body for AI behaviour. We run AI systems against frozen, published tests drawn from real statute, grade the answers with deterministic code, sign the result with an Ed25519 key, and publish it — including the parts we could not measure.",
    url: "/about",
  },
  {
    q: 'What is the GSPC board, and what does the live count mean?',
    a: "GSPC (Governance · Safety · Provenance · Continuity) is the living board of measurement slots. The count — read from GET /api/gspc, not typed here — states how many slots carry a measured result versus how many are honestly empty or described.",
    url: "/gspc-scoreboard",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card is a signed record under a kilobyte: axis, model, accuracy, issuer, timestamp and the hash of the previous card. It is small enough to email or attach to a filing; it does not live on our server for us to quietly amend later.",
    url: "/gspc-verify",
  },
  {
    q: "Does Council of AI certify, accredit, or issue a conformity mark?",
    a: "No. We do not certify, we do not accredit, and there is no accreditation chain behind us. We are not a notified body under the EU AI Act or anything else. We issue no conformity mark, badge or seal for anyone to put in a footer.",
    url: "/methodology",
  },
  {
    q: "Are you a credit-rating agency, a notified body, or a SaaS vendor?",
    a: "None of those. We are a measurement body: we measure, sign and preserve evidence. We are not regulated as a credit-rating agency, we hold no notified-body designation, and we do not sell software subscriptions. Verify is free forever.",
    url: "/about",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "MEASURED means we ran it on frozen instruments and signed it — the only state on the board. UNMEASURED means the cell is honestly empty. REPORTED means a figure from elsewhere, cited and unsigned. A REPORTED number never enters the board.",
    url: "/methodology",
  },
  {
    q: "How do I verify a measurement card without an account?",
    a: "Fetch our public key from /.well-known/did.json, canonicalise the card body, take the SHA-256, then verify the Ed25519 signature. A zero-dependency JavaScript verifier ships at /signed/verify-card.mjs. No login, no fee, no contact with us.",
    url: "/gspc-verify",
  },
  {
    q: "Where is the live board, and can I fetch it myself?",
    a: "The board is machine-readable at GET councilof.ai/api/gspc. Third-party figures at /api/reported, corrections at /api/corrections, signing keys at /.well-known/did.json, regulation feed at /api/regulation. Everything is served without an account.",
    url: "/api/gspc",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at /api/corrections, appended and never deleted. Each entry records what was wrong, how it was caught and what changed. The hardest example — a retracted consensus guarantee (DR-0007) — is on that ledger.",
    url: "/refutation-ledger",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "No company we measure pays for its place on the board, its score, or its removal. Members of the public never pay. We fund ourselves by selling signed evidence artefacts, published whether the result flatters the buyer or not.",
    url: "/about",
  },
  {
    q: "Is verification free, and is a grade ever for sale?",
    a: "Verification is free forever and needs no account. A grade is never sold. There are no public prices on this site — enterprise starts at the lobby door. Payment processing is coming via Paddle, not yet live.",
    url: "/enterprise",
  },
  {
    q: "Is a measurement card legal advice, and what happens when the law changes?",
    a: "A measurement card is not legal advice — it describes behaviour on tests on a stated date. When a provision changes we re-measure and issue a delta card; the old card stands. The regulation feed is at /api/regulation.",
    url: "/regulation-tracker",
  },
];

/**
 * The 12 questions grouped into 5 sections for the /faq page.
 */
export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "what-we-are",
    title: "What we are",
    items: [FAQ_ITEMS[0], FAQ_ITEMS[1], FAQ_ITEMS[2]],
  },
  {
    id: "what-we-are-not",
    title: "What we are not",
    items: [FAQ_ITEMS[3], FAQ_ITEMS[4], FAQ_ITEMS[5]],
  },
  {
    id: "how-to-verify",
    title: "How to verify",
    items: [FAQ_ITEMS[6], FAQ_ITEMS[7], FAQ_ITEMS[8]],
  },
  {
    id: "money",
    title: "Money",
    items: [FAQ_ITEMS[9], FAQ_ITEMS[10]],
  },
  {
    id: "legal",
    title: "Legal",
    items: [FAQ_ITEMS[11]],
  },
];
