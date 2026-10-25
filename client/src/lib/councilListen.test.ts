import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isListening, isListenSupported, startListening, stopListening } from "./councilListen";

class FakeRecognition extends EventTarget {
  static all: FakeRecognition[] = [];
  static startError: Error | null = null;
  continuous = true;
  interimResults = false;
  lang = "";
  maxAlternatives = 0;
  start = vi.fn(() => {
    if (FakeRecognition.startError) throw FakeRecognition.startError;
  });
  stop = vi.fn();
  abort = vi.fn();
  constructor() { super(); FakeRecognition.all.push(this); }
  emit(type: string, props: Record<string, unknown> = {}) {
    const event = new Event(type);
    Object.assign(event, props);
    this.dispatchEvent(event);
  }
  result(text: string, isFinal = true) {
    this.emit("result", { resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] });
  }
}

const hooks = () => ({
  onTranscript: vi.fn(),
  onStart: vi.fn(),
  onEnd: vi.fn(),
  onError: vi.fn(),
});
const latest = () => FakeRecognition.all[FakeRecognition.all.length - 1];

beforeEach(() => {
  FakeRecognition.all = [];
  FakeRecognition.startError = null;
  vi.stubGlobal("window", { SpeechRecognition: FakeRecognition });
  vi.stubGlobal("navigator", { language: "en-GB" });
});
afterEach(() => {
  stopListening({ discard: true });
  vi.unstubAllGlobals();
});

describe("push-to-talk session ownership", () => {
  it("keeps one utterance configuration and browser language", () => {
    const h = hooks();
    expect(isListenSupported()).toBe(true);
    expect(startListening(h)).toBe(true);
    expect(latest()).toMatchObject({ continuous: false, interimResults: true, maxAlternatives: 1, lang: "en-GB" });
    latest().emit("start");
    latest().result(" still speaking ", false);
    expect(h.onStart).toHaveBeenCalledOnce();
    expect(h.onTranscript).toHaveBeenCalledWith("still speaking", false);
    expect(isListening()).toBe(true);
  });

  it("delivers a final only once and ignores later interim results", () => {
    const h = hooks();
    startListening(h);
    latest().result(" actual question ");
    latest().result(" actual question ");
    latest().result("late interim", false);
    expect(h.onTranscript.mock.calls).toEqual([["actual question", true]]);
  });

  it("does not consume the final slot for whitespace", () => {
    const h = hooks();
    startListening(h);
    latest().result("   ");
    latest().result("question");
    expect(h.onTranscript.mock.calls).toEqual([["question", true]]);
  });

  it("cancels explicitly without submitting buffered or late text", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.emit("start");
    stopListening({ discard: true });
    expect(r.abort).toHaveBeenCalledOnce();
    expect(r.stop).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
    r.result("must not submit");
    r.emit("start");
    r.emit("error", { error: "network" });
    r.emit("end");
    stopListening();
    expect(h.onTranscript).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onStart).toHaveBeenCalledOnce();
    expect(h.onEnd).toHaveBeenCalledOnce();
  });

  it("ignores all old recognizer events after replacement", () => {
    const old = hooks();
    startListening(old);
    const first = latest();
    const next = hooks();
    startListening(next);
    const second = latest();
    expect(first.abort).toHaveBeenCalledOnce();
    expect(old.onEnd).toHaveBeenCalledOnce();
    first.emit("start");
    first.result("old question");
    first.emit("error", { error: "network" });
    first.emit("end");
    expect(isListening()).toBe(true);
    expect(old.onStart).not.toHaveBeenCalled();
    expect(old.onTranscript).not.toHaveBeenCalled();
    expect(old.onError).not.toHaveBeenCalled();
    expect(next.onEnd).not.toHaveBeenCalled();
    second.result("new question");
    second.emit("end");
    expect(next.onTranscript).toHaveBeenCalledWith("new question", true);
    expect(next.onEnd).toHaveBeenCalledOnce();
  });

  it("ends naturally once and blocks every subsequent event", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.emit("end");
    r.emit("end");
    r.result("late");
    r.emit("start");
    r.emit("error", { error: "network" });
    expect(isListening()).toBe(false);
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(h.onTranscript).not.toHaveBeenCalled();
    expect(h.onStart).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
  });

  it("settles a permission error even if the browser never sends end", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.emit("error", { error: "not-allowed" });
    expect(h.onError).toHaveBeenCalledWith("The microphone was not allowed. Type your question instead.");
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(r.abort).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
    r.result("late");
    r.emit("end");
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(h.onTranscript).not.toHaveBeenCalled();
  });

  it.each(["aborted", "no-speech"])("quietly settles %s without an error message", (error) => {
    const h = hooks();
    startListening(h);
    latest().emit("error", { error });
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
  });

  it("settles a throwing start and rejects its queued events", () => {
    const h = hooks();
    FakeRecognition.startError = new Error("cannot start");
    expect(startListening(h)).toBe(false);
    const r = latest();
    expect(h.onError).toHaveBeenCalledWith("cannot start");
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(r.abort).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
    r.emit("start");
    r.result("late");
    r.emit("end");
    expect(h.onStart).not.toHaveBeenCalled();
    expect(h.onTranscript).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalledOnce();
  });

  it("preserves a replacement started inside the final-transcript callback", () => {
    const next = hooks();
    const first = hooks();
    first.onTranscript.mockImplementation(() => startListening(next));
    startListening(first);
    const old = latest();
    old.result("first");
    const replacement = latest();
    old.emit("end");
    expect(isListening()).toBe(true);
    expect(next.onEnd).not.toHaveBeenCalled();
    replacement.result("second");
    expect(next.onTranscript).toHaveBeenCalledWith("second", true);
  });

  it("retires an existing recognizer before unsupported replacement", () => {
    const first = hooks();
    startListening(first);
    const old = latest();
    vi.stubGlobal("window", {});
    const next = hooks();
    expect(startListening(next)).toBe(false);
    expect(isListenSupported()).toBe(false);
    expect(isListening()).toBe(false);
    expect(first.onEnd).toHaveBeenCalledOnce();
    expect(old.abort).toHaveBeenCalledOnce();
    expect(next.onError).toHaveBeenCalledWith("This browser has no speech recognition. Type your question instead.");
    old.result("late");
    expect(first.onTranscript).not.toHaveBeenCalled();
  });

  it("reports constructor failure without leaving an active session", () => {
    vi.stubGlobal("window", { SpeechRecognition: class { constructor() { throw new Error("constructor failed"); } } });
    const h = hooks();
    expect(startListening(h)).toBe(false);
    expect(h.onError).toHaveBeenCalledWith("constructor failed");
    expect(isListening()).toBe(false);
  });

  it("supports webkit recognition and an explicit language", () => {
    vi.stubGlobal("window", { webkitSpeechRecognition: FakeRecognition });
    expect(startListening(hooks(), "fr-FR")).toBe(true);
    expect(latest().lang).toBe("fr-FR");
  });

  it("finalizes intentional stop with one buffered final before ending", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.emit("start");
    stopListening();
    stopListening();
    expect(r.stop).toHaveBeenCalledOnce();
    expect(r.abort).not.toHaveBeenCalled();
    expect(isListening()).toBe(true);
    expect(h.onEnd).not.toHaveBeenCalled();
    r.result("buffered question");
    r.result("buffered question");
    r.emit("end");
    expect(h.onTranscript.mock.calls).toEqual([["buffered question", true]]);
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
  });

  it("discards a pending normal stop when a new utterance replaces it", () => {
    const first = hooks();
    startListening(first);
    const old = latest();
    stopListening();
    const next = hooks();
    startListening(next);
    old.result("buffered old question");
    old.emit("end");
    expect(first.onTranscript).not.toHaveBeenCalled();
    expect(first.onEnd).toHaveBeenCalledOnce();
    expect(next.onEnd).not.toHaveBeenCalled();
    expect(isListening()).toBe(true);
  });

  it("accepts one start event and ignores a start queued after normal stop", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.emit("start");
    r.emit("start");
    expect(h.onStart).toHaveBeenCalledOnce();
    stopListening();
    r.emit("start");
    expect(h.onStart).toHaveBeenCalledOnce();
  });

  it("settles a throwing stop without accepting later results", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.stop.mockImplementation(() => { throw new Error("already stopped"); });
    stopListening();
    expect(r.abort).toHaveBeenCalledOnce();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
    r.result("late");
    expect(h.onTranscript).not.toHaveBeenCalled();
  });

  it("invalidates ownership before abort dispatches synchronous events", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.abort.mockImplementation(() => {
      r.result("must not submit");
      r.emit("error", { error: "aborted" });
      r.emit("end");
    });
    stopListening({ discard: true });
    expect(h.onTranscript).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
  });

  it("settles discard even when abort itself throws", () => {
    const h = hooks();
    startListening(h);
    const r = latest();
    r.abort.mockImplementation(() => { throw new Error("already stopped"); });
    expect(() => stopListening({ discard: true })).not.toThrow();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(false);
  });

  it("discards an utterance through its own abort signal", () => {
    const h = hooks();
    const owner = new AbortController();
    startListening({ ...h, signal: owner.signal });
    const r = latest();
    owner.abort();
    r.result("cancelled question");
    r.emit("end");
    expect(r.abort).toHaveBeenCalledOnce();
    expect(h.onEnd).toHaveBeenCalledOnce();
    expect(h.onTranscript).not.toHaveBeenCalled();
    expect(isListening()).toBe(false);
  });

  it("cannot cancel a newer panel through an old owner's signal", () => {
    const oldOwner = new AbortController();
    const old = hooks();
    startListening({ ...old, signal: oldOwner.signal });
    const oldRecognition = latest();
    const owner = new AbortController();
    const current = hooks();
    startListening({ ...current, signal: owner.signal });
    const currentRecognition = latest();
    oldOwner.abort();
    oldRecognition.emit("end");
    oldRecognition.result("stale");
    expect(currentRecognition.abort).not.toHaveBeenCalled();
    expect(current.onEnd).not.toHaveBeenCalled();
    expect(old.onEnd).toHaveBeenCalledOnce();
    expect(isListening()).toBe(true);
    currentRecognition.result("current");
    expect(current.onTranscript).toHaveBeenCalledWith("current", true);
  });

  it("ignores a normal stop requested by a stale owner", () => {
    const oldOwner = new AbortController();
    startListening({ ...hooks(), signal: oldOwner.signal });
    const owner = new AbortController();
    const h = hooks();
    startListening({ ...h, signal: owner.signal });
    const r = latest();
    stopListening({ signal: oldOwner.signal });
    expect(r.stop).not.toHaveBeenCalled();
    expect(r.abort).not.toHaveBeenCalled();
    expect(isListening()).toBe(true);
    r.result("current");
    expect(h.onTranscript).toHaveBeenCalledWith("current", true);
  });

  it("allows the current owner's normal stop to finalize buffered speech", () => {
    const owner = new AbortController();
    const h = hooks();
    startListening({ ...h, signal: owner.signal });
    const r = latest();
    stopListening({ signal: owner.signal });
    expect(r.stop).toHaveBeenCalledOnce();
    expect(r.abort).not.toHaveBeenCalled();
    r.result("buffered");
    r.emit("end");
    expect(h.onTranscript).toHaveBeenCalledWith("buffered", true);
    expect(h.onEnd).toHaveBeenCalledOnce();
  });

  it("does not replace the active mic for a caller whose signal was already aborted", () => {
    const current = hooks();
    startListening(current);
    const r = latest();
    const stale = new AbortController();
    stale.abort();
    expect(startListening({ ...hooks(), signal: stale.signal })).toBe(false);
    expect(latest()).toBe(r);
    expect(r.abort).not.toHaveBeenCalled();
    expect(current.onEnd).not.toHaveBeenCalled();
    expect(isListening()).toBe(true);
  });

  it("ignores an old owner's cleanup after its natural end and a new start", () => {
    const oldOwner = new AbortController();
    startListening({ ...hooks(), signal: oldOwner.signal });
    latest().emit("end");
    const current = hooks();
    startListening(current);
    const r = latest();
    oldOwner.abort();
    stopListening({ signal: oldOwner.signal, discard: true });
    expect(r.abort).not.toHaveBeenCalled();
    expect(current.onEnd).not.toHaveBeenCalled();
    expect(isListening()).toBe(true);
  });
});
