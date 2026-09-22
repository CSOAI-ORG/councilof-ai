import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * G-1 (2026-09-22). GET https://councilof.ai/api/mcp served:
 *
 *   "probe_host": "NICHOLASs-MacBook-Air-2.local"
 *
 * The operator's laptop name, in a public catalogue, on an investor-visible surface. It
 * came from `hostname()` in scripts/mcp-probe.mjs, serialised into
 * evidence/mcp-registry.json, which functions/api/mcp.ts, /api/tools and /api/state all
 * re-publish. A machine name is not a measurement — it identifies hardware and a person
 * and tells a reader nothing about the probe.
 *
 * This walks every JSON the site can serve — the imported evidence and data files under
 * functions/, everything under public/, and the JSON literals inside the handlers
 * themselves — and fails on any machine hostname. scripts/mcp-probe.mjs's own validator
 * holds the other end (probe_host must come from a closed vocabulary), and that runs
 * inside `npm run build:client`.
 */

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..");

/**
 * mDNS / LAN machine names and the vendor string that gives them away. `\b` on both ends
 * so "localhost", "local.json", "locale" and "$LOCAL" are not hostnames.
 */
const HOSTNAME_PATTERNS: Array<[string, RegExp]> = [
  ["mDNS .local hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.local\b/],
  ["MacBook machine name", /MacBook/i],
  ["iMac machine name", /\biMac\b/],
  ["Mac mini machine name", /\bMac[- ]mini\b/i],
  [".lan hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.lan\b/],
  [".home.arpa hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.home\.arpa\b/],
];

/**
 * Paths this guard does not read. Each is a directory of third-party or generated bulk
 * that the site does not serve as its own claim. Kept deliberately tiny: an exclusion is
 * how a guard goes quiet.
 */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "proofs"]);

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.includes(extname(name))) out.push(full);
  }
  return out;
}

function offenders(file: string): string[] {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const hits: string[] = [];
  for (const line of text.split("\n")) {
    for (const [label, re] of HOSTNAME_PATTERNS) {
      const m = line.match(re);
      // A test file may quote the defect it guards against; nothing under a *.test.* path
      // is served, so quoting it there is documentation, not publication.
      if (m) hits.push(`${label}: ${m[0]}`);
    }
  }
  return hits;
}

const SERVED_JSON = [
  ...walk(join(REPO, "public"), [".json"]),
  ...walk(join(REPO, "evidence"), [".json"]),
  ...walk(join(REPO, "client", "src", "data"), [".json"]),
];

// Handler sources, minus tests and fixtures — a hostname typed into a response literal
// reaches the wire exactly as one loaded from a file does.
const HANDLER_SOURCES = walk(join(REPO, "functions"), [".ts", ".js", ".mjs", ".json"]).filter(
  (f) => !/\.test\.[tj]s$/.test(f) && !f.includes("__fixtures__"),
);

describe("no machine hostname reaches a served surface", () => {
  it("finds the files it is meant to guard (not a vacuous pass)", () => {
    expect(SERVED_JSON.length).toBeGreaterThan(20);
    expect(HANDLER_SOURCES.length).toBeGreaterThan(20);
    expect(SERVED_JSON.some((f) => f.endsWith(join("evidence", "mcp-registry.json")))).toBe(true);
    expect(HANDLER_SOURCES.some((f) => f.endsWith(join("functions", "api", "mcp.ts")))).toBe(true);
  });

  it("the patterns catch the exact string that shipped, and spare the false friends", () => {
    expect(offenders.length).toBeGreaterThan(0); // function exists
    const caught = HOSTNAME_PATTERNS.filter(([, re]) => re.test('"probe_host": "NICHOLASs-MacBook-Air-2.local"'));
    expect(caught.map(([label]) => label)).toEqual(
      expect.arrayContaining(["mDNS .local hostname", "MacBook machine name"]),
    );
    for (const spared of [
      "http://localhost:4173/api/gspc",
      '"scope": "local"',
      '"locale": "en-GB"',
      "public/local.json",
      "localStorage",
    ]) {
      for (const [label, re] of HOSTNAME_PATTERNS) {
        expect(re.test(spared), `${label} must not match ${spared}`).toBe(false);
      }
    }
  });

  it("no served JSON contains a machine hostname", () => {
    const bad = SERVED_JSON.map((f) => [relative(REPO, f), offenders(f)] as const).filter(([, h]) => h.length > 0);
    expect(bad.map(([f, h]) => `${f} -> ${h.join(", ")}`)).toEqual([]);
  });

  it("no functions/ handler source contains a machine hostname", () => {
    const bad = HANDLER_SOURCES.map((f) => [relative(REPO, f), offenders(f)] as const).filter(([, h]) => h.length > 0);
    expect(bad.map(([f, h]) => `${f} -> ${h.join(", ")}`)).toEqual([]);
  });

  it("evidence/mcp-registry.json's probe_host is an environment class, never a machine", () => {
    const registry = JSON.parse(readFileSync(join(REPO, "evidence", "mcp-registry.json"), "utf8"));
    expect(["github-actions", "ci-runner", "pod", "workstation"]).toContain(registry.probe_host);
  });
});
