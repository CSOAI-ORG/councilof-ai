import { useEffect, useState } from "react";
import {
  STAFF_PALS,
  type StaffPalId,
  type WelcomeIdentityMemory,
  clearWelcomeIdentity,
  exportWelcomeIdentity,
  getActiveStaffPalId,
  getWelcomeIdentity,
  routeUtteranceToStaffPal,
  saveWelcomeIdentity,
  setActiveStaffPalId,
  staffPalSpeak,
  stopVoice,
} from "../lib/sovPersona";

// Welcome — the CSOAI × MEOK Professional Staff PALS Welcome Desk & post-signup interstitial.
// Implements the MEOK v1 5-step loop: Click -> Greet -> Identify -> Act -> Remember.
// Free-rail posture: the rail is free, verification is free forever — no charge, no checkout.

const PLAN: Record<string, { label: string; price: string; accent: "amber" | "emerald"; feats: string[] }> = {
  operator: { label: "Operator", price: "Free", accent: "amber", feats: ["ONE OS — live agent", "Signed attestation records, Ed25519-verifiable", "Watchdog operator console", "Regulatory drift alerts via corpus-watch", "Layer 0 signing + support"] },
  pro: { label: "Pro", price: "Free", accent: "emerald", feats: ["Premium hosted models", "Passport + EU AI Act audit", "Council of AI + governance", "Real-world Council Space", "Verification free forever"] },
  team: { label: "Team", price: "Free", accent: "emerald", feats: ["Everything in Pro, for the whole team", "SSO + SCIM", "Shared council + audit logs", "Admin and roles", "Community support"] },
  enterprise: { label: "Enterprise", price: "Free", accent: "emerald", feats: ["Full EU AI Act audit suite", "Dedicated Council of AI + defence", "Data residency + SLA", "Audit export (CSV/JSON/Parquet)", "Onboarding + success"] },
};

const PAL_ORDER: StaffPalId[] = [
  "pal.welcome_desk",
  "pal.measurement_lead",
  "pal.assurance_counsel",
  "pal.regulatory_steward",
  "pal.runtime_sentinel",
  "pal.commercial_concierge",
];

export default function Welcome() {
  const [plan, setPlan] = useState("");
  const [credits, setCredits] = useState("");
  const [activePalId, setActivePal] = useState<StaffPalId>("pal.welcome_desk");
  const [visitorName, setVisitorName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessFocus, setBusinessFocus] = useState("");
  const [savedIdentity, setSavedIdentity] = useState<WelcomeIdentityMemory | null>(null);
  const [spokenReply, setSpokenReply] = useState("");
  const [hudState, setHudState] = useState<"finished_speaking" | "outcome_established">("finished_speaking");
  const [showMemoryJson, setShowMemoryJson] = useState(false);

  useEffect(() => {
    document.title = "Welcome Desk — CSOAI × MEOK Professional Staff PALS";
    try {
      const p = (localStorage.getItem("sov_intended_plan") || "").toLowerCase();
      const c = (localStorage.getItem("sov_intended_credits") || "").toLowerCase();
      if (p && PLAN[p]) setPlan(p);
      if (c) setCredits(c);
    } catch (e) {}

    const initialPal = getActiveStaffPalId();
    setActivePal(initialPal);
    const existing = getWelcomeIdentity();
    if (existing) {
      setSavedIdentity(existing);
      setVisitorName(existing.visitorName);
      setBusinessName(existing.businessName);
      setBusinessFocus(existing.businessFocus);
      if (existing.activePalId in STAFF_PALS) {
        setActivePal(existing.activePalId);
      }
      setHudState("outcome_established");
    }
    return () => {
      stopVoice();
    };
  }, []);

  const currentPal = STAFF_PALS[activePalId] || STAFF_PALS["pal.welcome_desk"];

  function selectPal(id: StaffPalId, speak = true) {
    setActivePal(id);
    setActiveStaffPalId(id);
    const pal = STAFF_PALS[id];
    const line = savedIdentity
      ? `${pal.displayName} (${pal.title}): Welcome back, ${savedIdentity.visitorName} (${savedIdentity.businessName}). ${pal.greeting}`
      : `${pal.greeting} ${pal.identifyPrompt}`;
    setSpokenReply(line);
    setHudState(savedIdentity ? "outcome_established" : "finished_speaking");
    if (speak) {
      staffPalSpeak(line, id);
    }
  }

  function handleIdentifyAndRoute(e: React.FormEvent) {
    e.preventDefault();
    const routed = routeUtteranceToStaffPal(businessFocus);
    const targetPal = routed.pal;
    setActivePal(targetPal.palId);
    setActiveStaffPalId(targetPal.palId);

    if (routed.refused && routed.refusalMessage) {
      setSpokenReply(routed.refusalMessage);
      setHudState("finished_speaking");
      staffPalSpeak(routed.refusalMessage, targetPal.palId);
      return;
    }

    if (visitorName.trim() && businessName.trim()) {
      const saved = saveWelcomeIdentity({
        visitorName: visitorName.trim(),
        businessName: businessName.trim(),
        businessFocus: businessFocus.trim() || "General AI Governance & Measurement",
        activePalId: targetPal.palId,
      });
      setSavedIdentity(saved);
      const reply = `${targetPal.displayName} (${targetPal.title}): Thank you, ${saved.visitorName} from ${saved.businessName}. Your H.I.M. identity thread is saved across screens and routed via ${targetPal.primaryWedges.join(", ")}.`;
      setSpokenReply(reply);
      setHudState("outcome_established");
      staffPalSpeak(reply, targetPal.palId);
    } else {
      const promptLine = `${targetPal.greeting} ${targetPal.identifyPrompt}`;
      setSpokenReply(promptLine);
      setHudState("finished_speaking");
      staffPalSpeak(promptLine, targetPal.palId);
    }
  }

  function handleDownloadMemory() {
    const payload = exportWelcomeIdentity();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csoai-meok-him-memory.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDeleteMemory() {
    clearWelcomeIdentity();
    setSavedIdentity(null);
    setVisitorName("");
    setBusinessName("");
    setBusinessFocus("");
    setHudState("finished_speaking");
    setSpokenReply(
      "Your local H.I.M. identity memory has been deleted and tombstoned. You remain in full control of your memory.",
    );
  }

  function go(href: string) {
    try {
      localStorage.removeItem("sov_intended_plan");
      localStorage.removeItem("sov_intended_credits");
    } catch (e) {}
    window.location.href = href;
  }

  const info = plan ? PLAN[plan] : null;
  const amber = info?.accent === "amber";

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-300">
            {currentPal.glyph}
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            MEOK IS THE FACE · CSOAI IS THE MIND
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            CSOAI Professional Staff PALS
          </h1>
          <p className="mt-2 text-sm text-emerald-100/75 max-w-xl mx-auto">
            Click, greet, identify once, act, and remember across every screen. Avatar speech alone is{" "}
            <code className="text-emerald-300">finished_speaking</code>; only a verified CSOAI receipt establishes{" "}
            <code className="text-emerald-300">outcome_established</code>.
          </p>
        </div>

        {/* 6 Professional Staff PALS selector */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PAL_ORDER.map((id) => {
            const p = STAFF_PALS[id];
            const selected = id === activePalId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectPal(id, true)}
                className={
                  "text-left rounded-xl border p-3 transition " +
                  (selected
                    ? "border-emerald-400 bg-emerald-500/15 shadow-sm"
                    : "border-emerald-500/20 bg-[#05140d] hover:border-emerald-400/40")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-300">{p.glyph} {p.kokoroVoiceId}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60">
                    {p.primaryWedges[0]}
                  </span>
                </div>
                <div className="mt-1 font-bold text-sm text-emerald-100">{p.displayName}</div>
                <div className="text-[11px] text-emerald-200/70 leading-snug">{p.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Staff PAL Welcome Desk Card (Click -> Greet -> Identify -> Act -> Remember) */}
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-[#05140d] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-300/70">
                {currentPal.department}
              </div>
              <div className="text-lg font-black text-emerald-100">
                {currentPal.displayName} <span className="text-sm font-normal text-emerald-300/80">· {currentPal.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-200">
                HUD: {hudState}
              </span>
              <button
                type="button"
                onClick={() => staffPalSpeak(spokenReply || `${currentPal.greeting} ${currentPal.identifyPrompt}`, currentPal.palId)}
                className="rounded-lg border border-emerald-400/40 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
              >
                🔊 Speak
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-emerald-100/90 leading-relaxed">
            {spokenReply || `${currentPal.greeting} ${currentPal.identifyPrompt}`}
          </p>

          <form onSubmit={handleIdentifyAndRoute} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Your name (asked once)"
              className="rounded-xl border border-emerald-500/25 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
            />
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business / organisation"
              className="rounded-xl border border-emerald-500/25 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
            />
            <input
              type="text"
              value={businessFocus}
              onChange={(e) => setBusinessFocus(e.target.value)}
              placeholder="Task (e.g. EU AI Act Art. 50, JSP 936, GSPC)"
              className="rounded-xl border border-emerald-500/25 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-200/40 focus:border-emerald-400 focus:outline-none"
            />
            <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-[#03110b] hover:bg-emerald-400"
              >
                Identify & Route to Staff PAL →
              </button>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowMemoryJson(!showMemoryJson)}
                  className="rounded-lg border border-emerald-500/25 px-2.5 py-1 text-emerald-200/80 hover:bg-white/5"
                >
                  {showMemoryJson ? "Hide Memory" : "View Memory"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMemory}
                  className="rounded-lg border border-emerald-500/25 px-2.5 py-1 text-emerald-200/80 hover:bg-white/5"
                >
                  Export Memory
                </button>
                {savedIdentity && (
                  <button
                    type="button"
                    onClick={handleDeleteMemory}
                    className="rounded-lg border border-red-400/30 px-2.5 py-1 text-red-200/90 hover:bg-red-500/10"
                  >
                    Delete Memory
                  </button>
                )}
              </div>
            </div>
          </form>

          {showMemoryJson && (
            <pre className="mt-3 overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/40 p-3 font-mono text-[11px] text-emerald-200/90">
              {exportWelcomeIdentity()}
            </pre>
          )}
        </div>

        {info ? (
          <div className={"mt-6 rounded-2xl border p-5 " + (amber ? "border-amber-400/50 bg-amber-500/[0.07]" : "border-emerald-400/40 bg-emerald-500/[0.06]")}>
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
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            {credits && <div className="mb-3 rounded-lg border border-emerald-500/15 bg-black/20 px-3 py-2 text-xs text-emerald-100/60">Your <b className="text-emerald-300">{credits}</b> pack is noted.</div>}
            <div className="text-sm text-emerald-100/80">You're on the free, open-source base — your own Council assistant, the governance graph, the council and Layer 0 signing, forever. The rail is free; verification is free forever.</div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => go("/dashboard?tab=home")} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-bold text-[#03110b] hover:bg-emerald-400">Enter your OS →</button>
              <button onClick={() => go("/demo")} className="flex-1 rounded-xl border border-emerald-400/40 px-4 py-2.5 text-center text-sm font-bold text-emerald-100 hover:bg-white/5">▶ Take the guided tour</button>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <button onClick={() => go("/dashboard")} className="text-sm text-emerald-300/70 hover:text-emerald-200">Skip to dashboard</button>
        </div>
      </div>
    </div>
  );
}

