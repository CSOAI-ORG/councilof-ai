import { useEffect, useState } from "react";

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

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-500/20 bg-[#03110b]/98 backdrop-blur px-4 py-4 pr-40 text-emerald-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-emerald-100/85 leading-relaxed">
          We use essential cookies to run this site, and — only with your consent — anonymous,
          no-third-party-cookie analytics to see which pages help. No personal data is sold or
          shared. See our{" "}
          <a href="/cookie-policy" className="underline text-emerald-300 hover:text-emerald-200">Cookie Policy</a>
          {" "}and{" "}
          <a href="/privacy" className="underline text-emerald-300 hover:text-emerald-200">Privacy Policy</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("declined")}
            className="rounded-full border border-emerald-400/30 px-4 py-1.5 text-xs font-bold text-emerald-100/80 hover:bg-white/5"
          >
            Essential only
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
