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

import { BUYING_FAQ_ANSWER } from "@/lib/buying";
import { OPERATING_ORGANISATION_SUMMARY, EXTERNAL_USE_SUMMARY } from "@/data/external-use";

/** `id` overrides the positional q<n> anchor where other surfaces link the entry by name. */
export type FaqItem = { q: string; a: string; url?: string; id?: string };

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
    a: `${OPERATING_ORGANISATION_SUMMARY} Each result identifies its method, scope, date and attestation state, including what could not be measured.`,
    url: "/about",
  },
  {
    q: 'What is the GSPC board, and what does its count line ("… axis · … measured") mean?',
    a: "GSPC (Governance · Safety · Provenance · Continuity) is the living board of measurement slots. Its count, read from GET /api/gspc and not typed here, states how many slots carry a measured result. Third-party figures are at /api/reported, corrections at /api/corrections, signing keys at /.well-known/did.json; no account needed.",
    url: "/dashboard/?tab=board",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card records a scoped result with its method, subject, date and evidence references. Published formats differ; use the verification instructions for the specific card. A valid signature detects changes to signed bytes. It does not make the hosting immutable or establish that the underlying claim is true.",
    url: "/gspc-verify",
  },
  {
    q: "Does Council of AI certify, accredit, or issue a conformity mark?",
    a: "No. We do not certify, we do not accredit, and there is no accreditation chain behind us. We are not a notified body under the EU AI Act or anything else. We issue no conformity mark, badge or seal for anyone to put in a footer.",
    url: "/methodology",
  },
  {
    q: "What public evidence shows outside use of Council's work?",
    a: `${EXTERNAL_USE_SUMMARY} The dated sources and their limits are on our operation and external-use page. These examples do not establish institutional adoption or paying customers.`,
    url: "/traction/#external-use",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "MEASURED means a completed run under a published method; read its separate attestation state. UNMEASURED means the cell is honestly empty. REPORTED means a figure from elsewhere, cited and unsigned. A REPORTED number never enters the board.",
    url: "/methodology",
  },
  {
    q: "How do I verify a measurement card without an account?",
    a: "Open /gspc-verify and follow the instructions for the card’s format and published signing key. The result can be VALID, INVALID or UNCHECKABLE; read what was checked and any missing evidence. Verification is free and needs no account. A signature check is separate from reproducing the measurement or confirming the claim.",
    url: "/gspc-verify",
  },
  {
    // Replaced "Where is the live board, and can I fetch it myself?" on 6 Oct 2026 (12-question
    // ceiling); its endpoint list moved into the GSPC answer above. No count is typed: the names
    // are read live from the fleet file at the top of /board.
    q: "Which models does the board compare, and are GPT, Claude or Gemini on it?",
    a: "The board compares only the models named at the top of /board, read live from its fleet file. A model not named there, including hosted API models such as GPT, Claude and Gemini, is UNMEASURED on the board: not scored, not ranked. Other model counts on this site count other things; /board says which is which.",
    url: "/board",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at /corrections/ (the same entries as JSON at /api/corrections). Each entry records what was wrong, how it was caught and what changed, dated. The hardest example — a retracted consensus guarantee (DR-0007) — is on that ledger.",
    url: "/corrections/",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "A company cannot buy its place on the board, its score or its removal. Public reading and verification are free; optional evidence products have their own terms. Funding and in-kind support disclosures are at /independence/, including facts not yet published. The buying answer below explains the available paid routes.",
    url: "/independence/",
  },
  {
    // Replaced "Is verification free, and is a grade ever for sale?" on 6 Oct 2026: this answer
    // keeps both of its facts and adds what a buyer could not find — how to get an invoice.
    q: "How do I buy, and can you invoice an EU company?",
    a: BUYING_FAQ_ANSWER,
    url: "/api/x402",
    id: "buying",
  },
  {
    q: "Is a measurement card legal advice, and what happens when the law changes?",
    a: "A measurement card is not legal advice — it describes behaviour on tests on a stated date. Automated re-measurement and delta-card issuance are not implemented. The regulation feed is at /api/regulation; a new scoped run must be completed and published before a result changes.",
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
    items: [FAQ_ITEMS[0], FAQ_ITEMS[1], FAQ_ITEMS[7], FAQ_ITEMS[2], FAQ_ITEMS[4]],
  },
  {
    id: "what-we-are-not",
    title: "What we are not",
    items: [FAQ_ITEMS[3], FAQ_ITEMS[5]],
  },
  {
    id: "how-to-verify",
    title: "How to verify",
    items: [FAQ_ITEMS[6], FAQ_ITEMS[8]],
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
