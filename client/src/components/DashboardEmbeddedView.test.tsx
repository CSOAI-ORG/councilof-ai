// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardEmbeddedView, {
  EMBEDDED_PAGE_TIMEOUT_MS,
} from "./DashboardEmbeddedView";

let root: Root | undefined;
let host: HTMLDivElement;
const frame = () => host.querySelector<HTMLIFrameElement>("iframe")!;
const retry = () =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find((node) =>
    node.textContent?.includes("Retry page"),
  )!;
async function render(path = "/methodology", label = "Methodology") {
  root ??= createRoot(host);
  await act(async () => {
    root!.render(<DashboardEmbeddedView path={path} label={label} />);
  });
}
async function emit(node: HTMLElement, type: string) {
  await act(async () => {
    node.dispatchEvent(new Event(type));
  });
}
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
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
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("embedded workspace page recovery", () => {
  it("announces loading with a directly usable new-tab fallback and close destination", async () => {
    await render();
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Loading Methodology",
    );
    expect(frame().getAttribute("src")).toBe("/methodology?embed=1");
    expect(frame().getAttribute("aria-busy")).toBe("true");
    expect(frame().title).toBe("Methodology — Council of AI");
    expect(host.querySelector('a[target="_blank"]')!.getAttribute("href")).toBe(
      "/methodology",
    );
    expect(
      host
        .querySelector('a[aria-label="Close page and return to all tools"]')!
        .getAttribute("href"),
    ).toBe("/dashboard?tab=explore");
  });

  it("bounds an unconfirmed frame load and retries with a fresh frame, without assuming a content verdict", async () => {
    await render();
    const first = frame();
    await advance(EMBEDDED_PAGE_TIMEOUT_MS - 1);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    await advance(1);
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "not confirmed loading after 15 seconds",
    );
    expect(host.textContent).toContain("No content state is assumed");
    await act(async () => {
      retry().click();
    });
    expect(frame()).not.toBe(first);
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Loading Methodology",
    );
    await emit(first, "load"); // a retired attempt cannot finish the current one
    expect(frame().getAttribute("aria-busy")).toBe("true");
    await emit(frame(), "load");
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(frame().getAttribute("aria-busy")).toBe("false");
    await advance(EMBEDDED_PAGE_TIMEOUT_MS);
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("shows an immediate browser frame error and lets a later load recover", async () => {
    await render();
    await emit(frame(), "error");
    expect(host.querySelector('[role="alert"]')!.textContent).toContain(
      "browser reported",
    );
    expect(retry()).toBeTruthy();
    await emit(frame(), "load");
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("resets timeout/error state when navigating to another embedded page", async () => {
    await render();
    await advance(EMBEDDED_PAGE_TIMEOUT_MS);
    const previous = frame();
    await render("/library", "Library");
    expect(frame()).not.toBe(previous);
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Loading Library",
    );
    expect(host.querySelector('[role="alert"]')).toBeNull();
    await emit(previous, "load");
    expect(frame().getAttribute("aria-busy")).toBe("true");
    await emit(frame(), "load");
    await advance(EMBEDDED_PAGE_TIMEOUT_MS);
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("replaces a redirect into Council OS with the moved-page guard rather than nesting another workspace", async () => {
    await render();
    const child = frame().contentWindow!;
    child.history.replaceState(null, "", "/dashboard?tab=corrections&embed=1");
    await emit(frame(), "load");
    expect(
      host.querySelector('[data-testid="dashboard-embedded-moved"]'),
    ).toBeTruthy();
    expect(host.querySelector("iframe")).toBeNull();
    expect(host.textContent).toContain("not shown inside itself");
    expect(
      [...host.querySelectorAll("a")]
        .find((node) => node.textContent?.includes("Go where it moved"))!
        .getAttribute("href"),
    ).toBe("/dashboard?tab=corrections");
    await render("/library", "Library");
    expect(frame().getAttribute("src")).toBe("/library?embed=1");
  });

  it("cleans up its bounded wait when the pane unmounts", async () => {
    await render();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => {
      root!.unmount();
    });
    root = undefined;
    expect(vi.getTimerCount()).toBe(0);
  });
});
