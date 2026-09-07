/**
 * The one paid-step pointer every free surface must end on.
 *
 * Amounts live only inside a 402 `accepts[]` — this module names the doors, never a price.
 * Board / verify / catalog / trust import PAID_STEP_LINE so a footer cannot drift from the catalog.
 */
export const PAID_STEP_HREF = "/api/x402";
export const PAID_STEP_FEED = "/api/eunomia-data?feed=1";
export const PAID_STEP_COMMISSION = "/api/request-attestation";
export const PAID_STEP_LINE =
  "Verification is free. Paid step: the x402 catalog — commission_card / art50 / rwa / evidence-bundle / the signed feed door.";
