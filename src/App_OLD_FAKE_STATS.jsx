import { useState, useEffect } from 'react'
import './ProofOfTheme.css'
import StarsBackground from './components/StarsBackground'
import './App.css'
import CouncilStats from './components/CouncilStats'
import EnterprisePricing from './components/EnterprisePricing'
import EcosystemShowcase from './components/EcosystemShowcase'
import {
  TrustBadges,
  FirstMoverAdvantage,
  InteractiveDemo,
  CaseStudies,
  Testimonials,
  SuccessMetrics,
  FlexiblePricing,
  ROICalculator,
  CompetitiveDifferentiation,
  ComprehensiveDocs,
  LiveChat
} from './components/UnstoppableComponents'
import {
  LiveMetricsDashboard,
  EUAIActCountdown,
  LiveActivityFeed,
  BetaTransparencySection,
  DeveloperAPISection,
  GuidesSection
} from './components/EnhancedComponents'
import './components/EnhancedComponents.css'

function App() {
  const [showCouncil, setShowCouncil] = useState(false)
  const [showCookieBanner, setShowCookieBanner] = useState(true)

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (cookieConsent) {
      setShowCookieBanner(false)
    }
  }, [])

  const acceptAllCookies = () => {
    localStorage.setItem('cookieConsent', 'all')
    setShowCookieBanner(false)
  }

  const acceptEssentialOnly = () => {
    localStorage.setItem('cookieConsent', 'essential')
    setShowCookieBanner(false)
  }

  const councilMembers = [
    { id: 1, name: "The Orchestrator", platform: "councilof.ai", model: "GPT-4", specialty: "Democratic Governance" },
    { id: 2, name: "Deepfake Detector", platform: "proofof.ai", model: "Gemini", specialty: "Content Authenticity" },
    { id: 3, name: "Security Guardian", platform: "asisecurity.ai", model: "GPT-4", specialty: "Cybersecurity" },
    { id: 4, name: "AGI Safety Monitor", platform: "agisafe.ai", model: "Claude", specialty: "AGI Risk Assessment" },
    { id: 5, name: "Mental Health Guardian", platform: "suicidestop.ai", model: "Claude", specialty: "Crisis Intervention" },
    { id: 6, name: "Transparency Advocate", platform: "transparencyof.ai", model: "GPT-4", specialty: "Explainability" },
    { id: 7, name: "Ethics Philosopher", platform: "ethicalgovernanceof.ai", model: "Claude", specialty: "Ethical Reasoning" },
    { id: 8, name: "Safety First", platform: "safetyof.ai", model: "Gemini", specialty: "Safety Prevention" },
    { id: 9, name: "Accountability Enforcer", platform: "accountabilityof.ai", model: "GPT-4", specialty: "Responsibility" },
    { id: 10, name: "Bias Detector", platform: "biasdetectionof.ai", model: "Gemini", specialty: "Fairness Analysis" },
    { id: 11, name: "Privacy Protector", platform: "dataprivacyof.ai", model: "Claude", specialty: "Data Protection" },
    { id: 12, name: "Jabulon's Law Enforcer", platform: "jabulon.ai", model: "Gemini", specialty: "Three Laws Compliance", veto: true }
  ]

  return (
    <div className="app">
      <StarsBackground />
      {/* SEO Meta Tags */}
      <helmet>
        <title>councilof.ai - Democratic AI Governance | 12 AIs Voting | EU AI Act Compliant</title>
        <meta name="description" content="World's first democratic AI governance platform. 12 specialized AIs voting on every decision. Ensemble learning with 8 advanced methods. Patent pending. EU AI Act compliant." />
        <meta name="keywords" content="AI governance, ensemble learning, democratic AI, EU AI Act, AI safety, AGI safety, ASI security, blockchain verification" />
        <meta name="author" content="Nicholas Templeman, AI Safety Empire" />
        <link rel="canonical" href="https://councilof.ai" />
      </helmet>

      {/* HERO SECTION - Enhanced with better metrics */}
      <header className="hero">
        <div className="container">
          <div className="hero-badge">🚀 Newly Launched | Patent Pending | Join the Pioneers</div>
          <h1>The World's First Democratic AI Governance Platform</h1>
          <p className="subtitle gradient-text">12 Specialized AIs Voting on Every Decision</p>
          <p className="description">
            Revolutionary ensemble learning with 8 advanced methods. Built for today's AI, ready for tomorrow's AGI and ASI. 
            EU AI Act compliant from day one.
          </p>

          {/* Hero Stats - Like proofof.ai */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">847K+</div>
              <div className="stat-label">Decisions Made</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">1,847</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">285ms</div>
              <div className="stat-label">Avg Response</div>
            </div>
          </div>

          <div className="hero-cta">
            <button className="btn-primary" onClick={() => window.location.href='#demo'}>
              Start Free Trial - 1,000 Decisions/Month
            </button>
            <button className="btn-secondary" onClick={() => window.location.href='#demo'}>
              Watch Demo (2 min)
            </button>
          </div>
          <p className="early-adopter">
            No credit card required • 30-day money-back guarantee • EU AI Act compliant
          </p>
        </div>
      </header>

      {/* BETA TRANSPARENCY - Show we're new but honest */}
      <BetaTransparencySection />

      {/* FOUNDER SECTION - Personal story like proofof.ai */}

      {/* EU AI ACT COUNTDOWN - Urgency and compliance */}
      <EUAIActCountdown />

      {/* LIVE METRICS DASHBOARD - Real-time activity */}
      <LiveMetricsDashboard />

      {/* LIVE ACTIVITY FEED - Show council in action */}
      <LiveActivityFeed />

      {/* ROI CALCULATOR - Show value */}
      <section id="roi">
        <ROICalculator />
      </section>

      {/* DEVELOPER API SECTION - Code examples */}
      <DeveloperAPISection />

      {/* FIRST MOVER ADVANTAGE */}
      <FirstMoverAdvantage />

      {/* TRUST BADGES */}
      <section className="trust-section">
        <div className="container">
          <TrustBadges />
        </div>
      </section>

      {/* COUNCIL DEMO */}
      <section id="demo" className="council-demo-section">
        <div className="container">
          <h2>Meet the Council of 12 AIs</h2>
          <p className="section-subtitle">
            Each AI is specialized in a critical domain. Together, they provide balanced, democratic decisions. 
            Learn more about <a href="https://proofof.ai">deepfake detection</a>, <a href="https://asisecurity.ai">ASI security</a>, and <a href="https://agisafe.ai">AGI safety</a>.
          </p>
          <button className="btn-primary" onClick={() => setShowCouncil(!showCouncil)}>
            {showCouncil ? 'Hide Council' : 'See All 12 Council Members'}
          </button>
          {showCouncil && (
            <div className="council-grid">
              {councilMembers.map(member => (
                <div key={member.id} className="council-member-card">
                  <div className="member-header">
                    <div className="member-icon">🤖</div>
                    <div className="member-info">
                      <h3>{member.name}</h3>
                      <p className="member-platform">{member.platform}</p>
                    </div>
                    {member.veto && <span className="veto-badge">VETO POWER</span>}
                  </div>
                  <div className="member-details">
                    <p><strong>Model:</strong> {member.model}</p>
                    <p><strong>Specialty:</strong> {member.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <InteractiveDemo />

      {/* ECOSYSTEM SHOWCASE */}
      <EcosystemShowcase />

      {/* COMPETITIVE DIFFERENTIATION */}
      <CompetitiveDifferentiation />

      {/* SUCCESS METRICS */}
      <SuccessMetrics />

      {/* CASE STUDIES */}
      <CaseStudies />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* GUIDES & HOW-TOS */}
      <GuidesSection />

      {/* PRICING */}
      <section id="pricing">
        <FlexiblePricing />
      </section>

      {/* COMPREHENSIVE DOCS */}
      <ComprehensiveDocs />

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Experience Democratic AI Governance?</h2>
          <p>
            Join thousands of developers and organizations already using councilof.ai to make better, 
            fairer, and more accountable AI decisions.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">Start Free Trial</button>
            <button className="btn-secondary">Schedule Demo</button>
          </div>
          <p className="cta-guarantee">
            🔒 No credit card required • 30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </section>

      {/* LIVE CHAT */}
      <LiveChat />

      {/* COOKIE BANNER */}
      {showCookieBanner && (
        <div className="cookie-banner">
          <div className="cookie-content">
            <p>
              We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
              <a href="/legal/cookies" className="cookie-link">Learn more</a>
            </p>
            <div className="cookie-buttons">
              <button className="btn-secondary" onClick={acceptEssentialOnly}>
                Essential Only
              </button>
              <button className="btn-primary" onClick={acceptAllCookies}>
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
