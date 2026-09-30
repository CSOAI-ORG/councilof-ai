import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSiteChromeHidden } from "@/lib/osChrome";

// CookieConsent — a persistent (localStorage, not per-session) GDPR consent
// banner. CSOAI's analytics are memory-only (no third-party cookies, no
// endpoint configured by default — see Analytics.tsx), but the banner is
// still the right practice: it's the standard notice, and it's what actually
// gates analytics the moment an endpoint IS configured (see
// hasAnalyticsConsent() below, read by Analytics.tsx before any event fires).

const STORAGE_KEY = "csoai_cookie_consent"; // "accepted" | "declined"

export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "accepted"; } catch { return false; }
}

/**
 * The banner is fixed to the bottom edge, and so is the workspace launcher
 * (CouncilLobby, `bottom-5 right-5`). Measured on /products at 1280x800 on
 * 2026-09-06 they collided: the 158.34px pill overlapped the banner by 19.5px
 * across its whole width and covered 98.34px of the "Accept analytics" button.
 * The banner reserved `pr-16 sm:pr-20` (80px) for it; the pill needs 178.34px,
 * so the reservation was short by 98.34px — exactly the measured overlap.
 *
 * A reserved padding cannot work: the pill's width depends on its label, which
 * is hidden below `sm`. So the banner publishes its OWN measured height and the
 * launcher lifts by it. Nothing is typed; a taller wrapped banner pushes the
 * pill further on its own.
 */
const BANNER_H_VAR = "--cookie-banner-h";

export default function CookieConsent() {
  const hideChrome = useSiteChromeHidden();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const publishHeight = useCallback((px: number) => {
    try {
      document.documentElement.style.setProperty(BANNER_H_VAR, `${px}px`);
    } catch {
      // non-DOM environment — the launcher's own fallback of 0px applies.
    }
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode / disabled) — don't block rendering, just skip the banner.
    }
  }, []);

  // Measure what actually rendered, and keep measuring: the banner wraps to two
  // rows at narrow widths, which changes its height.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      publishHeight(0);
      return;
    }
    publishHeight(el.offsetHeight);
    const ro =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => publishHeight(el.offsetHeight))
        : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      publishHeight(0); // dismissed or unmounted — the pill drops back to bottom-5
    };
  }, [visible, hideChrome, publishHeight]);

  function choose(value: "accepted" | "declined") {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    setVisible(false);
  }

  if (hideChrome || !visible) return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-2 bottom-2 z-[60] rounded-2xl border border-border bg-card/95 px-3 py-2.5 text-foreground shadow-[0_18px_48px_-24px_rgba(4,18,12,.45)] backdrop-blur-md sm:inset-x-0 sm:bottom-0 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:px-3 sm:py-1.5 sm:shadow-none"
    >
      {/* Phone (audit 2026-09-30 #5): the sentence used to wrap into a five-line column beside
          three buttons, 113px of a 812px first screen. Now: one line of text with the dismiss
          control, then the two choices side by side at full width. No text under 12px. */}
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:flex sm:justify-between">
        <p className="min-w-0 text-xs leading-snug text-muted-foreground sm:flex-1">
          <span className="sm:hidden">Essential cookies only unless you opt in.</span>
          <span className="hidden sm:inline">Essential cookies only by default. Analytics need consent.</span>{" "}
          <a href="/cookie-policy" className="text-primary underline underline-offset-2 hover:opacity-80">Details</a>
        </p>
        <button
          type="button"
          onClick={() => choose("declined")}
          aria-label="Dismiss cookie notice"
          title="Dismiss — essential cookies only"
          className="order-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:order-3 sm:h-auto sm:w-auto sm:rounded-md sm:px-2 sm:py-1 sm:text-xs"
        >
          <span className="sm:hidden" aria-hidden="true">×</span>
          <span className="hidden sm:inline">Dismiss</span>
        </button>
        <div className="order-3 col-span-2 grid grid-cols-2 gap-2 sm:order-2 sm:flex sm:shrink-0 sm:items-center">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="min-h-9 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:min-h-0 sm:rounded-md sm:px-2 sm:py-1"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="min-h-9 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:min-h-0 sm:rounded-md sm:px-2 sm:py-1"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
