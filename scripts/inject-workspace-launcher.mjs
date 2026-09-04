#!/usr/bin/env node

/**
 * Add the canonical Council OS launcher to built HTML only.
 *
 * This deliberately refuses to edit `public/` or `client/`. The former injector
 * recursively rewrote source pages, which made a build step capable of changing
 * hundreds of tracked files. Here the generated `dist/client` tree is the only
 * valid target and `--check` proves the shipped tree has exactly one launcher tag
 * per HTML document.
 *
 * Usage:
 *   node scripts/inject-workspace-launcher.mjs --dir dist/client
 *   node scripts/inject-workspace-launcher.mjs --dir dist/client --check
 *   node scripts/inject-workspace-launcher.mjs --selftest
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TAG = '<script src="/council-workspace-launcher.js" defer></script>';
const NEEDLE = "/council-workspace-launcher.js";

function countNeedles(source) {
  return source.split(NEEDLE).length - 1;
}

export function injectLauncher(source) {
  if (countNeedles(source) > 0) return source;
  if (/<\/body\s*>/i.test(source)) {
    return source.replace(/<\/body\s*>/i, `  ${TAG}\n</body>`);
  }
  return `${source.trimEnd()}\n${TAG}\n`;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory()
      ? htmlFiles(path)
      : path.endsWith(".html")
        ? [path]
        : [];
  });
}

function parseDir(argv) {
  const index = argv.indexOf("--dir");
  if (index < 0 || !argv[index + 1] || argv[index + 1].startsWith("--")) {
    throw new Error("--dir dist/client is required");
  }
  const target = resolve(ROOT, argv[index + 1]);
  const repoRelative = relative(ROOT, target);
  const distPrefix = `dist${sep}`;
  if (repoRelative !== "dist" && !repoRelative.startsWith(distPrefix)) {
    throw new Error(
      `refusing to edit source tree: ${repoRelative || "."}; target must be under dist/`,
    );
  }
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    throw new Error(`build output does not exist: ${repoRelative}`);
  }
  return target;
}

function selftest() {
  const clean = "<!doctype html><body><main>Page</main></body>";
  const injected = injectLauncher(clean);
  if (!injected.includes(TAG) || countNeedles(injected) !== 1) {
    throw new Error("selftest: launcher was not injected exactly once");
  }
  if (injectLauncher(injected) !== injected) {
    throw new Error("selftest: injection is not idempotent");
  }
  const fragment = injectLauncher("<p>No body close</p>\n");
  if (!fragment.endsWith(`${TAG}\n`)) {
    throw new Error("selftest: body-less HTML was not handled");
  }
  console.log("workspace-launcher: selftest OK");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) {
    selftest();
    return;
  }

  const check = args.includes("--check");
  const target = parseDir(args);
  const files = htmlFiles(target);
  if (files.length === 0) throw new Error("no HTML files found in build output");

  const missing = [];
  const duplicate = [];
  let changed = 0;
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    const count = countNeedles(source);
    if (count > 1) {
      duplicate.push(relative(target, path));
      continue;
    }
    if (count === 0) {
      if (check) {
        missing.push(relative(target, path));
      } else {
        writeFileSync(path, injectLauncher(source));
        changed += 1;
      }
    }
  }

  if (duplicate.length || missing.length) {
    if (missing.length) {
      console.error(
        `workspace-launcher: ${missing.length} HTML files missing launcher; first: ${missing
          .slice(0, 5)
          .join(", ")}`,
      );
    }
    if (duplicate.length) {
      console.error(
        `workspace-launcher: ${duplicate.length} HTML files contain duplicate launchers; first: ${duplicate
          .slice(0, 5)
          .join(", ")}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    check
      ? `workspace-launcher: ${files.length}/${files.length} built HTML files aligned`
      : `workspace-launcher: aligned ${files.length} built HTML files (${changed} changed)`,
  );
}

try {
  main();
} catch (error) {
  console.error(`workspace-launcher: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
