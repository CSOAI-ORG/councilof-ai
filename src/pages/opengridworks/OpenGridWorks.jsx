import React from 'react';

// OpenGridWorks (Reg Map) for V2 — hosts the live immersive governance globe
// (served at /globe.html: MapLibre 3D grid + Sovereign Town live feed) inside a
// framed React route, with a layer explainer and cross-links. Self-contained
// inline styling; hero + CTA reuse the global ProofOfTheme classes.

const LAYERS = [
  { c: '#e2574c', name: 'Jurisdictions', desc: 'Every country, coloured by the frameworks in force.' },
  { c: '#10b981', name: 'Sovereign-AI', desc: 'National models and clouds — the sovereign nodes.' },
  { c: '#34d399', name: 'MCP fleet', desc: 'Governance tool servers mapped across the grid.' },
  { c: '#fbbf24', name: 'Sovereign Town', desc: 'The governed-vs-ungoverned moat — signed and anchored.' },
];

const card = {
  background: 'rgba(8,13,20,0.6)',
  border: '1px solid rgba(16,185,129,0.18)',
  borderRadius: '14px',
  padding: '18px 20px',
};

const OpenGridWorks = () => {
  return (
    <div className="opengridworks-page" style={{ color: '#e7f6ef' }}>
      <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
        <div className="container">
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>
            CSOAI · Reg Map
          </div>
          <h1 className="gradient-text">OpenGridWorks</h1>
          <p className="subtitle">AI regulation across 177 jurisdictions — live, on one immersive globe.</p>
        </div>
      </section>

      <section style={{ padding: '8px 0 28px' }}>
        <div className="container">
          <div style={{ ...card, padding: 0, overflow: 'hidden', position: 'relative' }}>
            <iframe
              src="/globe.html"
              title="CSOAI OpenGridWorks — AI Governance Grid + Sovereign Town"
              style={{ width: '100%', height: '78vh', minHeight: 520, border: 0, display: 'block', background: '#05080e' }}
              loading="lazy"
            />
          </div>
          <p style={{ textAlign: 'center', color: '#8aa2ad', fontSize: '12.5px', marginTop: '10px' }}>
            Drag to spin · scroll to zoom · click a jurisdiction for its frameworks, Layer 0 controls and sovereign node ·
            <a href="/globe.html" style={{ color: '#34d399', marginLeft: '6px' }}>open full-screen ↗</a>
          </p>
        </div>
      </section>

      <section style={{ padding: '8px 0 36px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>What you're looking at</h2>
          <p style={{ textAlign: 'center', color: '#8aa2ad', marginTop: 0, marginBottom: '24px' }}>
            Toggle each layer from the globe's side rail.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            {LAYERS.map((l) => (
              <div key={l.name} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: l.c, boxShadow: `0 0 10px ${l.c}` }} />
                  <strong style={{ fontSize: '15px' }}>{l.name}</strong>
                </div>
                <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '8px 0 48px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <a href="/layer0" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>🧱</div>
              <strong style={{ color: '#e7f6ef' }}>Layer 0</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                The governance substrate the eight trust layers stand on.
              </p>
            </a>
            <a href="https://proofof-site.vercel.app/sovereign-town/anchor.json" target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔗</div>
              <strong style={{ color: '#e7f6ef' }}>Verify the chain</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                Sovereign Town's signed ledger — Ed25519-signed, Bitcoin-anchored.
              </p>
            </a>
            <a href="/how-it-works" style={{ ...card, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📐</div>
              <strong style={{ color: '#e7f6ef' }}>How it works</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>
                How the council reaches a verdict and how every decision is recorded.
              </p>
            </a>
          </div>
        </div>
      </section>

      <section className="cta-section" style={{ textAlign: 'center', padding: '8px 0 64px' }}>
        <div className="container">
          <h2>Govern on the grid</h2>
          <p style={{ color: '#8aa2ad' }}>Put your AI on the map — with real identity, policy and proof.</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
            <a href="/contact" className="btn primary">Get Started</a>
            <a href="/layer0" className="btn secondary">See Layer 0</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OpenGridWorks;
