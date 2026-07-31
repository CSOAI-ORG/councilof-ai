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
  const [active, setActive] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();

  function select(id?: string, src?: string) {
    if (!id || id === active) {
      setActive(undefined);
      setSource(undefined);
    } else {
      setActive(id);
      setSource(src);
    }
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
