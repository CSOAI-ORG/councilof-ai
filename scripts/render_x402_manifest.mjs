#!/usr/bin/env node
/**
 * render_x402_manifest.mjs — print /.well-known/x402.json exactly as the Pages Function that serves
 * it renders it, WITHOUT a network request and without a deploy.
 *
 * WHY. scripts/build_openapi.py used to read its door list from scripts/fixtures/x402scan/
 * well_known_x402.json, a copy of the live manifest captured by hand with `--fetch`. The copy froze
 * at 21 doors while the function grew to 25 (fresh-capsule and the three RAS doors), so
 * /openapi.json omitted four paid doors and x402scan refused them as `notInSpec` (28 Sep 2026).
 * The fixture is now RENDERED from functions/.well-known/x402.json.ts — the same code, the same
 * OFFERS table and the same population registry the live route uses — so it cannot fall behind.
 *
 * The handler is called with origin https://councilof.ai and an EMPTY env: every field that
 * depends on a Pages secret (mode, whether a board key is configured) renders its unconfigured
 * value, which build_openapi.py does not read. It reads the door list, each door's method,
 * paid_for, amount, free_preview and note, and the manifest's verify / mcp / not / quarantined.
 *
 *   node scripts/render_x402_manifest.mjs            # print the manifest (sorted keys, 2-space)
 *   node scripts/render_x402_manifest.mjs --out F    # write it to F
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tsImport } from "tsx/esm/api";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://councilof.ai";

const sortKeys = (v) =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
      : v;

const mod = await tsImport(resolve(REPO, "functions/.well-known/x402.json.ts"), import.meta.url);
const res = await mod.onRequestGet({ request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {}, params: {} });
if (res.status !== 200) {
  console.error(`x402.json handler answered ${res.status}`);
  process.exit(1);
}
const doc = await res.json();
const text = JSON.stringify(sortKeys(doc), null, 2) + "\n";
const i = process.argv.indexOf("--out");
if (i > 0) writeFileSync(resolve(process.argv[i + 1]), text);
else process.stdout.write(text);
