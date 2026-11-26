// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost/"}
/**
 * The specialist pane, mounted, reading every committed public/axis-specialists/<axis>.json
 * through a stubbed same-origin fetch: the bytes a reader can download, never a typed fixture.
 * A file that states a limit (the held rows) must show that limit, word for word, before any
 * figure from its row, and every figure the pane prints from that row must be described by it.
 * A file with no limit must gain nothing. No figure from any row is typed here.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import INDEX from "../../../../public/axis-specialists/index.json";
import CouncilAxisSpecialistPane, { validateAxisSpecialistAudit } from "./CouncilAxisSpecialistPane";

type Committed = { axis: string; limit?: unknown; source: { axis_row: { n: number } } };
const fileText = (axis: string) => readFileSync(resolve(__dirname, `../../../../public/axis-specialists/${axis}.json`), "utf8");
const committed = (axis: string): Committed => JSON.parse(fileText(axis));
const axes = INDEX.specialists.map((item) => item.axis);
const held = axes.filter((axis) => typeof committed(axis).limit === "string");
const plain = axes.filter((axis) => !held.includes(axis));

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const match = /^\/api\/axis-specialists\/([a-z0-9-]+)$/.exec(String(input));
    if (!match || !axes.includes(match[1])) throw new Error(`Unexpected transport: ${String(input)}`);
    return new Response(fileText(match[1]), { status: 200, headers: { "content-type": "application/json" } });
  }));
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(<CouncilAxisSpecialistPane />); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
});

/** Select an axis and wait until its own audit (not a loading or error state) is on screen. */
async function show(axis: string): Promise<HTMLElement> {
  const select = host.querySelector<HTMLSelectElement>('[data-testid="axis-specialist-select"]');
  if (!select) throw new Error("axis selector missing");
  if (select.value !== axis) {
    await act(async () => {
      select.value = axis;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  const ready = () => host.querySelector("#specialist-mission")?.textContent === `meok-${axis}-specialist`;
  for (let tick = 0; tick < 400 && !ready(); tick++) {
    await act(async () => { await new Promise((done) => setTimeout(done, 5)); });
  }
  expect(host.querySelector('[role="alert"]')?.textContent ?? "").toBe("");
  expect(ready()).toBe(true);
  const pane = host.querySelector<HTMLElement>('[data-testid="axis-specialists-pane"]');
  if (!pane) throw new Error("pane missing");
  return pane;
}

/** Text nodes in the selected audit (outside the shared header and outside any copy of the
 * limit itself) that print the row's own n. */
function printedFigures(pane: HTMLElement, n: number): Text[] {
  const figure = new RegExp(`(?<![\\w.])${n}(?![\\w.])`);
  const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("header, [data-limit], [data-limit-copy]")) continue;
    if (figure.test(node.textContent ?? "")) found.push(node as Text);
  }
  return found;
}

describe("axis specialist pane: a held row's stated limit", () => {
  it("is read from the committed files, and covers claim-maintenance and governance", () => {
    expect(held).toContain("claim-maintenance");
    expect(held).toContain("governance");
    for (const axis of held) {
      expect(INDEX.specialists.find((item) => item.axis === axis)).toHaveProperty("limit", committed(axis).limit);
    }
  });

  it("is shown first, word for word, and every figure printed from the row is described by it", async () => {
    for (const axis of held) {
      const file = committed(axis);
      const pane = await show(axis);
      const block = pane.querySelector<HTMLElement>(`[data-limit="${axis}"]`);
      expect(block, `${axis}: no Limit block`).not.toBeNull();
      const text = block!.querySelector<HTMLElement>("#axis-limit-text");
      expect(text?.textContent, `${axis}: limit not shown word for word`).toBe(file.limit);
      expect(block!.compareDocumentPosition(pane.querySelector("#specialist-mission")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const figures = printedFigures(pane, file.source.axis_row.n);
      expect(figures.length, `${axis}: the row's n is not printed`).toBeGreaterThan(0);
      for (const node of figures) {
        expect(block!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING, `${axis}: a figure comes before the limit`).toBeTruthy();
        const described = node.parentElement!.closest("[aria-describedby]")?.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
        expect(described, `${axis}: "${node.textContent}" is printed without the limit`).toContain("axis-limit-text");
      }

      const observed = [...pane.querySelectorAll("dt")].find((dt) => dt.textContent === "Observed n")!.parentElement!;
      expect(observed.textContent).toContain("Limit");
      expect(pane.querySelector(`[data-limit-copy="${axis}"]`)?.textContent).toBe(`Limit: ${file.limit}`);
    }
  });

  it("adds nothing to a row that states no limit", async () => {
    expect(plain.length).toBeGreaterThan(0);
    for (const axis of plain) {
      const pane = await show(axis);
      expect(pane.querySelector("[data-limit], [data-limit-copy], #axis-limit-text"), axis).toBeNull();
      expect(pane.querySelector('[aria-describedby~="axis-limit-text"]'), axis).toBeNull();
    }
  });

  it("refuses a held audit whose limit is missing, reworded or not text, and a limit on a row that has none", () => {
    for (const axis of held) {
      const limit = committed(axis).limit as string;
      const stripped: Record<string, unknown> = committed(axis);
      delete stripped.limit;
      for (const value of [stripped, { ...committed(axis), limit: `${limit} ` }, { ...committed(axis), limit: { text: limit } }]) {
        expect(() => validateAxisSpecialistAudit(value, axis), axis).toThrow("Unsafe or mismatched");
      }
      expect(validateAxisSpecialistAudit(committed(axis), axis).limit).toBe(limit);
    }
    for (const axis of plain) {
      expect(() => validateAxisSpecialistAudit({ ...committed(axis), limit: committed(held[0]).limit }, axis), axis).toThrow("Unsafe or mismatched");
    }
  });
});
