import './EcosystemShowcase.css'

export default function EcosystemShowcase() {
  const platforms = [
    {
      name: "ProofOf.AI",
      domain: "proofof.ai",
      tagline: "Blockchain Content Verification",
      description: "Cryptographic proof of content authenticity. Combat deepfakes with immutable blockchain verification.",
      icon: "🔷",
      status: "live",
      features: ["Deepfake Detection", "Blockchain Anchoring", "Content Verification"]
    },
    {
      name: "ASISecurity.AI",
      domain: "asisecurity.ai",
      tagline: "Advanced AI Security",
      description: "Enterprise-grade security for ASI/AGI systems. Real-time threat detection and model integrity monitoring.",
      icon: "🛡️",
      status: "live",
      features: ["Threat Detection", "Model Integrity", "AI Security"]
    },
    {
      name: "AGISafe.AI",
      domain: "agisafe.ai",
      tagline: "AGI Safety Protocols",
      description: "Alignment verification and safety protocols for artificial general intelligence systems.",
      icon: "🤖",
      status: "live",
      features: ["Alignment Verification", "Safety Protocols", "AGI Monitoring"]
    },
    {
      name: "SuicideStop.AI",
      domain: "suicidestop.ai",
      tagline: "Crisis Support & Mental Health",
      description: "AI-powered crisis detection and prevention. 24/7 mental health support with professional escalation.",
      icon: "💚",
      status: "live",
      features: ["Crisis Detection", "24/7 Support", "Professional Network"]
    },
    {
      name: "TransparencyOf.AI",
      domain: "transparencyof.ai",
      tagline: "AI Explainability",
      description: "Make AI decisions transparent and understandable. Complete audit trails and decision explanations.",
      icon: "🔍",
      status: "live",
      features: ["Decision Transparency", "Audit Trails", "Explainability"]
    },
    {
      name: "EthicalGovernanceOf.AI",
      domain: "ethicalgovernanceof.ai",
      tagline: "Ethical AI Governance",
      description: "Philosophical and ethical analysis of AI decisions. Moral reasoning and policy governance.",
      icon: "⚖️",
      status: "live",
      features: ["Ethical Analysis", "Moral Reasoning", "Policy Governance"]
    },
    {
      name: "SafetyOf.AI",
      domain: "safetyof.ai",
      tagline: "General AI Safety",
      description: "Comprehensive AI safety protocols. Risk assessment and prevention strategies for all AI systems.",
      icon: "🦺",
      status: "live",
      features: ["Risk Assessment", "Safety Protocols", "Prevention Strategies"]
    },
    {
      name: "AccountabilityOf.AI",
      domain: "accountabilityof.ai",
      tagline: "AI Accountability",
      description: "Track responsibility and accountability for AI decisions. Compliance reporting and metrics.",
      icon: "📊",
      status: "live",
      features: ["Responsibility Tracking", "Compliance Reports", "Accountability Metrics"]
    },
    {
      name: "BiasDetectionOf.AI",
      domain: "biasdetectionof.ai",
      tagline: "Fairness & Bias Detection",
      description: "Detect and mitigate bias in AI systems. Ensure fairness across all demographics.",
      icon: "⚡",
      status: "live",
      features: ["Bias Detection", "Fairness Analysis", "Mitigation Strategies"]
    },
    {
      name: "DataPrivacyOf.AI",
      domain: "dataprivacyof.ai",
      tagline: "Data Privacy Protection",
      description: "Protect user privacy in AI systems. GDPR compliance and data governance.",
      icon: "🔒",
      status: "live",
      features: ["Privacy Protection", "GDPR Compliance", "Data Governance"]
    },
    {
      name: "Jabulon.AI",
      domain: "jabulon.ai",
      tagline: "Robotics Safety (Jabulon's Laws)",
      description: "Three Laws enforcement for physical AI and robotics. Emergency stop capabilities.",
      icon: "🦾",
      status: "coming_soon",
      features: ["Three Laws", "Physical AI Safety", "Emergency Stop"]
    }
  ]

  return (
    <section className="ecosystem-showcase">
      <div className="container">
        <div className="showcase-header">
          <h2>🌐 The Complete AI Safety Ecosystem</h2>
          <p className="subtitle">
            11 specialized AI platforms working together under democratic governance. 
            Each platform is a specialized AI in the Council, voting on decisions that affect the entire ecosystem.
          </p>
          <div className="ecosystem-stats">
            <div className="stat">
              <div className="stat-number">11</div>
              <div className="stat-label">Specialized Platforms</div>
            </div>
            <div className="stat">
              <div className="stat-number">12</div>
              <div className="stat-label">Council AIs</div>
            </div>
            <div className="stat">
              <div className="stat-number">8</div>
              <div className="stat-label">Ensemble Methods</div>
            </div>
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Blockchain Verified</div>
            </div>
          </div>
        </div>

        <div className="platforms-grid">
          {platforms.map((platform, index) => (
            <div key={index} className={`platform-card ${platform.status}`}>
              <div className="platform-icon">{platform.icon}</div>
              <h3>{platform.name}</h3>
              <div className="platform-tagline">{platform.tagline}</div>
              <p className="platform-description">{platform.description}</p>
              <div className="platform-features">
                {platform.features.map((feature, i) => (
                  <span key={i} className="feature-tag">✓ {feature}</span>
                ))}
              </div>
              <div className="platform-actions">
                {platform.status === 'live' ? (
                  <a 
                    href={`https://${platform.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="platform-link"
                  >
                    Visit Platform →
                  </a>
                ) : (
                  <span className="coming-soon-badge">Coming Q2 2025</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="ecosystem-benefits">
          <h3>Why the Ecosystem Approach?</h3>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-icon">🧠</div>
              <h4>Ensemble Learning</h4>
              <p>All platforms learn from each other, improving accuracy and safety over time</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🔄</div>
              <h4>Continuous Improvement</h4>
              <p>Auto-scraping of regulations and research keeps all platforms up-to-date</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🗳️</div>
              <h4>Democratic Governance</h4>
              <p>No single AI makes decisions alone - 83% supermajority required</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🔮</div>
              <h4>Future-Proof</h4>
              <p>Ready for AGI, ASI, and robotics from day one</p>
            </div>
          </div>
        </div>

        <div className="integration-cta">
          <h3>Integrate the Entire Ecosystem</h3>
          <p>One API. All 11 platforms. Complete AI safety coverage.</p>
          <div className="cta-buttons">
            <button className="btn-primary-large">Request Enterprise Demo</button>
            <button className="btn-secondary-large">View API Documentation</button>
          </div>
        </div>
      </div>
    </section>
  )
}

