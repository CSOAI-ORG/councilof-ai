import { describe, expect, it } from "vitest";
import board from "../../../public/interop/x402-leaderboard/latest.json";

describe("x402 conformance snapshot truth", () => {
  it("contains only observed rows and derives the summary from them", () => {
    expect("rankings" in board).toBe(false);
    expect(Date.parse(board.observed_at)).toBeLessThanOrEqual(Date.now());
    expect(board.summary.doors_observed).toBe(board.doors.length);

    const conforming = board.doors.filter(
      (door) =>
        door.http_status === 402 &&
        door.accepts_count > 0 &&
        door.network === "eip155:8453" &&
        door.amount_atomic !== null &&
        door.bazaar_extension,
    );
    expect(board.summary.doors_conforming).toBe(conforming.length);
    expect(new Set(board.doors.map((door) => door.url)).size).toBe(board.doors.length);
  });
});
