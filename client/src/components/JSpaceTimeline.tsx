// JSpaceTimeline — Visual infinite-time layer for Sov Space.
//
// Each event (decision_record, scenario run, governance event) is a point on a
// logarithmic timeline. The horizontal axis is zoom-out: recent events span the
// full width, older events nest into fixed slots. This lets the KB store an
// unbounded number of events while the screen stays readable — the line-scale
// zooms out as time expands.
//
// The visual encoding:
//   - x position = log(t_now - t_event), so the rightmost event is "now"
//   - color = tag (REFUTED=rose, MEASURED=emerald, OPEN=amber, default=sky)
//   - radius = evidence weight (more rigor = larger dot)
//   - click = expand the reasoning chain
//
// This is "the forest" — you traverse it laterally (time) or via zoom (scale).
// J-space (judgements) and C-space (c-actions) both render here.

import { useEffect, useRef, useState, useMemo } from "react";

export type TimelineEvent = {
  id: string;
  ts: string | number;     // ISO timestamp or ms epoch
  tag: string;             // REFUTED | MEASURED | OPEN | CONFIRMED | SETTLED | ...
  verdict: string;
  claim: string;
  evidence: string;
  sigil?: string;
  weight?: number;         // 0..1; defaults based on tag
  space?: "J" | "C";       // judgement-space or c-space (action)
};

type Props = {
  events: TimelineEvent[];
  onSelect?: (ev: TimelineEvent) => void;
  height?: number;
};

const TAG_COLOR: Record<string, string> = {
  REFUTED: "#fb7185",
  MEASURED: "#34d399",
  CONFIRMED: "#34d399",
  SETTLED: "#34d399",
  OPEN: "#fbbf24",
  PENDING: "#a78bfa",
  ACTION: "#60a5fa",
  C: "#60a5fa",
};

const TAG_WEIGHT: Record<string, number> = {
  REFUTED: 1.0,
  MEASURED: 0.85,
  CONFIRMED: 0.85,
  SETTLED: 0.9,
  OPEN: 0.65,
  PENDING: 0.5,
  ACTION: 0.7,
  C: 0.7,
};

const NOW = () => Date.now();

// Log-scale: t=0 → far right (now), t=1yr → left third. The line-scale is
// zoom-out: as time passes, the *same* event drifts left, freeing real-estate
// for new events. This is the "infinite drawing time" property.
function timeToX(t: number, w: number, now: number): number {
  const dt = Math.max(1, now - t); // ms
  const DAY = 86_400_000;
  const YEAR = 365 * DAY;
  // log10 of years-ago, clamped to [0.001, 1e3] years
  const years = Math.min(1e3, Math.max(1e-3, dt / YEAR));
  const logSpan = Math.log10(1e3) - Math.log10(1e-3); // 6 decades
  const logYears = Math.log10(years) - Math.log10(1e-3);
  const frac = Math.min(1, Math.max(0, logYears / logSpan));
  return w - frac * w; // 0 = far right (now), w = far left
}

function tickLabel(t: number): string {
  const dt = NOW() - t;
  const MIN = 60_000, HR = 60 * MIN, DAY = 24 * HR;
  if (dt < HR) return `${Math.round(dt / MIN)}m`;
  if (dt < DAY) return `${Math.round(dt / HR)}h`;
  if (dt < 30 * DAY) return `${Math.round(dt / DAY)}d`;
  if (dt < 365 * DAY) return `${Math.round(dt / (30 * DAY))}mo`;
  return `${(dt / (365 * DAY)).toFixed(1)}y`;
}

export default function JSpaceTimeline({ events, onSelect, height = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [now, setNow] = useState(NOW());

  // Re-tick so existing events drift left over time (infinite drawing time).
  useEffect(() => {
    const id = setInterval(() => setNow(NOW()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sort events by timestamp desc (newest first).
  const sorted = useMemo(() => {
    return events
      .map((e) => ({ ...e, _ts: typeof e.ts === "string" ? Date.parse(e.ts) || 0 : e.ts }))
      .filter((e) => e._ts > 0)
      .sort((a, b) => b._ts - a._ts);
  }, [events]);

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

    let raf = 0;
    function frame() {
      const ctx = cv!.getContext("2d");
      if (!ctx) return;
      const w = cv!.width, h = cv!.height;
      ctx.clearRect(0, 0, w, h);

      // Background: deep cosmos with subtle gradient
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, "#04111c");
      bg.addColorStop(1, "#020812");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // The spine — the timeline itself. Drawn as a faint glowing line.
      const midY = h * 0.55;
      ctx.strokeStyle = "rgba(96,165,250,0.18)";
      ctx.lineWidth = 1 * DPR;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Tick marks: decades on log scale (1m, 1h, 1d, 30d, 1y, 10y, 100y).
      const SPINE = 0.55;
      const FOREST = 0.30;
      const DECADES = [
        { years: 1e-3, label: "now" },
        { years: 1e-2, label: "min" },
        { years: 1e-1, label: "h" },
        { years: 1, label: "d" },
        { years: 30, label: "mo" },
        { years: 365, label: "y" },
        { years: 3650, label: "10y" },
        { years: 36500, label: "100y" },
      ];
      ctx.fillStyle = "rgba(148,197,255,0.35)";
      ctx.font = `${10 * DPR}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const d of DECADES) {
        const x = timeToX(NOW() - d.years * 365 * 86_400_000, w, NOW());
        ctx.fillStyle = "rgba(148,197,255,0.18)";
        ctx.fillRect(x, midY - 6 * DPR, 1 * DPR, 12 * DPR);
        ctx.fillStyle = "rgba(148,197,255,0.4)";
        ctx.fillText(d.label, x, midY + 8 * DPR);
      }

      // Events.
      for (let i = 0; i < sorted.length; i++) {
        const e = sorted[i];
        if (e._ts > now) continue;
        const x = timeToX(e._ts, w, now);
        if (x < 0 || x > w) continue;
        const color = TAG_COLOR[e.tag] ?? TAG_COLOR[e.space ?? "OPEN"] ?? "#a78bfa";
        const weight = e.weight ?? TAG_WEIGHT[e.tag] ?? 0.6;
        const baseR = 4 * DPR + weight * 6 * DPR;
        const r = baseR + (hover?.idx === i ? 2 * DPR : 0);

        // Upper lane: deliberation trail (faded, "c-space").
        const upperLane = h * SPINE - h * FOREST - 0.5 * (i % 3) * 14 * DPR;
        const lowerLane = h * SPINE + 0.5 * ((i + 1) % 3) * 14 * DPR;

        // Connector line between the two lanes (the "thread" of the event).
        ctx.strokeStyle = color + "33";
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.moveTo(x, upperLane);
        ctx.lineTo(x, lowerLane);
        ctx.stroke();

        // Upper dot (input / intent).
        ctx.fillStyle = color + "88";
        ctx.beginPath();
        ctx.arc(x, upperLane, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Lower dot (verdict / signature).
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, lowerLane, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring for signed/high-weight events.
        if (weight > 0.7) {
          ctx.strokeStyle = "#ffffffee";
          ctx.lineWidth = 1.2 * DPR;
          ctx.beginPath();
          ctx.arc(x, lowerLane, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label below if hover or recent.
        if (hover?.idx === i || i < 5) {
          const label = e.id.length > 18 ? e.id.slice(0, 14) + "…" : e.id;
          ctx.fillStyle = color;
          ctx.font = `${9 * DPR}px ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(label, x, lowerLane + r + 3 * DPR);
        }
      }

      // "Now" pulse — a soft glow at the right edge.
      const grad = ctx.createRadialGradient(w - 4 * DPR, midY, 1, w - 4 * DPR, midY, 28 * DPR);
      grad.addColorStop(0, "rgba(96,165,250,0.6)");
      grad.addColorStop(1, "rgba(96,165,250,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w - 4 * DPR, midY, 28 * DPR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `${10 * DPR}px ui-monospace, monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("now", w - 8 * DPR, midY - 6 * DPR);

      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, [sorted, hover, now]);

  function handleMove(ev: React.MouseEvent<HTMLCanvasElement>) {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const x = (ev.clientX - r.left) * cv.width / r.width;
    const y = (ev.clientY - r.top) * cv.height / r.height;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const px = timeToX(e._ts, cv.width, now);
      const py = cv.height * 0.55 + 0.5 * ((i + 1) % 3) * 14 * (cv.height / 220);
      const d = Math.hypot(px - x, py - y);
      if (d < 14 * (cv.width / cv.height) * 8 && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    setHover(bestIdx >= 0 ? { idx: bestIdx, x: ev.clientX - r.left, y: ev.clientY - r.top } : null);
  }

  function handleClick() {
    if (hover) {
      setSelected(sorted[hover.idx]);
      onSelect?.(sorted[hover.idx]);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
        className="block h-full w-full cursor-crosshair"
      />
      {hover && sorted[hover.idx] && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-md border border-sky-400/40 bg-black/85 px-3 py-2 text-xs text-sky-100 shadow-lg"
          style={{ left: Math.min(hover.x + 12, 360), top: Math.max(hover.y - 60, 0) }}
        >
          <div className="font-mono text-[10px] text-sky-300/70">{sorted[hover.idx].id}</div>
          <div className="mt-0.5 font-semibold">{sorted[hover.idx].tag}</div>
          <div className="mt-1 text-[11px] text-sky-100/90">{sorted[hover.idx].claim}</div>
          <div className="mt-1 text-[10px] text-sky-300/60">
            {tickLabel(sorted[hover.idx]._ts)} ago
            {sorted[hover.idx].space ? ` · ${sorted[hover.idx].space}-space` : ""}
          </div>
        </div>
      )}
      {selected && (
        <div className="mt-3 rounded-lg border border-sky-400/30 bg-sky-500/5 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] text-sky-300/70">{selected.id}</div>
            <button onClick={() => setSelected(null)} className="text-sky-300/50 hover:text-sky-100">✕</button>
          </div>
          <div className="mt-1 font-semibold text-sky-100">{selected.tag} · {selected.verdict}</div>
          <div className="mt-1 text-sky-100/90">{selected.claim}</div>
          <div className="mt-1 text-sky-200/60">{selected.evidence}</div>
          {selected.sigil && (
            <div className="mt-1 font-mono text-[10px] text-sky-300/40">{selected.sigil}</div>
          )}
        </div>
      )}
    </div>
  );
}
