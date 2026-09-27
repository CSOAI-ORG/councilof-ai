import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const bytes = (p: string) => readFileSync(root + p);
const sha = (p: string) => createHash("sha256").update(bytes(p)).digest("hex");

describe("/spec/signed-receipts — the specification text is exact", () => {
  it("the rendered copy, the served copy and the pinned source mirror copy are the same bytes", () => {
    expect(bytes("client/src/data/signed-receipts-v1-SPEC.md").equals(bytes("public/spec/signed-receipts/v1/SPEC.md"))).toBe(true);
    // sha256 of SPEC.md at huggingface.co/datasets/csoai/councilof-ai-source @ 96bf3a07 (contributions/a2a-signed-receipts/f80de2731ceb)
    expect(sha("public/spec/signed-receipts/v1/SPEC.md")).toBe("f5a7400b1963473718156d14e70df6c640ee12881e6c56dc5ecbfac0e9e43efa");
    expect(sha("public/spec/signed-receipts/v1/interceptor.py").startsWith("d908b9e723cf1525")).toBe(true);
    expect(sha("public/spec/signed-receipts/v1/test_interceptor.py").startsWith("b487db05b60bf4bf")).toBe(true);
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
