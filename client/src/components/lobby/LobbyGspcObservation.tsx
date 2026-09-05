import { Link } from "wouter";
import type { GspcChatObservation } from "@/lib/aguiGspcRead";

/** Render the observation captured by chat; mounting history never refetches it. */
export default function LobbyGspcObservation({
  observation,
}: {
  observation: GspcChatObservation;
}) {
  const { snapshot, observedAt } = observation;
  const rows = [...snapshot.measured, ...snapshot.empty];
  return (
    <section
      aria-label="GSPC board observation"
      className="mt-3 min-w-0 rounded-xl border border-border bg-background p-4"
    >
      <h3 className="text-sm font-semibold">GSPC board</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Read{" "}
        <time dateTime={observedAt}>
          {observedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}
        </time>
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Declared axes", snapshot.totals.axes],
            ["Reported measured", snapshot.totals.measured_axes],
            ["Unmeasured", snapshot.totals.unmeasured_axes],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg bg-muted/50 px-1 py-2">
            <dt className="text-[10px] leading-snug text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-semibold">
          Axis values in this response ({rows.length})
        </summary>
        <ul className="mt-2 divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.axis}
              className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-2"
            >
              <span className="min-w-0 break-words font-medium">
                {row.axis}
              </span>
              <span className="text-muted-foreground">
                {row.status} · n {row.n ?? "—"} · accuracy{" "}
                {row.accuracy === null ? "—" : row.accuracy.toFixed(3)}
              </span>
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        This is a saved board read. Individual rows retain their published
        evidence state; the read itself carries no signature or timestamp proof.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-primary">
        <Link href="/dashboard?tab=board" className="hover:underline">
          Open full board
        </Link>
        <a
          href="/api/gspc"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          Source data
        </a>
      </div>
    </section>
  );
}
