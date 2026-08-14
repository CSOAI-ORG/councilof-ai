// SovSpaceGalaxy — 5D layer view of the sovereign estate.
//
// Each layer is a concentric ring; zooming OUT reveals the next layer.
//   Layer 0 (innermost): the HIVE — the now-pinned corpus of facts (water)
//   Layer 1:            C-SPACE — local deliberation actions (milk)
//   Layer 2:            J-SPACE — signed decisions in the D1 ledger (honey)
//   Layer 3 (orbital):  FLYWHEELS — running processes, each as a planet
//   Layer 4 (outermost): LIVE DATA — unbounded working memory (the drawing)
//
// The metaphor: the sovereign estate is a galaxy. Hive facts are the star
// at the centre; flywheels orbit; C-space and J-space are the inner shells
// where deliberation becomes evidence; live data is the outer halo that
// never stops arriving.
//
// Each flywheel planet shows:
//   - its name (e.g. "find_besT", "flywheel-daily", "n_eff_diversity")
//   - its current phase (water / milk / honey) — see MEMORY water→milk→honey
//   - its rotation = elapsed since last run
//   - its colour = the GSPC axis it primarily serves (governance/safety/provenance/continuity)
//
// Hover for tooltip. Click to expand the flywheel's recent events on the
// inner log-scale timeline (the existing JSpaceTimeline renders below).

import { useEffect, useRef, useState } from "react";

type Phase = "water" | "milk" | "honey";

export type CitizenNode = {
  citizen_id: string;
  model: string;
  location: "local-ollama" | "free-gpu" | string;
  tokens: number;
  issued_at?: string;
};

export type FlywheelPlanet = {
  id: string;
  name: string;
  axis: "governance" | "safety" | "provenance" | "continuity" | "care";
  phase: Phase;
  last_run_iso?: string;
  description?: string;
  metric?: string;
};

export type HiveLayer = {
  id: string;
  name: string;
  count: number;
  description?: string;
};

type Props = {
  hive: HiveLayer[];
  cspace: number;            // c-space event count
  jspace: number;            // j-space signed record count
  flywheels: FlywheelPlanet[];
  citizens?: CitizenNode[];  // citizen nodes (one per spawned user)
  height?: number;
};

const AXIS_COLOR: Record<FlywheelPlanet["axis"], string> = {
  governance: "#34d399",
  safety: "#60a5fa",
  provenance: "#fbbf24",
  continuity: "#a78bfa",
  care: "#fb7185",
};

const PHASE_COLOR: Record<Phase, string> = {
  water: "#0ea5e9",   // pinned, blue
  milk: "#facc15",    // gated, yellow
  honey: "#f97316",   // served, orange
};

const PHASE_LABEL: Record<Phase, string> = {
  water: "water — pinned",
  milk: "milk — gated",
  honey: "honey — served",
};

function fmtSince(iso?: string): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!t) return iso;
  const dt = Date.now() - t;
  if (dt < 60_000) return `${Math.round(dt / 1000)}s ago`;
  if (dt < 3_600_000) return `${Math.round(dt / 60_000)}m ago`;
  if (dt < 86_400_000) return `${Math.round(dt / 3_600_000)}h ago`;
  return `${Math.round(dt / 86_400_000)}d ago`;
}

export default function SovSpaceGalaxy({
  hive,
  cspace,
  jspace,
  flywheels,
  citizens = [],
  height = 520,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; planet?: FlywheelPlanet; layer?: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Slow rotation per frame so the orbit feels alive (live data, not frozen).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard nav — Tab cycles planets, Enter selects, Esc clears.
  const [kbFocus, setKbFocus] = useState(0); // index into flywheels
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (flywheels.length === 0) return;
    if (e.key === "Tab") {
      e.preventDefault();
      setKbFocus((i) => (e.shiftKey ? (i - 1 + flywheels.length) % flywheels.length : (i + 1) % flywheels.length));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const fw = flywheels[kbFocus];
      if (fw) setSelected((cur) => (cur === fw.id ? null : fw.id));
    } else if (e.key === "Escape") {
      setSelected(null);
    }
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      const r = wrap!.getBoundingClientRect();
      cv!.width = r.width * DPR;
      cv!.height = r.height * DPR;
    }
    size();
    window.addEventListener("resize", size);

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);

    // Background — the infinite drawing (live data) is the halo beyond everything.
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, "#04111c");
    bg.addColorStop(0.5, "#020812");
    bg.addColorStop(1, "rgba(15,23,42,0.05)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) * 0.46;

    // LAYER 0 — HIVE (innermost) — the now-pinned facts
    const hiveR = maxR * 0.10;
    const hiveGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hiveR);
    hiveGrad.addColorStop(0, "#0c4a6e");
    hiveGrad.addColorStop(0.7, "#0ea5e9");
    hiveGrad.addColorStop(1, "rgba(14,165,233,0.1)");
    ctx.fillStyle = hiveGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, hiveR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(14,165,233,0.4)";
    ctx.lineWidth = 1 * DPR;
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    ctx.font = `${10 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`HIVE · ${hive.reduce((s, h) => s + h.count, 0)}`, cx, cy - 4 * DPR);
    ctx.fillText("water", cx, cy + 8 * DPR);

    // LAYER 1 — C-SPACE — local deliberation (the milk phase)
    const cR = maxR * 0.22;
    ctx.strokeStyle = "rgba(250,204,21,0.25)";
    ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    ctx.arc(cx, cy, cR, 0, Math.PI * 2);
    ctx.stroke();
    // Spawn small dots around c-space proportional to event count (capped for perf)
    const cDotCount = Math.min(cspace, 40);
    for (let i = 0; i < cDotCount; i++) {
      const ang = (i / cDotCount) * Math.PI * 2 + tick * 0.0005;
      const r = cR + (i % 3) * 4 * DPR;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      ctx.fillStyle = "rgba(250,204,21,0.5)";
      ctx.beginPath();
      ctx.arc(x, y, 1.2 * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(250,204,21,0.7)";
    ctx.font = `${9 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`C-SPACE · ${cspace}`, cx + cR + 6 * DPR, cy);

    // LAYER 2 — J-SPACE — signed decisions (the honey phase)
    const jR = maxR * 0.36;
    ctx.strokeStyle = "rgba(249,115,22,0.3)";
    ctx.lineWidth = 1 * DPR;
    ctx.beginPath();
    ctx.arc(cx, cy, jR, 0, Math.PI * 2);
    ctx.stroke();
    // Ed25519 sigil markers — denser, more prominent
    const jDotCount = Math.min(jspace, 80);
    for (let i = 0; i < jDotCount; i++) {
      const ang = (i / jDotCount) * Math.PI * 2 - tick * 0.0003;
      const r = jR + (i % 4) * 3 * DPR;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      ctx.fillStyle = "rgba(249,115,22,0.65)";
      ctx.beginPath();
      ctx.arc(x, y, 1.5 * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(249,115,22,0.85)";
    ctx.font = `${9 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`J-SPACE · ${jspace} signed`, cx + jR + 6 * DPR, cy + 12 * DPR);

    // LAYER 3 — FLYWHEELS as planets orbiting on their own radius
    const planetBaseR = maxR * 0.6;
    const planetRingR = maxR * 0.78;
    flywheels.forEach((fw, i) => {
      const ang = (i / Math.max(1, flywheels.length)) * Math.PI * 2 + tick * 0.0008;
      const x = cx + Math.cos(ang) * planetRingR;
      const y = cy + Math.sin(ang) * planetRingR;
      const color = AXIS_COLOR[fw.axis] ?? "#a78bfa";
      const phaseColor = PHASE_COLOR[fw.phase];

      // orbit trace
      ctx.strokeStyle = `${color}33`;
      ctx.lineWidth = 1 * DPR;
      ctx.beginPath();
      ctx.arc(cx, cy, planetRingR, 0, Math.PI * 2);
      ctx.stroke();

      // planet body — outer ring = axis, inner = phase
      const r = 14 * DPR;
      // axis halo
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
      halo.addColorStop(0, color);
      halo.addColorStop(0.4, `${color}66`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, r * 2, 0, Math.PI * 2);
      ctx.fill();
      // planet disc
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // phase dot
      ctx.fillStyle = phaseColor;
      ctx.beginPath();
      ctx.arc(x + r * 0.6, y - r * 0.4, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // focus ring — drawn for the kb-focused planet so keyboard users see where they are.
      if (i === kbFocus) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 * DPR;
        ctx.setLineDash([3 * DPR, 3 * DPR]);
        ctx.beginPath();
        ctx.arc(x, y, r + 4 * DPR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // label
      ctx.fillStyle = i === kbFocus ? "#ffffff" : "#e2e8f0";
      ctx.font = `${9 * DPR}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(fw.name, x, y + r + 4 * DPR);

      // hover detection — convert to CSS pixel space
      const mx = (hover?.x ?? -1) * DPR;
      const my = (hover?.y ?? -1) * DPR;
      const dist = Math.hypot(mx - x, my - y);
      if (dist < r * 1.5) {
        setHover({ x: x / DPR, y: y / DPR, planet: fw });
      }
    });

    // LAYER 4 — LIVE DATA halo (the infinite drawing — outer ring)
    ctx.strokeStyle = "rgba(96,165,250,0.12)";
    ctx.setLineDash([2 * DPR, 4 * DPR]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(148,197,255,0.4)";
    ctx.font = `${9 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("LIVE DATA · unbounded working memory", 8 * DPR, H - 14 * DPR);

    // LAYER 5 — CITIZEN SWARM (the fluid cluster)
    // Each citizen is one user. Dim if local, bright if on free GPU.
    // They drift in the outermost ring, representing the unbounded fleet
    // of users the sovereign estate grows into.
    if (citizens.length > 0) {
      const citizenR = maxR * 0.92;
      citizens.slice(0, 60).forEach((c, i) => {
        const ang = (i / Math.max(1, citizens.length)) * Math.PI * 2 + tick * 0.0012;
        const r = citizenR + (i % 3) * 6 * DPR;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        const bright = c.location === "free-gpu";
        const color = bright ? "#fbbf24" : "#64748b";
        const alpha = bright ? 0.85 : 0.45;
        // dot
        ctx.fillStyle = bright ? `rgba(251,191,36,${alpha})` : `rgba(100,116,139,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, bright ? 2.5 * DPR : 1.5 * DPR, 0, Math.PI * 2);
        ctx.fill();
        // halo for free-gpu citizens — bright = on GPU fleet
        if (bright) {
          const halo = ctx.createRadialGradient(x, y, 0, x, y, 8 * DPR);
          halo.addColorStop(0, "rgba(251,191,36,0.5)");
          halo.addColorStop(1, "rgba(251,191,36,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(x, y, 8 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      // count label
      ctx.fillStyle = "rgba(251,191,36,0.7)";
      ctx.font = `${9 * DPR}px ui-monospace, monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`citizens: ${citizens.length} (${citizens.filter((c) => c.location === "free-gpu").length} on GPU)`, W - 8 * DPR, 12 * DPR);
    }

    // legend
    ctx.font = `${9 * DPR}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(96,165,250,0.5)";
    ctx.fillText(`zoom: ${tick}`, 8 * DPR, 12 * DPR);
    ctx.fillText(`flywheels: ${flywheels.length}`, 8 * DPR, 24 * DPR);

    // PHASE LEGEND — bottom strip showing water / milk / honey with plain-English meaning.
    // End users land here without context; the legend is the first thing they read.
    const legendY = H - 38 * DPR;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `${9 * DPR}px ui-monospace, monospace`;
    ctx.fillText("phase →", 8 * DPR, legendY);
    const legendItems: Array<{ color: string; label: string; meaning: string }> = [
      { color: PHASE_COLOR.water, label: "water", meaning: "pinned facts" },
      { color: PHASE_COLOR.milk, label: "milk", meaning: "gated knowledge" },
      { color: PHASE_COLOR.honey, label: "honey", meaning: "served evidence" },
    ];
    let legendX = 52 * DPR;
    for (const item of legendItems) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY - 3 * DPR, 5 * DPR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `${10 * DPR}px ui-monospace, monospace`;
      ctx.fillText(item.label, legendX + 9 * DPR, legendY);
      ctx.fillStyle = "rgba(148,197,255,0.55)";
      ctx.font = `${9 * DPR}px ui-monospace, monospace`;
      ctx.fillText(`(${item.meaning})`, legendX + 9 * DPR + ctx.measureText(item.label).width + 6 * DPR, legendY);
      legendX += 200 * DPR;
    }

    return () => window.removeEventListener("resize", size);
  }, [tick, hover, hive, cspace, jspace, flywheels, citizens, kbFocus]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={wrapRef} style={{ width: "100%", height }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", cursor: "grab", outline: "none" }}
          tabIndex={0}
          role="application"
          aria-label={`SovSpace galaxy — hive → c-space → j-space → flywheels → live data. ${flywheels.length} planets. Use Tab to cycle, Enter to inspect, Escape to clear. Currently focused: ${flywheels[kbFocus]?.name ?? "none"}.`}
          onMouseMove={(e) => {
            const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
            setHover({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
          onMouseLeave={() => setHover(null)}
          onClick={() => {
            if (hover?.planet) {
              setSelected((cur) => (cur === hover.planet!.id ? null : hover.planet!.id));
            }
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {hover?.planet && (
        <div
          style={{
            position: "absolute",
            left: Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? 0) - 280),
            top: Math.max(hover.y - 60, 0),
            background: "rgba(2,8,18,0.92)",
            border: `1px solid ${AXIS_COLOR[hover.planet.axis]}`,
            padding: "0.5rem 0.75rem",
            borderRadius: 4,
            color: "#e2e8f0",
            fontSize: 11,
            pointerEvents: "none",
            minWidth: 240,
          }}
        >
          <div style={{ fontWeight: 600, color: AXIS_COLOR[hover.planet.axis] }}>
            {hover.planet.name}
          </div>
          <div style={{ color: "#94a3b8", marginTop: 2 }}>
            axis: <span style={{ color: AXIS_COLOR[hover.planet.axis] }}>{hover.planet.axis}</span>
          </div>
          <div style={{ color: "#94a3b8" }}>
            phase: <span style={{ color: PHASE_COLOR[hover.planet.phase] }}>{PHASE_LABEL[hover.planet.phase]}</span>
          </div>
          <div style={{ color: "#94a3b8" }}>last run: {fmtSince(hover.planet.last_run_iso)}</div>
          {hover.planet.metric && (
            <div style={{ color: "#fbbf24", marginTop: 2 }}>{hover.planet.metric}</div>
          )}
          {hover.planet.description && (
            <div style={{ color: "#cbd5e1", marginTop: 4 }}>{hover.planet.description}</div>
          )}
        </div>
      )}
      {selected && (
        <div
          style={{
            marginTop: 8,
            padding: "0.75rem 1rem",
            background: "rgba(2,8,18,0.7)",
            border: "1px solid var(--paper-edge, #444)",
            borderRadius: 4,
            color: "#e2e8f0",
            fontSize: 12,
          }}
        >
          Click a flywheel planet to inspect. Currently selected:{" "}
          <span className="mono">
            {flywheels.find((f) => f.id === selected)?.name}
          </span>{" "}
          — see the JSpaceTimeline below for the signed events.
        </div>
      )}
    </div>
  );
}