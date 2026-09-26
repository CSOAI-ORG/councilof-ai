import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { robotsAllows } from "./_witness";

/**
 * public/robots.txt — `Disallow: /api/` for `*` blocked the endpoints published FOR agents
 * (/api/x402, /api/a2a, …). Found by a developer-persona test and the self-parity record, 2026-09-26.
 * Judged with the estate's own RFC 9309 longest-match evaluator (functions/api/_witness.ts).
 */
const ROBOTS = readFileSync(resolve(__dirname, "../../public/robots.txt"), "utf8");
const UA = "CSOAI-devsurface/0.1"; // an agent with no named group: it reads the `*` group

describe("robots.txt lets well-behaved agents reach the agent-facing endpoints", () => {
  it.each([
    "/api/x402",
    "/api/a2a",
    "/api/mcp",
    "/api/state",
    "/api/openapi.json",
    "/api/cards",
    "/api/root",
    "/api/gspc",
    "/api/gspc?axis=governance",
  ])("%s is allowed for *", (path) => {
    expect(robotsAllows(ROBOTS, UA, path)).toMatchObject({ group: "*", allowed: true });
  });

  it("the rest of /api/ stays excluded", () => {
    expect(robotsAllows(ROBOTS, UA, "/api/receipts")).toMatchObject({ allowed: false, rule: "Disallow: /api/" });
    expect(robotsAllows(ROBOTS, UA, "/api/pop/swift")).toMatchObject({ allowed: false });
  });

  it("control: the file as it shipped blocked /api/x402 and /api/a2a", () => {
    const shipped = ROBOTS.replace(/^Allow: \/api\/(x402|a2a|mcp|state|openapi\.json|cards|root)\n/gm, "");
    expect(robotsAllows(shipped, UA, "/api/x402").allowed).toBe(false);
    expect(robotsAllows(shipped, UA, "/api/a2a").allowed).toBe(false);
  });

  it("keeps the training opt-out: ai-train=no on the * group", () => {
    expect(ROBOTS).toMatch(/^User-agent: \*\nContent-Signal: [^\n]*\bai-train=no\b/m);
  });
});
