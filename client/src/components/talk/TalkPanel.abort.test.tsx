// @vitest-environment jsdom
// The abort lifecycle of a run. No network, no backend, no acceptance request.
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TalkPanel, { type TalkPanelHandle } from "./TalkPanel";

/**
 * A run that has ended must not be abortable.
 *
 * Aborting a request whose body has already been read to EOF is not harmless: Chromium reports
 * it as `requestfailed` / `net::ERR_ABORTED`, so the browser's network verdict says a request
 * failed when the application's own evidence says it completed. On 2026-10-28 that disagreement
 * is what made the Council OS first question red on the 375px mobile run — the browser said
 * ERR_ABORTED, the run's own trace said `body.nativeEOF` with `aborted: false` and a complete
 * digest, and the qualification that compares the two could not accept a completion whose two
 * witnesses contradicted each other.
 *
 * These two cases are the ratchet: a completed run must NOT be aborted when the pane goes away,
 * and a run that is still in flight MUST be. The first assertion fails on the old code, where
 * `abortRef` kept pointing at the finished run's controller.
 */

const runState: { resolve?: () => void; signal?: AbortSignal; calls: number } = { calls: 0 };

vi.mock("@/lib/aguiTalk", async () => {
  const actual = await vi.importActual<typeof import("@/lib/aguiTalk")>("@/lib/aguiTalk");
  return {
    ...actual,
    streamRun: (o: { signal: AbortSignal }) => {
      runState.calls += 1;
      runState.signal = o.signal;
      return new Promise<void>((resolve) => { runState.resolve = resolve; });
    },
  };
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mount(): { ask: () => void; unmount: () => void } {
  container = document.createElement("div");
  document.body.appendChild(container);
  const ref = createRef<TalkPanelHandle>();
  act(() => { root = createRoot(container!); root!.render(<TalkPanel ref={ref} hideSuggestions />); });
  const ask = () => {
    const input = container!.querySelector("#talk-input") as HTMLInputElement | null;
    const form = input?.closest("form") as HTMLFormElement | null;
    if (!input || !form) throw new Error("TalkPanel rendered no question form");
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "What is measured about github.com?");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  };
  const unmount = () => { act(() => { root?.unmount(); root = null; }); container?.remove(); container = null; };
  return { ask, unmount };
}

beforeEach(() => {
  runState.calls = 0; runState.resolve = undefined; runState.signal = undefined;
  // jsdom implements neither of these; the panel calls both on mount.
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (!window.matchMedia) {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  }
});
afterEach(() => { act(() => { root?.unmount(); root = null; }); container?.remove(); container = null; });

describe("TalkPanel aborts only a run that is still in flight", () => {
  it("does NOT abort a run that has already finished when the pane goes away", async () => {
    const { ask, unmount } = mount();
    ask();
    expect(runState.calls).toBe(1);
    expect(runState.signal?.aborted).toBe(false);

    // The run finishes: the stream resolves and the read is complete.
    await act(async () => { runState.resolve?.(); await Promise.resolve(); });
    expect(runState.signal?.aborted).toBe(false);

    // The pane goes away. The request is already done — there is nothing to stop, and aborting it
    // would make the browser report a failure that did not happen.
    unmount();
    expect(runState.signal?.aborted).toBe(false);
  });

  it("DOES abort a run that is still in flight when the pane goes away", () => {
    const { ask, unmount } = mount();
    ask();
    expect(runState.calls).toBe(1);
    expect(runState.signal?.aborted).toBe(false);

    // The pane goes away while the run is still streaming.
    unmount();
    expect(runState.signal?.aborted).toBe(true);
  });
});
