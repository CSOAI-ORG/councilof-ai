import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CouncilAcademy from "./CouncilAcademy";

describe("Academy HITL public-authority boundary", () => {
  it("exposes the real read-only decision record without claiming an authenticated human or execution", () => {
    const html = renderToStaticMarkup(createElement(CouncilAcademy));
    expect(html).toContain("how an authorised human decision is established");
    expect(html).toContain("shared operator token does not verify a person or grant execution authority");
    expect(html).toContain("not connected to the private MEOK H.I.M. runtime");
    expect(html).toContain('href="/api/hitl/record"');
    expect(html).toContain('href="/him"');
    expect(html).not.toContain("a named human decides");
    expect(html).toContain("issuance is not open yet");
  });
});
