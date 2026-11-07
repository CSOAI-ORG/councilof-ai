// @vitest-environment jsdom
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

describe("homepage mobile navigation", () => {
  it("offers each primary destination once without the extensive grouped directory", () => {
    mount();
    const menu = container.querySelector("#mobile-site-navigation")!;
    expect([...menu.querySelectorAll("a")].map((link) => link.getAttribute("href"))).toEqual([
      "/assess/", "/#board", "/#products", "/#how-it-works", "/#developers", "/gspc-verify",
      "/about", "/contact?arm=run", "/dashboard", "/library",
    ]);
    expect(menu.querySelectorAll("button")).toHaveLength(0);
    const assessment = menu.querySelector<HTMLAnchorElement>('[data-testid="mobile-book-measurement"]');
    expect(assessment?.getAttribute("href")).toBe("/assess/");
    expect(assessment?.textContent).toBe("Book a measurement");
  });

  it("closes after a same-page anchor click even when the router path does not change", () => {
    const trigger = mount();
    const link = container.querySelector<HTMLAnchorElement>('#mobile-site-navigation a[href="/#how-it-works"]')!;
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

  it("retains the existing grouped menu on other public routes", () => {
    mount("/methodology/");
    const menu = container.querySelector("#mobile-site-navigation")!;
    expect(menu.querySelectorAll('button[aria-controls^="mobile-group-"]').length).toBeGreaterThan(0);
    expect(menu.querySelector('[data-testid="mobile-book-measurement"]')).not.toBeNull();
    expect(menu.querySelector('[data-testid="homepage-mobile-navigation"]')).toBeNull();
  });
});
