#!/usr/bin/env node
// Export the dedicated entry from ONE Vite build, before manifest deletion.
import { readFile, writeFile, mkdir, copyFile, readdir, lstat, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const safePath = p => typeof p === "string" && /^(?:assets\/|fonts\/|images\/)[A-Za-z0-9_./-]+$/.test(p)
  && !p.split("/").some(x => x === "." || x === ".." || !x);
const hashRevision = s => /^[a-f0-9]{40}$/.test(s);

export async function exportColiseum({ buildDir, outputDir, licensePath, sourceCommit, removeEntry = true }) {
  if (!hashRevision(sourceCommit)) throw Error("Coliseum export needs an exact source commit.");
  const root = path.resolve(buildDir), dest = path.resolve(outputDir);
  if (dest === root || dest.startsWith(root + path.sep) || root.startsWith(dest + path.sep))
    throw Error("Mirror output must be separate from the served tree.");
  const manifest = JSON.parse(await readFile(path.join(root, ".vite/manifest.json"), "utf8"));
  const entry = manifest["hf-coliseum.html"];
  if (!entry?.isEntry || entry.src !== "hf-coliseum.html") throw Error("Dedicated Coliseum build entry missing.");
  const files = new Set(), seen = new Set();
  const add = p => { if (!safePath(p)) throw Error("Unsafe mirror asset: " + p); files.add(p); };
  const visit = key => {
    if (seen.has(key)) return; seen.add(key);
    const chunk = manifest[key];
    if (!chunk || typeof chunk.file !== "string") throw Error("Missing manifest dependency: " + key);
    add(chunk.file);
    for (const file of [...(chunk.css || []), ...(chunk.assets || [])]) add(file);
    for (const dependency of [...(chunk.imports || []), ...(chunk.dynamicImports || [])]) visit(dependency);
  };
  visit("hf-coliseum.html");
  const html = await readFile(path.join(root, "hf-coliseum.html"), "utf8");
  // Include root-relative stylesheet/public font references without copying the
  // public tree (which also contains unrelated evidence/routes).
  const scan = text => {
    for (const match of text.matchAll(/(?:url\(\s*["']?([^"')\s]+)|(?:src|href)=["']([^"']+)["'])/g)) {
      const value = match[1] || match[2];
      if (/^(?:https?:|data:|#)/.test(value)) continue;
      const clean = value.split(/[?#]/)[0].replace(/^\//, "");
      if (!clean || clean === "hf-coliseum.html") continue;
      if (safePath(clean)) add(clean);
      else throw Error("Unqualified local mirror resource: " + value);
    }
  };
  scan(html);
  for (const file of files) {
    const abs = path.join(root, file);
    const stat = await lstat(abs);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error("Mirror input is not a regular file.");
    if (file.endsWith(".css")) scan(await readFile(abs, "utf8"));
  }
  // Validate everything before replacing an existing generated artifact.
  const payload = new Map();
  for (const file of files) {
    const bytes = await readFile(path.join(root, file));
    // Publisher accepts only assets/...; preserve public bytes under assets too,
    // rewriting references would break byte identity, so require Vite imports.
    if (!file.startsWith("assets/")) throw Error("Import this public resource through Vite before mirroring: " + file);
    payload.set(file, bytes);
  }
  payload.set("index.html", Buffer.from(html));
  payload.set("LICENSE", await readFile(licensePath));
  payload.set("README.md", Buffer.from([
    "---", "title: Council Coliseum", "emoji: 🏟️", "colorFrom: green", "colorTo: blue",
    "sdk: static", "pinned: false", "---", "",
    "# Council Coliseum", "",
    "Generated from CSOAI-ORG/councilof-ai commit " + sourceCommit + ".",
    "The same Munder component and emitted assets are used by Council OS.",
    "Play the eight-case Boss's Chair local game with real proposals from the existing MEOK HF endpoint.",
    "No signed evidence, independent human-learning gain, native world action or R3 admission is claimed.",
    "Session reports are downloaded locally; they are never automatically uploaded or reused for training.", "",
    "Canonical source: https://github.com/CSOAI-ORG/councilof-ai/tree/" + sourceCommit,
    "Public board: https://councilof.ai/board/",
    "Board feed: https://api.meok.ai/gspc/board", "",
    "Code is MIT; see LICENSE. Retained historical board-printer source has its own licence/history.",
    "",
  ].join("\n")));
  const hashes = Object.fromEntries([...payload].sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => [name, sha(bytes)]));
  const receipt = { schema: "csoai.coliseum-mirror/0.1", source_commit: sourceCommit, files: hashes };
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  for (const [file, bytes] of payload) {
    await mkdir(path.dirname(path.join(dest, file)), { recursive: true });
    await writeFile(path.join(dest, file), bytes);
  }
  await writeFile(path.join(dest, "coliseum-manifest.json"), JSON.stringify(receipt, null, 2) + "\n");
  // Only this generated mirror HTML is excluded from the Council served tree.
  // Shared chunks stay in place and continue to be used by the native OS pane.
  if (removeEntry) await rm(path.join(root, "hf-coliseum.html"));
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const receipt = await exportColiseum({
    buildDir: path.join(root, "dist/client"), outputDir: path.join(root, "dist/hf-coliseum"),
    licensePath: path.join(root, "LICENSE"),
    sourceCommit: process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA ||
      execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
  });
  console.log("Coliseum mirror: " + Object.keys(receipt.files).length + " files, source " + receipt.source_commit);
}
