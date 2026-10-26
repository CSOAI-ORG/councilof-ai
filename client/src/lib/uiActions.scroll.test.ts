/**
 * The watch-mode `scroll` tool, executed. Re-test 7 Oct 2026: "scroll to the bottom" in the Ask
 * panel did nothing. The planner now emits the step (functions/_lib/uiTools.test.ts); this file
 * checks the browser half moves the right box: the dashboard's centre pane, never the Ask panel.
 *
 * There is no DOM library in this repo's test deps, so the few DOM calls the executor makes are
 * stubbed with plain objects. The stubs model only what the executor reads.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeEl {
  scrollTop = 0;
  scrolledTo: number[] = [];
  intoView = 0;
  constructor(
    public name: string,
    public scrollHeight: number,
    public clientHeight: number,
    public clientWidth = 800,
    public overflowY = "auto",
    public inAsk = false,
    public text = "",
    public attrs: Record<string, string> = {},
  ) {}
  scrollTo(o: { top: number }) {
    this.scrollTop = o.top;
    this.scrolledTo.push(o.top);
  }
  scrollIntoView() {
    this.intoView++;
  }
  closest(sel: string) {
    return this.inAsk && sel.includes("ask-pane") ? this : null;
  }
  getAttribute(k: string) {
    return this.attrs[k] ?? null;
  }
  querySelectorAll() {
    return [];
  }
  get textContent() {
    return this.text;
  }
}

let canvas: FakeEl;
let askLog: FakeEl;
let heading: FakeEl;
let docEl: FakeEl;

beforeEach(() => {
  vi.resetModules();
  canvas = new FakeEl("canvas", 4000, 700);
  askLog = new FakeEl("ask", 9000, 900, 900, "auto", true);
  heading = new FakeEl("h2", 30, 30, 800, "visible", false, "Methodology and limits");
  docEl = new FakeEl("doc", 812, 812, 375, "visible");
  const inner = new FakeEl("inner", 30, 30, 800, "visible");
  (canvas as unknown as { querySelectorAll: () => FakeEl[] }).querySelectorAll = () => [inner, heading];
  vi.stubGlobal("HTMLElement", FakeEl);
  vi.stubGlobal("CSS", { escape: (s: string) => s });
  vi.stubGlobal("getComputedStyle", (el: FakeEl) => ({ overflowY: el.overflowY }));
  vi.stubGlobal("window", {
    innerWidth: 1440,
    innerHeight: 900,
    matchMedia: () => ({ matches: true }), // reduced motion: no animation waits
    dispatchEvent: () => true,
    location: { pathname: "/dashboard/", search: "?tab=evidence", href: "https://councilof.ai/dashboard/?tab=evidence" },
  });
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined });
  vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
  vi.stubGlobal("document", {
    scrollingElement: docEl,
    documentElement: docEl,
    querySelector: (sel: string) => (sel === "[data-testid='dashboard-tool-canvas']" ? canvas : null),
    // The Ask panel's own transcript is in the document and is the tallest scroller on screen.
    querySelectorAll: (sel: string) => (/h1|h2|heading/.test(sel) ? [askLog, heading] : [askLog, canvas]),
  });
});

afterEach(() => vi.unstubAllGlobals());

const stepOf = (args: Record<string, unknown>) => ({ id: "ui_1", tool: "scroll" as const, args, effect: "view" as const, confirm: false });

describe("watch mode scroll — the page the reader is on, never the Ask panel", () => {
  it("'to: bottom' scrolls the dashboard centre pane to its end", async () => {
    const { executeStep } = await import("./uiActions");
    const out = await executeStep(stepOf({ to: "bottom" }));
    expect(out).toMatchObject({ ok: true, state: "done" });
    expect(canvas.scrollTop).toBe(4000 - 700);
    expect(askLog.scrolledTo).toEqual([]);
  });

  it("'to: top' after 'to: bottom' comes back up, and says when nothing moved", async () => {
    const { executeStep } = await import("./uiActions");
    await executeStep(stepOf({ to: "bottom" }));
    expect((await executeStep(stepOf({ to: "top" }))).state).toBe("done");
    expect(canvas.scrollTop).toBe(0);
    const again = await executeStep(stepOf({ to: "top" }));
    expect(again).toMatchObject({ ok: true, state: "done" });
    expect(again.detail).toMatch(/already at the top/i);
  });

  it("'down' moves one screen, not to the end", async () => {
    const { executeStep } = await import("./uiActions");
    await executeStep(stepOf({ to: "down" }));
    expect(canvas.scrollTop).toBe(Math.round(700 * 0.8));
  });

  it("a named section scrolls its heading into view and skips what is not on the page", async () => {
    const { executeStep } = await import("./uiActions");
    const hit = await executeStep(stepOf({ section: "methodology" }));
    expect(hit.state).toBe("done");
    expect(heading.intoView).toBe(1);
    expect(askLog.intoView).toBe(0);
    const miss = await executeStep(stepOf({ section: "no such part" }));
    expect(miss.state).toBe("skipped");
  });
});
