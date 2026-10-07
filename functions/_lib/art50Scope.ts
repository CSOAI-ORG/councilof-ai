/**
 * What an Article 50 marking-evidence pack can and cannot see — stated in EVERY pack.
 *
 * Owner-approved wording item (growth plan, Gate 0, 7 Oct 2026). Article 50(2) of Regulation (EU)
 * 2024/1689 is technology-neutral: a provider may mark an output with metadata, a watermark, a
 * fingerprint or something else. This pack reads two kinds of metadata only (a C2PA manifest and
 * the IPTC digitalSourceType field), so a NOT_DETECTED line is a statement about those methods on
 * those bytes, never a finding that the output is unmarked. And because the C2PA specification is
 * one of the two methods, the pack discloses that CSOAI is a member of the C2PA.
 *
 * One source: the Function (functions/api/art50/marking-evidence.ts) writes `ART50_SCOPE` into the
 * free preview, the 402 challenge and the delivered pack, and a short form, `ART50_SCOPE_SIGNED`,
 * into the signed leaf (which must stay under 3 KB). The Council OS pane renders the same bytes.
 */
export const ART50_SCOPE = {
  detects:
    "C2PA and IPTC metadata only: a C2PA manifest (its assertion hashes, hard binding and claim signature) and the IPTC digitalSourceType field. No watermark, fingerprint or other kind of mark is read.",
  not_detected:
    "NOT_DETECTED means these methods found no C2PA or IPTC metadata in these bytes. It does not mean the output is unmarked: Article 50(2) is technology-neutral, so a watermark or another mark this pack cannot read may be present, and metadata is often stripped when a file is re-saved or uploaded.",
  disclosure:
    "CSOAI is a member of the C2PA (Coalition for Content Provenance and Authenticity), whose specification is one of the two methods this pack reads.",
} as const;

/** The same three statements, short enough for the signed leaf's 3 KB budget. */
export const ART50_SCOPE_SIGNED = {
  detects: "C2PA and IPTC metadata only; no watermark is read",
  not_detected: "NOT_DETECTED does not mean unmarked: Art 50(2) is technology-neutral",
  disclosure: "CSOAI is a C2PA member",
} as const;
