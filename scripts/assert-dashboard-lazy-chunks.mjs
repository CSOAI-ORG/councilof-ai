#!/usr/bin/env node
/**
 * assert-dashboard-lazy-chunks — play-tab / arena hop must not ship a DashboardLayout
 * whose Vite mapDeps point at missing /assets/*.js (live leftover: SPA HTML 404 for
 * LobbyPlay.r2-rvWRtImj.js et al. while DashboardLayout.r2-DUC5LuX3.js still 200).
 *
 * WHY. Tip/partial publishes can leave an older DashboardLayout (+ prerendered
 * /dashboard/index.html modulepreloads) beside a newer index graph. Entry chunks
 * stay 200; lazy pane hashes 404 as text/html. /dashboard?tab=play then never
 * mounts — artefact dropdown empty. A newer coherent layout may already exist on
 * the CDN; the broken HTML still pins the orphan.
 *
 * CHECKS (exit 1 on hit, 2 if it cannot run):
 *   1. Exactly one assets/DashboardLayout.r2-*.js in dist.
 *   2. Every path in that file's __vite__mapDeps array exists under dist/.
 *   3. Required lazy stems emit: LobbyPlay, LobbyBoardPane, LobbyArt50Pane,
 *      ArenaScoreboard, MarketingHome (name match assets/<stem>.r2-*.js).
 *   4. When dist/dashboard/index.html exists, its /assets/index.r2-*.js script src
 *      matches dist/index.html (shell skew = mixed deploy generations).
 *   5. When dashboard HTML modulepreloads a DashboardLayout, that href must be the
 *      single layout file from (1).
 *
 *   node scripts/assert-dashboard-lazy-chunks.mjs [dist/client]
 *   node scripts/assert-dashboard-lazy-chunks.mjs --selftest
 */
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SELFTEST = args.includes("--selftest");
const DIST = resolve(
  REPO,
  args.find((a) => !a.startsWith("--")) ?? "dist/client",
);

export const REQUIRED_LAZY_STEMS = [
  "LobbyPlay",
  "LobbyBoardPane",
  "LobbyArt50Pane",
  "ArenaScoreboard",
  "MarketingHome",
];

const LAYOUT_RE = /^DashboardLayout\.r2-[A-Za-z0-9_-]+\.js$/;
const INDEX_SRC_RE =
  /<script[^>]*type=["']module["'][^>]*src=["'](\/assets\/index\.r2-[A-Za-z0-9_-]+\.js)["'][^>]*>/i;
const INDEX_SRC_RE_ALT =
  /<script[^>]*src=["'](\/assets\/index\.r2-[A-Za-z0-9_-]+\.js)["'][^>]*type=["']module["'][^>]*>/i;
const LAYOUT_PRELOAD_RE =
  /<link[^>]*rel=["']modulepreload["'][^>]*href=["'](\/assets\/DashboardLayout\.r2-[A-Za-z0-9_-]+\.js)["'][^>]*>/i;

export function listLayoutFiles(assetNames) {
  return assetNames.filter((n) => LAYOUT_RE.test(n)).sort();
}

export function parseMapDeps(layoutSource) {
  const m = layoutSource.match(/__vite__mapDeps\s*=\s*\([\s\S]*?m\.f\|\|\s*\(\s*m\.f\s*=\s*(\[[\s\S]*?\])/);
  if (!m) {
    // Newer Vite may inline differently — also accept m.f=["a","b"]
    const m2 = layoutSource.match(/m\.f\s*=\s*(\[\s*["']assets\/[^]*?\])/);
    if (!m2) return null;
    try {
      return JSON.parse(m2[1].replace(/'/g, '"'));
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(m[1].replace(/'/g, '"'));
  } catch {
    // Fallback: pull quoted assets/… paths
    const paths = [...m[1].matchAll(/["'](assets\/[^"']+)["']/g)].map((x) => x[1]);
    return paths.length ? paths : null;
  }
}

export function listLazyStems(assetNames) {
  const stems = new Set();
  for (const n of assetNames) {
    const m = n.match(/^([A-Za-z0-9]+)\.r2-[A-Za-z0-9_-]+\.js$/);
    if (m) stems.add(m[1]);
  }
  return stems;
}

export function extractIndexSrc(html) {
  return (
    html.match(INDEX_SRC_RE)?.[1] ||
    html.match(INDEX_SRC_RE_ALT)?.[1] ||
    null
  );
}

export function extractLayoutPreload(html) {
  return html.match(LAYOUT_PRELOAD_RE)?.[1] || null;
}

/**
 * @param {{
 *   assetNames: string[],
 *   layoutSourceByName?: Record<string, string>,
 *   rootHtml?: string | null,
 *   dashboardHtml?: string | null,
 *   fileExists?: (relFromDist: string) => boolean,
 * }} input
 * @returns {string[]} findings
 */
export function auditDashboardLazyChunks(input) {
  const findings = [];
  const {
    assetNames,
    layoutSourceByName = {},
    rootHtml = null,
    dashboardHtml = null,
    fileExists = () => false,
  } = input;

  const layouts = listLayoutFiles(assetNames);
  if (layouts.length === 0) {
    findings.push("missing assets/DashboardLayout.r2-*.js — dashboard shell chunk did not emit");
  } else if (layouts.length > 1) {
    findings.push(
      `multiple DashboardLayout chunks in dist (${layouts.join(", ")}) — mixed tip/partial publish; keep exactly one`,
    );
  }

  const layoutName = layouts.length === 1 ? layouts[0] : null;
  if (layoutName) {
    const src = layoutSourceByName[layoutName];
    if (!src) {
      findings.push(`could not read assets/${layoutName}`);
    } else {
      const deps = parseMapDeps(src);
      if (!deps) {
        findings.push(
          `assets/${layoutName}: no __vite__mapDeps array — cannot verify lazy pane graph`,
        );
      } else {
        for (const dep of deps) {
          const rel = dep.replace(/^\//, "");
          if (!fileExists(rel)) {
            findings.push(
              `assets/${layoutName} mapDeps missing ${rel} (would 404 as SPA HTML on Pages)`,
            );
          }
        }
      }
    }
  }

  const stems = listLazyStems(assetNames);
  for (const stem of REQUIRED_LAZY_STEMS) {
    if (!stems.has(stem)) {
      findings.push(
        `missing lazy chunk stem ${stem}.r2-*.js — play/arena hop pane will not mount`,
      );
    }
  }

  if (rootHtml != null && dashboardHtml != null) {
    const rootIdx = extractIndexSrc(rootHtml);
    const dashIdx = extractIndexSrc(dashboardHtml);
    if (!rootIdx) {
      findings.push("dist/index.html: missing type=module /assets/index.r2-*.js script");
    }
    if (!dashIdx) {
      findings.push(
        "dist/dashboard/index.html: missing type=module /assets/index.r2-*.js script",
      );
    }
    if (rootIdx && dashIdx && rootIdx !== dashIdx) {
      findings.push(
        `shell skew: index.html has ${rootIdx} but dashboard/index.html has ${dashIdx} — mixed deploy generations`,
      );
    }
    const preload = extractLayoutPreload(dashboardHtml);
    if (preload && layoutName) {
      const expected = `/assets/${layoutName}`;
      if (preload !== expected) {
        findings.push(
          `dashboard/index.html modulepreloads ${preload} but dist has ${expected}`,
        );
      }
    }
  }

  return findings;
}

function readDistAuditSync(distDir) {
  const assetsDir = join(distDir, "assets");
  if (!existsSync(assetsDir)) {
    return { error: `no ${assetsDir}` };
  }
  const assetNames = readdirSync(assetsDir);
  const layoutSourceByName = {};
  for (const n of listLayoutFiles(assetNames)) {
    layoutSourceByName[n] = readFileSync(join(assetsDir, n), "utf8");
  }
  const rootPath = join(distDir, "index.html");
  const dashPath = join(distDir, "dashboard", "index.html");
  return {
    assetNames,
    layoutSourceByName,
    rootHtml: existsSync(rootPath) ? readFileSync(rootPath, "utf8") : null,
    dashboardHtml: existsSync(dashPath) ? readFileSync(dashPath, "utf8") : null,
    fileExists: (rel) => existsSync(join(distDir, rel)),
  };
}

function runSelftest() {
  const failures = [];
  const mapDepsSrc = (files) =>
    `const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=${JSON.stringify(files)})))=>i.map(i=>d[i]);\nexport default {};\n`;

  // Green: one layout, all deps present, stems present, matching shells
  {
    const assets = [
      "DashboardLayout.r2-AAA.js",
      "LobbyPlay.r2-BBB.js",
      "LobbyBoardPane.r2-CCC.js",
      "LobbyArt50Pane.r2-DDD.js",
      "ArenaScoreboard.r2-EEE.js",
      "MarketingHome.r2-FFF.js",
      "index.r2-GGG.js",
    ];
    const present = new Set(assets.map((a) => `assets/${a}`));
    const findings = auditDashboardLazyChunks({
      assetNames: assets,
      layoutSourceByName: {
        "DashboardLayout.r2-AAA.js": mapDepsSrc([
          "assets/LobbyPlay.r2-BBB.js",
          "assets/LobbyBoardPane.r2-CCC.js",
        ]),
      },
      rootHtml: `<script type="module" crossorigin src="/assets/index.r2-GGG.js"></script>`,
      dashboardHtml: `<script type="module" crossorigin src="/assets/index.r2-GGG.js"></script>
<link rel="modulepreload" href="/assets/DashboardLayout.r2-AAA.js">`,
      fileExists: (rel) => present.has(rel),
    });
    if (findings.length) failures.push(`green fixture went red: ${findings.join(" | ")}`);
  }

  // Red: missing LobbyPlay mapDeps target
  {
    const findings = auditDashboardLazyChunks({
      assetNames: [
        "DashboardLayout.r2-OLD.js",
        "LobbyBoardPane.r2-CCC.js",
        "LobbyArt50Pane.r2-DDD.js",
        "ArenaScoreboard.r2-EEE.js",
        "MarketingHome.r2-FFF.js",
        "index.r2-GGG.js",
      ],
      layoutSourceByName: {
        "DashboardLayout.r2-OLD.js": mapDepsSrc(["assets/LobbyPlay.r2-MISSING.js"]),
      },
      fileExists: (rel) => rel !== "assets/LobbyPlay.r2-MISSING.js",
    });
    if (!findings.some((f) => /LobbyPlay\.r2-MISSING/.test(f))) {
      failures.push("missing mapDeps target did not go red");
    }
    if (!findings.some((f) => /LobbyPlay\.r2-\*\.js/.test(f))) {
      failures.push("missing LobbyPlay stem did not go red");
    }
  }

  // Red: two layouts (mixed tip)
  {
    const findings = auditDashboardLazyChunks({
      assetNames: [
        "DashboardLayout.r2-OLD.js",
        "DashboardLayout.r2-NEW.js",
        "LobbyPlay.r2-BBB.js",
        "LobbyBoardPane.r2-CCC.js",
        "LobbyArt50Pane.r2-DDD.js",
        "ArenaScoreboard.r2-EEE.js",
        "MarketingHome.r2-FFF.js",
      ],
      layoutSourceByName: {},
      fileExists: () => true,
    });
    if (!findings.some((f) => /multiple DashboardLayout/.test(f))) {
      failures.push("multiple DashboardLayout did not go red");
    }
  }

  // Red: shell skew
  {
    const findings = auditDashboardLazyChunks({
      assetNames: [
        "DashboardLayout.r2-AAA.js",
        "LobbyPlay.r2-BBB.js",
        "LobbyBoardPane.r2-CCC.js",
        "LobbyArt50Pane.r2-DDD.js",
        "ArenaScoreboard.r2-EEE.js",
        "MarketingHome.r2-FFF.js",
      ],
      layoutSourceByName: {
        "DashboardLayout.r2-AAA.js": mapDepsSrc([]),
      },
      rootHtml: `<script type="module" src="/assets/index.r2-NEW.js"></script>`,
      dashboardHtml: `<script type="module" src="/assets/index.r2-OLD.js"></script>`,
      fileExists: () => true,
    });
    if (!findings.some((f) => /shell skew/.test(f))) {
      failures.push("shell skew did not go red");
    }
  }

  // Filesystem selftest round-trip
  const dir = mkdtempSync(join(tmpdir(), "assert-dash-lazy-"));
  try {
    mkdirSync(join(dir, "assets"), { recursive: true });
    mkdirSync(join(dir, "dashboard"), { recursive: true });
    const assets = [
      "DashboardLayout.r2-AAA.js",
      "LobbyPlay.r2-BBB.js",
      "LobbyBoardPane.r2-CCC.js",
      "LobbyArt50Pane.r2-DDD.js",
      "ArenaScoreboard.r2-EEE.js",
      "MarketingHome.r2-FFF.js",
      "index.r2-GGG.js",
    ];
    for (const a of assets) {
      const body =
        a.startsWith("DashboardLayout")
          ? mapDepsSrc(["assets/LobbyPlay.r2-BBB.js"])
          : "export default {};\n";
      writeFileSync(join(dir, "assets", a), body);
    }
    const shell = `<!doctype html><script type="module" crossorigin src="/assets/index.r2-GGG.js"></script>`;
    writeFileSync(join(dir, "index.html"), shell);
    writeFileSync(
      join(dir, "dashboard", "index.html"),
      `${shell}<link rel="modulepreload" as="script" href="/assets/DashboardLayout.r2-AAA.js">`,
    );
    const audit = readDistAuditSync(dir);
    const findings = auditDashboardLazyChunks(audit);
    if (findings.length) {
      failures.push(`filesystem green fixture went red: ${findings.join(" | ")}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error("assert-dashboard-lazy-chunks selftest FAILED:");
    for (const f of failures) console.error(" -", f);
    process.exit(1);
  }
  console.log("assert-dashboard-lazy-chunks selftest OK");
}

function main() {
  if (SELFTEST) {
    runSelftest();
    return;
  }
  if (!existsSync(DIST)) {
    console.error(`assert-dashboard-lazy-chunks: cannot run — ${DIST} missing`);
    process.exit(2);
  }
  const audit = readDistAuditSync(DIST);
  if (audit.error) {
    console.error(`assert-dashboard-lazy-chunks: cannot run — ${audit.error}`);
    process.exit(2);
  }
  const findings = auditDashboardLazyChunks(audit);
  if (findings.length) {
    console.error("assert-dashboard-lazy-chunks RED:");
    for (const f of findings) console.error(" -", f);
    process.exit(1);
  }
  const layouts = listLayoutFiles(audit.assetNames);
  const dashNote = audit.dashboardHtml
    ? "dashboard shell matches index"
    : "no dashboard/index.html yet (post-vite; re-check after prerender)";
  console.log(
    `assert-dashboard-lazy-chunks OK — ${layouts[0]} mapDeps present; required lazy stems emit; ${dashNote}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("assert-dashboard-lazy-chunks.mjs")) {
  main();
}
