#!/usr/bin/env node
/**
 * place-end-user-aliases.mjs
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
  "gspc-arena", "assess", "watchdog", "academy", "console", "council-os",
  "lobby", "compare", "vs", "layer0", "trust-center", "network", "distribution",
  "intel", "hive", "methodology", "honesty", "insurers", "regulators",
  "industries", "enterprise", "library", "library/axes", "library/measurement",
  "privacy-policy", "disclaimers", "legal", "system-card",
  "pricing", "start",
  "dashboard", "login", "about", "firewall-charter", "csoai-law",
  "models", "tools", "sov-os", "ag-ui", "agui",
  "workbench", "instrument", "system-card", "feed", "mcp-fleet", "crosswalk",
  "refutation-ledger", "mcp",
];

export const LIBRARY_SECTORS = [
  "regulation", "regions", "academy", "tech", "axes", "governance", "product", "company",
];

function run(distArg = process.argv[2] || "dist/client") {
const DIST = distArg.startsWith("/") ? distArg : join(ROOT, distArg);
if (!existsSync(DIST)) { console.error(`[aliases] no ${DIST}`); process.exit(1); }
function pick(...rels) { for (const rel of rels) { const p = join(DIST, rel); if (existsSync(p)) return rel; } return null; }
function place(destRel, srcRel, { overwrite = false } = {}) {
  const src = join(DIST, srcRel); const dest = join(DIST, destRel);
  if (!existsSync(src)) return false; if (src === dest) return false;
  if (existsSync(dest) && !overwrite) return false;
  mkdirSync(dirname(dest), { recursive: true }); cpSync(src, dest); return true;
}
function pretty(path, src, overwrite = true) {
  let n = 0; if (place(`${path}.html`, src, { overwrite })) n += 1;
  if (place(`${path}/index.html`, src, { overwrite })) n += 1; return n;
}
const home = pick("index.html");
const board = pick("gspc-scoreboard/index.html", "index.html");
const verify = pick("gspc-verify/index.html", "index.html");
const compare = pick("compare/index.html", "index.html");
const disclaimers = pick("disclaimers/index.html", "index.html");
const industriesHub = pick("industries/index.html", "index.html");
const library = pick("library/index.html", "index.html");
const os = pick("os/index.html", "index.html");
const agui = pick("ag-ui/index.html", home);
if (!home || !board) { console.error("[aliases] dist is missing index.html"); process.exit(1); }
let n = 0;
n += pretty("ag-ui", agui); n += pretty("agui", agui);
if (isMain) run();
export { run };
