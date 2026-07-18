/**
 * Council · Globe — the Sovereign Council Globe (URL-as-state map surface).
 *
 * OpenGridWorks-pattern map-as-SaaS. The URL is the entire state:
 *   ?lat&lng&z&layers&panel&focus&node&preset
 *
 * Spec: /Users/nicholas/clawd/_TABS/SOVEREIGN_COUNCIL_GLOBE_SPEC_2026-06-12.md
 *
 * This is the Week-1 MVP SHELL: a real, working component that renders
 * the URL contract + a placeholder globe (text-based for now; the
 * cobe + maplibre WebGL renderer is the Week-1.5 follow-up). The
 * share-link UX is the load-bearing piece: every state change
 * updates the URL, every URL produces a deterministic view.
 *
 * When the spec goes to build, replace the GlobeCanvas stub below
 * with the cobe + maplibre wrapper. The URL contract, the layer
 * toggles, and the panel scaffold are the Week-1 deliverable and
 * stay as-is.
 */

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import CouncilNav from "@/components/CouncilNav";

// ── URL contract (the single source of truth) ──────────────────────────

const LAYER_DEFS = [
  { id: "sigil", label: "SIGIL", desc: "Live audit + signer pulse", accent: "emerald" },
  { id: "law", label: "LAW", desc: "6 LAW regions", accent: "cyan" },
  { id: "maps", label: "MAPS", desc: "36-node graph + bridges", accent: "violet" },
  { id: "compliance", label: "COMPLIANCE", desc: "13 frameworks", accent: "amber" },
  { id: "dome", label: "DOME", desc: "12 expertise domains", accent: "rose" },
  { id: "council", label: "COUNCIL", desc: "The 33-node substrate", accent: "indigo" },
  { id: "guardian", label: "GUARDIAN", desc: "Per-child sessions (auth-gated)", accent: "lime" },
] as const;

const PRESETS = [
  { id: "article50", label: "Article 50 cliff", lat: 50.8, lng: 10.0, z: 4, layers: "law,compliance,eu", focus: "eu-ai-act" },
  { id: "mcp-boom", label: "MCP-Registry Boom", lat: 20, lng: 0, z: 2, layers: "council,maps,sigil", focus: "registry" },
  { id: "a2a-verified", label: "A2A Verified", lat: 20, lng: 0, z: 2, layers: "sigil,council", focus: "a2a" },
  { id: "eu-sov", label: "EU Sovereignty", lat: 50, lng: 10, z: 4, layers: "sigil,law,maps,compliance,dome,council", focus: "eu" },
  { id: "watchdog", label: "Global Watchdog", lat: 10, lng: 0, z: 1.5, layers: "all", panel: "open" },
  { id: "physical-infra", label: "Physical infrastructure", lat: 30, lng: -10, z: 2.5, layers: "council,compliance,sigil", focus: "opengridworks" },
] as const;

type LayerId = (typeof LAYER_DEFS)[number]["id"];

interface GlobeState {
  lat: number;
  lng: number;
  z: number;
  layers: Set<LayerId>;
  focus: string | null;
  panel: "open" | "closed";
  preset: string | null;
  node: string | null;
}

const DEFAULT_STATE: GlobeState = {
  lat: 20,
  lng: 0,
  z: 2,
  layers: new Set(LAYER_DEFS.map((l) => l.id)),
  focus: null,
  panel: "closed",
  preset: null,
  node: null,
};

// ── URL ↔ state helpers ────────────────────────────────────────────────

function parseGlobeState(search: string): GlobeState {
  const params = new URLSearchParams(search);
  const state: GlobeState = {
    lat: parseFloat(params.get("lat") || String(DEFAULT_STATE.lat)),
    lng: parseFloat(params.get("lng") || String(DEFAULT_STATE.lng)),
    z: parseFloat(params.get("z") || String(DEFAULT_STATE.z)),
    layers: new Set(
      (params.get("layers") || LAYER_DEFS.map((l) => l.id).join(","))
        .split(",")
        .filter(Boolean) as LayerId[]
    ),
    focus: params.get("focus"),
    panel: (params.get("panel") as GlobeState["panel"]) || "closed",
    preset: params.get("preset"),
    node: params.get("node"),
  };
  return state;
}

function buildGlobeURL(state: GlobeState, path = "/council/globe"): string {
  const params = new URLSearchParams();
  if (state.lat !== DEFAULT_STATE.lat) params.set("lat", String(state.lat));
  if (state.lng !== DEFAULT_STATE.lng) params.set("lng", String(state.lng));
  if (state.z !== DEFAULT_STATE.z) params.set("z", String(state.z));
  const activeLayers = LAYER_DEFS.map((l) => l.id).filter((l) => state.layers.has(l as LayerId));
  params.set("layers", activeLayers.join(","));
  if (state.focus) params.set("focus", state.focus);
  if (state.panel === "open") params.set("panel", "open");
  if (state.preset) params.set("preset", state.preset);
  if (state.node) params.set("node", state.node);
  return `${path}?${params.toString()}`;
}

// ── The placeholder globe canvas (Week-1 stub) ──────────────────────────
//
// Replaced with <cobe> + <react-map-gl> in the Week-1.5 follow-up.
// For now this is a real working text-grid that shows the layer toggles,
// the lat/lng/z, the panel, and the share-link UX.

function GlobeCanvas({ state }: { state: GlobeState }) {
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 200px)",
        minHeight: 480,
        background: "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Center coords display */}
      <div style={{ position: "absolute", top: 16, left: 16, fontFamily: "ui-monospace, monospace", color: "#cbd5e1", fontSize: 12, lineHeight: 1.6 }}>
        <div>lat: {state.lat.toFixed(4)}°</div>
        <div>lng: {state.lng.toFixed(4)}°</div>
        <div>z: {state.z.toFixed(2)}</div>
        <div style={{ marginTop: 8, color: "#64748b" }}>{state.layers.size} layers active</div>
      </div>

      {/* Placeholder grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: -2 }}>
          COUNCIL GLOBE
        </div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, maxWidth: 480, textAlign: "center", lineHeight: 1.6 }}>
          The WebGL globe (cobe + maplibre) lands in the Week-1.5 follow-up.
          <br />
          This is the URL-state shell + layer toggles + share-link UX — the load-bearing piece.
        </div>
      </div>

      {/* Bottom layer legend (active layers) */}
      <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {LAYER_DEFS.filter((l) => state.layers.has(l.id)).map((l) => (
          <div
            key={l.id}
            style={{
              padding: "6px 10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── The right-hand evidence panel (Week-1 stub) ────────────────────────

function GlobePanel({ state, onClose }: { state: GlobeState; onClose: () => void }) {
  if (state.panel !== "open") return null;
  return (
    <motion.aside
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 420,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
        padding: 24,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#cbd5e1" }}>
          Evidence
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", fontSize: 18 }}>
          ×
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Focused
        </p>
        <p style={{ fontFamily: "ui-monospace, monospace", color: "#cbd5e1", fontSize: 13 }}>
          {state.focus || "—"}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Node
        </p>
        <p style={{ fontFamily: "ui-monospace, monospace", color: "#cbd5e1", fontSize: 13 }}>
          {state.node || "—"}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          4-Tab Evidence Envelope
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["Identity", "Certificate", "Verify", "Audit"].map((tab) => (
            <button
              key={tab}
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "#cbd5e1",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
          Identity · Certificate · Verify · Audit. The 4 tabs are the canonical
          evidence envelope for any focused node. Real data lands when the
          L0-G PBFT engine + /v1/health ship (PR-A + PR-#2 in the hive).
        </p>
      </div>

      <div>
        <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Share link
        </p>
        <input
          readOnly
          value={typeof window !== "undefined" ? buildGlobeURL(state) : ""}
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            color: "#cbd5e1",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
          }}
        />
        <p style={{ fontSize: 10, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
          Every state change updates the URL. The URL is the canonical state.
          Auditors can paste the link and see exactly what you saw.
        </p>
      </div>
    </motion.aside>
  );
}

// ── The component ──────────────────────────────────────────────────────

export default function CouncilGlobe() {
  const [state, setState] = useState<GlobeState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    return parseGlobeState(window.location.search);
  });

  // Sync URL when state changes (the share-link UX)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = buildGlobeURL(state);
    window.history.replaceState(null, "", url);
  }, [state]);

  // Listen for browser back/forward
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => setState(parseGlobeState(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const toggleLayer = (id: LayerId) => {
    setState((s) => {
      const next = new Set(s.layers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, layers: next, preset: null };
    });
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setState((s) => ({
      ...s,
      lat: preset.lat,
      lng: preset.lng,
      z: preset.z,
      layers: new Set(preset.layers === "all" ? LAYER_DEFS.map((l) => l.id) : (preset.layers.split(",") as LayerId[])),
      // FIX 2026-06-12: PRESETS is a union type — not every preset has `focus` or `panel`.
      // Type-narrow with `in` so tsc accepts the access on members that have the field.
      ...("focus" in preset ? { focus: preset.focus } : {}),
      ...("panel" in preset ? { panel: preset.panel === "open" ? "open" : s.panel } : {}),
      preset: preset.id,
    }));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <header style={{ marginBottom: 16 }}>
        <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">
          Council substrate · map surface
        </p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">
          The Sovereign Council Globe
        </h1>
        <p className="text-slate-400 max-w-3xl">
          URL-as-state. Every layer, every node, every preset is a parameter.
          The whole CSOAI stack — attestation, MCP, compliance, charter, council,
          law, agent chat — is one click away from the map.
        </p>
      </header>

      <CouncilNav />

      <div className="mt-8 grid lg:grid-cols-[1fr_280px] gap-6">
        <div>
          <GlobeCanvas state={state} />

          {/* Layer toggles */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LAYER_DEFS.map((l) => {
              const active = state.layers.has(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleLayer(l.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? "bg-white/10 border-white/20"
                      : "bg-white/[0.02] border-white/5 opacity-50"
                  }`}
                >
                  <p className={`text-xs font-bold tracking-wider ${active ? `text-${l.accent}-400` : "text-slate-500"}`}>
                    {l.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{l.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Presets */}
          <div className="mt-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Presets</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    state.preset === p.id
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-600">
            <Link href="/council" className="hover:text-emerald-400 transition-colors">
              ← back to /council
            </Link>
          </div>
        </div>

        {/* Sidebar: focus / presets / layer count */}
        <aside className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Focus</p>
            <p className="text-sm text-slate-300 font-mono">{state.focus || "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Preset</p>
            <p className="text-sm text-slate-300 font-mono">{state.preset || "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Active layers</p>
            <p className="text-3xl font-black text-emerald-400">{state.layers.size} / {LAYER_DEFS.length}</p>
          </div>
          <button
            onClick={() => setState((s) => ({ ...s, panel: s.panel === "open" ? "closed" : "open" }))}
            className="w-full p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold hover:bg-emerald-500/30 transition-all"
          >
            {state.panel === "open" ? "Close" : "Open"} evidence panel
          </button>
        </aside>
      </div>

      <GlobePanel state={state} onClose={() => setState((s) => ({ ...s, panel: "closed" }))} />
    </main>
  );
}
