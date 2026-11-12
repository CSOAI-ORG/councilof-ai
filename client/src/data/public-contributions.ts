/** Public filings are contributions, not evidence of regulator adoption or endorsement. */
export const PUBLIC_CONTRIBUTIONS_REVIEWED = "2026-11-08";

export const PUBLIC_CONTRIBUTIONS = [
  {
    id: "naic-v5-comment",
    category: "Public technical contribution",
    title: "AI evaluation evidence in NAIC's public record",
    event: "Record: AI Risk Evaluation Supplement v5.0 comments, item 33, pages 224–225",
    summary: "NAIC's published comments include Nicholas Templeman's contribution for CSOAI Ltd on reproducible tests, evidence of test failure and transparent correction history.",
    detail: "The drafting suggestions ask for records that let a reviewer re-check a result, identify the tested model version and distinguish an unperformed or withdrawn test from a score.",
    boundary: "Inclusion records a public comment. It does not establish NAIC endorsement, adoption of the suggestions or use of Council software.",
    revision: "AI Risk Evaluation Supplement v5.0 received comments; item 33",
    sources: [
      { label: "NAIC published contribution — pages 224–225", href: "https://content.naic.org/sites/default/files/inline-files/comments-received-combined-10.02.2026-1-2.pdf#page=224" },
      { label: "NAIC working group and current materials", href: "https://content.naic.org/committees/h/big-data-artificial-intelligence-wg" },
    ],
  },
  {
    id: "sec-4-927-comment",
    category: "Public technical contribution",
    title: "Publication evidence in an SEC comment record",
    event: "Submitted: 18 September 2026",
    summary: "The SEC publishes Templeman's CSOAI technical comment on notice history and transaction-publication evidence in File 4-927.",
    detail: "It proposes distinguishable timestamps, stable event references, collection scope, amendment history and separate records for an announced stop and observed cessation. These are design suggestions, not empirical findings about a trading venue.",
    boundary: "Publication records a submitted comment. It does not establish SEC endorsement, adoption, accreditation or a partnership.",
    revision: "SEC File 4-927; comment 4927-3629006",
    sources: [
      { label: "SEC published comment — 18 September 2026", href: "https://www.sec.gov/comments/4-927/4927-3629006.htm" },
    ],
  },
] as const;
