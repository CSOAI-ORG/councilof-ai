/**
 * jurisdiction-link — shared selection state connecting the three surfaces
 * of the arena: the globe (Globe), the signed C-space branches (BranchView),
 * and the J-space records (JSpacePanel).
 *
 * One jurisdiction lit anywhere lights it everywhere:
 *   globe click         → matching branches + J-records outlined amber
 *   J-record chip       → jurisdiction lit amber on the globe
 *   C-space branch chip → jurisdiction lit amber on the globe
 *
 * State only. No model in the render loop.
 *
 * A7 — also broadcasts cross-route and cross-iframe. Every change emits a
 *   CustomEvent('sov:jurisdiction', {detail:{id, source}}) on window AND
 *   mirrors the active id to sessionStorage under 'sov:jurisdiction'. The
 *   live 3D globe in /public/globe3d.html listens for both, so:
 *     - on the same page, an iframe hosting globe3d.html reacts immediately
 *       when something on the React side changes the context;
 *     - navigating from /gspc-arena to /globe3d.html carries the lit
 *       jurisdiction across the route change, and the camera flies there
 *       on mount instead of starting on the default Atlantic view.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

interface JurisdictionLinkState {
  /** Currently lit jurisdiction ("EU" | "UK" | "US" | …), or undefined. */
  active?: string;
  /** Which surface lit it ("globe" | match id | record id | branch id). */
  source?: string;
  /** Toggle a jurisdiction; calling with the active one (or undefined) clears. */
  select: (id?: string, source?: string) => void;
}

const JurisdictionLink = createContext<JurisdictionLinkState>({
  active: undefined,
  source: undefined,
  select: () => {},
});

export function JurisdictionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | undefined>(() => {
    // A7 — hydrate from sessionStorage so a hot reload or remount keeps the
    // selected jurisdiction. Live-globe listeners read the same key.
    if (typeof window === "undefined") return undefined;
    try { return window.sessionStorage.getItem("sov:jurisdiction") || undefined; } catch { return undefined; }
  });
  const [source, setSource] = useState<string | undefined>();

  function select(id?: string, src?: string) {
    if (!id || id === active) {
      setActive(undefined);
      setSource(undefined);
    } else {
      setActive(id);
      setSource(src);
    }
    // A7 — broadcast cross-route + cross-iframe. The live 3D globe and any
    // other surface listening on window hears this without needing React
    // context reach. sessionStorage is the cross-route bridge for hard
    // navigations that lose the in-memory state.
    try { window.sessionStorage.setItem("sov:jurisdiction", id || ""); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("sov:jurisdiction", { detail: { id: id || null, source: src || null } }));
    } catch {}
  }

  return (
    <JurisdictionLink.Provider value={{ active, source, select }}>
      {children}
    </JurisdictionLink.Provider>
  );
}

export function useJurisdiction() {
  return useContext(JurisdictionLink);
}

/**
 * Shared "lit" styling — the amber ring a surface carries when its
 * jurisdiction is selected anywhere on the page. Use together with the
 * surface's base border class.
 */
export const LIT_RING_CLASS = "border-amber-400/80 shadow-[0_0_0_1px_rgba(245,158,11,0.45)]";
