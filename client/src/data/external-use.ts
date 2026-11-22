import reviewed from "./external-use-reviewed.json";

/** Dated examples of external use. These are not an estate-wide adoption census. */
export const OPERATING_ORGANISATION_SUMMARY =
  "Council of AI is an operating UK AI measurement and evidence organisation run by CSOAI Ltd. It publishes test instruments, software, datasets, signed records and free verification tools.";

export const EXTERNAL_USE_SUMMARY =
  "Public records document an externally operated rerun of Council code, a contributor's independently implemented proposal, author-reviewed reproduction of SAFE template controls, and research cited in an individual Internet-Draft.";

export const EXTERNAL_USE_REVIEWED = reviewed.reviewed_at;

export const EXTERNAL_USE_EXAMPLES = reviewed.records;
