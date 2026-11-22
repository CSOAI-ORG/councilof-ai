// @vitest-environment jsdom
/**
 * Build-time reads on /status (live, 18 Nov 2026). The build saves this page as static HTML by
 * running it in a prerender (scripts/prerender.mjs sets window.__CSOAI_PRERENDER__). The saved
 * HTML said "this browser's clock" 21 times about reads the build had made at build time.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import YieldStatus from "./YieldStatus";

type PrerenderWindow = Window & { __CSOAI_PRERENDER__?: boolean };
const READ_AT = "2026-11-18T03:35:39.303Z";
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(READ_AT));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // Every source answers an empty object: each row then says when it was read, and by whose clock.
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { headers: { "content-type": "application/json" } })));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete (window as PrerenderWindow).__CSOAI_PRERENDER__;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function renderStatus(): Promise<string> {
  await act(async () => {
    root.render(<HelmetProvider><YieldStatus /></HelmetProvider>);
  });
  return container.textContent ?? "";
}

describe("/status read labels", () => {
  it("names the site build's clock for the reads the prerender saves into the HTML", async () => {
    (window as PrerenderWindow).__CSOAI_PRERENDER__ = true;
    const text = await renderStatus();
    expect(text).toContain(`page read completed at ${READ_AT} (the site build's clock, at build time)`);
    expect(text).toContain(`read at ${READ_AT} (the site build's clock, at build time)`);
    expect(text).not.toContain("this browser's clock");
  });

  it("still names this browser's clock when a visitor's browser makes the reads", async () => {
    const text = await renderStatus();
    expect(text).toContain(`page read completed at ${READ_AT} (this browser's clock)`);
    expect(text).toContain(`read at ${READ_AT} (this browser's clock)`);
    expect(text).not.toContain("at build time");
  });
});
