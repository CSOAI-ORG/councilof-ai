import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LinkedCardActions } from "./GSPCVerify";

describe("/gspc-verify ?card= deep-link actions", () => {
  const href = "https://councilof.ai/signed/cards/example.json";
  const html = renderToStaticMarkup(<LinkedCardActions href={href} />);
  it("offers copy, download of the exact URL, and verify again", () => {
    expect(html).toContain('data-testid="linked-copy"');
    expect(html).toContain("Copy link");
    expect(html).toMatch(new RegExp(`<a[^>]*href="${href}"[^>]*download="example.json"`));
    expect(html).toContain(`href="/gspc-verify/?card=${encodeURIComponent(href)}"`);
    expect(html).toContain("Verify again");
  });
  it("says nothing about safety or certification", () => {
    expect(html).not.toMatch(/safe|certif/i);
  });
});
