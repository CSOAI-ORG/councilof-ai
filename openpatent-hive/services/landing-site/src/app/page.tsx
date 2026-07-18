import VerifyDemo from "./verify-demo";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="hdr">
        <div className="wrap hdr-inner">
          <div className="brand">
            <span className="dot" />
            <span>openpatent.ai</span>
          </div>
          <nav className="nav">
            <a href="#how">How it works</a>
            <a href="#industries">Industries</a>
            <a href="#pricing">Pricing</a>
            <a href="/domains">27 .ai Fleet</a>
            <a href="/dashboard">Dashboard</a>
            <a href="#legal">Legal</a>
            <a href="https://mcp.openpatent.ai">MCP</a>
            <a href="https://verify.openpatent.ai">Verify</a>
            <a href="https://github.com/CSOAI-ORG/patentmcp">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <span className="tag">Built on PatentMCP · 6-layer cryptographic proof</span>
          <h1>
            Disclose First. <br />
            <span className="accent">AI Second.</span>
          </h1>
          <p className="lede">
            Every time you paste your invention into Claude, ChatGPT, or Copilot, it gets logged.
            Retained. Potentially used to train models. What if the AI company patents something
            you invented?
            <br />
            <br />
            <strong style={{ color: "var(--ink)" }}>$10 disclosure → 6-layer blockchain proof → your invention is now permanent prior art.</strong>{" "}
            <em>Then</em> you use AI to refine it.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="https://api.openpatent.ai/v1/checkout/defensive">
              Disclose your first invention — $149
            </a>
            <a className="btn btn-secondary" href="#how">
              How it works
            </a>
          </div>

          <VerifyDemo />
        </div>
      </section>

      {/* How it works */}
      <section id="how">
        <div className="wrap">
          <h2>Four steps. Under a minute.</h2>
          <p className="lede">The simplest path from idea to immutable proof.</p>
          <div className="grid">
            <div className="card">
              <span className="pill">Step 1</span>
              <h3>Describe your invention</h3>
              <p>
                Title, description, supporting document (PDF, code, or just text). No patent
                lawyer needed.
              </p>
            </div>
            <div className="card">
              <span className="pill">Step 2</span>
              <h3>6-layer cryptographic proof</h3>
              <p>
                SHA-3/512 hash → HMAC witness → Ed25519 signature → Bitcoin OpenTimestamps →
                C2PA credential → hash-chained audit log.
              </p>
            </div>
            <div className="card">
              <span className="pill">Step 3</span>
              <h3>Anchored to Bitcoin</h3>
              <p>
                Your disclosure hash is committed to the Bitcoin blockchain via OpenTimestamps
                — permanently, immutably, court-admissibly.
              </p>
            </div>
            <div className="card">
              <span className="pill">Step 4</span>
              <h3>Use AI with confidence</h3>
              <p>
                Now safely use Claude, ChatGPT, or Copilot. Your invention is prior art that
                no one — not even an AI company — can patent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The AI risk */}
      <section style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <h2>The risk nobody is talking about</h2>
          <p className="lede">
            When you paste your invention into an AI chatbot, here's what happens:
          </p>
          <div className="grid">
            <div className="card">
              <h3>1. Your input gets logged</h3>
              <p>Retained indefinitely on the AI company's servers. Subject to human review.</p>
            </div>
            <div className="card">
              <h3>2. May train future models</h3>
              <p>
                Anthropic, OpenAI, Google: terms say "may use content to improve services."
                Your invention can become part of every future Claude / GPT / Gemini.
              </p>
            </div>
            <div className="card">
              <h3>3. They have timestamped proof of your idea</h3>
              <p>
                If they later file a patent covering similar territory, they have proof
                <em> they </em> knew about it. You don't.
              </p>
            </div>
            <div className="card" style={{ borderColor: "var(--accent)" }}>
              <h3 style={{ color: "var(--accent)" }}>→ Disclose first</h3>
              <p>
                $10 creates court-admissible proof that you were first. Recognized in 10+
                jurisdictions including China 2018, EU eIDAS, US FRE 902, France March 2025.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Industry Power Packs */}
      <section id="industries" style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <h2>4 industry power packs</h2>
          <p className="lede">
            White-label openpatent.ai for your vertical. Same sovereign VM, same 6-layer proof, same 33-agent BFT council.
          </p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <a href="/industries/legal" className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="pill" style={{ background: "#c9a14a", color: "#000" }}>legalof.ai</span>
              <h3>Legal Tech</h3>
              <p>Defensive disclosure for inventors, law firms, and patent attorneys. Prior art that holds up in court.</p>
            </a>
            <a href="/industries/gaming" className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="pill" style={{ background: "#ff5a87", color: "#fff" }}>harvi.ai</span>
              <h3>Gaming</h3>
              <p>Disclose game mechanics before your studio's NDA leaks. 30s from idea to Bitcoin-anchored.</p>
            </a>
            <a href="/industries/ip-castle" className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="pill" style={{ background: "#4ecdc4", color: "#000" }}>ipcastle.ai</span>
              <h3>IP Castle</h3>
              <p>33-agent BFT council review for high-value disclosures. Audit-grade chain of custody.</p>
            </a>
            <a href="/industries/sovereign-substrate" className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="pill" style={{ background: "#d4af37", color: "#000" }}>sovereign-temple.ai</span>
              <h3>Sovereign Substrate</h3>
              <p>Self-hosted, 100% sovereign. No cloud. CSOAI Ltd UK 16939677. MIT core, audit the code yourself.</p>
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="wrap">
          <h2>Pay only when you disclose.</h2>
          <p className="lede">No subscriptions. No seats. No enterprise contracts to negotiate.</p>
          <div className="pricing-grid">
            <div className="price-card">
              <h3>Free</h3>
              <div className="price">$0<small> / forever</small></div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Self-hosted. MIT licensed.</p>
              <ul>
                <li>Unlimited local disclosures</li>
                <li>SHA-3/512 + HMAC + Ed25519</li>
                <li>Community support</li>
              </ul>
            </div>
            <div className="price-card">
              <h3>Starter</h3>
              <div className="price">$29<small> / disclosure</small></div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Hosted. Public attestation.</p>
              <ul>
                <li>All Free features</li>
                <li>verify.openpatent.ai page</li>
                <li>C2PA Content Credential</li>
                <li>Registry entry (1yr)</li>
              </ul>
              <a className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }} href="https://api.openpatent.ai/v1/checkout/starter">
                Get Starter →
              </a>
            </div>
            <div className="price-card featured">
              <h3>Defensive</h3>
              <div className="price">$149<small> / disclosure</small></div>
              <p style={{ fontSize: 13, color: "var(--accent)" }}>Most popular.</p>
              <ul>
                <li>All Starter features</li>
                <li>Bitcoin OpenTimestamps anchor</li>
                <li>Polygon secondary anchor</li>
                <li>Priority support</li>
              </ul>
              <a className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }} href="https://api.openpatent.ai/v1/checkout/defensive">
                Get Defensive →
              </a>
            </div>
            <div className="price-card">
              <h3>Full</h3>
              <div className="price">$999<small> / disclosure</small></div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Investor-grade IP.</p>
              <ul>
                <li>All Defensive features</li>
                <li>5-jurisdiction crosswalk</li>
                <li>AI-assisted claim drafting</li>
                <li>Expedited Bitcoin confirmation</li>
              </ul>
              <a className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }} href="https://api.openpatent.ai/v1/checkout/full">
                Get Full →
              </a>
            </div>
            <div className="price-card">
              <h3>Premium</h3>
              <div className="price">$2,499<small> / disclosure</small></div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>BFT council review.</p>
              <ul>
                <li>All Full features</li>
                <li>33-agent BFT review</li>
                <li>IPFS pinning</li>
                <li>IP.com publication</li>
              </ul>
              <a className="btn btn-primary" style={{ marginTop: 14, display: "inline-block" }} href="https://api.openpatent.ai/v1/checkout/premium">
                Get Premium →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Legal trust */}
      <section id="legal" style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <h2>Court-admissible in 10+ jurisdictions.</h2>
          <p className="lede">
            This isn't a marketing claim. It's backed by specific statutes, judicial precedents,
            and treaty provisions.
          </p>
          <div className="badges">
            <span className="badge">US — 35 U.S.C. § 102 + FRE 902(13)(14)</span>
            <span className="badge">EU — eIDAS 910/2014 + 2.0</span>
            <span className="badge">UK — Patents Act 1977 + eIDAS</span>
            <span className="badge">CN — Hangzhou Internet Court 2018</span>
            <span className="badge">FR — Tribunal Marseille March 2025</span>
            <span className="badge">JP — Patent Act § 29(1)</span>
            <span className="badge">IT — Law 12/2019 Art. 8-ter</span>
            <span className="badge">WIPO — Blockchain for prior authorship</span>
            <span className="badge">Thaler v. Vidal (2022) — AI as tool, not inventor</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ftr">
        <div className="wrap ftr-inner">
          <div>
            <strong>openpatent.ai</strong> — Disclose First. AI Second. <br />
            Built by <a href="https://csoai.org">CSOAI</a> on PatentMCP (MIT). · Sovereign hive on the UK farm.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="https://mcp.openpatent.ai">MCP</a>
            <a href="https://verify.openpatent.ai">Verify</a>
            <a href="https://github.com/CSOAI-ORG/patentmcp">GitHub</a>
            <a href="https://csoai.org">CSOAI</a>
          </div>
        </div>
      </footer>
    </>
  );
}
