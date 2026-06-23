"use client";

import Link from "next/link";
import { useSyncExternalStore, useCallback } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  try {
    return localStorage.getItem("csoai-cookie-consent") || "";
  } catch {
    return "";
  }
}

function getServerSnapshot() {
  return "";
}

export default function CookieBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setConsent = useCallback((choice: "all" | "essential") => {
    try {
      localStorage.setItem("csoai-cookie-consent", choice);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  if (consent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 p-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-300">
          We use essential cookies and, with your consent, analytics cookies to improve csoai.org. See our{" "}
          <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConsent("essential")}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:border-emerald-500/40"
          >
            Essential only
          </button>
          <button
            onClick={() => setConsent("all")}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-600"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
