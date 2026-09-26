import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ToolStack from "../components/home/ToolStack";
import HomeNavigator from "../components/home/HomeNavigator";

describe("/how-we-work measured-run route", () => {
  it("sends fresh-run enquiries to the working contact route, separate from receipt-only RAS", () => {
    const how = readFileSync(resolve(__dirname, "HowWeWork.tsx"), "utf8");
    const contact = readFileSync(resolve(__dirname, "Contact.tsx"), "utf8");
    expect(how).toContain("<ToolStack />");
    expect(how).toContain("<LivingStages />");
    expect(how).toContain("<HomeNavigator />");
    expect(contact).toContain('run: "Run / re-attest enquiry"');
    // 2026-09-26: one mailbox, rendered plain (PlainEmail) so edge obfuscation cannot hide it.
    expect(contact).toContain("window.location.href = `mailto:${CONTACT_MAILBOX}");

    const tiles = renderToStaticMarkup(<ToolStack />);
    const runTile = tiles.match(/<article id="tool-measured"[\s\S]*?<\/article>/)?.[0] ?? "";
    expect(runTile).toContain('href="/contact?arm=run"');
    expect(runTile).toContain("Enquire about a run");
    expect(runTile).toContain("Scoped runs are arranged by enquiry");
    expect(runTile).not.toContain('href="/assess"');

    const navigator = renderToStaticMarkup(<Router ssrPath="/how-we-work"><HomeNavigator /></Router>);
    expect(navigator).toContain('href="/contact/?arm=run"');
    expect(navigator).toContain("Ask about measuring your system");
    expect(navigator).not.toContain('href="/assess"');

    // LivingStages imports a published witness JSON outside this sparse worktree.
    // Assert its actual CTA source rather than stubbing that evidence file.
    const stages = readFileSync(resolve(__dirname, "../components/home/LivingStages.tsx"), "utf8");
    expect(stages).toContain('href: "/contact/?arm=run", label: "Enquire about a scoped run"');
    expect(stages).not.toContain('href: "/assess", label: "Request a scoped measurement"');
  });
});
