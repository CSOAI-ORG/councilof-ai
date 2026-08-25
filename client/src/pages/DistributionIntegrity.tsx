import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/* /distribution-integrity — the distribution-integrity financial axis, coverage-first.
 *
 * The thesis: in tokenized real-world assets, "represented" is not "distributed". The
 * public market data shows a large committed-vs-distributed spread; IOSCO's Nov 2025
 * report flags the same investor-protection gap. That spread is a measurable disclosure
 * fact — not an opinion, not a rating, not advice.
 *
 * Everything here is coverage / UNMEASURED. The axis rubric itself has no signed run yet,
 * so it is a DECLARED axis. The only MEASURED facts on the page are the six on-chain
 * provenance-controls records already signed and shown on /xrpl-attest. Nothing is a
 * verdict on a named security — that gate stays closed pending counsel.
 */

interface RegistryInstrument {
  instrument: string;
  category: string;
  status: string;
  xrpl_issuer: string | null;
  address_status: string;
  attestation_tx?: string;
  explorer?: string;
  note?: string;
}
interface Registry {
  schema: string;
  chain: string;
  counts: { named: number; mainnet_verified_and_attested: number; not_located: number };
  honesty: string;
  instruments: RegistryInstrument[];
}
interface MeasuredRecord {
  instrument: string;
  mainnet_issuer: string;
  control_facts: {
    status: string;
    as_of: string;
    facts: { allowlisting_enforced: boolean; issuer_can_freeze: boolean; identity_domain_declared: boolean };
    domain: string;
  };
  risk_verdict_status: string;
  devnet_tx: string;
  explorer: string;
}
interface FinancialRun {
  schema: string;
  axis: string;
  network: string;
  honesty: string;
  measured: MeasuredRecord[];
}

const UNMEASURED_PILL =
  "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-gray-600";

export default function DistributionIntegrity() {
  const [reg, setReg] = useState<Registry | null>(null);
  const [fin, setFin] = useState<FinancialRun | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Distribution integrity — represented is not distributed | Council of AI";
    setMetaDescription(
      "The tokenized-RWA market reports a large represented-vs-distributed spread (365B USD committed vs 38B USD distributed, as reported 6 Aug 2026). IOSCO's 11 Nov 2025 report flags the same investor-protection gap. Council of AI declares a distribution-integrity axis — coverage-first, UNMEASURED, never a rating.",
    );
    fetch("/interop/rwa-registry.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setReg)
      .catch((e) => setErr(String(e)));
    fetch("/interop/financial-measure-run.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setFin)
      .catch((e) => setErr(String(e)));
  }, []);

  const measuredIssuers = new Set((fin?.measured ?? []).map((m) => m.mainnet_issuer));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Financial axis — distribution integrity
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Represented is not distributed</h1>
        <p className="mt-4 max-w-3xl text-gray-600">
          A tokenized real-world asset can be <em>represented</em> on a ledger — an issuer commits
          off-chain collateral and mints a token against it — without being widely{" "}
          <em>distributed</em> to holders. The gap between the two is public, on-chain-checkable, and
          large. It is a disclosure fact, not an opinion: you can count the represented value, count
          the distributed value, count the holders, and read the difference straight off the ledger
          and the issuers&apos; own reporting.
        </p>

        {/* SECTION 1 — the thesis / the spread */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Represented</p>
            <p className="mt-1 text-3xl font-black text-gray-900">365.15B USD</p>
            <p className="mt-1 text-xs text-gray-500">off-chain collateral committed</p>
          </div>
          <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Distributed</p>
            <p className="mt-1 text-3xl font-black text-gray-900">37.89B USD</p>
            <p className="mt-1 text-xs text-gray-500">value actually distributed on-chain</p>
          </div>
          <div className="rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">The spread</p>
            <p className="mt-1 text-3xl font-black text-gray-900">~10 to 1</p>
            <p className="mt-1 text-xs text-gray-500">roughly a tenth is distributed</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Market figures as reported by{" "}
          <a
            className="text-emerald-700 underline"
            href="https://coinpaprika.com/education/rwa-crypto-market-size/"
          >
            RWA.xyz data (via coinpaprika)
          </a>
          , snapshot dated 6 Aug 2026 — up from 4.1B USD in Jan 2025. These are the <em>market&apos;s</em>{" "}
          numbers, quoted &ldquo;as reported&rdquo;; Council of AI has not independently measured them.
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
          <p>
            The same reporting shows <strong>where</strong> the gap sits. Tokenized US Treasuries lead
            the represented value at 16.17B USD across 85 products, yet are held by only{" "}
            <strong>62,959 addresses</strong>. Tokenized stocks reached 2.28B USD but across{" "}
            <strong>982,890 holders</strong> after the March 2026 NASDAQ rule change — an order of
            magnitude more holders on a fraction of the value. Multi-chain issuance spread too: one
            reporting snapshot puts a public ledger such as Stellar at 8.2% of the total. Concentrated
            value, thin distribution: that is exactly the shape an investor-protection lens worries
            about.
          </p>
          <p className="mt-3">
            RWA.xyz&apos;s Nov 2025 framework made the point structural by adding an explicit{" "}
            <strong>&ldquo;distributed vs represented&rdquo;</strong> classification — the market&apos;s own
            data vendor now separates the two. And IOSCO&apos;s final report of{" "}
            <strong>11 Nov 2025</strong> found tokenisation still nascent and flagged
            settlement-finality, interoperability, and the lack of credible settlement assets — the
            same investor-protection worry, from the regulator side.{" "}
            <a
              className="text-emerald-700 underline"
              href="https://www.ledgerinsights.com/iosco-report-on-tokenization-still-nascent-flags-settlement-finality-risks/"
            >
              (IOSCO report, via Ledger Insights)
            </a>
          </p>
          <p className="mt-3 font-semibold text-gray-900">
            The represented-vs-distributed spread is a measurable disclosure fact. Turning it into a
            named, three-state, signed axis is what a measurement instrument is for.
          </p>
        </div>

        {err && <p className="mt-8 text-red-600">Reference-layer fetch failed: {err}</p>}

        {/* SECTION 2 — what we measure (the axis rubric) */}
        <div className="mt-10 rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">
            What the distribution-integrity axis measures
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Four deterministic, on-chain-checkable quantities per instrument. Each is a count or a
            ratio, re-derivable by anyone from the public ledger and the issuer&apos;s own reporting —
            no model judges another, and no number appears without the rows behind it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Represented value", "Off-chain collateral the issuer states it has committed against the token."],
              ["Distributed value", "Token value actually held on-chain by parties other than the issuer."],
              ["Holder count", "Distinct holding addresses — the distribution breadth the headline value hides."],
              ["Distribution ratio", "Distributed ÷ represented. A low ratio is the represented-not-distributed signal."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-900">{t}</p>
                <p className="mt-1 text-xs text-gray-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="text-xs font-bold uppercase tracking-wide">Axis status — UNMEASURED (declared)</p>
            <p className="mt-2">
              The axis rubric itself has <strong>no signed run yet</strong>. distribution-integrity is
              a <strong>declared axis</strong>, published coverage-first: we name it, define the four
              quantities, and account for the instrument universe openly — before we assert a single
              measured value. UNMEASURED is a first-class answer here, not a placeholder for a number
              we are hiding.
            </p>
          </div>
        </div>

        {/* SECTION 3 — coverage table (registry) + measured control-facts link */}
        {reg && (
          <div className="mt-10 rounded-xl border border-emerald-600/20 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">
              Coverage universe — the {reg.counts.named} named XRPL RWA instruments
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Every distribution-integrity status below is <strong>UNMEASURED</strong> — coverage
              declaration only. Of the {reg.counts.named} named instruments,{" "}
              <strong>{reg.counts.mainnet_verified_and_attested}</strong> have a mainnet-verified
              issuer address (attested on-ledger), and <strong>{reg.counts.not_located}</strong> are
              listed but <em>not</em> attested because no public issuer address was independently
              confirmable. Nothing is faked to reach a count.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="p-2">Instrument</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Issuer address</th>
                    <th className="p-2">Provenance-controls</th>
                    <th className="p-2">Distribution-integrity</th>
                  </tr>
                </thead>
                <tbody>
                  {reg.instruments.map((r) => {
                    const hasMeasuredControls =
                      r.xrpl_issuer != null && measuredIssuers.has(r.xrpl_issuer);
                    return (
                      <tr key={r.instrument} className="border-b last:border-0 align-top">
                        <td className="p-2 font-medium text-gray-900">{r.instrument}</td>
                        <td className="p-2 text-gray-500">{r.category}</td>
                        <td className="p-2">
                          {r.address_status === "mainnet-verified" && r.explorer ? (
                            <a
                              className="font-mono text-xs text-emerald-700 underline"
                              href={r.explorer}
                            >
                              {(r.xrpl_issuer ?? "").slice(0, 12)}…
                            </a>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                              not located
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {hasMeasuredControls ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                              Measured
                            </span>
                          ) : (
                            <span className={UNMEASURED_PILL}>Unmeasured</span>
                          )}
                        </td>
                        <td className="p-2">
                          <span className={UNMEASURED_PILL}>Unmeasured</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              The &ldquo;Measured&rdquo; provenance-controls facts are the six deterministic,
              signed, on-chain control records — allowlisting, freeze authority, declared identity
              domain — published in full on{" "}
              <Link className="text-emerald-700 underline" href="/xrpl-attest">
                Attestation on the ledger
              </Link>
              . distribution-integrity remains UNMEASURED for all {reg.counts.named} instruments.
            </p>
          </div>
        )}

        {/* SECTION 3b — the six MEASURED provenance-controls facts (real, signed) */}
        {fin && (
          <div className="mt-8 rounded-xl border border-emerald-700/30 bg-emerald-50/40 p-5 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">
              The measured facts we already have — provenance-controls (signed)
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              A different axis, shown here so the boundary is honest: {fin.measured.length}{" "}
              instruments whose on-chain control facts are <strong>MEASURED</strong> — read from the
              validated ledger and signed ({fin.network}). Regulated securities enforce allowlisting;
              permissionless stablecoins do not. The <em>risk</em> verdict on every one of them stays
              UNMEASURED. These are facts, not a rating, not advice, not an endorsement.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="p-2">Instrument</th>
                    <th className="p-2">Allowlisting</th>
                    <th className="p-2">Freeze</th>
                    <th className="p-2">Identity domain</th>
                    <th className="p-2">Risk verdict</th>
                    <th className="p-2">Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {fin.measured.map((m) => (
                    <tr key={m.devnet_tx} className="border-b last:border-0">
                      <td className="p-2 font-medium text-gray-900">{m.instrument}</td>
                      <td className="p-2">
                        {m.control_facts.facts.allowlisting_enforced ? "enforced" : "none"}
                      </td>
                      <td className="p-2">
                        {m.control_facts.facts.issuer_can_freeze ? "retained" : "none"}
                      </td>
                      <td className="p-2">
                        {m.control_facts.facts.identity_domain_declared ? "declared" : "absent"}
                      </td>
                      <td className="p-2">
                        <span className={UNMEASURED_PILL}>{m.risk_verdict_status}</span>
                      </td>
                      <td className="p-2">
                        <a className="font-mono text-xs text-emerald-700 underline" href={m.explorer}>
                          tx
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              As of {fin.measured[0]?.control_facts.as_of}. {fin.honesty}
            </p>
          </div>
        )}

        {/* SECTION 4 — independent-attestation framing / boundary box */}
        <div className="mt-10 rounded-xl border-2 border-emerald-700/40 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">The boundary — what this is, and is not</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">What it is</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Independent.</strong> Signed evidence about assets we do not issue —
                  no issuer opt-in, no issuer payment.
                </li>
                <li>
                  <strong>Unsolicited and permissionless.</strong> The coverage layer accounts for
                  the instrument universe whether or not any issuer participates.
                </li>
                <li>
                  <strong>Measurement and attestation.</strong> Deterministic facts and coverage
                  declarations, each re-derivable from public rows.
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">What it is not</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Not a credit rating.</strong> We publish no creditworthiness opinion and no
                  scored grade on any instrument or issuer.
                </li>
                <li>
                  <strong>Not an issuer.</strong> We attest; we never tokenize, mint, custody, or sell
                  an instrument.
                </li>
                <li>
                  <strong>Not advice or an endorsement.</strong> Nothing here is investment advice or a
                  recommendation to buy, hold, or sell.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 5 — honest gate note */}
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="text-xs font-bold uppercase tracking-wide">The gate — read before expecting a verdict</p>
          <p className="mt-2">
            What is live now is <strong>coverage</strong>: a named axis, an open instrument universe,
            and every distribution-integrity status honestly UNMEASURED. A <em>measured verdict on a
            named security</em> — a signed distribution-integrity value attached to a specific
            instrument — needs securities counsel sign-off before publication, and does not unlock by
            adding compute. Until then this page asserts coverage and control facts only, never a
            verdict, rating, or advice on any named instrument.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            href="/xrpl-attest"
          >
            See the signed attestations →
          </Link>
          <Link
            className="rounded-lg border border-emerald-700/30 px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-50"
            href="/honesty"
          >
            What we cannot yet measure
          </Link>
        </div>
      </div>
    </div>
  );
}
