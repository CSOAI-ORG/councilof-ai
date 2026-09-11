import { describe, expect, it } from "vitest";
import { publicLeaderCount, publicView } from "./gspc";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";

const AXES = [...AXES_A, ...AXES_B, ...AXES_FIN];

describe("the badge's public_leader_count is derived, not typed", () => {
  it("matches what the board serves today", () => {
    // Live 2026-09-06: /api/gspc totals.public_leader_count = 3, and the badge typed 3.
    // The value was right; nothing computed it.
    expect(publicLeaderCount(AXES)).toBe(3);
  });

  it("counts only model-comparison axes that still carry a leader after both exclusions", () => {
    const view = publicView(AXES);
    const withLeader = view.filter(
      (a) => a.kind === "model-comparison" && a.status === "MEASURED" && typeof a.leader === "string",
    );
    expect(withLeader.length).toBe(publicLeaderCount(AXES));
    // the two exclusions actually removed something — otherwise this test proves nothing
    const excludedOwn = view.filter((a) => (a as { public_leader_state?: string }).public_leader_state === "EXCLUDED_OWN_MODEL");
    const noCard = view.filter((a) => (a as { public_leader_state?: string }).public_leader_state === "NO_SIGNED_CARD");
    expect(excludedOwn.length).toBeGreaterThan(0);
    expect(noCard.length).toBeGreaterThan(0);
  });

  it("a fact axis never counts as a public leader", () => {
    const view = publicView(AXES);
    const facts = view.filter((a) => a.kind === "deterministic-facts");
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.every((a) => typeof a.leader !== "string" || a.kind !== "model-comparison")).toBe(true);
  });
});
