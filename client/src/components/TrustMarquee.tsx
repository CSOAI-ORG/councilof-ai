import { useEffect, useState } from "react";
import { TRUST, KIND_META, type TrustItem } from "../data/trustWall";
import { CANON } from "../data/canonCounters";

const BRAIN = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || "/api";
function fmt(n: number) { return n >= 1e6 ? Math.round(n / 1e6) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n); }

// Live credibility chips — real numbers pulled from the Council engine, with an
// honest, established-fact fallback (from canon) if the endpoint is unreachable. No fabrication.
function LiveStats({ dark }: { dark?: boolean }) {
  // `kind` is carried alongside the number because /api/tools ALREADY tells us what its total
  // means (`total_kind: "catalogue-snapshot"`) and this component used to discard that field.
  // The endpoint was honest; the UI laundered it into "live … (deployed)". Keep the kind and
  // let it choose the wording — a number without its provenance is how a catalogue becomes a
  // claim about running infrastructure.
  const [s, setS] = useState<{ tools?: number; kind?: string; episodes?: number; agents?: number }>({});
  useEffect(() => {
    let live = true;
    const grab = async (p: string) => { try { const r = await fetch(BRAIN + p, { cache: "no-store" }); return await r.json(); } catch { return null; } };
    (async () => {
      const [t, st] = await Promise.all([grab("/tools"), grab("/health")]);
      if (!live) return;
      const tools = t && (t.total || t.count || (Array.isArray(t) ? t.length : 0));
      const episodes = st && (st.cum_episodes || st.episodes || st.memory_episodes);
      const agents = st && (st.agents || st.agent_count);
      // No `tools > 50` gate. That threshold silently discarded any honest small number and
      // kept only figures big enough to look impressive — so a truthful "6 reachable" was
      // dropped in favour of a 291-row catalogue. A number is used because it is true, not
      // because it is large.
      setS({
        tools: typeof tools === "number" && tools > 0 ? tools : undefined,
        kind: (t && t.total_kind) || undefined,
        episodes: episodes || undefined,
        agents: agents || undefined,
      });
    })();
    return () => { live = false; };
  }, []);
  // Canon-first: if live data disagrees, the canon wins; if live > canon, use live with caveat.
  const canonRegistry = CANON.mcpRegistryEntries.value;
  const canonCouncil = CANON.councilAgents.value;
  const councilDisplay = s.agents && s.agents > 0 ? s.agents : canonCouncil;

  // The label follows the provenance of the number actually shown. A catalogue snapshot says
  // "catalogued"; only a genuine probe result may say "reachable". Neither may say "deployed",
  // which asserts running infrastructure that no endpoint here has ever checked.
  const isCatalogue = !s.tools || s.kind === "catalogue-snapshot";
  const toolsDisplay = s.tools ?? canonRegistry;
  const toolsLabel = isCatalogue
    ? "MCP servers catalogued (registry rows, not probed)"
    : "MCP tools reachable (probed)";

  const chips = [
    { v: `${councilDisplay}`, l: `seat council (design — ${councilDisplay === canonCouncil ? "canon" : "live"})` },
    { v: `${toolsDisplay}`, l: toolsLabel },
    { v: s.episodes ? fmt(s.episodes) + "+" : "Ed25519", l: s.episodes ? "memory episodes" : "Layer 0 signing" },
    { v: "0.95", l: "care-floor" },
  ];
  return (
    <div className="mx-auto mb-3 flex max-w-6xl flex-wrap items-center gap-2 px-4">
      {chips.map((c, i) => (
        <span key={i} className={"inline-flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] " + (dark ? "border-emerald-400/20 bg-white/[0.03] text-emerald-100/80" : "border-gray-200 bg-white text-gray-600")}>
          <b className={dark ? "text-emerald-300" : "text-emerald-700"}>{c.v}</b> {c.l}
        </span>
      ))}
      {/* This read "live from the Council engine" over all four chips, of which at most one is
          ever a live reading — the care-floor is a constant, the council seat count is a design
          figure, and the tool count is usually a catalogue snapshot. One true caption cannot
          cover four differently-sourced numbers, so each chip now carries its own provenance
          and the caption only claims what it can. */}
      <span className={"text-[10px] " + (dark ? "text-emerald-200/40" : "text-gray-400")}>
        each figure labelled with its source
      </span>
    </div>
  );
}

// A horizontally-scrolling "trust wall" of frameworks we align to, open source we
// are built on, and standards we implement. Each chip links to its official source
// (that's what makes it real social authority — every claim is verifiable).
// variant="strip": slim single-line marquee for the OS bottom bar.
// variant="full":  headed section for pages, with a legend.

function Chip({ t, dark }: { t: TrustItem; dark?: boolean }) {
  const meta = KIND_META[t.kind];
  return (
    <a
      href={t.url}
      target="_blank"
      rel="noreferrer"
      title={`${t.full} — ${meta.note}`}
      className={
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold no-underline transition " +
        (dark
          ? "border-white/12 bg-white/[0.04] text-emerald-50/90 hover:border-white/30 hover:bg-white/10"
          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50")
      }
    >
      {t.icon ? (
        <img
          src={`https://cdn.simpleicons.org/${t.icon}/${dark ? "d7f5ff" : "475569"}`}
          alt=""
          width={13}
          height={13}
          loading="lazy"
          onError={(e) => { const el = e.currentTarget; el.style.display = "none"; const sib = el.nextElementSibling as HTMLElement | null; if (sib) sib.style.display = "inline"; }}
        />
      ) : null}
      <span aria-hidden style={{ fontSize: 13, display: t.icon ? "none" : "inline" }}>{t.emblem}</span>
      <span>{t.label}</span>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 9, background: meta.tint }} />
    </a>
  );
}

export default function TrustMarquee({
  variant = "full",
  dark = false,
  speed = 60,
  stats = true,
}: {
  variant?: "strip" | "full";
  dark?: boolean;
  speed?: number; // seconds per loop
  stats?: boolean; // show live credibility chips (full variant only)
}) {
  const row = [...TRUST, ...TRUST]; // duplicate for a seamless loop
  const track = (
    <div className="tm-track" style={{ animationDuration: speed + "s" }}>
      {row.map((t, i) => (
        <Chip key={t.label + i} t={t} dark={dark} />
      ))}
    </div>
  );

  const css = `
    .tm-mask{position:relative;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);}
    .tm-track{display:flex;gap:8px;width:max-content;animation-name:tmScroll;animation-timing-function:linear;animation-iteration-count:infinite;}
    .tm-mask:hover .tm-track{animation-play-state:paused;}
    @keyframes tmScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @media (prefers-reduced-motion: reduce){.tm-track{animation:none;flex-wrap:wrap;width:auto;}}
  `;

  if (variant === "strip") {
    return (
      <div className={dark ? "w-full" : "w-full"}>
        <style>{css}</style>
        <div className="tm-mask py-1">{track}</div>
      </div>
    );
  }

  return (
    <section className={(dark ? "text-emerald-50" : "text-gray-900") + " w-full"}>
      <style>{css}</style>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={"text-sm font-bold uppercase tracking-wide " + (dark ? "text-emerald-300" : "text-emerald-700")}>
            Built on open source · verifiable
          </h2>
          <p className={"text-[11px] " + (dark ? "text-emerald-200/60" : "text-gray-400")}>
            Every badge links to its official source. We map & implement these — we do not claim endorsement.
          </p>
        </div>
      </div>
      {stats && <LiveStats dark={dark} />}
      <div className="tm-mask py-2">{track}</div>
      <div className="mx-auto mt-2 flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 text-[10px]">
        {Object.entries(KIND_META).map(([k, m]) => (
          <span key={k} className={"inline-flex items-center gap-1 " + (dark ? "text-emerald-200/60" : "text-gray-400")}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: m.tint, display: "inline-block" }} />
            {m.note}
          </span>
        ))}
      </div>
    </section>
  );
}
