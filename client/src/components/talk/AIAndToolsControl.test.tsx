// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Control, { parseConversationCatalogue } from "./AIAndToolsControl";
import { DEFAULT_AI_EXECUTION, type AIExecutionSelection } from "../../../../functions/_lib/aiExecutionSelection";
let root: Root; let node: HTMLDivElement;
let observed: AIExecutionSelection;
const catalogue = { schema: "csoai.agui-run/0.1", execution: {
  version: 1, host: "cloud", provider: "council-tools", connectivity: "online", tools: ["board_totals", "get_axis"],
} };
async function mount(disabled = false) {
  function Host() {
    const [value, setValue] = useState(DEFAULT_AI_EXECUTION);
    observed = value;
    return <Control value={value} onChange={setValue} disabled={disabled} />;
  }
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  await act(async () => root.render(<Host />));
}
async function open() { await act(async () => node.querySelector<HTMLButtonElement>("button")!.click()); }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(catalogue)));
});
afterEach(async () => { if (root) await act(async () => root.unmount()); node?.remove(); vi.unstubAllGlobals(); });
describe("shared AI and tools control", () => {
  it("fetches only on expansion and applies a real tool restriction without sending a question", async () => {
    await mount(); expect(fetch).not.toHaveBeenCalled();
    await open();
    expect(fetch).toHaveBeenCalledTimes(1);
    const none = [...node.querySelectorAll("button")].find(button => button.textContent === "Select none")!;
    await act(async () => none.click());
    expect(observed.enabledTools).toEqual([]);
    expect([...node.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].every(box => !box.checked)).toBe(true);
    const first = node.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await act(async () => first.click());
    expect(observed.enabledTools).toEqual(["board_totals"]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps public tool controls separate from the real model connection", async () => {
    await mount(); await open();
    const selects = [...node.querySelectorAll("select")];
    expect(selects).toHaveLength(0);
    expect(node.textContent).toContain("Tools for this conversation");
    expect(node.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
  });
  it("holds selection changes during an active question", async () => {
    await mount(true); await open();
    expect(node.querySelector("fieldset")?.disabled).toBe(true);
    expect(node.textContent).toContain("held until it finishes");
  });
  it("accepts the published camel-case page-action tools", () => {
    expect(parseConversationCatalogue({ ...catalogue, execution: { ...catalogue.execution, tools: ["board_totals", "openSubject"] } }).tools).toContain("openSubject");
  });
  it("does not treat a legacy descriptor as an executable selection contract", () => {
    expect(() => parseConversationCatalogue({ schema: "csoai.agui-run/0.1", tools: ["board_totals"] })).toThrow(/not enabled/);
  });
  it("shows catalogue failure and retains the current selection", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw Error("Catalogue unavailable"); }));
    await mount(); await open();
    expect(node.textContent).toContain("Catalogue unavailable");
    expect(node.querySelector("fieldset")?.disabled).toBe(true);
    expect(observed.enabledTools).toBe(null);
  });
});
