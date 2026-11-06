// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ToolReceiptsPane from "./ToolReceiptsPane";
import { clearToolReceipts, RECEIPTS_KEY, recordToolReceipt } from "@/lib/toolReceipts";

describe("live tool receipt pane", () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let previousActEnvironment: unknown;

  beforeEach(() => {
    localStorage.clear();
    previousActEnvironment = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) await act(async () => { root!.unmount(); });
    root = null;
    container.remove();
    localStorage.clear();
    if (previousActEnvironment === undefined) Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
    else Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", previousActEnvironment);
  });

  async function mount() {
    await act(async () => { root!.render(<ToolReceiptsPane />); });
  }

  it("shows a newly completed run without leaving or remounting the pane", async () => {
    await mount();
    expect(container.textContent).toContain("Nothing yet");
    await act(async () => {
      recordToolReceipt({ tool: "get_root", argsHash: "args-digest", outcome: "VALID" });
    });
    expect(container.querySelectorAll('[data-testid="receipts-row"]')).toHaveLength(1);
    expect(container.textContent).toContain("get_root");
    expect(container.textContent).toContain("VALID");
    expect(container.textContent).toContain("Not signed evidence");
    await act(async () => { clearToolReceipts(); });
    expect(container.textContent).toContain("Nothing yet");
  });

  it("refreshes the displayed count and export when another run completes", async () => {
    recordToolReceipt({ tool: "get_root", argsHash: "first", outcome: "VALID" });
    await mount();
    await act(async () => {
      recordToolReceipt({ tool: "verify_card", argsHash: "second", outcome: "ERROR" });
    });
    expect(container.querySelector('[data-testid="receipts-count"]')?.textContent).toContain("2 kept");
    const href = container.querySelector('[data-testid="receipts-export"]')!.getAttribute("href")!;
    const exported = JSON.parse(decodeURIComponent(href.slice(href.indexOf(",") + 1)));
    expect(exported.receipts.map((r: { tool: string }) => r.tool)).toEqual(["get_root", "verify_card"]);
    expect(container.querySelector('[data-testid="receipts-row"]')?.textContent).toContain("verify_card");
  });

  it("refreshes after another tab writes receipts and clears its store", async () => {
    await mount();
    const row = {
      at: "2026-11-06T00:00:00Z", tool: "verify_card", door: "/mcp",
      args_hash: "digest", outcome: "VALID", not_signed_evidence: true,
    };
    await act(async () => {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify([row]));
      window.dispatchEvent(new StorageEvent("storage", { key: RECEIPTS_KEY, storageArea: localStorage }));
    });
    expect(container.textContent).toContain("verify_card");
    await act(async () => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
    });
    expect(container.textContent).toContain("Nothing yet");
  });

  it("survives malformed cached receipt rows and omits arbitrary cached fields", async () => {
    const row = recordToolReceipt({ tool: "get_root", argsHash: "digest", outcome: "VALID" })!;
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([
      { tool: "incomplete" }, { ...row, at: null }, { ...row, args_hash: null },
      { ...row, private_prompt: "PRIVATE CONTENT MUST NOT APPEAR" },
    ]));
    await mount();
    expect(container.querySelectorAll('[data-testid="receipts-row"]')).toHaveLength(1);
    expect(container.textContent).toContain("get_root");
    const href = container.querySelector('[data-testid="receipts-export"]')!.getAttribute("href")!;
    expect(decodeURIComponent(href)).not.toContain("PRIVATE");
  });
});
