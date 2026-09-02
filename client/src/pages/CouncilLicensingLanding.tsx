import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /council-licensing — Council Ledger door.
 *
 * Replaces the Era-A "33-seat council fleet licence" landing (retracted BFT
 * claim, certification-shaped copy). The route is kept so inbound links do
 * not 404. The product is the signed evidence feed, not a vote theatre.
 */

export default function CouncilLicensingLanding() {
  useEffect(() => {
    document.title = "Council Ledger — signed evidence feed | Council of AI";
    setMetaDescription(
      "Council Ledger is the paid evidence feed from Council of AI: signed measurement receipts for insurers, procurement and deployers. We measure. We do not certify. Nobody ranked pays.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-slate-100">
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
          Council Ledger · SKU 2
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight">
          A feed you can price against. From a body that will never underwrite.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-300">
          Council Ledger is the paid evidence line of Council OS: Ed25519-signed
          receipts for a named system, and a recurring feed for relying parties.
          It is a measurement input. It is not a certificate, not a vote of 33
          agents, and not a share of any policy written on the back of a card.
        </p>

        <ul className="mt-8 space-y-3 text-sm leading-relaxed text-slate-300">
          <li>Insurers and procurement pay. Ranked vendors do not.</li>
          <li>Four columns, never blended: regulation · measured-AI · human baseline · market.</li>
          <li>UNMEASURED stays empty. A gap is not a zero.</li>
          <li>Verification of any card stays free, in the reader’s browser.</li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/licensing-agreement"
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Standing terms
          </Link>
          <Link
            href="/insurers"
            className="rounded-xl border border-slate-100/20 px-6 py-3 font-semibold hover:border-emerald-400/50"
          >
            Insurer rail
          </Link>
          <Link
            href="/products"
            className="rounded-xl border border-slate-100/20 px-6 py-3 font-semibold hover:border-emerald-400/50"
          >
            All four SKUs
          </Link>
        </div>
      </section>
    </div>
  );
}
