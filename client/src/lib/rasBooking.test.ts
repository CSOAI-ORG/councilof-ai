import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rasBookingFromCatalog, RAS_BOOKING_MAILTO } from "./rasBooking";

const catalog = JSON.parse(readFileSync(resolve(__dirname, "../../../public/catalog.json"), "utf8"));
const KEY = Object.keys(catalog).find((k) => Array.isArray(catalog[k]) && catalog[k].some((i: any) => i?.id === "ras-booking"))!;

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

  it("a set checkout_url is linked exactly", () => {
    const c = structuredClone(catalog);
    c[KEY].find((i: any) => i.id === "ras-booking").payment.checkout_url = "https://pay.example/checkout/abc";
    expect(rasBookingFromCatalog(c)).toEqual({ href: "https://pay.example/checkout/abc", live: true });
  });

  it("unreadable catalog falls back to the email", () => {
    expect(rasBookingFromCatalog(null).href).toBe(RAS_BOOKING_MAILTO);
  });
});
