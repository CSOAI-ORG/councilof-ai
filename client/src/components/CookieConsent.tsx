import { useEffect, useState } from "react";
import { useSiteChromeHidden } from "@/lib/osChrome";

const STORAGE_KEY = "csoai_cookie_consent";

export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "accepted"; } catch { return false; }
}

export default function CookieConsent() {
  const hideChrome = useSiteChromeHidden();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setVisible(true); } catch {}
  }, []);
  function choose(value: "accepted" | "declined") {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    setVisible(false);
  }
  if (hideChrome || !visible) return null;
  return null;
}
