import { describe, it } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyMoatSurfaces, HIM_REQUIRED_LINKS, MOAT_FILES } from "../verify-moat-surfaces.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const himPath = "client/src/pages/Him.tsx";

function withMutatedHim(mutate, inspect) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "csoai-moat-contract-"));
  try {
    for (const rel of MOAT_FILES) {
      const destination = path.join(fixtureRoot, rel);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const original = fs.readFileSync(path.join(repoRoot, rel), "utf8");
      fs.writeFileSync(destination, rel === himPath ? mutate(original) : original);
    }
    inspect(verifyMoatSurfaces({ repoRoot: fixtureRoot }));
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

describe("verify-moat-surfaces", () => {
  it("verifies all 5 CSOAI moat surface contracts and doctrine invariants", () => {
    const res = verifyMoatSurfaces();
    assert.equal(res.ok, true, JSON.stringify(res.checks));
    assert.equal(res.checks.length, 5);
    assert.equal(HIM_REQUIRED_LINKS.length, 4);
    for (const c of res.checks) {
      assert.equal(c.status, "PASS");
    }
  });

  const requiredCopy = [
    ["review-recording headline", "AI proposes. Review and record the decision."],
    ["non-autonomy disclosure", "Not autonomous"],
    ["recording-only operator token", "the operator token controls access to decision recording"],
    ["identity boundary", "establish the person's identity"],
    ["authorization boundary", "or authorize the proposed action"],
    ["execution/effect boundary", "Not an execution grant: a recorded review is separate from the acting system's authorization checks and any observed effect."],
  ];
  for (const [label, text] of [
    ...HIM_REQUIRED_LINKS.map((link) => [`review link ${link}`, link]),
    ...requiredCopy,
  ]) {
    it(`fails closed when the H.I.M. page loses its ${label}`, () => {
      withMutatedHim((source) => {
        assert.ok(source.includes(text), `fixture must contain ${label}`);
        return source.replaceAll(text, "REMOVED");
      }, (res) => {
        assert.equal(res.ok, false);
        assert.equal(res.checks.find((c) => c.id === "2_him_human_in_the_loop_contract").status, "FAIL");
        assert.ok(res.checks.filter((c) => c.id !== "2_him_human_in_the_loop_contract").every((c) => c.status === "PASS"));
      });
    });
  }

  it("preserves the H.I.M. copy contract across harmless whitespace changes", () => {
    withMutatedHim((source) => source.replaceAll(" ", "  "), (res) => {
      assert.equal(res.ok, true, JSON.stringify(res.checks));
    });
  });

  it("does not accept the former named-human headline as evidence of identity", () => {
    withMutatedHim((source) => source.replace(
      "AI proposes. Review and record the decision.",
      "AI proposes. A named human decides."
    ), (res) => {
      assert.equal(res.ok, false);
      assert.match(res.checks[1].detail, /review_recording=false/);
    });
  });
});

