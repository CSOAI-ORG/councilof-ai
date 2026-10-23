import { useEffect, useState } from "react";
import { ServicePreview } from "@/components/ServicePreview";
import { Helmet } from "react-helmet-async";
import { buildCatalogue, type Catalogue } from "@/lib/servicesCatalogue";
import { BUYING_ENQUIRIES } from "@/lib/buying";

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
const NOT_JSON = "not-json";

type Load =
  | { state: "loading" }
  | { state: "unread"; reason: string }
  | { state: "live"; catalogue: Catalogue };

export default function Services() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Evidence services and public data — Council of AI";
    let alive = true;
    void fetch(MANIFEST, { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => {
        if (!r.ok) return Promise.reject(new Error("HTTP " + r.status));
        // A host without the rail's Function (the prerender preview) answers the SPA's HTML for this
        // path. That is "not read here", not a parse error to print into the page.
        if (!/json/i.test(r.headers.get("content-type") ?? "")) return Promise.reject(new Error(NOT_JSON));
        return r.json();
      })
      .then((j) => alive && setLoad({ state: "live", catalogue: buildCatalogue(j) }))
      .catch((err: Error) =>
        alive && setLoad({ state: "unread", reason: err instanceof SyntaxError ? NOT_JSON : err.message }),
      );
    return () => {
      alive = false;
    };
  }, [attempt]);

  const cat = load.state === "live" ? load.catalogue : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Evidence services and public data | Council of AI</title>
        <meta
          name="description"
          content="Explore public measurements, corrections, free record checks and the published catalogue of evidence services."
        />
      </Helmet>

      <section className="border-b border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
            Services · public data and evidence
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Explore our evidence services and public data.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Start with public measurements, the correction record and free verification.
            The catalogue below lists data feeds and evidence services from the published technical catalogue.
            Check each entry for its scope, preview and payment requirements.
          </p>
          <nav aria-label="Published evidence path" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="services-supply-led-entry">
            <a href="/dashboard?tab=board" className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">1 · Explore measurements</a>
            <a href="/press" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">2 · See what changed</a>
            <a href="/gspc-verify" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">3 · Check a record</a>
            <a href="#supported-feeds" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">4 · Browse the catalogue</a>
            <a href="/quickstart" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">5 · Get started</a>
          </nav>
          {cat ? (
            <p className="mt-4 font-mono text-[12px] text-slate-400" data-testid="services-source">
              {cat.total} service{cat.total === 1 ? "" : "s"} · catalogue mode{" "}
              <span className="text-emerald-300">{cat.mode ?? "unstated"}</span> ·{" "}
              <a href={MANIFEST} className="underline">
                {cat.source}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="services-human-buyer" className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-300">For organisations and procurement teams</p>
          <h2 id="services-human-buyer" className="mt-3 text-2xl font-bold">Need a written scope and a human invoice?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            CSOAI can discuss a GBP invoice for an existing Article 50 evidence pack, evidence bundle
            or provider-diff feed. Describe the named subject, the evidence you need and the desired
            delivery date. Availability, scope and terms must be confirmed before any order.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {BUYING_ENQUIRIES.map((product) => (
              <a key={product.product} href={product.href} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-400 px-5 py-2 font-semibold text-slate-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
                Enquire about {product.label}
              </a>
            ))}
            <a href="/gspc-verify/" className="inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-5 py-2 font-semibold text-slate-100 hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
              Check a record free
            </a>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            This is an enquiry, not checkout or a reservation. The current contact page opens an
            email draft or lets you copy an enquiry; it does not silently submit or store your details.
            For paid services, the service itself provides its x402 price before payment.
          </p>
        </div>
      </section>

      <section id="supported-feeds" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12">
        {load.state === "loading" ? (
          <p role="status" className="text-slate-400">Loading the service catalogue…</p>
        ) : load.state === "unread" ? (
          <div
            data-testid="services-unread"
            role="status"
            className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-6"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Catalogue unavailable</p>
            {load.reason === NOT_JSON ? (
              <p className="mt-2 leading-7 text-slate-300">
                The service catalogue has not loaded in this view. Its technical source is available at{" "}
                <a href={MANIFEST} className="text-slate-200 underline">{MANIFEST}</a>, which this
                page reads when it loads in a browser. Services are shown only after the catalogue is read.
              </p>
            ) : (
              <p className="mt-2 leading-7 text-slate-300">
                The service catalogue at <code className="text-slate-200">{MANIFEST}</code> could not be
                loaded ({load.reason}). Please try again. This does not establish whether the services themselves are available.
              </p>
            )}
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-4 min-h-11 rounded border border-amber-300 px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2">Reload catalogue</button>
          </div>
        ) : (
          <div className="space-y-12">
            {load.catalogue.groups.map(({ group, cards }) => (
              <section key={group.id} data-testid={`services-group-${group.id}`}>
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{group.measures}</p>

                {cards.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                    No services in this group are listed in the published catalogue.
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
                          <ServicePreview template={c.freePreview} />
                        ) : (
                          <p className="mt-3 text-[12px] text-slate-400">
                            No separate free preview is listed for this service.
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
                  Other services in the published catalogue
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  These services are listed in the published catalogue but have not yet been assigned to a group on this page.
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
            Record verification is free. A score or rank cannot be bought, and measurement is not certification.
            Paid services use x402: check the service's price and terms before authorising payment.
            This catalogue is not a checkout.
          </p>
        </div>
      </section>
    </div>
  );
}
