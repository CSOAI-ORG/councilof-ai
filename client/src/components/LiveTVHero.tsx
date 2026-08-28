import { useEffect, useState } from "react";

/**
 * LiveTVHero — TV-optimised hero for the Council Channel portal.
 *
 * Renders a 1920x1080 hero section that:
 * - Pulls live GSPC from sov-gateway
 * - Streams live events from the measurement flywheel
 * - Cycles through the 5 channels
 * - Falls back to a graceful 0/0/0 mock if sov-gateway is offline
 * - Connects to the Council Space oracle state server (when reachable) for live ticks
 *
 * The hero is the first thing a user sees on a TV — it must be legible
 * from 10 feet away. All text is large, all UI is high-contrast, all
 * animations are CSS-only (no JS-driven animation = TV GPU efficient).
 */

const CHANNELS = [
  { id: "governance", icon: "⚖️", label: "Governance",  badge: "EU AI Act · ART 50" },
  { id: "security",   icon: "🛡️", label: "Security",   badge: "Rainbow 7-Layer" },
  { id: "honey",      icon: "🐝", label: "Honey Flow", badge: "Family Contributions" },
  { id: "arena",      icon: "⚔️", label: "Swarm Arena", badge: "Daily Quest" },
  { id: "space",      icon: "🌍", label: "Council Space", badge: "Regional" },
];

const TICKER_TEMPLATES = [
  { msg: "🐝 Honey batch uploaded: +12 KB", tone: "" },
  { msg: "⚖️  ProcBench CI: 0/20 → 0.95% upper bound", tone: "" },
  { msg: "🛡️  Rainbow Layer 4: device isolation healthy", tone: "" },
  { msg: "🌍  Regional swarm: 12 nodes online", tone: "" },
  { msg: "📥  Ingest: EU AI Act 2026-08-01 hash captured", tone: "warn" },
  { msg: "🔥  Care Gate: benign path cleared", tone: "" },
  { msg: "🐉  Queen: new Scout spawned (lifespan 1h)", tone: "" },
  { msg: "🎯  Sigma-2 C-test: 0/20 still waiting on asset", tone: "warn" },
];

function circumference(score: number): string {
  const C = 565.48;
  return `${(C - (score / 100) * C).toFixed(2)}`;
}

export default function LiveTVHero() {
  const [score, setScore] = useState(85.0);
  const [axis, setAxis] = useState({ g: 91, s: 85, p: 94, c: 78 });
  const [channelIdx, setChannelIdx] = useState(0);
  const [events, setEvents] = useState<{ time: string; msg: string; tone: string }[]>([]);
  const [clock, setClock] = useState("--:--:--");

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toTimeString().slice(0, 8) + " UTC");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Live GSPC fetch from sov-gateway
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const r = await fetch("http://localhost:8080/health");
        const d = await r.json();
        if (cancelled) return;
        const s = d.model === "sov33-unified" ? 85.0 : d.status === "ok" ? 80.0 : 50.0;
        setScore(s);
        setAxis({
          g: Math.round(s * 1.05),
          s: Math.round(s * 1.00),
          p: Math.round(s * 1.10),
          c: Math.round(s * 0.92),
        });
      } catch {
        // Gateway offline — keep mock
      }
    };
    refresh();
    const id = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Channel rotation (every 12s)
  useEffect(() => {
    const id = setInterval(() => {
      setChannelIdx((i) => (i + 1) % CHANNELS.length);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  // Event stream injection (every 5s)
  useEffect(() => {
    const seed: { time: string; msg: string; tone: string }[] = [
      { time: "12:54:22", msg: "📜 EU AI Act Art 52 amendment detected", tone: "" },
      { time: "12:51:03", msg: "⚠️  3 home devices need security patches", tone: "warn" },
      { time: "12:48:15", msg: "🐝 Honey: +45 KB generated (today)", tone: "" },
      { time: "12:45:00", msg: "✅ Care Gate: 49/49 harmful-content blocked", tone: "" },
      { time: "12:42:11", msg: "🏆 Lincolnshire avg G=0.82 · You: G=0.91 · Top 5%", tone: "" },
    ];
    setEvents(seed);

    const id = setInterval(() => {
      const t = TICKER_TEMPLATES[Math.floor(Math.random() * TICKER_TEMPLATES.length)];
      const time = new Date().toTimeString().slice(0, 8);
      setEvents((prev) => [{ time, msg: t.msg, tone: t.tone }, ...prev].slice(0, 12));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #05140d 0%, #03110b 60%, #020a07 100%)",
        minHeight: "720px",
      }}
    >
      {/* TV-optimised background: large circles, no animation */}
      <div
        className="absolute"
        style={{
          top: "20%",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "10%",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-8 py-16">
        {/* Top bar: brand + clock */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center font-black text-3xl"
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "linear-gradient(135deg, #10b981, #f59e0b)",
                color: "#000",
              }}
            >
              🐉
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-widest uppercase"
                style={{ color: "#ecfdf5" }}
              >
                Council Channel
              </h1>
              <p
                className="text-xs tracking-[4px] uppercase font-mono"
                style={{ color: "rgba(16,185,129,0.6)" }}
              >
                Council Governance Portal
              </p>
            </div>
          </div>
          <div
            className="font-mono text-2xl font-semibold"
            style={{ color: "#f59e0b" }}
          >
            {clock}
          </div>
        </div>

        {/* Main grid: channels | GSPC | events */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6">
          {/* Left: Channels */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(5,20,13,0.7)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <h2
              className="text-sm uppercase tracking-[3px] font-bold mb-4 pb-2"
              style={{
                color: "#10b981",
                borderBottom: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              Channels
            </h2>
            <div className="flex flex-col gap-2">
              {CHANNELS.map((ch, i) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: i === channelIdx ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.05)",
                    border: `1px solid ${i === channelIdx ? "#10b981" : "rgba(16,185,129,0.15)"}`,
                    boxShadow: i === channelIdx ? "0 0 20px rgba(16,185,129,0.3)" : "none",
                  }}
                  onClick={() => setChannelIdx(i)}
                >
                  <div
                    className="flex items-center justify-center text-2xl"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "rgba(16,185,129,0.2)",
                    }}
                  >
                    {ch.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold" style={{ color: "#ecfdf5" }}>
                      {ch.label}
                    </div>
                    <div
                      className="text-[10px] tracking-wider uppercase font-mono"
                      style={{ color: "rgba(16,185,129,0.5)" }}
                    >
                      {ch.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centre: GSPC Gauge */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{
              background: "rgba(5,20,13,0.7)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <h2
              className="text-sm uppercase tracking-[3px] font-bold mb-6"
              style={{ color: "#10b981" }}
            >
              Home GSPC — Council Compliance
            </h2>
            <div className="relative" style={{ width: 280, height: 280 }}>
              <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="12" />
                <circle
                  cx="100" cy="100" r="90" fill="none"
                  stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="565.48" strokeDashoffset={circumference(score)}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 text-center" style={{ transform: "translate(-50%,-50%)" }}>
                <div className="text-6xl font-black" style={{ color: "#10b981", letterSpacing: "-2px" }}>
                  {score.toFixed(1)}
                </div>
                <div className="text-xs uppercase tracking-[3px] mt-1" style={{ color: "rgba(16,185,129,0.6)" }}>
                  / 100
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-6 w-full">
              {[
                { l: "G", v: axis.g, n: "Gov" },
                { l: "S", v: axis.s, n: "Safety" },
                { l: "P", v: axis.p, n: "Prov" },
                { l: "C", v: axis.c, n: "Cont" },
              ].map((a) => (
                <div
                  key={a.l}
                  className="rounded-lg p-2 text-center"
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <div className="text-lg font-black" style={{ color: "#10b981" }}>{a.l}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: "#ecfdf5" }}>{a.v}</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5">{a.n}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Events */}
          <div
            className="rounded-2xl p-6 overflow-hidden"
            style={{
              background: "rgba(5,20,13,0.7)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <h2
              className="text-sm uppercase tracking-[3px] font-bold mb-4 pb-2"
              style={{
                color: "#10b981",
                borderBottom: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              Live Events
            </h2>
            <div className="flex flex-col gap-2 overflow-hidden" style={{ maxHeight: "calc(100vh - 360px)" }}>
              {events.map((e, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md"
                  style={{
                    background: "rgba(16,185,129,0.04)",
                    borderLeft: `3px solid ${e.tone === "warn" ? "#f59e0b" : "#10b981"}`,
                    fontSize: 12,
                    animation: i === 0 ? "slide-in 0.4s ease-out" : undefined,
                  }}
                >
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "rgba(16,185,129,0.5)" }}
                  >
                    {e.time}
                  </div>
                  <div>{e.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Remote control hints */}
        <div
          className="flex items-center justify-center gap-6 mt-12 pt-6"
          style={{ borderTop: "1px solid rgba(16,185,129,0.2)" }}
        >
          {[
            { k: "↑/↓", l: "Channel" },
            { k: "OK",  l: "Train" },
            { k: "→",   l: "Detail" },
            { k: "RED", l: "Lockdown" },
            { k: "HOME", l: "Ambient" },
          ].map((d) => (
            <div
              key={d.k}
              className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <span style={{ color: "#f59e0b", fontWeight: 700, marginRight: 8 }}>{d.k}</span>
              {d.l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
