import React from 'react';
import MythologyLayer, { MythologyCard } from '../../components/MythologyLayer';

const Mythology = () => {
  return (
    <div className="page-container" style={{ padding: 0 }}>
      <MythologyLayer />
      <section style={{
        background: '#161B22',
        padding: '32px 24px',
        borderTop: '1px solid #2D333B',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 18,
            color: '#A371F7',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            The Harness Insight
          </h2>
          <p style={{ color: '#E6EDF3', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Markets don't pay for models. Markets pay for:
          </p>
          <ul style={{ color: '#8B949E', fontSize: 14, lineHeight: 1.8, paddingLeft: 24 }}>
            <li><strong style={{ color: '#FFC72C' }}>Orchestration</strong> — what CSOAI already does</li>
            <li><strong style={{ color: '#3FB950' }}>Governance</strong> — what Councilof.ai already does</li>
            <li><strong style={{ color: '#2F81F7' }}>Integration</strong> — what your MCP packs already do</li>
            <li><strong style={{ color: '#A371F7' }}>Trust</strong> — what your blockchain verification already does</li>
          </ul>
          <p style={{
            color: '#FFC72C',
            fontSize: 15,
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 24,
          }}>
            "Models don't matter anymore. The harness is everything."
          </p>
        </div>
      </section>
    </div>
  );
};

export default Mythology;