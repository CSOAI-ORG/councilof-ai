/**
 * osChrome — Council OS + public site share one page.
 */
import { useEffect, useState } from "react";
import { isEmbedded } from "./embed";

export const OS_OPEN_ATTR = "data-coai-os-open";
export const OS_CHROME_EVENT = "coai:os-chrome";
export const DOCK_WIDTH_VAR = "--coai-os-dock-width";

export function setOsDockWidth(px: number): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (px <= 0) root.style.removeProperty(DOCK_WIDTH_VAR);
  else root.style.setProperty(DOCK_WIDTH_VAR, `${px}px`);
}

export function setOsOpen(open: boolean): void {
  if (typeof document === "undefined") return;
  if (open) document.documentElement.setAttribute(OS_OPEN_ATTR, "1");
  else {
    document.documentElement.removeAttribute(OS_OPEN_ATTR);
    setOsDockWidth(0);
  }
  window.dispatchEvent(new Event(OS_CHROME_EVENT));
}

export function isOsOpen(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(OS_OPEN_ATTR) === "1";
}

export function useSiteChromeHidden(): boolean {
  return isEmbedded();
}

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
