import { FILL_PIPELINE, FILL_ROWS, FILL_RULING, type FillLayer } from "@/lib/productFill";

const LAYERS: { id: FillLayer; label: string }[] = [
  { id: "cell", label: "Signed cell" },
  { id: "pack", label: "Packs" },
  { id: "index", label: "Coverage index" },
  { id: "ledger", label: "Corrections" },
  { id: "anchor", label: "Digest anchors" },
  { id: "telemetry", label: "Harness telemetry" },
  { id: "forbidden", label: "Do not" },
];

export default function ProductFill({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12" data-testid="product-fill" aria-labelledby="fill-h">
      <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
        Fill path · one cell, many views
      </p>
      <h2 id="fill-h" className={`mt-2 text-xl font-bold ${head}`}>
        {FILL_RULING}
      </h2>
      <ol className={`mt-4 list-decimal space-y-1 pl-5 text-sm ${body}`}>
        {FILL_PIPELINE.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-6 space-y-5">
        {LAYERS.map((layer) => {
          const rows = FILL_ROWS.filter((r) => r.layer === layer.id);
          return (
            <div key={layer.id} data-testid={`fill-layer-${layer.id}`}>
              <h3 className={`text-sm font-bold ${title}`}>{layer.label}</h3>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                  <li key={row.id} className={panel} data-testid={`fill-row-${row.id}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <a href={row.href} className={`font-semibold underline-offset-2 hover:underline ${title}`}>
                        {row.title}
                      </a>
                      <span className={`font-mono text-[10px] uppercase ${muted}`}>{row.status}</span>
                    </div>
                    <p className={`mt-2 text-sm ${body}`}>{row.fills}</p>
                    <p className={`mt-2 text-[12px] ${muted}`}>Never: {row.never}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
