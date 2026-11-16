// @vitest-environment jsdom
// Owner, 2026-11-16: the home page carries the same master menu as every other route. Until that
// date "/" rendered its own short menu (four desktop links and a flat mobile list), so the home
// page was the one place the grouped master menu was missing. These tests hold the home page to
// the same menu as the rest of the site.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function mount(path = "/") {
  const { hook } = memoryLocation({ path });
  act(() => root.render(<Router hook={hook}><Header /></Router>));
  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!;
  act(() => trigger.click());
  return trigger;
}
/** The open mobile menu's destinations and group buttons, read from a fresh mount at `path`. */
function menuAt(path: string) {
  act(() => root.unmount());
  root = createRoot(container);
  mount(path);
  const menu = container.querySelector("#mobile-site-navigation")!;
  return {
    links: [...menu.querySelectorAll("a")].map((link) => link.getAttribute("href")),
    groups: [...menu.querySelectorAll('button[aria-controls^="mobile-group-"]')].map((b) => b.textContent?.trim()),
  };
}

describe("the home page carries the master menu", () => {
  it("offers the same mobile menu on the home page as on /about/", () => {
    const home = menuAt("/");
    const about = menuAt("/about/");
    expect(home.groups.length).toBeGreaterThan(0);
    expect(home.groups).toEqual(about.groups);
    expect(home.links).toEqual(about.links);
  });

  it("keeps the booking door one tap from the open menu", () => {
    mount();
    const assessment = container.querySelector<HTMLAnchorElement>('#mobile-site-navigation [data-testid="mobile-book-measurement"]');
    expect(assessment?.getAttribute("href")).toBe("/assess/");
    expect(assessment?.textContent).toBe("Book a measurement");
  });

  it("closes after a same-page link click even when the router path does not change", () => {
    const trigger = mount();
    const link = container.querySelector<HTMLAnchorElement>('#mobile-site-navigation a[href="/"]')!;
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    act(() => link.click());
    expect(container.querySelector("#mobile-site-navigation")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes with Escape and returns keyboard focus to the menu trigger", () => {
    const trigger = mount();
    container.querySelector<HTMLAnchorElement>("#mobile-site-navigation a")!.focus();
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(container.querySelector("#mobile-site-navigation")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("no route renders the former home-only menu", () => {
    for (const path of ["/", "/methodology/"]) {
      menuAt(path);
      const menu = container.querySelector("#mobile-site-navigation")!;
      expect(menu.querySelectorAll('button[aria-controls^="mobile-group-"]').length, path).toBeGreaterThan(0);
      expect(menu.querySelector('[data-testid="mobile-book-measurement"]'), path).not.toBeNull();
      expect(menu.querySelector('[data-testid="homepage-mobile-navigation"]'), path).toBeNull();
    }
  });
});
