// FAIL-FIRST white-label test (lead direction 30 Sep): a host config may rename the assistant and
// restyle the frame, but any attempt to hide, rename, restyle or relink the attribution is REJECTED
// as a whole, and the panel still draws "Evidence by GSPC · Council of AI" with its verify link.
// First red run (against a normalizeConfig that accepted every key) is in test/FAIL-FIRST.md.
import { describe, expect, it } from "vitest";
import { normalizeConfig, GspcConfigError } from "../src/config.js";
import { viewTree, textOf, region } from "../src/view.js";

const ATTR = "Evidence by GSPC · Council of AI";
const model = {
  schema: "csoai.gspc-panel-model/0.1",
  subject: { input: "https://tandem.ac/mcp", kind: "mcp_server" },
  state: "MEASURED",
  figures: [{ label: "Published capsules", value: 1 }],
  declared_vs_observed: { summary: null, rows: [] },
  signature: { state: "VALID", where: "councilof.ai verify_capsule" },
  corrections: [],
  sources: [],
  verify_url: "https://councilof.ai/verify-server?url=https%3A%2F%2Ftandem.ac%2Fmcp",
};

const HOSTILE = [
  { attribution: false },
  { hideAttribution: true },
  { attributionText: "Acme Evidence" },
  { showAttribution: false },
  { poweredBy: "Acme" },
  { verifyUrl: "https://acme.example/verify" },
  { footer: "none" },
  { branding: { hide: true } },
  { theme: { "--gspc-attribution-display": "none" } },
  { theme: { "--gspc-footer-bg": "transparent" } },
  { theme: { "--gspc-accent": "red; display:none" } },
  { assistantName: "Evidence by Acme" },
  { assistantName: "GSPC Council of AI Assistant" },
];

describe("white-label config", () => {
  it("accepts a partner config: name, logo, frame theme, locale, host context, read-only connectors", () => {
    const c = normalizeConfig({
      assistantName: "Acme Assistant",
      logoUrl: "https://acme.example/logo.svg",
      theme: { "--gspc-accent": "#6d28d9", "--gspc-radius": "2px" },
      locale: "en-GB",
      hostContext: { product: "Acme Console" },
      connectors: { projectId: "proj-42", mcpServers: ["https://tandem.ac/mcp"], agents: [] },
    });
    expect(c.assistantName).toBe("Acme Assistant");
    expect(c.connectors.readOnly).toBe(true);
    const tree = viewTree(model, { config: c, ask: { question: "", log: [], runner: "idle" } });
    expect(textOf(region(tree, "ask"))).toContain("Ask Acme Assistant");
    expect(textOf(region(tree, "attribution"))).toContain(ATTR);
    expect(textOf(region(tree, "connectors"))).toContain("read-only");
  });

  for (const cfg of HOSTILE)
    it(`rejects ${JSON.stringify(cfg)}`, () => {
      expect(() => normalizeConfig(cfg)).toThrow(GspcConfigError);
    });

  it("a rejected config is not partly applied, and the panel still carries the attribution", () => {
    let errors = [];
    let applied = null;
    try {
      applied = normalizeConfig({ assistantName: "Acme Assistant", hideAttribution: true });
    } catch (e) {
      errors = e.errors;
    }
    expect(applied).toBeNull();
    expect(errors.join(" ")).toMatch(/attribution/);
    const tree = viewTree(model, { configErrors: errors });
    expect(textOf(region(tree, "attribution"))).toContain(ATTR);
    expect(textOf(tree)).toContain("Host configuration rejected");
  });
});
