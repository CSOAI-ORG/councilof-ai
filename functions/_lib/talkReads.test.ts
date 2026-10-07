import { describe, expect, it, vi } from "vitest";

// The ledger as /api/corrections serves it: newest first. The fixture is ours, not the live file;
// only the order and the fields correctionsSummary reads matter here.
const LEDGER = {
  schema: "csoai.corrections/0.1",
  signature_state: "VALID",
  corrections: [
    { id: "C-2026-0930-12", date: "2026-09-30", status: "FIXED", what_was_wrong: "newest" },
    { id: "C-2026-0930-01", date: "2026-09-30", status: "FIXED", what_was_wrong: "same day, earlier id" },
    { id: "C-2026-0927-05", date: "2026-09-27", status: "FIXED", what_was_wrong: "older" },
    { id: "C-2026-0820-01", date: "2026-08-20", status: "FIXED", what_was_wrong: "much older" },
    { id: "C-2026-0819-11", date: "2026-08-19", status: "FIXED", what_was_wrong: "oldest" },
  ],
};

vi.mock("../mcp/_board", () => ({
  fetchOriginJson: vi.fn(async () => LEDGER),
  unreachablePayload: vi.fn(() => ({ state: "UNREACHABLE" })),
}));

import { correctionsSummary } from "./talkReads";

describe("corrections_summary", () => {
  it("returns the newest corrections as recent, newest first", async () => {
    const out = (await correctionsSummary("https://councilof.ai", { limit: 3 })) as { recent: { id: string }[]; count: number };
    expect(out.count).toBe(5);
    expect(out.recent.map((r) => r.id)).toEqual(["C-2026-0930-12", "C-2026-0930-01", "C-2026-0927-05"]);
  });

  it("is right whichever way the file is ordered", async () => {
    LEDGER.corrections.reverse();
    try {
      const out = (await correctionsSummary("https://councilof.ai", { limit: 2 })) as { recent: { id: string }[] };
      // Same-day entries may come in either order; the two newest days must.
      expect(out.recent.map((r) => r.id).sort()).toEqual(["C-2026-0930-01", "C-2026-0930-12"]);
    } finally {
      LEDGER.corrections.reverse();
    }
  });
});
