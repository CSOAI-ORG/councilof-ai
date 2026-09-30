/**
 * HomeProof — three blocks under the momentum strip, all read from GET /api/momentum:
 *
 *   Check the anchors yourself — the latest signed daily index, the Bitcoin block its chain head is
 *     timestamped in, the Sigstore Rekor entries, the signing keys, the company register, the
 *     preprint DOI and the dataset DOIs. Every value is a link a stranger can open.
 *   Independently listed — third-party indexes that name us on the read that built this payload,
 *     each linked to our entry. "A listing is not an endorsement."
 *   Recent work — the latest dated public artifacts, each date read from the record it points at.
 *
 * Nothing is typed here; a block whose list came back empty is not rendered.
 */
import { ArrowUpRight, Anchor as AnchorIcon, ListChecks, CalendarClock } from "lucide-react";
import type { ReactNode } from "react";
import { fmtDay, isExternal, useMomentum, type MomentumRead } from "./momentum";

function ext(href: string) {
  return isExternal(href) ? { rel: "noopener noreferrer" } : {};
}

function Block({ id, icon, kicker, title, children }: { id: string; icon: ReactNode; kicker: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_20px_44px_-36px_rgba(4,18,12,.45)] sm:p-7" data-testid={id}>
      <p className="t-kicker flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
        <span aria-hidden="true">{icon}</span>
        {kicker}
      </p>
      <h3 id={`${id}-h`} className="mt-3 text-xl font-black leading-snug tracking-tight text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function HomeProof({ injected }: { injected?: MomentumRead }) {
  const read = useMomentum(injected);
  if (read.kind !== "ready") return null;
  const { anchors, listings, recent, listing_line } = read.payload;
  if (!anchors.length && !listings.length && !recent.length) return null;
  return (
    <section aria-labelledby="home-proof-h" className="surface-base section-y-sm border-t border-border" data-testid="home-proof">
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Do not take our word for it</p>
        <h2 id="home-proof-h" className="t-section mt-3 max-w-3xl text-foreground">
          Anchored outside our control, listed by others, dated as we go.
        </h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {anchors.length > 0 && (
            <Block id="home-anchors" icon={<AnchorIcon className="h-4 w-4" />} kicker="Check the anchors yourself" title="Timestamps, logs and keys you can open">
              <ul className="mt-5 list-none space-y-3.5 p-0">
                {anchors.map((a) => (
                  <li key={a.id} className="min-w-0 border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">{a.label}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {(a.links && a.links.length ? a.links : [{ text: a.value, url: a.url }]).map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          {...ext(l.url)}
                          className="inline-flex max-w-full items-center gap-1 break-all font-mono text-[13px] font-bold text-foreground underline decoration-emerald-600/40 underline-offset-4 hover:decoration-emerald-600"
                        >
                          {l.text}
                          {isExternal(l.url) && <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                        </a>
                      ))}
                    </p>
                    {a.detail && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>}
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {listings.length > 0 && (
            <Block id="home-listings" icon={<ListChecks className="h-4 w-4" />} kicker="Independently listed" title="Indexes run by other people that list our work">
              <ul className="mt-5 list-none space-y-3.5 p-0">
                {listings.map((l) => (
                  <li key={l.id} className="min-w-0 border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <a href={l.url} {...ext(l.url)} className="inline-flex max-w-full items-center gap-1 text-[15px] font-bold text-foreground underline decoration-emerald-600/40 underline-offset-4 hover:decoration-emerald-600">
                      {l.name}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{l.evidence}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Each checked live on <time dateTime={listings[0].verified_at}>{fmtDay(listings[0].verified_at)}</time>; an index that stops naming us drops off.
              </p>
              <p className="mt-1.5 text-xs font-semibold text-foreground/80" data-testid="home-listings-line">
                {listing_line}
              </p>
            </Block>
          )}
          {recent.length > 0 && (
            <Block id="home-recent" icon={<CalendarClock className="h-4 w-4" />} kicker="Recent work" title="The latest things we published, dated">
              <ol className="mt-5 list-none space-y-3.5 p-0">
                {recent.map((r) => (
                  <li key={r.id} className="grid min-w-0 grid-cols-[6.1rem_1fr] gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <time dateTime={r.date} className="whitespace-nowrap pt-0.5 text-[12.5px] font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                      {fmtDay(r.date)}
                    </time>
                    <div className="min-w-0">
                      <a href={r.href} {...ext(r.href)} className="text-[14.5px] font-bold leading-snug text-foreground underline decoration-emerald-600/40 underline-offset-4 hover:decoration-emerald-600">
                        {r.title}
                      </a>
                      {r.note && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Block>
          )}
        </div>
      </div>
    </section>
  );
}
