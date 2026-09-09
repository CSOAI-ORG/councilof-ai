import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

const root = new URL("../", import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("llms install guide matches the canonical MCP identity and tool catalog", async () => {
  const [guide, descriptor, packageJson, free, paid] = await Promise.all([
    readFile(new URL("llms-install.md", root), "utf8"),
    json("mcp/gspc-server/server.json"),
    json("mcp/gspc-server/package.json"),
    json("functions/mcp/gspc-tools.json"),
    json("functions/mcp/paid-tools.json"),
  ]);

  const remote = descriptor.remotes.find(
    (candidate) => candidate.type === "streamable-http",
  )?.url;
  assert.equal(remote, "https://councilof.ai/mcp");
  const examples = [...guide.matchAll(/```json\s*([\s\S]*?)\s*```/g)].map(
    (match) => JSON.parse(match[1]),
  );
  const configs = examples.filter((example) => example.mcpServers);
  assert.equal(configs.length, 2, "one remote and one local configuration");
  assert.deepEqual(configs[0], {
    mcpServers: {
      "csoai-gspc": {
        type: "streamableHttp", url: remote, disabled: false, autoApprove: [],
      },
    },
  });
  assert.deepEqual(configs[1], {
    mcpServers: {
      "csoai-gspc": { command: "npx", args: ["-y", "csoai-gspc-mcp@0.2.1"] },
    },
  });
  assert.equal(packageJson.name, "csoai-gspc-mcp");
  assert.match(guide, /`csoai-gspc-mcp`/);
  assert.doesNotMatch(guide, /@csoai\/mcp-core/);

  const catalogBlock = guide.match(
    /<!-- mcp-tool-catalog:start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- mcp-tool-catalog:end -->/,
  );
  assert.ok(catalogBlock, "guide must carry one machine-readable tool catalog");
  const catalog = JSON.parse(catalogBlock[1]);
  assert.deepEqual(
    catalog.free,
    free.tools.map((tool) => tool.name),
  );
  assert.deepEqual(
    catalog.x402_metered,
    paid.tools.map((tool) => tool.name),
  );
  assert.equal(catalog.free.length, 8);
  assert.equal(catalog.x402_metered.length, 4);

  assert.equal(packageJson.version, "0.2.2");
  assert.match(
    guide,
    /npm release last publicly verified here on 2026-09-09 is\s+`0\.2\.1`/,
  );
  assert.match(
    guide,
    /published `0\.2\.1` package predates the reviewed `0\.2\.2` conformance repair/,
  );
  assert.match(
    guide,
    /repository currently prepares `0\.2\.2`, but that source version is\s+\*\*not a\s+published npm release\*\*/,
  );
  assert.match(
    guide,
    /A challenge is \*\*not\*\* a payment, settlement, delivery/,
  );
  assert.match(
    guide,
    /Submitting a payment payload does not itself prove settlement/,
  );
  assert.match(
    guide,
    /Report delivery only when the successful tool result contains/,
  );
  assert.match(guide, /do not automatically retry an uncertain result/);
  assert.match(guide, /npm view csoai-gspc-mcp@0\.2\.2 version/);
  assert.match(guide, /https:\/\/github\.com\/CSOAI-ORG\/councilof-ai/);
});
