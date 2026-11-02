// @vitest-environment jsdom
// Actual microphone dependency with a synthetic browser recognizer; no native audio or backend.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TalkPanel from "./TalkPanel";
import { stopListening } from "@/lib/councilListen";
import * as voice from "@/lib/councilVoice";

const recognizers: FakeRecognition[] = [];
const order: string[] = [];
class FakeRecognition extends EventTarget {
  continuous = false;
  interimResults = true;
  lang = "";
  maxAlternatives = 1;
  aborted = 0;
  stopped = 0;
  buffered = "";
  constructor() { super(); recognizers.push(this); }
  start() { order.push("mic-start"); this.dispatchEvent(new Event("start")); }
  result(text: string, final = true) {
    const event = new Event("result");
    Object.defineProperties(event, {
      resultIndex: { value: 0 },
      results: { value: { length: 1, 0: { isFinal: final, 0: { transcript: text } } } },
    });
    this.dispatchEvent(event);
  }
  stop() { this.stopped++; if (this.buffered) this.result(this.buffered); this.dispatchEvent(new Event("end")); }
  abort() { this.aborted++; this.result("discarded buffered text"); this.dispatchEvent(new Event("end")); }
  fail() { const event = new Event("error"); Object.defineProperty(event, "error", { value: "not-allowed" }); this.dispatchEvent(event); }
}
const roots = new Set<Root>();
const nodes: HTMLElement[] = [];
const recognitionDescriptor = Object.getOwnPropertyDescriptor(window, "SpeechRecognition");
const scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
let fetcher: ReturnType<typeof vi.fn>;
async function mount(listen = true) {
  const node = document.createElement("div"); nodes.push(node); document.body.append(node);
  const root = createRoot(node); roots.add(root);
  await act(async () => { root.render(<TalkPanel listen={listen} hideSuggestions />); });
  return { node, root };
}
function button(node: HTMLElement, name: string) {
  const value = node.querySelector<HTMLButtonElement>('button[aria-label="' + name + '"]');
  if (!value) throw new Error("Missing button: " + name);
  return value;
}
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  recognizers.length = 0; order.length = 0;
  Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(voice, "stopVoice").mockImplementation(() => { order.push("voice-stop"); });
  const frame = (type: string, extra = {}) => "event: " + type + "\ndata: " + JSON.stringify({ type, ...extra }) + "\n\n";
  fetcher = vi.fn(async () => new Response(frame("RUN_STARTED", { runId: "fixture-run", threadId: "fixture-thread" }) + frame("RUN_FINISHED", { result: { grounded: false } }), { headers: { "content-type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(async () => {
  for (const root of roots) await act(async () => root.unmount());
  roots.clear(); nodes.splice(0).forEach(node => node.remove());
  stopListening({ discard: true });
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  if (recognitionDescriptor) Object.defineProperty(window, "SpeechRecognition", recognitionDescriptor);
  else Reflect.deleteProperty(window, "SpeechRecognition");
  if (scrollDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollDescriptor);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
describe("owned voice drafts", () => {
  it("stops speech before listening and sends a final draft only after an explicit submit", async () => {
    const { node } = await mount();
    await act(async () => button(node, "Speak your question").click());
    expect(order).toEqual(["voice-stop", "mic-start"]);
    await act(async () => recognizers[0].result("Review the public record"));
    expect(node.querySelector("input")!.value).toBe("Review the public record");
    expect(fetcher).not.toHaveBeenCalled();
    await act(async () => {
      node.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.messages[0].content).toBe("Review the public record");
  });
  it("intentional stop accepts the buffered final as a draft exactly once", async () => {
    const { node } = await mount();
    await act(async () => button(node, "Speak your question").click());
    recognizers[0].buffered = "Buffered final";
    await act(async () => button(node, "Stop listening").click());
    expect(recognizers[0].stopped).toBe(1);
    expect(node.querySelector("input")!.value).toBe("Buffered final");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("voice off discards buffered and late input without losing an existing draft", async () => {
    const { node, root } = await mount();
    await act(async () => button(node, "Speak your question").click());
    await act(async () => recognizers[0].result("Existing draft", false));
    await act(async () => root.render(<TalkPanel listen={false} hideSuggestions />));
    await act(async () => recognizers[0].result("late input"));
    expect(recognizers[0].aborted).toBe(1);
    expect(node.querySelector("input")!.value).toBe("Existing draft");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("an old panel unmount cannot stop or overwrite a newer panel's microphone", async () => {
    const old = await mount();
    await act(async () => button(old.node, "Speak your question").click());
    const newer = await mount();
    await act(async () => button(newer.node, "Speak your question").click());
    expect(recognizers[0].aborted).toBe(1);
    await act(async () => old.root.unmount()); roots.delete(old.root);
    expect(recognizers[1].aborted).toBe(0);
    await act(async () => recognizers[1].result("New owner draft"));
    expect(newer.node.querySelector("input")!.value).toBe("New owner draft");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("still shows a microphone error delivered after the primitive's end callback", async () => {
    const { node } = await mount();
    await act(async () => button(node, "Speak your question").click());
    await act(async () => recognizers[0].fail());
    expect(node.querySelector('[data-testid="talk-mic-note"]')!.textContent).toContain("The microphone was not allowed");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
