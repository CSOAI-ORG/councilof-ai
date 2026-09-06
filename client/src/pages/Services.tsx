import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { buildCatalogue, type Catalogue } from "@/lib/servicesCatalogue";

/**
 * /services — the doors the rail actually publishes, read at run time.
 *
 * PHASE C. Until 2026-09-06 this page was a TYPED LIST of six marketing tiles
 * that had nothing to do with the payment rail. Two of its links were dead
 * ends: "Legacy Bridge — Inspect the design" pointed at /legacy, which returns
 * 200 and renders "this legacy page is temporarily withdrawn". A services page
 * whose call to action is a withdrawal notice is worse than no services page.
 *
 * Every card here now comes from GET /.well-known/x402.json. Nothing about a
 * door is restated in this file — not its name, not its URL, not whether it is
 * paid, not its free preview. Add a door to the rail and it appears; withdraw
 * one and it disappears. The ONLY thing decided here is which of the five
 * groups a path belongs to, and servicesCatalogue.ts fails loudly rather than
 * quietly when it meets a path it does not recognise: the door lands in
 * `ungrouped`, the section says so out loud, and the test reds.
 *
 * No prices, no tiers, no payment-processor names — OWNER RULING 6 Sep 2026.
 * The pay line is the ruling's own words and comes from the manifest's amount,
 * never from a judgement made here.
 */

const MANIFEST = "/.well-known/x402.json";

type Load =
  | { state: "loading" }
  | { state: "unread"; reason: string }
  | { state: "live"; catalogue: Catalogue };

export default function Services() {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    document.title = "Services — the doors the rail publishes";
    let alive = true;
    void fetch(MANIFEST, { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => alive && setLoad({ state: "live", catalogue: buildCatalogue(j) }))
      .catch((err: Error) => alive && setLoad({ state: "unread", reason: err.message }));
    return () => {
      alive = false;
    };
  }, []);

  const cat = load.state === "live" ? load.catalogue : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Services — the doors the rail publishes | Council of AI</title>
        <meta
          name="description"
          content="Every machine door Council of AI publishes, read live from /.well-known/x402.json — what each one measures, its free preview where one exists, and pay-as-you-go x402 at the 402."
        />
      </Helmet>

      <section className="border-b border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
            Services · read from {MANIFEST}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Every door the rail publishes.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            This page is not a brochure of what we could build. It is the machine doors that answer
            today, read from the rail's own manifest when you loaded the page. Each one says what it
            measures, in the manifest's words. Verification stays free.
          </p>
          {cat ? (
            <p className="mt-4 font-mono text-[12px] text-slate-400" data-testid="services-source">
              {cat.total} door{cat.total === 1 ? "" : "s"} · manifest mode{" "}
              <span className="text-emerald-300">{cat.mode ?? "unstated"}</span> ·{" "}
              <a href={MANIFEST} className="underline">
                {cat.source}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {load.state === "loading" ? (
          <p className="text-slate-400">Reading the manifest…</p>
        ) : load.state === "unread" ? (
          <div
            data-testid="services-unread"
            className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-6"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Unread</p>
            <p className="mt-2 leading-7 text-slate-300">
              The rail's manifest at <code className="text-slate-200">{MANIFEST}</code> did not
              answer ({load.reason}). No doors are listed, because listing a door we could not read
              would be inventing one. This is not a claim that the rail is down.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {load.catalogue.groups.map(({ group, cards }) => (
              <section key={group.id} data-testid={`services-group-${group.id}`}>
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{group.measures}</p>

                {cards.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                    No door in this group is published on the rail today. The group is shown empty
                    rather than hidden — an empty group is a fact, not an embarrassment.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((c) => (
                      <article
                        key={c.path}
                        data-testid={`services-door-${c.path}`}
                        className="flex flex-col rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-slate-600 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                            {c.method}
                          </span>
                          {c.freeForever ? (
                            <span className="rounded-md border border-emerald-400/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                              FREE
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 font-mono text-sm font-bold text-slate-100">{c.path}</h3>
                        <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{c.measures}</p>
                        <p className="mt-3 text-[12px] text-slate-400">{c.payLine}</p>
                        {c.freePreview ? (
                          <a
                            href={c.freePreview}
                            className="mt-3 text-sm font-semibold text-emerald-300 underline underline-offset-4"
                          >
                            Free preview →
                          </a>
                        ) : (
                          <p className="mt-3 text-[12px] text-slate-500">
                            No free preview is published for this door.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {load.catalogue.ungrouped.length ? (
              <section
                data-testid="services-ungrouped"
                className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-5"
              >
                <h2 className="text-lg font-bold text-amber-200">
                  Published on the rail, not yet grouped here
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  These doors answer today but this page does not know where to file them. They are
                  named rather than dropped, because a door nobody can find is the failure this
                  section exists to prevent.
                </p>
                <ul className="mt-3 font-mono text-sm text-amber-100">
                  {load.catalogue.ungrouped.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="leading-7 text-slate-300">
            Verification is free and always will be. A grade is never sold, and a measurement is
            never a certification. Where a door is paid, it is paid at the 402 itself — there is no
            checkout on this page and no price on this site.
          </p>
        </div>
      </section>
    </div>
  );
}
