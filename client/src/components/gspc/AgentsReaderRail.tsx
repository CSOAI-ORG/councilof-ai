/**
 * The ERC-8004 agents census rail.
 *
 * Tools audit, 6 Oct 2026: this rail used to GET /api/agents on every load. No such endpoint is
 * published (there is no functions/api/agents.ts), so each load answered 404 and logged a console
 * error for nothing. The rail now makes no request and states the honest position: no agents
 * census is published yet, so there is no count to show. That is UNMEASURED, not zero.
 *
 * A catalogue mirror (csoai/erc8004-reader) is not substituted for the missing census. When the
 * endpoint ships, ReaderRails.truth.test.ts fails until this rail reads it again.
 */
export const AGENTS_CENSUS_ENDPOINT: string | null = null;

export default function AgentsReaderRail({
  heading = "Agents reader",
  className = "",
}: {
  heading?: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${className}`}
      data-testid="rail-agents"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
        <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
          UNMEASURED
        </span>
      </div>
      <p
        className="mt-1 text-xs text-slate-700"
        data-testid="rail-agents-unpublished"
      >
        UNMEASURED: no agents census is published yet, so no agent count is
        shown. Not zero: nothing has been counted.
      </p>
      <p className="mt-2 text-[11px] text-slate-600">
        <code>csoai/erc8004-reader</code> is a separate catalogue mirror; it
        does not stand in for a census.
      </p>
    </section>
  );
}
