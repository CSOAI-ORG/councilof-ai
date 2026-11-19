// @vitest-environment jsdom
// Clipboard operations are mocked; these controls never install a client or call a service.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeDevelopers from "./HomeDevelopers";

let root: Root | undefined;
let host: HTMLDivElement;
let originalClipboard: PropertyDescriptor | undefined;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  host.remove();
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
  vi.restoreAllMocks();
});

async function mount() {
  root = createRoot(host);
  await act(async () => { root!.render(<HomeDevelopers />); });
}

function exampleButton(name: string) {
  return [...host.querySelectorAll("button")].find((button) => button.textContent === name)!;
}

function copyButton() {
  return host.querySelector<HTMLButtonElement>('button[aria-label="Copy connection example"]')!;
}

async function click(button: HTMLButtonElement) {
  await act(async () => { button.click(); });
}

function clipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: writeText ? { writeText } : undefined });
}

describe("homepage connection examples", () => {
  it("switches all three visible examples and exposes the selected control", async () => {
    await mount();
    expect(host.querySelector("code")!.textContent).toContain('"url": "https://councilof.ai/mcp/free"');
    expect(exampleButton("MCP configuration").getAttribute("aria-pressed")).toBe("true");
    await click(exampleButton("HTTP API"));
    expect(host.querySelector("code")!.textContent).toBe("curl --fail --silent --show-error https://councilof.ai/api/gspc");
    expect(exampleButton("HTTP API").getAttribute("aria-pressed")).toBe("true");
    expect(exampleButton("MCP configuration").getAttribute("aria-pressed")).toBe("false");
    await click(exampleButton("Agent Skills"));
    expect(host.querySelector("code")!.textContent).toBe("https://councilof.ai/.well-known/agent-skills/index.json");
    expect(host.querySelector("pre")!.getAttribute("aria-label")).toBe("Agent Skills example");
    expect(exampleButton("Agent Skills").getAttribute("aria-controls")).toBe(host.querySelector("pre")!.parentElement!.id);
  });

  it("copies the selected example and confirms only a successful clipboard result", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    await mount();
    await click(exampleButton("Agent Skills"));
    await click(copyButton());
    expect(writeText).toHaveBeenCalledWith("https://councilof.ai/.well-known/agent-skills/index.json");
    expect(host.querySelector('[role="status"]')!.textContent).toBe("Connection example copied.");
    expect(copyButton().textContent).toBe("Copied");
  });

  it("keeps selectable code and an announced recovery when clipboard permission is refused", async () => {
    clipboard(vi.fn().mockRejectedValue(new Error("permission denied")));
    await mount();
    await click(exampleButton("HTTP API"));
    const code = host.querySelector("code")!.textContent;
    await click(copyButton());
    expect(host.querySelector('[role="status"]')!.textContent).toBe("Copy is unavailable. Select and copy the example above.");
    expect(host.querySelector("code")!.textContent).toBe(code);
    expect(host.querySelector("pre")!.tabIndex).toBe(0);
    expect(copyButton().textContent).toBe("Copy");
  });

  it("offers the same recovery when the clipboard API is absent", async () => {
    clipboard();
    await mount();
    await click(copyButton());
    expect(host.querySelector('[role="status"]')!.textContent).toContain("Select and copy the example above");
    expect(copyButton().textContent).toBe("Copy");
  });

  it("does not claim the newly selected example was copied when an older request completes", async () => {
    let finish!: () => void;
    const writeText = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    clipboard(writeText);
    await mount();
    await click(copyButton());
    await click(exampleButton("HTTP API"));
    await act(async () => { finish(); });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("https://councilof.ai/mcp/free"));
    expect(host.querySelector("code")!.textContent).toBe("curl --fail --silent --show-error https://councilof.ai/api/gspc");
    expect(host.querySelector('[role="status"]')!.textContent).toBe("");
    expect(copyButton().textContent).toBe("Copy");
  });

  it("does not attach an older copy failure to the newly selected example", async () => {
    let fail!: (error: Error) => void;
    clipboard(vi.fn().mockImplementation(() => new Promise<void>((_, reject) => { fail = reject; })));
    await mount();
    await click(copyButton());
    await click(exampleButton("Agent Skills"));
    await act(async () => { fail(new Error("permission denied")); });
    expect(host.querySelector('[role="status"]')!.textContent).toBe("");
    expect(copyButton().textContent).toBe("Copy");
  });
});
