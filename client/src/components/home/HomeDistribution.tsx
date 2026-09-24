import { useDistributionArtifact, type DistributionArtifact } from "./useHomeReads";
import type { FootprintRow } from "@/components/liveCountersFormat";
import type { ReadState } from "./homeReads";

const nf = new Intl.NumberFormat("en-GB");
const MAX_AGE_HOURS = 48;

type Count = { value: number; state: string; covered: number; attempted: number; asOf: string };

function count(row: unknown): Count | null {
  if (!row || typeof row !== "object") return null;
  const r = row as FootprintRow;
  if (r.state !== "READ" && r.state !== "PARTIAL" && r.state !== "STALE") return null;
  if (typeof r.value !== "number" || !Number.isSafeInteger(r.value) || r.value < 0) return null;
  if (typeof r.covered !== "number" || typeof r.attempted !== "number") return null;
  if (!Number.isSafeInteger(r.covered) || !Number.isSafeInteger(r.attempted) || r.covered < 0 || r.covered > r.attempted) return null;
  if (typeof r.as_of !== "string" || !Number.isFinite(Date.parse(r.as_of))) return null;
  return { value: r.value, state: r.state, covered: r.covered, attempted: r.attempted, asOf: r.as_of };
}

/** Read the dated artifact directly; the full funnel can spend 25 seconds walking a registry. */
export function distributionRead(payload: DistributionArtifact | null, now = Date.now()) {
  if (payload?.schema !== "csoai.distribution/0.1") return null;
  const lifetime = count(payload.totals?.downloads_all_time);
  const recent = count(payload.totals?.downloads_30d);
  if (!lifetime || !recent || lifetime.asOf !== recent.asOf || payload.as_of !== lifetime.asOf) return null;
  const ageHours = payload.max_age_hours;
  if (typeof ageHours !== "number" || !Number.isFinite(ageHours) || ageHours <= 0 || ageHours > MAX_AGE_HOURS) return null;
  const entityRows = payload.by_entity?.downloads_all_time;
  const names = ["meok", "csoai", "joint", "unattributed"] as const;
  const entries = names.map((name) => [name, count(entityRows?.[name])] as const);
  const entitySplit = entries.every(([, row]) => row && row.asOf === lifetime.asOf)
    && entries.reduce((sum, [, row]) => sum + (row?.value ?? 0), 0) === lifetime.value
      ? entries.map(([name, row]) => ({ name, value: row!.value }))
      : null;
  const stale = lifetime.state === "STALE" || recent.state === "STALE"
    || now - Date.parse(lifetime.asOf) > ageHours * 60 * 60 * 1000;
  const partial = lifetime.state === "PARTIAL" || recent.state === "PARTIAL";
  return { lifetime, recent, entitySplit, stale, partial };
}

function Figure({ row, label }: { row: Count; label: string }) {
  return (
    <div className="border-t border-[var(--ink-border)] pt-4">
      <p className="font-mono text-3xl font-black tracking-tight text-[var(--ink-foreground)] tabular-nums sm:text-4xl">
        {row.state === "PARTIAL" ? "≥ " : ""}{nf.format(row.value)}
      </p>
      <p className="ink-kicker mt-2 text-sm font-bold">{label}</p>
      <p className="ink-muted mt-1 text-xs leading-relaxed">
        {row.covered} of {row.attempted} package counters answered
      </p>
    </div>
  );
}

export default function HomeDistribution({
  injected,
  now,
}: {
  injected?: ReadState<DistributionArtifact>;
  now?: number;
}) {
  const read = useDistributionArtifact(injected);
  const result = read.kind === "ready" ? distributionRead(read.payload, now) : null;
  const date = result
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(result.lifetime.asOf))
    : null;

  return (
    <section id="distribution" aria-labelledby="home-distribution-h" className="surface-ink section-y-sm border-y border-[var(--ink-border)]" data-testid="home-distribution">
      <div className="section-shell grid gap-9 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <p className="t-kicker ink-kicker">Distribution, with its limits</p>
          <h2 id="home-distribution-h" className="t-band mt-3 max-w-xl text-[var(--ink-foreground)]">
            The published tools travel. Downloads are only the first signal.
          </h2>
          <p className="ink-muted mt-4 max-w-xl text-sm leading-relaxed">
            This census covers packages in the wider CSOAI and MEOK publishing estate across PyPI, npm and Hugging Face. It counts registry download events, including mirrors and automated traffic. It does not count unique people, active installations, executions or customers.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <a className="ink-kicker underline underline-offset-4 hover:text-white" href="/interop/distribution-latest.json">Inspect every counted package →</a>
            <a className="ink-kicker underline underline-offset-4 hover:text-white" href="/reach/">See the full adoption funnel →</a>
          </div>
        </div>
        <div className="ink-card rounded-3xl p-6 sm:p-8" aria-live="polite">
          {result ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <Figure row={result.lifetime} label="gross download events since first release" />
                <Figure row={result.recent} label="gross download events in registry 30-day windows" />
              </div>
              <p className="ink-muted mt-6 text-xs leading-relaxed">
                Published census dated {date} UTC · {result.stale ? "Out of date — a fresh census is needed." : result.partial ? "Partial read; missing counters are not treated as zero." : "All listed counters answered."} The PyPI source and a separate sample counter disagree, so these are reported registry events, not verified adoption.
              </p>
              {result.entitySplit && (
                <p className="ink-muted mt-3 text-xs leading-relaxed">
                  Of the cumulative total: {result.entitySplit.map(({ name, value }) => `${name === "meok" ? "MEOK" : name === "csoai" ? "CSOAI" : name} ${nf.format(value)}`).join(" · ")}. Package ownership labels come from the published census.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--ink-foreground)]">
              {read.kind === "failed" ? "The distribution feed is unavailable right now." : read.kind === "ready" ? "The distribution feed has no usable dated count." : "Reading the dated distribution feed…"} No figure is substituted.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
