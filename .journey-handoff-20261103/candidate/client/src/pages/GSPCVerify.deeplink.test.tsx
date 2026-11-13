import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LinkedCardActions } from "./GSPCVerify";

describe("/gspc-verify ?card= deep-link actions", () => {
  const href = "https://councilof.ai/signed/cards/example.json";
  const html = renderToStaticMarkup(<LinkedCardActions href={href} file={new Blob(["{}"])} />);
  it("offers copy, save from captured bytes rather than a second fetch, and verify again", () => {
    expect(html).toContain('data-testid="linked-copy"');
    expect(html).toContain("Copy link");
    expect(html).toContain('data-testid="linked-download"');
    expect(html).toContain("Save loaded JSON");
    expect(html).not.toContain(`href="${href}" download=`);
    expect(html).toContain(`href="/gspc-verify/?card=${encodeURIComponent(href)}"`);
    expect(html).toContain("Verify again");
  });
  it("says nothing about safety or certification", () => {
    expect(html).not.toMatch(/safe|certif/i);
  });
});
