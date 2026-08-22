#!/usr/bin/env node
/**
 * place-end-user-aliases.mjs
 *
 * Cloudflare Pages + the honest `/* → /404.html 404` catch-all means a cold
 * load 404s unless a real file exists at that path. Dynamic routes
 * (`/for/:persona`, `/industries/:slug`, `/vs/:vendor`) and short aliases
 * (`/gspc`, `/console`) are never discovered by prerender, so every
 * demographic landing on the homepage currently 404s for a stranger.
 *
 * After prerender:
 *   1. Delete leftover public/*.html that steal pretty URLs (gspc-scoreboard.html
 *      is served at /gspc-scoreboard and hides the living React board).
 *   2. Place index.html (and, where CF pretty-URLs need it, foo.html) so
 *      /gspc, /console, /for/regulator, /industries/insurance, /vs/vanta
 *      return 200. The SPA then hydrates to the real route.
 *   3. Copy public/.well-known/scitt.json into dist so RFC 9943 presence
 *      cannot vanish from a partial upload.
 *
 *   node scripts/place-end-user-aliases.mjs [dist/client]
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, process.argv[2] || "dist/client");

if (!existsSync(DIST)) {
  console.error(`[aliases] no ${DIST} — run the client build + prerender first`);
  process.exit(1);
}

const PERSONAS = ["sec-filer", "finance", "healthcare", "regulator", "startup", "enterprise"];
const VENDORS = ["vanta", "drata", "credo-ai", "credo", "onetrust"];
const INDUSTRIES = [
  // canonical 15 from client/src/data/industries.ts
  "insurance", "government", "care", "defence", "critical-infrastructure", "media",
  "agent-rails", "open-source", "multi-agent-commerce", "security", "machinery",
  "humanoid", "xr", "legal", "emotion-ai",
  // homepage + legacy content slugs (IndustryTemplate falls back)
  "health", "healthcare", "finance", "transport", "transportation", "retail",
  "education", "energy", "cybersecurity", "home", "logistics", "manufacturing",
  "mining", "telecoms",
];

function pick(...rels) {
  for (const rel of rels) {
    const p = join(DIST, rel);
    if (existsSync(p)) return rel;
  }
  return null;
}

function place(destRel, srcRel, { overwrite = false } = {}) {
  const src = join(DIST, srcRel);
  const dest = join(DIST, destRel);
  if (!existsSync(src)) {
    console.warn(`[aliases] skip ${destRel} — missing ${srcRel}`);
    return false;
  }
  if (existsSync(dest) && !overwrite) return false;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  return true;
}

for (const f of ["gspc-scoreboard.html"]) {
  const p = join(DIST, f);
  if (existsSync(p)) {
    rmSync(p);
    console.log(`[aliases] removed ${f} (was stealing the living board)`);
  }
}

const home = pick("index.html");
const board = pick("gspc-scoreboard/index.html", "index.html");
const compare = pick("compare/index.html", "index.html");
const disclaimers = pick("disclaimers/index.html", "index.html");
const industriesHub = pick("industries/index.html", "index.html");
const library = pick("library/index.html", "index.html");

if (!home || !board) {
  console.error("[aliases] dist is missing index.html — nothing to place");
  process.exit(1);
}

// CF Pages serves foo.html at /foo (no slash). Directory foo/index.html is /foo/.
// Always overwrite the .html pretty-URL so a leftover static table cannot return.
const forced = [
  ["gspc.html", board],
  ["gspc/index.html", board],
  ["scoreboard.html", board],
  ["scoreboard/index.html", board],
  ["console.html", home],
  ["console/index.html", home],
  ["council-os.html", home],
  ["council-os/index.html", home],
  ["lobby.html", home],
  ["lobby/index.html", home],
  ["legal.html", disclaimers],
  ["legal/index.html", disclaimers],
  ["vs.html", compare],
  ["vs/index.html", compare],
];

let n = 0;
for (const [dest, src] of forced) {
  if (place(dest, src, { overwrite: true })) n += 1;
}

for (const slug of VENDORS) {
  if (place(`vs/${slug}/index.html`, compare)) n += 1;
}
for (const p of PERSONAS) {
  if (place(`for/${p}/index.html`, home)) n += 1;
}
for (const s of INDUSTRIES) {
  if (place(`industries/${s}/index.html`, industriesHub)) n += 1;
}
if (place("library/axes/index.html", library)) n += 1;
if (place("library/measurement/index.html", library)) n += 1;

const scittSrc = join(ROOT, "public/.well-known/scitt.json");
const scittDest = join(DIST, ".well-known/scitt.json");
if (existsSync(scittSrc)) {
  mkdirSync(join(DIST, ".well-known"), { recursive: true });
  cpSync(scittSrc, scittDest);
  console.log("[aliases] placed .well-known/scitt.json");
} else {
  console.warn("[aliases] public/.well-known/scitt.json missing");
}

console.log(`[aliases] placed ${n} end-user alias pages under ${DIST}`);
