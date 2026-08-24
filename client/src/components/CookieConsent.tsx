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
      className="fixed bottom-[calc(var(--coai-estate-nav-height,3rem)+0.75rem)] left-3 z-40 w-[248px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-emerald-500/25 bg-white/97 backdrop-blur px-3 py-2.5 text-slate-700 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]"
    >
      <p className="text-[11px] leading-snug text-slate-500">
        Essential cookies only by default; anonymous analytics need consent.{" "}
        <a href="/cookie-policy" className="underline text-emerald-700 hover:text-emerald-600">Details</a>
      </p>
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => choose("declined")}
          className="flex-1 rounded-md border border-emerald-500/40 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Essential only
        </button>
        <button
          onClick={() => choose("accepted")}
          className="flex-1 rounded-md border border-emerald-600 bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
