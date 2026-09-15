import { useEffect, useRef } from "react";
import cssText from "./style.css?inline";
import { mountEvidenceIndex } from "./mount";

/**
 * EvidenceIndexPane — the GSPC evidence index inside the dashboard shell
 * (/dashboard?tab=evidence-index). A thin wrapper: the view itself is the
 * framework-free module in ./mount.ts, the same module the Hugging Face Space
 * build serves, so the dashboard and the Space cannot present different indexes.
 *
 * Reads GET /api/coverage and GET /api/worker from this origin. Read-only.
 * It sits beside the GSPC board and GSPC terminal; it replaces neither.
 */
export default function EvidenceIndexPane() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    return mountEvidenceIndex(host.current, {
      cssText,
      origin: window.location.origin,
    });
  }, []);
  return (
    <div className="p-3 sm:p-6" data-testid="evidence-index-pane">
      <div ref={host} />
    </div>
  );
}
