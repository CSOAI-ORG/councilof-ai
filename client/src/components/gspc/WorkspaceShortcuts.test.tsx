// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceShortcuts from "./WorkspaceShortcuts";
import {
  PALETTE_OPEN,
  RECENTS_KEY,
  readRecents,
  recordRecent,
} from "@/components/ask/askBus";

let root: Root | undefined;
let host: HTMLDivElement;
const links = () => [...host.querySelectorAll<HTMLAnchorElement>("a")];
const button = (name: string) =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (node) =>
      node.getAttribute("aria-label") === name ||
      node.textContent?.trim() === name,
  )!;
const item = (n: number, pinned = false) => ({
  href: `/dashboard?tab=tools&tool=public_tool_${n}`,
  title: `Public tool ${n}`,
  crumb: "Council OS › Free tools",
  at: n + 1,
  pinned,
});
async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(<WorkspaceShortcuts />);
  });
}
async function click(node: HTMLElement) {
  await act(async () => {
    node.click();
  });
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Unexpected network request");
    }),
  );
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("workspace shortcut continuation", () => {
  it("opens the finder deliberately without automatically executing or fetching a tool", async () => {
    const open = vi.fn();
    window.addEventListener(PALETTE_OPEN, open);
    try {
      await mount();
      expect(open).not.toHaveBeenCalled();
      expect(host.textContent).toContain("open without running a tool");
      await click(button("Find tools and pages⌘K / Ctrl K"));
      expect(open).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(PALETTE_OPEN, open);
    }
  });

  it("reacts to same-tab visits and pins, preserving exact public tool and axis destinations", async () => {
    await mount();
    expect(links()).toHaveLength(0);
    await act(async () => {
      recordRecent({
        href: "/dashboard?tab=tools&tool=get_axis&axis=safety&args=private",
        title: "Safety",
        crumb: "Tests",
      });
    });
    expect(links()).toHaveLength(1);
    expect(links()[0].getAttribute("href")).toBe(
      "/dashboard?tab=tools&tool=get_axis&axis=safety",
    );
    await click(button("Pin Safety"));
    expect(button("Unpin Safety").getAttribute("aria-pressed")).toBe("true");
    expect(host.textContent).toContain("Shortcut pinned in this browser.");
    expect(readRecents()[0].pinned).toBe(true);
    expect(localStorage.getItem(RECENTS_KEY)).not.toContain("private");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes for another tab's recents change or global clear, ignoring unrelated storage events", async () => {
    await mount();
    localStorage.setItem(RECENTS_KEY, JSON.stringify([item(1)]));
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    });
    expect(links()).toHaveLength(0);
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: RECENTS_KEY }));
    });
    expect(links()[0].textContent).toContain("Public tool 1");
    await act(async () => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(links()).toHaveLength(0);
  });

  it("puts pins first, omits the home destination and expands all saved shortcuts", async () => {
    localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify([
        {
          href: "/dashboard?tab=home",
          title: "Home",
          crumb: "Council OS",
          at: 100,
        },
        ...Array.from({ length: 8 }, (_, i) => item(i, true)),
        item(9),
        item(10),
      ]),
    );
    await mount();
    expect(links()).toHaveLength(6);
    expect(links()[0].textContent).toContain("Public tool 0");
    expect(host.textContent).not.toContain("Home");
    await click(button("Show all saved shortcuts"));
    expect(links()).toHaveLength(10);
    expect(button("Show fewer shortcuts").getAttribute("aria-expanded")).toBe(
      "true",
    );
    await click(button("Show fewer shortcuts"));
    expect(links()).toHaveLength(6);
  });

  it("reports a failed pin without changing the saved metadata or claiming success", async () => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify([item(1)]));
    await mount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await click(button("Pin Public tool 1"));
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "could not save",
    );
    expect(button("Pin Public tool 1").getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(readRecents()[0].pinned).toBe(false);
  });
});
