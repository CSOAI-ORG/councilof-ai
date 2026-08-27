import { useEffect, useState } from "react";

// SocialConnect - end-user flow: connect social platforms, give your AI character an
// avatar + name + voice. Works as a live configurator now; real OAuth posting switches
// on with the Layer 0 backend. One shared component across CSOAI and MEOK OS.

const PLATFORMS = ["X / Twitter", "LinkedIn", "Instagram", "TikTok", "YouTube", "Facebook", "Threads", "Reddit", "Bluesky", "Mastodon", "Discord", "Telegram"];
const AVATARS = [
  { id: "a1", c: "#059669" }, { id: "a2", c: "#2563eb" }, { id: "a3", c: "#dc2626" },
  { id: "a4", c: "#7c3aed" }, { id: "a5", c: "#ea580c" }, { id: "a6", c: "#0d9488" },
];
const VOICES = ["Professional", "Friendly", "Visionary", "Concise", "Playful"];

export default function SocialConnect() {
  useEffect(() => { document.title = "Connect your socials + give your AI a face | CSOAI"; }, []);
  const [conn, setConn] = useState<Record<string, boolean>>({});
  const [av, setAv] = useState("a1");
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("Professional");
  const count = Object.values(conn).filter(Boolean).length;
  const avatar = AVATARS.find((a) => a.id === av) || AVATARS[0];
  const initial = (name.trim()[0] || "S").toUpperCase();
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI + MEOK - social OS</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Give your AI character a face and a voice</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Connect your platforms, pick an avatar, name your character. It governs and posts as you - across 12 networks. Set it up here now; live posting switches on with the Layer 0 backend.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900">1. Connect your platforms</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => {
              const on = !!conn[p];
              return (
                <button key={p} onClick={() => setConn((c) => ({ ...c, [p]: !c[p] }))} className={"flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors " + (on ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                  <span>{p}</span><span className={on ? "text-emerald-600 font-black" : "text-gray-300"}>{on ? "Connected" : "Connect"}</span>
                </button>
              );
            })}
          </div>
          <h2 className="mt-10 text-xl font-bold text-gray-900">2. Pick an avatar</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {AVATARS.map((a) => (
              <button key={a.id} onClick={() => setAv(a.id)} className={"h-14 w-14 rounded-2xl border-2 " + (av === a.id ? "border-emerald-500 ring-2 ring-emerald-200" : "border-gray-200")} style={{ background: a.c }} />
            ))}
            <div className="flex h-14 items-center rounded-2xl border-2 border-dashed border-gray-300 px-4 text-xs text-gray-400">Upload your photo (with Layer 0)</div>
          </div>
          <h2 className="mt-10 text-xl font-bold text-gray-900">3. Name + voice</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" className="rounded-xl border border-gray-200 px-4 py-2 text-sm" />
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              {VOICES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Your AI character</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white" style={{ background: avatar.c }}>{initial}</div>
            <div>
              <div className="font-black text-gray-900">{name.trim() || "Unnamed"}</div>
              <div className="text-xs text-gray-500">{voice} voice</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{count} of 12 platforms connected</div>
          <p className="mt-3 text-xs text-gray-400">Every post your character makes is governed by your council setup and signed with your Council assistant passport. Configure once - it carries across CSOAI and MEOK OS.</p>
          <a href="/me" className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Save to your Council assistant -&gt;</a>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <a href="/bft" className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold text-emerald-700">Set council -&gt;</a>
            <a href="/social" className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold text-emerald-700">Social OS -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
