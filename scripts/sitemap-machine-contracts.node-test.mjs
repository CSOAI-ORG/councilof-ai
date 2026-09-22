import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./generate-sitemap.mjs", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const paths = [
  "/.well-known/mcp.json",
  "/.well-known/mcp/server-card.json",
  "/.well-known/x402.json",
];

test("sitemap generator retains public discovery contracts", () => {
  for (const path of paths) assert.match(source, new RegExp(`\\["${path.replace(/[./]/g, "\\$&")}", "daily", "0\\.7"\\]`));
});

test("generated sitemap advertises public discovery contracts", () => {
  for (const path of paths) assert.match(sitemap, new RegExp(`<loc>https://councilof\\.ai${path.replace(/[./]/g, "\\$&")}</loc>`));
});
