import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rasBookingFromCatalog, rasPriceFromCatalog, RAS_BOOKING_MAILTO } from "./rasBooking";

const catalog = JSON.parse(readFileSync(resolve(__dirname, "../../../public/catalog.json"), "utf8"));
const KEY = Object.keys(catalog).find((k) => Array.isArray(catalog[k]) && catalog[k].some((i: any) => i?.id === "ras-booking"))!;
const src = readFileSync(resolve(__dirname, "./rasBooking.ts"), "utf8");

/** Clone the shipped catalog and patch the ras-booking entry. */
function withRas(patch: (ras: any) => void) {
  const c = structuredClone(catalog);
  patch(c[KEY].find((i: any) => i.id === "ras-booking"));
  return c;
}
const LIVE = (url: string) => withRas((r) => {
  r.status = "live";
  r.payment.rail = "paddle";
  r.payment.status = "live";
  r.payment.checkout_url = url;
});

describe("RAS booking button on /assess", () => {
  it("null checkout_url (the shipped catalog today) gives the prefilled enquiry email", () => {
    const b = rasBookingFromCatalog(catalog);
    expect(b.live).toBe(false);
    expect(b.href).toBe(RAS_BOOKING_MAILTO);
    const u = new URL(b.href);
    expect(u.pathname).toBe("nicholas@csoai.org");
    expect(u.searchParams.get("subject")).toBe("RAS booking request (ras-booking)");
    const body = u.searchParams.get("body")!;
    for (const w of ["System", "Scope", "Window", "measurement only, not certification"]) expect(body).toContain(w);
    expect(body).not.toMatch(/\$\d|\/mo\b|per month/i);
  });

  it("https checkout_url + paddle rail + not pending + not draft is linked exactly", () => {
    expect(rasBookingFromCatalog(LIVE("https://pay.example/checkout/abc"))).toEqual({ href: "https://pay.example/checkout/abc", live: true });
  });

  it("checkout_url set while payment.status is still paddle_pending gives the email", () => {
    const c = withRas((r) => { r.status = "live"; r.payment.status = "paddle_pending"; r.payment.checkout_url = "https://pay.example/checkout/abc"; });
    expect(rasBookingFromCatalog(c)).toEqual({ href: RAS_BOOKING_MAILTO, live: false });
  });

  it("checkout_url set on the shipped draft entry gives the email", () => {
    const c = withRas((r) => { r.payment.checkout_url = "https://pay.example/checkout/abc"; });
    expect(rasBookingFromCatalog(c).live).toBe(false);
    const d = withRas((r) => { r.status = "draft"; r.payment.status = "live"; r.payment.checkout_url = "https://pay.example/checkout/abc"; });
    expect(rasBookingFromCatalog(d).live).toBe(false);
  });

  it("non-paddle rail or non-https URL gives the email", () => {
    const c = LIVE("https://pay.example/checkout/abc");
    c[KEY].find((i: any) => i.id === "ras-booking").payment.rail = "other";
    expect(rasBookingFromCatalog(c).live).toBe(false);
    expect(rasBookingFromCatalog(LIVE("http://pay.example/checkout/abc")).live).toBe(false);
  });

  it("a stripe host is refused when payment.stripe is 'never'", () => {
    for (const u of ["https://checkout.stripe.com/c/pay/x", "https://buy.stripe.com/abc", "https://pay.STRIPE.example/x"]) {
      const c = LIVE(u);
      expect(c[KEY].find((i: any) => i.id === "ras-booking").payment.stripe).toBe("never");
      expect(rasBookingFromCatalog(c)).toEqual({ href: RAS_BOOKING_MAILTO, live: false });
    }
  });

  it("unreadable catalog falls back to the email", () => {
    expect(rasBookingFromCatalog(null).href).toBe(RAS_BOOKING_MAILTO);
  });

  it("price comes only from catalog fields; the helper hardcodes none", () => {
    const p = catalog[KEY].find((i: any) => i.id === "ras-booking").payment;
    expect(rasPriceFromCatalog(catalog)).toEqual({ intro: p.price_intro, intro_period: p.price_intro_period, ongoing: p.price_ongoing });
    expect(rasPriceFromCatalog(withRas((r) => { delete r.payment.price_intro; }))).toBeNull();
    expect(src).not.toMatch(/[$£€]\s?\d/);
  });
});
