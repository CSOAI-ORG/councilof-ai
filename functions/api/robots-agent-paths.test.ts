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

/**
 * Under RFC 9309 a crawler with a group of its own reads ONLY that group; it never falls back
 * to `*`. The `ai-train=no` reservation used to sit in the `*` group alone, so GPTBot, ClaudeBot,
 * CCBot and every other named crawler never saw it. Every group must carry the same signal,
 * and adding it must not change what any crawler may fetch.
 */
type Group = { agents: string[]; lines: string[] };
function groups(txt: string): Group[] {
  const out: Group[] = [];
  let cur: Group | null = null;
  let inAgents = false;
  for (const raw of txt.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = /^user-agent:\s*(\S+)$/i.exec(line);
    if (m) {
      if (!cur || !inAgents) out.push((cur = { agents: [], lines: [] }));
      cur.agents.push(m[1]);
      inAgents = true;
      continue;
    }
    inAgents = false;
    if (cur && !/^sitemap:/i.test(line)) cur.lines.push(line);
  }
  return out;
}

describe("robots.txt states the content signal in every group", () => {
  const all = groups(ROBOTS);
  const star = all.find((g) => g.agents.includes("*"));
  const signal = star?.lines.find((l) => /^content-signal:/i.test(l));

  it("the * group carries search=yes, ai-input=yes, ai-train=no", () => {
    expect(signal).toBeDefined();
    expect(signal).toMatch(/\bsearch=yes\b/);
    expect(signal).toMatch(/\bai-input=yes\b/);
    expect(signal).toMatch(/\bai-train=no\b/);
  });

  it("there are named groups to check (the parser read the file)", () => {
    expect(all.filter((g) => !g.agents.includes("*")).length).toBeGreaterThanOrEqual(10);
  });

  it.each(groups(ROBOTS).map((g) => [g.agents.join(","), g] as const))("group %s carries the same Content-Signal line", (_name, g) => {
    expect(g.lines.filter((l) => /^content-signal:/i.test(l))).toEqual([signal]);
  });

  it("the signal changes no access decision: answer engines allowed, bulk corpora refused", () => {
    for (const ua of ["OAI-SearchBot", "PerplexityBot", "Google-Extended"]) {
      expect(robotsAllows(ROBOTS, ua, "/about")).toMatchObject({ allowed: true });
    }
    for (const ua of ["GPTBot", "ClaudeBot", "CCBot", "Bytespider", "Amazonbot"]) {
      expect(robotsAllows(ROBOTS, ua, "/about")).toMatchObject({ allowed: false });
    }
    const without = ROBOTS.replace(/^Content-Signal: [^\n]*\n/gm, "");
    for (const ua of ["GPTBot", "CCBot", UA]) {
      for (const path of ["/", "/about", "/api/x402", "/api/receipts"]) {
        expect(robotsAllows(ROBOTS, ua, path).allowed).toBe(robotsAllows(without, ua, path).allowed);
      }
    }
  });
});

/**
 * Declared = observed (29 Sep 2026, growth gaps A5). The UA matrix below was measured live at
 * 10:04Z and again at 10:2xZ on 29 Sep: training crawlers get 403 from the edge on /, /llms.txt
 * and /api/gspc; search and user agents get 200. Until then robots.txt said `Allow: /` to GPTBot
 * and ClaudeBot. If the edge policy changes, re-measure and change this table and the file together.
 */
describe("robots.txt states what the edge does", () => {
  const OBSERVED: Array<[string, 200 | 403]> = [
    ["GPTBot", 403], ["ClaudeBot", 403], ["CCBot", 403], ["Bytespider", 403], ["Amazonbot", 403],
    ["OAI-SearchBot", 200], ["ChatGPT-User", 200], ["Claude-User", 200], ["Claude-SearchBot", 200],
    ["PerplexityBot", 200], ["Perplexity-User", 200], ["meta-externalagent", 200],
  ];
  it.each(OBSERVED)("%s: robots.txt verdict on / matches the observed %i", (ua, status) => {
    expect(robotsAllows(ROBOTS, ua, "/").allowed).toBe(status === 200);
  });
  it("control: the file as it stood before 29 Sep fails this table", () => {
    const before = ROBOTS.replace(/(User-agent: (GPTBot|ClaudeBot)\nContent-Signal: [^\n]*\n)Disallow: \//g, "$1Allow: /");
    expect(robotsAllows(before, "GPTBot", "/").allowed).toBe(true);
    expect(robotsAllows(before, "ClaudeBot", "/").allowed).toBe(true);
  });
});
