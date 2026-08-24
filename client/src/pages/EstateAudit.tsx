/**
 * /estate — honest map of what we have, what we have not built, and every
 * competing front end. Crown jewels stay named. Gaps stay named.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { CROWN_JEWELS, FRONT_ENDS, GAPS, type EstateRow, type Register } from "@/data/estateAudit";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING } from "@/lib/positioning";

const TONE: Record<Register, string> = {
  LIVE: "bg-emerald-100 text-emerald-900",
  DEMO: "bg-sky-100 text-sky-900",
  DESIGN: "bg-slate-200 text-slate-700",
  FROZEN: "bg-amber-100 text-amber-950",
  COMPETING: "bg-violet-100 text-violet-900",
};

function Table({ title, rows }: { title: string; rows: EstateRow[] }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <a href={row.href} className="font-semibold text-emerald-800 hover:underline">
                  {row.title}
                </a>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE[row.register]}`}>
                  {row.register}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{row.note}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">{row.href}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EstateAudit() {
  useEffect(() => {
    document.title = "Estate audit — crown jewels and gaps | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-slate-900">
      <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">
            Front-end council · every webpage · crown jewels
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            What we have. What we have not built. Every front end still on the estate.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-emerald-50/90">
            Council OS is the living workspace. Old pages stay. Frozen training rails stay, with a
            banner to the fluid sim. Competing homepages stay, with / as the canonical story.
            AG-UI and MCP are named here as DESIGN until the wire URL and a first-party MCP
            endpoint are actually live — a 503 is not a product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openLobby({ pane: "home" })}
              className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-300"
            >
              {POSITIONING.os.cta}
            </button>
            <Link
              href="/live-training"
              className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              Art. 4 live sim
            </Link>
            <Link href="/os" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              OS Refinery map
            </Link>
          </div>
        </div>
      </section>

      <Table title="Crown jewels — mine these, do not rebuild them" rows={CROWN_JEWELS} />
      <Table title="Not done — the whitespace that is the product" rows={GAPS} />
      <Table title="All front ends still rendering" rows={FRONT_ENDS} />
    </div>
  );
}
