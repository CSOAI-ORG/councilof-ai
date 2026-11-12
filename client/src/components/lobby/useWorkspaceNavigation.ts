import { useCallback, useEffect, useRef, useState } from "react";

export const WORKSPACE_SMALL_QUERY = "(max-width: 767px)";

/** Desktop navigation is discoverable on arrival; mobile stays out of the canvas. */
export function useWorkspaceNavigation() {
  const [isSmall, setIsSmall] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.(WORKSPACE_SMALL_QUERY).matches));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const focusRequested = useRef(false);
  const navigationOpen = isSmall ? drawerOpen : desktopNavOpen;

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(WORKSPACE_SMALL_QUERY);
    const update = (event: MediaQueryListEvent) => {
      setIsSmall(event.matches);
      if (!event.matches) setDrawerOpen(false);
    };
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  const toggleNavigation = useCallback(() => {
    focusRequested.current = !navigationOpen;
    if (isSmall) setDrawerOpen((open) => !open);
    else setDesktopNavOpen((open) => !open);
  }, [isSmall, navigationOpen]);

  useEffect(() => {
    if (!navigationOpen) return;
    const navigation = isSmall ? drawerRef.current : desktopNavigationRef.current;
    // An initially visible desktop sidebar must not steal focus from the page.
    if (focusRequested.current) {
      navigation?.querySelector<HTMLElement>("a")?.focus();
      focusRequested.current = false;
    }
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (!isSmall && !(event.target instanceof Node && navigation?.contains(event.target)) && event.target !== menuButtonRef.current) return;
      event.preventDefault();
      setDrawerOpen(false);
      setDesktopNavOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isSmall, navigationOpen]);

  return { isSmall, drawerOpen, setDrawerOpen, desktopNavOpen, navigationOpen, drawerRef, desktopNavigationRef, menuButtonRef, toggleNavigation };
}
