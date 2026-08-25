import { EUNOMIA_AXES } from "@/data/eunomia";

export default function Registers() {
  const axes = EUNOMIA_AXES;
  const measured = axes.filter((a) => a.status === "MEASURED").length;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA Registers — signed financial-axis rows</h1>
      <p className="mt-1 text-sm text-emerald-300/80">{measured} measured of {axes.length} · exact-label · Wilson CI · Ed25519-signed · recompute-able</p>
      <p className="mt-2 text-xs text-slate-400">Register endpoint: <span className="font-mono text-emerald-300">GET /api/registers</span> · measurement, not certification. Every row is Ed25519-signed (<code>did:web:csoai.org#estate-chain-1</code>) and a stranger can re-derive it.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-emerald-400/20">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b border-slate-600 bg-[#0d241b] text-left text-xs uppercase text-slate-400">
            <th className="px-3 py-2">axis</th><th>strong (7b)</th><th>baseline (0.5b)</th><th>n</th><th>status</th></tr></thead>
          <tbody>{EUNOMIA_AXES.map((a) => (
            <tr key={a.axis} className="border-b border-slate-700/50">
              <td className="px-3 py-2 font-mono text-emerald-200">{a.axis}</td>
              <td className="font-mono">{a.strong ? a.strong.acc.toFixed(3) : "—"}</td>
              <td className="font-mono text-slate-400">{a.baseline ? a.baseline.acc.toFixed(3) : "—"}</td>
              <td className="text-slate-400">{a.n}</td>
              <td><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{a.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="mt-6 text-xs text-slate-400">Free verify at <a href="/gspc-verify" className="text-emerald-300 underline">/gspc-verify</a> · regulators free (R8) · commercial x402 data at <a href="/eunomia-data" className="text-emerald-300 underline">/eunomia-data</a>.</p>
    </div>
  );
}
