/**
 * RAS booking button target, read from /catalog.json (`ras-booking`).
 *
 * The checkout link goes live only when ALL of these hold (Measure, 12 Oct):
 *   - payment.checkout_url is an https URL,
 *   - payment.rail === "paddle",
 *   - payment.status !== "paddle_pending" (KYC passed),
 *   - the product status is not "draft",
 *   - and, when payment.stripe === "never", the URL host does not contain "stripe".
 * Otherwise the button is a prefilled enquiry email.
 *
 * No price is printed (the 6 Sep owner ruling keeps prices off /assess). If a price is
 * ever shown, it must come from catalog fields via rasPriceFromCatalog, never a literal.
 */
export const RAS_BOOKING_MAILTO =
  "mailto:nicholas@csoai.org" +
  "?subject=" + encodeURIComponent("RAS booking request (ras-booking)") +
  "&body=" + encodeURIComponent(
    "System (what it is and what it does):\n\nScope (which behaviours or axes to measure):\n\nWindow (preferred dates):\n\n" +
    "I understand this is measurement only, not certification.\n",
  );

export type RasBooking = { href: string; live: boolean };

function rasItem(catalog: unknown): any {
  const items: any[] = Array.isArray((catalog as any)?.items) ? (catalog as any).items
    : Array.isArray((catalog as any)?.products) ? (catalog as any).products
    : Array.isArray(catalog) ? (catalog as any[]) : [];
  return items.find((i) => i && i.id === "ras-booking");
}

export function checkoutAllowed(ras: any): boolean {
  const p = ras?.payment;
  const url = p?.checkout_url;
  if (typeof url !== "string" || !/^https:\/\//.test(url)) return false;
  if (p.rail !== "paddle") return false;
  if (p.status === "paddle_pending") return false;
  if (ras.status === "draft") return false;
  let host: string;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  if (p.stripe === "never" && host.includes("stripe")) return false;
  return true;
}

export function rasBookingFromCatalog(catalog: unknown): RasBooking {
  const ras = rasItem(catalog);
  if (checkoutAllowed(ras)) return { href: ras.payment.checkout_url, live: true };
  return { href: RAS_BOOKING_MAILTO, live: false };
}

/** Catalog-only price fields (not rendered on /assess today). Null when absent. */
export function rasPriceFromCatalog(catalog: unknown): { intro: string; intro_period: string | null; ongoing: string | null } | null {
  const p = rasItem(catalog)?.payment;
  if (!p || typeof p.price_intro !== "string") return null;
  return {
    intro: p.price_intro,
    intro_period: typeof p.price_intro_period === "string" ? p.price_intro_period : null,
    ongoing: typeof p.price_ongoing === "string" ? p.price_ongoing : null,
  };
}
