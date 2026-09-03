// The arena pages send strangers to the frozen item bank for that axis.
// The bank repo is NOT named after the axis — csoai/gspc-agi is the SAFETY
// bank, gspc-asi is CONTINUITY, and so on. Linking to the axis name instead
// (csoai/safety) produces a 401 for every visitor, because no such public
// dataset exists. That shipped live on all five pages.
//
// The authority for this mapping is `dataset_url` on GET /api/gspc. This test
// pins it offline so a regression is caught without a network call.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// axis page -> frozen bank repo (from totals.dataset_url, live board 2026-09-03)
const BANK = {
  safety: "gspc-agi",
  provenance: "gspc-prv",
  continuity: "gspc-asi",
  conformance: "gspc-mcp",
  openness: "gspc-oss",
};

describe("arena pages link to the real frozen bank", () => {
  for (const [axis, bank] of Object.entries(BANK)) {
    it(`${axis}.html points at csoai/${bank}, not csoai/${axis}`, () => {
      const html = readFileSync(join(HERE, `${axis}.html`), "utf8");
      const links = [...html.matchAll(/huggingface\.co\/datasets\/csoai\/([a-z0-9-]+)/g)].map(
        (m) => m[1],
      );
      expect(links.length).toBeGreaterThan(0);
      // the bank must be linked
      expect(links).toContain(bank);
      // and the bare axis name must never be linked — it is not a public repo
      expect(links).not.toContain(axis);
    });
  }
});
