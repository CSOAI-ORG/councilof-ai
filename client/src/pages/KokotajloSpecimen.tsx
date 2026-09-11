import { Helmet } from "react-helmet-async";

export default function KokotajloSpecimen() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Kokotajlo swarm specimen (unsigned) | Council of AI</title>
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Unsigned · publisher queue · THIN
        </p>
        <h1 className="mt-3 text-3xl font-black">Swarm-response specimen</h1>
        <p className="mt-4 leading-7 text-slate-300">
          A public swarm-risk claim is a GSPC-shaped card or it is UNCHECKABLE. Not a
          personal attack. Not signed until the publisher signs.
        </p>
        <p className="mt-6 font-mono text-sm">
          <a className="text-emerald-300 underline" href="/specimens/kokotajlo-swarm-2026-09-11.json">
            /specimens/kokotajlo-swarm-2026-09-11.json
          </a>
        </p>
      </section>
    </main>
  );
}
