// node --test scripts/harness-x/render.test.mjs
// Render twice → byte-identical; render --check is clean; the manifest covers every target output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RENDER = join(REPO, "scripts/harness-x/render.mjs");
const sha = (p) => createHash("sha256").update(readFileSync(join(REPO, p))).digest("hex");
const render = (...a) => spawnSync(process.execPath, [RENDER, ...a], { encoding: "utf8" });
const snapshot = () => {
  const m = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const paths = [...m.files.map((f) => f.path), "distribution/MANIFEST.json"];
  return Object.fromEntries(paths.map((p) => [p, sha(p)]));
};

test("committed distribution mirrors match the canonical producer before rendering", () => {
  const r = render("--check");
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("portable skill uses text metadata and preserves the declared tool boundary", () => {
  const skill = readFileSync(join(REPO, "distribution/plugin/skills/gspc-verify/SKILL.md"), "utf8");
  const header = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1];
  assert.ok(header, "missing portable skill frontmatter");
  const textField = (name) => {
    const encoded = new RegExp("^" + name + ": (.+)$", "m").exec(header)?.[1];
    assert.ok(encoded, name + " must be an inline YAML text field");
    const value = JSON.parse(encoded);
    assert.equal(typeof value, "string", name + " cannot be a mapping or list");
    return value;
  };
  const compatibility = textField("compatibility");
  assert.ok(compatibility.length > 0 && compatibility.length <= 500);
  assert.equal(textField("allowed-tools"),
    "Bash(python3 packages/evidence-fabric/portable_skill_verify.py:*) Read");
  assert.match(skill, /\*\*not\*\* an execution grant/);
  assert.match(skill, /caller-supplied label/);
  const manifest = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const row = manifest.files.find((item) => item.path === "distribution/plugin/skills/gspc-verify/SKILL.md");
  assert.equal(row.sha256, sha(row.path), "portable skill manifest must match committed bytes");
});

test("render twice is byte-identical", () => {
  assert.equal(render().status, 0);
  const a = snapshot();
  assert.equal(render().status, 0);
  const b = snapshot();
  assert.deepEqual(b, a);
  assert.ok(Object.keys(a).length > 40, `expected every artifact in the manifest, got ${Object.keys(a).length}`);
});

test("render --check is clean after render", () => {
  const r = render("--check");
  assert.equal(r.status, 0, r.stderr);
});

test("every declared target output is in the manifest", () => {
  const dist = JSON.parse(readFileSync(join(REPO, "council-os/distribution.json"), "utf8"));
  const m = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const inManifest = new Set(m.files.map((f) => f.path));
  for (const row of dist.distribution) for (const p of row.output) assert.ok(inManifest.has(p), `${row.id}: ${p}`);
});

// Tool identifiers may contain hyphens; Python class identifiers may not. Parse the
// emitted modules without importing dify_plugin or contacting the MCP endpoint.
test("Dify Python modules parse without running the integration", () => {
  const manifest = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const paths = manifest.files.map(row => row.path)
    .filter(path => path.startsWith("distribution/dify/gspc/") && path.endsWith(".py"));
  const free = JSON.parse(readFileSync(join(REPO, "functions/mcp/gspc-tools.json"), "utf8")).tools;
  assert.ok(paths.length >= free.length, "must inspect every generated tool module");
  const result = spawnSync("python3", ["-c",
    "import ast, pathlib, sys\nfor name in sys.argv[1:]: ast.parse(pathlib.Path(name).read_text(), filename=name)\nprint(len(sys.argv)-1)",
    ...paths.map(path => join(REPO, path))], { encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, String(result.error || "") + result.stdout + result.stderr);
  assert.equal(Number(result.stdout.trim()), paths.length);
});

test("Dify class names are unique identifiers while MCP names remain unchanged", () => {
  const tools = JSON.parse(readFileSync(join(REPO, "functions/mcp/gspc-tools.json"), "utf8")).tools;
  const classes = [];
  assert.ok(tools.some(tool => tool.name.includes("-")), "the regression needs a hyphenated tool");
  for (const tool of tools) {
    const text = readFileSync(join(REPO, "distribution/dify/gspc/tools", tool.name + ".py"), "utf8");
    const name = /^class ([A-Za-z_][A-Za-z0-9_]*)\(Tool\):$/m.exec(text)?.[1];
    assert.ok(name, "invalid Python class for " + tool.name);
    classes.push(name);
    assert.ok(text.includes('"params": {"name": ' + JSON.stringify(tool.name)),
      "Python identifier repair must not rename MCP tool " + tool.name);
  }
  assert.equal(new Set(classes).size, tools.length, "class-name normalization must not collide");
});

test("control: Python rejects the former hyphenated class declaration", () => {
  const parse = name => spawnSync("python3", ["-c", "import ast,sys; ast.parse(sys.argv[1])",
    `class ${name}(Tool): pass`], { encoding: "utf8", timeout: 10000 });
  const bad = parse("AxisAi-adoption-componentsTool");
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /SyntaxError/);
  const good = parse("AxisAiAdoptionComponentsTool");
  assert.equal(good.status, 0, good.stderr);
});
