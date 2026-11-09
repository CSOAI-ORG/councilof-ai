/** Dated examples of external use. These are not an estate-wide adoption census. */
export const EXTERNAL_USE_REVIEWED = "2026-11-04";

export const OPERATING_ORGANISATION_SUMMARY =
  "Council of AI is an operating UK AI measurement and evidence organisation run by CSOAI Ltd. It publishes test instruments, software, datasets, signed records and free verification tools.";

export const EXTERNAL_USE_SUMMARY =
  "Public records document an externally operated rerun of Council code, another developer's implementation of its evidence-state proposal, and use of its research in a technical draft.";

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
    event: "Status: open and unmerged on 4 November 2026",
    summary: "Kenne Ives' key and evidence-state fixtures explicitly build on Nicholas Templeman's published proposal.",
    detail: "The contribution includes executable synthetic cases and mutation controls for key validity, unavailable evidence and related verification states.",
    boundary: "This is a participant's contribution to a W3C Community Group repository. It does not establish W3C adoption or endorsement.",
    revision: "47e389d415a645ebcc8b4abc446f442aae41462c",
    sources: [
      { label: "Implementation and discussion: PR 25", href: "https://github.com/w3c-cg/aikr/pull/25" },
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
