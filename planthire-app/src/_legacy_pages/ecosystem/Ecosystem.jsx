import React from 'react';
import './Ecosystem.css';

const Ecosystem = ({ currentPlatform }) => {
  const platforms = [
    {
      name: 'councilof.ai',
      title: 'Democratic AI Governance',
      description: 'Council of 12 AIs voting on every decision with ensemble learning',
      icon: '🏛️',
      url: 'https://councilof.ai'
    },
    {
      name: 'proofof.ai',
      title: 'Deepfake Detection',
      description: 'Advanced verification and content authenticity validation',
      icon: '🔍',
      url: 'https://proofof.ai'
    },
    {
      name: 'asisecurity.ai',
      title: 'ASI Security & Containment',
      description: 'Advanced security protocols for superintelligent AI systems',
      icon: '🛡️',
      url: 'https://asisecurity.ai'
    },
    {
      name: 'agisafe.ai',
      title: 'AGI Safety Protocols',
      description: 'Comprehensive safety measures for artificial general intelligence',
      icon: '⚡',
      url: 'https://agisafe.ai'
    },
    {
      name: 'transparencyof.ai',
      title: 'AI Transparency & Explainability',
      description: 'Making AI decisions understandable and interpretable',
      icon: '💡',
      url: 'https://transparencyof.ai'
    },
    {
      name: 'ethicalgovernanceof.ai',
      title: 'AI Ethics & Governance',
      description: 'Ethical frameworks and governance structures for responsible AI',
      icon: '⚖️',
      url: 'https://ethicalgovernanceof.ai'
    },
    {
      name: 'safetyof.ai',
      title: 'Comprehensive AI Safety',
      description: 'Holistic safety measures across all AI applications',
      icon: '🔒',
      url: 'https://safetyof.ai'
    },
    {
      name: 'accountabilityof.ai',
      title: 'AI Accountability Tracking',
      description: 'Auditing and accountability for AI decisions and actions',
      icon: '📊',
      url: 'https://accountabilityof.ai'
    },
    {
      name: 'biasdetectionof.ai',
      title: 'AI Bias Detection & Mitigation',
      description: 'Identifying and correcting biases in AI systems',
      icon: '⚖️',
      url: 'https://biasdetectionof.ai'
    },
    {
      name: 'dataprivacyof.ai',
      title: 'AI Data Privacy Protection',
      description: 'Protecting user data and ensuring privacy compliance',
      icon: '🔐',
      url: 'https://dataprivacyof.ai'
    },
    {
      name: 'suicidestop.ai',
      title: 'Mental Health Crisis Prevention',
      description: 'AI-powered mental health support and crisis intervention',
      icon: '💚',
      url: 'https://suicidestop.ai'
    }
  ];

  return (
    <div className="ecosystem-container">
      <header className="ecosystem-header">
        <h1>AI Safety Ecosystem</h1>
        <p>11 Specialized Platforms Working Together for Comprehensive AI Safety</p>
      </header>

      <section className="ecosystem-overview">
        <h2>How It Works</h2>
        <p>
          The AI Safety Empire is a comprehensive ecosystem of 11 specialized platforms, 
          each focusing on a critical aspect of AI safety and governance. Together, they 
          form the world's first democratic AI governance system powered by a Council of 12 AIs.
        </p>
      </section>

      <section className="ecosystem-grid">
        {platforms.map(platform => (
          <div 
            key={platform.name}
            className={`ecosystem-card ${platform.name === currentPlatform ? 'current' : ''}`}
          >
            <div className="card-icon">{platform.icon}</div>
            <h3>{platform.title}</h3>
            <p>{platform.description}</p>
            {platform.name === currentPlatform ? (
              <span className="current-badge">You are here</span>
            ) : (
              <a href={platform.url} className="visit-button">
                Visit Platform →
              </a>
            )}
          </div>
        ))}
      </section>

      <section className="ecosystem-benefits">
        <h2>Why an Ecosystem Approach?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>🎯 Specialized Expertise</h3>
            <p>Each platform focuses on one critical aspect of AI safety</p>
          </div>
          <div className="benefit-card">
            <h3>🔗 Interconnected</h3>
            <p>All platforms work together through the Council of AIs</p>
          </div>
          <div className="benefit-card">
            <h3>🛡️ Comprehensive Coverage</h3>
            <p>No single point of failure, complete AI safety coverage</p>
          </div>
          <div className="benefit-card">
            <h3>⚡ Ensemble Learning</h3>
            <p>12 AIs voting democratically on every decision</p>
          </div>
        </div>
      </section>

      <section className="ecosystem-cta">
        <h2>Ready to Experience the Full Ecosystem?</h2>
        <p>Explore all 11 platforms and see how they work together for comprehensive AI safety</p>
        <a href="https://councilof.ai" className="cta-button">
          Start with councilof.ai →
        </a>
      </section>
    </div>
  );
};

export default Ecosystem;

