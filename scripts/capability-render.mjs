#!/usr/bin/env node
/**
 * capability-render — the catalogues, rendered from council-os/capabilities.json.
 *
 * One declaration, N renders. Each target below is IDEMPOTENT and carries --check, which exits
 * non-zero when the committed artifact no longer equals what the registry renders. The checks
 * are wired into `npm run build:client` beside `mcp-probe --check`, so drift fails the build
 * rather than reaching production.
 *
 *   fleet-lock   functions/mcp/tool-fleet.lock.json        the 13 tools, BY NAME
 *   a2a          public/.well-known/agent-card.json        the A2A skills[]
 *                public/.well-known/agent.json             its alias, byte-identical
 *   nav          client/src/data/capability-nav.json       the site's capability navigation (data only)
 *   legacy       capabilities/registry.json                the 2026-09-04 registry, now a VIEW
 *
 * Two more renders live in their existing producers rather than here, because those producers
 * already own bytes this one must not fight over:
 *   openapi      scripts/build_openapi.py   — reads the registry and refuses to write a document
 *                that omits a declared door or contradicts a declared lifecycle
 *   llms         scripts/llms-txt.mjs       — renders {{PAID_DOORS}} and {{FREE_READS}} from the registry
 *
 * NOT RENDERED, DELIBERATELY: public/interop/a2a-directories.json carries an OpenTimestamps
 * proof (a2a-directories.json.ots) over its bytes. Signed and timestamped bytes are superseded,
 * never edited, so `capability-registry.mjs --check` VERIFIES its our_agent.skills recount
 * against the registry and fails on drift; the remedy is a dated superseding artifact.
 *
 *   node scripts/capability-render.mjs all [--check]
 *   node scripts/capability-render.mjs fleet-lock|a2a|nav|legacy [--check]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO, loadRegistry, routerSkillIds } from "./capability-registry.mjs";

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const target = args.find((a) => !a.startsWith("--")) ?? "all";
const reg = loadRegistry();
const caps = reg.capabilities;
const of = (kind) => caps.filter((c) => c.kind === kind);

const results = [];

/** Write, or compare. Every total printed is the length of an array computed right here. */
function emit(relPath, text) {
  const abs = join(REPO, relPath);
  if (CHECK) {
    if (!existsSync(abs)) {
      results.push({ ok: false, path: relPath, why: "missing — run the renderer" });
      return;
    }
    const cur = readFileSync(abs, "utf8");
    results.push(cur === text
      ? { ok: true, path: relPath }
      : { ok: false, path: relPath, why: `drifted from council-os/capabilities.json (${cur.length} B committed vs ${text.length} B rendered)` });
  } else {
    writeFileSync(abs, text);
    results.push({ ok: true, path: relPath, wrote: true });
  }
}

const j = (o) => JSON.stringify(o, null, 2) + "\n";

// ── fleet-lock ─────────────────────────────────────────────────────────────────────────────
function renderFleetLock() {
  const tools = of("mcp_tool").slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const free = tools.filter((t) => t.payment === "free").map((t) => t.id);
  const paid = tools.filter((t) => t.payment !== "free").map((t) => t.id);
  // The committed lock's own order is the door's manifest order, which the registry preserves.
  emit("functions/mcp/tool-fleet.lock.json", j({
    schema: "csoai.mcp-tool-fleet-lock/1",
    note:
      "K-1 fleet-size lock (2026-09-22). The ONE committed statement of which tools the /mcp door serves, by NAME. " +
      "RENDERED from council-os/capabilities.json by scripts/capability-render.mjs — not typed, and not a second registry. " +
      "functions/mcp/tool-fleet.lock.test.ts fails when these names differ from gspc-tools.json + paid-tools.json (what the handler serves), " +
      "from evidence/mcp-registry.json (what the last probe returned), from the well-known descriptors that state a count, or — with " +
      "FLEET_LOCK_LIVE=1 — from the live tools/list at https://councilof.ai/mcp. Change the fleet and this file must change in the same commit. " +
      "fleet_size below is the length of free + paid computed at render time, never typed. witness_hash is quarantined and is not in the fleet. " +
      "Measurement, never certification.",
    door: "https://councilof.ai/mcp",
    free,
    paid,
    fleet_size: free.length + paid.length,
  }));
}

// ── a2a ────────────────────────────────────────────────────────────────────────────────────
function renderA2A() {
  const cardPath = join(REPO, "public", ".well-known", "agent-card.json");
  const card = JSON.parse(readFileSync(cardPath, "utf8"));
  // Only skills[] is rendered. Everything else on the card is owned elsewhere and left alone.
  // The ROUTER's SKILL_IDS order is the card's order: functions/api/a2a.ts is the arbiter of the
  // set (capability-registry.mjs --check proves the two sets are equal) and of its order.
  const order = routerSkillIds() ?? [];
  const byId = new Map(of("a2a_skill").map((c) => [c.id, c]));
  card.skills = order
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      ...(c.tags ? { tags: c.tags } : {}),
      ...(c.examples ? { examples: c.examples } : {}),
      ...(c.inputModes ? { inputModes: c.inputModes } : {}),
      ...(c.outputModes ? { outputModes: c.outputModes } : {}),
    }));
  const text = JSON.stringify(card, null, 2) + "\n";
  emit("public/.well-known/agent-card.json", text);
  // The alias is the same document. It drifted from the card once; it cannot again.
  emit("public/.well-known/agent.json", text);
}

// ── nav ────────────────────────────────────────────────────────────────────────────────────
function renderNav() {
  // Reader-facing only: an UNDOCUMENTED capability is never navigated to, and a lifecycle that
  // states its own absence is shown as that state rather than hidden — a retired door a reader
  // has bookmarked should find out why, not get silence.
  const rows = caps
    .filter((c) => c.surfaces.includes("nav"))
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      description: c.description,
      audience: c.audience,
      lifecycle: c.lifecycle,
      payment: c.payment,
      ...(c.path ? { path: c.path, method: c.method } : {}),
      ...(c.free_preview ? { free_preview: c.free_preview } : {}),
    }));
  const groups = {};
  for (const r of rows) (groups[r.kind] ??= []).push(r.id);
  emit("client/src/data/capability-nav.json", j({
    schema: "csoai.capability-nav/1",
    generated_by: "scripts/capability-render.mjs nav (from council-os/capabilities.json)",
    note:
      "GENERATED — do not hand-edit. The site's capability navigation. Every group below is a list of ids; " +
      "any count a component shows is the length of one of these arrays at render time. A capability whose " +
      "handler carries no description is UNDOCUMENTED in the registry and is absent here rather than " +
      "navigated to with invented copy.",
    groups,
    capabilities: rows,
  }));
}

// ── legacy ─────────────────────────────────────────────────────────────────────────────────
function renderLegacy() {
  // capabilities/registry.json was seeded from the live doors on 2026-09-04 and then stood
  // still: 84 entries, 67 http paths, 12 MCP tools, 5 A2A skills, and a typed `counts` block.
  // The estate has moved past every one of those numbers. It is kept — scripts/capability-drift-guard.mjs
  // reads it — but it is now a VIEW of the one declaration, so there is no second registry to age.
  const protocolOf = (c) =>
    c.kind === "mcp_tool" ? ["mcp"] : c.kind === "a2a_skill" ? ["a2a"] : ["http"];
  emit("capabilities/registry.json", j({
    schema: "councilof.ai/capability-registry/1",
    note:
      "GENERATED VIEW of council-os/capabilities.json — do not hand-edit. Seeded from the live doors on " +
      "2026-09-04, this file was itself a second registry and aged: it recorded 67 http paths, 12 MCP tools " +
      "and 5 A2A skills, and carried a typed `counts` block. It is now rendered by " +
      "scripts/capability-render.mjs legacy so scripts/capability-drift-guard.mjs keeps working against one " +
      "source of truth. No count is stored here; derive by counting `capabilities`.",
    superseded_by: "council-os/capabilities.json",
    seeded_from_live_doors: "2026-09-04",
    generated_by: "scripts/capability-render.mjs legacy",
    capabilities: caps.map((c) => ({
      id: c.id,
      protocols: protocolOf(c),
      title: c.name,
      description: c.description,
      endpoint: c.path ?? null,
      method: c.method ?? (c.kind === "mcp_tool" || c.kind === "a2a_skill" ? "POST" : null),
      lifecycle: c.lifecycle,
      audience: c.audience,
      payment: c.payment,
    })),
  }));
}

const TARGETS = { "fleet-lock": renderFleetLock, a2a: renderA2A, nav: renderNav, legacy: renderLegacy };

if (target === "all") for (const fn of Object.values(TARGETS)) fn();
else if (TARGETS[target]) TARGETS[target]();
else {
  console.error(`unknown target "${target}" — one of: all ${Object.keys(TARGETS).join(" ")}`);
  process.exit(2);
}

const bad = results.filter((r) => !r.ok);
for (const r of results) {
  if (r.ok) console.log(`${CHECK ? "ok " : "wrote"} ${r.path}`);
  else console.error(`DRIFT ${r.path} — ${r.why}`);
}
if (bad.length) {
  console.error(`\n  fix: node scripts/capability-render.mjs ${target} && git add ${bad.map((b) => b.path).join(" ")}`);
  process.exit(1);
}
console.log(`capability-render ${target}: ${results.length} artifact(s) ${CHECK ? "match" : "written from"} council-os/capabilities.json`);
