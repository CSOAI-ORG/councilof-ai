// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { TextEncoder } from "node:util";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Academy, { TRACKS } from "./Academy";
import { ACADEMY_READING_KEY, changeReadingMark, emptyReadingProgress, fingerprintAcademyTrack } from "@/lib/academyReadingProgress";

const route = vi.hoisted(() => ({ search: "", navigate: vi.fn() }));
vi.mock("wouter", () => ({ useLocation: () => ["/learn", route.navigate], useSearch: () => route.search }));
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("TextEncoder", TextEncoder);
  localStorage.clear(); route.search = ""; route.navigate.mockReset();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render() {
  await act(async () => root.render(<Academy />));
  for (let i = 0; i < 20 && host.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled; i++) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
  }
  expect(host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.disabled).toBe(false);
}
async function mark(index: number) { await act(async () => host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index].click()); }
function summary() { return host.querySelector('[data-testid="reading-progress"]')!.textContent; }
async function restore(raw: string) {
  const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File([raw], "reading.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => raw });
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
}

describe("Academy reading journey", () => {
  it("opens a shared track and marks nothing just because a lesson link was selected", async () => {
    route.search = "track=practice";
    await render();
    expect(host.querySelector('button[aria-pressed="true"]')!.textContent).toContain("Practise beside published AI results");
    const anchor = host.querySelector('ol a')!;
    anchor.addEventListener("click", (event) => event.preventDefault());
    await act(async () => (anchor as HTMLAnchorElement).click());
    expect(summary()).toBe("0 of 4 steps marked read");
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBeNull();
    expect(host.textContent).toContain("not an assessment or a completion record");
  });

  it("retains the chosen track and marks after leaving and reopening the page", async () => {
    await render();
    const build = Array.from(host.querySelectorAll("button")).find((button) => button.textContent?.includes("Build on the OS"))!;
    await act(async () => build.click());
    expect(route.navigate).toHaveBeenCalledWith("/learn?track=build");
    route.search = "track=build"; await render();
    await mark(0);
    expect(summary()).toBe("1 of 3 steps marked read");
    expect(host.textContent).toContain("Resume at step 2");
    const saved = localStorage.getItem(ACADEMY_READING_KEY)!;
    await act(async () => root.unmount()); root = createRoot(host); route.search = "";
    await render();
    expect(host.querySelector('button[aria-pressed="true"]')!.textContent).toContain("Build on the OS");
    expect(summary()).toBe("1 of 3 steps marked read");
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBe(saved);
    const share = Array.from(host.querySelectorAll("a")).find((anchor) => anchor.textContent === "Share this track")!;
    expect(share.getAttribute("href")).toBe("/learn?track=build");
  });

  it("holds previous-version marks separately when the content changes", async () => {
    const board = TRACKS.find((track) => track.id === "board")!;
    const saved = changeReadingMark(emptyReadingProgress(), board, "0".repeat(64), 0, true);
    localStorage.setItem(ACADEMY_READING_KEY, JSON.stringify(saved));
    await render();
    expect(summary()).toBe("0 of 4 steps marked read");
    expect(host.textContent).toContain("This track has changed");
    await mark(1);
    const updated = JSON.parse(localStorage.getItem(ACADEMY_READING_KEY)!);
    expect(updated.versions).toHaveLength(2);
    expect(updated.versions[0]).toEqual(saved.versions[0]);
    expect(summary()).toBe("1 of 4 steps marked read");
  });

  it("shows a useful fallback for an unknown track without constructing an external destination", async () => {
    route.search = "track=https%3A%2F%2Fexample.test";
    await render();
    expect(host.textContent).toContain("That track link is not recognized");
    expect(host.querySelector('button[aria-pressed="true"]')!.textContent).toContain("Read the living board");
    expect(host.querySelector('a[href="https://example.test"]')).toBeNull();
  });

  it("keeps marks in the tab and exposes storage failure instead of claiming they were saved", async () => {
    await render();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    await mark(0);
    expect(summary()).toBe("1 of 4 steps marked read");
    expect(host.textContent).toContain("Reading marks could not be saved");
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBeNull();
  });

  it("preserves unsaved marks when another tab changes storage", async () => {
    await render();
    const refused = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    await mark(0);
    refused.mockRestore();
    const board = TRACKS.find((track) => track.id === "board")!;
    const otherTab = changeReadingMark(emptyReadingProgress(), board, await fingerprintAcademyTrack(board), 2, true);
    localStorage.setItem(ACADEMY_READING_KEY, JSON.stringify(otherTab));
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: ACADEMY_READING_KEY })));
    expect(host.textContent).toContain("Your unsaved marks remain in this tab");
    expect(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[0].checked).toBe(true);
    expect(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[2].checked).toBe(false);
    await mark(1);
    expect(summary()).toBe("2 of 4 steps marked read");
    expect(JSON.parse(localStorage.getItem(ACADEMY_READING_KEY)!)).toEqual(otherTab);
  });

  it("records the new in-tab mark even when access to browser storage becomes unavailable", async () => {
    await render();
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("denied"); });
    await mark(0);
    expect(summary()).toBe("1 of 4 steps marked read");
    expect(host.textContent).toContain("New reading marks stay in this tab");
  });

  it("preserves an unsupported saved format while allowing temporary marks in this tab", async () => {
    const future = JSON.stringify({ schema: "future-reading-format", private: "retained" });
    localStorage.setItem(ACADEMY_READING_KEY, future);
    await render(); await mark(0);
    expect(summary()).toBe("1 of 4 steps marked read");
    expect(host.textContent).toContain("Existing saved data has been kept");
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBe(future);
    await restore(JSON.stringify(emptyReadingProgress()));
    expect(JSON.parse(localStorage.getItem(ACADEMY_READING_KEY)!)).toEqual(emptyReadingProgress());
    expect(summary()).toBe("0 of 4 steps marked read");
  });

  it("restores a portable copy, rejects a bad replacement, and lets the reader clear marks", async () => {
    await render();
    const board = TRACKS.find((track) => track.id === "board")!;
    const state = changeReadingMark(emptyReadingProgress(), board, await fingerprintAcademyTrack(board), 2, true);
    await restore(JSON.stringify(state));
    expect(summary()).toBe("1 of 4 steps marked read");
    expect(host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[2].checked).toBe(true);
    const saved = localStorage.getItem(ACADEMY_READING_KEY);
    await restore("invalid json");
    expect(summary()).toBe("1 of 4 steps marked read");
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBe(saved);
    const clear = Array.from(host.querySelectorAll("button")).find((button) => button.textContent === "Clear reading marks")!;
    await act(async () => clear.click());
    expect(summary()).toBe("0 of 4 steps marked read");
    expect(JSON.parse(localStorage.getItem(ACADEMY_READING_KEY)!).versions).toEqual([]);
  });

  it("does not apply a file read that completes after the reader leaves the page", async () => {
    await render();
    let finish!: (raw: string) => void;
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["pending"], "reading.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => new Promise<string>((resolve) => { finish = resolve; }) });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    await act(async () => root.render(<p>Left the Academy</p>));
    await act(async () => finish(JSON.stringify(emptyReadingProgress("practice"))));
    expect(localStorage.getItem(ACADEMY_READING_KEY)).toBeNull();
    expect(route.navigate).not.toHaveBeenCalled();
  });
});
