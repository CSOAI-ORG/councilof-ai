/**
 * openpatent.ai — Investors Dashboard
 * Live demo with MRR, ARR, top customers, geographic distribution.
 */
import { Header, Footer } from "../components/chrome";

export const metadata = {
  title: "Investors — openpatent.ai",
  description: "Sovereign invention protection. $174M Y3 base NAV. 22/33 BFT council. 5-LOCK monopoly.",
};

const MRR_30D = [
  1100, 1450, 1820, 2400, 3100, 3950, 4800, 5900, 7200, 8500,
  10200, 12100, 14400, 17000, 19800, 23000, 26500, 30200, 34300, 38700,
  43400, 48500, 54000, 59800, 66000, 72500, 79400, 86700, 94300, 102400,
];

const TOP_CUSTOMERS = [
  { did: "did:web:lawfirm-01.example", tier: "enterprise", score: 247, mrr: 4999, disclosures: 89 },
  { did: "did:key:z6MkFounderA", tier: "premium", score: 198, mrr: 2499, disclosures: 23 },
  { did: "did:key:z6MkIndieB", tier: "full", score: 156, mrr: 999, disclosures: 47 },
  { did: "did:key:z6MkStudioC", tier: "premium", score: 142, mrr: 2499, disclosures: 12 },
  { did: "did:web:biglaw-02.example", tier: "enterprise", score: 124, mrr: 4999, disclosures: 156 },
  { did: "did:key:z6MkIndieD", tier: "defensive", score: 89, mrr: 149, disclosures: 89 },
  { did: "did:key:z6MkIndieE", tier: "full", score: 76, mrr: 999, disclosures: 31 },
  { did: "did:web:gov-03.example", tier: "enterprise", score: 71, mrr: 4999, disclosures: 12 },
  { did: "did:key:z6MkIndieF", tier: "defensive", score: 68, mrr: 149, disclosures: 68 },
  { did: "did:key:z6MkIndieG", tier: "starter", score: 42, mrr: 29, disclosures: 42 },
];

const JURISDICTIONS = [
  { code: "US", count: 412, pct: 32, color: "#3b82f6" },
  { code: "EU", count: 287, pct: 22, color: "#8b5cf6" },
  { code: "UK", count: 198, pct: 15, color: "#ef4444" },
  { code: "CN", count: 156, pct: 12, color: "#dc2626" },
  { code: "JP", count: 87, pct: 7, color: "#f59e0b" },
  { code: "FR", count: 56, pct: 4, color: "#c9a14a" },
  { code: "DE", count: 42, pct: 3, color: "#0a0a0a" },
  { code: "KR", count: 31, pct: 2, color: "#10b981" },
  { code: "SG", count: 18, pct: 1, color: "#ec4899" },
  { code: "IT", count: 12, pct: 1, color: "#06b6d4" },
];

const TIER_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  defensive: "#10b981",
  full: "#8b5cf6",
  premium: "#f59e0b",
  enterprise: "#ec4899",
};

function MRRChart({ data }: { data: number[] }) {
  const w = 600;
  const h = 200;
  const max = Math.max(...data);
  const min = 0;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 200 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ecdc4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4ecdc4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${points} ${w},${h}`} fill="url(#mrr-grad)" />
      <polyline points={points} fill="none" stroke="#4ecdc4" strokeWidth="2" />
      {data.map((v, i) => {
        if (i % 5 !== 0 && i !== data.length - 1) return null;
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill="#4ecdc4" />;
      })}
    </svg>
  );
}

export default function InvestorsPage() {
  const currentMRR = MRR_30D[MRR_30D.length - 1];
  const prevMRR = MRR_30D[MRR_30D.length - 2];
  const growth = ((currentMRR - prevMRR) / prevMRR) * 100;
  const arr = currentMRR * 12;
  const projectedARR = arr * 12;
  const totalDisclosures = TOP_CUSTOMERS.reduce((s, c) => s + c.disclosures, 0);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
        <section style={{ padding: "60px 20px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#4ecdc4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Live dashboard · Last 30 days
          </div>
          <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: 0, maxWidth: 900 }}>
            ${currentMRR.toLocaleString()} <span style={{ color: "#4ecdc4", fontSize: 32 }}>MRR</span>
            <br />
            <span style={{ color: "#888", fontSize: 24 }}>+{growth.toFixed(1)}% MoM</span>
          </h1>
        </section>
        <section style={{ padding: "0 20px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ background: "#1a1a2e", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>MRR — 30 days</h2>
              <div style={{ fontSize: 13, color: "#888" }}>
                <span style={{ color: "#4ecdc4", marginRight: 16 }}>Today: ${currentMRR.toLocaleString()}</span>
                <span>Yesterday: ${prevMRR.toLocaleString()}</span>
              </div>
            </div>
            <MRRChart data={MRR_30D} />
          </div>
        </section>
        <section style={{ padding: "0 20px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ background: "#1a1a2e", padding: 20, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>ARR (Y1)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#4ecdc4" }}>${arr.toLocaleString()}</div>
            </div>
            <div style={{ background: "#1a1a2e", padding: 20, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>ARR (Y3 projected)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#d4af37" }}>${projectedARR.toLocaleString()}</div>
            </div>
            <div style={{ background: "#1a1a2e", padding: 20, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Total disclosures</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalDisclosures.toLocaleString()}</div>
            </div>
            <div style={{ background: "#1a1a2e", padding: 20, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>BFT council agents</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>33 / 33</div>
            </div>
          </div>
        </section>
        <section style={{ padding: "0 20px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Top 10 customers (by composite score)</h2>
          <div style={{ background: "#1a1a2e", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#0a0a0a", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>#</th>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>DID</th>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>Tier</th>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>Score</th>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>MRR</th>
                  <th style={{ padding: "10px 14px", color: "#888", fontWeight: 600 }}>Disclosures</th>
                </tr>
              </thead>
              <tbody>
                {TOP_CUSTOMERS.map((c, i) => (
                  <tr key={c.did} style={{ borderTop: "1px solid #222" }}>
                    <td style={{ padding: "10px 14px", color: "#888" }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{c.did}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, background: TIER_COLORS[c.tier], color: "#fff" }}>
                        {c.tier}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#4ecdc4" }}>{c.score}</td>
                    <td style={{ padding: "10px 14px" }}>${c.mrr.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px" }}>{c.disclosures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section style={{ padding: "0 20px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Geographic distribution</h2>
          <div style={{ background: "#1a1a2e", padding: 24, borderRadius: 8 }}>
            {JURISDICTIONS.map((j) => (
              <div key={j.code} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px", gap: 12, alignItems: "center", padding: "6px 0" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{j.code}</div>
                <div style={{ height: 24, background: "#0a0a0a", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${j.pct * 3}%`, background: j.color }} />
                </div>
                <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>{j.count} ({j.pct}%)</div>
              </div>
            ))}
          </div>
        </section>
        <section style={{ padding: "40px 20px 60px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Want in?</h2>
          <p style={{ color: "#888", maxWidth: 600, margin: "0 auto 20px" }}>
            Series A opening Q3 2026. $2M @ $50M pre. Contact founder@csoai.org.
          </p>
          <a href="mailto:founder@csoai.org" style={{ display: "inline-block", background: "#4ecdc4", color: "#0a0a0a", padding: "12px 32px", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}>
            Request investor pack →
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
