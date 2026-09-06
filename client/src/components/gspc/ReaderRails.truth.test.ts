import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (name: string) => readFileSync(resolve(__dirname, name), "utf8");

const readers = [
  "AgentsReaderRail.tsx",
  "McpReaderRail.tsx",
  "A2aReaderRail.tsx",
  "TraceReaderRail.tsx",
  "OtelReaderRail.tsx",
  "SwiftReaderRail.tsx",
];

describe("reader rails preserve endpoint truth", () => {
  it("never uses the GSPC board or the current clock to manufacture reader state", () => {
    for (const reader of readers) {
      const text = source(reader);
      expect(text, reader).not.toContain("/api/gspc");
      expect(text, reader).not.toContain("new Date(");
      expect(text, reader).not.toContain('state: "live"');
    }
  });

  it.each([
    ["AgentsReaderRail.tsx", "/api/agents"],
    ["McpReaderRail.tsx", "/api/mcp"],
    ["A2aReaderRail.tsx", "/api/a2a"],
    ["TraceReaderRail.tsx", "/api/trace"],
    ["OtelReaderRail.tsx", "/api/otel"],
    ["SwiftReaderRail.tsx", "/api/swift"],
  ])("%s calls only its own reader endpoint", (reader, endpoint) => {
    expect(source(reader)).toContain(`fetch("${endpoint}"`);
  });

  it("fails the unpublished agent and A2A readers closed", () => {
    expect(source("AgentsReaderRail.tsx")).toContain("UNREACHABLE —");
    expect(source("A2aReaderRail.tsx")).toContain("UNCHECKABLE —");
    expect(source("A2aReaderRail.tsx")).toContain(
      "is not a substitute for GET /api/a2a",
    );
  });

  it("renders TRACE and OTel terminal states from their API documents", () => {
    const trace = source("TraceReaderRail.tsx");
    const otel = source("OtelReaderRail.tsx");
    expect(trace).toContain("Object.entries(doc.claims");
    expect(trace).toContain("claim.status");
    expect(otel).toContain("doc.collector");
    expect(otel).toContain("doc.gen_ai_spans");
    expect(otel).not.toContain("SPANS_EMITTED");
  });

  it("uses the SWIFT API's real rows[] and name field", () => {
    const swift = source("SwiftReaderRail.tsx");
    expect(swift).toContain("doc.rows");
    expect(swift).toContain("entry.name");
    expect(swift).not.toContain("entry.bank");
    expect(swift).not.toContain("doc.entries");
    expect(swift).toContain("doc.swift_com_fetch");
  });
});
