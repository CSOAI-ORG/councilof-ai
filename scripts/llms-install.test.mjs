import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

const root = new URL("../", import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("llms install guide matches the canonical MCP identity and tool catalog", async () => {
  const [guide, publicGuide, descriptor, packageJson, free, paid, capture] = await Promise.all([
    readFile(new URL("llms-install.md", root), "utf8"),
    readFile(new URL("public/llms-install.md", root), "utf8"),
    json("mcp/gspc-server/server.json"),
    json("mcp/gspc-server/package.json"),
    json("functions/mcp/gspc-tools.json"),
    json("functions/mcp/paid-tools.json"),
    json("distribution/npm/npm-publish-check.json"),
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
  // DERIVED, never typed. The guide's catalogue must be the canonical tool set, so the
  // count it holds is the count the door serves — a typed number here turned every
  // legitimate growth of the fleet into a red build (it said 47 while the door served
  // 48). The deepEqual above is the real guard: a tool added to the canonical set and
  // missing from the guide still fails.
  assert.equal(catalog.free.length, free.tools.length);
  assert.equal(catalog.x402_metered.length, paid.tools.length);

  // The prose count and the prose wording are held to the catalogue, so neither can drift.
  // "the same N names" must be N = free + x402-metered, and the free-tool sentence must not
  // name a hand-counted number: a published sentence that reads "all eight read/verification
  // tools" while the door serves 47 free tools is a false claim, not a style question.
  // BOTH copies are held: llms-install.md and public/llms-install.md are hand-maintained
  // separately, and the published one is the one a reader opens.
  const catalogTotal = catalog.free.length + catalog.x402_metered.length;
  for (const [label, text] of [
    ["llms-install.md", guide],
    ["public/llms-install.md", publicGuide],
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
  // The published npm release is a DATED FACT about the published tarball and about the live
  // door, so it is not typed here either. It is read from the one dated record that measured
  // it — distribution/npm/npm-publish-check.json, written by
  // scripts/harness-x/npm-publish-live.mjs — so the guide and this test cannot drift from
  // each other and neither can be wrong about npm on its own. A capture is never edited: when
  // npm publishes or the door moves, a NEW capture is written and both are corrected against it.
  const published = capture.published;
  const diff = capture.diff;
  const pubTotal = published.free_tools + published.metered_tools;
  assert.notEqual(
    published.version,
    packageJson.version,
    "the prepared version must differ from the published one: a published version cannot be re-published",
  );
  assert.ok(
    pubTotal <= catalogTotal,
    "a published release cannot carry more names than the live fleet",
  );
  // GROWTH IS PUBLISHED, SHRINKAGE IS DRIFT. The fleet may gain a tool — that is the estate
  // working — but it must not lose one, and every name the capture records as live-only must
  // still be in the canonical set the guide publishes.
  assert.ok(
    catalogTotal >= pubTotal + diff.live_only.length,
    "the fleet must not have shrunk below the published release plus the names the capture records as live-only",
  );
  for (const name of diff.live_only) {
    assert.ok(
      catalog.free.includes(name),
      `the capture records ${name} as live-only, so it must be in the canonical free set`,
    );
  }
  // The guide must state the capture's facts, in BOTH copies: two copies of the same claim are
  // two files and are corrected separately. And it must state the DIFFERENCE the capture
  // records, not a parity it no longer has — "zero names differ" while the capture names a
  // live-only tool is a false claim about a published package.
  const differs = diff.live_only.length > 0 || diff.published_only.length > 0;
  for (const [label, text] of [
    ["llms-install.md", guide],
    ["public/llms-install.md", publicGuide],
  ]) {
    assert.match(
      text,
      new RegExp("`" + published.version.replace(/\./g, "\\.") + "`"),
      `${label} must name the published release`,
    );
    assert.match(
      text,
      new RegExp(String(pubTotal) + " tool names"),
      `${label} must state how many names the published tarball carries`,
    );
    assert.match(
      text,
      new RegExp(published.published_at.replace(/\./g, "\\.")),
      `${label} must carry the publish timestamp of the published release`,
    );
    assert.match(
      text,
      new RegExp("live door\\s+served " + capture.live_door.total_tools + " names"),
      `${label} must state how many names the live door served`,
    );
    if (differs) {
      assert.doesNotMatch(
        text,
        /Zero names differ in either direction/,
        `${label} must not claim name-for-name parity while the capture records a difference`,
      );
      assert.doesNotMatch(
        text,
        /carries the same \d+ tool names as the live door/,
        `${label} must not claim the published tarball matches the live door while the capture records a difference`,
      );
      for (const name of diff.live_only) {
        assert.match(
          text,
          new RegExp("`" + name + "`"),
          `${label} must name ${name}, the name the capture records as live-only`,
        );
      }
    } else {
      assert.match(
        text,
        /carries the same \d+ tool names as the live door/,
        `${label} must state the parity the capture records`,
      );
    }
  }
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
