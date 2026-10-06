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
    // The ?arm= presets moved out of Contact.tsx into lib/pilotEnquiry.ts (2026-09-30); Contact
    // applies them through enquiryPreset(window.location.search).
    const enquiry = readFileSync(resolve(__dirname, "../lib/pilotEnquiry.ts"), "utf8");
    expect(enquiry).toContain("run: 'Run / re-attest enquiry'");
    expect(contact).toContain("enquiryPreset(window.location.search)");
    // 2026-09-26: one mailbox, rendered plain (PlainEmail) so edge obfuscation cannot hide it.
    // Since 2026-09-30 the form opens a prepared draft (prepareContactEmail) addressed to the
    // site-wide contact address, the one the footer and /dispute publish, instead of a bare mailto.
    expect(contact).toContain("import PlainEmail, { CONTACT_MAILBOX } from '@/components/PlainEmail'");
    expect(contact).toContain("if (emailDraft.mailto) window.location.href = emailDraft.mailto;");
    expect(enquiry).toContain("return formatDraft(CONTACT_ENQUIRY_EMAIL, subject, body);");

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
