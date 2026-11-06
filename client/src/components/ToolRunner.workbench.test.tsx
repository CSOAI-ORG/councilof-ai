// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToolRunner, { resultOutcome, toolResponseJson, type RunnerTool } from "./ToolRunner";

type PaymentProps = {
  executePayment: (header: string) => Promise<{ status: string }>;
  isContextCurrent: () => boolean;
};
const mocks = vi.hoisted(() => ({
  list: vi.fn(), call: vi.fn(), receipt: vi.fn(), payment: [] as PaymentProps[],
}));
vi.mock("../lib/sovTools", () => ({
  listTools: mocks.list, callTool: mocks.call,
  TOOL_META: { board_totals: { label: "Live board totals", glyph: "B" } },
}));
vi.mock("@/lib/toolReceipts", () => ({ hashArgs: async () => "hash-only", recordToolReceipt: mocks.receipt }));
vi.mock("@/components/X402PayButton", () => ({ default: (props: PaymentProps) => {
  mocks.payment.push(props);
  return <button type="button" onClick={() => void props.executePayment("test-only-wallet-authorization")}>Explicit wallet action</button>;
} }));

const CATALOGUE: RunnerTool[] = [
  { name: "board_totals", description: "Read the published board", inputSchema: { type: "object", properties: {} } },
  { name: "get_axis", description: "Read one named axis", inputSchema: { type: "object", properties: { axis: { type: "string" } }, required: ["axis"] } },
  { name: "commission_card", description: "Commission existing evidence", csoai: { paid: true }, inputSchema: { type: "object", properties: { subject: { type: "string" } }, required: ["subject"] } },
];
const reply = (fields: Record<string, unknown> = { verdict: "UNCHECKABLE", reason: "No supported record" }) => ({
  ok: true, state: "runtime_observed" as const, text: JSON.stringify(fields),
  raw: { jsonrpc: "2.0", id: 1, result: { structuredContent: fields, content: [] } },
});
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; };
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.list.mockReset().mockResolvedValue({ state: "ok", tools: CATALOGUE });
  mocks.call.mockReset().mockResolvedValue(reply());
  mocks.receipt.mockClear(); mocks.payment.length = 0;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); await vi.runOnlyPendingTimersAsync(); });
  container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
});
async function mount(props: Partial<Parameters<typeof ToolRunner>[0]> = {}) {
  await act(async () => root.render(<ToolRunner catalogue={CATALOGUE} {...props} />));
}
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find((node) => node.textContent?.trim() === text)!;
async function click(node: HTMLElement) { await act(async () => node.click()); }
async function input(node: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("live tools workbench", () => {
  it("filters the supplied catalogue without selecting or executing a tool, and recovers an empty search", async () => {
    const selected = vi.fn(); await mount({ onToolSelect: selected });
    const search = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    const choices = container.querySelector<HTMLElement>(".csoai-tool-runner-choices")!;
    expect(choices.contains(search)).toBe(false);
    expect(search.classList).toContain("min-h-11");
    expect(container.querySelector("select")!.classList).toContain("min-h-11");
    const sizing = container.querySelector("style")!.textContent!;
    expect(sizing).toContain("max-height: 14rem");
    expect(sizing).toContain("max-height: 36rem");
    expect(sizing).toContain("overflow-y: auto");
    expect([...choices.querySelectorAll("button")].every((node) => node.classList.contains("min-h-11"))).toBe(true);
    await input(search, "one axis");
    const navigation = container.querySelector('nav[aria-label="Callable MCP tools"]')!;
    expect(navigation.textContent).toContain("get_axis");
    expect(navigation.textContent).not.toContain("commission_card");
    await input(search, "unavailable-tool-name");
    expect(navigation.textContent).toContain("No tools match these filters");
    await click(button("Clear filters"));
    expect(navigation.textContent).toContain("commission_card");
    const access = navigation.querySelector("select")!;
    await act(async () => { access.value = "metered"; access.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(navigation.textContent).toContain("commission_card");
    expect(navigation.textContent).not.toContain("get_axis");
    expect(mocks.call).not.toHaveBeenCalled(); expect(selected).not.toHaveBeenCalled();
  });

  it("reports only the selected tool name to its host and never executes from a seeded link", async () => {
    const selected = vi.fn(); await mount({ onToolSelect: selected });
    await click([...container.querySelectorAll<HTMLButtonElement>("nav button")].find((node) => node.textContent?.includes("get_axis"))!);
    expect(selected.mock.calls).toEqual([["get_axis"]]);
    expect(JSON.parse(container.querySelector("details code")!.textContent!)).toEqual(CATALOGUE[1].inputSchema);
    const args = { axis: "safety" };
    await mount({ initialToolName: "get_axis", initialArguments: args, onToolSelect: selected });
    expect(container.querySelector<HTMLInputElement>('#mcp-get_axis-axis')?.value).toBe("safety");
    expect(mocks.call).not.toHaveBeenCalled(); expect(selected).toHaveBeenCalledOnce();
  });

  it("keeps an unknown historical tool unavailable until the user selects a catalogued tool", async () => {
    const selected = vi.fn();
    await mount({ initialToolName: "checklist:retired-framework", initialArguments: { subject: "old draft" }, onToolSelect: selected });
    expect(container.textContent).toContain("Requested tool is not advertised.");
    expect(container.textContent).toContain("checklist:retired-framework");
    expect(container.textContent).toContain("No other tool was selected or run.");
    expect(container.querySelector('nav [aria-current="page"]')).toBeNull();
    expect(button("Run tool")).toBeUndefined();
    expect(mocks.call).not.toHaveBeenCalled(); expect(selected).not.toHaveBeenCalled();
    await click([...container.querySelectorAll<HTMLButtonElement>("nav button")].find((node) => node.textContent?.includes("get_axis"))!);
    expect(container.textContent).not.toContain("Requested tool is not advertised.");
    expect(container.querySelector<HTMLInputElement>('#mcp-get_axis-axis')?.value).toBe("");
    expect(selected.mock.calls).toEqual([["get_axis"]]);
    expect(button("Run tool")).toBeDefined(); expect(mocks.call).not.toHaveBeenCalled();
  });

  it("does not substitute board totals for a missing live-catalogue link or show its prior result", async () => {
    const pending = deferred<ReturnType<typeof reply>>(); mocks.call.mockReturnValue(pending.promise);
    await mount({ catalogue: undefined, initialToolName: "board_totals" });
    await click(button("Run tool"));
    await mount({ catalogue: undefined, initialToolName: "removed_tool" });
    await act(async () => pending.resolve(reply({ state: "OLD_BOARD_RESULT" })));
    expect(container.textContent).toContain("Requested tool is not advertised.");
    expect(container.textContent).toContain("removed_tool");
    expect(container.querySelector('nav [aria-current="page"]')).toBeNull();
    expect(container.querySelector('[data-testid="tool-runner-output"]')).toBeNull();
    expect(button("Run tool")).toBeUndefined(); expect(mocks.call).toHaveBeenCalledOnce();
  });

  it("shows the returned verdict separately from transport state and exports only this parsed response", async () => {
    const returned = reply(); mocks.call.mockResolvedValue(returned);
    await mount(); await click(button("Run tool"));
    const output = container.querySelector('[data-testid="tool-runner-output"]')!;
    expect(output.textContent).toContain("RUNTIME_OBSERVED");
    expect(output.textContent).toContain("Returned outcome: UNCHECKABLE");
    expect(output.querySelector("time")?.getAttribute("datetime")).toMatch(/^\d{4}-/);
    expect(output.textContent).toContain("POST /mcp");
    expect(output.textContent).toContain("No supported record");
    const clipboard = vi.fn(async (_text: string) => {}); vi.stubGlobal("navigator", { clipboard: { writeText: clipboard } });
    await click(button("Copy JSON"));
    expect(JSON.parse(clipboard.mock.calls[0][0])).toEqual(returned.raw);
    expect(output.textContent).toContain("Response JSON copied.");
    const readable = output.querySelector<HTMLButtonElement>('[role="tab"][data-output-view="readable"]')!;
    await act(async () => readable.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(output.querySelector('[role="tab"][data-output-view="json"]')?.getAttribute("aria-selected")).toBe("true");
    expect(JSON.parse(output.querySelector("[role=tabpanel] code")!.textContent!)).toEqual(returned.raw);
    const create = vi.fn(() => "blob:test-response"); const revoke = vi.fn();
    const BaseURL = URL; vi.stubGlobal("URL", class extends BaseURL { static createObjectURL = create; static revokeObjectURL = revoke; });
    const downloads: string[] = []; vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    await click(button("Download JSON"));
    expect(downloads).toEqual(["csoai-board_totals-response.json"]); expect(create).toHaveBeenCalledOnce();
    expect(output.textContent).toContain("do not confirm that a response was saved elsewhere");
    await act(async () => vi.advanceTimersByTimeAsync(2000)); expect(revoke).toHaveBeenCalledWith("blob:test-response");
  });

  it("keeps a visible manual-copy recovery message when the clipboard rejects", async () => {
    await mount(); await click(button("Run tool"));
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    await click(button("Copy JSON"));
    expect(container.textContent).toContain("Copy could not be confirmed");
    expect(container.textContent).toContain("copy it manually");
  });

  it("ignores a late result after same-tool arguments change, without issuing another call", async () => {
    const pending = deferred<ReturnType<typeof reply>>(); mocks.call.mockReturnValue(pending.promise);
    await mount({ initialToolName: "get_axis", initialArguments: { axis: "safety" } });
    await click(button("Run tool"));
    await mount({ initialToolName: "get_axis", initialArguments: { axis: "care" } });
    await act(async () => pending.resolve(reply({ state: "OLD_SAFETY_RESULT" })));
    expect(container.querySelector('[data-testid="tool-runner-output"]')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('#mcp-get_axis-axis')?.value).toBe("care");
    expect(mocks.call).toHaveBeenCalledOnce();
  });

  it("does not attach an old clipboard promise to a newly selected result", async () => {
    const copied = deferred<void>();
    await mount(); await click(button("Run tool"));
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(() => copied.promise) } });
    await click(button("Copy JSON"));
    await click([...container.querySelectorAll<HTMLButtonElement>("nav button")].find((node) => node.textContent?.includes("get_axis"))!);
    await input(container.querySelector<HTMLInputElement>('#mcp-get_axis-axis')!, "care");
    await click(button("Run tool"));
    await act(async () => copied.resolve());
    expect(container.textContent).not.toContain("Response JSON copied.");
  });

  it("retries catalogue discovery with an explicit cache bypass and performs no tool call", async () => {
    mocks.list.mockResolvedValueOnce({ state: "unreachable", reason: "offline" }).mockResolvedValueOnce({ state: "ok", tools: CATALOGUE });
    await mount({ catalogue: undefined });
    expect(container.textContent).toContain("could not be read");
    await click(button("Retry catalogue"));
    expect(mocks.list.mock.calls).toEqual([[], ["/mcp", { force: true }]]);
    expect(container.textContent).toContain("3 of 3 catalogued"); expect(mocks.call).not.toHaveBeenCalled();
  });

  it("names a failed download without claiming that the response was saved", async () => {
    await mount(); await click(button("Run tool"));
    const BaseURL = URL;
    vi.stubGlobal("URL", class extends BaseURL { static createObjectURL = () => { throw new Error("unavailable"); }; });
    await click(button("Download JSON"));
    expect(container.textContent).toContain("The download could not start");
    expect(container.textContent).toContain("copy the visible response instead");
  });

  it("reports an unexpected transport rejection as unknown and never echoes its exception", async () => {
    mocks.call.mockRejectedValue(new Error("private request content must not render"));
    await mount(); await click(button("Run tool"));
    expect(container.textContent).toContain("The tool call did not complete. Its result is unknown.");
    expect(container.textContent).not.toContain("private request content must not render");
    expect(container.querySelector('[data-testid="tool-runner-output"]')?.textContent).toContain("UNREACHABLE");
  });

  it("does not duplicate a call when the submit action is triggered twice before a result", async () => {
    const pending = deferred<ReturnType<typeof reply>>(); mocks.call.mockReturnValue(pending.promise);
    await mount();
    const run = button("Run tool");
    await act(async () => { run.click(); run.click(); });
    expect(mocks.call).toHaveBeenCalledOnce();
    await act(async () => pending.resolve(reply()));
  });

  it("keeps payment bound to the original draft and refuses a stale wallet callback", async () => {
    mocks.call.mockResolvedValue(reply({ status: "PAYMENT_REQUIRED", accepts: [{ network: "eip155:8453", payTo: "test-payee", amount: "1", resource: "https://councilof.ai/api/request-attestation" }] }));
    await mount({ initialToolName: "commission_card", initialArguments: { subject: "original" } });
    expect(mocks.call).not.toHaveBeenCalled();
    await click(button("Check terms · no payment"));
    const original = mocks.payment[mocks.payment.length - 1]; expect(original).toBeDefined();
    await input(container.querySelector<HTMLInputElement>('#mcp-commission_card-subject')!, "edited");
    expect(original.isContextCurrent()).toBe(false);
    const result = await original.executePayment("test-only-authorization");
    expect(result.status).toBe("failed"); expect(mocks.call).toHaveBeenCalledOnce();
    expect(mocks.call).toHaveBeenCalledWith("commission_card", { subject: "original" });
  });
});

describe("returned state fields", () => {
  it("reads status, state and verdict without inferring a measure or verification", () => {
    const base = { ok: true, state: "runtime_observed" as const, text: "" };
    expect(resultOutcome({ ...base, structuredContent: { state: "UNMEASURED" } })).toBe("UNMEASURED");
    expect(resultOutcome({ ...base, structuredContent: { verdict: "INVALID" } })).toBe("INVALID");
    expect(resultOutcome({ ...base, structuredContent: { status: "PAYMENT_REQUIRED", verdict: "VALID" } })).toBe("PAYMENT_REQUIRED");
    expect(resultOutcome(base)).toBeNull();
    expect(JSON.parse(toolResponseJson(base))).toEqual({ text: "" });
  });
});
