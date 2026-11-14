// First-Fine Watch — signed, systematic coverage of the public AI enforcement record.
// R8 canon: regulators + public get signed streams free forever. Data, never a score rank.
export type Fine = { actor: string; jurisdiction: string; regime: string; amount: string; status: string };
export type Deadline = { name: string; date: string; note: string };
// The last verified First-Fine Watch figure and the date it was checked. These are the same rows and
// the same review date GET /api/fines serves (functions/api/fines.ts AS_OF). The page reads that feed
// first (client/src/data/firstFineWatch.ts) and labels any figure older than FRESH_DAYS as not updated
// since its date. A typed "days since" count lived here until 7 Oct 2026 and read 22 for six weeks;
// every count is now derived from these two dates, never typed.
const FFW_AS_OF = "2026-11-07";
const FFW_POWERS_ON = "2026-08-02";
export const FFW = {
  eur: 0,
  asOf: FFW_AS_OF,
  powersOnIso: FFW_POWERS_ON,
  counter: "EU AI Act fines: \u20ac0 (as at 7 Nov 2026)",
  powersOn: "2 Aug 2026",
  // The signed feed (/api/fines) signs with #board-attestation-1. This advertised
  // #estate-chain-1 — a key that IS published in did:web:csoai.org but does not sign
  // this stream, so a verifier following the advertisement fetches the wrong key and
  // fails. Point at the key that actually signs it.
  signer: "did:web:csoai.org#board-attestation-1",
  note: "Systematic signed coverage of the public AI/AI-adjacent enforcement record. Not certification. Not an estimate.",
  // Re-verified against primary regulator sources on 7 Nov 2026. The rows below and the rows
  // GET /api/fines serves are the same rows on the same review date; the review record, with
  // every URL, is published at docs/research/FINES-REFRESH-RESEARCH-2026-11-07.md.
  reviewNote: "Rows re-verified against primary regulator sources on 2026-11-07; corrections are published beside the feed.",
};
export const FINES: Fine[] = [
  { actor: "Clearview AI", jurisdiction: "EU/UK/IT", regime: "GDPR", amount: "\u20ac95.7M + \u00a37.55M", status: "imposed, uncollected; UK under appeal" },
  { actor: "FTC / Helping America Group", jurisdiction: "US", regime: "FTC Act + TSR + FDUTPA", amount: "~$85.66M", status: "judgment, partly suspended" },
  { actor: "FTC / Air AI", jurisdiction: "US", regime: "FTC Act + TSR + BOR", amount: "~$18M", status: "judgment, largely suspended" },
  { actor: "UK ICO", jurisdiction: "UK", regime: "UK GDPR", amount: "\u00a37.55M", status: "under appeal" },
  { actor: "OpenAI", jurisdiction: "IT", regime: "GDPR", amount: "\u20ac15M", status: "annulled (18 Mar 2026)" },
  { actor: "EU AI Act (Art 101 GPAI)", jurisdiction: "EU", regime: "EU AI Act", amount: "\u20ac0", status: "FIRST-FINE WATCH" },
];
export const DEADLINES: Deadline[] = [
  { name: "Illinois AI Video Interview Act (820 ILCS 42) in force", date: "2020-01-01", note: "employment AI notice and consent" },
  { name: "Korea AI Basic Act in force; MSIT grace period on fines begins", date: "2026-01-22", note: "no published end date" },
  { name: "Texas AG AI complaints portal goes live (TRAIGA)", date: "2026-09-01", note: "reporting mechanism, not a registration" },
  { name: "DRCF (UK) AI call for input closes", date: "2026-09-02", note: "consultation response deadline" },
  { name: "EU AI Act Art 50(2) compliance for pre-2 Aug 2026 systems", date: "2026-12-02", note: "Art 111(4), Digital Omnibus" },
];
