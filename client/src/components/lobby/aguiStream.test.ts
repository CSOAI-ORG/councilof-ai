import { describe, expect, it } from "vitest";
import { parseSseFrame } from "./aguiStream";

describe("aguiStream", () => {
  it("parses SSE frames with JSON data", () => {
    const frame = 'event: TEXT_MESSAGE_CONTENT\ndata: {"delta":"hello"}\n';
    const parsed = parseSseFrame(frame);
    expect(parsed?.event).toBe("TEXT_MESSAGE_CONTENT");
    expect(parsed?.data).toEqual({ delta: "hello" });
  });

  it("parses HITL consent events", () => {
    const frame =
      'event: HITL\ndata: {"reason":"publish signed evidence","options":["approve","deny"]}\n';
    const parsed = parseSseFrame(frame);
    expect(parsed?.event).toBe("HITL");
    expect((parsed?.data as { options: string[] }).options).toEqual(["approve", "deny"]);
  });

  it("returns null for malformed frames", () => {
    expect(parseSseFrame("not sse")).toBeNull();
  });
});
