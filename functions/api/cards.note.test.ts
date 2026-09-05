// The card count in this endpoint's own note must be derived, never typed.
//
// The note shipped "This index carries 313 cards; 150 of those verify against
// did:web:csoai.org#card-attestation-1". Both halves were wrong on 2026-09-05:
//
//   - the live /signed/card_index.json carries 335, not 313 — a typed number
//     that stopped tracking the file it describes;
//   - board_living.json records 150/150 — every card of the 150-card subset that
//     was checked verified. "150 of those [313]" restates it as a ratio over the
//     whole index, which asserts that 163 cards did NOT verify. Nothing measured
//     that. Unchecked is not failed, and this error ran against us.
//
// OUTSTANDING-MOVES-2026-08-31 already ruled "do not clamp 150/313" for exactly
// this reason. The ruling held everywhere except inside the payload itself.

import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./cards";

const card = (i: number) => ({
  card: `c${i}`,
  card_url: `/signed/cards/c${i}.json`,
  axis: "governance",
  signed: true,
  ts: `2026-09-0${(i % 9) + 1}`,
});

const installFetch = (n: number) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/signed/board_living.json"))
        return Response.json({ signed: true, signer: "x", verification_state: "UNVERIFIABLE" });
      if (url.endsWith("/signed/card_index.json"))
        return Response.json({ cards: Array.from({ length: n }, (_, i) => card(i)) });
      if (url.endsWith("/api/gspc"))
        return Response.json({ totals: { axes: 22, measured_axes: 22, unmeasured_axes: 0 } });
      return Response.json({});
    }),
  );
};

const note = async () => {
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/cards"),
  } as Parameters<typeof onRequestGet>[0]);
  return ((await res.json()) as { note: string }).note;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/api/cards note", () => {
  it("states the index size it actually read, not a number typed into the source", async () => {
    installFetch(335);
    const n = await note();

    expect(n).toContain("335");
    expect(n).not.toContain("313");
  });

  it("tracks the index when it changes, because the number is derived", async () => {
    installFetch(412);
    const n = await note();

    expect(n).toContain("412");
    expect(n).not.toContain("335");
  });

  // The 150 is a subset that was checked and passed 150/150. Restating it as a
  // ratio over the whole index asserts failures nobody measured.
  it("never restates the 150-card subset as a ratio over the whole index", async () => {
    installFetch(335);
    const n = await note();

    expect(n).not.toMatch(/150 of (those|them|the)/i);
    expect(n).toMatch(/150\s*\/\s*150|subset/i);
    // and it must say what is NOT claimed about the unchecked remainder
    expect(n).toMatch(/unchecked is not failed|no verdict|not been re-?run/i);
  });
});
