/**
 * FooterStats — one tidy row of live figures for the site footer, read from GET /api/momentum
 * (the same shared read as the home strip). Each figure links to its source; the row ends with
 * when it was read and a link to every source. An omitted figure is absent, never zero; if the
 * read fails the row renders nothing.
 */
import { LiveDot } from "./MomentumStrip";
import { fmtStamp, isExternal, pick, useMomentum, type MomentumRead } from "./momentum";

export const FOOTER_IDS = ["pypi_csoai_all_time", "hf_downloads_30d_other", "capsules", "signed_cards", "corrections"];

/** Short labels for a narrow row; the full label travels in the link title and the screen-reader text. */
const SHORT: Record<string, string> = {
  pypi_csoai_all_time: "PyPI downloads, CSOAI packages",
  hf_downloads_30d_other: "other dataset downloads, 30 days",
  capsules: "signed measurement capsules",
  signed_cards: "signed cards, all verify",
  corrections: "public corrections, dated",
};

export default function FooterStats({ injected }: { injected?: MomentumRead }) {
  const read = useMomentum(injected);
  if (read.kind !== "ready") return read.kind === "loading" ? <div className="mb-8 min-h-[7.5rem] sm:min-h-[4.5rem]" aria-hidden="true" /> : null;
  const figs = pick(read.payload, FOOTER_IDS);
  if (!figs.length) return null;
  const live = read.origin === "live";
  return (
    <section aria-labelledby="footer-stats-h" data-testid="footer-stats" className="mb-10 rounded-2xl border border-border bg-background/60 px-4 py-5 sm:px-6">
      <h2 id="footer-stats-h" className="sr-only">
        Live figures
      </h2>
      <ul className="grid list-none grid-cols-2 gap-x-4 gap-y-4 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {figs.map((f) => (
          <li key={f.id} className="min-w-0" data-testid={`footer-stat-${f.id}`}>
            <a
              href={f.source_url}
              {...(isExternal(f.source_url) ? { rel: "noopener noreferrer" } : {})}
              title={`${f.label} · as of ${f.as_of.slice(0, 10)} · source: ${f.source_label}`}
              className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span aria-hidden="true" className="block font-primary text-2xl font-black leading-none tracking-tight tabular-nums text-foreground">
                {f.display}
              </span>
              <span className="sr-only">
                {f.display_sr} {f.label}, as of {f.as_of.slice(0, 10)}. Source: {f.source_label}.
              </span>
              <span aria-hidden="true" className="mt-1.5 block text-xs leading-snug text-muted-foreground group-hover:text-foreground group-hover:underline">
                {SHORT[f.id] ?? f.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
        <LiveDot live={live} />
        <span>
          {live ? "updated" : "snapshot"} <time dateTime={read.payload.generated_at}>{fmtStamp(read.payload.generated_at)}</time>
        </span>
        <span aria-hidden="true">·</span>
        <a href="/api/momentum" className="underline underline-offset-2 hover:text-primary">
          sources
        </a>
        <span aria-hidden="true">·</span>
        <a href={read.payload.methodology_url} className="underline underline-offset-2 hover:text-primary">
          how these are measured
        </a>
      </p>
    </section>
  );
}
