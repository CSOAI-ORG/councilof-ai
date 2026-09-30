/**
 * Doctrine lint over every tool, skill and plugin description we publish (master plugin plan 3d, 2026-09-30).
 *
 * WHY. We measure; we never certify. The measurement surfaces were right and the words describing them
 * drifted (memory: descriptions rot faster than code). A tool description is read by a model that then
 * repeats it to a person, so a description that says a subject is "compliant", "certified" or "approved"
 * turns a measurement into a status we do not and cannot grant. This test reads every place a tool,
 * skill or plugin is described and fails on a compliance-status word unless the same clause negates it
 * ("not a conformity assessment", "never a certification", "does not certify").
 *
 * The scanner is scripts/harness-x/doctrine-lint.mjs, shared with scripts/harness-x/check.mjs.
 *
 * SCOPE (every published description surface):
 *   functions/mcp/gspc-tools.json + paid-tools.json   what tools/list serves on /mcp and /mcp/free
 *   public/.well-known/agent-card.json + agents/*.json the A2A skills and the per-tool agent cards
 *   distribution/**                                    every rendered platform package (Harness X),
 *                                                      except SUBMIT.md and MANIFEST.json (owner notes)
 *
 * FAILING FIRST (2026-09-30). The self-test block plants bad strings and requires violations; the real
 * scan was also run with "compliant" planted in board_totals' description in gspc-tools.json and failed
 * with exactly that one violation before the plant was removed.
 */
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  doctrineViolations,
  jsonViolations,
  fileViolations,
  distributionFiles,
} from "../../scripts/harness-x/doctrine-lint.mjs";

const ROOT = resolve(__dirname, "../..");

function describedSurfaces(): string[] {
  const agents = resolve(ROOT, "public/.well-known/agents");
  return [
    resolve(ROOT, "functions/mcp/gspc-tools.json"),
    resolve(ROOT, "functions/mcp/paid-tools.json"),
    resolve(ROOT, "public/.well-known/agent-card.json"),
    ...readdirSync(agents).filter((f) => f.endsWith(".json")).map((f) => join(agents, f)),
    ...distributionFiles(resolve(ROOT, "distribution")),
  ];
}

describe("doctrine lint — the scanner (failing first)", () => {
  it("flags a planted compliance-status word", () => {
    expect(doctrineViolations("Returns whether the model is compliant with Article 50.")).toHaveLength(1);
    expect(doctrineViolations("A certified result for your auditor.")).toHaveLength(1);
    expect(doctrineViolations("Board-approved evidence.")).toHaveLength(1);
    expect(doctrineViolations("This endpoint is regulated by us.")).toHaveLength(1);
    expect(doctrineViolations("Conformity evidence, ready to file.")).toHaveLength(1);
    expect(doctrineViolations("Guaranteed accurate.")).toHaveLength(1);
  });

  it("allows the negations the doctrine itself uses", () => {
    for (const ok of [
      "We measure; we do not certify.",
      "Measurement, not certification.",
      "never a conformity mark",
      "Evidence for Article 50 work — not a conformity assessment, certification, audit opinion or compliance determination; grants no status.",
      "not a rating, not a guarantee, not a conformity mark",
      "It is not the provider's technical documentation and never a conformity mark.",
      "nothing on the register is certification or endorsement.",
      'classifiers = ["License :: OSI Approved :: Apache Software License"]',
    ]) expect(doctrineViolations(ok), ok).toEqual([]);
  });

  it("a negation in an EARLIER sentence does not excuse the word", () => {
    expect(doctrineViolations("We do not rank. The model is compliant.")).toHaveLength(1);
  });

  it("JSON under a negation key is a denial by construction", () => {
    expect(jsonViolations({ explicitly_not: ["certification", "conformity-assessment"], description: "reads the board" }, "x")).toEqual([]);
    expect(jsonViolations({ description: "a certified reading" }, "x")).toHaveLength(1);
  });
});

describe("doctrine lint — every published tool, skill and plugin description", () => {
  const files = describedSurfaces();

  it("covers the served tool definitions, the A2A card and the rendered packages", () => {
    const rels = files.map((f) => relative(ROOT, f));
    expect(rels).toContain("functions/mcp/gspc-tools.json");
    expect(rels).toContain("functions/mcp/paid-tools.json");
    expect(rels).toContain("public/.well-known/agent-card.json");
    expect(rels.some((r) => r.startsWith("public/.well-known/agents/"))).toBe(true);
    expect(rels.filter((r) => r.startsWith("distribution/")).length).toBeGreaterThan(20);
  });

  it("no description makes a compliance-status claim", () => {
    const violations = files.flatMap((f) => fileViolations(f, ROOT));
    expect(violations.map((v: { where: string; word: string; context: string }) => `${v.where} [${v.word}] …${v.context}…`)).toEqual([]);
  });
});
