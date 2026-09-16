import { createContext, useContext } from "react";

/**
 * True inside App's public <main id="main-content">. A layout that would otherwise open its own
 * <main> (DashboardLayout, used directly by legacy pages such as /compliance and /reports) renders a
 * <section> there instead, so a page never carries two main landmarks. /dashboard renders outside
 * that <main>, keeps the default (false) and keeps its own <main>.
 * Enforced on the prerendered tree by scripts/content-promise-gate.mjs (one <main> per page).
 */
export const MainLandmarkContext = createContext(false);

export function useInsideMainLandmark(): boolean {
  return useContext(MainLandmarkContext);
}
