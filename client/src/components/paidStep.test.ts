import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PAID_STEP_COMMISSION,
  PAID_STEP_FEED,
  PAID_STEP_HREF,
  PAID_STEP_LINE,
} from "./paidStep";

const here = dirname(fileURLToPath(import.meta.url));

describe("paid-step pointer (shipped Footer + catalog doors)", () => {
  it("names the live catalog and the $0.02 feed door, never a price", () => {
    expect(PAID_STEP_HREF).toBe("/api/x402");
    expect(PAID_STEP_FEED).toBe("/api/eunomia-data?feed=1");
    expect(PAID_STEP_COMMISSION).toBe("/api/request-attestation");
    expect(PAID_STEP_LINE.toLowerCase()).toMatch(/verification is free/);
    expect(PAID_STEP_LINE).toMatch(/commission_card/);
    expect(PAID_STEP_LINE).not.toMatch(/\$/);
  });

  it("Footer.tsx renders the shipped line and links the catalog", () => {
    const src = readFileSync(join(here, "Footer.tsx"), "utf8");
    expect(src).toMatch(/from ['\"]\.\/paidStep['\"]/);
    expect(src).toMatch(/PAID_STEP_LINE/);
    expect(src).toMatch(/PAID_STEP_HREF/);
    expect(src).toMatch(/data-paid-step/);
  });
});
