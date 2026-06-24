import React from 'react';

const card = { background: 'rgba(8,13,20,0.6)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '14px', padding: '18px 20px' };

const STEPS = [
  { k: 'P', n: 'Plan', d: 'Map your AI systems to the frameworks in force, set controls and name the owners.' },
  { k: 'D', n: 'Do', d: 'Operate under the controls — identity, policy gates and human escalation in the loop.' },
  { k: 'C', n: 'Check', d: 'Audit against tamper-evident records; surface drift, gaps and incidents early.' },
  { k: 'A', n: 'Act', d: 'Remediate, re-certify and feed lessons back into the next cycle. Repeat.' },
];

const SoaiPdca = () => (
  <div style={{ color: '#e7f6ef' }}>
    <section className="about-hero" style={{ textAlign: 'center', padding: '56px 0 18px' }}>
      <div className="container">
        <div style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px', color: '#34d399', marginBottom: '10px' }}>CSOAI · SOAI-PDCA</div>
        <h1 className="gradient-text">Governance as a loop</h1>
        <p className="subtitle">Plan · Do · Check · Act — continuous AI safety governance, not a one-off audit.</p>
      </div>
    </section>

    <section style={{ padding: '8px 0 36px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {STEPS.map((s) => (
            <div key={s.k} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(16,185,129,0.14)', color: '#34d399', fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '17px' }}>{s.k}</span>
                <strong style={{ fontSize: '16px' }}>{s.n}</strong>
              </div>
              <p style={{ color: '#9fb3ad', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#8aa2ad', fontSize: '13px', marginTop: '18px' }}>
          Every Check produces evidence; every Act is recorded. The loop is what keeps compliance true between audits.
        </p>
      </div>
    </section>

    <section className="cta-section" style={{ textAlign: 'center', padding: '0 0 64px' }}>
      <div className="container">
        <h2>Run the loop</h2>
        <p style={{ color: '#8aa2ad' }}>Start your first PDCA cycle with real controls and evidence.</p>
        <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
          <a href="https://app.csoai.org/pdca-simulator" className="btn primary">Try the simulator</a>
          <a href="/layer0" className="btn secondary">Layer 0</a>
        </div>
      </div>
    </section>
  </div>
);

export default SoaiPdca;
