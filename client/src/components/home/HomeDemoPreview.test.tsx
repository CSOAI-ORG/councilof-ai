import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeDemoPreview from "./HomeDemoPreview";

describe("homepage product walkthrough", () => {
  it("does not request the video until a visitor chooses to play it", () => {
    const html = renderToStaticMarkup(<HomeDemoPreview />);
    expect(html).toContain('data-testid="home-demo-preview"');
    expect(html).toContain('aria-label="Play the Council of AI product walkthrough"');
    expect(html).toContain('/videos/csoai-demo.jpg');
    expect(html).not.toContain("<video");
  });
});
