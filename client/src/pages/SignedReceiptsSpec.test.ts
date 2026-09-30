import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const bytes = (p: string) => readFileSync(root + p);
const sha = (p: string) => createHash("sha256").update(bytes(p)).digest("hex");

describe("/spec/signed-receipts — the specification text is exact", () => {
  it("the rendered copy, the served copy and the pinned source mirror copy are the same bytes", () => {
    expect(bytes("client/src/data/signed-receipts-v1-SPEC.md").equals(bytes("public/spec/signed-receipts/v1/SPEC.md"))).toBe(true);
    // sha256 of SPEC.md at huggingface.co/datasets/csoai/councilof-ai-source @ 96bf3a07 (contributions/a2a-signed-receipts/f80de2731ceb)
    expect(sha("public/spec/signed-receipts/v1/SPEC.md")).toBe("f5a7400b1963473718156d14e70df6c640ee12881e6c56dc5ecbfac0e9e43efa");
    // Draft 0.3 (2026-09-28) is a new file beside draft 0.2, never an edit of it: these are the bytes prepared for its deposit.
    expect(sha("public/spec/signed-receipts/v1/draft-0.3/SPEC.md")).toBe("91520cda9998c613377f1cdae2ae7a8dc5464cf3eab1f3f6a5ef269e0d938f58");
    expect(readFileSync(root + "client/src/pages/SignedReceiptsSpec.tsx", "utf8")).toContain("${BASE}/draft-0.3/SPEC.md");
    // interceptor.py and its tests were corrected on 2026-09-28 (SCITT architecture #462: no VALID on an
    // unresolvable key; RFC 8785 astral-char and number serialisation). The mirror @ 96bf3a07 holds the
    // pre-correction pair (d908b9e723cf1525 / b487db05b60bf4bf); these pins are the served bytes.
    expect(sha("public/spec/signed-receipts/v1/interceptor.py").startsWith("b79ed7fe59229587")).toBe(true);
    expect(sha("public/spec/signed-receipts/v1/test_interceptor.py").startsWith("1d204e03399a3b29")).toBe(true);
  });

  it("states the third-party fact exactly as verified, and nothing stronger", () => {
    const flat = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\{" "\}/g, " ").replace(/\s+/g, " ");
    const page = flat(readFileSync(root + "client/src/pages/SignedReceiptsSpec.tsx", "utf8"));
    expect(page).toContain(
      "The independent conformance suite @fractalai/pqc-agent-receipts-conformance (npm 0.3.1) includes a profile, a2a-receipt-ml-dsa-65, that reuses the CSOAI signed-receipts/v1 receipt object with an ML-DSA-65 signature.",
    );
    const prose = page.replace(/\/\*\*[\s\S]*?\*\//g, "");
    expect(prose).not.toMatch(/\b(implement(s|ed)? our|adopt(s|ed|ion)|endorse|partner|certif(y|ied))/i);
  });
});

describe("/spec/signed-receipts/v1/conformance — the kit says what it measures", () => {
  const dir = root + "public/spec/signed-receipts/v1/conformance/";
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [dir + "run.mjs", ...args, "--vectors", dir + "vectors.json"], { encoding: "utf8" });
  const vectors = JSON.parse(readFileSync(dir + "vectors.json", "utf8"));

  it("has the SCITT #462 third result, and never expects VALID for an unresolvable key", () => {
    expect(Object.keys(vectors.results).sort()).toEqual(["INVALID", "UNVERIFIABLE_KEY", "VALID"]);
    const unresolvable = vectors.cases.filter((c: { did_documents: Record<string, unknown>; receipt: { signature?: { kid?: string } } }) => {
      const did = String(c.receipt.signature?.kid ?? "").split("#")[0];
      return did && !(did in c.did_documents);
    });
    expect(unresolvable.length).toBeGreaterThanOrEqual(3);
    for (const c of unresolvable) expect(c.expected).not.toBe("VALID");
  });

  it("the reference results match every case and a known-wrong candidate does not", () => {
    const ok = run(dir + "reference-results.json");
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
    expect(ok.stdout).toMatch(/ALL MATCH: core 17\/17 PASS, interop 4 PASS \/ 0 FAIL/);
    const self = run("--self");
    expect(self.status, self.stdout + self.stderr).toBe(0);
    const bad = run(dir + "example-fail-results.json");
    expect(bad.status).toBe(1);
    expect(bad.stdout).toMatch(/FAIL\s+unresolvable-key\s+expected UNVERIFIABLE_KEY got VALID/);
  });

  it("credits the interop vectors and claims no certification", () => {
    expect(vectors.interop.source.package).toBe("@fractalai/pqc-agent-receipts-conformance");
    expect(vectors.interop.source.version).toBe("0.3.1");
    expect(vectors.interop.source.license).toMatch(/^Apache-2\.0/);
    const page = readFileSync(dir + "index.html", "utf8").replace(/<[^>]+>/g, " ");
    expect(page).toContain("It is not a certification");
    expect(page).not.toMatch(/\b(compliant|certified|conformant)\b/i);
    expect(page).toContain("nicholas@csoai.org");
    expect(page).toMatch(/without their written consent/);
  });
});
