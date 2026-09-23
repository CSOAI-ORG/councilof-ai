import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const footer = readFileSync(join(here, "Footer.tsx"), "utf8");
const clientIndex = readFileSync(join(root, "client/index.html"), "utf8");
const rootIndex = readFileSync(join(root, "index.html"), "utf8");

const SOURCE_SNAPSHOT = "https://huggingface.co/datasets/csoai/councilof-ai-source";
const EVIDENCE_MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-mirror";

test("public footer names the dated source snapshot and evidence mirror", () => {
  assert.match(footer, new RegExp(SOURCE_SNAPSHOT.replace(/[./]/g, "\\$&")));
  assert.match(footer, new RegExp(EVIDENCE_MIRROR.replace(/[./]/g, "\\$&")));
  assert.match(footer, /name: 'Dated source snapshot'/);
  assert.match(footer, /name: 'Public evidence mirror'/);
  assert.doesNotMatch(footer, /github\.com\/(?:CSOAI-ORG|CouncilofAI-CSOAI)/);
});

test("organization metadata points to publicly readable evidence", () => {
  for (const markup of [clientIndex, rootIndex]) {
    assert.match(markup, new RegExp(SOURCE_SNAPSHOT.replace(/[./]/g, "\\$&")));
    assert.match(markup, new RegExp(EVIDENCE_MIRROR.replace(/[./]/g, "\\$&")));
    assert.doesNotMatch(markup, /github\.com\/(?:CSOAI-ORG|CouncilofAI-CSOAI)/);
  }
});
