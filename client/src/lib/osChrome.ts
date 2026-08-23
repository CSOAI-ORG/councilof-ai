/**
 * osChrome — Council OS + public site share one page.
 *
 * When Council OS is open: marketing Header hides (LobbyHeader replaces it).
 * Footer and main site content stay visible — surfaces open in the page column.
 */
import { useEffect, useState } from "react";
import { isEmbedded } from "./embed";

export const OS_OPEN_ATTR = "data-coai-os-open";
export const OS_CHROME_EVENT = "coai:os-chrome";

export function setOsOpen(open: boolean): void {
  if (typeof document === "undefined") return;
  if (open) document.documentElement.setAttribute(OS_OPEN_ATTR, "1");
  else document.documentElement.removeAttribute(OS_OPEN_ATTR);
  window.dispatchEvent(new Event(OS_CHROME_EVENT));
}

export function isOsOpen(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(OS_OPEN_ATTR) === "1";
}

/** Hide marketing chrome only when embedded in a legacy frame. */
export function useSiteChromeHidden(): boolean {
  return isEmbedded();
}

/** Marketing site header — hidden when Council OS header is active. */
export function useMarketingHeaderHidden(): boolean {
  const [osOpen, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(isOsOpen());
    sync();
    window.addEventListener(OS_CHROME_EVENT, sync);
    return () => window.removeEventListener(OS_CHROME_EVENT, sync);
  }, []);
  return osOpen;
}

export function useOsOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(isOsOpen());
    sync();
    window.addEventListener(OS_CHROME_EVENT, sync);
    return () => window.removeEventListener(OS_CHROME_EVENT, sync);
  }, []);
  return open;
}
