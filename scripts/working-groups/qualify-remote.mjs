#!/usr/bin/env node
// Read-only release acceptance using the official SDK. No tool execution or private inputs.
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { resolve, isAbsolute } from "node:path";
import assert from "node:assert/strict";
const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output || !isAbsolute(values.output)) throw Error("--output must be an absolute receipt path.");
const source = await readFile(new URL("../../public/working-groups/catalog.json", import.meta.url), "utf8");
const lock = JSON.parse(await readFile(new URL("../../functions/mcp/tool-fleet.lock.json", import.meta.url), "utf8"));
const uri = "https://councilof.ai/working-groups/catalog.json";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const receipt = { checked_at: new Date().toISOString(), source_catalog_sha256: hash(source), client: "@modelcontextprotocol/client", scope: "Public reads and blank prompts only; no tools called, submissions or human acceptance.", checks: [], status: "INCOMPLETE" };
const boundedFetch = (input, init) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
try {
  const response = await boundedFetch(uri, { cache: "no-store" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), source, "Public catalog differs from this checkout.");
  for (const door of ["/mcp/free", "/mcp"]) for (const mode of ["auto", "legacy"]) {
    const client = new Client({ name: "council-working-group-release-readback", version: "1.0.0" }, {
      capabilities: {}, versionNegotiation: { mode },
      supportedProtocolVersions: mode === "auto" ? ["2026-07-28", "2025-03-26"] : ["2025-03-26"],
    });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL("https://councilof.ai" + door), { fetch: boundedFetch }));
      const resources = await client.listResources();
      assert(resources.resources.some(r => r.uri === uri));
      const result = await client.readResource({ uri });
      assert.equal(result.contents.length, 1);
      assert.equal(result.contents[0].text, source);
      const prompts = await client.listPrompts();
      assert(prompts.prompts.some(p => p.name === "working_group_review"));
      const draft = await client.getPrompt({ name: "working_group_review", arguments: { documentId: "COAI-WG-002" } });
      assert.equal(draft.messages[0].content.type, "text");
      assert.match(draft.messages[0].content.text, /UNSENT DRAFT/);
      assert.match(draft.messages[0].content.text, /COAI-WG-002/);
      const tools = await client.listTools();
      assert.deepEqual(tools.tools.map(t => t.name).sort(), [...lock.free, ...(door === "/mcp" ? lock.paid : [])].sort());
      receipt.checks.push({ door, mode, protocol: client.getNegotiatedProtocolVersion(), server: client.getServerVersion(), resource_sha256: hash(result.contents[0].text), prompt: "UNSENT_DRAFT", tools: tools.tools.length, status: "PASS" });
    } finally { await client.close(); }
  }
  receipt.status = "PASS";
} catch (error) {
  receipt.status = "FAIL";
  receipt.error = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(values.output), JSON.stringify(receipt, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ status: receipt.status, checks: receipt.checks.length, output: values.output }) + "\n");
}
