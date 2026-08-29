import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /licence-manifest — one-page request form. Fee blank. Nick countersigns.
 * TUI 2 links this from Get measured / /products. TUI 4 does not send as Nick.
 */

const SKUS = [
  {
    name: "Run / re-attest",
    buy: "We measure a named system again when the law or the model moves.",
  },
  {
    name: "Council Ledger",
    buy: "Signed feed / packs for insurers and procurement. GPAI pack and CRA runbook are Ledger modules — evidence, not a mark.",
  },
  {
    name: "Council Data",
    buy: "Licensed corpus (traces, incidents). Open-access sample stays free. Research / Enterprise on enquiry.",
  },
] as const;

export default function LicenceManifest() {
  useEffect(() => {
    document.title = "Licence manifest — request evidence, not a rank | Council of AI";
    setMetaDescription(
      "CSOAI Ltd licence manifest template. Three paid arms: Run/re-attest, Council Ledger, Council Data. Verify is free. A grade is never sold. Nick countersigns. Fee blank.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          CSOAI Ltd · UK 16939677 · England &amp; Wales
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          Licence manifest
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Measure, sign, license evidence. Verify free. No grade for sale. Nobody ranked
          pays. Humans never pay to verify or to report.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          A deal is not binding until Nick countersigns. Fee stays blank here. Regulator
          and auditor packs are often no fee. Standing terms:{" "}
          <Link href="/licensing-agreement" className="text-emerald-700 underline">
            /licensing-agreement
          </Link>
          . Enquiry:{" "}
          <a href="mailto:nicholas@csoai.org" className="text-emerald-700 underline">
            nicholas@csoai.org
          </a>
          . Filled ids are private (`MAN-YYYYMMDD-001`) — not in the public card.
        </p>

        <section className="mt-10 rounded-xl border border-emerald-600/20 bg-white p-5">
          <h2 className="text-base font-extrabold text-gray-900">Three paid arms</h2>
          <p className="mt-2 text-sm text-gray-500">
            Verify is free forever and is not on this form. Council OS is the page, not an
            invoice SKU.
          </p>
          <ul className="mt-3 space-y-3">
            {SKUS.map((s) => (
              <li key={s.name}>
                <span className="font-semibold text-gray-900">{s.name}.</span>{" "}
                <span className="text-[15px] text-gray-600">{s.buy}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-base font-extrabold text-amber-950">Firewall</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-950">
            The commercial team does not set scores; analysts do not take money from ranked
            entities.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-amber-950">
            Living board stamp SIGNED (`#board-attestation-1`) is not a new named-system
            card SIGNED. Named-system cards stay UNCHECKABLE until the 2-of-3 ceremony.
            Keys never go in this annex.
          </p>
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-extrabold text-gray-900">Request fields</h2>
          <dl className="mt-3 grid gap-2 text-[15px] text-gray-600">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-400">SKU</dt>
              <dd>Run / re-attest · Council Ledger · Council Data (one)</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                Named system or dataset
              </dt>
              <dd>The id actually run, or the dataset actually licensed. Empty stays empty.</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-400">Scope</dt>
              <dd>
                Insurer rail: public board / named-system card / licensed feed — three columns,
                never blended.
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-400">Term</dt>
              <dd>As agreed. 60 days’ notice to non-renew.</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-400">Fee</dt>
              <dd>Blank. Nick fills. No public price.</dd>
            </div>
          </dl>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          White-label embed is free verify. GPAI pack is a Ledger module, not a mark. CRA kit
          is our runbook, not ENISA certification. Academy is training attestation, never
          conformity. Stripe checkout JS is gone (410) — it does not sell this rail.{" "}
          <Link href="/firewall-charter" className="text-emerald-700 underline">
            Firewall charter
          </Link>
          {" · "}
          <Link href="/gspc-verify" className="text-emerald-700 underline">
            Verify a card
          </Link>
          {" · "}
          DOI 10.5281/zenodo.21991104
        </p>
      </div>
    </div>
  );
}
