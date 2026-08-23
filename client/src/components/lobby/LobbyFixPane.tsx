import { openLobby } from "@/lib/lobbyLink";
import { FOCUS, SP, TYPE } from "./glass";

/**
 * Fix & train lane — MEOK/AG-UI assist inside Council OS.
 * Council measures; this pane routes to fixers + AG-UI wire for guided remediation.
 * Firewall: no certification implied by using the assist lane.
 */
export default function LobbyFixPane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const steps = [
    { n: "1", t: "Read the signed card", d: "Gaps from batch assess or /assess — Ed25519 verifiable." },
    { n: "2", t: "AG-UI assist (online)", d: "MEOK wire when AGUI_WIRE_URL set — HITL before any action on your machine." },
    { n: "3", t: "Fix on web or PC", d: "Your team or a remediation partner closes gaps; Council does not operate the fix." },
    { n: "4", t: "Re-measure free", d: "Schedule re-attest — delta card, not a renewed certificate." },
  ];

  return (
    <section className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Fix & train</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Close gaps · stay current</h2>
      <p className={`mt-2 ${TYPE.body} text-slate-600`}>
        Certification is outdated. We train you on the measurement, help fix via AG-UI/MEOK when wired, and re-measure on schedule.
      </p>

      <ol className="mt-6 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
              {s.n}
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">{s.t}</div>
              <div className="text-xs text-slate-600">{s.d}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => openLobby({ task: "fix-gaps", pane: "measured", aguiHandle: "remediation-assist" })}
          className={`rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 ${FOCUS}`}
        >
          Open AG-UI fix assist →
        </button>
        <button
          type="button"
          onClick={() => onOpenRoute("/remediation-partners", "Remediation partners")}
          className={`rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Choose independent fixer →
        </button>
        <button
          type="button"
          onClick={() => onOpenRoute("/workspace", "Re-attest schedule")}
          className={`rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 ${FOCUS}`}
        >
          Schedule re-measurement →
        </button>
      </div>

      <p className={`mt-4 ${TYPE.fine}`}>
        Offline: pane commands and /api/chat grounded lane still work. AG-UI streaming requires AGUI_WIRE_URL.
      </p>
    </section>
  );
}
