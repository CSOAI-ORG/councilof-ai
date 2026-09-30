// Builds dist/: app.js bundled with foundry-js, the published panel bundle (pinned by sha256 to
// councilof.ai/panel/gspc-panel.js as committed in public/panel/), index.html and app.css.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(here, "dist");
mkdirSync(dist, { recursive: true });
await build({ entryPoints: [resolve(here, "src/app.js")], bundle: true, format: "esm", minify: true, target: "es2020", outfile: resolve(dist, "app.js"), legalComments: "none" });
for (const f of ["index.html", "app.css"]) copyFileSync(resolve(here, "src", f), resolve(dist, f));
const panelSrc = resolve(here, "src/gspc-panel.js");
copyFileSync(panelSrc, resolve(dist, "gspc-panel.js"));
console.log("gspc-panel.js sha256", createHash("sha256").update(readFileSync(panelSrc)).digest("hex"));
