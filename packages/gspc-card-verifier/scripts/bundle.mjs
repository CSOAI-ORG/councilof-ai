#!/usr/bin/env node
/**
 * bundle.mjs — emit ONE self-contained file, so the quickstart needs nothing but curl.
 *
 * A person evaluating our claims should not have to install a package manager, trust a
 * registry, or clone a repository to check a signature. One file, one runtime, no network.
 *
 * The transform is deliberately dumb and deliberately LOUD: every substitution asserts that
 * its pattern was found. A bundler that silently drops a rule would produce a verifier that
 * disagrees with the source it was built from — and there is a test that runs every fixture
 * through the bundle and the source and requires identical results.
 *
 *     node scripts/bundle.mjs [outfile]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

function must(text, pattern, replacement, what) {
  if (!pattern.test(text)) throw new Error(`bundle.mjs: pattern for "${what}" no longer matches — refusing to emit a bundle that may differ from source`);
  return text.replace(pattern, replacement);
}

const stripExports = (s) => s.replace(/^export (?=(class|function|const|async function))/gm, "");
const dropImportLine = (s, from) =>
  must(s, new RegExp(`^import \\{[^}]*\\} from "${from}";\\n`, "m"), "", `import of ${from}`);

const pkg = JSON.parse(read("package.json"));
const profile = read("profile/csoai-gspc-1.json");

let canonical = stripExports(read("src/canonical.mjs"));
let verify = dropImportLine(stripExports(read("src/verify.mjs")), "\\./canonical\\.mjs");
let did = stripExports(read("src/did.mjs"));

let cli = read("bin/gspc-verify.mjs");
cli = must(cli, /^#!\/usr\/bin\/env node\n/, "", "shebang");
cli = dropImportLine(cli, "\\.\\./src/verify\\.mjs");
cli = dropImportLine(cli, "\\.\\./src/did\\.mjs");
cli = dropImportLine(cli, "\\.\\./src/index\\.mjs");
cli = must(cli, /^import \{ readFileSync, readdirSync, statSync \} from "node:fs";$/m,
  'import { readFileSync, readdirSync, statSync } from "node:fs";', "node:fs import (kept)");

const out = `#!/usr/bin/env node
/* gspc-card-verifier ${pkg.version} — single-file build. Apache-2.0. Copyright 2024-2026 CSOAI Ltd.
 *
 * GENERATED from src/. Do not edit: edit the source and run \`npm run bundle\`. The source,
 * the JSON Schemas and the failing-case tests live in the full package; this file is the
 * whole verifier so that checking a card needs no install and no network.
 *
 * Reads only local files. Never opens a socket. Exit codes:
 *   0 all VALID and complete · 1 any INVALID · 2 any UNCHECKABLE or usage error
 *   3 all cards valid but the set incomplete
 */
${canonical}
${verify}
${did}

/** The bundled verification profile. Override with --profile / --pubkey / --did-document. */
const BUNDLED_PROFILE = ${profile.trim()};
function defaultProfile() { return JSON.parse(JSON.stringify(BUNDLED_PROFILE)); }
${cli}`;

const target = process.argv[2] || join(root, "dist-bundle", "gspc-verify.mjs");
const { mkdirSync } = await import("node:fs");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out);
process.stdout.write(`wrote ${target} (${out.length} bytes)\n`);
