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
  // One remote configuration only: every published npm release is marked deprecated on npm and
  // carries fewer tools, so the guide no longer offers a local stdio configuration (6 Oct 2026).
  assert.equal(configs.length, 1, "one remote configuration, no local stdio configuration");
  assert.deepEqual(configs[0], {
    mcpServers: {
      "csoai-gspc": {
        type: "streamableHttp", url: remote, disabled: false, autoApprove: [],
      },
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
  assert.equal(catalog.free.length, 47);
  assert.equal(catalog.x402_metered.length, 5);

  // The prose count and the prose wording are held to the catalogue, so neither can drift.
  // "the same N names" must be N = free + x402-metered, and the free-tool sentence must not
  // name a hand-counted number: a published sentence that reads "all eight read/verification
  // tools" while the door serves 47 free tools is a false claim, not a style question.
  // BOTH copies are held: llms-install.md and public/llms-install.md are hand-maintained
  // separately, and the published one is the one a reader opens.
  const catalogTotal = catalog.free.length + catalog.x402_metered.length;
  for (const [label, text] of [
    ["llms-install.md", guide],
    ["public/llms-install.md", await readFile(new URL("public/llms-install.md", root), "utf8")],
  ]) {
    const proseCount = text.match(/returns the same (\d+) names/);
    assert.ok(proseCount, `${label} must state how many names the remote should return`);
    assert.equal(
      Number(proseCount[1]),
      catalogTotal,
      `${label}'s prose count must equal the catalogue it publishes`,
    );
    assert.doesNotMatch(
      text,
      /using all \w+ read\/verification tools is free/,
      `${label}'s free-tool sentence must not name a hand-counted number`,
    );
    assert.match(text, /using every free read\/verification tool is free/);
  }

  // The version the guide names is the source package's, read from package.json, never typed here.
  const v = packageJson.version.replace(/\./g, "\\.");
  assert.match(guide, /Every release published to npm so far is marked deprecated on npm/);
  assert.doesNotMatch(guide, /"args":\s*\[\s*"-y",\s*"csoai-gspc-mcp/);
  assert.match(
    guide,
    new RegExp(`repository currently prepares \`${v}\`, but that source version is\\s+\\*\\*not a\\s+published npm release\\*\\*`),
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
  assert.match(guide, new RegExp(`npm view csoai-gspc-mcp@${v} version`));
  assert.match(guide, /npm view csoai-gspc-mcp@latest deprecated/);
  assert.match(guide, /https:\/\/github\.com\/CSOAI-ORG\/councilof-ai/);
});
