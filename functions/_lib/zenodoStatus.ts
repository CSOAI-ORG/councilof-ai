/**
 * Zenodo availability, 29 Sep 2026.
 *
 * At 15:47Z on 29 Sep 2026 Zenodo blocked the account that held CSOAI's deposits, after a bulk
 * publish, and every record on it began answering HTTP 410 ("User was blocked"). The owner is
 * appealing; the outcome is unknown.
 *
 * The DOIs are kept. They are the permanent names and may resolve again. What is not kept is any
 * link or sentence that presents one as available: surfaces print the identifier, this notice,
 * and the artifact's other live copy where one exists. The dated record, with every DOI, its
 * observed status and each alternative's sha256 check, is /interop/zenodo-status.json.
 *
 * Change ZENODO_ACCOUNT_STATE here (and re-run the probe that writes zenodo-status.json) when the
 * appeal is decided. Never flip it without an anonymous doi.org resolve returning 200.
 */
export const ZENODO_NOTICE = "Zenodo record unavailable since 29 Sep 2026: account blocked by Zenodo; appeal pending.";
export const ZENODO_UNAVAILABLE_SINCE = "2026-09-29T15:47Z";
export const ZENODO_STATUS_URL = "https://councilof.ai/interop/zenodo-status.json";
export const ZENODO_ACCOUNT_STATE: "UNAVAILABLE" | "AVAILABLE" = "UNAVAILABLE";

/** The live alternative for the GSPC methodology record (10.5281/zenodo.21991104). Not the deposit's bytes. */
export const METHODOLOGY_LIVE_URL = "https://councilof.ai/methodology/";

/** The serving-layer status block for a CSOAI Zenodo DOI. */
export function zenodoDoiStatus(alternative: { url: string; relation: string }) {
  return {
    doi_status: ZENODO_ACCOUNT_STATE,
    doi_status_note: ZENODO_NOTICE,
    doi_status_since: ZENODO_UNAVAILABLE_SINCE,
    doi_status_url: ZENODO_STATUS_URL,
    doi_alternative: alternative,
  };
}
