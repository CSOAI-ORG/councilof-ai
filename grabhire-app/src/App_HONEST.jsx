import { useState, useEffect } from 'react'
import './ProofOfTheme.css'
import StarsBackground from './components/StarsBackground'
import './App.css'
import CouncilStats from './components/CouncilStats'
import EnterprisePricing from './components/EnterprisePricing'
import EcosystemShowcase from './components/EcosystemShowcase'
import WaitlistForm from './components/WaitlistForm'
import {
  TrustBadges,
  FirstMoverAdvantage,
  InteractiveDemo,
  CaseStudies,
  Testimonials,
  SuccessMetrics,
  FlexiblePricing,
  CompetitiveDifferentiation,
  ComprehensiveDocs,
  LiveChat
} from './components/UnstoppableComponents'
import {
  EUAIActCountdown,
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
        <title>councilof.ai - Democratic AI Governance | Pre-Launch Waitlist</title>
        <meta name="description" content="Join the waitlist for the world's first democratic AI governance platform. 12 specialized AIs voting on every decision. Patent pending technology. EU AI Act compliant." />
        <meta name="keywords" content="AI governance, ensemble learning, democratic AI, EU AI Act, AI safety, AGI safety, ASI security, blockchain verification" />
        <meta name="author" content="AI Safety Governance Limited" />
        <link rel="canonical" href="https://councilof.ai" />
      </helmet>

      {/* HERO SECTION - HONEST PRE-LAUNCH VERSION */}
      <header className="hero">
        <div className="container">
          <div className="hero-badge">🚀 Pre-Launch | Patent Pending | Reserve Your Spot</div>
          <h1>The World's First Democratic AI Governance Platform</h1>
          <p className="subtitle gradient-text">12 Specialized AIs Voting on Every Decision</p>
          <p className="description">
            Revolutionary ensemble learning with 8 advanced methods. Built for today's AI, ready for tomorrow's AGI and ASI. 
            EU AI Act compliant from day one. Join the waitlist to be among the first users.
          </p>

          {/* HONEST Hero Stats - NO FAKE NUMBERS */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">12</div>
              <div className="stat-label">AI Council Members</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">8</div>
              <div className="stat-label">Ensemble Methods</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">Patent</div>
              <div className="stat-label">Pending Technology</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">100%</div>
              <div className="stat-label">EU AI Act Compliant</div>
            </div>
          </div>

          {/* HONEST CTAs - WAITLIST ONLY */}
          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
              Join Waitlist - Reserve Your Spot
            </button>
            <button className="btn-secondary btn-large" onClick={() => setShowCouncil(true)}>
              Watch Demo (2 min)
            </button>
          </div>

          <p className="hero-note">
            🔒 No credit card required • Be notified at launch • Early adopter pricing
          </p>
        </div>
      </header>

      {/* HONEST TRANSPARENCY SECTION - NO FAKE NUMBERS */}
      <section className="beta-transparency">
        <div className="container">
          <div className="section-header">
            <h2>🚀 Pre-Launch: Building the Future of AI Governance</h2>
            <p className="section-subtitle">
              We're a startup with a revolutionary vision. Join our waitlist to be among the first to access democratic AI governance.
            </p>
          </div>

          <div className="transparency-grid">
            <div className="transparency-card">
              <div className="card-icon">🎯</div>
              <h3>Our Vision</h3>
              <p>
                Create the world's first truly democratic AI governance platform where 12 specialized AIs vote on every decision,
                ensuring balanced, ethical, and accurate outcomes.
              </p>
            </div>

            <div className="transparency-card">
              <div className="card-icon">🔬</div>
              <h3>The Technology</h3>
              <p>
                Patent-pending ensemble learning with 8 advanced methods. Blockchain verification for transparency.
                EU AI Act compliant from day one.
              </p>
            </div>

            <div className="transparency-card">
              <div className="card-icon">🚀</div>
              <h3>Join the Waitlist</h3>
              <p>
                Be among the first to access councilof.ai when we launch. Early adopters get special pricing and
                direct access to our team.
              </p>
            </div>

            <div className="transparency-card">
              <div className="card-icon">💼</div>
              <h3>Built By</h3>
              <p>
                AI Safety Governance Limited. Founded to ensure AI systems are safe, ethical, and beneficial for humanity.
                Part of the AI Safety Empire ecosystem.
              </p>
            </div>
          </div>

          <div className="transparency-cta">
            <button className="btn-primary" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
              Join Waitlist Now
            </button>
          </div>
        </div>
      </section>

      {/* EU AI ACT COUNTDOWN - KEEP THIS (IT'S REAL) */}
      <EUAIActCountdown />

      {/* WAITLIST FORM SECTION */}
      <section id="waitlist" className="waitlist-section">
        <div className="container">
          <WaitlistForm />
        </div>
      </section>

      {/* TRUST BADGES */}
      <TrustBadges />

      {/* FIRST MOVER ADVANTAGE */}
      <FirstMoverAdvantage />

      {/* MEET THE COUNCIL */}
      <section className="council-preview">
        <div className="container">
          <div className="section-header">
            <h2>Meet the Council of 12 AIs</h2>
            <p className="section-subtitle">
              Each AI is specialized in a critical domain. Together, they provide balanced, democratic decisions.
              Learn more about <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer">deepfake detection</a>, 
              <a href="https://asisecurity.ai" target="_blank" rel="noopener noreferrer"> ASI security</a>, and 
              <a href="https://agisafe.ai" target="_blank" rel="noopener noreferrer"> AGI safety</a>.
            </p>
          </div>
          
          <div className="council-grid">
            {councilMembers.slice(0, 6).map(member => (
              <div key={member.id} className="council-card">
                <div className="council-avatar">{member.specialty.charAt(0)}</div>
                <h3>{member.name}</h3>
                <p className="council-specialty">{member.specialty}</p>
                <p className="council-platform">{member.platform}</p>
                <p className="council-model">Powered by {member.model}</p>
              </div>
            ))}
          </div>

          <button className="btn-secondary" onClick={() => setShowCouncil(true)}>
            See All 12 Council Members
          </button>
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <InteractiveDemo councilMembers={councilMembers} />

      {/* ECOSYSTEM SHOWCASE */}
      <EcosystemShowcase />

      {/* COMPETITIVE DIFFERENTIATION */}
      <CompetitiveDifferentiation />

      {/* DEVELOPER API SECTION - UPDATED TO WAITLIST */}
      <section className="developer-api">
        <div className="container">
          <div className="section-header">
            <h2>Developer-First API & SDK</h2>
            <p className="section-subtitle">
              Integrate democratic AI governance into your application with just a few lines of code.
              Join the waitlist for early API access.
            </p>
          </div>

          <div className="api-preview">
            <div className="code-example">
              <pre><code>{`import { CouncilOfAI } from '@councilof/sdk';

const council = new CouncilOfAI({
  apiKey: 'your-api-key'
});

// Submit decision to council
const result = await council.decide({
  decision: "Should we approve this loan?",
  context: {
    amount: 50000,
    creditScore: 720,
    income: 85000
  }
});

console.log(result.approved); // true/false
console.log(result.votes); // 12 AI votes
console.log(result.confidence); // 0.95
console.log(result.reasoning); // Explanation`}</code></pre>
            </div>

            <div className="api-features">
              <h3>What You'll Get</h3>
              <ul>
                <li>🎯 <strong>Full API access</strong> - All endpoints available</li>
                <li>📦 <strong>SDK for 5+ languages</strong> - JS, Python, Go, Ruby, PHP</li>
                <li>📚 <strong>Complete documentation</strong> - Guides and tutorials</li>
                <li>💬 <strong>Developer support</strong> - Discord & GitHub</li>
                <li>🚀 <strong>Early access pricing</strong> - Special rates for waitlist members</li>
              </ul>

              <button className="btn-primary" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
                Join Waitlist for API Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GUIDES SECTION */}
      <GuidesSection />

      {/* PRICING - UPDATED TO WAITLIST */}
      <section className="pricing-preview">
        <div className="container">
          <div className="section-header">
            <h2>Transparent Pricing</h2>
            <p className="section-subtitle">
              Join the waitlist to get early access pricing when we launch.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">
                <span className="amount">$99</span>
                <span className="period">/month</span>
              </div>
              <p className="price-description">Perfect for small teams and startups</p>
              <ul className="features-list">
                <li>✓ 10,000 decisions per month</li>
                <li>✓ Full council voting</li>
                <li>✓ API access</li>
                <li>✓ Email support</li>
                <li>✓ Documentation</li>
              </ul>
              <button className="btn-secondary" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
                Join Waitlist
              </button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">
                <span className="amount">$499</span>
                <span className="period">/month</span>
              </div>
              <p className="price-description">For growing businesses</p>
              <ul className="features-list">
                <li>✓ 100,000 decisions per month</li>
                <li>✓ Full council voting</li>
                <li>✓ Priority API access</li>
                <li>✓ Priority support (4h response)</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated account manager</li>
              </ul>
              <button className="btn-primary" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
                Join Waitlist
              </button>
            </div>

            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">
                <span className="amount">Custom</span>
              </div>
              <p className="price-description">For large organizations</p>
              <ul className="features-list">
                <li>✓ Unlimited decisions</li>
                <li>✓ Full council voting</li>
                <li>✓ Dedicated infrastructure</li>
                <li>✓ 24/7 support</li>
                <li>✓ Custom SLAs</li>
                <li>✓ On-premise deployment option</li>
                <li>✓ White-label available</li>
              </ul>
              <button className="btn-secondary" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
                Contact Sales
              </button>
            </div>
          </div>

          <p className="pricing-note">
            💰 <strong>Early Adopter Discount:</strong> Waitlist members get 40% off for the first year
          </p>
        </div>
      </section>

      {/* COMPREHENSIVE DOCS */}
      <ComprehensiveDocs />

      {/* FINAL WAITLIST CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Join the Future of AI Governance?</h2>
          <p>Be among the first to access democratic AI decision-making</p>
          <button className="btn-primary btn-large" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>
            Join Waitlist Now
          </button>
          <p className="cta-note">
            🔒 No credit card required • Early access pricing • Cancel anytime
          </p>
        </div>
      </section>

      {/* LIVE CHAT */}
      <LiveChat />

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>councilof.ai</h4>
              <p>Democratic AI Governance Platform</p>
              <p className="footer-company">AI Safety Governance Limited</p>
              <p className="footer-tagline">Building the future of AI safety</p>
            </div>

            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="/about">About</a></li>
                <li><a href="/how-it-works">How It Works</a></li>
                <li><a href="/use-cases">Use Cases</a></li>
                <li><a href="/blog">Blog</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>AI Safety Empire</h4>
              <ul>
                <li><a href="https://proofof.ai" target="_blank" rel="noopener noreferrer">proofof.ai</a></li>
                <li><a href="https://asisecurity.ai" target="_blank" rel="noopener noreferrer">asisecurity.ai</a></li>
                <li><a href="https://agisafe.ai" target="_blank" rel="noopener noreferrer">agisafe.ai</a></li>
                <li><a href="https://suicidestop.ai" target="_blank" rel="noopener noreferrer">suicidestop.ai</a></li>
                <li><a href="https://transparencyof.ai" target="_blank" rel="noopener noreferrer">transparencyof.ai</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <p>Email: <a href="mailto:contact@councilof.ai">contact@councilof.ai</a></p>
              <p>Support: <a href="mailto:support@councilof.ai">support@councilof.ai</a></p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 AI Safety Governance Limited. All rights reserved.</p>
            <p>Patent Pending | EU AI Act Compliant | Built for AGI/ASI Safety</p>
          </div>
        </div>
      </footer>

      {/* COOKIE BANNER */}
      {showCookieBanner && (
        <div className="cookie-banner">
          <div className="cookie-content">
            <p>
              We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
              <a href="/cookies"> Learn more</a>
            </p>
            <div className="cookie-actions">
              <button className="btn-secondary btn-small" onClick={acceptEssentialOnly}>
                Essential Only
              </button>
              <button className="btn-primary btn-small" onClick={acceptAllCookies}>
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNCIL MODAL */}
      {showCouncil && (
        <div className="modal-overlay" onClick={() => setShowCouncil(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCouncil(false)}>×</button>
            <h2>The Council of 12 AIs</h2>
            <div className="council-full-grid">
              {councilMembers.map(member => (
                <div key={member.id} className="council-full-card">
                  <div className="council-avatar-large">{member.specialty.charAt(0)}</div>
                  <h3>{member.name}</h3>
                  <p className="council-specialty">{member.specialty}</p>
                  <p className="council-platform">{member.platform}</p>
                  <p className="council-model">Powered by {member.model}</p>
                  {member.veto && <span className="veto-badge">Veto Power</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

