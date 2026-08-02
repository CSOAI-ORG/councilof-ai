import { useState } from "react";
import HeroSlides from "../components/HeroSlides";

type Tier = { name: string; price: string; sub: string; tag?: string; cta: string; href: string; feats: string[]; highlight?: boolean; accent?: "amber" };

export default function PlansPage() {
  const [annual, setAnnual] = useState(true);
  // P2-10: UK Ltd bills in GBP — GBP is the canonical price; USD is a reference
  // display at the fixed policy rate (reviewed quarterly).
  const [cur, setCur] = useState<"GBP" | "USD">("GBP");
  const sym = cur === "GBP" ? "£" : "$";
  const base = { pro: { GBP: 79, USD: 99 }, operator: { GBP: 239, USD: 299 }, team: { GBP: 119, USD: 149 } } as const;
  const money = (n: number) => sym + (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2));
  // Yearly = 10 × monthly ("-2mo"). Monthly-equivalent shown = total/12. Arithmetic is visible.
  const monthlyEquiv = (k: keyof typeof base) => (base[k][cur] * 10) / 12;
  const yearlyTotal = (k: keyof typeof base) => base[k][cur] * 10;
  const pro = annual ? money(Math.round(monthlyEquiv("pro") * 100) / 100) : money(base.pro[cur]);
  const proSub = annual ? `per month, billed yearly (${money(yearlyTotal("pro"))} = 10 × ${money(base.pro[cur])})` : "per month";
  const operator = annual ? money(Math.round(monthlyEquiv("operator") * 100) / 100) : money(base.operator[cur]);
  const operatorSub = annual ? `per month, billed yearly (${money(yearlyTotal("operator"))} = 10 × ${money(base.operator[cur])})` : "per month";
  const team = annual ? money(Math.round(monthlyEquiv("team") * 100) / 100) : money(base.team[cur]);
  const teamSub = annual ? "per seat / mo, billed yearly (10 × monthly)" : "per seat / mo";
  const tiers: Tier[] = [
    { name: "Sovereign", price: "Free", sub: "open-source, forever", tag: "Own your data", cta: "Start free", href: "/signup?plan=free", feats: ["Your Sovereign on a free open-source model", "Self-host or hosted", "You own and export your data (JSON)", "Layer 0 signing", "Community council demos"] },
    { name: "Pro", price: pro, sub: proSub, tag: "Most popular", cta: "Go Pro", href: "/signup?plan=pro", highlight: true, feats: ["Everything in Free", "Premium hosted models", "Passport + EU AI Act audit (quota)", "Council of AI + governance", "Real-world Sov Space + UE5 preview", "PAYG credits included"] },
    { name: "Operator", price: operator, sub: operatorSub, tag: "Full command deck", accent: "amber", cta: "Become an Operator", href: "/signup?plan=operator", feats: ["Everything in Pro", "ONE OS - live agent + humanoid tracking", "Governed-stop pathway for rogue swarms (PoC status, signed demo)", "Threat map + operator console", "Global Watchdog operator console", "Priority Layer 0 signing + support"] },
    { name: "Team", price: team, sub: teamSub, tag: "3-seat min", cta: "Start a team", href: "/signup?plan=team", feats: ["Everything in Pro, per seat", "SSO + SCIM", "Shared council + audit logs", "Admin and roles", "Priority support"] },
    { name: "Enterprise", price: "Custom", sub: "from ~£24k / yr", tag: "Governance-grade", cta: "Talk to us", href: "/contact", feats: ["Full EU AI Act audit suite", "Dedicated council + audit suite", "Data residency + SLA", "SAML, audit export (CSV/JSON/Parquet)", "Onboarding + success"] },
  ];
  const packs = [{ n: "Starter", GBP: 20, USD: 25 }, { n: "Builder", GBP: 80, USD: 100 }, { n: "Scale", GBP: 400, USD: 500 }];
  const meters: [string, { GBP: string; USD: string }][] = [["Passport", { GBP: "£0.08", USD: "$0.10" }], ["EU AI Act audit", { GBP: "£0.20", USD: "$0.25" }], ["Council review", { GBP: "£0.08", USD: "$0.10" }], ["Governance", { GBP: "£0.40", USD: "$0.50" }], ["Sigil", { GBP: "£0.01", USD: "$0.01" }], ["Watchdog scan", { GBP: "£0.80", USD: "$1.00" }]];
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
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-[#05140d] p-1 text-sm" title="UK Ltd bills in GBP; USD shown for reference at the £1 = $1.25 policy rate">
          <button onClick={() => setCur("GBP")} className={(cur === "GBP" ? "bg-emerald-500 text-[#03110b] " : "text-emerald-200 ") + "rounded-full px-3 py-1 font-bold"}>£ GBP</button>
          <button onClick={() => setCur("USD")} className={(cur === "USD" ? "bg-emerald-500 text-[#03110b] " : "text-emerald-200 ") + "rounded-full px-3 py-1 font-bold"}>$ USD</button>
        </div>
      </section>

      <HeroSlides />
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
            {packs.map((p) => (<a key={p.n} href={"/signup?credits=" + p.n.toLowerCase()} className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15">{p.n} - {money(p[cur])}</a>))}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {meters.map((m) => (<div key={m[0]} className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-[#05140d] px-3 py-2 text-sm"><span className="text-emerald-200/80">{m[0]}</span><span className="font-mono text-emerald-300">{m[1][cur]}</span></div>))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-emerald-300/75">Billed in GBP · USD for reference at the £1 = $1.25 policy rate (reviewed quarterly). You own your data - export or delete anytime. EU AI Act Article 50 transparent. CSOAI Ltd, UK (Companies House 16939677). MIT-licensed core.</p>
      </section>
    </div>
  );
}
