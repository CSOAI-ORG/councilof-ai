/**
 * Re-test 7 Oct 2026, the Evidence pack and Embed kit panes in the Dashboard.
 *
 *  - Their help buttons did nothing: DashboardPane renders panes with no props, and both panes
 *    called onOpenRoute(...) unconditionally. Without an opener they must be real links.
 *  - The Evidence pane's first screen was a JSON index about other people's models. It must open
 *    on the plain lookup, with the board index tucked under "For developers".
 *  - The Embed kit handed out a widget that showed visitors a withdrawal notice.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LobbyEvidencePane from "./LobbyEvidencePane";
import LobbyEmbedPane from "./LobbyEmbedPane";
import { cardSnippet } from "@/lib/embedSnippet";

const here = dirname(fileURLToPath(import.meta.url));
const widget = readFileSync(resolve(here, "../../../../public/embed/verify.html"), "utf8");

describe("Evidence pack pane — first screen", () => {
  const html = renderToStaticMarkup(createElement(LobbyEvidencePane));

  it("asks for a model by name, in plain words", () => {
    expect(html).toContain("What evidence do we hold for your model?");
    expect(html).toMatch(/<form[^>]*role="search"/);
    expect(html).toContain('data-testid="evidence-ask"');
  });

  it("every help control is a working link when the host gives no opener (the Dashboard)", () => {
    for (const path of ["/gpai-evidence", "/gspc-verify", "/methodology"]) {
      expect(html).toContain(`href="${path}"`);
    }
    expect(html).not.toMatch(/<button[^>]*>(What an evidence pack is for|Check a signed card yourself|How we measure)</);
  });

  it("the board-wide JSON index is behind 'For developers', not first", () => {
    const dev = html.indexOf('data-testid="evidence-board-index"');
    expect(dev).toBeGreaterThan(-1);
    expect(html.slice(0, dev)).not.toMatch(/<pre/);
    expect(html).toMatch(/<details[^>]*data-testid="evidence-board-index"/);
    expect(html).not.toContain("Compile the evidence index for one system");
  });

  it("with a host opener, the help controls use it (the Council OS overlay)", () => {
    const withHost = renderToStaticMarkup(createElement(LobbyEvidencePane, { onOpenRoute: () => undefined }));
    expect(withHost).toMatch(/<button[^>]*data-testid="evidence-help-what"/);
  });
});

describe("Embed kit — the card widget it offers", () => {
  it("help controls are links without a host opener", () => {
    const html = renderToStaticMarkup(createElement(LobbyEmbedPane));
    expect(html).toContain('href="/embed"');
    expect(html).toContain('href="/gspc-verify"');
    expect(html).toContain("Checked signed card");
    expect(html).not.toMatch(/self-verifying/i);
  });

  it("the widget the snippet frames is not a withdrawal notice", () => {
    expect(cardSnippet("/signals/gov.signed.json")).toContain("https://councilof.ai/embed/verify?card=/signals/gov.signed.json");
    expect(widget).not.toMatch(/withdrawn|withdrawal/i);
  });

  it("the widget asks the live verifier and links to the in-browser check; it verifies nothing itself", () => {
    expect(widget).toContain('fetch("/api/verify", { method: "POST"');
    expect(widget).toContain('"/gspc-verify/?card=" + encodeURIComponent(raw)');
    // Three states, never two.
    for (const s of ["VALID", "INVALID", "UNCHECKABLE"]) expect(widget).toContain(`"${s}"`);
    // No second verifier: re-deriving the signed bytes by hand gets the float rule wrong.
    expect(widget).not.toMatch(/crypto\.subtle|Ed25519.*verify\(/);
    // Only paths on this site are loaded.
    expect(widget).toMatch(/raw\.indexOf\("\/\/"\) < 0/);
  });
});
