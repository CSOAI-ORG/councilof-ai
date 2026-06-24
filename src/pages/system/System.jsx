import React from 'react';

const card = { background: 'rgba(8,13,20,0.6)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '14px', padding: '18px 20px' };

const PARTS = [
  { n: 'Council', d: 'A weighted multi-model council reaches a verdict; a tie-breaking judge resolves splits. Ties are flagged unattestable and never signed.' },
  { n: 'Sigil signing', d: 'Winning verdicts are Ed25519-signed at the edge — every governed decision carries a verifiable signature.' },
  { n: 'Sovereign ledger', d: 'Signed episodes append to a Merkle ledger; the root is Bitcoin-anchored via OpenTimestamps. Tamper-evident by construction.' },
  { n: 'Layer 0', d: 'Identity, policy and proof — the substrate the eight trust layers resolve to. CSOAI is Layer 0.' },
];

const System = () => (
  <div style={{ color: '#e7f6ef' }}>
    <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
      <div className="container">
        <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>CSOAI · System Architecture</div>
        <h1 className="gradient-text">How the system fits together</h1>
        <p className="subtitle">Council → signature → anchored ledger → Layer 0. One governed path, end to end.</p>
      </div>
    </section>

    <section style={{ padding: '8px 0 36px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          {PARTS.map((p, i) => (
            <div key={p.n} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16,185,129,0.14)', color: '#34d399', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{i + 1}</span>
                <strong style={{ fontSize: '16px' }}>{p.n}</strong>
              </div>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ padding: '0 0 48px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <a href="/opengridworks" style={{ ...card, textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>🌐</div>
            <strong style={{ color: '#e7f6ef' }}>See it on the grid</strong>
            <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>The live globe — frameworks, sovereign nodes and Sovereign Town.</p>
          </a>
          <a href="/layer0" style={{ ...card, textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>🧱</div>
            <strong style={{ color: '#e7f6ef' }}>Layer 0</strong>
            <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>The eight trust layers and the substrate beneath them.</p>
          </a>
          <a href="https://proofof-site.vercel.app/sovereign-town/anchor.json" target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔗</div>
            <strong style={{ color: '#e7f6ef' }}>Verify the chain</strong>
            <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>The signed, Bitcoin-anchored Sovereign Town ledger.</p>
          </a>
        </div>
      </div>
    </section>

    <section className="cta-section" style={{ textAlign: 'center', padding: '0 0 64px' }}>
      <div className="container">
        <h2>Build on the system</h2>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="/contact" className="btn primary">Get Started</a>
          <a href="/how-it-works" className="btn secondary">How It Works</a>
        </div>
      </div>
    </section>
  </div>
);

export default System;
