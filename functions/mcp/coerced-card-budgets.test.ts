import { afterEach, describe, expect, it, vi } from "vitest";
import { coerceCard, verifyToolResult } from "./_handlers";

afterEach(() => vi.unstubAllGlobals());

describe("verification budgets survive card coercion", () => {
  it.each([false, true])(
    "rejects wide cards before anchors or canonicalization (JSON string=%s)",
    async (encoded) => {
      const network = vi.fn(() => {
        throw new Error("No anchors should be fetched");
      });
      vi.stubGlobal("fetch", network);
      const card = {
        id: "a".repeat(64),
        body: {
          kind: "gspc.measurement-card",
          values: Array(10_001).fill(null),
        },
        pubkey: "untrusted",
        signature: "untrusted",
      };
      const result = await verifyToolResult(
        { card: encoded ? JSON.stringify(card) : card },
        "https://councilof.ai",
      );
      expect(result.structuredContent).toMatchObject({
        state: "UNCHECKABLE",
        reasons: ["input_budget_exceeded"],
      });
      expect(network).not.toHaveBeenCalled();
    },
  );

  it.each([false, true])(
    "rejects deep cards before anchors or canonicalization (JSON string=%s)",
    async (encoded) => {
      const network = vi.fn(() => {
        throw new Error("No anchors should be fetched");
      });
      vi.stubGlobal("fetch", network);
      let nested: unknown = 1;
      for (let n = 0; n < 70; n++) nested = { nested };
      const card = {
        id: "a".repeat(64),
        body: { kind: "gspc.measurement-card", nested },
        pubkey: "untrusted",
        signature: "untrusted",
      };
      const result = await verifyToolResult(
        { card: encoded ? JSON.stringify(card) : card },
        "https://councilof.ai",
      );
      expect(result.structuredContent).toMatchObject({
        state: "UNCHECKABLE",
        reasons: ["input_budget_exceeded"],
      });
      expect(network).not.toHaveBeenCalled();
    },
  );

  it("preserves large scalar values when parsing an encoded object", async () => {
    const card = { payload: "A".repeat(20 * 1024 * 1024) };
    const result = await coerceCard(JSON.stringify(card));
    expect(result.error).toBeUndefined();
    expect((result.card as typeof card).payload.length).toBe(
      card.payload.length,
    );
  });

  it.each(["a".repeat(64), "https://councilof.ai/signed/cards/example.json"])(
    "bounds a fetched card before verification: %s",
    async (source) => {
      const network = vi.fn(async () =>
        Response.json({ body: { values: Array(10_001).fill(null) } }),
      );
      vi.stubGlobal("fetch", network);
      const result = await verifyToolResult(
        { card: source },
        "https://councilof.ai",
      );
      expect(result.structuredContent).toMatchObject({
        state: "UNCHECKABLE",
        reasons: ["input_budget_exceeded"],
      });
      expect(network).toHaveBeenCalledTimes(1);
    },
  );

  it("refuses an oversized fetched card before reading its stream", async () => {
    const pull = vi.fn();
    const cancel = vi.fn();
    const body = new ReadableStream({ pull, cancel }, { highWaterMark: 0 });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(body, {
            headers: { "content-length": String(28 * 1024 * 1024 + 1) },
          }),
      ),
    );
    const result = await coerceCard("a".repeat(64));
    expect(result.card).toBeUndefined();
    expect(result.error).toContain("body limit");
    expect(pull).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
