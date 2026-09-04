import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RelevanceMap from "./RelevanceMap";

describe("relevance map claim boundary", () => {
  it("maps evidence to relevant frameworks without promising compliance", () => {
    const html = renderToStaticMarkup(<RelevanceMap />);
    expect(html).toContain("maps evidence to frameworks relevant to its use");
    expect(html).toContain("Relevance is not a compliance verdict");
    expect(html).not.toContain("makes you compliant with");
  });
});
