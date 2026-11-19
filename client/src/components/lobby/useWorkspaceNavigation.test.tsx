// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceNavigation, WORKSPACE_SMALL_QUERY } from "./useWorkspaceNavigation";

let container: HTMLDivElement;
let root: Root;
let small: boolean;
let listeners: Set<(event: MediaQueryListEvent) => void>;
function Harness() {
  const nav = useWorkspaceNavigation();
  return <><button ref={nav.menuButtonRef} onClick={nav.toggleNavigation} aria-expanded={nav.navigationOpen}>Sections</button><input aria-label="Workspace question" />
    {!nav.isSmall && nav.desktopNavOpen ? <aside ref={nav.desktopNavigationRef}><a href="#board">GSPC</a></aside> : null}
    {nav.isSmall && nav.drawerOpen ? <div ref={nav.drawerRef} role="dialog"><a href="#learn">Learn</a></div> : null}</>;
}
const button = () => container.querySelector("button")!;
const mount = (mobile = false) => { small = mobile; act(() => root.render(<Harness />)); };
const resize = (mobile: boolean) => { small = mobile; act(() => { for (const listener of listeners) listener({ matches: mobile } as MediaQueryListEvent); }); };
const escape = (element: Element) => act(() => { element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  listeners = new Set(); small = false;
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: small, media: query, addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => listeners.add(fn), removeEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => listeners.delete(fn) })));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe("workspace navigation", () => {
  it("opens desktop navigation without stealing initial focus", () => {
    mount(); expect(container.querySelector("aside")).not.toBeNull(); expect(button().getAttribute("aria-expanded")).toBe("true"); expect(document.activeElement).toBe(document.body);
  });
  it("keeps the mobile canvas unobstructed on arrival", () => {
    mount(true); expect(container.querySelector("aside, [role=dialog]")).toBeNull(); expect(button().getAttribute("aria-expanded")).toBe("false"); expect(window.matchMedia).toHaveBeenCalledWith(WORKSPACE_SMALL_QUERY);
  });
  it("opens mobile navigation deliberately and returns focus after Escape", () => {
    mount(true); act(() => button().click()); const link = container.querySelector("[role=dialog] a")!;
    expect(document.activeElement).toBe(link); escape(link); expect(container.querySelector("[role=dialog]")).toBeNull(); expect(document.activeElement).toBe(button());
  });
  it("allows desktop collapse and focuses destinations on an explicit reopen", () => {
    mount(); act(() => button().click()); expect(container.querySelector("aside")).toBeNull(); act(() => button().click()); expect(document.activeElement).toBe(container.querySelector("aside a"));
  });
  it("does not let Escape in a workspace input collapse the desktop navigation", () => {
    mount(); const input = container.querySelector("input")!; input.focus(); escape(input); expect(container.querySelector("aside")).not.toBeNull(); expect(document.activeElement).toBe(input);
  });
  it("closes desktop navigation with Escape from inside the navigation", () => {
    mount(); const link = container.querySelector<HTMLAnchorElement>("aside a")!; link.focus(); escape(link); expect(container.querySelector("aside")).toBeNull(); expect(document.activeElement).toBe(button());
  });
  it("preserves a deliberate desktop collapse across responsive changes", () => {
    mount(); act(() => button().click()); resize(true); resize(false); expect(container.querySelector("aside")).toBeNull();
  });
  it("clears an open mobile drawer when moving to desktop", () => {
    mount(true); act(() => button().click()); resize(false); expect(container.querySelector("aside")).not.toBeNull(); expect(container.querySelector("[role=dialog]")).toBeNull(); resize(true); expect(container.querySelector("[role=dialog]")).toBeNull();
  });
  it("removes its media-query listener on unmount", () => {
    mount(); expect(listeners.size).toBe(1); act(() => root.render(null)); expect(listeners.size).toBe(0);
  });
});
