import { describe, expect, it } from "vitest";
import { EMBED_NAV_TYPE } from "@/lib/embed";
import { handleEmbedNav, paneNameFor } from "./handleEmbedNav";
import type { EmbedNavApply } from "./handleEmbedNav";

function applyMock(): EmbedNavApply & { calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {
    assignTop: [],
    setFrameSrc: [],
    setFramePath: [],
    setTabId: [],
    setOverride: [],
  };
  return {
    calls,
    assignTop: (...a: unknown[]) => { calls.assignTop.push(a); },
    setFrameSrc: (...a: unknown[]) => { calls.setFrameSrc.push(a); },
    setFramePath: (...a: unknown[]) => { calls.setFramePath.push(a); },
    setTabId: (...a: unknown[]) => { calls.setTabId.push(a); },
    setOverride: (...a: unknown[]) => { calls.setOverride.push(a); },
  };
}

const ORIGIN = "https://councilof.ai";

function msg(path: string, extra: { search?: string; title?: string; origin?: string } = {}): MessageEvent {
  return {
    origin: extra.origin ?? ORIGIN,
    data: {
      type: EMBED_NAV_TYPE,
      path,
      search: extra.search ?? "",
      title: extra.title ?? "",
    },
  } as MessageEvent;
}

function run(e: MessageEvent, a: ReturnType<typeof applyMock>) {
  handleEmbedNav(e, a, ORIGIN);
}

describe("handleEmbedNav", () => {
  it("leaves OS on path / — never an override chip", () => {
    const a = applyMock();
    run(msg("/"), a);
    expect(a.calls.assignTop).toEqual([["/"]]);
    expect(a.calls.setOverride).toEqual([]);
    expect(a.calls.setFrameSrc).toEqual([]);
  });

  it("strips embed=1 when leaving /os", () => {
    const a = applyMock();
    run(msg("/os", { search: "?embed=1&lobby=home" }), a);
    expect(a.calls.assignTop).toEqual([["/os?lobby=home"]]);
    expect(a.calls.setOverride).toEqual([]);
  });

  it("leaves OS for /dashboard — Software is a full page", () => {
    const a = applyMock();
    run(msg("/dashboard"), a);
    expect(a.calls.assignTop).toEqual([["/dashboard"]]);
  });

  it("follows a route tab without remounting src", () => {
    const a = applyMock();
    run(msg("/library"), a);
    expect(a.calls.setTabId).toEqual([["library"]]);
    expect(a.calls.setFramePath).toEqual([["/library"]]);
    expect(a.calls.setFrameSrc).toEqual([]);
    expect(a.calls.assignTop).toEqual([]);
  });

  it("drops the iframe for a native pane ping", () => {
    const a = applyMock();
    run(msg("/gspc-scoreboard"), a);
    expect(a.calls.setFrameSrc).toEqual([[""]]);
    expect(a.calls.setFramePath).toEqual([[""]]);
    expect(a.calls.setTabId).toEqual([["board"]]);
    expect(a.calls.setOverride).toEqual([[null]]);
  });

  it("sets an override chip for Pricing inside Products", () => {
    const a = applyMock();
    run(msg("/pricing", { title: "Pricing — Council of AI" }), a);
    expect(a.calls.setOverride).toEqual([[{ path: "/pricing", label: "Pricing" }]]);
    expect(a.calls.assignTop).toEqual([]);
  });

  it("ignores a foreign origin", () => {
    const a = applyMock();
    run(msg("/", { origin: "https://evil.example" }), a);
    expect(a.calls.assignTop).toEqual([]);
    expect(a.calls.setOverride).toEqual([]);
  });
});

describe("paneNameFor", () => {
  it("refuses the site brand title", () => {
    expect(paneNameFor("Council of AI — we measure", "/login")).toBe("/login");
  });
});
