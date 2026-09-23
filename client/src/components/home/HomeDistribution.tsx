import { useFootprintPayload } from "./useHomeReads";
import type { FootprintPayload, FootprintRow } from "@/components/liveCountersFormat";
import type { ReadState } from "./homeReads";

const nf = new Intl.NumberFormat("en-GB");
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

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

/** The two published windows are read separately; neither is an adoption count. */
export function distributionRead(payload: FootprintPayload | null, now = Date.now()) {
  const gross = payload?.gross_distribution;
  if (!gross || gross.state === "UNMEASURED" || gross.state === "UNCHECKABLE") return null;
  const lifetime = count(gross.downloads_all_time);
  const recent = count(gross.downloads_30d);
  if (!lifetime || !recent || lifetime.asOf !== recent.asOf) return null;
  const stale = gross.state === "STALE" || lifetime.state === "STALE" || recent.state === "STALE"
    || now - Date.parse(lifetime.asOf) > MAX_AGE_MS;
  return { lifetime, recent, stale };
}

function Figure({ row, label }: { row: Count; label: string }) {
  return (
    <div className="border-t border-emerald-200/30 pt-4">
      <p className="font-mono text-3xl font-black tracking-tight text-white tabular-nums sm:text-4xl">
        {row.state === "PARTIAL" ? "≥ " : ""}{nf.format(row.value)}
      </p>
      <p className="mt-2 text-sm font-bold text-emerald-100">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">
        {row.covered} of {row.attempted} package counters answered
      </p>
    </div>
  );
}

export default function HomeDistribution({
  injected,
  now,
}: {
  injected?: ReadState<FootprintPayload>;
  now?: number;
}) {
  const read = useFootprintPayload(injected);
  const result = read.kind === "ready" ? distributionRead(read.payload, now) : null;
  const date = result
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(result.lifetime.asOf))
    : null;

  return (
    <section id="distribution" aria-labelledby="home-distribution-h" className="bg-[#09251b] py-12 text-white sm:py-16" data-testid="home-distribution">
      <div className="section-shell grid gap-9 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Distribution, with its limits</p>
          <h2 id="home-distribution-h" className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            The published tools travel. Downloads are only the first signal.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50/80">
            This census covers packages in the wider CSOAI and MEOK publishing estate across PyPI, npm and Hugging Face. It counts registry download events, including mirrors and automated traffic. It does not count unique people, active installations, executions or customers.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <a className="text-emerald-200 underline underline-offset-4 hover:text-white" href="/interop/distribution-latest.json">Inspect every counted package →</a>
            <a className="text-emerald-200 underline underline-offset-4 hover:text-white" href="/reach/">See the full adoption funnel →</a>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-300/20 bg-white/[0.06] p-6 sm:p-8" aria-live="polite">
          {result ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <Figure row={result.lifetime} label="gross download events since first release" />
                <Figure row={result.recent} label="gross download events in registry 30-day windows" />
              </div>
              <p className="mt-6 text-xs leading-relaxed text-emerald-100/75">
                Published census dated {date} UTC · {result.stale ? "Out of date — a fresh census is needed." : "Partial read; the missing counter is not treated as zero."} The PyPI source and a separate sample counter disagree, so these are reported registry events, not verified adoption.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-emerald-100">
              {read.kind === "failed" ? "The distribution feed is unavailable right now." : read.kind === "ready" ? "The distribution feed has no usable dated count." : "Reading the dated distribution feed…"} No figure is substituted.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
