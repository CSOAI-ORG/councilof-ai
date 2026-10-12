/**
 * RAS booking button target, read from /catalog.json (`ras-booking.payment.checkout_url`).
 * A non-empty https checkout_url wins; otherwise a prefilled enquiry email. No price is
 * printed here (the 6 Sep owner ruling keeps prices off /assess); the catalog carries them.
 */
export const RAS_BOOKING_MAILTO =
  "mailto:nicholas@csoai.org" +
  "?subject=" + encodeURIComponent("RAS booking request (ras-booking)") +
  "&body=" + encodeURIComponent(
    "System (what it is and what it does):\n\nScope (which behaviours or axes to measure):\n\nWindow (preferred dates):\n\n" +
    "I understand this is measurement only, not certification.\n",
  );

export type RasBooking = { href: string; live: boolean };

export function rasBookingFromCatalog(catalog: unknown): RasBooking {
  const items: any[] = Array.isArray((catalog as any)?.items) ? (catalog as any).items
    : Array.isArray((catalog as any)?.products) ? (catalog as any).products
    : Array.isArray(catalog) ? (catalog as any[]) : [];
  const ras = items.find((i) => i && i.id === "ras-booking");
  const url = ras?.payment?.checkout_url;
  if (typeof url === "string" && /^https:\/\//.test(url)) return { href: url, live: true };
  return { href: RAS_BOOKING_MAILTO, live: false };
}
