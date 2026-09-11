import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Frameworks from "./Frameworks";

/**
 * Structure and labels only — the rows, dates and as_of all render from the
 * register (client/src/data/frameworks.json); a test that pins a lab's version
 * or date is a test that goes stale on purpose.
 */
describe("/frameworks presence register", () => {
  const html = renderToStaticMarkup(<Frameworks />);

  it("renders the measured-presence frame with the doctrine lines", () => {
    expect(html).toContain("measured presence");
    expect(html).toContain("measurement, not certification");
    expect(html).toContain("never their quality");
    expect(html).toContain("not a finding of unsafe practice");
  });

  it("carries the register as_of in the header", () => {
    expect(html).toContain("as_of");
  });

  it("renders the published table, every row sourced", () => {
    expect(html).toContain('data-testid="frameworks-published"');
    expect(html).toContain("Published");
    expect(html).toContain("Framework");
    expect(html).toContain("Doc date");
    expect(html).toContain("official document");
    expect(html).toContain("OpenAI");
    expect(html).toContain("Anthropic");
    expect(html).toContain("Google DeepMind");
    expect(html).toContain("Meta");
    expect(html).toContain("xAI");
  });

  it("renders the empty chairs with their search method stated", () => {
    expect(html).toContain('data-testid="frameworks-empty-chairs"');
    expect(html).toContain("Empty chairs");
    expect(html).toContain("No published framework found");
    expect(html).toContain("DeepSeek");
    expect(html).toContain("Mistral AI");
    expect(html).toContain("Moonshot AI");
    expect(html).toContain("none found");
    expect(html).toContain("concurs");
  });

  it("states that an empty chair is a search outcome, not a verdict", () => {
    expect(html).toContain("not a verdict");
    expect(html).toContain("appended, never silently edited");
  });

  it("links the cross-confirmation indexes", () => {
    expect(html).toContain("FLI AI Safety Index");
    expect(html).toContain("METR");
  });
});
