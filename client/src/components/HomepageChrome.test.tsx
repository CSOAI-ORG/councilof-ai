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

describe("homepage site chrome", () => {
  it("keeps the full directory in a native, initially collapsed disclosure without mounting duplicate live widgets", () => {
    const html = renderAt("/", <Footer />);
    expect(html).toMatch(/<details\b[^>]*>/);
    expect(html).not.toMatch(/<details\b[^>]*\bopen(?:=|\s|>)/);
    expect(html).toContain('href="/root.json"');
    expect(html).toContain('href="/feeds/records.xml"');
    expect(html).toContain('href="/.well-known/did.json"');
    expect(html).toContain('href="/corrections/"');
    expect(html).toContain('href="/.well-known/security.txt"');
    expect(html).toContain("Registered in England &amp; Wales No. 16939677");
    Object.values(widgets).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs.filter((href) => href === "/api/gspc")).toHaveLength(1);
    expect(hrefs.filter((href) => href === "/.well-known/did.json")).toHaveLength(1);
  });

  it("preserves the existing footer widgets and directory on other public pages", () => {
    const html = renderAt("/methodology/", <Footer />);
    expect(html).not.toContain("<details");
    Object.values(widgets).forEach((spy) => expect(spy).toHaveBeenCalledOnce());
    expect(html).toContain("Reference frameworks");
    expect(html).toContain('href="/terms-of-service/"');
  });

  it("offers direct homepage destinations while retaining the existing ask, search and workspace controls", () => {
    const html = renderAt("/", <Header />);
    expect(html).toContain('href="/#board"');
    expect(html).toContain('href="/#watchdog"');
    expect(html).toContain('href="/#learning"');
    expect(html).toContain('href="/#how-it-works"');
    expect(html).toContain('href="/#developers"');
    expect(html).toContain('data-testid="ask-launcher"');
    expect(html).toContain('data-testid="palette-launcher"');
    expect(html).toContain('data-testid="header-council-os"');
    expect(html).not.toContain("data-nav-trigger=");
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
