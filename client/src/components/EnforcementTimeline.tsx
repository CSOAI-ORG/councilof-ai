import { useEffect, useState } from "react";

// EnforcementTimeline — branded, factually-correct EU AI Act staggered-application timeline.
// Custom SVG (emerald/teal, no photos). Past milestones dimmed; the next live one glows;
// a "you are here" marker is positioned by today's date. A citable regulatory asset.

const EM = "#10b981", TE = "#2dd4bf";
const MILES = [
  { d: "2025-02-02", label: "Prohibited practices + AI literacy", short: "2 Feb 2025" },
  { d: "2025-08-02", label: "GPAI model obligations", short: "2 Aug 2025" },
  { d: "2026-08-02", label: "Art. 50 transparency + penalties", short: "2 Aug 2026" },
  { d: "2027-08-02", label: "Legacy GPAI compliance + sandboxes", short: "2 Aug 2027" },
  { d: "2027-12-02", label: "High-risk (Annex III) — Digital Omnibus", short: "2 Dec 2027" },
  { d: "2028-08-02", label: "Annex I product-safety high-risk", short: "2 Aug 2028" },
];

export default function EnforcementTimeline({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const W = 820, H = 150, padX = 96, y = 78;
  const xs = MILES.map((_, i) => padX + (i * (W - 2 * padX)) / (MILES.length - 1));
  const times = MILES.map((m) => new Date(m.d + "T00:00:00Z").getTime());
  const activeIdx = now == null ? 2 : Math.max(0, MILES.findIndex((_, i) => times[i] > now));
  const active = activeIdx === -1 ? MILES.length - 1 : activeIdx;

  // "you are here" x — interpolate between the flanking milestones
  let hereX: number | null = null;
  if (now != null) {
    if (now <= times[0]) hereX = xs[0];
    else if (now >= times[times.length - 1]) hereX = xs[xs.length - 1];
    else { const i = times.findIndex((t) => t > now); const f = (now - times[i - 1]) / (times[i] - times[i - 1]); hereX = xs[i - 1] + f * (xs[i] - xs[i - 1]); }
  }
  const days = (i: number) => now == null ? null : Math.max(0, Math.ceil((times[i] - now) / 86400000));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img"
      aria-label="EU AI Act staggered application timeline: Feb 2025 prohibited practices, Aug 2025 GPAI obligations, Aug 2026 GPAI enforcement, Dec 2026 Article 50 transparency, Dec 2027 Annex III high-risk (Digital Omnibus), Aug 2028 Annex I"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="et-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={EM} /><stop offset="1" stopColor={TE} /></linearGradient>
        <filter id="et-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {/* baseline */}
      <line x1={xs[0]} y1={y} x2={xs[xs.length - 1]} y2={y} stroke="rgba(148,163,184,.25)" strokeWidth="3" />
      <line x1={xs[0]} y1={y} x2={hereX ?? xs[active]} y2={y} stroke="url(#et-line)" strokeWidth="3" />

      {/* you-are-here marker */}
      {hereX != null && (
        <g>
          <path d={`M${hereX} ${y - 14} l6 -9 -12 0 z`} fill={TE} />
          <text x={hereX} y={y - 42} textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="9" fontWeight="700" fill={TE}>you are here</text>
        </g>
      )}

      {MILES.map((m, i) => {
        const past = now != null && times[i] <= now;
        const isActive = i === active;
        const op = past ? 0.42 : 1;
        const col = isActive ? EM : past ? "#64748b" : TE;
        const d = days(i);
        return (
          <g key={m.d} opacity={op}>
            {isActive && <circle cx={xs[i]} cy={y} r="13" fill="none" stroke={EM} strokeWidth="2" filter="url(#et-glow)" opacity="0.7" />}
            <circle cx={xs[i]} cy={y} r={isActive ? 8 : 6} fill={col} stroke="#03110b" strokeWidth="2" filter={isActive ? "url(#et-glow)" : undefined} />
            <text x={xs[i]} y={y + 24} textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="10" fontWeight="700" letterSpacing="1" fill={isActive ? "#6ee7b7" : "#94a3b8"}>{m.short}</text>
            <foreignObject x={xs[i] - 82} y={y + 30} width="164" height="46">
              <div style={{ fontFamily: "ui-sans-serif,system-ui", fontSize: 10.5, lineHeight: 1.25, textAlign: "center", color: isActive ? "#d1fae5" : "#94a3b8" }}>{m.label}</div>
            </foreignObject>
            {isActive && d != null && <text x={xs[i]} y={y - 20} textAnchor="middle" fontFamily="ui-sans-serif,system-ui" fontSize="10" fontWeight="800" fill={EM}>{d} days</text>}
          </g>
        );
      })}
    </svg>
  );
}
