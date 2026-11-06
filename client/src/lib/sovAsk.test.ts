import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./aiCardBus", () => ({ emitCard: vi.fn() }));

import { askSovereign } from "./sovAsk";
import { readAsk } from "../../../functions/_lib/askInput";

describe("askSovereign chat contract", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("routes the user turn without matching keywords from the system instructions", async () => {
    const question = "What is measured on the safety axis?";
    const system = "Explain Article 50 marking evidence when the user asks about it.";
    const received: Array<Awaited<ReturnType<typeof readAsk>>> = [];
    vi.stubGlobal("fetch", vi.fn(async (input, init) => {
      const request = new Request(new URL(String(input), "https://example.test"), init);
      // Exercise the handler's actual input reader, not a second test-only parser.
      received.push(await readAsk(request));
      return Response.json({ answer: "The safety axis has published measurements.", state: "grounded" });
    }));

    expect(await askSovereign(question, { system })).toMatchObject({ ok: true, state: "grounded" });
    expect(received).toHaveLength(1);
    expect(received[0]?.question).toBe(question);
    expect(received[0]?.body?.messages).toEqual([
      { role: "system", content: system },
      { role: "user", content: question },
    ]);
  });

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
