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
  /** Interim text while speaking (isFinal false), then the final utterance (isFinal true). */
  onTranscript: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

let active: Recognition | null = null;

/** Start one push-to-talk utterance. Returns false (and calls onError) when unsupported. */
export function startListening(hooks: ListenHooks, lang?: string): boolean {
  const C = ctor();
  if (!C) {
    hooks.onError?.("This browser has no speech recognition. Type your question instead.");
    return false;
  }
  stopListening();
  const r = new C();
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.lang = lang || (typeof navigator !== "undefined" && navigator.language) || "en-GB";
  r.addEventListener("start", () => hooks.onStart?.());
  r.addEventListener("result", (e) => {
    const ev = e as RecognitionResultEvent;
    let interim = "";
    let final = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const t = res?.[0]?.transcript ?? "";
      if (res?.isFinal) final += t;
      else interim += t;
    }
    if (final) hooks.onTranscript(final.trim(), true);
    else if (interim) hooks.onTranscript(interim.trim(), false);
  });
  r.addEventListener("error", (e) => {
    const code = (e as RecognitionErrorEvent).error;
    if (code === "aborted" || code === "no-speech") return;
    hooks.onError?.(
      code === "not-allowed" || code === "service-not-allowed"
        ? "The microphone was not allowed. Type your question instead."
        : `Speech recognition stopped (${code}).`,
    );
  });
  r.addEventListener("end", () => {
    if (active === r) active = null;
    hooks.onEnd?.();
  });
  active = r;
  try {
    r.start();
  } catch (e) {
    active = null;
    hooks.onError?.(e instanceof Error ? e.message : String(e));
    return false;
  }
  return true;
}

export function stopListening(): void {
  const r = active;
  active = null;
  try {
    r?.stop();
  } catch {
    /* already stopped */
  }
}

export function isListening(): boolean {
  return active !== null;
}
