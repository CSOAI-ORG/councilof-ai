import { useEffect, useRef, useState } from "react";

/**
 * Optional contact-storage challenge. The public email-draft route remains
 * available if the sitekey or challenge service is unavailable. Siteverify
 * (the only authority) runs on the backend before any KV put.
 */
type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string | number;
  reset(widgetId: string | number): void;
  remove(widgetId: string | number): void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function ContactTurnstile({
  onToken,
  resetRevision,
}: {
  onToken: (token: string) => void;
  resetRevision: number;
}) {
  const SITE_KEY = (import.meta.env?.VITE_CONTACT_TURNSTILE_SITE_KEY || "").trim();
  const parent = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | number | null>(null);
  const onTokenRef = useRef(onToken);
  const [state, setState] = useState<"NO_CONFIG" | "LOADING" | "READY" | "ERROR">(
    SITE_KEY ? "LOADING" : "NO_CONFIG",
  );
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    const mount = () => {
      if (cancelled || !parent.current || !window.turnstile || widgetId.current !== null) return;
      try {
        widgetId.current = window.turnstile.render(parent.current, {
          sitekey: SITE_KEY,
          action: "contact_enquiry",
          callback: (token: string) => {
            if (!cancelled) onTokenRef.current(token);
          },
          "expired-callback": () => {
            if (!cancelled) onTokenRef.current("");
          },
          "error-callback": () => {
            if (!cancelled) { onTokenRef.current(""); setState("ERROR"); }
          },
        });
        setState("READY");
      } catch {
        onTokenRef.current("");
        setState("ERROR");
      }
    };
    if (window.turnstile) {
      mount();
    } else {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = mount;
      script.onerror = () => {
        if (!cancelled) { onTokenRef.current(""); setState("ERROR"); }
      };
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (widgetId.current !== null) {
        try { window.turnstile?.remove(widgetId.current); } catch { /* fail closed */ }
        widgetId.current = null;
      }
      script?.remove();
    };
  }, []);

  useEffect(() => {
    if (resetRevision === 0 || widgetId.current === null) return;
    onTokenRef.current("");
    try { window.turnstile?.reset(widgetId.current); }
    catch { setState("ERROR"); }
  }, [resetRevision]);

  return (
    <div className="space-y-2" data-testid="contact-turnstile">
      <div ref={parent} aria-label="Human verification for optional enquiry storage" />
      {state === "NO_CONFIG" ? (
        <p className="text-sm text-muted-foreground">
          Optional storage is not configured. Use the email draft above to contact Council.
        </p>
      ) : state === "LOADING" ? (
        <p className="text-sm text-muted-foreground">Loading the optional storage verification…</p>
      ) : state === "ERROR" ? (
        <p role="status" className="text-sm text-amber-800">
          Storage verification is unavailable. Use the email draft instead.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Complete the verification to store a copy. This does not send an email.
        </p>
      )}
    </div>
  );
}
