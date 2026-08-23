/**
 * LobbyToolPane — MCP / instrument quick cards for the Council OS workspace.
 *
 * Like OpenRouter's provider tooling: pick a route, try in chat, open full catalog.
 */
import { Link } from "wouter";
import { FOCUS, SP, SURFACE, TYPE } from "./glass";
import { allRouters, ROUTER_STATS } from "@/data/eunomia-router";
import { openInstrumentInLobby } from "@/lib/instrument-routes";
import { openLobby } from "@/lib/lobbyLink";

const FEATURED = allRouters()
  .filter((r) => r.featured)
  .slice(0, 8);

export default function LobbyToolPane() {
  return (
    <section aria-labelledby="coai-tools-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Tooling</p>
      <h2 id="coai-tools-h" className="mt-1 text-[17px] font-semibold tracking-tight text-slate-900">
        Eunomia MCP spine
      </h2>
      <p className={`mt-2 ${TYPE.muted}`}>
        {ROUTER_STATS.mcpServers} routing rules — try any instrument in chat via AG-UI when the wire is set.
        Full catalog at{" "}
        <Link href="/instruments" className="text-emerald-800 underline">
          /instruments
        </Link>
        .
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {FEATURED.map((r) => (
          <li key={r.id}>
            <div className={`${SURFACE} ${SP.card} flex h-full flex-col bg-white/90`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-slate-900">{r.name}</h3>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-800">
                  {r.layer}
                </span>
              </div>
              <p className={`mt-1.5 flex-1 ${TYPE.muted}`}>{r.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openInstrumentInLobby(r)}
                  className={`rounded-lg bg-emerald-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900 ${FOCUS}`}
                >
                  Try in chat
                </button>
                <Link
                  href={`/instruments/${r.layer}/${r.slug}`}
                  className={`rounded-lg border border-slate-900/10 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 ${FOCUS}`}
                >
                  Open page
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/agent-runbook"
          className={`rounded-xl border border-slate-900/10 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Agent runbook
        </Link>
        <Link
          href="/api-docs"
          className={`rounded-xl border border-slate-900/10 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          API docs
        </Link>
        <button
          type="button"
          onClick={() => openLobby({ task: "eunomia-router" })}
          className={`rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white hover:bg-slate-800 ${FOCUS}`}
        >
          Seed Eunomia prompt
        </button>
      </div>
    </section>
  );
}
