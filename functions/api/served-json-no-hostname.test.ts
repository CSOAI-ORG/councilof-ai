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
 * mDNS / LAN machine names and the vendor strings that give them away.
 *
 * The trailing `(?![\w-])` is load-bearing and was added after the first run of this
 * guard. `\.local\b` alone matched the schema name `csoai.local-json-canonicalize-result`
 * in functions/_lib/phase1ActionExecutor.ts — a word boundary sits between `l` and `-`,
 * so a hyphenated identifier read as a hostname. A guard that fires on an identifier is
 * one somebody silences. The lookahead requires `.local` to END the label, which is what
 * an mDNS name does.
 *
 * The leading `\b[A-Za-z0-9]` keeps "localhost", "locale", "local.json" and "$LOCAL" out:
 * each needs a label and a dot before `local` to match at all.
 *
 * 2026-09-26: `.local` must also be the LAST label — `(?!\.[A-Za-z0-9])`. The per-endpoint capsule
 * shards carry third-party declarations verbatim, and one names the JSON path
 * `transport.local.tools`. An mDNS name ends in `.local`; `x.local.y` is not one.
 */
const HOSTNAME_PATTERNS: Array<[string, RegExp]> = [
  ["mDNS .local hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.local(?![\w-]|\.[A-Za-z0-9])/],
  ["MacBook machine name", /MacBook/i],
  ["iMac machine name", /\biMac\b/],
  ["Mac mini machine name", /\bMac[- ]mini\b/i],
  [".lan hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.lan(?![\w-])/],
  [".home.arpa hostname", /\b[A-Za-z0-9][A-Za-z0-9-]{1,62}\.home\.arpa(?![\w-])/],
];

/**
 * Paths this guard does not read. Each is a directory of third-party or generated bulk
 * that the site does not serve as its own claim. Kept deliberately tiny: an exclusion is
 * how a guard goes quiet.
 */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);

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

/**
 * Six regexes against the whole file, not against every line: public/ is ~17,000 JSON
 * files and 378 MB, and the per-line form took longer than the 5 s default timeout.
 */
function offenders(file: string): string[] {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const hits: string[] = [];
  for (const [label, re] of HOSTNAME_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(`${label}: ${m[0]}`);
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
      // the real 2026-09-22 false positive: a schema name, not a machine
      '"schema": "csoai.local-json-canonicalize-result/0.1"',
      '"schema": "csoai.local-sha256-compare-result/0.1"',
    ]) {
      for (const [label, re] of HOSTNAME_PATTERNS) {
        expect(re.test(spared), `${label} must not match ${spared}`).toBe(false);
      }
    }
  });

  it("control: the mDNS pattern catches a machine name and ignores a dotted JSON path", () => {
    const mdns = HOSTNAME_PATTERNS.find(([label]) => label === "mDNS .local hostname")![1];
    expect("NICHOLASs-MacBook-Air-2.local").toMatch(mdns);
    expect('"probe_host": "build-box.local"').toMatch(mdns);
    expect("reached studio.local.").toMatch(mdns);
    expect('"path":"transport.local.tools"').not.toMatch(mdns);
    expect("csoai.local-json-canonicalize-result").not.toMatch(mdns);
  });

  it("no served JSON contains a machine hostname", { timeout: 120_000 }, () => {
    const bad = SERVED_JSON.map((f) => [relative(REPO, f), offenders(f)] as const).filter(([, h]) => h.length > 0);
    expect(bad.map(([f, h]) => `${f} -> ${h.join(", ")}`)).toEqual([]);
  });

  it("no functions/ handler source contains a machine hostname", { timeout: 120_000 }, () => {
    const bad = HANDLER_SOURCES.map((f) => [relative(REPO, f), offenders(f)] as const).filter(([, h]) => h.length > 0);
    expect(bad.map(([f, h]) => `${f} -> ${h.join(", ")}`)).toEqual([]);
  });

  it("evidence/mcp-registry.json's probe_host is an environment class, never a machine", () => {
    const registry = JSON.parse(readFileSync(join(REPO, "evidence", "mcp-registry.json"), "utf8"));
    expect(["github-actions", "ci-runner", "pod", "workstation"]).toContain(registry.probe_host);
  });
});
