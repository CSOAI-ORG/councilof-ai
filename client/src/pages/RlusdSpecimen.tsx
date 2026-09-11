import { Helmet } from "react-helmet-async";

export default function RlusdSpecimen() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>RLUSD gap specimen (unsigned) | Council of AI</title>
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-300">
          Unsigned · publisher queue · THIN
        </p>
        <h1 className="mt-3 text-3xl font-black">RLUSD / Attestation Watch</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Gap between an attestation narrative and a re-checkable measurement card. Not a
          rating of any issuer. Not signed. GHA publisher must sign before this is a card.
        </p>
        <p className="mt-6 font-mono text-sm">
          <a className="text-emerald-300 underline" href="/specimens/rlusd-gap-2026-09-11.json">
            /specimens/rlusd-gap-2026-09-11.json
          </a>
        </p>
      </section>
    </main>
  );
}
