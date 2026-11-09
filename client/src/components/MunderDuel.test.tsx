// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MunderDuel from "./MunderDuel";
import { MUNDER_KEY, MEOK_MODEL } from "@/lib/munderDuel";
import { generatePracticeRounds } from "@/lib/munderPractice";

let root: Root, host: HTMLDivElement;
const answer = JSON.stringify({ id: "chatcmpl-mounted", model: MEOK_MODEL,
  choices: [{ finish_reason: "stop", message: { role: "assistant", content: '{"action":"resolve"}' } }] });
function button(label: string) {
  const found = [...host.querySelectorAll("button")].find(b => b.textContent === label);
  if (!found) throw Error("Missing button: " + label);
  return found;
}
async function click(label: string) { await act(async () => { button(label).click(); }); }
async function mount(fetchImpl: typeof fetch, sourceRevision = "a".repeat(40)) {
  await act(async () => { root.render(<StrictMode><MunderDuel fetchImpl={fetchImpl} sourceRevision={sourceRevision} /></StrictMode>); });
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  sessionStorage.clear(); host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks();
});

describe("Munder participant journey", () => {
  it("sends nothing on mount and requires a saved human choice plus separate approval", async () => {
    const fetcher = vi.fn(async () => {
      const saved = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
      expect(saved.rounds[0].intent.requestId).toContain("_r1");
      expect(saved.rounds[0].human).toBe("resolve");
      return new Response(answer);
    });
    await mount(fetcher as typeof fetch);
    expect(fetcher).not.toHaveBeenCalled();
    await click("Start Munder with MEOK");
    await click("Choose resolve");
    expect(fetcher).not.toHaveBeenCalled();
    await click("Ask MEOK for its move");
    expect(host.textContent).toContain("MEOK proposes: resolve");
    expect(JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).rounds[0].approvedAt).toBeNull();
    await click("Approve MEOK move in this game");
    expect(JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).rounds[0].approvedAt).toBeTruthy();
    await click("Next Munder case");
    expect(host.textContent).toContain("case 2/8");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refuses I/O when the request intent cannot be saved", async () => {
    const fetcher = vi.fn();
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose resolve");
    const saved = sessionStorage.getItem(MUNDER_KEY);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("full"); });
    await click("Ask MEOK for its move");
    expect(fetcher).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(MUNDER_KEY)).toBe(saved);
    expect(host.textContent).toContain("could not be saved");
  });

  it("holds a failed provider response with no fallback or retry on remount", async () => {
    const fetcher = vi.fn(async () => new Response("unavailable", { status: 503 }));
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose escalate");
    await click("Ask MEOK for its move");
    expect(host.textContent).toContain("This request is held");
    expect(host.querySelector('[data-testid="munder-proposal"]')).toBeNull();
    await act(async () => root.unmount());
    root = createRoot(host); await mount(fetcher as typeof fetch);
    expect(host.textContent).toContain("This request is held");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("never repeats an in-flight request after unmount and restore", async () => {
    const fetcher = vi.fn((_url: unknown, opts: RequestInit) => new Promise<Response>((_resolve, reject) => {
      opts.signal!.addEventListener("abort", () => reject(new DOMException("abort", "AbortError")), { once: true });
    }));
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose resolve");
    await click("Ask MEOK for its move");
    expect(JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).rounds[0].intent).toBeTruthy();
    await act(async () => root.unmount());
    root = createRoot(host); await mount(fetcher as typeof fetch);
    expect(host.textContent).toContain("This request is held");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("applies one proposal once when the same rendered approval button is clicked twice", async () => {
    await mount(vi.fn(async () => new Response(answer)) as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose resolve");
    await click("Ask MEOK for its move");
    const approve = button("Approve MEOK move in this game");
    await act(async () => { approve.click(); approve.click(); });
    const s = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(s.rounds).toHaveLength(1); expect(s.rounds[0].approvedAt).toBeTruthy();
    expect(host.textContent).toContain("no current MEOK proposal");
  });

  it.each(["human", "ask", "approve", "next"])("refuses an old session's %s callback on a new session with the same case number", async kind => {
    const fetcher = vi.fn(async () => new Response(answer));
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK");
    if (kind !== "human") await click("Choose resolve");
    if (kind === "approve" || kind === "next") await click("Ask MEOK for its move");
    if (kind === "next") await click("Approve MEOK move in this game");
    const label = { human: "Choose resolve", ask: "Ask MEOK for its move",
      approve: "Approve MEOK move in this game", next: "Next Munder case" }[kind]!;
    const oldButton = button(label);
    const oldId = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).id;
    await click("Start a separate Munder game");
    const before = fetcher.mock.calls.length;
    await act(async () => { button("Start separate game").click(); oldButton.click(); });
    const s = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(s.id).not.toBe(oldId); expect(s.seed).toBe(43);
    expect(s.rounds).toHaveLength(1); expect(s.rounds[0].human).toBeNull();
    expect(s.rounds[0].intent).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(before);
  });



  it("records a local lesson and exact retry, then restores it without another provider request", async () => {
    const fetcher = vi.fn(async () => new Response(answer));
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose resolve");
    await click("Ask MEOK for its move"); await click("Approve MEOK move in this game");
    const original = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    await click("Open local lesson for case 1");
    const expected = generatePracticeRounds(42)[0].critical ? "escalate" : "resolve";
    expect(host.textContent).toContain("Known case rule: " + expected);
    const wrong = expected === "resolve" ? "escalate" : "resolve";
    await click("Retry case 1 as " + wrong); await click("Retry case 1 as " + expected);
    const after = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(after.rounds[0].human).toBe(original.rounds[0].human);
    expect(after.rounds[0].proof).toEqual(original.rounds[0].proof);
    expect(after.rounds[0].approvedAt).toBe(original.rounds[0].approvedAt);
    expect(after.rounds[0].learning.attempts.map((a: {choice: string}) => a.choice)).toEqual([wrong, expected]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount()); root = createRoot(host);
    await mount(fetcher as typeof fetch, "b".repeat(40));
    expect(host.textContent).toContain("Exact retry matched the known case rule");
    expect(JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).rounds[0].learning).toEqual(after.rounds[0].learning);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refuses an old session's lesson callback without overwriting the new game's history", async () => {
    const fetcher = vi.fn(async () => new Response(answer));
    await mount(fetcher as typeof fetch);
    await click("Start Munder with MEOK"); await click("Choose resolve");
    await click("Ask MEOK for its move"); await click("Approve MEOK move in this game");
    const oldOpen = button("Open local lesson for case 1");
    await click("Start a separate Munder game");
    await act(async () => { button("Start separate game").click(); oldOpen.click(); });
    const saved = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(saved.rounds[0].human).toBeNull();
    expect(saved.rounds[0].learning).toBeUndefined();
    expect(saved.rounds[0].intent).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps a resumed game's creation build when the app revision changes, without repeating I/O", async () => {
    const fetcher = vi.fn(async () => new Response(answer));
    await mount(fetcher as typeof fetch, "a".repeat(40));
    await click("Start Munder with MEOK"); await click("Choose resolve");
    await click("Ask MEOK for its move"); await click("Approve MEOK move in this game");
    const original = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(original.createdWithSourceRevision).toBe("a".repeat(40));
    await act(async () => root.unmount());
    root = createRoot(host);
    await mount(fetcher as typeof fetch, "b".repeat(40));
    const restored = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(restored.id).toBe(original.id);
    expect(restored.createdWithSourceRevision).toBe("a".repeat(40));
    expect(restored.rounds[0].approvedAt).toBe(original.rounds[0].approvedAt);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await click("Start a separate Munder game"); await click("Start separate game");
    const separate = JSON.parse(sessionStorage.getItem(MUNDER_KEY)!);
    expect(separate.id).not.toBe(original.id);
    expect(separate.createdWithSourceRevision).toBe("b".repeat(40));
    expect(separate.rounds[0].intent).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("preserves an incompatible save until an explicit new game", async () => {
    sessionStorage.setItem(MUNDER_KEY, '{"schema":"future"}');
    const fetcher = vi.fn();
    await mount(fetcher as typeof fetch);
    expect(host.textContent).toContain("has not been overwritten");
    expect(sessionStorage.getItem(MUNDER_KEY)).toBe('{"schema":"future"}');
    expect(fetcher).not.toHaveBeenCalled();
    await click("Start Munder with MEOK");
    expect(JSON.parse(sessionStorage.getItem(MUNDER_KEY)!).schema).toBe(MUNDER_KEY);
  });
});
