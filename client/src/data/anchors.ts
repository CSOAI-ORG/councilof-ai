/**
 * anchors — the single source of truth for the GSPC anchor estate.
 *
 * Read by the jurisdiction globe (components/gspc/Globe.tsx) and the
 * /gspc-anchors page, so the two surfaces can never disagree. Statuses and
 * last-passed timestamps are the watcher's recorded verdicts; staleness math
 * (hours since last pass) is always computed against the live clock — never
 * against a hardcoded "demo" date. A stale anchor is never silently
 * re-stamped.
 */

export type AnchorStatus = "live" | "degraded" | "unreachable";
export type Jurisdiction = "EU" | "UK" | "US";

export interface Anchor {
  id: string;
  name: string;
  /** ISO timestamp of the last successful fetch, as recorded by the watcher. */
  last_passed: string;
  status: AnchorStatus;
  source_uri: string;
  licence: string;
  description: string;
  jurisdiction: Jurisdiction;
  kind: "statute" | "standard" | "registry" | "operator";
}

export const ANCHORS: Anchor[] = [
  {
    id: "UK-legislation",
    name: "UK legislation.gov.uk",
    last_passed: "2026-09-03T02:45:00Z",
    status: "live",
    source_uri: "https://www.legislation.gov.uk/new/data.feed",
    licence: "OGL v3.0",
    description:
      "UK primary and secondary legislation. Atom data feed of new items, for automated ingestion.",
    jurisdiction: "UK",
    kind: "statute",
  },
  {
    id: "EU-CELLAR",
    name: "EUR-Lex CELLAR (AI Act)",
    last_passed: "2026-07-29T17:06:00Z",
    status: "degraded",
    source_uri: "https://eur-lex.europa.eu/",
    licence: "EU reuse notice",
    description:
      "EU legal corpus including the AI Act. CELLAR endpoint throttled in last sweep.",
    jurisdiction: "EU",
    kind: "statute",
  },
  {
    id: "C2PA-spec",
    name: "C2PA 2.4 specification",
    last_passed: "2026-07-30T03:00:00Z",
    status: "live",
    source_uri: "https://github.com/c2pa-org/specifications",
    licence: "CC BY 4.0",
    description:
      "Content Credentials specification for provenance and authenticity.",
    jurisdiction: "US",
    kind: "standard",
  },
  {
    id: "RFC-9964",
    name: "RFC 9964 (PQC for IETF)",
    last_passed: "2026-07-30T03:00:00Z",
    status: "live",
    source_uri: "https://www.rfc-editor.org/rfc/rfc9964",
    licence: "IETF Trust Licence",
    description:
      "Post-quantum cryptography for IETF protocols. ML-DSA-65 signature scheme.",
    jurisdiction: "US",
    kind: "standard",
  },
  {
    id: "NIST-IR8547",
    name: "NIST IR 8547 (PQC transition)",
    last_passed: "2026-09-03T02:45:00Z",
    status: "live",
    source_uri: "https://csrc.nist.gov/pubs/ir/8547/ipd",
    licence: "NIST publication",
    description:
      "NIST IR 8547, INITIAL PUBLIC DRAFT — transition to post-quantum cryptography standards. " +
      "A draft, not final guidance; cited as a draft and never as a settled requirement.",
    jurisdiction: "US",
    kind: "standard",
  },
  {
    id: "Crosswalk-registry",
    name: "Crosswalk registry",
    last_passed: "2026-07-30T06:00:00Z",
    status: "live",
    source_uri: "local",
    licence: "self-hosted",
    description:
      "Local meta-watcher for cross-referencing provisions across jurisdictions.",
    jurisdiction: "UK",
    kind: "operator",
  },
];

/**
 * Hours since an anchor last passed, computed against the real clock.
 * This replaces the donor's hardcoded `new Date("2026-07-30T11:00:00Z")`
 * "fixed for demo" timestamp — staleness must always be live.
 */
export function hoursSinceLastPass(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate);
  return Math.round(((now.getTime() - then.getTime()) / (1000 * 60 * 60)) * 10) / 10;
}
