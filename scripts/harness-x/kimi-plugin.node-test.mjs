#!/usr/bin/env node
/**
 * kimi-plugin.node-test.mjs — the Kimi flavour must obey Kimi's own rules, not our idea of them.
 *
 * WHY
 * ───
 * The estate renders ONE plugin into every platform's format (scripts/harness-x/render.mjs). Every
 * other flavour is checked by scripts/harness-x/check.mjs, which knows the estate's rules: the
 * declared outputs exist, the doctrine pin is carried, the version matches the served server.
 *
 * Kimi's rules are Kimi's, and they are not the estate's. Kimi Code CLI reads a plugin from
 * <root>/kimi.plugin.json (or <root>/.kimi-plugin/plugin.json); the Kimi desktop client validates
 * the same manifest against a field spec and a locale rule. A manifest that the estate is happy
 * with can still be invisible to Kimi: a skills path that does not resolve, an override set that
 * does not cover every skill, a locale file missing, a field Kimi does not know.
 *
 * Kimi's validator lives inside the Kimi application, so CI cannot run it. These are the SAME
 * rules, transcribed from Kimi's published spec and from the validator's own source, so the
 * estate holds the flavour without needing Kimi installed.
 *
 * The rules checked here (Kimi Code CLI plugin manifest + Kimi desktop manifest validation):
 *   1. NAME — Kimi CLI accepts [A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*(@[A-Za-z0-9_-]+)?; the desktop
 *      validator demands kebab-case. "gspc" satisfies both.
 *   2. VERSION — standard semver.
 *   3. SKILLS — the skills path is a "./" path inside the plugin root, it resolves, and every
 *      <name>/SKILL.md under it carries frontmatter with a name and a description. A skill without
 *      a description is never loaded, silently.
 *   4. OVERRIDES — interface.skillOverrides covers EVERY skill name and interface.mcpOverrides
 *      covers EVERY mcp server, each with a displayName and a description. Kimi's platform
 *      requires full coverage; a partial set is a warning today and a rejection tomorrow.
 *   5. MCP — every server has a url or a command. The url is the estate's ONE door, read from
 *      council-os/distribution.json — a second door in a second flavour would be two truths.
 *   6. INTERFACE — category present (without it the plugin can be invisible), hostKind is
 *      hosted|local, platforms are real, and no field outside Kimi's documented field spec.
 *   7. LOCALES — interface.locales is a "./" path that resolves; locales/ holds en-US.json and
 *      zh-CN.json together with defaultLocale; each file carries the localizable keys and holds
 *      no non-localizable key (the host ignores those).
 *   8. NO TODO — Kimi's validator rejects a manifest containing a TODO placeholder.
 *   9. DOCTRINE — the pinned doctrine sha256 is in the manifest, and it is the one the estate's
 *      source file hashes to.
 *
 * RUN
 * ───
 *   node --test scripts/harness-x/kimi-plugin.node-test.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PLUGIN_ROOT = join(ROOT, "distribution/plugin");
const MANIFEST = join(PLUGIN_ROOT, "kimi.plugin.json");
const dist = JSON.parse(readFileSync(join(ROOT, "council-os/distribution.json"), "utf8"));

// Kimi's own field spec for interface.* (validate_plugin.py SPEC_INTERFACE_FIELDS).
const SPEC_INTERFACE_FIELDS = new Set([
  "displayName", "shortDescription", "longDescription", "developerName", "websiteURL", "iconUrl",
  "category", "hostKind", "platforms", "defaultLocale", "locales", "tryPrompts", "brandColor",
  "mcpOverrides", "skillOverrides", "showcase",
]);
const VALID_PLATFORMS = new Set(["macos", "windows", "linux", "ios", "android", "harmonyos"]);
const VALID_HOST_KINDS = new Set(["hosted", "local"]);
// The keys Kimi treats as localisable in a locale file (everything else is ignored there).
const LOCALIZABLE_DOC_KEYS = new Set([
  "displayName", "shortDescription", "longDescription", "developerName", "tryPrompts",
  "mcpOverrides", "skillOverrides",
]);
const REQUIRED_LOCALE_STRINGS = ["displayName", "shortDescription", "longDescription", "developerName"];

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Every <name>/SKILL.md under a skills directory, with its frontmatter name + description. */
function readSkills(skillsDir) {
  const out = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const md = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(md)) continue;
    const head = readFileSync(md, "utf8").slice(0, 65536);
    const fm = /^---\s*\n([\s\S]*?)\n---/.exec(head);
    const body = fm ? fm[1] : "";
    const name = /^name:\s*(?:"([^"]+)"|'([^']+)'|(\S+))/m.exec(body);
    out.push({
      dir: entry.name,
      file: md,
      hasFrontmatter: Boolean(fm),
      name: name ? (name[1] ?? name[2] ?? name[3]) : null,
      hasDescription: /^description:\s*\S+/m.test(body),
    });
  }
  return out;
}

/** Resolve a "./"-prefixed path inside the plugin root, refusing anything that escapes it. */
function resolveInRoot(p) {
  assert.ok(typeof p === "string" && p.startsWith("./"), `path must start with ./: ${p}`);
  const dest = resolve(PLUGIN_ROOT, p.slice(2));
  assert.ok(dest === PLUGIN_ROOT || dest.startsWith(PLUGIN_ROOT + "/"), `path escapes the plugin root: ${p}`);
  return dest;
}

test("the Kimi plugin manifest is what Kimi can load", async (t) => {
  assert.ok(existsSync(MANIFEST), "distribution/plugin/kimi.plugin.json is missing — run scripts/harness-x/render.mjs");
  const m = readJson(MANIFEST);

  await t.test("name and version are the shapes Kimi accepts", () => {
    assert.match(m.name, /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*(@[A-Za-z0-9_-]+)?$/, "name is not a Kimi plugin id");
    assert.match(m.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, "name is not kebab-case (Kimi desktop requirement)");
    assert.match(m.version, /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/, "version is not semver");
    assert.equal(m.version, JSON.parse(readFileSync(join(ROOT, "mcp/gspc-server/server.json"), "utf8")).version,
      "the plugin version must be the served server version");
  });

  await t.test("every skill is loadable and every skill is covered by an override", () => {
    const skillsDir = resolveInRoot(m.skills);
    assert.ok(existsSync(skillsDir), `skills path does not exist: ${m.skills}`);
    const skills = readSkills(skillsDir);
    assert.ok(skills.length > 0, "no <name>/SKILL.md found under skills/");
    for (const s of skills) {
      assert.ok(s.hasFrontmatter, `${s.file} is missing frontmatter (--- name/description ---)`);
      assert.ok(s.name, `${s.file} frontmatter is missing name`);
      assert.ok(s.hasDescription, `${s.file} frontmatter is missing description`);
    }
    const overrides = m.interface?.skillOverrides;
    assert.ok(overrides && typeof overrides === "object", "interface.skillOverrides is missing");
    for (const s of skills) {
      const o = overrides[s.name];
      assert.ok(o, `interface.skillOverrides does not cover the skill "${s.name}"`);
      assert.ok(typeof o.displayName === "string" && o.displayName.trim(), `skillOverrides.${s.name} is missing displayName`);
      assert.ok(typeof o.description === "string" && o.description.trim(), `skillOverrides.${s.name} is missing description`);
    }
    for (const key of Object.keys(overrides)) {
      assert.ok(skills.some((s) => s.name === key), `interface.skillOverrides.${key} does not exist in skills/`);
    }
  });

  await t.test("the MCP entry is the estate's one door", () => {
    const servers = m.mcpServers;
    assert.ok(servers && typeof servers === "object", "mcpServers is missing or not an object");
    const overrides = m.interface?.mcpOverrides;
    assert.ok(overrides && typeof overrides === "object", "interface.mcpOverrides is missing");
    for (const [name, s] of Object.entries(servers)) {
      assert.ok(s && typeof s === "object", `mcpServers.${name} is not an object`);
      assert.ok(s.url || s.command, `mcpServers.${name} has neither url nor command`);
      assert.equal(s.url, dist.identity.door, `mcpServers.${name}.url is not the estate's one door`);
      const o = overrides[name];
      assert.ok(o, `interface.mcpOverrides does not cover the server "${name}"`);
      assert.ok(typeof o.displayName === "string" && o.displayName.trim(), `mcpOverrides.${name} is missing displayName`);
      assert.ok(typeof o.description === "string" && o.description.trim(), `mcpOverrides.${name} is missing description`);
    }
    for (const key of Object.keys(overrides)) {
      assert.ok(servers[key], `interface.mcpOverrides.${key} does not exist in mcpServers`);
    }
  });

  await t.test("interface carries only fields Kimi knows, and the ones it needs", () => {
    const itf = m.interface;
    assert.ok(itf && typeof itf === "object", "interface is missing");
    for (const f of Object.keys(itf)) {
      assert.ok(SPEC_INTERFACE_FIELDS.has(f), `interface.${f} is not in Kimi's field spec`);
    }
    assert.ok(itf.category, "interface.category is missing — the plugin can be invisible in the market");
    assert.ok(VALID_HOST_KINDS.has(itf.hostKind), `interface.hostKind is invalid: ${itf.hostKind}`);
    if (itf.platforms) {
      for (const p of itf.platforms) assert.ok(VALID_PLATFORMS.has(p), `interface.platforms has an invalid platform: ${p}`);
    }
    assert.ok(Array.isArray(itf.tryPrompts) && itf.tryPrompts.some((x) => typeof x === "string" && x.trim()),
      "interface.tryPrompts is missing or empty");
    assert.ok(typeof itf.displayName === "string" && itf.displayName.trim(), "interface.displayName is empty");
  });

  await t.test("locales cover zh-CN and en-US, with the localizable keys only", () => {
    const itf = m.interface;
    assert.ok(itf.defaultLocale, "interface.defaultLocale is missing");
    assert.ok(["zh-CN", "en-US"].includes(itf.defaultLocale), `interface.defaultLocale is not a platform locale: ${itf.defaultLocale}`);
    const localesDir = resolveInRoot(itf.locales);
    assert.ok(existsSync(localesDir), `interface.locales directory does not exist: ${itf.locales}`);
    const files = readdirSync(localesDir).filter((f) => f.endsWith(".json"));
    for (const want of ["en-US", "zh-CN"]) {
      assert.ok(files.includes(`${want}.json`), `locales/ is missing ${want}.json`);
    }
    for (const f of files) {
      const doc = readJson(join(localesDir, f));
      assert.ok(typeof doc === "object" && !Array.isArray(doc), `locales/${f} must be a JSON object`);
      for (const k of Object.keys(doc)) {
        assert.ok(LOCALIZABLE_DOC_KEYS.has(k), `locales/${f} contains a non-localizable key: ${k}`);
      }
      for (const k of REQUIRED_LOCALE_STRINGS) {
        assert.ok(typeof doc[k] === "string" && doc[k].trim(), `locales/${f} is missing ${k}`);
      }
      assert.ok(Array.isArray(doc.tryPrompts) && doc.tryPrompts.some((x) => typeof x === "string" && x.trim()),
        `locales/${f} is missing tryPrompts`);
    }
  });

  await t.test("no TODO placeholder, and the doctrine pin is the estate's", () => {
    assert.ok(!JSON.stringify(m).includes("TODO"), "the manifest contains a TODO placeholder");
    const doctrineSrc = join(ROOT, dist.doctrine.source);
    const sha = createHash("sha256").update(readFileSync(doctrineSrc, "utf8")).digest("hex");
    assert.equal(sha, dist.doctrine.sha256, "the pinned doctrine sha256 does not match the doctrine source");
    assert.ok(readFileSync(MANIFEST, "utf8").includes(sha), "the manifest does not carry the doctrine sha256");
  });
});
