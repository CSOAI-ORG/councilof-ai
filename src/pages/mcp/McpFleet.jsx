import React from 'react';

const card = { background: 'rgba(8,13,20,0.6)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '14px', padding: '18px 20px' };

const KINDS = [
  { i: '🛡️', n: 'Attestation', d: 'Sign and verify governed decisions; bind proofs to the sovereign ledger.' },
  { i: '⚖️', n: 'Compliance', d: 'Map systems to EU AI Act, NIST RMF, ISO 42001, TC260 and more — crosswalked.' },
  { i: '🔗', n: 'Protocol', d: 'Agent and data integrations that carry policy and identity across boundaries.' },
  { i: '📡', n: 'Data feed', d: 'Live regulation, deadlines and incident signals piped where you need them.' },
];

const McpFleet = () => (
  <div style={{ color: '#e7f6ef' }}>
    <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
      <div className="container">
        <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>CSOAI · MCP Fleet</div>
        <h1 className="gradient-text">A fleet of governance tools</h1>
        <p className="subtitle">Hundreds of MCP servers that put compliance, attestation and policy a call away.</p>
        <div style={{ marginTop: '18px' }}>
          <a href="https://app.csoai.org/mcp" className="btn primary">Browse the fleet →</a>
        </div>
      </div>
    </section>

    <section style={{ padding: '8px 0 36px' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>What's in the fleet</h2>
        <p style={{ textAlign: 'center', color: '#8aa2ad', marginTop: 0, marginBottom: '24px' }}>Connect any agent or app to governance primitives over MCP.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {KINDS.map((k) => (
            <div key={k.n} style={card}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{k.i}</div>
              <strong style={{ fontSize: '15px' }}>{k.n}</strong>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>{k.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ padding: '0 0 48px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
            Each server speaks the Model Context Protocol, so any compatible agent or assistant can call governance tools directly — sign a decision, check a framework, fetch a deadline — without bespoke glue.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a href="https://app.csoai.org/mcp" className="btn primary">Open the MCP fleet</a>
          </div>
        </div>
      </div>
    </section>

    <section className="cta-section" style={{ textAlign: 'center', padding: '0 0 64px' }}>
      <div className="container">
        <h2>Wire governance into your stack</h2>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="/contact" className="btn primary">Get Started</a>
          <a href="/system" className="btn secondary">System Architecture</a>
        </div>
      </div>
    </section>
  </div>
);

export default McpFleet;
