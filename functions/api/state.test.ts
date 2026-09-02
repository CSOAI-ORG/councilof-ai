import { describe, expect, it } from "vitest";

import { onRequestGet } from "./state";

describe("live state convergence", () => {
  it("quotes the same board counts as the living axis authority", async () => {
    const response = await onRequestGet({} as never);
    const payload = await response.json() as any;
    expect(payload.board.axis_slots.value).toBe(22);
    expect(payload.board.measured_axes.value).toBe(22);
    expect(payload.board.unmeasured_axes.value).toBe(0);
    expect(payload.board.signed_snapshot.state).toBe("STALE");
    expect(payload.board.signed_snapshot.agrees_with_authority).toBe(false);
  });
});
