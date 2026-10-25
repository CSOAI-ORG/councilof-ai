/**
 * councilListen — opt-in, push-to-talk speech INPUT for Ask GSPC (speech output is councilVoice.ts).
 *
 * Extracted from the two inline copies it replaces (components/SovereignDock.tsx:231, retired, and
 * pages/DemoOS.tsx:148). The typed shape follows Agentshire `town-frontend/src/ui/speech.ts`
 * (itself from OpenClaw ui/src/ui/chat/speech.ts):
 *   MIT License, Copyright (c) 2025-2026 Agentshire Contributors. Permission is hereby granted,
 *   free of charge, to any person obtaining a copy of this software ... to deal in the Software
 *   without restriction ... subject to the inclusion of this notice. THE SOFTWARE IS PROVIDED
 *   "AS IS", WITHOUT WARRANTY OF ANY KIND.
 *
 * PRIVACY. This uses the browser's own SpeechRecognition. In Chrome that service may send the
 * audio to Google's servers to transcribe it; other browsers differ. Council of AI receives only
 * the text you then send. Text input is the default; nothing listens until you press the mic, and
 * listening stops after one utterance. LISTEN_PRIVACY_NOTE is the sentence every mic button shows.
 */

export const LISTEN_PRIVACY_NOTE =
  "Voice input uses your browser's speech recognition. In Chrome, that may send your audio to Google to transcribe it. We receive only the text you send. Typing is the default.";

type RecognitionResultEvent = Event & { results: SpeechRecognitionResultListLike; resultIndex: number };
type SpeechRecognitionResultListLike = { length: number; [i: number]: { isFinal: boolean; 0?: { transcript: string } } };
type RecognitionErrorEvent = Event & { error: string };

interface Recognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as RecognitionCtor | null;
}

export function isListenSupported(): boolean {
  return ctor() !== null;
}

export type ListenHooks = {
  /** Aborting this signal discards only this utterance, even after another panel takes the mic. */
  signal?: AbortSignal;
  /** Interim text while speaking (isFinal false), then the final utterance (isFinal true). */
  onTranscript: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

type ListenSession = {
  recognition: Recognition;
  signal?: AbortSignal;
  stopping: boolean;
  finish: (discard?: boolean) => void;
};

let active: ListenSession | null = null;

/** Start one push-to-talk utterance. Returns false (and calls onError) when unavailable. */
export function startListening(hooks: ListenHooks, lang?: string): boolean {
  // A cancelled caller must not retire a different panel\'s active microphone.
  if (hooks.signal?.aborted) return false;
  // Replacement always discards the prior utterance. stop() alone may return
  // buffered speech after it returns, which must not become a new question.
  stopListening({ discard: true });
  const C = ctor();
  if (!C) {
    hooks.onError?.("This browser has no speech recognition. Type your question instead.");
    return false;
  }
  let r: Recognition;
  try {
    r = new C();
  } catch (e) {
    hooks.onError?.(e instanceof Error ? e.message : String(e));
    return false;
  }
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.lang = lang || (typeof navigator !== "undefined" && navigator.language) || "en-GB";
  let ended = false;
  let started = false;
  let finalDelivered = false;
  const session: ListenSession = {
    recognition: r,
    signal: hooks.signal,
    stopping: false,
    finish: (discard = false) => {
      if (ended) return;
      ended = true;
      if (active === session) active = null;
      hooks.signal?.removeEventListener("abort", discardOwned);
      // Invalidate ownership before abort: browsers may dispatch events
      // synchronously as well as after this call.
      if (discard) {
        try { r.abort(); } catch { /* already stopped */ }
      }
      hooks.onEnd?.();
    },
  };
  const ownsSession = () => active === session && !ended;
  const discardOwned = () => {
    if (ownsSession()) session.finish(true);
  };
  r.addEventListener("start", () => {
    if (!ownsSession() || started || session.stopping) return;
    started = true;
    hooks.onStart?.();
  });
  r.addEventListener("result", (e) => {
    if (!ownsSession() || finalDelivered) return;
    const ev = e as RecognitionResultEvent;
    let interim = "";
    let final = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const t = res?.[0]?.transcript ?? "";
      if (res?.isFinal) final += t;
      else interim += t;
    }
    if (final.trim()) {
      // Latch before the callback: accepting a final may start a replacement.
      finalDelivered = true;
      hooks.onTranscript(final.trim(), true);
    } else if (interim.trim()) hooks.onTranscript(interim.trim(), false);
  });
  r.addEventListener("error", (e) => {
    if (!ownsSession()) return;
    const code = (e as RecognitionErrorEvent).error;
    // Settle even when the browser omits its following end event.
    session.finish(true);
    if (code !== "aborted" && code !== "no-speech") {
      hooks.onError?.(
        code === "not-allowed" || code === "service-not-allowed"
          ? "The microphone was not allowed. Type your question instead."
          : `Speech recognition stopped (${code}).`,
      );
    }
  });
  r.addEventListener("end", () => {
    if (ownsSession()) session.finish();
  });
  active = session;
  hooks.signal?.addEventListener("abort", discardOwned, { once: true });
  if (hooks.signal?.aborted) {
    session.finish(true);
    return false;
  }
  try {
    r.start();
  } catch (e) {
    if (ownsSession()) {
      session.finish(true);
      hooks.onError?.(e instanceof Error ? e.message : String(e));
    }
    return false;
  }
  return true;
}

/**
 * Finish the current utterance by default, accepting its one buffered final.
 * Teardown, unmount and cancellation must pass { discard: true }; replacement
 * does this internally. Pass the caller\'s signal to stop only its own utterance;
 * aborting that signal is the owner-targeted teardown path. Discarded sessions
 * cannot deliver further callbacks.
 */
export function stopListening(options: { discard?: boolean; signal?: AbortSignal } = {}): void {
  const session = active;
  if (!session || (options.signal && options.signal !== session.signal)) return;
  if (options.discard) {
    session.finish(true);
    return;
  }
  if (session.stopping) return;
  session.stopping = true;
  try {
    session.recognition.stop();
  } catch {
    session.finish(true);
  }
}

export function isListening(): boolean {
  return active !== null;
}
