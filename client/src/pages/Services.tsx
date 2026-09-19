import { useEffect, useState } from "react";
import { ServicePreview } from "@/components/ServicePreview";
import { Helmet } from "react-helmet-async";
import { buildCatalogue, type Catalogue } from "@/lib/servicesCatalogue";
import { readQuickstartJson } from "@/lib/quickstartData";

/** /services presents records from the first-party discovery manifest.
 * It does not probe the advertised doors, verify payment terms or establish delivery.
 * Group mapping is display policy; unknown, malformed and duplicate records stay explicit.
 * No fixed resource inventory or typed prices; public evidence remains the first step.
 */

const MANIFEST = "/.well-known/x402.json";

type Load =
  | { state: "loading" }
  | { state: "unread"; reason: string }
  | { state: "ready"; catalogue: Catalogue };

export default function Services() {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Supported feeds and evidence doors — Council of AI";
    let alive = true;
    const control = new AbortController();
    setLoad({ state: "loading" });
    void readQuickstartJson(MANIFEST, control.signal, (value) => {
      const catalogue = buildCatalogue(value, window.location.origin);
      return catalogue.coverage === "UNREADABLE" ? null : catalogue;
    }).then((catalogue) => {
      if (!alive) return;
      setLoad(catalogue ? { state: "ready", catalogue } : {
        state: "unread", reason: "Unavailable, unsupported or beyond this display's read limits",
      });
    });
    return () => { alive = false; control.abort(); };
  }, [attempt]);

  const cat = load.state === "ready" ? load.catalogue : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Supported feeds and evidence doors | Council of AI</title>
        <meta
          name="description"
          content="Start with public measurements, the change record and free verification, then read every supported machine feed and evidence door from the live manifest."
        />
      </Helmet>

      <section className="border-b border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
            Services · read from {MANIFEST}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Access the supported feeds and evidence doors.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Start with the public measurements, see their change record and verify the signed evidence.
            The catalogue below then reads the supported machine doors from the rail's own manifest.
            Commissioned outputs remain secondary. Verification stays free.
          </p>
          <nav aria-label="Published evidence path" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="services-supply-led-entry">
            <a href="/dashboard?tab=board" className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">1 · Explore measurements</a>
            <a href="/press" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">2 · See what changed</a>
            <a href="/gspc-verify" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">3 · Verify evidence</a>
            <a href="#supported-feeds" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">4 · Access supported feeds</a>
            <a href="/quickstart" className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">5 · Quickstart</a>
          </nav>
          {cat ? (
            <p className="mt-4 font-mono text-[12px] text-slate-400" data-testid="services-source">
              {cat.total} resource record{cat.total === 1 ? "" : "s"} · {cat.displayed} grouped · {cat.ungrouped.length} ungrouped · {cat.withheld} withheld · source-reported mode{" "}
              <span className="text-emerald-300">{cat.mode ?? "unstated"}</span> ·{" "}
              <a href={MANIFEST} className="underline">
                {cat.source}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section id="supported-feeds" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12">
        {load.state === "loading" ? (
          <p role="status" className="text-slate-400">Reading the manifest…</p>
        ) : load.state === "unread" ? (
          <div
            data-testid="services-unread"
            role="status"
            className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-6"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Unread</p>
            <p className="mt-2 leading-7 text-slate-300">
              The rail's manifest at <code className="text-slate-200">{MANIFEST}</code> could not
              be read ({load.reason}). We avoid listing a door we could not read. This is not a claim
              that no resources exist or that the rail is down.
            </p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 min-h-11 rounded border border-amber-300 px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2">
              Retry manifest read
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <p className="text-sm text-slate-300">This is the most recent manifest read, not an automatically refreshed availability check. No listed endpoint is called by this page.</p>
            {load.catalogue.total === 0 && <p role="status" data-testid="services-empty">No resources are declared in this readable manifest.</p>}
            {load.catalogue.coverage === "PARTIAL" && <p role="status" data-testid="services-partial" className="rounded border border-amber-300/40 p-4 text-amber-200">
              Partial display: {load.catalogue.withheld} malformed, unsupported or duplicate record(s) withheld; {load.catalogue.ungrouped.length} record(s) listed separately without a group. Counts describe this source snapshot, not independently available services.
            </p>}
            {load.catalogue.groups.map(({ group, cards }) => (
              <section key={group.id} data-testid={`services-group-${group.id}`}>
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{group.measures}</p>

                {cards.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
                    No grouped record is available here from this manifest read. This does not establish that no such service exists.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((c) => (
                      <article
                        key={c.id}
                        data-testid={`services-door-${c.path}`}
                        className="flex flex-col rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-slate-600 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                            {c.method}
                          </span>
                          {c.zeroAmountDeclared ? (
                            <span className="rounded-md border border-emerald-400/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                              ZERO LISTED
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 font-mono break-all text-sm font-bold text-slate-100">{c.displayPath}</h3>
                        <p className="mt-2 flex-1 text-sm leading-6 break-words text-slate-300"><span className="text-slate-400">Manifest description: </span>{c.measures}</p>
                        <p className="mt-3 text-[12px] text-slate-400">{c.payLine}</p>
                        {c.freePreview ? (
                          <ServicePreview template={c.freePreview} />
                        ) : (
                          <p className="mt-3 text-[12px] text-slate-500">
                            No preview link is supplied for this record.
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
                  Listed in the manifest, not yet grouped here
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  These source records have no matching display group. They are named rather than dropped; listing them does not establish reachability, payment acceptance or completed execution.
                </p>
                <ul className="mt-3 font-mono text-sm text-amber-100">
                  {load.catalogue.ungrouped.map((p) => (
                    <li key={p} className="break-all">{p}</li>
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
            checkout on this page. Read current terms before authorising any paid request; this page neither settles payments nor verifies delivery.
          </p>
        </div>
      </section>
    </div>
  );
}
