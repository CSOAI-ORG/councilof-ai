import React, { useEffect, useState } from 'react';

// Sovereign Town for V2 — the governed-vs-ungoverned moat, presented with the
// enterprise-trust playbook distilled from redhat.com: one crisp authority line,
// a single big proof-stat with an explicit cited source, a "governed against"
// frameworks wall (their customer-logo wall), a "why we anchor" trust narrative,
// a plain-language explainer cluster (their tech-topics hub, good for AEO/SEO),
// and a calm dual primary CTA. Self-contained inline styling + global theme classes.

const FRAMEWORKS = [
  'EU AI Act', 'NIST AI RMF', 'ISO 42001', 'TC260', 'DORA', 'NIS2',
  'EO 14110', 'Korea AI Basic Act', 'DPDP Act', 'Model AI Gov FW',
];

const STEPS = [
  { k: '01', t: 'Same agents, same incidents', d: 'One population of AI agents, one stream of real-world incidents — replayed identically across two worlds.' },
  { k: '02', t: 'One world governed, one not', d: 'World A runs under the CSOAI Sovereign Gate (Layer 0 enforced). World B runs ungoverned — the counterfactual.' },
  { k: '03', t: 'Governed → 0 as enforcement → 1', d: 'The result is monotonic: as enforcement approaches 1, governed violations approach 0. The gap is the moat.' },
];

const EXPLAINERS = [
  { t: 'What is Layer 0?', d: 'The governance substrate the eight trust layers stand on.', href: '/layer0' },
  { t: 'What is the Sovereign Gate?', d: 'The enforcement point every governed action passes through.', href: '/how-it-works' },
  { t: 'What is governed-vs-ungoverned?', d: 'A counterfactual measure of the harm governance prevents.', href: '/opengridworks' },
  { t: 'What is external anchoring?', d: 'Why every episode is Ed25519-signed and committed to Bitcoin.', href: 'https://proofof-site.vercel.app/sovereign-town/anchor.json' },
];

const card = {
  background: 'rgba(8,13,20,0.6)',
  border: '1px solid rgba(16,185,129,0.18)',
  borderRadius: '14px',
  padding: '18px 20px',
};

const SovereignTown = () => {
  const [ep, setEp] = useState(1446621120);
  const [ung, setUng] = useState(121043036);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetch('https://proofof-site.vercel.app/sovereign-town/status.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.cum_episodes === 'number') setEp(d.cum_episodes);
        if (typeof d.ungoverned_crimes === 'number') setUng(d.ungoverned_crimes);
        setLive(true);
      })
      .catch(() => setLive(false));
  }, []);

  const fmt = (n) => n.toLocaleString();

  return (
    <div className="sovereign-town-page" style={{ color: '#e7f6ef' }}>
      {/* Hero — one crisp authority line + dual primary CTA */}
      <section className="about-hero" style={{ textAlign: 'center', padding: '58px 0 18px' }}>
        <div className="container">
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#fbbf24', marginBottom: '10px' }}>
            CSOAI · Sovereign Town {live && <span style={{ color: '#34d399' }}>· LIVE</span>}
          </div>
          <h1 className="gradient-text">The world&rsquo;s first signed record of AI governance</h1>
          <p className="subtitle">
            Every governed action, signed and externally anchored. The governed-vs-ungoverned moat &mdash; running inside the OS, not a slide.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '18px' }}>
            <a href="/globe.html" className="btn primary">Run the governance test</a>
            <a href="https://proofof-site.vercel.app/sovereign-town/anchor.json" target="_blank" rel="noopener noreferrer" className="btn secondary">Verify the chain &uarr;</a>
          </div>
        </div>
      </section>

      {/* Single big proof stat band — with an explicit cited source (Red Hat move) */}
      <section style={{ padding: '14px 0 30px' }}>
        <div className="container">
          <div style={{ ...card, borderColor: 'rgba(251,191,36,0.28)', background: 'rgba(251,191,36,0.05)', textAlign: 'center', padding: '26px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '18px' }}>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#fcd34d', lineHeight: 1.1 }}>{fmt(ep)}+</div>
                <div style={{ color: '#9fb3ad', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Signed episodes</div>
              </div>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#f08a80', lineHeight: 1.1 }}>{fmt(ung)}</div>
                <div style={{ color: '#9fb3ad', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Ungoverned crimes (counterfactual)</div>
              </div>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#34d399', lineHeight: 1.1 }}>0</div>
                <div style={{ color: '#9fb3ad', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Governed crimes</div>
              </div>
            </div>
            <p style={{ color: '#8aa2ad', fontSize: '12.5px', marginTop: '20px', marginBottom: 0 }}>
              Source: Sovereign Town signed ledger &mdash; every episode Ed25519-signed and committed to <strong style={{ color: '#fcd34d' }}>Bitcoin block 954857</strong>. Independently verifiable.
            </p>
          </div>
        </div>
      </section>

      {/* "Governed against" — the frameworks wall (Red Hat's customer-logo wall) */}
      <section style={{ padding: '8px 0 34px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '4px' }}>Governed against the frameworks that matter</h2>
          <p style={{ color: '#8aa2ad', marginTop: 0, marginBottom: '20px' }}>
            Sovereign Town measures conduct against the binding and emerging regimes in force across 177 jurisdictions.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {FRAMEWORKS.map((f) => (
              <span key={f} style={{ ...card, padding: '9px 16px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px', color: '#cfe8df' }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How the moat works (Red Hat "understanding X") */}
      <section style={{ padding: '8px 0 36px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '6px' }}>How the moat works</h2>
          <p style={{ textAlign: 'center', color: '#8aa2ad', marginTop: 0, marginBottom: '24px' }}>
            A controlled, in-simulation experiment &mdash; not a claim.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {STEPS.map((s) => (
              <div key={s.k} style={card}>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>{s.k}</div>
                <strong style={{ fontSize: '15px' }}>{s.t}</strong>
                <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why we anchor — trust narrative (Red Hat "why we trust open source") */}
      <section style={{ padding: '8px 0 34px' }}>
        <div className="container">
          <div style={{ ...card, padding: '24px 26px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Why we anchor to Bitcoin</h2>
            <p style={{ color: '#9fb3ad', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              A governance record is only worth what it cannot be quietly rewritten. Every Sovereign Town episode is
              signed with an Ed25519 key and its hash is committed to the Bitcoin blockchain &mdash; so the record of what
              an AI did, and whether it was governed, becomes as tamper-evident as the chain itself. No trust in CSOAI
              required: the proof stands on its own. This is digital autonomy for AI oversight &mdash; control and protect
              critical decisions without asking anyone to take our word for it.
            </p>
          </div>
        </div>
      </section>

      {/* Explainer cluster (Red Hat tech-topics hub — AEO/SEO surface) */}
      <section style={{ padding: '8px 0 40px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Understand the moat</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {EXPLAINERS.map((e) => {
              const ext = e.href.startsWith('http');
              return (
                <a key={e.t} href={e.href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ ...card, textDecoration: 'none', display: 'block' }}>
                  <strong style={{ color: '#e7f6ef' }}>{e.t}</strong>
                  <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>{e.d}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ textAlign: 'center', padding: '8px 0 64px' }}>
        <div className="container">
          <h2>Put your AI on the record</h2>
          <p style={{ color: '#8aa2ad' }}>Run it under the Sovereign Gate &mdash; with real identity, policy, and proof.</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
            <a href="/contact" className="btn primary">Get Started</a>
            <a href="/opengridworks" className="btn secondary">See it on the grid</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SovereignTown;
