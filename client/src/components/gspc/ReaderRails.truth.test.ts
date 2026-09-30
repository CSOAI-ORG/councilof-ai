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
    ["OtelReaderRail.tsx", "/api/otel"],
    ["SwiftReaderRail.tsx", "/api/swift"],
  ])("%s calls only its own reader endpoint", (reader, endpoint) => {
    expect(source(reader)).toContain(`fetch("${endpoint}"`);
  });

  it("TRACE asks its door a real question: a leaf of the public root, by sha", () => {
    const trace = source("TraceReaderRail.tsx");
    // /api/trace has no sha-less form (400 INVALID_REQUEST); the bare GET made a live door read UNREACHABLE.
    expect(trace).not.toContain('fetch("/api/trace"');
    expect(trace).toContain("fetch(`/api/trace?sha=${pick.leaf}`");
    // The leaf comes from the public root read on this load — never the board, never typed.
    expect(trace).toContain('fetch("/root.json"');
    expect(trace).toContain("card_sha256");
  });

  it("fails the unpublished agent and A2A readers closed", () => {
    expect(source("AgentsReaderRail.tsx")).toContain("UNREACHABLE —");
    // A 404 is the door saying it does not exist: NOT PUBLISHED / UNMEASURED, not an outage.
    expect(source("AgentsReaderRail.tsx")).toContain("response.status === 404");
    expect(source("AgentsReaderRail.tsx")).toContain("NOT PUBLISHED —");
    expect(source("A2aReaderRail.tsx")).toContain("NO CENSUS PUBLISHED —");
    expect(source("A2aReaderRail.tsx")).toContain("UNCHECKABLE —");
    expect(source("A2aReaderRail.tsx")).toContain(
      "is not a substitute for GET /api/a2a",
    );
  });

  it("renders TRACE and OTel terminal states from their API documents", () => {
    const trace = source("TraceReaderRail.tsx");
    const otel = source("OtelReaderRail.tsx");
    // csoai.trace/0.3 answers {state, sha, source, card}; there is no claims object to render.
    expect(trace).toContain("doc.state");
    expect(trace).toContain("doc.source");
    expect(trace).not.toContain("doc.claims");
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
