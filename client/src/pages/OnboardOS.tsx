import { useEffect, useState } from "react";

type Profile = "work" | "personal" | "smb";
const OAUTH: Record<Profile, { name: string; why: string }[]> = {
  work: [{ name: "Microsoft 365", why: "mail, calendar, files, Teams" }, { name: "Slack", why: "team comms + summaries" }],
  personal: [{ name: "Google", why: "Gmail + Calendar" }, { name: "Apple", why: "one-tap secure sign-in" }],
  smb: [{ name: "Google Workspace", why: "the business backbone" }, { name: "Slack", why: "team + customer comms" }],
};
const TOUR: { pane: string; text: string }[] = [
  { pane: "social", text: "Left: your social world. Every channel in one rail, kept calm and governed." },
  { pane: "browser", text: "Centre: a full web browser. Work where you already work; I ride along, never in the way." },
  { pane: "sovereign", text: "Right: me, your Sovereign. Speak or type and I act - and I always tell you it is me. No hidden AI." },
];
const CONSENTS = ["Calendar", "Photos", "Contacts", "Camera"];

export default function OnboardOS() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tour, setTour] = useState(0);
  const [voice, setVoice] = useState(true);
  const [pref, setPref] = useState<string>("");
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const tourDone = tour >= TOUR.length;

  function speak(t: string) { if (!voice) return; try { const u = new SpeechSynthesisUtterance(t); u.rate = 1.04; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }
  useEffect(() => { document.title = "Welcome to your OS | CSOAI"; }, []);
  useEffect(() => { if (profile && !tourDone) speak(TOUR[tour].text); }, [profile, tour]);

  if (!profile) {
    const cards: { id: Profile; t: string; d: string }[] = [
      { id: "work", t: "Work", d: "Governance, compliance, your work stack." },
      { id: "personal", t: "Personal", d: "Your own AI, your data, your life - free." },
      { id: "smb", t: "Small business", d: "Run the business with one Sovereign." },
    ];
    return (
      <div className="min-h-screen bg-[#03110b] text-emerald-50 flex flex-col items-center justify-center px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - welcome</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-center">This becomes your OS.</h1>
        <p className="mt-3 max-w-xl text-center text-emerald-100/80">One thing first - who is this for? I will set up your Sovereign and suggest the right logins. Nothing is connected until you say so.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 w-full max-w-4xl">
          {cards.map((c) => (
            <button key={c.id} onClick={() => { setProfile(c.id); setTour(0); }} className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-6 text-left hover:border-emerald-400/60 hover:bg-emerald-500/5">
              <div className="text-xl font-bold">{c.t}</div>
              <p className="mt-1 text-sm text-emerald-100/70">{c.d}</p>
              <span className="mt-3 inline-block text-sm font-bold text-emerald-300">Start -&gt;</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const panes: { id: string; label: string; body: string }[] = [
    { id: "social", label: "Social", body: "Your channels, unified." },
    { id: "browser", label: "Web", body: "Full browser, where you work." },
    { id: "sovereign", label: "Sovereign", body: "Speak or type. I act." },
  ];
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="flex items-center justify-between border-b border-emerald-500/15 px-5 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Your OS - {profile}</div>
        <a href="/" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Exit tour X</a>
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_1.6fr_1.2fr]">
        {panes.map((p) => {
          const active = !tourDone && TOUR[tour].pane === p.id;
          return (
            <div key={p.id} className={"min-h-[300px] rounded-2xl border bg-[#05140d] p-5 transition " + (active ? "border-emerald-400/70 shadow-[0_0_50px_-10px_rgba(16,185,129,.6)]" : tourDone ? "border-emerald-500/20" : "border-emerald-500/10 opacity-50")}>
              <div className="text-sm font-bold text-emerald-200">{p.label}</div>
              <p className="mt-1 text-xs text-emerald-300/60">{p.body}</p>
            </div>
          );
        })}
      </div>
      {!tourDone && (
        <div className="mx-auto max-w-3xl px-5 pb-8">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400">{String.fromCharCode(9673)}</span>
              <p className="flex-1 text-sm text-emerald-50/90">{TOUR[tour].text}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => setTour(tour + 1)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">{tour < TOUR.length - 1 ? "Next" : "Finish tour"}</button>
              <button onClick={() => setVoice(!voice)} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm text-emerald-100 hover:bg-white/5">{voice ? "Voice on" : "Voice off"}</button>
              <button onClick={() => setTour(TOUR.length)} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm text-emerald-100 hover:bg-white/5">Skip</button>
            </div>
          </div>
        </div>
      )}
      {tourDone && (
        <div className="mx-auto max-w-3xl px-5 pb-16 space-y-5">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="text-lg font-bold">Do you prefer to speak, or type?</div>
            <div className="mt-3 flex gap-2">
              {["speak", "type"].map((o) => (<button key={o} onClick={() => setPref(o)} className={(pref === o ? "bg-emerald-500 text-[#03110b] " : "border border-emerald-400/40 text-emerald-100 ") + "rounded-xl px-4 py-2 text-sm font-bold capitalize"}>{o}</button>))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="text-lg font-bold">Can I learn about you?</div>
            <p className="mt-1 text-sm text-emerald-100/70">Each is off until you turn it on. Processed on-device where possible. You own and can export or delete it anytime. (EU AI Act transparent - you are talking to AI.)</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CONSENTS.map((c) => (
                <button key={c} onClick={() => setConsents({ ...consents, [c]: !consents[c] })} className={"flex items-center justify-between rounded-xl border px-3 py-2 text-sm " + (consents[c] ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100" : "border-emerald-500/20 text-emerald-200/70")}>
                  <span>{c}</span><span className="font-mono text-xs">{consents[c] ? "ON" : "off"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="text-lg font-bold">Connect to make me useful in seconds</div>
            <p className="mt-1 text-sm text-emerald-100/70">Top picks for {profile}. Connect one and I learn fast - nothing shared without you.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {OAUTH[profile].map((o) => (
                <div key={o.name} className="flex items-center justify-between rounded-xl border border-emerald-500/20 px-3 py-2">
                  <div><div className="text-sm font-bold text-emerald-100">{o.name}</div><div className="text-xs text-emerald-300/60">{o.why}</div></div>
                  <a href={"/signup?connect=" + encodeURIComponent(o.name)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Connect</a>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center"><a href="/sov-space" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Enter your OS -&gt;</a></div>
        </div>
      )}
    </div>
  );
}
