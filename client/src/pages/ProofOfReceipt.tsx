import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * /proof-of-receipt — the one receipt home.
 *
 * Shows the latest receipt issued by the estate, links to the verification
 * endpoint, and displays aggregate receipt counts. Pulls live data from
 * /api/receipt-status (free, no x402 gate).
 *
 * G6.5: "proofof.ai back up + /receipt restored + bodies.ai's receipt
 * function folded in (one receipt home)."
 *
 * noindex,nofollow,noarchive — not indexed until the estate has at least one
 * non-self, non-zero receipt.
 */

type ReceiptStatus = {
  schema?: string;
  status?: string;
  total_receipts?: number | null;
  latest_receipt?: {
    issued_at?: string | null;
    resource?: string | null;
    kid?: string | null;
    zero_value?: boolean | null;
    self?: boolean | null;
  } | null;
  receipts_today?: number | null;
  receipts_this_week?: number | null;
  reason?: string;
};

async function fetchStatus(): Promise<ReceiptStatus | null> {
  try {
    const r = await fetch("/api/receipt-status");
    if (!r.ok) return null;
    return (await r.json()) as ReceiptStatus;
  } catch {
    return null;
  }
}

export default function ProofOfReceipt() {
  const [data, setData] = useState<ReceiptStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Receipt status | Council of AI</title>
        <meta
          name="description"
          content="Latest receipt issued by the estate, aggregate counts, and verification links. Measurement, not certification."
        />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>

      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          One receipt home · measurement, not certification
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Proof of Receipt</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Every x402 settlement that clears to the estate is recorded and signed.
          This page reads the aggregate state — count, latest issuer, latest
          timestamp — from the receipt store. The verification endpoint lets
          anyone check a receipt against the published key, offline or via API.
        </p>

        {/* Status card */}
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/80 p-6">
          {loading ? (
            <p className="font-mono text-sm text-slate-400">Loading receipt status…</p>
          ) : !data ? (
            <p className="font-mono text-sm text-slate-400">
              Could not reach /api/receipt-status. The endpoint may be
              unavailable on this deployment.
            </p>
          ) : data.status === "UNRECORDED" ? (
            <>
              <p className="font-mono text-sm text-amber-300">UNRECORDED</p>
              <p className="mt-2 text-sm text-slate-400">{data.reason}</p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <CountBox label="Total receipts" value={data.total_receipts} />
                <CountBox label="Today" value={data.receipts_today} />
                <CountBox label="This week" value={data.receipts_this_week} />
                <CountBox
                  label="Status"
                  value={data.status ?? "—"}
                  isText
                />
              </div>

              {data.latest_receipt ? (
                <div className="mt-6 border-t border-slate-700 pt-4">
                  <h2 className="font-mono text-xs uppercase tracking-wide text-slate-400">
                    Latest receipt
                  </h2>
                  <dl className="mt-2 space-y-1 text-sm">
                    {data.latest_receipt.issued_at && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-slate-500">Issued:</dt>
                        <dd className="font-mono text-slate-200">
                          <time dateTime={data.latest_receipt.issued_at}>
                            {data.latest_receipt.issued_at}
                          </time>
                        </dd>
                      </div>
                    )}
                    {data.latest_receipt.kid && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-slate-500">Issuer (kid):</dt>
                        <dd className="break-all font-mono text-slate-200">
                          {data.latest_receipt.kid}
                        </dd>
                      </div>
                    )}
                    {data.latest_receipt.resource && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-slate-500">Resource:</dt>
                        <dd className="break-all font-mono text-slate-200">
                          {data.latest_receipt.resource}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Verification */}
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
          <h2 className="font-bold text-lg">Verify a receipt</h2>
          <p className="mt-2 text-sm text-slate-300">
            Hand a compact JWS to the verification endpoint and get VALID or INVALID.
            Free forever — every verification surface in this estate is free.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/api/receipts/verify"
              className="rounded-xl bg-emerald-400 px-5 py-2.5 font-bold text-slate-950 hover:bg-emerald-300"
            >
              POST /api/receipts/verify
            </a>
            <a
              href="/api/receipts/verify"
              className="rounded-xl border border-slate-600 px-5 py-2.5 font-mono text-sm text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              GET (docs)
            </a>
          </div>
        </div>

        {/* Related endpoints */}
        <div className="mt-8 text-sm text-slate-400">
          <h2 className="font-mono text-xs uppercase tracking-wide text-slate-500">
            Related endpoints
          </h2>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="/api/receipt-status" className="font-mono text-emerald-400 underline underline-offset-4">
                /api/receipt-status
              </a>{" "}
              — aggregate counts (this page's source)
            </li>
            <li>
              <a href="/api/receipts/latest" className="font-mono text-emerald-400 underline underline-offset-4">
                /api/receipts/latest
              </a>{" "}
              — latest 50 receipts (aggregate feed)
            </li>
            <li>
              <a href="/api/receipts?payer=0x…" className="font-mono text-emerald-400 underline underline-offset-4">
                /api/receipts?payer=0x…
              </a>{" "}
              — per-payer receipt lookup
            </li>
            <li>
              <a href="/api/revenue" className="font-mono text-emerald-400 underline underline-offset-4">
                /api/revenue
              </a>{" "}
              — the three-SKU revenue instrumentation
            </li>
          </ul>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Measurement, not certification. Not a grade, endorsement, or legal finding.
          <br />
          <Link href="/" className="text-emerald-400 underline">
            Back to Council of AI
          </Link>
        </p>
      </section>
    </section>
  );
}

function CountBox({
  label,
  value,
  isText = false,
}: {
  label: string;
  value: number | string | null | undefined;
  isText?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 ${isText ? "text-sm font-semibold" : "text-2xl font-black"} text-emerald-300`}
      >
        {value != null ? String(value) : "—"}
      </dd>
    </div>
  );
}
