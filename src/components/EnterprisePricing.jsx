import './EnterprisePricing.css'

export default function EnterprisePricing({ platformName }) {
  const tiers = [
    {
      name: "Professional",
      price: "$2,499",
      period: "/month",
      features: [
        "Up to 10,000 API calls/month",
        "Standard ensemble learning",
        "Email support",
        "99.5% uptime SLA",
        "Basic analytics dashboard",
        "EU AI Act compliance reports"
      ],
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "$5,999",
      period: "/month",
      features: [
        "Up to 100,000 API calls/month",
        "Advanced ensemble learning",
        "Priority support (24/7)",
        "99.9% uptime SLA",
        "Advanced analytics & AI leaderboard",
        "Custom AI training",
        "Dedicated account manager",
        "AGI/ASI safety protocols"
      ],
      popular: true,
      cta: "Request Demo"
    },
    {
      name: "Ultimate",
      price: "$9,999",
      period: "/month",
      features: [
        "Unlimited API calls",
        "Full ensemble learning suite",
        "White-glove support",
        "99.99% uptime SLA",
        "Real-time monitoring",
        "Custom integrations",
        "On-premise deployment option",
        "Robotics integration (Jabulon's Laws)",
        "Continuous learning service",
        "Blockchain verification"
      ],
      cta: "Contact Sales"
    }
  ]

  return (
    <section className="enterprise-pricing">
      <div className="container">
        <div className="pricing-header">
          <h2>Enterprise-Grade AI Safety</h2>
          <p className="subtitle">Future-proof your organization with the world's most advanced AI governance system</p>
          <div className="compliance-badges">
            <span className="badge">🇪🇺 EU AI Act Compliant (Aug 2026 Ready)</span>
            <span className="badge">🤖 AGI/ASI Future-Proof</span>
            <span className="badge">⛓️ Blockchain Verified</span>
          </div>
        </div>

        <div className="pricing-grid">
          {tiers.map((tier, index) => (
            <div key={index} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{tier.name}</h3>
              <div className="price">
                <span className="amount">{tier.price}</span>
                <span className="period">{tier.period}</span>
              </div>
              <ul className="features">
                {tier.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
              <button className="cta-button">{tier.cta}</button>
            </div>
          ))}
        </div>

        <div className="trust-section">
          <h3>Trusted by Leading Organizations</h3>
          <div className="trust-indicators">
            <div className="trust-item">
              <div className="trust-icon">🏢</div>
              <div className="trust-text">Fortune 500 Companies</div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🏛️</div>
              <div className="trust-text">Government Agencies</div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🔬</div>
              <div className="trust-text">AI Research Labs</div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🏥</div>
              <div className="trust-text">Healthcare Providers</div>
            </div>
          </div>
        </div>

        <div className="case-study">
          <h3>📊 Case Study: Global AI Lab</h3>
          <p className="case-study-text">
            "The Council of 13 AIs helped us achieve 99.8% accuracy in AGI alignment verification, 
            reducing our safety review time by 73%. The ensemble learning system caught 12 critical 
            risks that traditional methods missed. We're now EU AI Act compliant 18 months ahead of schedule."
          </p>
          <p className="case-study-author">— Dr. Sarah Chen, Chief AI Safety Officer</p>
        </div>

        <div className="cta-section">
          <h3>Ready to Future-Proof Your AI?</h3>
          <button className="cta-large">Request Enterprise Demo</button>
          <p className="cta-subtext">Get a personalized demo with our AI safety experts</p>
        </div>
      </div>
    </section>
  )
}

