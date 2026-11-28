import { useDistributionArtifact, type DistributionArtifact, type DistributionPackage } from "./useHomeReads";
import type { FootprintRow } from "@/components/liveCountersFormat";
import type { ReadState } from "./homeReads";
import SELF_READ_IDS from "@/data/hf-self-read-ids.json";

const nf = new Intl.NumberFormat("en-GB");
const MAX_AGE_HOURS = 48;

type Count = { value: number; state: string; covered: number; attempted: number; asOf: string };
type Field = "downloads_all_time" | "downloads_30d";

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
 * The Hugging Face datasets our own services read. /api/momentum keeps their downloads apart from the
 * rest and never adds the two (SELF_READ_DATASETS in functions/api/_momentum.ts, which stays
 * self-contained, so this is a copy of its ids that a test holds equal to it).
 */
const SELF_READ: ReadonlySet<string> = new Set(SELF_READ_IDS as string[]);

const isCount = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/** scripts/distribution-measure.py by_entity(), over a subset of one entity's rows. */
function rollUp(rows: DistributionPackage[], field: Field, asOf: string): Count | null {
  const counted = rows.filter((p) => isCount(p[field]));
  if (!counted.length) return null;
  return {
    value: counted.reduce((sum, p) => sum + (p[field] as number), 0),
    state: counted.length === rows.length ? "READ" : "PARTIAL",
    covered: counted.length,
    attempted: rows.length,
    asOf,
  };
}

/**
 * CSOAI's figures with the datasets our own services read taken out, and those datasets on their own.
 * Live census of 23 Nov 2026: of CSOAI's 551,286 downloads in 30-day windows, 298,200 (54%) were of
 * those ten datasets, which our own Pages functions and jobs read and whose counts include those reads.
 * Both parts come from the census's own package rows and must add back up to by_entity.*.csoai in
 * value, covered and attempted; if they do not, no figure is printed.
 */
function withoutSelfReads(payload: DistributionArtifact, csoai: { lifetime: Count; recent: Count }, asOf: string) {
  const rows = Array.isArray(payload.packages) ? payload.packages.filter((p) => p && p.entity === "csoai") : [];
  const isSelf = (p: DistributionPackage) => p.registry === "huggingface" && typeof p.name === "string" && SELF_READ.has(p.name);
  const own = rows.filter(isSelf);
  const rest = rows.filter((p) => !isSelf(p));
  const split = (field: Field, whole: Count) => {
    const others = rollUp(rest, field, asOf);
    const selfRead = own.length ? rollUp(own, field, asOf) : null;
    if (!others || (own.length > 0 && !selfRead)) return null;
    const s = selfRead ?? { value: 0, covered: 0, attempted: 0 };
    const adds = others.value + s.value === whole.value
      && others.covered + s.covered === whole.covered
      && others.attempted + s.attempted === whole.attempted;
    return adds ? { others, selfRead } : null;
  };
  const lifetime = split("downloads_all_time", csoai.lifetime);
  const recent = split("downloads_30d", csoai.recent);
  if (!lifetime || !recent) return null;
  const selfRead = lifetime.selfRead && recent.selfRead ? { lifetime: lifetime.selfRead, recent: recent.selfRead } : null;
  return { figures: { lifetime: lifetime.others, recent: recent.others }, selfRead, datasets: own.length };
}

/**
 * Read the dated artifact directly; the full funnel can spend 25 seconds walking a registry.
 *
 * The figures are CSOAI's own, read from by_entity.*.csoai. CSOAI Ltd and MEOK AI Labs publish
 * from one account and the census labels every package with its entity. Live home page, 18 Nov
 * 2026: the headline was the account total, "≥ 3,852,241", which is MEOK 2,746,597 + CSOAI
 * 890,521 + joint + unattributed, while /api/momentum's rule says the two are never added. MEOK's
 * figures are returned separately, for their own labelled line; nothing here adds them in.
 * The datasets our own services read are taken out of CSOAI's figures and returned on their own
 * (withoutSelfReads), for the same reason.
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
  const parts = withoutSelfReads(payload, csoai, lifetime.asOf);
  if (!parts) return null;
  const meok = entityWindows(payload, "meok", lifetime.asOf);
  const stale = csoai.lifetime.state === "STALE" || csoai.recent.state === "STALE"
    || now - Date.parse(lifetime.asOf) > ageHours * 60 * 60 * 1000;
  const partial = parts.figures.lifetime.state === "PARTIAL" || parts.figures.recent.state === "PARTIAL";
  return { asOf: lifetime.asOf, csoai: parts.figures, selfRead: parts.selfRead, selfReadDatasets: parts.datasets, meok, stale, partial };
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
              <p className="ink-kicker text-sm font-bold" data-testid="home-distribution-scope">
                CSOAI&apos;s packages and datasets{result.selfRead ? `, leaving out the ${result.selfReadDatasets} datasets our own services read` : ""}
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <Figure row={result.csoai.lifetime} label="gross download events since first release" />
                <Figure row={result.csoai.recent} label="gross download events in registry 30-day windows" />
              </div>
              <p className="ink-muted mt-6 text-xs leading-relaxed">
                Published census dated {date} UTC · {result.stale ? "Out of date — a fresh census is needed." : result.partial ? "Partial read; missing counters are not treated as zero." : "All CSOAI package counters answered."} The PyPI source and a separate sample counter disagree, so these are reported registry events, not verified adoption.
              </p>
              {result.selfRead && (
                <p className="ink-muted mt-3 text-xs leading-relaxed" data-testid="home-distribution-self-read">
                  Left out above: the {result.selfReadDatasets} Hugging Face datasets our own services read. Our reads are inside their counts, so they are kept apart, as <a className="underline underline-offset-2 hover:text-white" href="/api/momentum">/api/momentum</a> keeps them: {shown(result.selfRead.lifetime)} since first release and {shown(result.selfRead.recent)} in 30-day windows.
                </p>
              )}
              {result.meok && (
                <p className="ink-muted mt-3 text-xs leading-relaxed" data-testid="home-distribution-meok">
                  Packages labelled MEOK AI Labs in the same publishing account are counted separately and never added to the CSOAI-labelled figures: {shown(result.meok.lifetime)} since first release ({result.meok.lifetime.covered} of {result.meok.lifetime.attempted} counters answered) and {shown(result.meok.recent)} in 30-day windows ({result.meok.recent.covered} of {result.meok.recent.attempted}).
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
