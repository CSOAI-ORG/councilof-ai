import { useCallback, useEffect, type RefObject } from "react";

/**
 * useFocusTrap — keep Tab inside the lobby while it is a modal surface.
 *
 * TWO MECHANISMS, because one is not enough here.
 *
 *  1. A `keydown` handler on the dialog root wraps Shift+Tab off the first
 *     control and Tab off the last. This covers ordinary DOM controls.
 *
 *  2. Focus SENTINELS (see `useFocusTrap`'s companion <FocusSentinel> in
 *     LobbyOverlay). The centre pane is a same-origin IFRAME: once focus is
 *     inside the framed document, keydown events fire in THAT document and never
 *     reach our handler, so tabbing out of the frame would otherwise escape the
 *     dialog. A tabbable sentinel immediately after the dialog catches that exit
 *     and sends focus back to the top. The leading sentinel does the mirror.
 *
 * Honest limitation: while focus is inside the framed page, the trap is the
 * sentinels only — we cannot intercept keys in a document we do not own the
 * event loop of. Tab still cannot leave the lobby; it simply cycles through the
 * framed page's own controls first, which is the correct behaviour for an
 * embedded document.
 */

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

function visibleTabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => !el.hasAttribute("data-focus-sentinel") && el.offsetParent !== null,
  );
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  const focusEdge = useCallback(
    (edge: "first" | "last") => {
      const root = ref.current;
      if (!root) return;
      const els = visibleTabbables(root);
      if (!els.length) { root.focus(); return; }
      (edge === "first" ? els[0] : els[els.length - 1]).focus();
    },
    [ref],
  );

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = visibleTabbables(root);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      const a = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (a === first || !a || !root.contains(a)) { e.preventDefault(); last.focus(); }
      } else if (a === last) {
        e.preventDefault();
        first.focus();
      }
    };

    /**
     * The belt to the sentinels' braces: if focus ever lands OUTSIDE the dialog
     * while it is modal, pull it straight back in. This catches the iframe exit,
     * a stray programmatic focus() elsewhere on the page, and anything a browser
     * quirk sends past the keydown handler. The sentinels stay because they give
     * the CORRECT edge (top vs bottom) rather than always snapping to the top.
     */
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || root.contains(t) || t.hasAttribute?.("data-focus-sentinel")) return;
      const els = visibleTabbables(root);
      (els[0] ?? root).focus();
    };

    root.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [ref, active]);

  return focusEdge;
}
