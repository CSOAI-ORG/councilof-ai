// First-Fine Watch — signed, systematic coverage of the public AI enforcement record.
// R8 canon: regulators + public get signed streams free forever. Data, never a score rank.
export type Fine = { actor: string; jurisdiction: string; regime: string; amount: string; status: string };
export type Deadline = { name: string; date: string; note: string };
// The last verified First-Fine Watch figure and the date it was checked. These are the same rows and
// the same review date GET /api/fines serves (functions/api/fines.ts AS_OF). The page reads that feed
// first (client/src/data/firstFineWatch.ts) and labels any figure older than FRESH_DAYS as not updated
// since its date. A typed "days since" count lived here until 7 Oct 2026 and read 22 for six weeks;
// every count is now derived from these two dates, never typed.
const FFW_AS_OF = "2026-08-24";
const FFW_POWERS_ON = "2026-08-02";
export const FFW = {
  eur: 0,
  asOf: FFW_AS_OF,
  powersOnIso: FFW_POWERS_ON,
  counter: "EU AI Act fines: \u20ac0 (as at 24 Aug 2026)",
  powersOn: "2 Aug 2026",
  // The signed feed (/api/fines) signs with #board-attestation-1. This advertised
  // #estate-chain-1 — a key that IS published in did:web:csoai.org but does not sign
  // this stream, so a verifier following the advertisement fetches the wrong key and
  // fails. Point at the key that actually signs it.
  signer: "did:web:csoai.org#board-attestation-1",
  note: "Systematic signed coverage of the public AI/AI-adjacent enforcement record. Not certification. Not an estimate.",
};
export const FINES: Fine[] = [
  { actor: "Clearview AI", jurisdiction: "EU/UK/IT", regime: "GDPR", amount: ">\u20ac100M", status: "cumulative (multi-MSA)" },
  { actor: "FTC (US)", jurisdiction: "US", regime: "FTC Act / ECOA", amount: "~$85M", status: "order (partly suspended)" },
  { actor: "UK ICO", jurisdiction: "UK", regime: "UK GDPR", amount: "~\u00a317M", status: "AI-adjacent" },
  { actor: "OpenAI", jurisdiction: "IT", regime: "GDPR", amount: "\u20ac15M", status: "annulled (Mar 2025)" },
  { actor: "EU AI Act (Art 101 GPAI)", jurisdiction: "EU", regime: "EU AI Act", amount: "\u20ac0", status: "FIRST-FINE WATCH" },
];
export const DEADLINES: Deadline[] = [
  { name: "Texas AI systems registration portal", date: "2026-09-01", note: "state AI disclosure" },
  { name: "DRCF (UK) AI disclosure", date: "2026-09-02", note: "Digital Regulation Cooperation Forum" },
  { name: "EU AI Act Art 50(2) transparency grace ends", date: "2026-12-02", note: "GPAI transparency" },
  { name: "Korea AI Act grace period ends", date: "2027-01-22", note: "Korea AI Basic Act" },
  { name: "Illinois AI audits (265 ILCS)", date: "2028-01-01", note: "state AI audit" },
];
