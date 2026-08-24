/**
 * /os — Council OS Refinery: master ONE OS entry (OpenRouter living refinery pattern).
 * Opens the dock; site column shows the product map. Inner nav syncs all layers.
 */
import { useEffect } from "react";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsInnerNav from "@/components/os/CouncilOsInnerNav";
import { COUNCIL_OS_PRIMARY, COUNCIL_OS_MEASURE, COUNCIL_OS_TOOLING } from "@/lib/councilOsNav";
import { MASTER_NAVIGATION } from "@/data/masterMenu";

export default function CouncilOsRefinery() {
  useEffect(() => {
    document.title = "Council OS Refinery | Council of AI";
    openLobby({ pane: "home" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CouncilOsInnerNav
        title="Council OS Refinery"
        subtitle="One workspace — board, models, routes, arena, ecosystem, your systems, AG-UI fix lane"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          The living <span className="text-emerald-600">refinery</span>
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-600">
          OpenRouter routes models. LMArena compares them. Moody's SaaS keeps risk current.
          Council OS does all three for governance measurement — plus regulators, enterprises, and SMBs in one index.
          Measurement and training, not certification.
        </p>

        <button
          type="button"
          onClick={() => openLobby({ pane: "home" })}
          className="mt-6 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-emerald-600"
        >
          Open Council OS dock →
        </button>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Product rail</h2>
            <ul className="mt-4 space-y-2">
              {COUNCIL_OS_PRIMARY.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm"
                    onClick={(e) => {
                      if (item.pane) {
                        e.preventDefault();
                        openLobby({ pane: item.pane, task: item.task, path: item.href });
                      }
                    }}
                  >
                    <div className="font-semibold text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Measure & evidence</h2>
            <ul className="mt-4 space-y-2">
              {COUNCIL_OS_MEASURE.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300"
                    onClick={(e) => {
                      if (item.pane) {
                        e.preventDefault();
                        openLobby({ pane: item.pane, task: item.task, path: item.href });
                      }
                    }}
                  >
                    <div className="font-semibold text-slate-900">{item.label}</div>
                  </a>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-sm font-bold uppercase tracking-widest text-slate-500">Tooling depth</h2>
            <ul className="mt-4 space-y-2">
              {COUNCIL_OS_TOOLING.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300"
                    onClick={(e) => {
                      if (item.pane) {
                        e.preventDefault();
                        openLobby({ pane: item.pane, task: item.task, path: item.href });
                      }
                    }}
                  >
                    <div className="font-semibold text-slate-900">{item.label}</div>
                    {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                  </a>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-sm font-bold uppercase tracking-widest text-slate-500">Header groups</h2>
            <ul className="mt-4 space-y-3">
              {MASTER_NAVIGATION.map((g) => (
                <li key={g.name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-900">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.description}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-12 text-xs text-slate-500">
          Firewall: Council signs measurement. MEOK/AG-UI may assist fixes when wired. Re-measurement is free.
          GET /api/ecosystem · POST /api/assess/batch · /workspace
        </p>
      </div>
    </div>
  );
}
