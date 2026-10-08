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
  assert.equal(catalog.free.length, 14);
  assert.equal(catalog.x402_metered.length, 5);

  // The version the guide names is the source package's, read from package.json, never typed here.
  const v = packageJson.version.replace(/\./g, "\\.");
  assert.match(guide, /Every stable release published to npm so far is marked deprecated on npm/);
  // Stable releases and the separately tagged prerelease have different npm states.
  assert.match(guide, /prerelease `next` tag points to `0\.2\.3-rc\.2`, which has no deprecation\s+flag/);
  assert.match(guide, /That prerelease is not the stable source\s+version `0\.2\.3`/);
  assert.match(guide, /npm view csoai-gspc-mcp@next version/);
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
