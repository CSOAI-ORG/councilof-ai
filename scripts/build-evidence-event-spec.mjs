#!/usr/bin/env node
/** Publish the existing evidence-event contract without changing its bytes or identifiers. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = "packages/evidence-fabric/schema/evidence-event-0.1.schema.json";
export const DESTINATION = "public/spec/evidence-event/v0.1";
const SITE = "https://councilof.ai/spec/evidence-event/v0.1";
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function derive(root = ROOT) {
  const source = path.join(root, SOURCE);
  if (fs.lstatSync(source).isSymbolicLink() || !fs.statSync(source).isFile()) throw new Error("Schema source must be a regular file");
  const bytes = fs.readFileSync(source);
  const schema = JSON.parse(bytes.toString("utf8"));
  if (schema.$id !== `${SITE}/schema.json` || schema.title !== "csoai.evidence-event/0.1") throw new Error("Unexpected evidence-event schema identity");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const states = schema.properties.state.enum.map((state) => `<li><code>${escape(state)}</code></li>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Evidence event v0.1 | Council of AI</title>
  <meta name="description" content="Read the Council of AI evidence-event v0.1 schema, its source and validator. Preserve declared and observed records, evidence states and limits in each event.">
  <link rel="canonical" href="${SITE}/">
  <style>
    :root { color-scheme: light dark; font: 17px/1.6 system-ui, sans-serif; }
    body { max-width: 52rem; margin: 0 auto; padding: 2rem 1.2rem 4rem; }
    header { border-bottom: 1px solid #718c82; padding-bottom: 1rem; }
    a { color: #087963; text-underline-offset: .18em; }
    h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.15; margin: 2rem 0 1rem; }
    h2 { margin-top: 2rem; font-size: 1.3rem; }
    code { overflow-wrap: anywhere; font-size: .9em; }
    .record { border-left: 3px solid #087963; padding-left: 1rem; }
    @media (prefers-color-scheme: dark) { a { color: #70dac1; } }
  </style>
</head>
<body>
  <header><a href="/">Council of AI</a> / Technical documentation</header>
  <main>
    <h1>Evidence event v0.1</h1>
    <p><code>csoai.evidence-event/0.1</code> records an observation derived from an existing record: what was declared, what was observed, the resulting evidence state and the limits of the read.</p>
    <p><a href="${SITE}/schema.json">Download the JSON Schema</a> · <a href="https://github.com/CSOAI-ORG/councilof-ai/tree/master/packages/evidence-fabric">Read the source and usage guide</a></p>
    <h2>Contract and validation</h2>
    <p>The schema describes the event fields. Use the <a href="https://github.com/CSOAI-ORG/councilof-ai/blob/master/packages/evidence-fabric/event.py">existing event validator</a> for additional rules, including event-ID recomputation and negative-control agreement. Schema validation alone does not perform those checks.</p>
    <div class="record">
      <p>Schema identifier: <code>${SITE}/schema.json</code><br>Predicate and information identifier: <code>${SITE}</code></p>
      <p>Source: <code>${SOURCE}</code><br>Source SHA-256: <code>${digest}</code></p>
    </div>
    <h2>Evidence states</h2>
    <ul>${states}</ul>
    <p>Keep the state, declared and observed records, method, negative control and limits together. The renderers change the carrier format; they do not create a new measurement.</p>
    <h2>Scope and reuse</h2>
    <p>The schema and field mappings are CC0-1.0; the implementation is Apache-2.0. This page publishes the existing contract and an exact copy of its source schema. It does not establish the truth of a claim, operational authority, customer acceptance or deployment in an external system.</p>
    <p><a href="/connect/">Connect to published evidence</a> · <a href="/gspc-verify/">Verify a supported record</a></p>
  </main>
</body>
</html>
`;
  return new Map([[`${DESTINATION}/schema.json`, bytes], [`${DESTINATION}/index.html`, Buffer.from(html)]]);
}

export function render(root = ROOT, check = false) {
  for (const [relative, bytes] of derive(root)) {
    const output = path.join(root, relative);
    if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error(`Refuse symlink: ${relative}`);
    if (check) {
      if (!fs.existsSync(output) || !fs.readFileSync(output).equals(bytes)) throw new Error(`Evidence-event publication drift: ${relative}`);
    } else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, bytes);
    }
  }
  return { state: check ? "SOURCE_PARITY_VERIFIED" : "GENERATED", files: 2, network_requests: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(render(ROOT, process.argv.includes("--check")))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
