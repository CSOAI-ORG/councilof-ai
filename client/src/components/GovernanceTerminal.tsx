import { GSPC_HEALTH_PITCH } from "@/lib/healthTerms";
import { TERMINAL_PITCH, TERMINAL_ROWS, TERMINAL_RULING } from "@/lib/governanceTerminal";

const KINDS = [
  { id: "moat" as const, label: "Moat — already ours" },
  { id: "forgot" as const, label: "Forgotten — strengthens us" },
  { id: "steal" as const, label: "Learn from their backends" },
  { id: "never" as const, label: "Do not become" },
];

export default function GovernanceTerminal({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="governance-terminal" aria-labelledby="terminal-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Terminal · moat · forgotten
        </p>
        <h2 id="terminal-h" className={`mt-2 text-xl font-bold ${head}`}>
          {TERMINAL_RULING}
        </h2>
        <p className={`mt-3 text-sm ${title}`}>{GSPC_HEALTH_PITCH}</p>
        <p className={`mt-2 text-sm ${body}`}>{TERMINAL_PITCH}</p>
      </div>

      {KINDS.map((group) => {
        const rows = TERMINAL_ROWS.filter((r) => r.kind === group.id);
        return (
          <div key={group.id} data-testid={`terminal-${group.id}`}>
            <h3 className={`text-sm font-bold ${title}`}>{group.label}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.id} className={panel} data-testid={`terminal-row-${row.id}`}>
                  <h4 className={`font-semibold ${title}`}>{row.title}</h4>
                  <p className={`mt-2 text-sm ${body}`}>{row.does}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
