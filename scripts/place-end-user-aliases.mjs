#!/usr/bin/env node
/**
 * place-end-user-aliases.mjs
 * OS guesses (chat, ag-ui, sov-os) copy HOME so they never keep a second-console prerender.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && SELF === process.argv[1];

export const PERSONAS = ["sec-filer", "finance", "healthcare", "regulator", "startup", "enterprise"];
export const VENDORS = ["vanta", "drata", "credo-ai", "credo", "onetrust"];
export const INDUSTRIES = [
  "insurance", "government", "care", "defence", "critical-infrastructure", "media",
  "agent-rails", "open-source", "multi-agent-commerce", "security", "machinery",
  "humanoid", "xr", "legal", "emotion-ai",
  "health", "healthcare", "finance", "transport", "transportation", "retail",
  "education", "energy", "cybersecurity", "home", "logistics", "manufacturing",
  "mining", "telecoms",
];

export const STRANGER_DIRS = [
  "os", "gspc", "gspc-scoreboard", "scoreboard", "gspc-verify", "verify",
  "gspc-arena", "assess", "watchdog", "watchdog-map", "academy", "console", "council-os",
  "lobby", "compare", "vs", "layer0", "trust-center", "network", "distribution",
  "intel", "hive", "methodology", "honesty", "insurers", "regulators",
  "industries", "enterprise", "library", "library/axes", "library/measurement",
  "privacy-policy", "disclaimers", "legal", "system-card",
  "pricing", "start",
  "dashboard", "login", "about", "firewall-charter", "csoai-law",
  "models", "tools",
  "benchmarks", "benchmark-index", "benchmark-quality",
  "chat", "ag-ui", "agui", "rankings", "sov-os",
  "workbench", "instrument", "system-card", "feed", "mcp-fleet", "crosswalk",
  "east-west", "challenge",
  "refutation-ledger", "mcps", "claimguard", "ras",
];

export const LIBRARY_SECTORS = [
  "regulation", "regions", "academy", "tech", "axes", "governance", "product", "company",
];

function run(distArg = process.argv[2] || "dist/client") {
const DIST = distArg.startsWith("/") ? distArg : join(ROOT, distArg);

if (!existsSync(DIST)) {
  console.error(`[aliases] no ${DIST} — run the client build + prerender first`);
  process.exit(1);
}

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
  if (src === dest) return false;
  if (existsSync(dest) && !overwrite) return false;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  return true;
}

function pretty(path, src, overwrite = true) {
  let n = 0;
  if (place(`${path}.html`, src, { overwrite })) n += 1;
  if (place(`${path}/index.html`, src, { overwrite })) n += 1;
  return n;
}

const home = pick("index.html");
const board = pick("gspc-scoreboard/index.html", "index.html");
const verify = pick("gspc-verify/index.html", "index.html");
const compare = pick("compare/index.html", "index.html");
const disclaimers = pick("disclaimers/index.html", "index.html");
const industriesHub = pick("industries/index.html", "index.html");
const library = pick("library/index.html", "index.html");
const os = pick("os/index.html", "index.html");

if (!home || !board) {
  console.error("[aliases] dist is missing index.html — nothing to place");
  process.exit(1);
}

let n = 0;
n += pretty("gspc", board);
n += pretty("gspc-scoreboard", board);
n += pretty("scoreboard", board);
n += pretty("scorecard", board);
n += pretty("gspc-verify", verify);
n += pretty("verify", verify);
n += pretty("console", home);
n += pretty("council-os", home);
n += pretty("lobby", home);
n += pretty("ag-ui", home);
n += pretty("agui", home);
n += pretty("chat", home);
n += pretty("rankings", home);
n += pretty("sov-os", home);
n += pretty("legal", disclaimers);
n += pretty("os", os);
n += pretty("vs", compare);

const fromDir = (dir, fallback) => pick(`${dir}/index.html`, fallback);

for (const dir of STRANGER_DIRS) {
  const src = fromDir(dir, home);
  if (src) n += pretty(dir, src, false);
}

for (const slug of VENDORS) n += pretty(`vs/${slug}`, compare);
// Never overwrite a prerendered /for/:persona page with HOME. That was why
// live /for/startup hydrated correctly but the static HTML was the homepage.
for (const p of PERSONAS) {
  const src = fromDir(`for/${p}`, home);
  n += pretty(`for/${p}`, src, false);
}
for (const s of INDUSTRIES) n += pretty(`industries/${s}`, industriesHub);
n += pretty("library/axes", library);
n += pretty("library/measurement", library);
for (const s of LIBRARY_SECTORS) {
  const src = fromDir(`library/${s}`, library);
  if (src) n += pretty(`library/${s}`, src);
}

const scittSrc = join(ROOT, "public/.well-known/scitt.json");
const scittDest = join(DIST, ".well-known/scitt.json");
if (existsSync(scittSrc)) {
  mkdirSync(join(DIST, ".well-known"), { recursive: true });
  cpSync(scittSrc, scittDest);
  console.log("[aliases] placed .well-known/scitt.json");
}

try {
  for (const f of readdirSync(DIST)) {
    if (f === "gspc-scoreboard.html" && board) {
      const st = statSync(join(DIST, f));
      if (st.size < 20000) {
        rmSync(join(DIST, f));
        place("gspc-scoreboard.html", board, { overwrite: true });
        console.log("[aliases] replaced thin gspc-scoreboard.html with living board");
      }
    }
  }
} catch { /* dist listing is best-effort */ }

console.log(`[aliases] placed ${n} end-user alias pages under ${DIST}`);
}

if (isMain) run();

export { run };
