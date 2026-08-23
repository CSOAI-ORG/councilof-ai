import { ECOSYSTEM } from "@/data/ecosystem";
import { scoreAccount } from "@/lib/hiveScore";
import { FOCUS, SP, SURFACE, TYPE } from "./glass";

/** In-lobby ecosystem summary — full view at /intel in site column. */
export default function LobbyEcosystemPane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const cited = ECOSYSTEM.filter((a) => a.source && !a.source.startsWith("pending"));
  const regulators = ECOSYSTEM.filter((a) => a.type === "regulator" || a.type === "government");
  const enterprises = ECOSYSTEM.filter((a) => !["regulator", "government"].includes(a.type));
  const top = enterprises
    .map((a) => ({ a, s: scoreAccount(a) }))
    .filter((x) => x.s.confidence !== "authority")
    .sort((x, y) => y.s.totalGap - x.s.totalGap)
    .slice(0, 6);

  return (
    <section className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Ecosystem index</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Regulators · enterprises · SMBs</h2>
      <p className={`mt-2 ${TYPE.body} text-slate-600`}>
        {ECOSYSTEM.length} public orgs in seed · GET /api/ecosystem for agents · measurement not certification.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-lg font-black text-emerald-700">{regulators.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Authorities</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-lg font-black text-emerald-700">{enterprises.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Enterprises</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-lg font-black text-emerald-700">{cited.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Cited rows</div>
        </div>
      </div>

      <h3 className={`${TYPE.section} mt-6 mb-2`}>Top gaps (seed)</h3>
      <ul className="space-y-1.5">
        {top.map(({ a, s }) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onOpenRoute(`/brief?id=${a.id}`, a.name)}
              className={`${SURFACE} flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-emerald-50 ${FOCUS}`}
            >
              <span className="text-sm font-semibold text-slate-900">{a.name}</span>
              <span className="font-mono text-xs text-amber-700">{s.totalGap}/21</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onOpenRoute("/intel", "Distribution Hive")}
        className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
      >
        Open full Hive in site column →
      </button>
    </section>
  );
}
