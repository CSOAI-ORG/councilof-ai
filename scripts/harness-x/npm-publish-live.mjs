#!/usr/bin/env node
/**
 * npm-publish-live — record what the PUBLISHED npm tarball actually carries, and how it
 * differs from the live door.
 *
 *   node scripts/harness-x/npm-publish-live.mjs            write distribution/npm/npm-publish-check.json
 *   node scripts/harness-x/npm-publish-live.mjs --print    print the record, write nothing
 *
 * WHY. The guide (llms-install.md) tells a reader which release is on npm and whether that
 * release carries the same tool names as the live door. Those are facts about the WORLD, not
 * about this repository, so they cannot be typed into the guide or into a test: the moment npm
 * publishes or the door gains a tool, a typed number is a false number.
 *
 * So the facts live in ONE dated record — distribution/npm/npm-publish-check.json — and the
 * guide and its test both read that record. A capture is never edited: when npm or the door
 * moves, a NEW capture is written and the guide is corrected against it.
 *
 * WHAT IT MEASURES.
 *   - the published release: the registry's `latest` dist-tag, the npm publish timestamp, and
 *     the tool names inside the published tarball's OWN manifests (gspc-tools.json,
 *     paid-tools.json) — the tarball, not this repository's copy of them;
 *   - the live door: the names the door returns from tools/list at https://councilof.ai/mcp;
 *   - the difference, name by name, in BOTH directions.
 *
 * WHAT IT DOES NOT MEASURE, and says so in the record.
 *   - whether the published tarball RUNS. It extracts the manifests; it does not install the
 *     package, call its tools, or prove anything about its behaviour.
 *   - the free/metered split of the live door is inferred by name set membership, not by
 *     asking the door to classify them.
 *
 * FAIL CLOSED. An unreachable registry, an unreadable tarball, or a door that will not answer
 * is an error, not an empty record. A record with an empty diff because nothing could be read
 * is the one thing this script must never write.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PACKAGE = "csoai-gspc-mcp";
const REGISTRY = `https://registry.npmjs.org/${PACKAGE}`;
const DOOR = "https://councilof.ai/mcp";
const OUT = join(REPO, "distribution/npm/npm-publish-check.json");
const PRINT_ONLY = process.argv.includes("--print");

const headers = {
  "user-agent": "csoai-npm-publish-live/1 (+https://councilof.ai)",
  accept: "application/json",
};

async function getJson(url) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status} ${r.statusText}`);
  return r.json();
}

/** The tarball member list: the package's OWN manifests, not this repository's copy. */
function member(tarball, memberPath) {
  const r = spawnSync("tar", ["-xzO", "-f", tarball, memberPath], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`tar could not read ${memberPath} from the published tarball: ${String(r.stderr || "").trim()}`);
  }
  return JSON.parse(r.stdout.toString("utf8"));
}

async function doorNames() {
  const r = await fetch(DOOR, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "user-agent": "csoai-npm-publish-live/1 (+https://councilof.ai)",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`POST ${DOOR} -> ${r.status} ${r.statusText}`);
  const text = (await r.text()).trim();
  const body = text.startsWith("{")
    ? text
    : text.split("\n").filter((l) => l.trim().startsWith("data:")).pop()?.slice(5).trim();
  const msg = JSON.parse(body);
  if (msg.error) throw new Error(`the door refused tools/list: ${JSON.stringify(msg.error)}`);
  const tools = msg.result?.tools;
  if (!Array.isArray(tools) || tools.length === 0) throw new Error("the door returned no tools");
  return tools.map((t) => t.name);
}

const registry = await getJson(REGISTRY);
const latest = registry["dist-tags"]?.latest;
if (!latest) throw new Error("the registry document carries no `latest` dist-tag");
const publishedAt = registry.time?.[latest];
if (!publishedAt) throw new Error(`the registry carries no publish time for ${latest}`);
const tarballUrl = registry.versions?.[latest]?.dist?.tarball;
if (!tarballUrl) throw new Error(`the registry carries no tarball URL for ${latest}`);

const dir = mkdtempSync(join(tmpdir(), "npm-publish-live-"));
try {
  const tarball = join(dir, `${PACKAGE}-${latest}.tgz`);
  const r = await fetch(tarballUrl, { headers, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`GET ${tarballUrl} -> ${r.status} ${r.statusText}`);
  const bytes = Buffer.from(await r.arrayBuffer());
  writeFileSync(tarball, bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  const free = member(tarball, "package/gspc-tools.json");
  const metered = member(tarball, "package/paid-tools.json");
  const freeNames = (free.tools ?? []).map((t) => t.name);
  const meteredNames = (metered.tools ?? []).map((t) => t.name);
  if (freeNames.length === 0) throw new Error("the published tarball's gspc-tools.json carries no tools");

  const live = await doorNames();
  const publishedNames = new Set([...freeNames, ...meteredNames]);
  const liveSet = new Set(live);
  const liveOnly = live.filter((n) => !publishedNames.has(n)).sort();
  const publishedOnly = [...publishedNames].filter((n) => !liveSet.has(n)).sort();

  const record = {
    schema: "csoai.npm-publish-check/1",
    generated_by: "scripts/harness-x/npm-publish-live.mjs",
    checked_at: new Date().toISOString(),
    package: PACKAGE,
    registry: REGISTRY,
    published: {
      version: latest,
      published_at: publishedAt,
      tarball: tarballUrl,
      tarball_sha256: sha256,
      free_tools: freeNames.length,
      metered_tools: meteredNames.length,
      total_tools: freeNames.length + meteredNames.length,
    },
    live_door: {
      url: DOOR,
      total_tools: live.length,
      free_tools: live.length - meteredNames.filter((n) => liveSet.has(n)).length,
      metered_tools: meteredNames.filter((n) => liveSet.has(n)).length,
    },
    diff: {
      live_only: liveOnly,
      published_only: publishedOnly,
    },
    limits: [
      "The published release's manifests were extracted and compared by NAME. Nothing here says the published tarball runs, installs, or behaves as the live door does.",
      "The live door's free/metered split is inferred by name-set membership against the published tarball's paid-tools.json, not by asking the door to classify its own tools.",
      "This record is dated and is never edited: when npm publishes or the door moves, a new record is written.",
    ],
  };

  const text = JSON.stringify(record, null, 2) + "\n";
  if (PRINT_ONLY) {
    process.stdout.write(text);
  } else {
    writeFileSync(OUT, text);
    process.stdout.write(
      `wrote ${OUT}\n  published ${latest}: ${record.published.total_tools} names (${record.published.free_tools} free + ${record.published.metered_tools} metered)\n` +
      `  live door: ${record.live_door.total_tools} names\n` +
      `  live only: ${liveOnly.length ? liveOnly.join(", ") : "(none)"}\n` +
      `  published only: ${publishedOnly.length ? publishedOnly.join(", ") : "(none)"}\n`,
    );
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
