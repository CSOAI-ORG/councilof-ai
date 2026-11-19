import {
  EARN_RULING,
  EARN_WEDGE,
  OPEN_SDKS,
  OPENINGS,
  type EarnWhen,
} from "@/lib/permissionlessRevenue";

const WHEN: { id: EarnWhen; label: string; hint: string }[] = [
  { id: "now", label: "Existing evidence services", hint: "Confirm the scope and terms of existing services before accepting an order." },
  { id: "after-payto", label: "Payment-dependent services", hint: "Check the current service catalogue and payment requirements." },
  { id: "after-100", label: "After evidence review", hint: "Publication candidates and separately scoped reproduction work." },
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
          Evidence services · scope and delivery
        </p>
        <h2 id="earn-h" className={`mt-2 text-xl font-bold ${head}`}>
          {EARN_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>{EARN_WEDGE}</p>
        <p className={`mt-2 text-sm ${body}`}>
          Verification is free. Availability, scope and payment requirements are
          stated in the current service catalogue. An enquiry does not place an order.
        </p>
      </div>

      <div>
        <h3 className={`text-sm font-bold ${title}`}>Published tools and connection routes</h3>
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
