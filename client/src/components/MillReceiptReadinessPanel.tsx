import { useEffect, useState } from "react";
import { isMillReceiptReadiness, outerStateClass, regulationLabel, type MillReceiptReadiness } from "@/lib/millReceiptReadiness";

export default function MillReceiptReadinessPanel() {
  const [data, setData] = useState<MillReceiptReadiness | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/interop/mill-receipt-readiness.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((value) => isMillReceiptReadiness(value) ? setData(value) : Promise.reject(new Error("invalid truth contract")))
      .catch((reason) => {
        const why = String(reason?.message ?? reason);
        // The technical reason is for whoever debugs the page, not visible copy (persona sweep 6 Oct 2026).
        console.warn("mill-receipt-readiness:", why);
        setError(why);
      });
  }, []);
  if (error)
    return (
      <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" data-testid="mill-receipt-readiness-unavailable" data-error={error}>
        Receipt lifecycle figures could not be read just now, so none are shown.
      </p>
    );
  if (!data) return <p className="mt-4 text-sm text-gray-600">Loading receipt lifecycle evidence…</p>;
  const c = data.counts;
  const tiles: [string, number | undefined][] = [
    ["Receipts", c.receipts],
    ["Outer signature valid", c.outer_signature_valid],
    ["Declared signed", c.declared_signed],
    ["Declared staged unsigned", c.declared_staged_unsigned],
    ["Regulation linked", c.regulatory_linked],
    ["Regulation unlinked", c.regulatory_unlinked],
  ];
  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5" data-testid="mill-receipt-readiness">
      <h2 className="text-lg font-bold text-gray-900">Latest off-device receipt lifecycle</h2>
      <p className="mt-1 text-sm text-gray-700">{data.truth_rule}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-gray-50 p-3">
            <dt className="text-[11px] text-gray-500">{label}</dt>
            {/* A count the file does not carry (v1 has no declared_signed) shows as a dash, never 0. */}
            <dd className="font-mono text-xl font-bold text-gray-900" title={typeof value === "number" ? undefined : "not reported in this file"}>
              {typeof value === "number" ? value : "—"}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[44rem] text-left text-xs"><thead className="sticky top-0 bg-gray-100"><tr>{["Model / axis", "Outer crypto", "Declared lifecycle", "Regulatory linkage", "Evidence"].map((heading) => <th key={heading} className="px-3 py-2">{heading}</th>)}</tr></thead><tbody>
          {data.receipts.map((row) => <tr key={row.id} className="border-t border-gray-100"><td className="px-3 py-2"><b>{row.model}</b><div className="text-gray-500">{row.axis}</div></td><td className={`px-3 py-2 font-semibold ${outerStateClass(row.outer_signature.state)}`}>{row.outer_signature.state}{row.outer_signature.alg ? ` · ${row.outer_signature.alg}` : ""}</td><td className="px-3 py-2 text-amber-800">{row.declared_lifecycle}</td><td className="px-3 py-2">{regulationLabel(row)}</td><td className="px-3 py-2"><a className="font-semibold text-emerald-700 underline" href={row.card_url}>receipt</a></td></tr>)}
        </tbody></table>
      </div>
    </section>
  );
}
