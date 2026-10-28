import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cursorInstallAction } from "./cursor-install.mjs";

const distribution = JSON.parse(readFileSync(new URL("../../council-os/distribution.json", import.meta.url), "utf8"));
const freeUrl = `${distribution.identity.door}/free`;
const resolve = (c) => ({ ...c, url: c.door === "full" ? distribution.identity.door : freeUrl, snippet: c.snippet.replaceAll("{free}", freeUrl).replaceAll("{full}", distribution.identity.door) });
const row = resolve(distribution.connect_matrix.clients.find((c) => c.id === "cursor"));
const matrix = JSON.parse(readFileSync(new URL("../../distribution/connect/connect-matrix.json", import.meta.url), "utf8"));

test("Cursor row yields the documented deeplink carrying only the free URL", () => {
  const a = cursorInstallAction(row, freeUrl);
  const u = new URL(a.href);
  assert.equal(`${u.protocol}//${u.host}${u.pathname}`, "cursor://anysphere.cursor-deeplink/mcp/install");
  assert.equal(u.searchParams.get("name"), "gspc");
  assert.deepEqual(JSON.parse(Buffer.from(u.searchParams.get("config"), "base64").toString()), { url: freeUrl });
});
test("rendered matrix carries exactly that href", () => {
  assert.deepEqual(matrix.clients.find((c) => c.id === "cursor").install_action, cursorInstallAction(row, freeUrl));
});
test("rows without the cursor opt-in produce nothing", () => {
  for (const c of distribution.connect_matrix.clients.filter((c) => c.installer !== "cursor")) assert.equal(cursorInstallAction(resolve(c), freeUrl), undefined);
});
for (const [name, edit] of [
  ["full door", (c) => { c.door = "full"; }],
  ["other id", (c) => { c.id = "windsurf"; }],
  ["full endpoint", (c) => { c.snippet = c.snippet.replace("/mcp/free", "/mcp"); }],
  ["headers", (c) => { const j = JSON.parse(c.snippet); j.mcpServers.gspc.headers = { Authorization: "x" }; c.snippet = JSON.stringify(j); }],
  ["command", (c) => { const j = JSON.parse(c.snippet); j.mcpServers.gspc.command = "node"; c.snippet = JSON.stringify(j); }],
]) test(`fails closed: ${name}`, () => { const c = structuredClone(row); edit(c); assert.throws(() => cursorInstallAction(c, freeUrl), /Cursor installer:/); });
