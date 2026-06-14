import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="gradient-text">About councilof.ai</h1>
          <p className="subtitle">The World's First Democratic AI Governance Platform</p>
        </div>
      </section>

      <section className="mission-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p className="large-text">
            To make AI trustworthy, transparent, and democratic through ensemble learning and blockchain verification.
          </p>
          <p>
            We believe that AI safety shouldn't be controlled by a handful of tech giants or locked in academic papers. 
            It should be democratic, transparent, and accessible to everyone. That's why we built the Council of 12 AIs—a 
            revolutionary system where specialized AI models vote democratically on every decision.
          </p>
        </div>
      </section>



      <section className="company-section">
        <div className="container">
          <h2>AI Safety Governments Limited</h2>
          <p>
            Registered in the United Kingdom, AI Safety Governments Limited operates the world's first comprehensive 
            AI safety ecosystem. We're building the infrastructure for trustworthy AI through:
          </p>
          <div className="company-pillars">
            <div className="pillar-card">
              <div className="pillar-icon">🏛️</div>
              <h3>Democratic Governance</h3>
              <p>12 specialized AIs voting on every decision, ensuring balanced and fair outcomes</p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">🔗</div>
              <h3>Blockchain Verification</h3>
              <p>Every AI decision logged immutably on Polygon blockchain for complete transparency</p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">🧠</div>
              <h3>Ensemble Learning</h3>
              <p>8 advanced methods combining multiple AI models for superior accuracy</p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">⚖️</div>
              <h3>EU AI Act Compliance</h3>
              <p>Built for regulatory compliance from day one, 18 months ahead of enforcement</p>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>🔍 Transparency</h3>
              <p>Every AI decision is explainable, auditable, and verifiable on blockchain</p>
            </div>
            <div className="value-item">
              <h3>🤝 Democracy</h3>
              <p>No single AI has absolute power. Decisions require supermajority consensus</p>
            </div>
            <div className="value-item">
              <h3>🛡️ Safety First</h3>
              <p>AI safety isn't optional—it's the foundation of everything we build</p>
            </div>
            <div className="value-item">
              <h3>🌍 Accessibility</h3>
              <p>AI safety tools should be available to everyone, not just tech giants</p>
            </div>
            <div className="value-item">
              <h3>🔬 Innovation</h3>
              <p>Patent-pending technology pushing the boundaries of AI governance</p>
            </div>
            <div className="value-item">
              <h3>📊 Accountability</h3>
              <p>Every decision is tracked, measured, and held to the highest standards</p>
            </div>
          </div>
        </div>
      </section>

      <section className="timeline-section">
        <div className="container">
          <h2>Our Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-date">2024 Q1</div>
              <div className="timeline-content">
                <h3>Concept & Research</h3>
                <p>Identified the need for democratic AI governance. Began researching ensemble learning methods.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">2024 Q2</div>
              <div className="timeline-content">
                <h3>Architecture Design</h3>
                <p>Designed the Council of 12 AIs system. Developed blockchain integration strategy.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">2024 Q3</div>
              <div className="timeline-content">
                <h3>Development Sprint</h3>
                <p>Built 4 smart contracts, Python & JavaScript SDKs, and backend infrastructure.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">2024 Q4</div>
              <div className="timeline-content">
                <h3>Platform Launch</h3>
                <p>Launched all 11 platforms. Patent application filed. Early adopter program begins.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">2025 Q1</div>
              <div className="timeline-content">
                <h3>Enterprise Adoption</h3>
                <p>First enterprise customers. SDK integrations. Strategic partnerships.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">2026 Aug</div>
              <div className="timeline-content">
                <h3>EU AI Act Enforcement</h3>
                <p>Our customers are ready 18 months ahead of regulatory deadlines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ecosystem-section">
        <div className="container">
          <h2>The AI Safety Empire</h2>
          <p className="section-subtitle">11 interconnected platforms, one unified mission</p>
          <div className="ecosystem-platforms">
            <a href="https://councilof.ai" className="platform-link">
              <div className="platform-icon">🏛️</div>
              <div className="platform-name">councilof.ai</div>
              <div className="platform-desc">Democratic Governance</div>
            </a>
            <a href="https://proofof.ai" className="platform-link">
              <div className="platform-icon">🔍</div>
              <div className="platform-name">proofof.ai</div>
              <div className="platform-desc">Deepfake Detection</div>
            </a>
            <a href="https://asisecurity.ai" className="platform-link">
              <div className="platform-icon">🛡️</div>
              <div className="platform-name">asisecurity.ai</div>
              <div className="platform-desc">Cybersecurity</div>
            </a>
            <a href="https://agisafe.ai" className="platform-link">
              <div className="platform-icon">🤖</div>
              <div className="platform-name">agisafe.ai</div>
              <div className="platform-desc">AGI Safety</div>
            </a>
            <a href="https://suicidestop.ai" className="platform-link">
              <div className="platform-icon">💚</div>
              <div className="platform-name">suicidestop.ai</div>
              <div className="platform-desc">Mental Health</div>
            </a>
            <a href="https://transparencyof.ai" className="platform-link">
              <div className="platform-icon">👁️</div>
              <div className="platform-name">transparencyof.ai</div>
              <div className="platform-desc">Explainability</div>
            </a>
            <a href="https://ethicalgovernanceof.ai" className="platform-link">
              <div className="platform-icon">⚖️</div>
              <div className="platform-name">ethicalgovernanceof.ai</div>
              <div className="platform-desc">Ethics</div>
            </a>
            <a href="https://safetyof.ai" className="platform-link">
              <div className="platform-icon">🦺</div>
              <div className="platform-name">safetyof.ai</div>
              <div className="platform-desc">Prevention</div>
            </a>
            <a href="https://accountabilityof.ai" className="platform-link">
              <div className="platform-icon">📊</div>
              <div className="platform-name">accountabilityof.ai</div>
              <div className="platform-desc">Responsibility</div>
            </a>
            <a href="https://biasdetectionof.ai" className="platform-link">
              <div className="platform-icon">🎯</div>
              <div className="platform-name">biasdetectionof.ai</div>
              <div className="platform-desc">Fairness</div>
            </a>
            <a href="https://dataprivacyof.ai" className="platform-link">
              <div className="platform-icon">🔒</div>
              <div className="platform-name">dataprivacyof.ai</div>
              <div className="platform-desc">Privacy</div>
            </a>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Join the AI Safety Revolution</h2>
          <p>Be part of the movement making AI trustworthy, transparent, and democratic.</p>
          <div className="cta-buttons">
            <a href="/#pricing" className="btn primary">Start Free Trial</a>
            <a href="/contact" className="btn secondary">Contact Us</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

