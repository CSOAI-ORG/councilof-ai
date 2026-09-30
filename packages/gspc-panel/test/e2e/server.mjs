// Local static server for the render tests. It serves the harness page and the PUBLISHED bundle
// (public/panel/gspc-panel.js) under a strict CSP, the same header a locked-down host console
// would send: no inline script, no eval, styles only from 'self', network only to councilof.ai.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const port = Number(process.env.PORT || 4817);
export const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; connect-src https://councilof.ai; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const files = {
  "/": [resolve(here, "harness.html"), "text/html; charset=utf-8"],
  "/harness.js": [resolve(here, "harness.js"), "text/javascript"],
  "/panel/gspc-panel.js": [resolve(repo, "public/panel/gspc-panel.js"), "text/javascript"],
};

createServer((req, res) => {
  const f = files[new URL(req.url, "http://x").pathname];
  if (!f) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": f[1], "content-security-policy": CSP, "cache-control": "no-store" });
  res.end(readFileSync(f[0]));
}).listen(port, "127.0.0.1", () => console.log(`gspc-panel harness on http://127.0.0.1:${port}`));
