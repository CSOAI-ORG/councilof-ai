import {
  ATTACH_ROWS,
  HF_RECORD,
  REG_OBSERVE,
  TWO_SPEED_LANES,
  TWO_SPEED_RULING,
} from "@/lib/twoSpeed";

export default function TwoSpeed() {
  return (
    <section className="mt-16 space-y-8" data-testid="two-speed" aria-labelledby="two-speed-h">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
          Two-speed · bind, do not vendor
        </p>
        <h2 id="two-speed-h" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {TWO_SPEED_RULING}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          That is the easier way to cover millions: metadata for the lot, inference
          only for unique runnable lineages. SCITT, IETF, OWASP and Microsoft CCF
          ride as attachments. They do not write MEASURED. The Hugging Face corpus
          is the public record of what was signed — not one CSOAI repo per model.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TWO_SPEED_LANES.map((lane) => (
          <div
            key={lane.id}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5"
            data-testid={`two-speed-${lane.id}`}
          >
            <h3 className="font-bold text-slate-900">{lane.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{lane.does}</p>
            <p className="mt-2 text-[12px] text-emerald-900">Never: {lane.never}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Joined run — one cell, many receipts</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          Bind their verifiers. Do not swallow their trees. Extra MCP catalogues are
          not this product.
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {ATTACH_ROWS.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`attach-${row.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={row.href} className="font-semibold text-slate-900 hover:underline">
                  {row.title}
                </a>
                <span className="font-mono text-[10px] uppercase text-emerald-800">
                  {row.write === "measured" ? "writes MEASURED" : "never MEASURED"} · {row.status}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-slate-600">{row.does}</p>
              <p className="mt-1 text-[12px] text-slate-500">Never: {row.never}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="reg-observe">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600">
          Regulatory observation plugin
        </p>
        <p className="mt-2 text-sm text-slate-700">{REG_OBSERVE.plugin_does}</p>
        <p className="mt-2 text-sm text-slate-700">Never: {REG_OBSERVE.plugin_never}</p>
        <p className="mt-3 text-sm font-semibold text-slate-800">{REG_OBSERVE.art50_boundary}</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Hugging Face is the signing record</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          Scale by appending Parquet and cards to the corpus. Do not spray a new
          model repo for every external artefact.
        </p>
        <ul className="mt-3 space-y-2">
          {HF_RECORD.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <a href={row.href} className="font-semibold text-emerald-800 hover:underline">
                {row.id}
              </a>
              <span className="ml-2 font-mono text-[10px] uppercase text-slate-500">{row.status}</span>
              <p className="mt-1 text-slate-600">{row.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
