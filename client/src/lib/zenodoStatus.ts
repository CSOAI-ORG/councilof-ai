/**
 * Zenodo availability, 29 Sep 2026. Zenodo blocked the account that held CSOAI's deposits and
 * every record on it answers HTTP 410. The DOIs are kept as identifiers (they may resolve again);
 * nothing on the site links one as if it were available. Dated record with every DOI and each
 * alternative's check: /interop/zenodo-status.json. Mirror of functions/_lib/zenodoStatus.ts.
 */
export const ZENODO_NOTICE = "Zenodo record unavailable since 29 Sep 2026: account blocked by Zenodo; appeal pending.";
export const ZENODO_STATUS_PATH = "/interop/zenodo-status.json";
/** The GSPC methodology record's DOI: an identifier, not currently a working link. */
export const METHODOLOGY_DOI = "10.5281/zenodo.21991104";
/** The live methodology page. Not the deposit's bytes. */
export const METHODOLOGY_LIVE_PATH = "/methodology/";
