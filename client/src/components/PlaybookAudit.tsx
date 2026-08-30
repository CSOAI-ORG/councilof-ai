import {
  PLAYBOOK_CLAIMS,
  PLAYBOOK_PITCH,
  PLAYBOOK_RULING,
  PLAYBOOK_SOURCE,
  type PlaybookVerdict,
} from "@/lib/playbookAudit";

const GROUPS: { verdict: PlaybookVerdict; label: string }[] = [
  { verdict: "keep", label: "Keep — demand and binds" },
  { verdict: "stale", label: "Stale — quote the living board" },
  { verdict: "false", label: "False — do not build from this" },
  { verdict: "forbidden", label: "Forbidden — shortcuts we refuse" },
];

export default function PlaybookAudit({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="playbook-audit" aria-labelledby="playbook-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Playbook · {PLAYBOOK_SOURCE.dated}
        </p>
        <h2 id="playbook-h" className={`mt-2 text-xl font-bold ${head}`}>
          {PLAYBOOK_RULING}
        </h2>
        <p className={`mt-3 text-sm ${title}`}>{PLAYBOOK_PITCH}</p>
        <p className={`mt-2 text-sm ${body}`}>
          {PLAYBOOK_SOURCE.title}. {PLAYBOOK_SOURCE.role}
        </p>
      </div>
      {GROUPS.map((group) => {
        const rows = PLAYBOOK_CLAIMS.filter((c) => c.verdict === group.verdict);
        return (
          <div key={group.verdict} data-testid={`playbook-${group.verdict}`}>
            <h3 className={`text-sm font-bold ${title}`}>{group.label}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.id} className={panel} data-testid={`playbook-claim-${row.id}`}>
                  <p className={`text-sm ${title}`}>{row.claim}</p>
                  <p className={`mt-2 text-[12px] ${muted}`}>Live: {row.live}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
