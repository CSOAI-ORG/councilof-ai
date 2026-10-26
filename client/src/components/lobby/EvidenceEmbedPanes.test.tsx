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
import { describe, expect, it, vi } from "vitest";
import LobbyEvidencePane, { revealAnswer } from "./LobbyEvidencePane";
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

describe("Evidence pack pane — the answer is brought into view (375 px repair)", () => {
  it("scrolls the answer card's top into view and focuses its heading without a second scroll", () => {
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    expect(revealAnswer({ scrollIntoView }, { focus })).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", inline: "nearest", behavior: "smooth" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("jumps instantly for reduced-motion readers", () => {
    const scrollIntoView = vi.fn();
    revealAnswer({ scrollIntoView }, null, true);
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("reports nothing revealed when there is no card yet (still loading)", () => {
    expect(revealAnswer(null)).toBe(false);
  });

  it("the card clears the Dashboard composer when scrolled to", () => {
    const html = renderToStaticMarkup(createElement(LobbyEvidencePane));
    // The pane source wires the ref and the scroll margins; the first screen has no card yet.
    expect(html).not.toContain('data-testid="evidence-answer"');
    const src = readFileSync(resolve(here, "LobbyEvidencePane.tsx"), "utf8");
    expect(src).toMatch(/scroll-mt-4 scroll-mb-40/);
    expect(src).toMatch(/revealAnswer\(answerRef\.current, headingRef\.current/);
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
