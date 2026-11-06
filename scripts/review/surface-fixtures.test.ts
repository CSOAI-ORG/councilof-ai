import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { literalRetirementRedirect } from "../../e2e/support/staticRedirects.mjs";
import { surfaceInventory } from "../../e2e/support/surfaceInventory.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
describe("surface test context is explicit and source-bound", () => {
  it("derives the retirement target from a complete unconditional handler", () => {
    const source = readFileSync(
      path.join(root, "functions/advisory.ts"),
      "utf8",
    );
    expect(literalRetirementRedirect(source)).toEqual({
      status: 308,
      location: "/os?lobby=home",
    });
    expect(
      literalRetirementRedirect(
        source.replace("/os?lobby=home", "/dashboard?tab=home"),
      ),
    ).toEqual({ status: 308, location: "/dashboard?tab=home" });
    expect(() =>
      literalRetirementRedirect(
        source.replace(
          "return new Response",
          "if (allowed) return new Response",
        ),
      ),
    ).toThrow("unconditional");
    expect(() =>
      literalRetirementRedirect(
        source.replace("/os?lobby=home", "//external.example"),
      ),
    ).toThrow("same-origin");
  });

  it("keeps frozen captured HTML as exact artifact reads and our website 404 as UI", () => {
    const inventory = surfaceInventory(root);
    const artifacts = inventory.cases.filter(
      (row) => row.execution === "artifact-read",
    );
    expect(artifacts.length).toBeGreaterThan(0);
    for (const row of artifacts) {
      expect(row.artifact.sha256).toBe(
        createHash("sha256")
          .update(readFileSync(path.join(root, row.artifact.source)))
          .digest("hex"),
      );
      expect(row.artifact.classification).toMatch(
        /frozen-http-capture|source-declared-tombstone/,
      );
    }
    expect(
      inventory.cases
        .filter(
          (row) =>
            row.kind === "public-html" &&
            /^\/interop\/.*\/mirrors\/.*\.html$/.test(row.url),
        )
        .every((row) => row.execution === "artifact-read"),
    ).toBe(true);
    expect(
      inventory.cases.find((row) => row.url === "/404.html")?.execution,
    ).not.toBe("artifact-read");
  });

  it("requires positive catalogue identities and actual model findings while respecting owner-gated details", () => {
    const inventory = surfaceInventory(root);
    const positive = inventory.cases.filter(
      (row) => row.kind === "published-entity",
    );
    for (const row of positive.filter((row) =>
      [
        "answers",
        "notes",
        "mcpServers",
        "hiveFrameworks",
        "approvedBlogs",
      ].includes(row.family),
    ))
      expect(row.expected.heading).toBeTruthy();
    for (const row of positive.filter(
      (row) => row.family === "modelsWithPublicNames",
    )) {
      expect(row.expected.heading).toBe(row.entityName);
      expect(row.expected.findingLinks.length).toBeGreaterThan(0);
      expect(
        row.expected.findingLinks.every(
          (href) => typeof href === "string" && href.length > 0,
        ),
      ).toBe(true);
    }
    const gated = inventory.entityLimits.ownerGatedAxisDetails;
    expect(gated).toEqual(
      expect.arrayContaining(["regulator-transparency", "watchdog-ingest"]),
    );
    expect(
      positive
        .filter((row) => row.family === "publicBoardAxisDetails")
        .some((row) => gated.includes(row.entityName)),
    ).toBe(false);
    expect(
      inventory.cases.find((row) => row.url === "/gspc/jail")?.expected,
    ).toEqual({ heading: "Jail folder", jailFolder: true });
  });
});
