import { useState } from "react";

type Tier = { name: string; price: string; sub: string; tag?: string; cta: string; href: string; feats: string[]; highlight?: boolean; accent?: "amber" };

export default function PlansPage() {
  const [annual, setAnnual] = useState(true);
  const pro = annual ? "$82.50" : "$99";
  const proSub = annual ? "per month, billed yearly ($990)" : "per month";
  const operator = annual ? "$249" : "$299";
  const operatorSub = annual ? "per month, billed yearly ($2,490)" : "per month";
  const team = annual ? "$124" : "$149";
  const teamSub = annual ? "per seat / mo, billed yearly" : "per seat / mo";
  const tiers: Tier[] = [
    { name: "Sovereign", price: "Free", sub: "open-source, forever", tag: "Own your data", cta: "Start free", href: "/signup?plan=free", feats: ["Your Sovereign on a free open-source model", "Self-host or hosted", "You own and export your data (JSON)", "Layer 0 signing", "Community council demos"] },
    { name: "Pro", price: pro, sub: proSub, tag: "Most popular", cta: "Go Pro", href: "/signup?plan=pro", highlight: true, feats: ["Everything in Free", "Premium hosted models", "Passport + EU AI Act audit (quota)", "BFT council + governance", "Real-world Sov Space + UE5 preview", "PAYG credits included"] },
    { name: "Operator", price: operator, sub: operatorSub, tag: "Defence-grade", accent: "amber", cta: "Become an Operator", href: "/signup?plan=operator", feats: ["Everything in Pro", "ONE OS - live agent + humanoid tracking", "Pre-emptive rogue-swarm stop, signed to Layer 0", "Emergence dome + defence layers", "Global Watchdog operator console", "Priority Layer 0 signing + support"] },
    { name: "Team", price: team, sub: teamSub, tag: "3-seat min", cta: "Start a team", href: "/signup?plan=team", feats: ["Everything in Pro, per seat", "SSO + SCIM", "Shared council + audit logs", "Admin and roles", "Priority support"] },
    { name: "Enterprise", price: "Custom", sub: "from ~$30k / yr", tag: "Governance-grade", cta: "Talk to us", href: "/enterprise", feats: ["Full EU AI Act audit suite", "Dedicated BFT council + defence", "Data residency + SLA", "SAML, audit export (CSV/JSON/Parquet)", "Onboarding + success"] },
  ];
  const packs = [{ n: "Starter", p: "$25" }, { n: "Builder", p: "$100" }, { n: "Scale", p: "$500" }];
  const meters: [string, string][] = [["Passport", "$0.10"], ["EU AI Act audit", "$0.25"], ["Council (BFT)", "$0.10"], ["Governance", "$0.50"], ["Sigil", "$0.01"], ["Defence", "$1.00"]];
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15 mx-auto max-w-6xl px-6 pt-16 pb-8 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - plans</p>
        <h1 className="relative mt-3 text-5xl sm:text-6xl font-black tracking-tight">Own your AI. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Own your data.</span></h1>
        <p className="mt-3 mx-auto max-w-2xl text-emerald-100/80">An open-source Sovereign for everyone, a full governed stack when you need it. Transparent, EU AI Act-ready, UK-resident, MIT-licensed.</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-[#05140d] p-1 text-sm">
          <button onClick={() => setAnnual(false)} className={(!annual ? "bg-emerald-500 text-[#03110b] " : "text-emerald-200 ") + "rounded-full px-4 py-1.5 font-bold"}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={(annual ? "bg-emerald-500 text-[#03110b] " : "text-emerald-200 ") + "rounded-full px-4 py-1.5 font-bold"}>Yearly -2mo</button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-5 lg:grid-cols-5 sm:grid-cols-2">
          {tiers.map((t) => (
            <div key={t.name} className={"flex flex-col rounded-2xl border p-5 " + (t.accent === "amber" ? "border-amber-400/50 bg-amber-500/[0.06] shadow-[0_0_40px_-14px_rgba(245,158,11,.5)]" : t.highlight ? "border-emerald-400/60 bg-emerald-500/5 shadow-[0_0_40px_-12px_rgba(16,185,129,.5)]" : "border-emerald-500/20 bg-[#05140d]")}>
              {t.tag && <span className={"self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " + (t.accent === "amber" ? "bg-amber-400/15 text-amber-200" : "bg-emerald-500/15 text-emerald-300")}>{t.tag}</span>}
              <div className="mt-2 text-lg font-bold">{t.name}</div>
              <div className="mt-1 text-3xl font-black text-emerald-100">{t.price}</div>
              <div className="text-xs text-emerald-300/75">{t.sub}</div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-emerald-100/80">
                {t.feats.map((f) => (<li key={f} className="flex gap-2"><span className="text-emerald-400">+</span>{f}</li>))}
              </ul>
              <a href={t.href} className={"mt-5 rounded-xl px-4 py-2 text-center text-sm font-bold " + (t.accent === "amber" ? "bg-amber-400 text-[#1a1206] hover:bg-amber-300" : t.highlight ? "bg-emerald-500 text-[#03110b] hover:bg-emerald-400" : "border border-emerald-400/40 text-emerald-100 hover:bg-white/5")}>{t.cta}</a>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-emerald-500/15 bg-black/20 p-5">
          <div className="text-lg font-bold text-emerald-100">Pay as you go - credits</div>
          <p className="mt-1 text-sm text-emerald-100/70">Top up anytime. Credits draw down at flat unit prices; your plan sets the size of the included pool. Free tier is capped with alerts so you never get a surprise bill.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {packs.map((p) => (<a key={p.n} href={"/signup?credits=" + p.n.toLowerCase()} className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15">{p.n} - {p.p}</a>))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {meters.map((m) => (<div key={m[0]} className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-[#05140d] px-3 py-2 text-sm"><span className="text-emerald-200/80">{m[0]}</span><span className="font-mono text-emerald-300">{m[1]}</span></div>))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-emerald-300/75">You own your data - export or delete anytime. EU AI Act Article 50 transparent. CSOAI Ltd, UK. MIT-licensed core.</p>
      </section>
    </div>
  );
}
