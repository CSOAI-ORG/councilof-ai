// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyBlock } from "./paneKit";
import { CopyLine } from "@/components/gspc/ConnectPane";
import ApiDocs, { ApiExampleCopy } from "@/pages/ApiDocs";

vi.mock("@/pages/ConnectClaude", () => ({
  CLAUDE_CODE_CMD: "command",
  CURSOR_JSON: "{}",
  FREE_DOOR: "/mcp/free",
  ONE_LINE: "command",
  TOOLS: [],
}));
vi.mock("@/pages/ConnectHub", () => ({
  A2A_ENDPOINT: "/a2a",
  AGENT_CARD: "/agent-card.json",
  FULL_DOOR: "/mcp",
  PLATFORMS: [],
  VERIFY_OFFLINE: "command",
}));

const controls: [string, (text: string) => ReactNode][] = [
  [
    "workflow takeaway",
    (text) => <CopyBlock text={text} label="Record JSON" />,
  ],
  [
    "connection snippet",
    (text) => <CopyLine text={text} label="Install command" />,
  ],
  [
    "API example",
    (text) => (
      <div>
        <ApiExampleCopy text={text} id="curl" />
        <pre>
          <code>{text}</code>
        </pre>
      </div>
    ),
  ],
];
const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const render = async (node: ReactNode) => {
  await act(async () => root.render(node));
};
const click = async () => {
  await act(async () => container.querySelector("button")!.click());
};
const status = () => container.querySelector('[role="status"]')!.textContent;
const clipboard = (writeText?: (text: string) => Promise<void>) =>
  vi.stubGlobal("navigator", {
    clipboard: writeText ? { writeText } : undefined,
  });

describe.each(controls)("reliable copy: %s", (_name, control) => {
  it("waits for the clipboard promise and sends the displayed bytes only once", async () => {
    const pending = deferred();
    const write = vi.fn((_text: string) => pending.promise);
    clipboard(write);
    await render(control("exact bytes\nwith newline"));
    await click();
    expect(write.mock.calls).toEqual([["exact bytes\nwith newline"]]);
    expect(status()).toContain("Copying");
    expect(status()).not.toContain("Copied");
    expect(container.querySelector("button")!.disabled).toBe(true);
    expect(container.querySelector("button")!.classList).toContain("min-h-11");
    await click();
    expect(write).toHaveBeenCalledOnce();
    await act(async () => pending.resolve());
    expect(status()).toContain("Copied");
    expect(container.querySelector("button")!.disabled).toBe(false);
  });

  it("retains actionable feedback after a rejected copy without hiding the displayed text", async () => {
    const pending = deferred();
    clipboard(() => pending.promise);
    await render(control("manual recovery bytes"));
    await click();
    await act(async () => pending.reject(new Error("permission denied")));
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(status()).toContain("Copy could not be confirmed");
    expect(status()).toContain("select and copy");
    expect(container.querySelector("pre code")!.textContent).toBe(
      "manual recovery bytes",
    );
    expect(status()).not.toContain("Copied");
    expect(container.querySelector("button")!.disabled).toBe(false);
  });

  it("reports an unavailable clipboard and a synchronous clipboard exception", async () => {
    clipboard();
    await render(control("visible bytes"));
    await click();
    expect(status()).toContain("Copy could not be confirmed");
    clipboard(() => {
      throw new Error("blocked");
    });
    await click();
    expect(status()).toContain("Copy could not be confirmed");
    expect(status()).not.toContain("Copied");
  });

  it("ignores an old completion after bytes change away and back, and allows copying the current text", async () => {
    const old = deferred();
    const current = deferred();
    const write = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    clipboard(write);
    await render(control("first"));
    await click();
    await render(control("second"));
    await render(control("first"));
    expect(status()).toBe("");
    await click();
    await act(async () => old.resolve());
    expect(status()).toContain("Copying");
    await act(async () => current.resolve());
    expect(status()).toContain("Copied");
    expect(write).toHaveBeenCalledTimes(2);
    await render(control("third"));
    expect(status()).toBe("");
  });

  it("ignores completion after unmount", async () => {
    const old = deferred();
    clipboard(() => old.promise);
    await render(control("old"));
    await click();
    await render(null);
    await act(async () => old.reject(new Error("late rejection")));
    expect(container.textContent).toBe("");
  });
});

it("the API docs page uses confirmed clipboard feedback for its actual cURL example", async () => {
  const pending = deferred();
  const write = vi.fn((_text: string) => pending.promise);
  clipboard(write);
  await render(<ApiDocs />);
  const button = container.querySelector<HTMLButtonElement>(
    '[aria-label="Copy the curl example"]',
  )!;
  await act(async () => button.click());
  expect(container.textContent).not.toContain("Copied to clipboard.");
  expect(write.mock.calls[0][0]).toContain(
    "curl https://councilof.ai/api/gspc",
  );
  await act(async () => pending.reject(new Error("denied")));
  expect(container.textContent).toContain("Copy could not be confirmed");
});
