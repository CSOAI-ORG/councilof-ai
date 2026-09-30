import { describe, expect, it } from "vitest";
import { newestLeaf, traceCardAsOf } from "./TraceReaderRail";
import { a2aDoorWithoutCensus } from "./A2aReaderRail";

const A = "a".repeat(64);
const B = "B".repeat(64);

describe("TRACE rail helpers", () => {
  it("takes the newest 64-hex leaf of the root and says where it sits", () => {
    expect(newestLeaf({ card_sha256: [A, B] })).toEqual({ leaf: B.toLowerCase(), index: 1, total: 2 });
    expect(newestLeaf({ card_sha256: [A, "not-a-sha"] })).toEqual({ leaf: A, index: 0, total: 2 });
  });

  it("returns null — never a guessed leaf — when the root carries none", () => {
    expect(newestLeaf(null)).toBeNull();
    expect(newestLeaf({})).toBeNull();
    expect(newestLeaf({ card_sha256: [] })).toBeNull();
    expect(newestLeaf({ card_sha256: "abc" })).toBeNull();
  });

  it("quotes the card's own as_of through the trace wrapper, else null", () => {
    expect(traceCardAsOf({ card: { card: { as_of: "2026-08-28T09:06:28.399Z" } } })).toBe("2026-08-28T09:06:28.399Z");
    expect(traceCardAsOf({ card: { as_of: "2026-09-01" } })).toBe("2026-09-01");
    expect(traceCardAsOf({ state: "NOT_FOUND" })).toBeNull();
  });
});

describe("A2A rail", () => {
  it("recognises the JSON-RPC door description as carrying no census", () => {
    expect(a2aDoorWithoutCensus({ protocolVersion: "1.0", skills: [{}, {}, {}] })).toEqual({ protocolVersion: "1.0", skills: 3 });
  });

  it("leaves a real census document to the census renderer", () => {
    expect(a2aDoorWithoutCensus({ protocolVersion: "1.0", skills: [], n: 4 })).toBeNull();
    expect(a2aDoorWithoutCensus({ rows: [] })).toBeNull();
    expect(a2aDoorWithoutCensus({})).toBeNull();
  });
});
