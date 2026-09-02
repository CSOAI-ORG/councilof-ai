import { lazy, Suspense } from "react";
const EstateDoors = lazy(() => import("@/components/home/EstateDoors"));
const XrplReaderRail = lazy(() => import("@/components/gspc/XrplReaderRail"));
/** Council OS · state tab — the tapes beside the board (errata: readers/doors are not axes 23+).
 *  Moved here from the home page (owner ruling 2 Sep: the home board is the living Space). */
export default function DashboardStatePane() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading state…</div>}>
      <div className="space-y-6 p-6" data-testid="dashboard-pane-state-body">
        <p className="text-sm text-muted-foreground">Readers and doors, probed on this load. They write nothing onto the board — quote <code>GET /api/gspc</code> for scores.</p>
        <XrplReaderRail />
        <EstateDoors />
      </div>
    </Suspense>
  );
}
