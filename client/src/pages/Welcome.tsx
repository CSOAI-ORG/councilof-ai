import { useEffect, useState } from "react";

// Welcome - the post-signup interstitial. Reads the plan the user picked on /pricing
// (persisted to localStorage by Signup) and acknowledges it before dropping them into
// the OS. Free-rail posture: the rail is free, verification is free forever — no charge, no checkout.

const PLAN: Record<string, { label: string; price: string; accent: "amber" | "emerald"; feats: string[] }> = {
  operator: { label: "Operator", price: "Free", accent: "amber", feats: ["ONE OS — live agent", "Signed attestation records, Ed25519-verifiable", "Watchdog operator console", "Regulatory drift alerts via corpus-watch", "Layer 0 signing + support"] },
  pro: { label: "Pro", price: "Free", accent: "emerald", feats: ["Premium hosted models", "Passport + EU AI Act audit", "Council of AI + governance", "Real-world Council Space", "Verification free forever"] },
  team: { label: "Team", price: "Free", accent: "emerald", feats: ["Everything in Pro, for the whole team", "SSO + SCIM", "Shared council + audit logs", "Admin and roles", "Community support"] },
  enterprise: { label: "Enterprise", price: "Free", accent: "emerald", feats: ["Full EU AI Act audit suite", "Dedicated Council of AI + defence", "Data residency + SLA", "Audit export (CSV/JSON/Parquet)", "Onboarding + success"] },
};

export default function Welcome() {
  const [plan, setPlan] = useState("");
  const [credits, setCredits] = useState("");
  useEffect(() => {
    document.title = "Welcome to your Council OS — CSOAI";
    try {
      const p = (localStorage.getItem("sov_intended_plan") || "").toLowerCase();
      const c = (localStorage.getItem("sov_intended_credits") || "").toLowerCase();
      if (p && PLAN[p]) setPlan(p);
      if (c) setCredits(c);
    } catch (e) {}
  }, []);

  function go(href: string) {
    // consume the intent so it doesn't re-fire on the next visit
    try { localStorage.removeItem("sov_intended_plan"); localStorage.removeItem("sov_intended_credits"); } catch (e) {}
    window.location.href = href;
  }

  const info = plan ? PLAN[plan] : null;
  const amber = info?.accent === "amber";

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-300">◉</div>
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS — you're in</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Welcome to your Council assistant.</h1>
          <p className="mt-3 text-emerald-100/75">Your account is live. Your data is yours to own and export, and every action is signed to Layer 0.</p>
        </div>

        {info ? (
          <div className={"mt-8 rounded-2xl border p-5 " + (amber ? "border-amber-400/50 bg-amber-500/[0.07]" : "border-emerald-400/40 bg-emerald-500/[0.06]")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[2px] text-emerald-300/60">You chose</div>
                <div className={"text-xl font-black " + (amber ? "text-amber-200" : "text-emerald-200")}>{info.label} <span className="text-sm font-semibold text-emerald-100/60">· {info.price}</span></div>
              </div>
              {amber && <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[1.5px] text-amber-200/90">Operator</span>}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-emerald-100/85">
              {info.feats.map((f) => (<li key={f} className="flex gap-2"><span className={amber ? "text-amber-400" : "text-emerald-400"}>+</span>{f}</li>))}
            </ul>
            <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/20 px-3 py-2 text-xs text-emerald-100/60">The rail is free. Verification is free forever — explore the full OS now.</div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => go("/dashboard?tab=home")} className={"flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold " + (amber ? "bg-amber-400 text-[#1a1206] hover:bg-amber-300" : "bg-emerald-500 text-[#03110b] hover:bg-emerald-400")}>Enter your OS →</button>
              <button onClick={() => go("/demo")} className="flex-1 rounded-xl border border-emerald-400/40 px-4 py-2.5 text-center text-sm font-bold text-emerald-100 hover:bg-white/5">▶ Take the guided tour</button>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            {credits && <div className="mb-3 rounded-lg border border-emerald-500/15 bg-black/20 px-3 py-2 text-xs text-emerald-100/60">Your <b className="text-emerald-300">{credits}</b> pack is noted.</div>}
            <div className="text-sm text-emerald-100/80">You're on the free, open-source base — your own Council assistant, the governance graph, the council and Layer 0 signing, forever. The rail is free; verification is free forever.</div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => go("/dashboard?tab=home")} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-bold text-[#03110b] hover:bg-emerald-400">Enter your OS →</button>
              <button onClick={() => go("/demo")} className="flex-1 rounded-xl border border-emerald-400/40 px-4 py-2.5 text-center text-sm font-bold text-emerald-100 hover:bg-white/5">▶ Take the guided tour</button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => go("/dashboard")} className="text-sm text-emerald-300/70 hover:text-emerald-200">Skip to dashboard</button>
        </div>
      </div>
    </div>
  );
}
