import { lazy, Suspense } from "react";
const EstateDoors = lazy(() => import("@/components/home/EstateDoors"));
const XrplReaderRail = lazy(() => import("@/components/gspc/XrplReaderRail"));
const SwiftReaderRail = lazy(() => import("@/components/gspc/SwiftReaderRail"));
const AgentsReaderRail = lazy(() => import("@/components/gspc/AgentsReaderRail"));
const McpReaderRail = lazy(() => import("@/components/gspc/McpReaderRail"));
const A2aReaderRail = lazy(() => import("@/components/gspc/A2aReaderRail"));
const TraceReaderRail = lazy(() => import("@/components/gspc/TraceReaderRail"));
const OtelReaderRail = lazy(() => import("@/components/gspc/OtelReaderRail"));
const OsPanels = lazy(() => import("@/components/OsPanels"));
/** Council OS · state tab — the tapes beside the board (errata: readers/doors are not axes 23+).
 *  Moved here from the home page (owner ruling 2 Sep: the home board is the living Space).
 *
 *  One grammar, six probes, one verify page. The seven rails are the tapes that the
 *  22-axis board hangs from — XRPL, SWIFT, AGENTS, MCP, A2A, TRACE, OTEL. Readers
 *  only. They write nothing onto the board — quote `GET /api/gspc` for scores.
 */
export default function DashboardStatePane() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading state…</div>}>
      <div className="space-y-6 p-6" data-testid="dashboard-pane-state-body">
        <p className="text-sm text-muted-foreground">
          Readers and doors, probed on this load. Seven tapes — XRPL, SWIFT, AGENTS, MCP, A2A, TRACE, OTEL.
          They write nothing onto the board — quote <code>GET /api/gspc</code> for scores.
        </p>
        <div className="grid gap-4 md:grid-cols-2" data-testid="dashboard-state-rails">
          <XrplReaderRail />
          <SwiftReaderRail />
          <AgentsReaderRail />
          <McpReaderRail />
          <A2aReaderRail />
          <TraceReaderRail />
          <OtelReaderRail />
        </div>
        <section data-testid="dashboard-state-panels">
          <h2 className="text-base font-semibold">Derived panels — every figure names its door</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The rails above are tapes. These are the derived reads: each number carries the endpoint
            and field it came from, and an unread source renders its reason rather than a zero.
          </p>
          <div className="mt-3">
            <OsPanels />
          </div>
        </section>
        <EstateDoors />
      </div>
    </Suspense>
  );
}
