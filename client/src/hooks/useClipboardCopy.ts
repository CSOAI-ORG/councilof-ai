import { useEffect, useRef, useState } from "react";

export type ClipboardCopyState = "idle" | "copying" | "copied" | "blocked";

/** Feedback belongs to the exact displayed bytes and the latest explicit copy attempt. */
export function useClipboardCopy(text: string) {
  const context = useRef({ text, generation: 0 });
  const attempt = useRef(0);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const [feedback, setFeedback] = useState({
    generation: 0,
    state: "idle" as ClipboardCopyState,
  });
  if (context.current.text !== text) {
    context.current = { text, generation: context.current.generation + 1 };
    attempt.current += 1;
    inFlight.current = false;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      attempt.current += 1;
    };
  }, []);

  async function copy(): Promise<boolean> {
    if (!mounted.current || inFlight.current) return false;
    const generation = context.current.generation;
    const sequence = ++attempt.current;
    const current = () =>
      mounted.current &&
      attempt.current === sequence &&
      context.current.generation === generation;
    inFlight.current = true;
    setFeedback({ generation, state: "copying" });
    try {
      if (typeof navigator.clipboard?.writeText !== "function")
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (!current()) return false;
      setFeedback({ generation, state: "copied" });
      return true;
    } catch {
      if (current()) setFeedback({ generation, state: "blocked" });
      return false;
    } finally {
      if (current()) inFlight.current = false;
    }
  }

  return {
    state:
      feedback.generation === context.current.generation
        ? feedback.state
        : ("idle" as ClipboardCopyState),
    copy,
  };
}
