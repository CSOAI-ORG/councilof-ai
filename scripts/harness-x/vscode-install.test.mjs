import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { vscodeInstallAction } from "./vscode-install.mjs";

const distribution = JSON.parse(readFileSync(new URL("../../council-os/distribution.json", import.meta.url), "utf8"));
const freeUrl = `${distribution.identity.door}/free`;
const resolveRow = (c) => ({ ...c, url: c.door === "full" ? distribution.identity.door : freeUrl, snippet: c.snippet.replaceAll("{free}", freeUrl).replaceAll("{full}", distribution.identity.door) });
const row = resolveRow(distribution.connect_matrix.clients.find((c) => c.id === "vscode"));
const altered = (edit) => { const copy = structuredClone(row); edit(copy); return copy; };
const snippet = (edit) => altered((copy) => { const body = JSON.parse(copy.snippet); edit(body); copy.snippet = JSON.stringify(body); });

test("canonical opted-in row roundtrips its exact free HTTP descriptor", () => {
  const action = vscodeInstallAction(row, freeUrl);
  assert.equal(action.kind, "vscode");
  assert.ok(action.href.startsWith("vscode:mcp/install?"));
  assert.deepEqual(JSON.parse(decodeURIComponent(action.href.slice("vscode:mcp/install?".length))), { name: "gspc", ...JSON.parse(row.snippet).servers.gspc });
});
test("only the existing VS Code row is opted in; other clients stay unchanged", () => {
  assert.equal(distribution.connect_matrix.clients.filter((c) => c.installer !== undefined).length, 1);
  for (const c of distribution.connect_matrix.clients.filter((c) => c.id !== "vscode")) assert.equal(vscodeInstallAction(resolveRow(c), freeUrl), undefined);
});
test("installer derivation does not mutate the row", () => {
  const before = JSON.stringify(row); vscodeInstallAction(row, freeUrl); assert.equal(JSON.stringify(row), before);
});
test("a row without opt-in produces no action", () => {
  assert.equal(vscodeInstallAction(altered((c) => { delete c.installer; }), freeUrl), undefined);
});
test("non-opt-in malformed snippets pass through without validation", () => {
  assert.equal(vscodeInstallAction({ id: "cursor", kind: "shell", snippet: "not JSON" }, freeUrl), undefined);
});
const invalid = [
  ["unknown installer", () => altered((c) => { c.installer = "other"; })],
  ["another client identity", () => altered((c) => { c.id = "cursor"; })],
  ["full-door row", () => altered((c) => { c.door = "full"; })],
  ["non-JSON row", () => altered((c) => { c.kind = "shell"; })],
  ["unresolved row URL", () => altered((c) => { c.url = "{free}"; })],
  ["malformed JSON", () => altered((c) => { c.snippet = "{"; })],
  ["multiple servers", () => snippet((s) => { s.servers.other = { type: "http", url: freeUrl }; })],
  ["renamed alias", () => snippet((s) => { s.servers.other = s.servers.gspc; delete s.servers.gspc; })],
  ["missing servers", () => altered((c) => { c.snippet = "{}"; })],
  ["array servers", () => altered((c) => { c.snippet = JSON.stringify({ servers: [JSON.parse(c.snippet).servers.gspc] }); })],
  ["stdio transport", () => snippet((s) => { s.servers.gspc.type = "stdio"; })],
  ["command injection", () => snippet((s) => { s.servers.gspc.command = "node"; })],
  ["credential headers", () => snippet((s) => { s.servers.gspc.headers = { Authorization: "secret" }; })],
  ["credential inputs", () => snippet((s) => { s.inputs = [{ id: "secret", type: "promptString" }]; })],
  ["full endpoint", () => snippet((s) => { s.servers.gspc.url = distribution.identity.door; })],
  ["off-origin endpoint", () => snippet((s) => { s.servers.gspc.url = "https://example.invalid/mcp/free"; })],
  ["unresolved snippet endpoint", () => snippet((s) => { s.servers.gspc.url = "{free}"; })],
  ["URL input substitution", () => snippet((s) => { s.servers.gspc.url = "${input:secret}"; })],
];
for (const [name, make] of invalid) test(`fails closed: ${name}`, () => assert.throws(() => vscodeInstallAction(make(), freeUrl), /VS Code installer:/));
for (const url of ["http://councilof.ai/mcp/free", "https://user:secret@councilof.ai/mcp/free", `${freeUrl}?token=secret`, `${freeUrl}#fragment`, distribution.identity.door]) {
  test(`rejects unsafe free-door declaration: ${url.replace("secret", "redacted")}`, () => assert.throws(() => vscodeInstallAction(altered((c) => { c.url = url; }), url), /VS Code installer:/));
}
