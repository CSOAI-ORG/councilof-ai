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

/** A count as printed: "≥ N" when the row is a lower bound. */
function shown(row: Count): string {
  return `${row.state === "PARTIAL" ? "≥ " : ""}${nf.format(row.value)}`;
}

/** One entity's two windows from by_entity, or null unless both are readable and dated like the census. */
function entityWindows(payload: DistributionArtifact, name: string, asOf: string) {
  const lifetime = count(payload.by_entity?.downloads_all_time?.[name]);
  const recent = count(payload.by_entity?.downloads_30d?.[name]);
  return lifetime && recent && lifetime.asOf === asOf && recent.asOf === asOf ? { lifetime, recent } : null;
}

/**
 * Read the dated artifact directly; the full funnel can spend 25 seconds walking a registry.
 *
 * The figures are CSOAI's own, read from by_entity.*.csoai. CSOAI Ltd and MEOK AI Labs publish
 * from one account and the census labels every package with its entity. Live home page, 18 Nov
 * 2026: the headline was the account total, "≥ 3,852,241", which is MEOK 2,746,597 + CSOAI
 * 890,521 + joint + unattributed, while /api/momentum's rule says the two are never added. MEOK's
 * figures are returned separately, for their own labelled line; nothing here adds them in.
 */
export function distributionRead(payload: DistributionArtifact | null, now = Date.now()) {
  if (payload?.schema !== "csoai.distribution/0.1") return null;
  const lifetime = count(payload.totals?.downloads_all_time);
  const recent = count(payload.totals?.downloads_30d);
  if (!lifetime || !recent || lifetime.asOf !== recent.asOf || payload.as_of !== lifetime.asOf) return null;
  const ageHours = payload.max_age_hours;
  if (typeof ageHours !== "number" || !Number.isFinite(ageHours) || ageHours <= 0 || ageHours > MAX_AGE_HOURS) return null;
  const csoai = entityWindows(payload, "csoai", lifetime.asOf);
  if (!csoai) return null;
  const meok = entityWindows(payload, "meok", lifetime.asOf);
  const stale = csoai.lifetime.state === "STALE" || csoai.recent.state === "STALE"
    || now - Date.parse(lifetime.asOf) > ageHours * 60 * 60 * 1000;
  const partial = csoai.lifetime.state === "PARTIAL" || csoai.recent.state === "PARTIAL";
  return { asOf: lifetime.asOf, csoai, meok, stale, partial };
}

function Figure({ row, label }: { row: Count; label: string }) {
  return (
    <div className="border-t border-[var(--ink-border)] pt-4">
      <p className="font-mono text-3xl font-black tracking-tight text-[var(--ink-foreground)] tabular-nums sm:text-4xl">
        {shown(row)}
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
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(result.asOf))
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
                <Figure row={result.csoai.lifetime} label="gross download events since first release, CSOAI packages" />
                <Figure row={result.csoai.recent} label="gross download events in registry 30-day windows, CSOAI packages" />
              </div>
              <p className="ink-muted mt-6 text-xs leading-relaxed">
                Published census dated {date} UTC · {result.stale ? "Out of date — a fresh census is needed." : result.partial ? "Partial read; missing counters are not treated as zero." : "All CSOAI package counters answered."} The PyPI source and a separate sample counter disagree, so these are reported registry events, not verified adoption.
              </p>
              {result.meok && (
                <p className="ink-muted mt-3 text-xs leading-relaxed" data-testid="home-distribution-meok">
                  MEOK AI Labs, a separate entity publishing from the same account, is counted on its own and never added to CSOAI&apos;s figures: {shown(result.meok.lifetime)} since first release ({result.meok.lifetime.covered} of {result.meok.lifetime.attempted} counters answered) and {shown(result.meok.recent)} in 30-day windows ({result.meok.recent.covered} of {result.meok.recent.attempted}).
                </p>
              )}
              <p className="ink-muted mt-3 text-xs leading-relaxed">
                Packages labelled joint or unattributed are in neither figure. Package ownership labels come from the published census.
              </p>
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
