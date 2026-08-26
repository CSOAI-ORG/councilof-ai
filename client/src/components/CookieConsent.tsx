import { useEffect, useState } from "react";
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

export default function CookieConsent() {
  const hideChrome = useSiteChromeHidden();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode / disabled) — don't block rendering, just skip the banner.
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    setVisible(false);
  }

  if (hideChrome || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 z-40 w-[260px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card/97 px-4 py-3 text-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] backdrop-blur"
    >
      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Essential cookies only by default; anonymous analytics need consent.{" "}
        <a href="/cookie-policy" className="text-primary underline underline-offset-2 hover:opacity-80">Details</a>
      </p>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => choose("declined")}
          className="flex-1 rounded-md border border-primary/40 px-2 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Essential only
        </button>
        <button
          onClick={() => choose("accepted")}
          className="flex-1 rounded-md border border-primary bg-primary px-2 py-1.5 text-[11.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
