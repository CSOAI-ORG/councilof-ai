// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommandPalette from "./CommandPalette";
import { ASK_OPEN, readRecents } from "./askBus";
import { loadBoardAxes, resetPaletteIndexForTest } from "./paletteIndex";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  list: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("wouter/use-browser-location", () => ({ navigate: mocks.navigate }));
vi.mock("@/lib/sovTools", () => ({
  listTools: mocks.list,
  callTool: mocks.execute,
}));
let root: Root | undefined;
let host: HTMLDivElement;
let opener: HTMLButtonElement;
const close = vi.fn();
const panel = () =>
  document.querySelector<HTMLElement>('[data-testid="command-palette"]')!;
const input = () =>
  panel().querySelector<HTMLInputElement>('[role="combobox"]')!;
const options = () => [
  ...panel().querySelectorAll<HTMLElement>('[role="option"]'),
];
const category = (text: string) =>
  [...panel().querySelectorAll<HTMLButtonElement>("button")].find(
    (node) => node.textContent?.trim() === text,
  )!;
async function click(node: HTMLElement) {
  await act(async () => {
    node.click();
  });
}
async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input(), value);
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function key(value: string, options: KeyboardEventInit = {}) {
  await act(async () => {
    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: value, bubbles: true, ...options }),
    );
  });
}
async function mount() {
  function Harness() {
    const [open, setOpen] = useState(true);
    return open ? (
      <CommandPalette
        onClose={() => {
          close();
          setOpen(false);
        }}
      />
    ) : null;
  }
  root = createRoot(host);
  await act(async () => {
    root!.render(<Harness />);
  });
}
beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  localStorage.clear();
  resetPaletteIndexForTest();
  mocks.list.mockResolvedValue({
    state: "ok",
    tools: [
      { name: "verify_card", description: "Verify a signed record" },
      { name: "get_root", description: "Read the published root" },
    ],
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Unexpected network request");
    }),
  );
  await loadBoardAxes(
    vi.fn(async () =>
      Response.json({
        axes: [
          { axis: "safety", task: "Paired refusal checks" },
          { axis: "art5-safeguard", task: "Prohibited practice trips" },
        ],
      }),
    ) as unknown as typeof fetch,
  );
  host = document.createElement("div");
  opener = document.createElement("button");
  opener.textContent = "Open search";
  document.body.append(opener, host);
  opener.focus();
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  opener.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  resetPaletteIndexForTest();
});

describe("workspace command palette", () => {
  it("focuses an accessible search and exposes all destination categories without executing anything", async () => {
    await mount();
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute("aria-controls")).toBe(
      panel().querySelector('[role="listbox"]')!.id,
    );
    for (const name of ["All", "Workspaces", "Free tools", "Tests", "Pages"])
      expect(category(name)).toBeTruthy();
    expect(mocks.list).toHaveBeenCalledWith("/mcp/free", { force: false });
    expect(panel().textContent).toContain("execution is a separate action");
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("searches the free-tool catalogue and opens the exact tool without running it", async () => {
    await mount();
    await click(category("Free tools"));
    await type("verify_card");
    expect(options()).toHaveLength(2); // one destination plus deliberate Ask action
    expect(options()[0].textContent).toContain("verify_card");
    await key("Enter");
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
      "/dashboard?tab=tools&tool=verify_card",
    );
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("opens the exact public board axis deep link with no automatic run flag or execution", async () => {
    await mount();
    await click(category("Tests"));
    await type("art5");
    expect(options()[0].textContent).toContain("Art5 safeguard");
    await key("Enter");
    const destination = mocks.navigate.mock.calls[0][0] as string;
    expect(destination).toBe(
      "/dashboard?tab=tools&tool=get_axis&axis=art5-safeguard",
    );
    expect(
      new URL(destination, "https://councilof.ai").searchParams.has("run"),
    ).toBe(false);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("keeps workspace and page categories separate while searching", async () => {
    await mount();
    await click(category("Workspaces"));
    expect(options().length).toBeGreaterThan(0);
    expect(
      options().every((row) => row.textContent?.includes("Council OS")),
    ).toBe(true);
    await click(category("Pages"));
    await type("verify");
    expect(options().some((row) => row.textContent?.includes("Verify"))).toBe(
      true,
    );
    expect(
      options().some((row) =>
        row.textContent?.includes("Council OS › Free tools"),
      ),
    ).toBe(false);
  });

  it("moves the active option with the keyboard, ignores composing Enter and opens only after a deliberate Enter", async () => {
    await mount();
    await click(category("Free tools"));
    await key("ArrowDown");
    expect(options()[1].getAttribute("aria-selected")).toBe("true");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[1].id);
    await key("Enter", { isComposing: true });
    expect(mocks.navigate).not.toHaveBeenCalled();
    await key("ArrowUp");
    await key("Enter");
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
      "/dashboard?tab=tools&tool=verify_card",
    );
  });

  it("closes on Escape and returns focus to the opener", async () => {
    await mount();
    await key("Escape");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector('[data-testid="command-palette"]'),
    ).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("sends a question only on deliberate Shift+Enter and never records that question as a shortcut", async () => {
    const ask = vi.fn();
    window.addEventListener(ASK_OPEN, ask);
    try {
      await mount();
      await type("private question text");
      expect(ask).not.toHaveBeenCalled();
      await key("Enter", { shiftKey: true });
      expect(ask).toHaveBeenCalledTimes(1);
      expect((ask.mock.calls[0][0] as CustomEvent).detail).toEqual({
        question: "private question text",
      });
      expect(readRecents()).toEqual([]);
      expect(localStorage.getItem("coai:recents")).toBeNull();
      expect(mocks.execute).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(ASK_OPEN, ask);
    }
  });

  it("pins metadata without closing, and reports blocked storage rather than claiming a pin", async () => {
    await mount();
    await click(category("Free tools"));
    const pin = () =>
      panel().querySelector<HTMLButtonElement>('[data-testid="palette-pin"]')!;
    await click(pin());
    expect(panel().textContent).toContain("Shortcut pinned in this browser.");
    expect(pin().getAttribute("aria-pressed")).toBe("true");
    expect(readRecents()[0].href).toBe("/dashboard?tab=tools&tool=verify_card");
    expect(close).not.toHaveBeenCalled();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await click(pin());
    expect(panel().textContent).toContain("could not save the shortcut");
    expect(pin().getAttribute("aria-pressed")).toBe("true");
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
