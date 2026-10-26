import { describe, it, expect } from "vitest";
import { recordsAnswer, RECORDS_INTENT } from "./_chatRecords";

const fake = (payload: unknown) => async () =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: JSON.stringify(payload) }] } }));

describe("_chatRecords", () => {
  it("ignores unrelated questions", async () => {
    expect(RECORDS_INTENT.test("what is the EU AI Act")).toBe(false);
    expect(await recordsAnswer("what is the EU AI Act", fake({}) as any)).toBeNull();
  });
  it("labels unmeasured records UNMEASURED and never says certified", async () => {
    const a = await recordsAnswer("search gspc records for github", fake({ records: [{ name: "x", key: "k|x", status: "UNMEASURED", axes: ["interop-conformance"] }] }) as any);
    expect(a).toContain("UNMEASURED");
    expect(a).not.toMatch(/\bcertified\b/i);
  });
  it("returns null when the API is down", async () => {
    expect(await recordsAnswer("show gspc report", (async () => new Response("", { status: 500 })) as any)).toBeNull();
  });
});
