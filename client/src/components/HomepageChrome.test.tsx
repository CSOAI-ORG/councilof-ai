import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { Router } from "wouter";
import { Footer } from "./Footer";
import { Header } from "./Header";

const widgets = vi.hoisted(() => ({
  stats: vi.fn(), authority: vi.fn(), platforms: vi.fn(), memberships: vi.fn(),
}));
vi.mock("./momentum/FooterStats", () => ({ default: () => { widgets.stats(); return <div data-footer-widget="stats" />; } }));
vi.mock("./AuthoritySignals", () => ({ default: () => { widgets.authority(); return <div data-footer-widget="authority" />; } }));
vi.mock("./FooterVerifyStrip", () => ({ default: () => { widgets.platforms(); return <div data-footer-widget="platforms" />; } }));
vi.mock("./MembershipStrip", () => ({ default: () => { widgets.memberships(); return <div data-footer-widget="memberships" />; } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));

const renderAt = (path: string, element: ReactNode) => renderToStaticMarkup(<Router ssrPath={path}>{element}</Router>);
beforeEach(() => { Object.values(widgets).forEach((spy) => spy.mockClear()); });

describe("site chrome is the same on the home page as on every other route", () => {
  // Owner, 2026-11-16: the home page carries the same footer as /about/ and every other public page.
  // Until then "/" rendered a shorter footer: three essentials groups, the directory folded into a
  // <details>, and none of the evidence rows or the trust row.
  it("renders the home page footer exactly as on every other public page", () => {
    const home = renderAt("/", <Footer />);
    expect(home).toBe(renderAt("/methodology/", <Footer />));
    expect(home).not.toContain("<details");
    expect(home).toContain("Reference frameworks");
    expect(home).toContain('data-testid="footer-trust-row"');
    for (const href of ["/root.json", "/feeds/records.xml", "/.well-known/did.json", "/corrections/", "/.well-known/security.txt", "/terms-of-service/"]) {
      expect(home).toContain(`href="${href}"`);
    }
    expect(home).toContain("Registered in England &amp; Wales No. 16939677");
  });

  it("names the public contact address once, and not a personal one", () => {
    const html = renderAt("/", <Footer />);
    const text = html.replace(/<[^>]*>/g, " ");
    expect(text.split("contact@csoai.org").length - 1).toBe(1);
    expect(text.split("To object to, dispute or request a correction").length - 1).toBe(1);
    expect(html).not.toContain("nicholas@csoai.org");
    expect(html).toContain('href="mailto:contact@csoai.org"');
    expect(html).toContain('href="/dispute/"');
  });

  it("preserves the existing footer widgets and directory on other public pages", () => {
    const html = renderAt("/methodology/", <Footer />);
    expect(html).not.toContain("<details");
    Object.values(widgets).forEach((spy) => expect(spy).toHaveBeenCalledOnce());
    expect(html).toContain("Reference frameworks");
    expect(html).toContain('href="/terms-of-service/"');
  });

  it("carries the master menu on the home page, with the same groups as other routes", () => {
    const html = renderAt("/", <Header />);
    const groups = (markup: string) => [...markup.matchAll(/data-nav-trigger="([^"]+)"/g)].map((m) => m[1]);
    expect(groups(html).length).toBeGreaterThan(0);
    expect(groups(html)).toEqual(groups(renderAt("/methodology/", <Header />)));
    expect(html).not.toContain('href="/#how-it-works"');
    expect(html).toContain('data-testid="ask-launcher"');
    expect(html).toContain('data-testid="palette-launcher"');
    expect(html).toContain('data-testid="header-council-os"');
    expect(html.match(/data-testid="header-book-measurement"/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/assess\/"[^>]*data-testid="header-book-measurement"/);
  });

  it("keeps the established dropdown navigation and measurement enquiry on other routes", () => {
    const html = renderAt("/methodology/", <Header />);
    expect(html).toContain("data-nav-trigger=");
    expect(html).toContain('data-testid="header-book-measurement"');
    expect(html).not.toContain('href="/#how-it-works"');
  });
});
