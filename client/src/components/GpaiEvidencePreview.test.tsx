// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GpaiEvidencePreview } from "./GpaiEvidencePreview";
import { loadGpaiPreview, type EvidencePreview } from "@/lib/gpaiEvidencePreview";

vi.mock("@/lib/gpaiEvidencePreview", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/gpaiEvidencePreview")>();
  return { ...actual, loadGpaiPreview: vi.fn() };
});
const load = vi.mocked(loadGpaiPreview);
let container: HTMLDivElement, root: Root;
const view = (subject = ""): EvidencePreview => ({
  subject, count: 1, corpusDate: "2026-11-07T20:54:37Z", counselConfirmed: false,
  reviewNote: "Mapping review pending.",
  termsPath: "/api/evidence-bundle?obligation=article-53&bundle=1" + (subject ? "&subject=" + encodeURIComponent(subject) : ""),
  cards: [{ sha256: "a".repeat(64), subject: "Published record", path: "/cards/aaaaaaaaaaaaaaaa.json", asOf: "2026-10-01T02:03:04Z" }],
  availableSubjects: [],
});
const text = () => container.textContent ?? "";
const terms = () => container.querySelector<HTMLAnchorElement>('a[href*="bundle=1"]');
async function render() { await act(async () => root.render(<GpaiEvidencePreview />)); }
async function submit() { await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }); }
async function type(value: string) {
  await act(async () => {
    const input = container.querySelector("input")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  load.mockReset();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });

describe("GPAI report to existing evidence journey", () => {
  it("renders without automatic collection or assumed evidence counts", async () => {
    await render(); expect(load).not.toHaveBeenCalled(); expect(terms()).toBeNull();
    expect(text()).toContain("No evidence count is assumed");
    expect(container.querySelector('a[href="/gspc-verify"]')).not.toBeNull();
  });
  it("offers a labelled optional public filter and existing invoice route", async () => {
    await render();
    expect(container.querySelector('label[for="gpai-evidence-subject"]')?.textContent).toContain("optional");
    expect(container.querySelector('input')?.getAttribute("maxLength")).toBe("120");
    expect(container.querySelector('a[href="/contact/?arm=invoice&product=evidence-bundle"]')).not.toBeNull();
  });
  it("shows actual source dates, records and bound terms after explicit preview", async () => {
    load.mockResolvedValue(view("Provider")); await render(); await type("Provider"); await submit();
    expect(load).toHaveBeenCalledTimes(1); expect(load.mock.calls[0][0]).toBe("Provider");
    expect(text()).toContain("1 matching published record"); expect(text()).toContain("2026-11-07T20:54:37Z");
    expect(terms()?.getAttribute("href")).toContain("subject=Provider");
    expect(text()).toContain("does not verify those signatures"); expect(text()).toContain("Opening terms does not pay");
  });
  it("immediately removes old result and terms when the subject is edited", async () => {
    load.mockResolvedValue(view("Before")); await render(); await type("Before"); await submit();
    expect(terms()).not.toBeNull(); await type("After");
    expect(terms()).toBeNull(); expect(container.querySelector('[data-testid="gpai-preview-result"]')).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("ignores a slow old reply after the input changed", async () => {
    const pending = deferred<EvidencePreview>(); load.mockReturnValue(pending.promise);
    await render(); await type("Old"); await submit(); await type("New");
    expect(load.mock.calls[0][1].aborted).toBe(true);
    await act(async () => pending.resolve(view("Old")));
    expect(terms()).toBeNull(); expect(text()).not.toContain("1 matching published record");
  });
  it("keeps a newer result when an older request completes afterwards", async () => {
    const old = deferred<EvidencePreview>(); load.mockReturnValueOnce(old.promise).mockResolvedValueOnce(view("New"));
    await render(); await type("Old"); await submit(); await type("New"); await submit();
    await act(async () => old.resolve(view("Old")));
    expect(terms()?.getAttribute("href")).toContain("subject=New");
  });
  it("shows a readable empty result without a purchase link", async () => {
    load.mockResolvedValue({ ...view("Unknown"), count: 0, cards: [] });
    await render(); await type("Unknown"); await submit();
    expect(text()).toContain("0 matching published records"); expect(text()).toContain("No purchase link is offered"); expect(terms()).toBeNull();
  });
  it("uses a returned public suggestion without inventing options", async () => {
    load.mockResolvedValueOnce({ ...view("Unknown"), count: 0, cards: [], availableSubjects: ["Known"] }).mockResolvedValueOnce(view("Known"));
    await render(); await type("Unknown"); await submit();
    const button = [...container.querySelectorAll("button")].find(x => x.textContent === "Known")!;
    await act(async () => button.click());
    expect(load.mock.calls[1][0]).toBe("Known"); expect(terms()?.getAttribute("href")).toContain("subject=Known");
  });
  it("allows a deliberate reset to the whole obligation selection", async () => {
    load.mockResolvedValueOnce({ ...view("Unknown"), count: 0, cards: [] }).mockResolvedValueOnce(view());
    await render(); await type("Unknown"); await submit();
    const button = [...container.querySelectorAll("button")].find(x => x.textContent?.includes("whole Article 53"))!;
    await act(async () => button.click());
    expect(load.mock.calls[1][0]).toBe(""); expect(terms()?.getAttribute("href")).not.toContain("subject=");
  });
  it("shows unavailable as unknown and lets the buyer explicitly retry", async () => {
    load.mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValueOnce(view());
    await render(); await submit();
    expect(text()).toContain("unknown, not zero"); expect(text()).not.toContain("0 matching"); expect(terms()).toBeNull();
    await submit(); expect(terms()).not.toBeNull(); expect(load).toHaveBeenCalledTimes(2);
  });
  it("does not manufacture missing source dates or counsel confirmation", async () => {
    load.mockResolvedValue({ ...view(), corpusDate: null, counselConfirmed: null, reviewNote: null });
    await render(); await submit(); expect(text()).toContain("not supplied"); expect(text()).toContain("Counsel-review status was not supplied");
  });
  it("aborts a bounded request and displays its failed-read state", async () => {
    vi.useFakeTimers();
    load.mockImplementation((_subject, signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))));
    await render(); await submit(); await act(async () => vi.advanceTimersByTime(10_000));
    expect(load.mock.calls[0][1].aborted).toBe(true); expect(text()).toContain("unknown, not zero");
  });
  it("shows the deadline failure even when a transport ignores cancellation", async () => {
    vi.useFakeTimers();
    const pending = deferred<EvidencePreview>(); load.mockReturnValue(pending.promise);
    await render(); await submit(); await act(async () => vi.advanceTimersByTime(10_000));
    expect(text()).toContain("unknown, not zero"); expect(terms()).toBeNull();
    await act(async () => pending.resolve(view()));
    expect(text()).toContain("unknown, not zero"); expect(terms()).toBeNull();
  });
  it("aborts the outstanding request when the component is removed", async () => {
    const pending = deferred<EvidencePreview>(); load.mockReturnValue(pending.promise);
    await render(); await submit(); await act(async () => root.render(null));
    expect(load.mock.calls[0][1].aborted).toBe(true);
    await act(async () => pending.resolve(view())); expect(container.textContent).toBe("");
  });
  it("renders record text as text, not executable markup", async () => {
    const item = view(); item.cards[0].subject = '<img src=x onerror="alert(1)">';
    load.mockResolvedValue(item); await render(); await submit();
    expect(container.querySelector("img")).toBeNull(); expect(text()).toContain("<img");
  });
});
