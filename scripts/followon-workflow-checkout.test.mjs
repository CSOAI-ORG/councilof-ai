// @vitest-environment node
// Offline source-structure regressions for the two existing follow-on workflows.
// This is not a YAML parser or the GitHub Actions expression engine. No workflow,
// checkout, publisher, child process, network request or selector evaluator runs.
// Event-resolution examples are separate unexecuted case DATA in the owner packet.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REF = "${{ github.event_name == 'workflow_run' && github.event.workflow_run.head_sha || github.sha }}";
const ADDED = `        with:\n          ref: ${REF}\n`;
const WORKFLOWS = [
  {
    path: ".github/workflows/npm-gspc-release.yml",
    relative: "../.github/workflows/npm-gspc-release.yml",
    checkout: "      - uses: actions/checkout@v6",
    before: { bytes: 2826, sha256: "60b2f343d25712d11c88214fd1f380572d6eece117971820ac41464a156a483c" },
    after: { bytes: 2950, sha256: "585f6f5d1e6048f7d309fe3ebddc39fa73206f223f682946bdfb8fe089408e36" },
  },
  {
    path: ".github/workflows/kaggle-community-cells.yml",
    relative: "../.github/workflows/kaggle-community-cells.yml",
    checkout: "      - uses: actions/checkout@v4",
    before: { bytes: 6382, sha256: "d1cad74f5aad1335f45bf9d88019f53d91f903fea597177ce4824fdec4d5a950" },
    after: { bytes: 6506, sha256: "c0d8173d70c8dde7c8b08f4f3801b187de6712f2aa1fe9b119480be86dfa3b65" },
  },
];
const digest = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const occurrences = (text, part) => text.split(part).length - 1;

// Deliberately limited to the exact reviewed single-checkout layout. Reject an
// unexpected layout instead of claiming general YAML or Actions interpretation.
function checkoutContract(text, contract) {
  const lines = text.split("\n");
  const checkoutRows = lines.filter((line) => /^\s*-\s+uses:\s*actions\/checkout@/.test(line));
  if (checkoutRows.length !== 1 || checkoutRows[0] !== contract.checkout) {
    throw new Error("Exactly one unchanged checkout action is required");
  }
  const index = lines.indexOf(contract.checkout);
  if (lines[index + 1] !== "        with:" || !lines[index + 2]?.startsWith("          ref: ")) {
    throw new Error("Explicit checkout.with.ref is required");
  }
  const expression = lines[index + 2].slice("          ref: ".length);
  if (expression !== REF) throw new Error("Checkout ref expression changed");
  if (lines[index + 3] !== "") throw new Error("Unexpected checkout fields or layout");
  return { checkout: checkoutRows[0], expression };
}

function removeOnlyReviewedAddition(text, contract) {
  const block = contract.checkout + "\n" + ADDED;
  if (occurrences(text, block) !== 1) throw new Error("Reviewed checkout block must be unique");
  return text.replace(block, contract.checkout + "\n");
}

function replaceOnce(text, oldText, newText) {
  if (occurrences(text, oldText) !== 1) throw new Error("Mutation fixture must have one exact target");
  return text.replace(oldText, newText);
}

for (const contract of WORKFLOWS) {
  describe(`follow-on checkout structural contract: ${contract.path}`, () => {
    const source = readFileSync(fileURLToPath(new URL(contract.relative, import.meta.url)), "utf8");

    it("binds the complete actual workflow to the exact reviewed postimage", () => {
      expect(Buffer.byteLength(source, "utf8")).toBe(contract.after.bytes);
      expect(digest(source)).toBe(contract.after.sha256);
    });

    it("requires the explicit deploy-head expression on the unchanged checkout action", () => {
      expect(checkoutContract(source, contract)).toEqual({ checkout: contract.checkout, expression: REF });
    });

    it("removing only the two added lines restores every original workflow byte", () => {
      const original = removeOnlyReviewedAddition(source, contract);
      expect(Buffer.byteLength(original, "utf8")).toBe(contract.before.bytes);
      expect(digest(original)).toBe(contract.before.sha256);
      // Whole-byte inversion protects triggers, job trust/conditions, permissions,
      // dry-run/skip behavior, commands, provenance, versions and runtimes as text.
      // It does not execute or independently validate those runtime behaviors.
    });

    it("rejects the old implicit/default checkout as the regression negative control", () => {
      const original = removeOnlyReviewedAddition(source, contract);
      expect(digest(original)).toBe(contract.before.sha256);
      expect(() => checkoutContract(original, contract)).toThrow("Explicit checkout.with.ref is required");
    });

    it("rejects event github.sha alone in place of the triggering-deploy head", () => {
      const changed = replaceOnce(source, REF, "${{ github.sha }}");
      expect(() => checkoutContract(changed, contract)).toThrow("Checkout ref expression changed");
      // This guards the actual field reference needed when deploy head A differs
      // from event github.sha B. It does not pretend to resolve A/B with an engine.
    });

    it("rejects deletion of the manual-dispatch and empty-head fallback", () => {
      const changed = replaceOnce(source, REF, "${{ github.event_name == 'workflow_run' && github.event.workflow_run.head_sha }}");
      expect(() => checkoutContract(changed, contract)).toThrow("Checkout ref expression changed");
      // The reviewed || github.sha fallback remains intentional; this test does
      // not turn an empty workflow_run head into fail-closed behavior.
    });

    it("rejects a second checkout rather than silently validating one of them", () => {
      const changed = source + "\n" + contract.checkout + "\n" + ADDED + "\n";
      expect(() => checkoutContract(changed, contract)).toThrow("Exactly one unchanged checkout action is required");
    });
  });
}
