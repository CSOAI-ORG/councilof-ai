import React from 'react';

const card = { background: 'rgba(8,13,20,0.6)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '14px', padding: '20px', textDecoration: 'none', display: 'block' };

const VIEWS = [
  { i: '🌐', n: 'OpenGridWorks Globe', d: 'The live 3D governance grid — frameworks, sovereign nodes, MCP fleet and Sovereign Town on one immersive map.', href: '/opengridworks' },
  { i: '🗺️', n: 'World Reg Map', d: 'AI regulation across 177 jurisdictions — click any country for the frameworks in force.', href: 'https://app.csoai.org/opengridworks' },
  { i: '⏱️', n: 'Deadline Radar', d: 'Every upcoming AI-law deadline worldwide, counted down.', href: 'https://app.csoai.org/radar' },
  { i: '🧱', n: 'Layer 0', d: 'The governance substrate the eight trust layers stand on.', href: '/layer0' },
];

const Atlas = () => (
  <div style={{ color: '#e7f6ef' }}>
    <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
      <div className="container">
        <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>CSOAI · Atlas</div>
        <h1 className="gradient-text">The governance atlas</h1>
        <p className="subtitle">Every way to navigate AI regulation — the grid, the map, the radar, the substrate.</p>
      </div>
    </section>

    <section style={{ padding: '8px 0 52px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {VIEWS.map((v) => (
            <a key={v.n} href={v.href} style={card}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{v.i}</div>
              <strong style={{ color: '#e7f6ef', fontSize: '17px' }}>{v.n}</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '8px 0 0' }}>{v.d}</p>
              <span style={{ color: '#34d399', fontSize: '13px', display: 'inline-block', marginTop: '10px' }}>Open →</span>
            </a>
          ))}
        </div>
      </div>
    </section>

    <section className="cta-section" style={{ textAlign: 'center', padding: '0 0 64px' }}>
      <div className="container">
        <h2>Put your AI on the map</h2>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="/contact" className="btn primary">Get Started</a>
          <a href="/opengridworks" className="btn secondary">Open the Globe</a>
        </div>
      </div>
    </section>
  </div>
);

export default Atlas;
