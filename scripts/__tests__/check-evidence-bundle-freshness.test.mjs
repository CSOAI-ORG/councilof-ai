import { describe, it, expect } from "vitest";
import { checkBundleFreshness } from "../check-evidence-bundle-freshness.mjs";

describe("check-evidence-bundle-freshness (E3)", () => {
  const sampleBundle = {
    cards: {
      c1: {
        card: {
          sha256: "1".repeat(64),
          sig_ed25519: "a".repeat(128),
          subject: "art50 synthetic marking probe",
          surface: "art50",
          tags: ["c2pa", "watermark"],
          as_of: "2026-10-28T12:00:00Z",
        },
      },
      c2: {
        card: {
          sha256: "2".repeat(64),
          sig_ed25519: "b".repeat(128),
          subject: "frontier model provider behaviour",
          surface: "system-card",
          tags: ["gpai", "dora", "cra", "vulnerability"],
          as_of: "2026-10-30T12:00:00Z",
        },
      },
    },
  };

  it("reports FRESH when all four obligations have cards within 14 days", () => {
    const res = checkBundleFreshness(sampleBundle, {
      nowIso: "2026-11-03T03:50:00Z",
      maxAgeDays: 14,
    });
    expect(res.ok).toBe(true);
    expect(res.obligations.every((o) => o.status === "FRESH")).toBe(true);
  });

  it("reports STALE when newest card exceeds maxAgeDays", () => {
    const res = checkBundleFreshness(sampleBundle, {
      nowIso: "2026-12-01T00:00:00Z",
      maxAgeDays: 14,
    });
    expect(res.ok).toBe(false);
    expect(res.obligations.some((o) => o.status === "STALE")).toBe(true);
  });
});
