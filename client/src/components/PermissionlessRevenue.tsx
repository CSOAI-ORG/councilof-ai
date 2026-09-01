import {
  EARN_RULING,
  EARN_WEDGE,
  OPEN_SDKS,
  OPENINGS,
  type EarnWhen,
} from "@/lib/permissionlessRevenue";

const WHEN: { id: EarnWhen; label: string; hint: string }[] = [
  { id: "now", label: "Open now — no mint required", hint: "Invoice work. Feed the SDKs we already planted." },
  { id: "after-payto", label: "After custody / payTo", hint: "Settlement exists. Still assembly, never rank." },
  { id: "after-100", label: "After 100/100 A+++", hint: "Permissionless flags and paid reruns." },
  { id: "never", label: "Never", hint: "Do not mine or mint a grade." },
];

export default function PermissionlessRevenue({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="permissionless-revenue" aria-labelledby="earn-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Permissionless revenue · work, never rank
        </p>
        <h2 id="earn-h" className={`mt-2 text-xl font-bold ${head}`}>
          {EARN_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>{EARN_WEDGE}</p>
        <p className={`mt-2 text-sm ${body}`}>
          A rank is never sold. 100 free calls a day stay free. Machine-access
          pricing waits for a published ruling. This VM has no custody keys.
        </p>
      </div>

      <div>
        <h3 className={`text-sm font-bold ${title}`}>Open SDKs already planted — feed these</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {OPEN_SDKS.map((sdk) => (
            <li key={sdk.id} className={panel} data-testid={`earn-sdk-${sdk.id}`}>
              <a href={sdk.href} className={`font-semibold underline-offset-2 hover:underline ${title}`}>
                {sdk.id}
              </a>
              <p className={`mt-1 text-[13px] ${body}`}>{sdk.eats}</p>
            </li>
          ))}
        </ul>
      </div>

      {WHEN.map((group) => {
        const rows = OPENINGS.filter((o) => o.when === group.id);
        return (
          <div key={group.id} data-testid={`earn-when-${group.id}`}>
            <h3 className={`text-sm font-bold ${title}`}>{group.label}</h3>
            <p className={`mt-1 text-[13px] ${muted}`}>{group.hint}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.id} className={panel} data-testid={`earn-open-${row.id}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <a href={row.href} className={`font-semibold underline-offset-2 hover:underline ${title}`}>
                      {row.title}
                    </a>
                    <span className={`font-mono text-[10px] uppercase ${muted}`}>{row.when}</span>
                  </div>
                  <p className={`mt-2 text-sm ${body}`}>{row.eats}</p>
                  <p className={`mt-2 text-[12px] ${muted}`}>Feed: {row.feed}</p>
                  <p className={`mt-1 text-[12px] ${muted}`}>Never: {row.never}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
