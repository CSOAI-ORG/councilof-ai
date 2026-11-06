// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToolReceiptsPane from "./ToolReceiptsPane";
import {
  clearToolReceipts,
  RECEIPTS_KEY,
  recordToolReceipt,
  type ToolReceipt,
} from "@/lib/toolReceipts";

const HASH = "a".repeat(64);
let root: Root | undefined;
let host: HTMLDivElement;
const rows = () => [...host.querySelectorAll('[data-testid="receipts-row"]')];
const button = (text: string) =>
  [...host.querySelectorAll("button")].find(
    (node) => node.textContent?.trim() === text,
  )!;
const status = () => host.querySelector('[role="status"]')!.textContent;
const receipt = (
  tool: string,
  outcome = "VALID",
  door: "/mcp" | "/mcp/free" = "/mcp",
): ToolReceipt => ({
  at: "2026-11-06T05:00:00Z",
  tool,
  outcome,
  door,
  args_hash: HASH,
  not_signed_evidence: true,
});

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  clearToolReceipts();
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
  localStorage.clear();
  clearToolReceipts();
});

async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(<ToolReceiptsPane />);
  });
}

async function click(node: HTMLElement) {
  await act(async () => {
    node.click();
  });
}

function control(label: string) {
  const field = [...host.querySelectorAll("label")].find(
    (node) => node.textContent === label,
  )!;
  return document.getElementById(field.htmlFor) as
    HTMLInputElement | HTMLSelectElement;
}

async function change(label: string, value: string) {
  const node = control(label);
  await act(async () => {
    const prototype =
      node instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(node, value);
    node.dispatchEvent(
      new Event(node instanceof HTMLSelectElement ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}

describe("mounted local run receipts", () => {
  it("updates after a run in the same tab without remounting", async () => {
    await mount();
    expect(host.textContent).toContain("Nothing yet");
    await act(async () => {
      recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" });
    });
    expect(rows()).toHaveLength(1);
    expect(host.textContent).not.toContain("Nothing yet");
    expect(rows()[0].textContent).toContain("get_root");
    expect(rows()[0].textContent).toContain("VALID");
  });

  it("responds to another tab's writes and whole-storage clear", async () => {
    await mount();
    await act(async () => {
      localStorage.setItem(
        RECEIPTS_KEY,
        JSON.stringify([receipt("board_totals", "LIVE")]),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: RECEIPTS_KEY }));
    });
    expect(rows()[0].textContent).toContain("board_totals");
    await act(async () => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(rows()).toHaveLength(0);
    expect(host.textContent).toContain("Nothing yet");
  });

  it("shows unavailable storage separately from an empty run history", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await mount();
    expect(status()).toContain("Browser storage is unavailable");
    expect(host.textContent).not.toContain("Nothing yet");
    expect(host.querySelector('[data-testid="receipts-export"]')).toBeNull();
  });

  it("keeps the last readable snapshot when a later read fails", async () => {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([receipt("get_root")]));
    await mount();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await click(
      host.querySelector('button[aria-label="Refresh local run receipts"]')!,
    );
    expect(rows()).toHaveLength(1);
    expect(status()).toContain("last readable snapshot is retained");
    expect(host.textContent).toContain("not a fresh read");
    expect(host.textContent).not.toContain("Nothing yet");
  });

  it("offers readable metadata without displaying malformed entries or private payloads", async () => {
    localStorage.setItem(
      RECEIPTS_KEY,
      JSON.stringify([
        receipt("get_root"),
        { ...receipt("broken"), args_hash: null, result: "private payload" },
      ]),
    );
    await mount();
    expect(rows()).toHaveLength(1);
    expect(status()).toContain("Only valid metadata is shown");
    expect(host.textContent).not.toContain("private payload");
    expect(host.textContent).not.toContain("broken");
    expect(host.textContent).not.toContain("Nothing yet");
  });

  it("paginates the whole retained history and exposes complete metadata", async () => {
    localStorage.setItem(
      RECEIPTS_KEY,
      JSON.stringify(
        Array.from({ length: 19 }, (_, i) => receipt("tool-" + i)),
      ),
    );
    await mount();
    expect(rows()).toHaveLength(8);
    expect(rows()[0].textContent).toContain("tool-18");
    expect(button("Previous receipts").disabled).toBe(true);
    await click(button("Next receipts"));
    expect(rows()[0].textContent).toContain("tool-10");
    await click(button("Next receipts"));
    expect(rows()).toHaveLength(3);
    expect(rows()[2].textContent).toContain("tool-0");
    expect(button("Next receipts").disabled).toBe(true);
    await click(rows()[2].querySelector("summary")!);
    expect(rows()[2].querySelector("details")!.open).toBe(true);
    expect(rows()[2].textContent).toContain(HASH);
    expect(rows()[2].querySelector("time")!.dateTime).toBe(
      "2026-11-06T05:00:00Z",
    );
    expect(rows()[2].textContent).toContain("Unsigned browser-local metadata");
    const link = rows()[2].querySelector<HTMLAnchorElement>("a")!;
    expect(link.getAttribute("aria-label")).toBe("Open tool tool-0");
    expect(link.getAttribute("href")).toBe("/dashboard?tab=tools&tool=tool-0");
    expect(rows()[2].textContent).toContain("Opening the tool does not run it");
  });

  it("combines search, outcome and endpoint filters, exporting every match beyond the visible page", async () => {
    const stored = [
      ...Array.from({ length: 11 }, (_, i) =>
        receipt("get_root_" + i, "VALID", "/mcp/free"),
      ),
      receipt("get_root_other", "UNREACHABLE", "/mcp/free"),
      receipt("get_root_full", "VALID", "/mcp"),
      receipt("board_totals", "LIVE", "/mcp/free"),
    ];
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(stored));
    await mount();
    await change("Find a run", "get_root");
    await change("Outcome", "VALID");
    await change("Endpoint", "/mcp/free");
    expect(rows()).toHaveLength(8);
    expect(
      host.querySelector('[data-testid="receipts-count"]')!.textContent,
    ).toContain("11 matching of 14");
    const href = host.querySelector<HTMLAnchorElement>(
      '[data-testid="receipts-export"]',
    )!.href;
    const exported = JSON.parse(
      decodeURIComponent(href.split(",").slice(1).join(",")),
    );
    expect(exported.receipts).toHaveLength(11);
    expect(
      exported.receipts.every(
        (row: ToolReceipt) =>
          row.door === "/mcp/free" && row.outcome === "VALID",
      ),
    ).toBe(true);
    expect(
      exported.receipts.every(
        (row: ToolReceipt) => row.not_signed_evidence === true,
      ),
    ).toBe(true);
    expect(JSON.stringify(exported)).not.toMatch(/"arguments"|"result"/);
  });

  it("recovers from a no-match filter and resets pagination", async () => {
    localStorage.setItem(
      RECEIPTS_KEY,
      JSON.stringify(
        Array.from({ length: 12 }, (_, i) => receipt("tool-" + i)),
      ),
    );
    await mount();
    await click(button("Next receipts"));
    await change("Find a run", "not present");
    expect(host.textContent).toContain(
      "No local receipt matches these filters",
    );
    expect(host.querySelector('[data-testid="receipts-export"]')).toBeNull();
    await click(button("Clear filters"));
    expect(rows()).toHaveLength(8);
    expect(rows()[0].textContent).toContain("tool-11");
    expect(
      host.querySelector('[data-testid="receipts-page"]')!.textContent,
    ).toBe("Page 1 of 2");
  });

  it("does not claim a failed clear and removes the log only after confirmed retry", async () => {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([receipt("get_root")]));
    await mount();
    const remove = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => undefined);
    await click(button("Clear local log"));
    await click(button("Really clear"));
    expect(status()).toContain("clear could not be confirmed");
    expect(rows()).toHaveLength(1);
    expect(host.textContent).not.toContain("Nothing yet");
    remove.mockRestore();
    await click(button("Really clear"));
    expect(rows()).toHaveLength(0);
    expect(status()).toContain("removal confirmed");
    expect(host.textContent).toContain("Nothing yet");
  });
});
