import React from 'react';

const card = { background: 'rgba(8,13,20,0.6)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '14px', padding: '18px 20px' };

const TIERS = [
  { c: '#e2574c', n: 'Unacceptable', d: 'Banned outright — social scoring, manipulative or exploitative systems.' },
  { c: '#f5b942', n: 'High risk', d: 'Strict obligations — biometric ID, critical infrastructure, employment, essential services.' },
  { c: '#3b9ad8', n: 'Limited risk', d: 'Transparency duties — chatbots, deepfakes, emotion recognition must disclose.' },
  { c: '#10b981', n: 'Minimal risk', d: 'No mandatory obligations — most AI systems; voluntary codes encouraged.' },
];

const FreeRiskCheck = () => (
  <div style={{ color: '#e7f6ef' }}>
    <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
      <div className="container">
        <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>CSOAI · Free tool</div>
        <h1 className="gradient-text">Free Risk Check</h1>
        <p className="subtitle">Find your AI system's EU AI Act risk tier in minutes — no signup.</p>
        <div style={{ marginTop: '18px' }}>
          <a href="https://app.csoai.org/eu-ai-act-classifier" className="btn primary">Run the free check →</a>
        </div>
      </div>
    </section>

    <section style={{ padding: '8px 0 36px' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>The four risk tiers</h2>
        <p style={{ textAlign: 'center', color: '#8aa2ad', marginTop: 0, marginBottom: '24px' }}>The EU AI Act sorts every system into one of four bands.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          {TIERS.map((t) => (
            <div key={t.n} style={{ ...card, borderColor: `${t.c}55` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.c, boxShadow: `0 0 10px ${t.c}` }} />
                <strong style={{ fontSize: '15px' }}>{t.n}</strong>
              </div>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ padding: '0 0 48px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
            The classifier asks a short set of questions about your system's purpose and context, then maps you to a tier with the obligations that follow — and the deadline that applies. Article 50 transparency duties land <strong style={{ color: '#fbbf24' }}>2 Aug 2026</strong>.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="https://app.csoai.org/eu-ai-act-classifier" className="btn primary">Start the free check</a>
          </div>
        </div>
      </div>
    </section>

    <section className="cta-section" style={{ textAlign: 'center', padding: '0 0 64px' }}>
      <div className="container">
        <h2>Then make it compliant</h2>
        <p style={{ color: '#8aa2ad' }}>Know your tier, then put real governance under it.</p>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="/opengridworks" className="btn primary">See the Reg Map</a>
          <a href="/layer0" className="btn secondary">Layer 0</a>
        </div>
      </div>
    </section>
  </div>
);

export default FreeRiskCheck;
