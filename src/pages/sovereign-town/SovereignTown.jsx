import React, { useEffect, useState } from 'react';
import { parseSovereignSimulationStatus } from './status-contract.mjs';

// Legacy Sovereign Town explanatory surface, with source-reported simulation values.
// A network response or hash does not independently verify authority, real-world effects,
// original signer, anchor inclusion or cross-jurisdiction legal conformance.

const FRAMEWORKS = [
  'EU AI Act', 'NIST AI RMF', 'ISO 42001', 'TC260', 'DORA', 'NIS2',
  'EO 14110', 'Korea AI Basic Act', 'DPDP Act', 'Model AI Gov FW',
];

const STEPS = [
  { k: '01', t: 'Define the same scenario', d: 'Hold the input assumptions, agent population and simulated environment constant in a paired experiment.' },
  { k: '02', t: 'Change the control condition', d: 'Compare the governed and baseline simulation arms with explicitly defined policies and limitations.' },
  { k: '03', t: 'Measure the difference', d: 'Record errors and uncertainty. A simulated difference does not prove prevented real-world harm.' },
];

const EXPLAINERS = [
  { t: 'What is Layer 0?', d: 'The governance substrate the eight trust layers stand on.', href: '/layer0' },
  { t: 'What is the Sovereign Gate?', d: 'The enforcement point every governed action passes through.', href: '/how-it-works' },
  { t: 'What is governed-vs-ungoverned?', d: 'A controlled simulation comparison. Estimated outcomes are not actual incidents.', href: '/opengridworks' },
  { t: 'What is an anchor reference?', d: 'A pointer for a separate verifier to inspect; its existence alone is not a validated Bitcoin inclusion proof.', href: 'https://proofof-site.vercel.app/sovereign-town/anchor.json' },
];

const card = {
  background: '#ffffff',
  border: '1px solid #b1d7c0',
  borderRadius: '14px',
  padding: '18px 20px',
};

const SovereignTown = () => {
  const [reported, setReported] = useState(null);
  const [sourceState, setSourceState] = useState('UNVERIFIED');

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://proofof-site.vercel.app/sovereign-town/status.json', {
      cache: 'no-store', signal: controller.signal, credentials: 'omit',
    })
      .then((r) => { if (!r.ok) throw new Error('Source unavailable'); return r.json(); })
      .then((d) => {
        const status = parseSovereignSimulationStatus(d);
        setReported({ episodes: status.episodes, ungoverned: status.hypotheticalViolations });
        setSourceState(status.evidence_state);
      })
      .catch(() => { if (!controller.signal.aborted) setSourceState('UNAVAILABLE_OR_UNCHECKABLE'); });
    return () => controller.abort();
  }, []);

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : 'Unknown';

  return (
    <div className="sovereign-town-page" style={{ color: '#123d2b', background: '#f6fbf7' }}>
      {/* Hero — one crisp authority line + dual primary CTA */}
      <section className="about-hero" style={{ textAlign: 'center', padding: '58px 0 18px' }}>
        <div className="container">
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#116a45', marginBottom: '10px' }}>
            CSOAI · Sovereign Town · {sourceState === 'SOURCE_REPORTED_NOT_INDEPENDENTLY_VERIFIED' ? 'SOURCE-REPORTED SIMULATION' : 'SOURCE UNVERIFIED'}
          </div>
          <h1>Explore a governed-versus-ungoverned simulation</h1>
          <p className="subtitle">
            Source-reported simulation outcomes and controls. This page does not establish real-world incidents, human approval, Bitcoin inclusion or legal compliance.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '18px' }}>
            <a href="/globe.html" className="btn primary">Explore the simulation</a>
            <a href="https://proofof-site.vercel.app/sovereign-town/anchor.json" target="_blank" rel="noopener noreferrer" className="btn secondary">Inspect source anchor reference</a>
          </div>
        </div>
      </section>

      {/* Single big proof stat band — with an explicit cited source (Red Hat move) */}
      <section style={{ padding: '14px 0 30px' }}>
        <div className="container">
          <div style={{ ...card, borderColor: 'rgba(22,133,77,0.28)', background: 'rgba(22,133,77,0.05)', textAlign: 'center', padding: '26px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '18px' }}>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#116a45', lineHeight: 1.1 }}>{fmt(reported?.episodes)}</div>
                <div style={{ color: '#3a6b55', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Source-reported simulation episodes</div>
              </div>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#ad4c42', lineHeight: 1.1 }}>{fmt(reported?.ungoverned)}</div>
                <div style={{ color: '#3a6b55', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Hypothetical violations, source-reported</div>
              </div>
              <div>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '30px', fontWeight: 700, color: '#0e8a52', lineHeight: 1.1 }}>Not established</div>
                <div style={{ color: '#3a6b55', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>Real-world effects / prevented harm</div>
              </div>
            </div>
            <p style={{ color: '#456d59', fontSize: '12.5px', marginTop: '20px', marginBottom: 0 }}>
              Status: {sourceState}. Totals, when available, are taken from a source response, not independently verified original episodes. No signature, issuer custody, Bitcoin inclusion or real-world effect was independently checked by this page.
            </p>
          </div>
        </div>
      </section>

      {/* "Governed against" — the frameworks wall (Red Hat's customer-logo wall) */}
      <section style={{ padding: '8px 0 34px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '4px' }}>Regulatory and governance references to review</h2>
          <p style={{ color: '#456d59', marginTop: 0, marginBottom: '20px' }}>
            Listed frameworks are research context only. Applicability, current legal text, adoption and conformity require separate qualified review.
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
          <p style={{ textAlign: 'center', color: '#456d59', marginTop: 0, marginBottom: '24px' }}>
            A controlled, in-simulation experiment &mdash; not a claim.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {STEPS.map((s) => (
              <div key={s.k} style={card}>
                <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#0e8a52', fontSize: '13px', marginBottom: '8px' }}>{s.k}</div>
                <strong style={{ fontSize: '15px' }}>{s.t}</strong>
                <p style={{ color: '#3a6b55', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why we anchor — trust narrative (Red Hat "why we trust open source") */}
      <section style={{ padding: '8px 0 34px' }}>
        <div className="container">
          <div style={{ ...card, padding: '24px 26px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px' }}>What evidence can and cannot prove</h2>
            <p style={{ color: '#3a6b55', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Independently checked signatures, exact content hashes and inclusion witnesses can support tamper-evident record keeping.
              A source URL or self-consistent digest alone cannot establish who performed an action, whether any human approved it,
              whether the predicted consequence occurred or whether an anchor was confirmed. External proof remains to be checked by
              the original verifier and custody owners.
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
                  <strong style={{ color: '#123d2b' }}>{e.t}</strong>
                  <p style={{ color: '#3a6b55', fontSize: '13.5px', lineHeight: 1.5, margin: '6px 0 0' }}>{e.d}</p>
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
          <p style={{ color: '#456d59' }}>Use an explicit method, an authorized reviewer and a separate effect observer before making a real-world claim.</p>
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
