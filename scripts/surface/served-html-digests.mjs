#!/usr/bin/env node
/**
 * served-html-digests.mjs — the bytes the site SERVES for each HTML file in a tree.
 *
 * WHY THIS EXISTS. The build injects a workspace-launcher script into the site's HTML
 * (scripts/inject-workspace-launcher.mjs), so the SERVED bytes of an HTML file are not always
 * the tree's bytes: usually they are the tree's bytes plus that script — exactly +63 bytes.
 *
 * And "usually" is the whole difficulty. The injector has TWO rules, and a helper that uses
 * only one of them is wrong on exactly the files the other rule protects:
 *
 *   1. injectLauncher()  — add the launcher tag to a page.
 *   2. isImmutableCapture() — REFUSE to touch a frozen interop mirror capture
 *      (any interop/.../mirrors/....html). Its whole value is that its bytes still match its
 *      preserved public/ source exactly; "adding site chrome changes evidence".
 *
 * MEASURED 2026-11-07 on the 53 HTML files under public/interop, against the real built tree
 * and against what councilof.ai actually serves: asking for the transform alone produced a
 * digest 63 bytes away from the served bytes on 29 of the 53 rows — every one of them a mirror
 * capture. The other 24 matched exactly. There were no exceptions in either direction, so the
 * exemption accounts for all of it. Live control, same files, same moment:
 *
 *   /interop/rwa-reconciliation-2026-09/mirrors/franklintempleton-benji-platform.html
 *     served 66036 B == the tree's bytes == the built bytes  (no launcher: a frozen capture)
 *   /interop/art5-emotion-ai-2026-09/index.html
 *     served  2451 B == the built bytes != the tree's 2388 B  (launcher: a site page)
 *
 * So the fix is NOT to re-implement the injection here. The injector EXPORTS both rules, so
 * this helper asks THE INJECTOR ITSELF what it would write, and asks it with the same two
 * rules the build uses. One rule, one place: the estate's own principle that the claim lives
 * in two places — the artefact and the generator that emits it.
 *
 * USAGE
 *   node scripts/surface/served-html-digests.mjs <tree-root> <out.json>
 *   node scripts/surface/served-html-digests.mjs <tree-root> <out.json> --served-root <dir>
 *   node scripts/surface/served-html-digests.mjs --selftest
 *
 * The second form reads the BUILT copies where they exist (ground truth) and asks the
 * injector only for the ones the build did not carry. The first form asks the injector for
 * every HTML file, which is what a CI job without a build needs — and after the exemption is
 * honoured, the two forms agree, which is the property the scheduled re-measurement rests on.
 *
 * The output keys are TREE-relative (as the caller asked for them); the paths used to reach
 * the build and the injector's exemption are PUBLIC-relative, because that is the form the
 * injector walks and the form its rule is written against.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync } from "node:fs";
import { resolve, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { injectLauncher, isImmutableCapture } from "../inject-workspace-launcher.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const PUBLIC_ROOT = join(ROOT, "public");

const args = process.argv.slice(2);

if (args.includes("--selftest")) {
  // The rule, pinned where it was wrong. A mirror capture keeps its source bytes; a site page
  // gets the launcher. If this fails, the helper would publish digests the site does not serve.
  const dir = mkdtempSync(join(tmpdir(), "served-html-digests-"));
  const tree = join(dir, "interop");
  const page = "round-2026-09/mirrors/capture.html";
  const site = "round-2026-09/index.html";
  mkdirSync(join(tree, "round-2026-09/mirrors"), { recursive: true });
  const pageSource = "<html><body>capture</body></html>\n";
  const siteSource = "<html><body>page</body></html>\n";
  writeFileSync(join(tree, page), pageSource);
  writeFileSync(join(tree, site), siteSource);
  const out = join(dir, "out.json");
  const res = await import("node:child_process");
  res.execFileSync(process.execPath, [join(import.meta.dirname, "served-html-digests.mjs"), tree, out]);
  const digests = JSON.parse(readFileSync(out, "utf8"));
  const sha = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
  const checks = [
    ["a frozen mirror capture keeps its source bytes", digests[page]?.sha256 === sha(pageSource)],
    ["a site page gets the launcher", digests[site]?.sha256 === sha(injectLauncher(siteSource))],
    ["the two are not the same digest", digests[page]?.sha256 !== digests[site]?.sha256],
  ];
  let ok = true;
  for (const [what, pass] of checks) {
    console.error(`${pass ? "ok  " : "FAIL"}  ${what}`);
    if (!pass) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

const tree = args[0] && !args[0].startsWith("--") ? args[0] : null;
const out = args[1] && !args[1].startsWith("--") ? args[1] : null;
if (!tree || !out) {
  console.error("usage: served-html-digests.mjs <tree-root> <out.json> [--served-root <dir>]");
  process.exit(2);
}
const servedRootIdx = args.indexOf("--served-root");
const servedRoot = servedRootIdx >= 0 ? args[servedRootIdx + 1] : null;

function htmlFiles(dir) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".html")) found.push(p);
    }
  };
  walk(resolve(tree));
  return found;
}

// The path the INJECTOR sees: public-relative, because that is the form its exemption rule is
// written against ("interop/.../mirrors/*.html") and the form the built tree is walked in.
// A tree that is not under public/ (the selftest's synthetic one) keeps the interop/ prefix.
function publicPath(rel) {
  const pub = relative(PUBLIC_ROOT, join(resolve(tree), rel)).split(sep).join("/");
  return pub && !pub.startsWith("..") ? pub : `interop/${rel}`;
}

const digests = {};
let fromBuilt = 0;
let fromInjector = 0;
let exempt = 0;
for (const file of htmlFiles(tree)) {
  const rel = relative(resolve(tree), file).split(sep).join("/");
  const pub = publicPath(rel);
  let bytes = null;
  if (servedRoot) {
    const built = resolve(servedRoot, pub);
    if (existsSync(built) && statSync(built).isFile()) {
      bytes = readFileSync(built);
      fromBuilt += 1;
    }
  }
  if (bytes === null) {
    // What the injector WOULD write. The injector's own two rules, imported — not re-implemented.
    const source = readFileSync(file, "utf8");
    if (isImmutableCapture(pub)) {
      // Rule 2: a frozen capture is not a page. The build leaves it alone, so its served bytes
      // are its source bytes — and asking for the transform here would publish a digest the
      // site does not serve.
      bytes = Buffer.from(source, "utf8");
      exempt += 1;
    } else {
      bytes = Buffer.from(injectLauncher(source), "utf8");
    }
    fromInjector += 1;
  }
  digests[rel] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
writeFileSync(out, JSON.stringify(digests, null, 1) + "\n");
console.error(
  `served-html-digests: ${Object.keys(digests).length} HTML file(s) — ${fromBuilt} from the built tree, ` +
  `${fromInjector} from the injector's own rules (${exempt} frozen capture(s) left as their source bytes)`,
);
