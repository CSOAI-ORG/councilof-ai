// SPDX-License-Identifier: Apache-2.0
// node build.mjs [ESBUILD_BIN]   -> dist/csoai-verify.mjs (+ .d.ts) and public/lib/csoai-verify.mjs (same bytes)
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const here = new URL(".", import.meta.url).pathname;
const esbuild = process.argv[2] || "esbuild";
const pkg = JSON.parse(readFileSync(here + "package.json", "utf8"));
mkdirSync(here + "dist", { recursive: true });
execFileSync(esbuild, [here + "index.ts", "--bundle", "--format=esm", "--platform=neutral", "--target=es2020",
  "--legal-comments=inline", `--banner:js=// csoai-verify ${pkg.version} (Apache-2.0). Offline verifier for CSOAI board-signed records. https://councilof.ai/connect/`,
  "--outfile=" + here + "dist/csoai-verify.mjs"], { stdio: "inherit" });
copyFileSync(here + "csoai-verify.d.ts", here + "dist/csoai-verify.d.ts");
const site = here + "../../../public/lib/";
mkdirSync(site, { recursive: true });
copyFileSync(here + "dist/csoai-verify.mjs", site + "csoai-verify.mjs");
const b = readFileSync(here + "dist/csoai-verify.mjs");
writeFileSync(here + "dist/SHA256", createHash("sha256").update(b).digest("hex") + "  csoai-verify.mjs\n");
console.log("csoai-verify.mjs", b.length, "bytes", createHash("sha256").update(b).digest("hex"));
