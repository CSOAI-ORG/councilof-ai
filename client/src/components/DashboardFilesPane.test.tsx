/**
 * DashboardFilesPane.test.tsx — a file is not signed because the upload succeeded.
 *
 * The pane hardcoded `signed: true` on every row and rendered it as a green "SIGNED". A 200
 * says the upload was accepted; it says nothing about whether anything was signed. This
 * estate's whole promise is that a signature is evidence, so asserting one nothing produced
 * is the single claim it cannot make.
 *
 * These cases are the shapes the endpoint actually returns: it may say signed true, signed
 * false, carry a signature string, or say nothing at all. Only the first two are verdicts.
 */
import { describe, expect, it } from "vitest";
import { signatureStateOf } from "./DashboardFilesPane";

describe("signatureStateOf", () => {
  it("reports SIGNED only when the endpoint says so", () => {
    expect(signatureStateOf({ signed: true })).toBe("SIGNED");
    expect(signatureStateOf({ signature: "3045022100ab…" })).toBe("SIGNED");
  });

  it("reports UNSIGNED when the endpoint says so", () => {
    expect(signatureStateOf({ signed: false })).toBe("UNSIGNED");
  });

  it("does not infer a signature from a successful upload", () => {
    // The defect, exactly. A response carrying a hash and nothing else is not a signature.
    expect(signatureStateOf({ sha256: "abc123" })).toBe("UNKNOWN");
    expect(signatureStateOf({})).toBe("UNKNOWN");
    expect(signatureStateOf(null)).toBe("UNKNOWN");
  });

  it("does not treat an empty signature string as a signature", () => {
    expect(signatureStateOf({ signature: "" })).toBe("UNKNOWN");
  });

  it("does not treat a truthy non-boolean as SIGNED", () => {
    // `signed: "pending"` must never read as signed.
    expect(signatureStateOf({ signed: "pending" })).toBe("UNKNOWN");
    expect(signatureStateOf({ signed: 1 })).toBe("UNKNOWN");
  });
});

describe("the pane's own source", () => {
  it("never hardcodes signed:true on a row again", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const raw = readFileSync(resolve(__dirname, "./DashboardFilesPane.tsx"), "utf8");
    // Strip comments before scanning. The header QUOTES the old defective line, and an earlier
    // version of this assertion matched its own explanatory prose — the same way a guard in
    // this lane once matched a route string written inside a comment. Prose about code is not
    // code, and a source guard that cannot tell the difference reports its own documentation.
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(
      /signed:\s*true/.test(src),
      "a row is being marked signed unconditionally again — read the state from the response",
    ).toBe(false);
    // And the failure paths that were missing entirely.
    expect(src).toContain("res.ok");
    expect(src).toContain("finally");
    expect(src).toContain('role="alert"');
  });
});
