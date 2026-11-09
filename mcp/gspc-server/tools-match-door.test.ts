import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * WHY THIS EXISTS (2026-09-06). Smithery's listing for csoai/gspc advertises four tools the door
 * refuses BY NAME — measure, verify, jail-probe, enter-arena — and functions/mcp/[[path]].ts answers
 * tools/call for `measure` and `jail-probe` with -32601 and "mill-tool dropped". That listing is
 * Smithery's own cache of an older deployment: there is no smithery.yaml in this repository, so
 * nothing here produced it, and correcting it needs a republish under the owner's account.
 *
 * What this repository CAN guarantee is that a phantom never originates here. pack.mjs copies the
 * canonical tool definitions into the shipped server, and these assertions hold that copy to the
 * door's own list. If the two ever diverge, the packaged server is the thing that lied, and this
 * fails before it ships.
 */
const ROOT = resolve(__dirname, "../..");
const J = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const doorFree = J(resolve(ROOT, "functions/mcp/gspc-tools.json")).tools.map((t: any) => t.name);
const doorPaid = J(resolve(ROOT, "functions/mcp/paid-tools.json")).tools.map((t: any) => t.name);
const lock = J(resolve(ROOT, "functions/mcp/tool-fleet.lock.json"));

/**
 * The number word for a tool count, so a descriptor's sentence can be checked without a
 * hand-typed list that runs out. The same words as functions/mcp/tool-fleet.lock.test.ts —
 * a vocabulary, not a measurement: the measurement is the lock, and every count below is
 * derived from it.
 */
const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function word(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    const o = n % 10;
    return o ? `${t}-${ONES[o]}` : t;
  }
  throw new Error(`no word for ${n}`);
}

describe("the packaged MCP server advertises exactly what the door serves", () => {
  it("reads the door's canonical lists, so this cannot pass vacuously", () => {
    // Counts are DERIVED, never typed: the door grew 47 -> 48 free when
    // axis_watchdog-ingest shipped, and a typed 47 turned this file red against
    // the door's own bytes — the exact frozen-number defect the estate keeps
    // repairing. What is pinned here are the PERMANENT facts: both banks are
    // populated, disjoint, anchored on the three free-forever readers, and free
    // of every dropped mill-tool phantom.
    expect(doorFree.length).toBeGreaterThanOrEqual(30);
    expect(doorPaid.length).toBeGreaterThanOrEqual(1);
    // Node 20 is the estate's floor (package.json engines.node), and Set.prototype.intersection
    // is Node 22+. It passed here for a week because the local battery ran Node 22 while CI ran
    // Node 20, so the same file was green on the desk and red in the gate. The disjointness
    // check is written the portable way.
    const paidNames = new Set(doorPaid);
    expect(doorFree.filter((name) => paidNames.has(name))).toEqual([]);
    for (const anchor of ["board_totals", "get_axis", "verify_card"]) {
      expect(doorFree).toContain(anchor);
    }
    // The mill tools the door refused BY NAME must never originate here either.
    for (const phantom of ["measure", "verify", "jail-probe", "enter-arena", "witness_hash"]) {
      expect([...doorFree, ...doorPaid]).not.toContain(phantom);
    }
    // AND the two banks equal the PUBLISHED fleet, name for name. The floors above catch a
    // collapse; this catches a divergence. The lock is the authority: it is rendered from
    // council-os/capabilities.json, and functions/mcp/tool-fleet.lock.test.ts holds it against
    // gspc-tools.json, paid-tools.json, the registry, and — with FLEET_LOCK_LIVE=1 — the live
    // tools/list at the door itself. No count is typed here, so the fleet can grow.
    expect(doorFree).toEqual(lock.free);
    expect(doorPaid).toEqual(lock.paid);
    expect([...doorFree, ...doorPaid]).toHaveLength(lock.fleet_size);
  });

  it("keeps the package, runtime and registry package reference on one release version", () => {
    const pkg = J(resolve(__dirname, "package.json"));
    const registry = J(resolve(__dirname, "server.json"));
    const runtime = readFileSync(resolve(__dirname, "index.mjs"), "utf8");
    expect(registry.packages).toHaveLength(1);
    expect(registry.packages[0].identifier).toBe(pkg.name);
    expect(registry.packages[0].version).toBe(pkg.version);
    expect(runtime).toContain('new URL("./package.json", import.meta.url)');
    expect(runtime).not.toMatch(/const VERSION\s*=\s*"\d+\.\d+\.\d+"/);
  });

  it("keeps npm's rendered description short and accurate", () => {
    const { description } = J(resolve(__dirname, "package.json"));
    expect(description.length).toBeLessThanOrEqual(255);
    // The sentence carries counts, so it is checked against the lock rather than typed here:
    // a typed sentence is what made #3692 edit this file by hand when the door grew.
    const all = word(lock.fleet_size);
    expect(description).toContain(
      `${all[0].toUpperCase()}${all.slice(1)} tools: ${word(lock.free.length)} free readers ` +
        `and ${word(lock.paid.length)} x402-metered evidence tools`,
    );
  });

  it("ships both canonical tool banks in the Docker client", () => {
    const dockerfile = readFileSync(resolve(__dirname, "Dockerfile"), "utf8");
    expect(dockerfile).toContain("gspc-tools.json paid-tools.json");
  });

  it("pack.mjs copies from the canonical sources and invents nothing", () => {
    const pack = readFileSync(resolve(__dirname, "pack.mjs"), "utf8");
    expect(pack).toContain("functions/mcp/gspc-tools.json");
    expect(pack).toContain("functions/mcp/paid-tools.json");
    // a literal tool array inside the packer would be a second source of truth
    expect(pack, "the packer must copy tool names, never carry its own")
      .not.toMatch(/"(board_totals|measure|jail-probe|enter-arena)"\s*,/);
  });

  for (const [label, file] of [["free", "gspc-tools.json"], ["paid", "paid-tools.json"]] as const) {
    it(`the shipped ${label} list, if present, equals the door's`, () => {
      const p = resolve(__dirname, file);
      if (!existsSync(p)) return; // written at pack time; absent in a clean tree
      const shipped = J(p).tools.map((t: any) => t.name);
      expect(shipped).toEqual(label === "free" ? doorFree : doorPaid);
    });
  }

  it("no dropped mill-tool is advertised anywhere we control", () => {
    // the exact four Smithery still shows
    const dropped = ["measure", "jail-probe", "enter-arena"];
    const surfaces = ["glama.json", "server.json", "package.json", "README.md"]
      .map((f) => resolve(__dirname, f))
      .filter(existsSync);
    const bad: string[] = [];
    for (const s of surfaces) {
      const t = readFileSync(s, "utf8");
      for (const d of dropped) {
        // match a tool-shaped mention, not prose about the incident
        if (new RegExp(`"${d}"`).test(t)) bad.push(`${s.split("/").pop()}: ${d}`);
      }
    }
    expect(bad, "a manifest we own advertises a tool the door refuses by name").toEqual([]);
  });
});

/**
 * 2026-09-26 developer-persona findings: this README said "22 axes measured · … 8 fact runs" and
 * "tools/list returns all twelve" while the door served thirteen, and its stdio section named no
 * 2025-11-25 protocol. Counts in a README go stale between releases; the live board and tools/list
 * are the authorities. These pin that nothing countable is typed here again.
 */
describe("the npm README describes the server without typed counts", () => {
  const readme = readFileSync(resolve(__dirname, "README.md"), "utf8");
  const pkg = J(resolve(__dirname, "package.json"));
  const runtime = readFileSync(resolve(__dirname, "index.mjs"), "utf8");
  const COUNTED = /\b\d+\s+(axes|axis|fact runs|model fleets|leader scores|tools|free tools|metered tools)\b|\b(all|the)\s+(eight|nine|ten|eleven|twelve|thirteen|fourteen)\b|\b(eight|nine|ten|eleven|twelve|thirteen|fourteen|four)\s+(free|metered|x402-metered|tools)\b/i;

  it("README types no board total and no tool count", () => {
    expect(readme.match(COUNTED)?.[0] ?? null).toBeNull();
  });

  // package.json's description DOES carry a count, on purpose: tool-fleet.lock.test.ts derives it from
  // the lock and fails when it drifts. The README had no such guard, which is why it went stale.

  it("control: the sentence that shipped would be caught", () => {
    expect("22 axes measured · 14 model fleets · 8 fact runs").toMatch(COUNTED);
    expect("`tools/list` returns all twelve").toMatch(COUNTED);
  });

  it("README's accepted protocol list is exactly the server's SUPPORTED_PROTOCOLS, 2025-11-25 included", () => {
    const m = runtime.match(/const SUPPORTED_PROTOCOLS = \[([^\]]+)\]/);
    expect(m).toBeTruthy();
    const supported = [...m![1].matchAll(/"([\d-]+)"/g)].map((x) => x[1]);
    expect(supported).toContain("2025-11-25");
    const line = readme.match(/Protocol versions accepted:([^;.]+)/);
    expect(line).toBeTruthy();
    const listed = [...line![1].matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((x) => x[1]);
    expect(listed).toEqual(supported);
  });

  it("ships the ONE axis alias table", () => {
    expect(pkg.files).toContain("axis-aliases.json");
    expect(readFileSync(resolve(__dirname, "pack.mjs"), "utf8")).toContain("functions/mcp/axis-aliases.json");
  });
});
