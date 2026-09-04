import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./aiCardBus", () => ({ emitCard: vi.fn() }));

import { askSovereign } from "./sovAsk";

describe("askSovereign chat contract", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("accepts the Pages handler answer/reply shape and preserves state/provenance", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      answer: "The published board has a grounded result for this named axis.",
      reply: "The published board has a grounded result for this named axis.",
      state: "grounded",
      provenance: "published board",
      model: null,
    })));

    const result = await askSovereign("What is measured on the board?");

    expect(result).toEqual({
      ok: true,
      text: "The published board has a grounded result for this named axis.",
      state: "grounded",
      provenance: "published board",
    });
  });
});
