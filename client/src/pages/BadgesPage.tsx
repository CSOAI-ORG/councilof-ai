import { useState } from "react";

// Sovereign Authority Badges - the open, embeddable brand layer. Any website or
// front end drops in a badge (free, MIT, copy-paste); each one links back to a
// live verify on the Council OS. Being governed becomes a visible asset, and
// every badge is free distribution. This is step one of the Sov Space open
// commons: open tools + A2A + Sovereign orchestration, easy for anyone.

type Badge = { id: string; label: string; dot: string };
const VERIFY = "https://os.csoai.org/verify";
const BADGES: Badge[] = [
  { id: "council-verified", label: "Council-Verified \u00B7 CSOAI", dot: "#10b981" },
  { id: "layer0-signed", label: "Layer 0 Signed \u00B7 Ed25519", dot: "#34d399" },
  { id: "eu-ai-act-ready", label: "EU AI Act Measured", dot: "#059669" },
  { id: "council-governed", label: "Governed by the 33-Agent Council", dot: "#10b981" },
  { id: "meok-open", label: "MEOK Open \u00B7 MIT", dot: "#6ee7b7" },
];

function badgeSvg(b: Badge): string {
  var w = Math.round(40 + b.label.length * 6.6);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="30" role="img" aria-label="' + b.label + '">',
    '<rect x="0.5" y="0.5" width="' + (w - 1) + '" height="29" rx="14.5" fill="#05140d" stroke="#10b981" stroke-opacity="0.45"/>',
    '<circle cx="16" cy="15" r="5" fill="' + b.dot + '"/>',
    '<text x="29" y="19" fill="#a7f3d0" font-family="ui-sans-serif,system-ui,Arial" font-size="12" font-weight="700">' + b.label + '</text>',
    '</svg>'
  ].join("");
}
function snippet(b: Badge): string {
  return '<a href="' + VERIFY + "?b=" + b.id + '" target="_blank" rel="noopener">' + badgeSvg(b) + '</a>';
}

export default function BadgesPage() {
  const [copied, setCopied] = useState("");
  function copy(b: Badge) {
    try { navigator.clipboard.writeText(snippet(b)); setCopied(b.id); setTimeout(() => setCopied(""), 1500); } catch (e) {}
  }
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-5xl px-6 pt-16 pb-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - open commons</p>
        <h1 className="relative mt-2 text-4xl sm:text-5xl font-black tracking-tight">Wear your <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">governance.</span></h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">Council authority badges for any website or front end. Free, MIT, copy-paste. Each badge links back to a live verify on the Council OS - so being governed becomes a visible brand asset, and every embed spreads the network. Open by construction.</p>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-10 space-y-4">
        {BADGES.map((b) => (
          <div key={b.id} className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span dangerouslySetInnerHTML={{ __html: badgeSvg(b) }} />
              <code className="hidden truncate rounded bg-black/40 px-2 py-1 text-[11px] text-emerald-300/70 sm:block" style={{ maxWidth: 360 }}>{snippet(b)}</code>
            </div>
            <button onClick={() => copy(b)} className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">{copied === b.id ? "Copied" : "Copy embed"}</button>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          <b className="text-emerald-200">This is the open commons.</b> Badges are step one. Next, Council Space opens the full toolset - the MEOK open MCPs, forks, APIs and A2A protocols - as runnable cards anyone can use, with the Council assistant orchestrating and Layer 0 signing every run. Open source, made easy. MIT-licensed. Built in the open on GitHub.
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/gspc-arena" className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-[#03110b] hover:bg-emerald-400">Enter Council Space -&gt;</a>
            <a href="/try" className="rounded-xl border border-emerald-400/40 px-4 py-2 font-semibold text-emerald-100 hover:bg-white/5">Ask the Council -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
