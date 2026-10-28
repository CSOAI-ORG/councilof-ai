/**
 * NLM Dataset Catalog crosswalk for contributor "CSOAI Ltd" — a live read on 14 Oct 2026, 04:10 BST
 * (datasetcatalog.nlm.nih.gov search, pages 1–3), with each Zenodo DOI's status from the Zenodo API.
 *
 * Being indexed by NLM does not mean NLM or NIH has validated or vouched for any record. Counts on the
 * page are the lengths of these arrays, never typed. Record-to-ID pairing beyond the named rows is
 * UNVERIFIED (it needs one GET per record) and is shown that way.
 */
export const NLM_CHECKED_ON = "2026-10-14";
export const NLM_SOURCE = "https://datasetcatalog.nlm.nih.gov/searchResults?filters=agent%3ACSOAI%2520Ltd";

export const NLM_IDS: readonly string[] = [
  "0003279330", "0003280042", "0003281936", "0003302827", "0003305759", "0003307340", "0003320769", "0003339261", "0003341576", "0003341581",
  "0003258540", "0003258541", "0003258543", "0003258545", "0003258546", "0003258548", "0003258549", "0003258653", "0003275896", "0003278649",
  "0003253687", "0003258539", "0003258542", "0003258544", "0003258547",
];

export const NLM_NAMED: readonly { title: string; nlmId: string; zenodo: string | null }[] = [
  { title: "H3K cards", nlmId: "0003253687", zenodo: null },
  { title: "Drift Rail", nlmId: "0003258549", zenodo: null },
  { title: "x402 Bazaar", nlmId: "0003278649", zenodo: "22307626" },
  { title: "axis-probe corpus", nlmId: "0003258653", zenodo: "22076930" },
  { title: "State of the Agent Internet", nlmId: "0003341576", zenodo: "23031112" },
];

/** Zenodo records that answered 410 "Record deleted" (tombstone: removed by system, 29 Sep 2026). */
export const ZENODO_TOMBSTONED: readonly string[] = [
  "22013147", "22070693", "22070699", "22070703", "22070706", "22070711", "22070713", "22070715", "22070718", "22070721",
  "22070723", "22070725", "22076930", "22293341", "22307626", "22347020", "22635196", "22646341", "22710072", "22741559",
  "22760259", "22811459", "22987453", "23020634", "23030509", "23031112",
];

/** Answered 302 (likely a newer version or concept record). Where it lands is UNVERIFIED. */
export const ZENODO_REDIRECTED: readonly string[] = ["21991104"];
