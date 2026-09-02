import { useEffect, useRef } from "react";
import { ECOSYSTEM, PLAY_META, type Account } from "../data/ecosystem";
import { scoreAccount } from "../lib/hiveScore";
import { flyAndConvene } from "../lib/globeDrive";
import CouncilNav from "../components/CouncilNav";

// /brief?id=<accountId> — a per-account tailored one-pager: region-flown globe, the
// frameworks that govern them, the CSOAI play + the exact USPs to lead with, and
// deep-linked demos (crosswalk / classifier / MCP). Org-level public data only.
function globeRegionFor(a: Account): string {
  const known = ["JP", "KR", "CN", "SG", "IN", "CA", "UK", "US", "EU"];
  for (const j of (a.jurisdictions || []).map((x) => x.toUpperCase())) if (known.includes(j)) return j;
  return a.region === "APAC" ? "GLOBAL" : a.region;
}
const PITCH: Record<string, string> = {
  align: "CSOAI implements your regime — you set the rules, we make them provable.",
  absorb: "No AI-governance tooling yet? CSOAI is your platform from zero — OS, tools, signed attestations.",
  integrate: "You have a stack — CSOAI is the signed governance layer under it (the MCP, Layer 0, the crosswalk). We prove, we don't replace.",
  displace: "Side-by-side against your current tool on the axis it's weak: agentic-native, verifiable Ed25519 proof, one-command integration.",
};

export default function AccountBrief() {
  const id = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
  const a = ECOSYSTEM.find((x) => x.id === id);
  const globeRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => { document.title = a ? `${a.name} — CSOAI tailored brief` : "Account brief — CSOAI"; }, [a]);
  // The Sovereign flies the globe to THIS account's exact HQ and pulses it — the brief
  // opens on their own city, not just their region. Precise, tailored, "as we speak".
  useEffect(() => {
    if (!a) return;
    const t = setTimeout(() => flyAndConvene(globeRef.current?.contentWindow, a.hq[0], a.hq[1], { height: 1200000, duration: 3.4, spiral: false }), 1500);
    return () => clearTimeout(t);
  }, [a]);
  if (!a) return (
    <div className="min-h-screen bg-[#03110b] p-12 text-emerald-50">Account not found. <a href="/intel" className="text-emerald-300 underline">Back to the Hive →</a></div>
  );
  const s = scoreAccount(a);
  const gr = globeRegionFor(a);
  const fw = encodeURIComponent(a.frameworks.join(","));
  const clsQ = encodeURIComponent(`A production AI system at ${a.name} (${a.type}${a.sector ? ", " + a.sector : ""}) operating under ${a.jurisdictions.join("/") || "multiple regimes"}`);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <CouncilNav />
        <a href="/intel" className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/75 hover:text-emerald-200">← Distribution Hive</a>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-tight">{a.name}</h1>
          <span className={"rounded-full border px-3 py-1 text-xs font-bold " + PLAY_META[a.play].tone}>{PLAY_META[a.play].label}</span>
          {s.confidence !== "authority" && <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[11px] text-emerald-300/70">gap {s.totalGap}/21 · {s.confidence}</span>}
        </div>
        <p className="mt-1 text-sm text-emerald-300/75">{a.type} · {a.country} · jurisdictions: {a.jurisdictions.join(", ") || "—"} {a.sector ? "· " + a.sector : ""} · source: {a.source}</p>

        <p className="mt-5 max-w-3xl text-lg text-emerald-100/85">{PITCH[a.play]}</p>

        {/* region-flown globe */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/20" style={{ height: 380 }}>
          <iframe ref={globeRef} src={`/globe3d.html?region=${gr}`} title="globe" className="h-full w-full" style={{ border: 0 }} />
        </div>
        <p className="mt-1.5 text-[11px] text-emerald-300/75">Globe flown to {a.name}'s HQ ({a.country}). Toggle “Hive coverage” to see the play + gap; “fly to worst gap” / “next opportunity” to tour the market.</p>
        <button onClick={() => flyAndConvene(globeRef.current?.contentWindow, a.hq[0], a.hq[1], { spiral: true, height: 1200000, duration: 3.0 })} className="mt-2 rounded-lg border border-emerald-400/40 px-3 py-1.5 text-[12px] font-bold text-emerald-100 hover:bg-white/5">▶ Convene the 33-seat council over {a.country}</button>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* what governs them */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/75">What governs {a.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{a.frameworks.map((f) => <span key={f} className="rounded bg-black/40 px-2.5 py-1 font-mono text-[11px] text-emerald-300/80">{f}</span>)}</div>
            <a href={`/crosswalk?fw=${fw}`} className="mt-4 inline-block rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Crosswalk their {a.frameworks.length} frameworks → one control set</a>
          </div>
          {/* where CSOAI closes the gap */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/75">{s.confidence === "authority" ? "Alignment" : "Where CSOAI closes the gap"}</p>
            {s.confidence === "authority" ? (
              <p className="mt-2 text-sm text-emerald-100/80">Rule-setting authority — CSOAI implements this regime across the crosswalk and proves it with signed attestations.</p>
            ) : (<>
              <div className="mt-2 space-y-1">
                {s.perAxis.filter((x) => x.gap > 0).sort((x, y) => y.gap - x.gap).slice(0, 4).map((x) => (
                  <div key={x.key} className="flex items-center justify-between rounded bg-black/30 px-2.5 py-1 text-[12px]">
                    <span className="text-emerald-100/80">{x.label}</span>
                    <span className="font-mono text-[11px] text-emerald-300/70">CSOAI {x.csoai} vs {x.current} <span className="text-emerald-300">+{x.gap}</span></span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-emerald-300/75">Lead the demo with: <b className="text-emerald-200">{s.topUsps.join(", ")}</b>.</p>
            </>)}
          </div>
        </div>

        {/* tailored demo CTAs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={`/classifier?q=${clsQ}`} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-white/5">Classify their AI live →</a>
          <a href="/try" className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-white/5">Convene the council →</a>
          <a href="/tool-commons" className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-white/5">Install the governance MCP →</a>
          <a href="/assess" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#03110b] hover:bg-emerald-400">Free assessment for {a.name} →</a>
        </div>

        <p className="mt-8 text-[11px] text-emerald-300/75">Org-level public data. {s.confidence === "modeled" ? "Vendor/posture modeled — confirm by recon before outreach. " : ""}Play is a {s.confidence === "modeled" ? "pre-recon hypothesis" : "scored position"}. Source: {a.source}.</p>
      </div>
    </div>
  );
}
