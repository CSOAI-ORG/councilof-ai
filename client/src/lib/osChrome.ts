/**
 * osChrome — one chrome at a time.
 *
 * Council OS, the public site, and the software dashboard (DSH) share this
 * page. When the OS overlay is open (not minimised), marketing Header/Footer
 * hide so the workspace is the only chrome. Embed frames already drop chrome
 * via isEmbedded(). Minimising the OS returns the public site.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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

/** /os is the product frame. Marketing Header/Footer must not stack on OsHeader. */
export function isOsProductPath(pathname: string): boolean {
  const p = (pathname || "/").split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return p === "/os";
}

/** Hide marketing chrome: framed pane, OS overlay, or the /os product page. */
export function useSiteChromeHidden(): boolean {
  const [location] = useLocation();
  const [osOpen, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(isOsOpen());
    sync();
    window.addEventListener(OS_CHROME_EVENT, sync);
    return () => window.removeEventListener(OS_CHROME_EVENT, sync);
  }, []);
  return isEmbedded() || osOpen || isOsProductPath(location);
}
