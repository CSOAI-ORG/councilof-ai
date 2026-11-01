/**
 * /services/ must not publish a URL template as a link.
 *
 * 2026-10-13: the outward gate (hygiene.internal_links) found one failing link among the 91 on
 * /services/: <a href="https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1">,
 * HTTP 400. Every preview on that page is rendered by <ServicePreview>, from the manifest's own
 * `free_preview`, so this renders the component over every preview the rail publishes and reads
 * the markup the way the gate does (scripts/internal-links-check.mjs: every href, resolved).
 *
 * The previews come from two files this repo already holds, never from a list typed here:
 *   scripts/fixtures/x402scan/well_known_x402.json   the captured /.well-known/x402.json
 *   council-os/capabilities.json                     the declaration that manifest is rendered from
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { hasSlot } from "@/lib/previewTemplate";
import { isPlaceholderLink, linksInHtml } from "../../../scripts/internal-links-check.mjs";
import { ServicePreview } from "./ServicePreview";

const ROOT = resolve(__dirname, "../../..");
const J = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
const ORIGIN = "https://councilof.ai";

const captured: string[] = (J("scripts/fixtures/x402scan/well_known_x402.json").resources as Array<{ free_preview?: string }>)
  .map((r) => r.free_preview)
  .filter((p): p is string => typeof p === "string" && p.length > 0);
const declared: string[] = (J("council-os/capabilities.json").capabilities as Array<{ free_preview?: string }>)
  .map((c) => c.free_preview)
  .filter((p): p is string => typeof p === "string" && p.length > 0)
  .map((p) => (p.startsWith("/") ? ORIGIN + p : p));
/** The template the gate followed. Kept here so the test still bites if the rail stops publishing it. */
const REPRO = `${ORIGIN}/api/wrapper?id=<wrapped-symbol:chain>&preview=1`;
const templates = [...new Set([REPRO, ...captured, ...declared])];
const slotted = templates.filter(hasSlot);
const concrete = templates.filter((t) => !hasSlot(t));

/** The preview column of the page: one <ServicePreview> per door, as Services.tsx renders it. */
const page = (list: string[]) =>
  "<!doctype html><html><body>" +
  renderToStaticMarkup(<>{list.map((t) => <ServicePreview key={t} template={t} />)}</>) +
  "</body></html>";

describe("the Services previews carry no template as a link", () => {
  it("is not vacuous: both files were read, and both kinds of preview are in the set", () => {
    expect(captured.length, "scripts/fixtures/x402scan/well_known_x402.json carried no free_preview").toBeGreaterThan(0);
    expect(declared.length, "council-os/capabilities.json declared no free_preview").toBeGreaterThan(0);
    expect(concrete.length).toBeGreaterThan(0);
    expect(slotted).toContain(REPRO);
  });

  it("lists zero failing internal links over every published preview", () => {
    const links = linksInHtml(page(templates));
    expect(links.filter(isPlaceholderLink)).toEqual([]);
    // every concrete preview is still a link, and nothing else is
    expect(links.length).toBe(concrete.length);
  });

  it("shows each template as code text, with a field to fill, and no anchor", () => {
    for (const t of slotted) {
      const html = renderToStaticMarkup(<ServicePreview template={t} />);
      expect(html, t).toContain('data-testid="service-preview-pattern"');
      expect(html, t).not.toContain("<a ");
      expect(html, t).not.toContain("href=");
      // the template is there to read, escaped as text
      expect(html, t).toContain(t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  });

  it("asks for the slot before it offers the wrapper preview", () => {
    const html = renderToStaticMarkup(<ServicePreview template={REPRO} />);
    expect(html).toContain("wrapped-symbol:chain");
    expect(html).toContain("<input");
    expect(html).toContain("Enter the required value to open the free preview.");
  });

  it("says so, rather than linking, when the slot is somewhere it cannot offer a field for", () => {
    for (const t of [
      `${ORIGIN}/agent-cards/<host>/`,
      // one slot it could offer a field for and one it could not: no field, because no entry could succeed
      `${ORIGIN}/stablecoins/<asset>/?chain=<chain>&preview=1`,
    ]) {
      const html = renderToStaticMarkup(<ServicePreview template={t} />);
      expect(html, t).not.toContain("href=");
      expect(html, t).not.toContain("<input");
      expect(html, t).toContain("This address is a pattern to fill in, so no link is shown.");
      expect(html, t).toContain('data-testid="service-preview-pattern"');
    }
  });

  it("leaves a concrete preview exactly as the manifest published it", () => {
    for (const t of concrete) {
      const html = renderToStaticMarkup(<ServicePreview template={t} />);
      expect(html, t).toContain(`href="${t.replace(/&/g, "&amp;")}"`);
      expect(html, t).not.toContain("service-preview-pattern");
    }
  });
});
