import React from 'react';

// Layer 0 — CSOAI as the governance substrate beneath the 8 trust layers.
// Self-contained styling (inline) so the page renders correctly regardless of
// page-level CSS; hero + CTA reuse the global ProofOfTheme classes for consistency.

const LAYERS = [
  { k: 'A', name: 'Identity', desc: 'Verifiable identity for every agent, model and operator.' },
  { k: 'B', name: 'Certification', desc: 'Independent certification that a system meets its claims.' },
  { k: 'C', name: 'Policy', desc: 'Machine-readable policy bound to each jurisdiction in force.' },
  { k: 'D', name: 'Cross-Region', desc: 'Handoff and recognition of trust across borders.' },
  { k: 'E', name: 'Finance', desc: 'Accountable value flows and incentives for safe behaviour.' },
  { k: 'F', name: 'Audit', desc: 'Tamper-evident records that withstand independent review.' },
  { k: 'G', name: 'Human-in-loop', desc: 'Escalation paths that keep a human accountable.' },
  { k: 'H', name: 'Legacy', desc: 'Bridges to existing standards, registries and systems.' },
];

const card = {
  background: 'rgba(8,13,20,0.6)',
  border: '1px solid rgba(16,185,129,0.18)',
  borderRadius: '14px',
  padding: '20px',
};

const Layer0 = () => {
  return (
    <div className="layer0-page" style={{ color: '#e7f6ef' }}>
      <section className="about-hero" style={{ textAlign: 'center', padding: '64px 0 24px' }}>
        <div className="container">
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>
            CSOAI · The foundation layer
          </div>
          <h1 className="gradient-text">Layer 0</h1>
          <p className="subtitle">The governance substrate every other layer of AI trust stands on.</p>
        </div>
      </section>

      <section style={{ padding: '12px 0' }}>
        <div className="container" style={{ maxWidth: '880px' }}>
          <div style={{ ...card, padding: '24px 26px' }}>
            <p style={{ fontSize: '18px', lineHeight: 1.6, margin: 0 }}>
              Every framework, certificate and audit assumes something underneath it is true: that
              the identities are real, the policy is current, and the record can't be quietly
              rewritten. <strong style={{ color: '#34d399' }}>CSOAI is Layer 0</strong> — the trust
              substrate the eight layers above depend on. Get Layer 0 wrong and everything stacked
              on top inherits the flaw.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '36px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>The 8 Trust Layers</h2>
          <p style={{ textAlign: 'center', color: '#8aa2ad', marginTop: 0, marginBottom: '28px' }}>
            Each one resolves to Layer 0.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            {LAYERS.map((l) => (
              <div key={l.k} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(16,185,129,0.14)', color: '#34d399', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                    {l.k}
                  </span>
                  <strong style={{ fontSize: '16px' }}>{l.name}</strong>
                </div>
                <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ ...card, marginTop: '18px', borderColor: 'rgba(251,191,36,0.28)', background: 'rgba(251,191,36,0.05)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '11px', color: '#fbbf24' }}>
              Layer 0 · CSOAI
            </div>
            <p style={{ margin: '6px 0 0', color: '#e7f6ef' }}>
              Identity, policy and proof — the bedrock the eight layers resolve to.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 0 48px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>See Layer 0 working</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <a href="/globe.html" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>🌐</div>
              <strong style={{ color: '#e7f6ef' }}>OpenGridWorks Globe</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                The live governance grid — frameworks, sovereign nodes and Sovereign Town on one
                immersive 3D map.
              </p>
            </a>
            <a href="https://proofof-site.vercel.app/sovereign-town/anchor.json" target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔗</div>
              <strong style={{ color: '#e7f6ef' }}>Verify the chain</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                Sovereign Town's signed ledger — Ed25519-signed, Bitcoin-anchored. Layer 0 proof you
                can check yourself.
              </p>
            </a>
            <a href="/how-it-works" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📐</div>
              <strong style={{ color: '#e7f6ef' }}>How it works</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                How the council reaches a verdict and how every signed decision is recorded.
              </p>
            </a>
          </div>
        </div>
      </section>

      <section className="cta-section" style={{ textAlign: 'center', padding: '24px 0 64px' }}>
        <div className="container">
          <h2>Build on Layer 0</h2>
          <p style={{ color: '#8aa2ad' }}>Put real identity, policy and proof under your AI.</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
            <a href="/contact" className="btn primary">Get Started</a>
            <a href="/how-it-works" className="btn secondary">How It Works</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Layer0;
