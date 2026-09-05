import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaneHead } from "./paneKit";

describe("canonical native pane heading", () => {
  it("uses the dashboard's semantic type, colour and spacing contract", () => {
    const html = renderToStaticMarkup(
      <PaneHead eyebrow="Evidence pack" title="Compile an evidence index">
        A scoped description.
      </PaneHead>,
    );

    expect(html).toContain("<h1");
    expect(html).toContain("text-3xl");
    expect(html).toContain("text-foreground");
    expect(html).toContain("text-emerald-800");
    expect(html).toContain("text-muted-foreground");
    expect(html).not.toContain("text-slate-900");
  });
});
