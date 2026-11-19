/** Dated examples of external use. These are not an estate-wide adoption census. */
export const EXTERNAL_USE_REVIEWED = "2026-11-16";

export const OPERATING_ORGANISATION_SUMMARY =
  "Council of AI is an operating UK AI measurement and evidence organisation run by CSOAI Ltd. It publishes test instruments, software, datasets, signed records and free verification tools.";

export const EXTERNAL_USE_SUMMARY =
  "Public records document an externally operated rerun of Council code, a contributor's independently implemented proposal, author-reviewed reproduction of SAFE template controls, and research cited in an individual Internet-Draft.";

export const EXTERNAL_USE_EXAMPLES = [
  {
    id: "r7-rerun",
    category: "External execution",
    title: "Council code run by another operator",
    event: "Run: 3 November 2026",
    summary: "Probity's automated workflow reran Council's pinned R7 evidence artifact on Linux x86-64, Linux ARM64 and macOS ARM64.",
    detail: "All three R7 jobs completed successfully. The Linux log reports 18 tests, none skipped, matching artifact digests and the expected fixture outcomes. The recorded outputs were visible to the rerun operator.",
    boundary: "This demonstrates a bounded automated rerun. It does not establish production deployment, customer acceptance or validation of the whole GSPC service.",
    revision: "d0cbe773e8f2fe130feaf4dc0c11c1e4ccb84c15",
    sources: [
      { label: "External workflow run", href: "https://github.com/probityai/agent-evidence-vectors/actions/runs/41583335594" },
      { label: "Linux R7 result log", href: "https://github.com/probityai/agent-evidence-vectors/actions/runs/41583335594/job/125742974646" },
      { label: "Pinned rerun workflow", href: "https://github.com/probityai/agent-evidence-vectors/blob/59a067989d9166f73d8e97e56c4c8cdeca91894d/.github/workflows/w3c-v01-appendix.yml" },
    ],
  },
  {
    id: "evidence-state-implementation",
    category: "Outside implementation",
    title: "A proposal developed into runnable fixtures",
    event: "Merged into the W3C AIKR Community Group repository: 8 November 2026",
    summary: "Kenne Ives' runnable key and evidence-state fixtures, based on Nicholas Templeman's published proposal, were merged as W3C AIKR Community Group repository PR #25.",
    detail: "The merged contribution contains ten synthetic, deterministic cases covering key validity, stale lookups, successor lineage, revocation and unavailable evidence, plus eleven mutation controls. The PR explicitly credits Templeman's October fixture-table proposal.",
    boundary: "A participant's code contribution was merged in a W3C Community Group repository. That does not establish W3C Recommendation status, standards adoption, endorsement or production deployment.",
    revision: "47e389d415a645ebcc8b4abc446f442aae41462c",
    sources: [
      { label: "Implementation and discussion: PR 25", href: "https://github.com/w3c-cg/aikr/pull/25" },
    ],
  },
  {
    id: "safe-template-reproduction",
    category: "Independent reproduction reviewed",
    title: "SAFE template author reviewed Council's checker",
    event: "Author credited CSOAI Ltd in candidate PR #60: 18 October 2026",
    summary: "CSOAI independently reproduced another contributor's SAFE evidence-template example and controls. The template author read the checker, clarified four ambiguous rules and credited CSOAI Ltd in his candidate template.",
    detail: "The original synthetic example's manifest digest and both test-key signatures matched. Five required negative controls and five additional variants reproduced after the author pinned the ambiguous rules. Erik Newton reviewed both checker scripts and incorporated the dated, pinned credit at commit b640a90.",
    boundary: "The checker was authored by CSOAI, independently of the template author, and the author reviewed it. This is not an unrelated third party running Council's product, an approved SAFE specification, certification, endorsement or customer deployment; upstream PR #60 remains open.",
    revision: "b640a9045730a07e72ad5d90a62fde906ca99b80",
    sources: [
      { label: "Author review and credit", href: "https://github.com/OpenSecureAIAlliance/wg-safe/pull/60#issuecomment-6251270225" },
      { label: "Checker reproduction and controls", href: "https://github.com/OpenSecureAIAlliance/wg-safe/pull/60#issuecomment-6038806039" },
      { label: "Candidate evidence template PR", href: "https://github.com/OpenSecureAIAlliance/wg-safe/pull/60" },
    ],
  },
  {
    id: "framing-space-citation",
    category: "Technical citation",
    title: "Research used in another author's analysis",
    event: "Draft version: 26 October 2026",
    summary: "Konrad Gruszka's evaluation-receipt-mappings draft discusses Templeman's framing-space experiment and cites the underlying research.",
    detail: "Section 10 discusses the 64 CBOR encodings and relates the finding to the draft's own encoding restrictions.",
    boundary: "This is an individual Internet-Draft, not an adopted IETF standard or RFC.",
    revision: "draft-gruszka-evaluation-receipt-mappings-04",
    sources: [
      { label: "Dated draft and references", href: "https://datatracker.ietf.org/doc/draft-gruszka-evaluation-receipt-mappings/04/" },
    ],
  },
] as const;
