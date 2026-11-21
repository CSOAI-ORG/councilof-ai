import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CensusToolOutput } from "./CensusToolOutput";
import type { RunnerToolResult } from "./ToolRunner";

const original = "Historical source: 75 correct 402 challenges; 16 phantom or unreachable.";
const observed: RunnerToolResult = {
  ok: true, state: "runtime_observed", text: original,
  structuredContent: { state: "VALID", as_of: "2026-10-06T06:41:19Z", headline: original,
    counts: { total: 100, challenge_402: 75, dead_404_or_unreachable: 15, other_error: 1 } },
};
const render = (result: RunnerToolResult) => renderToStaticMarkup(createElement(CensusToolOutput, { result }));
const summary = (html: string) => html.split("<details")[0];

describe("the census tool console uses the same bounded reader as Answers", () => {
  it("separates status buckets and snapshot time without rewriting the returned source", () => {
    const html = render(observed);
    expect(summary(html)).toContain("75 returned HTTP 402; 15 returned HTTP 404 or were unreachable; 1 had other errors.");
    expect(summary(html)).toContain("snapshot 2026-10-06");
    expect(summary(html)).toContain("HTTP status alone does not establish a valid payment challenge, settlement or delivery.");
    expect(summary(html)).not.toContain("correct 402");
    expect(html).toContain(original);
    expect(html).toContain("Original machine response (unchanged)");
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|>)/);
  });

  it("does not turn a failed call or an unavailable source into numeric results", () => {
    for (const patch of [{ ok: false }, { state: "unreachable" }, { state: "unchecked" },
      { structuredContent: { state: "UNREACHABLE", counts: { total: 100, challenge_402: 75 } } }]) {
      const text = summary(render({ ...observed, ...patch } as RunnerToolResult));
      expect(text).toContain("could not be summarized");
      expect(text).not.toContain("returned HTTP 402");
      expect(text).not.toContain("<dl");
    }
  });

  it("keeps an absent error count unknown while retaining a measured zero", () => {
    const payload = observed.structuredContent as Record<string, unknown>;
    const missing = summary(render({ ...observed, structuredContent: { ...payload,
      counts: { total: 5, challenge_402: 1, dead_404_or_unreachable: 3 } } }));
    expect(missing).not.toContain("Other errors");
    const zero = summary(render({ ...observed, structuredContent: { ...payload,
      counts: { total: 0, challenge_402: 0, dead_404_or_unreachable: 0, other_error: 0 } } }));
    expect(zero).toContain("Of 0 catalog rows, 0 returned HTTP 402");
    expect(zero).toContain("Other errors");
  });

  it("refuses malformed or nonfinite counts and an unstructured historical headline", () => {
    for (const total of [-1, 1.5, NaN, Infinity, "100", true]) {
      expect(summary(render({ ...observed, structuredContent: {
        state: "VALID", counts: { total, challenge_402: total } } }))).toContain("could not be summarized");
    }
    expect(summary(render({ ...observed, structuredContent: null }))).toContain("could not be summarized");
  });

  it("keeps the two tool catalogues aligned on the status-only read boundary", () => {
    const descriptions = ["functions/mcp/gspc-tools.json", "mcp/gspc-server/gspc-tools.json"].map(path => {
      const catalogue = JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
      return catalogue.tools.find((tool: { name: string }) => tool.name === "x402_trust").description;
    });
    expect(descriptions[0]).toBe(descriptions[1]);
    expect(descriptions[0]).toContain("HTTP 402 alone does not establish a valid payment challenge");
    expect(descriptions[0]).toContain("no new probe or signature verification");
  });
});
