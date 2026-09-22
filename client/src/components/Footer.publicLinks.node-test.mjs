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

const SOURCE_REPOSITORY = "https://github.com/CSOAI-ORG/councilof-ai";
const PUBLIC_PROFILE = "https://github.com/CouncilofAI-CSOAI";
const EVIDENCE_MIRROR = "https://github.com/CouncilofAI-CSOAI/csoai-public-evidence";

test("public footer distinguishes source, continuity profile, and evidence mirror", () => {
  assert.match(footer, new RegExp(SOURCE_REPOSITORY.replace(/[./]/g, "\\$&")));
  assert.match(footer, new RegExp(PUBLIC_PROFILE.replace(/[./]/g, "\\$&")));
  assert.match(footer, new RegExp(EVIDENCE_MIRROR.replace(/[./]/g, "\\$&")));
  assert.match(footer, /name: 'CSOAI source repository'/);
  assert.match(footer, /name: 'CSOAI public GitHub profile'/);
  assert.match(footer, /name: 'Public evidence mirror'/);
});

test("organization metadata uses exact public targets rather than the generic org root", () => {
  for (const markup of [clientIndex, rootIndex]) {
    assert.match(markup, new RegExp(SOURCE_REPOSITORY.replace(/[./]/g, "\\$&")));
    assert.match(markup, new RegExp(PUBLIC_PROFILE.replace(/[./]/g, "\\$&")));
    assert.doesNotMatch(markup, /"https:\/\/github\.com\/CSOAI-ORG"/);
  }
});
