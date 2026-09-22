import { useEffect, useState } from "react";
import {
  isMillReceiptReadiness,
  measurementReading,
  regulationLabel,
  summariseReceipts,
  type MillReceipt,
  type MillReceiptReadiness,
} from "@/lib/millReceiptReadiness";

const ABSENCE_STYLE: Record<string, string> = {
  UNMEASURED: "text-amber-800",
  SIGNED_WITHOUT_DATE: "text-slate-700",
};

function MeasurementCell({ row }: { row: MillReceipt }) {
  const reading = measurementReading(row);
  if (reading.kind === "DATED") return <span className="font-mono text-gray-900">{reading.label}</span>;
  return (
    <div className={ABSENCE_STYLE[reading.kind]}>
      <b>{reading.label}</b>
      <p className="mt-0.5 max-w-[22rem] text-[11px] leading-snug">{reading.detail}</p>
    </div>
  );
}

/** Rendered from validated bytes only; the wrapper below never passes it anything else. */
export function MillReceiptReadinessView({ data }: { data: MillReceiptReadiness }) {
  const c = summariseReceipts(data.receipts);
  const tiles: [string, number, string][] = [
    ["Receipts", c.receipts, "staged wrappers resolved to their terminal replacement"],
    ["Outer signature valid", c.outer_signature_valid, "Ed25519 over the published bytes"],
    ["Declared SIGNED", c.declared_signed, `${c.declared_staged_unsigned} still declared staged unsigned`],
    ["Measurement dated", c.measured_at_recorded, `${c.measured_at_absent_unmeasured_card + c.measured_at_absent_dateless_card} carry a stated absence`],
    ["UNMEASURED", c.status_unmeasured, "reasons given per row; never quoted as a result"],
    ["Regulation linked", c.regulatory_linked, `${c.regulatory_unlinked} unlinked; not regulation-scored`],
  ];
  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5" data-testid="mill-receipt-readiness">
      <h2 className="text-lg font-bold text-gray-900">Latest off-device receipt lifecycle</h2>
      <p className="mt-1 text-sm text-gray-700">{data.truth_rule}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="rounded-lg bg-gray-50 p-3">
            <dt className="text-[11px] text-gray-500">{label}</dt>
            <dd className="font-mono text-xl font-bold text-gray-900">{value}</dd>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">{hint}</p>
          </div>
        ))}
      </dl>
      <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[52rem] text-left text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              {["Model / axis", "Measurement date", "Outer crypto", "Declared lifecycle", "Regulatory linkage", "Evidence"].map((heading) => (
                <th key={heading} className="px-3 py-2">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.receipts.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2"><b>{row.model}</b><div className="text-gray-500">{row.axis}</div></td>
                <td className="px-3 py-2"><MeasurementCell row={row} /></td>
                <td className="px-3 py-2 font-semibold text-emerald-700">{row.outer_signature.state} · {row.outer_signature.alg}</td>
                <td className="px-3 py-2 text-gray-800">{row.declared_lifecycle}</td>
                <td className="px-3 py-2">
                  {regulationLabel(row)}
                  {row.regulatory_linkage.refs.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-gray-500">{row.regulatory_linkage.refs.join("; ")}</div>
                  )}
                </td>
                <td className="px-3 py-2"><a className="font-semibold text-emerald-700 underline" href={row.card_url}>receipt</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MillReceiptReadinessPanel() {
  const [data, setData] = useState<MillReceiptReadiness | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/interop/mill-receipt-readiness.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((value) => isMillReceiptReadiness(value) ? setData(value) : Promise.reject(new Error("invalid truth contract")))
      .catch((reason) => setError(String(reason?.message ?? reason)));
  }, []);
  if (error) return <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Receipt readiness unavailable: {error}. No fallback claims are shown.</p>;
  if (!data) return <p className="mt-4 text-sm text-gray-600">Loading receipt lifecycle evidence…</p>;
  return <MillReceiptReadinessView data={data} />;
}
