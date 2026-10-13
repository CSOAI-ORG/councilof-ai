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
    // The three machine-door Allow lines added on 13 Oct sit between the signal and the Disallow.
    const before = ROBOTS.replace(/(User-agent: (GPTBot|ClaudeBot)\nContent-Signal: [^\n]*\n(?:Allow: [^\n]*\n)*)Disallow: \//g, "$1Allow: /");
    expect(before).not.toBe(ROBOTS);
    expect(robotsAllows(before, "GPTBot", "/").allowed).toBe(true);
    expect(robotsAllows(before, "ClaudeBot", "/").allowed).toBe(true);
  });
});

/**
 * Machine doors (13 Oct 2026). The outward gate check `consistency.robots_allows_agent_paths`
 * listed 20 blocked pairs: GPTBot and ClaudeBot on each of its ten agent-facing paths. The served
 * /robots.txt was byte-identical to this file, so every Disallow was ours. Cloudflare prepends
 * nothing to it.
 *
 * The 29 Sep change wrote a bare `Disallow: /` for the crawlers the edge refuses. That was wider
 * than the edge. Measured live on 13 Oct at 07:00Z, 07:03Z and 07:07Z, GET, sending each crawler's
 * published user-agent string from our own address: the edge answers 403 on pages, /api/,
 * /llms.txt, /sitemap.xml and /signed/, and 200 under /.well-known/ and on /mcp and under /mcp/.
 * So 12 of the 20 pairs were doors the edge holds open and this file closed. Each refused group
 * now carries the same six Allow lines, one per door. Limit of the method, as on 29 Sep: this is
 * what the edge answers the user-agent string. What it answers the crawler's own network was not
 * observed.
 *
 * The rule the tests below hold: this file may be stricter than the edge, never looser.
 *  - a door (an agent-facing path the edge answers 200): the file allows it;
 *  - a path the edge answers 403: the file refuses it;
 *  - the rest of /.well-known/, which the edge also answers 200: the file still refuses it. Most
 *    of it is per-framework documents, which are content these crawlers are not invited to.
 *
 * The other 8 pairs (GPTBot and ClaudeBot on /api/gspc, /api/state, /llms.txt and
 * /signed/card_index.json) are refused by the edge itself, so the file keeps refusing them, and
 * the gate check keeps listing them until the edge policy or the check's own list changes. Do NOT
 * clear them here by adding an Allow for a path the edge answers 403: that is the 29 Sep defect
 * in reverse. Re-measure first, then change EDGE and the file together.
 */
describe("robots.txt opens the machine doors the edge serves to the crawlers it refuses", () => {
  /** Every crawler whose group says `Disallow: /`. Names, not a count: a swap must show. */
  const REFUSED = ["GPTBot", "ClaudeBot", "CCBot", "Bytespider", "Amazonbot", "Diffbot", "omgili", "Timpibot"];
  /** Timpibot is refused by this file on policy alone: the edge answered it 200 on every path below. */
  const EDGE_REFUSES = REFUSED.filter((ua) => ua !== "Timpibot");
  /** Path, and what the edge answered each of the seven EDGE_REFUSES crawlers (13 Oct 2026, 07:07Z). */
  const EDGE: Array<[string, 200 | 403]> = [
    ["/.well-known/agent-card.json", 200], ["/.well-known/agent.json", 200], ["/.well-known/x402.json", 200],
    ["/.well-known/mcp-registry-auth", 200], ["/.well-known/did.json", 200], ["/.well-known/security.txt", 200],
    ["/mcp", 200], ["/mcp/", 200], ["/mcp/free", 200],
    ["/", 403], ["/llms.txt", 403], ["/sitemap.xml", 403], ["/api/gspc", 403], ["/api/state", 403],
    ["/api/x402", 403], ["/signed/card_index.json", 403], ["/mcp-servers/", 403],
  ];
  const edge = (path: string) => EDGE.find(([p]) => p === path)?.[1];
  /** scripts/outward-gate/outward_gate.py AGENT_PATHS, as read on 13 Oct 2026. */
  const GATE_PATHS = [
    "/.well-known/agent-card.json", "/.well-known/agent.json", "/.well-known/x402.json", "/.well-known/mcp-registry-auth",
    "/mcp", "/mcp/", "/api/gspc", "/api/state", "/llms.txt", "/signed/card_index.json",
  ];
  /** The doors: the gate's agent-facing paths the edge answers 200, plus the free MCP endpoint under /mcp/. */
  const DOOR_PATHS = [...GATE_PATHS.filter((p) => edge(p) === 200), "/mcp/free"];
  /** Served by the edge, not a door: the file stays stricter than the edge here. */
  const SERVED_NOT_INVITED = ["/.well-known/did.json", "/.well-known/security.txt"];
  const DOORS = [
    "Allow: /.well-known/agent-card.json", "Allow: /.well-known/agent.json", "Allow: /.well-known/x402.json",
    "Allow: /.well-known/mcp-registry-auth", "Allow: /mcp$", "Allow: /mcp/",
  ];
  const DOOR_BLOCK = `${DOORS.join("\n")}\nDisallow: /\n`;
  /** The file as it stood before 13 Oct: the same groups with the bare Disallow. */
  const BEFORE = ROBOTS.split(DOOR_BLOCK).join("Disallow: /\n");

  it("the table holds what it says: seven doors at 200, the two extra /.well-known/ paths at 200", () => {
    expect(DOOR_PATHS).toEqual([
      "/.well-known/agent-card.json", "/.well-known/agent.json", "/.well-known/x402.json", "/.well-known/mcp-registry-auth",
      "/mcp", "/mcp/", "/mcp/free",
    ]);
    for (const p of [...DOOR_PATHS, ...SERVED_NOT_INVITED]) expect(edge(p), p).toBe(200);
  });

  const doorCells = EDGE_REFUSES.flatMap((ua) => DOOR_PATHS.map((path) => [ua, path] as const));
  it.each(doorCells)("%s %s: the edge answers 200 and the file allows it", (ua, path) => {
    expect(robotsAllows(ROBOTS, ua, path)).toMatchObject({ group: "agent", allowed: true });
  });

  const shutCells = EDGE_REFUSES.flatMap((ua) => EDGE.filter(([, s]) => s === 403).map(([path]) => [ua, path] as const));
  it.each(shutCells)("%s %s: the edge answers 403 and the file refuses it", (ua, path) => {
    expect(robotsAllows(ROBOTS, ua, path)).toMatchObject({ group: "agent", allowed: false, rule: "Disallow: /" });
  });

  // did.json and security.txt: the edge answered all seven 200. eu-ai-act.json: 200 to the GPTBot string (07:1xZ).
  it("the rest of /.well-known/ stays refused: stricter than the edge, never looser", () => {
    for (const ua of REFUSED) {
      for (const path of [...SERVED_NOT_INVITED, "/.well-known/eu-ai-act.json", "/.well-known/"]) {
        expect(robotsAllows(ROBOTS, ua, path), `${ua} ${path}`).toMatchObject({ allowed: false, rule: "Disallow: /" });
      }
    }
  });

  it("Timpibot gets the same rules as the other refused groups (file policy; the edge answered it 200)", () => {
    for (const path of DOOR_PATHS) expect(robotsAllows(ROBOTS, "Timpibot", path).allowed, path).toBe(true);
    for (const [path, status] of EDGE) {
      if (status === 403) expect(robotsAllows(ROBOTS, "Timpibot", path).allowed, path).toBe(false);
    }
  });

  it("every group that says `Disallow: /` carries the same six Allow lines, before it, and nothing else", () => {
    const refused = groups(ROBOTS).filter((g) => g.lines.includes("Disallow: /"));
    expect(refused.map((g) => g.agents.join(",")).sort()).toEqual([...REFUSED].sort());
    for (const g of refused) {
      expect(g.lines.filter((l) => !/^content-signal:/i.test(l)), g.agents.join(",")).toEqual([...DOORS, "Disallow: /"]);
    }
  });

  /**
   * RFC 9309 says the longest match wins, and order is irrelevant. Some readers still stop at the
   * first rule whose literal prefix matches (Python's urllib.robotparser is one). The Allow lines
   * come first so both kinds reach the doors. A first-match reader does not know `$`, so it still
   * treats the bare /mcp as refused: it stays away from an open door, never the reverse.
   */
  it("a reader that takes the first literal-prefix match reaches the same doors, and no page", () => {
    const firstMatch = (txt: string, agent: string, path: string) => {
      const g = groups(txt).find((x) => x.agents.some((a) => a.toLowerCase() === agent.toLowerCase()));
      const rule = g?.lines.map((l) => /^(allow|disallow):\s*(\S+)$/i.exec(l)).find((m) => m && path.startsWith(m[2]));
      return rule ? rule[1].toLowerCase() === "allow" : true;
    };
    for (const ua of REFUSED) {
      for (const path of DOOR_PATHS.filter((p) => p !== "/mcp")) {
        expect(firstMatch(ROBOTS, ua, path), `${ua} ${path}`).toBe(true);
      }
      for (const path of ["/", "/llms.txt", "/api/gspc", "/signed/card_index.json", "/mcp-servers/", "/mcp", "/.well-known/did.json"]) {
        expect(firstMatch(ROBOTS, ua, path), `${ua} ${path}`).toBe(false);
      }
    }
    // control: with the Disallow first, the same reader never gets past it
    const disallowFirst = ROBOTS.split(DOOR_BLOCK).join(`Disallow: /\n${DOORS.join("\n")}\n`);
    expect(disallowFirst).not.toBe(ROBOTS);
    expect(firstMatch(disallowFirst, "GPTBot", "/.well-known/agent-card.json")).toBe(false);
    expect(robotsAllows(disallowFirst, "GPTBot", "/.well-known/agent-card.json").allowed).toBe(true); // RFC 9309: order is irrelevant
  });

  it("control: the file as it stood before 13 Oct closed every one of those doors", () => {
    expect(BEFORE).not.toBe(ROBOTS);
    expect(BEFORE).not.toMatch(/^Allow: \/(\.well-known\/|mcp)/m);
    for (const ua of REFUSED) {
      for (const path of DOOR_PATHS) {
        expect(robotsAllows(BEFORE, ua, path), `${ua} ${path}`).toMatchObject({ allowed: false, rule: "Disallow: /" });
      }
    }
  });

  it("control: an unanchored `Allow: /mcp` would also open /mcp-servers/, which the edge refuses", () => {
    expect(robotsAllows(ROBOTS, "GPTBot", "/mcp-servers/")).toMatchObject({ allowed: false, rule: "Disallow: /" });
    const loose = ROBOTS.replace(/^Allow: \/mcp\$$/gm, "Allow: /mcp");
    expect(loose).not.toBe(ROBOTS);
    expect(robotsAllows(loose, "GPTBot", "/mcp-servers/").allowed).toBe(true);
  });

  it("control: a blanket `Allow: /.well-known/` would invite these crawlers to the whole directory", () => {
    const blanket = ROBOTS.split(DOOR_BLOCK).join("Allow: /.well-known/\nAllow: /mcp$\nAllow: /mcp/\nDisallow: /\n");
    expect(blanket).not.toBe(ROBOTS);
    expect(robotsAllows(blanket, "GPTBot", "/.well-known/eu-ai-act.json").allowed).toBe(true);
    expect(robotsAllows(ROBOTS, "GPTBot", "/.well-known/eu-ai-act.json").allowed).toBe(false);
  });

  // Measured 13 Oct 07:00Z and 07:03Z: the edge answered each NAMED agent below 200 on all ten paths.
  // `UA` stands for any agent with no group of its own; it reads the `*` group.
  it.each([
    UA, "Claude-User", "Claude-SearchBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User",
    "Google-Extended", "Applebot-Extended", "meta-externalagent",
  ])("%s is allowed on all ten of the outward gate's agent-facing paths", (ua) => {
    for (const path of GATE_PATHS) expect(robotsAllows(ROBOTS, ua, path).allowed, path).toBe(true);
  });

  it("the gate's 20 blocked pairs are now 8, and those 8 are the paths the edge itself refuses", () => {
    const blocked = (txt: string) =>
      ["GPTBot", "ClaudeBot"].flatMap((ua) => GATE_PATHS.filter((p) => !robotsAllows(txt, ua, p).allowed).map((p) => `${ua} ${p}`));
    expect(blocked(BEFORE)).toHaveLength(20);
    expect(blocked(ROBOTS)).toEqual([
      "GPTBot /api/gspc", "GPTBot /api/state", "GPTBot /llms.txt", "GPTBot /signed/card_index.json",
      "ClaudeBot /api/gspc", "ClaudeBot /api/state", "ClaudeBot /llms.txt", "ClaudeBot /signed/card_index.json",
    ]);
    for (const pair of blocked(ROBOTS)) expect(edge(pair.split(" ")[1]), pair).toBe(403);
  });
});
