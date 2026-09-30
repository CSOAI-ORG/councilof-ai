// Every artefact the /connect#stacks section names must exist in the repo that produces it.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STACKS, PYPI, HELM_CHART, HELM_REPO, VERIFY_MODULE } from "./stackInstall";

const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("/connect#stacks names only what we publish", () => {
  it("PyPI names match the package metadata", () => {
    expect(read("packages/evidence-fabric/pypi/pyproject.toml")).toContain(`name = "${PYPI.fabric}"`);
    expect(read("packages/llama-stack-provider-csoai/pyproject.toml")).toContain(`name = "${PYPI.llamaStack}"`);
    expect(read("packages/nat-csoai-evidence/pyproject.toml")).toContain(`name = "${PYPI.nat}"`);
    expect(read("packages/nat-csoai-evidence/pyproject.toml")).toMatch(/^eval = \[/m);
  });
  it("the chart is packaged and indexed in public/helm/", () => {
    expect(read(`packages/helm/${HELM_CHART}/Chart.yaml`)).toContain(`name: ${HELM_CHART}`);
    const index = read("public/helm/index.yaml");
    expect(index).toContain(`${HELM_REPO}${HELM_CHART}-`);
    expect(HELM_REPO.endsWith("/")).toBe(true);
  });
  it("the verifier module is served at /lib/", () => {
    expect(existsSync(resolve(root, "public" + new URL(VERIFY_MODULE).pathname))).toBe(true);
  });
  it("every block says whether a marketplace lists it, and names what was not measured", () => {
    expect(STACKS.map((s) => s.id)).toEqual(["redhat", "nvidia", "crowdstrike", "cisco", "palantir"]);
    for (const s of STACKS) {
      expect(s.listing).toMatch(/^Official listing: /);
      expect(s.notMeasured).toMatch(/UNMEASURED|UNMEASURED\.|not run/);
      const text = [s.what, s.listing, s.notMeasured, ...s.steps.map((x) => x.text)].join(" ");
      expect(text).not.toMatch(/[$£€]\s?\d/);
      expect(text).not.toMatch(/\bcertif/i);
      expect(text).not.toMatch(/github\.com/i);
      expect(text).not.toMatch(/steering/i);
    }
  });
});
