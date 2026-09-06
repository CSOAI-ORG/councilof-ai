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
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-card/95 px-3 py-1.5 text-foreground"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Essential cookies only by default. Analytics need consent.{" "}
        <a href="/cookie-policy" className="text-primary underline underline-offset-2 hover:opacity-80">Details</a>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => choose("declined")}
          className="rounded-md border border-primary/40 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Essential only
        </button>
        <button
          onClick={() => choose("accepted")}
          className="rounded-md border border-primary bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Accept analytics
        </button>
      </div>
      </div>
    </div>
  );
}
