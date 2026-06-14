import React, { useState } from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="how-it-works-page">
      <section className="hiw-hero">
        <div className="container">
          <h1 className="gradient-text">How councilof.ai Works</h1>
          <p className="subtitle">Democratic AI Governance Through Ensemble Learning</p>
        </div>
      </section>

      <section className="tabs-section">
        <div className="container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'council' ? 'active' : ''}`}
              onClick={() => setActiveTab('council')}
            >
              Council of 12 AIs
            </button>
            <button 
              className={`tab ${activeTab === 'ensemble' ? 'active' : ''}`}
              onClick={() => setActiveTab('ensemble')}
            >
              Ensemble Learning
            </button>
            <button 
              className={`tab ${activeTab === 'blockchain' ? 'active' : ''}`}
              onClick={() => setActiveTab('blockchain')}
            >
              Blockchain
            </button>
            <button 
              className={`tab ${activeTab === 'integration' ? 'active' : ''}`}
              onClick={() => setActiveTab('integration')}
            >
              Integration
            </button>
          </div>
        </div>
      </section>

      {activeTab === 'overview' && (
        <section className="tab-content">
          <div className="container">
            <h2>System Overview</h2>
            <p className="intro-text">
              councilof.ai is the world's first democratic AI governance platform. Instead of trusting a single AI model, 
              we use 12 specialized AIs that vote on every decision. This ensemble approach provides superior accuracy, 
              transparency, and accountability.
            </p>

            <div className="process-flow">
              <div className="flow-step">
                <div className="step-number">1</div>
                <h3>Submit Decision</h3>
                <p>Your application sends a decision request via API, SDK, or dashboard</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">2</div>
                <h3>Council Deliberation</h3>
                <p>12 specialized AIs analyze the decision in parallel from different perspectives</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">3</div>
                <h3>Democratic Vote</h3>
                <p>Each AI casts a weighted vote based on confidence and past accuracy</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">4</div>
                <h3>Ensemble Learning</h3>
                <p>8 advanced methods combine votes for optimal decision</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">5</div>
                <h3>Blockchain Logging</h3>
                <p>Decision and votes logged immutably on Polygon blockchain</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-number">6</div>
                <h3>Return Result</h3>
                <p>Final decision with full transparency and audit trail</p>
              </div>
            </div>

            <div className="key-benefits">
              <h3>Key Benefits</h3>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">🎯</div>
                  <h4>Higher Accuracy</h4>
                  <p>Ensemble learning outperforms single models by 15-30%</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🔍</div>
                  <h4>Full Transparency</h4>
                  <p>See exactly how each AI voted and why</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">⚖️</div>
                  <h4>Democratic</h4>
                  <p>No single AI has absolute power</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🔗</div>
                  <h4>Blockchain Verified</h4>
                  <p>Immutable audit trail for compliance</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">⚡</div>
                  <h4>Fast Response</h4>
                  <p>Parallel processing delivers results in seconds</p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🛡️</div>
                  <h4>EU AI Act Ready</h4>
                  <p>Compliant with all transparency requirements</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'council' && (
        <section className="tab-content">
          <div className="container">
            <h2>The Council of 12 AIs</h2>
            <p className="intro-text">
              Each AI in the council is specialized in a critical domain. Together, they provide balanced, 
              well-rounded decisions that no single AI could achieve alone.
            </p>

            <div className="council-members">
              <div className="member-card">
                <div className="member-number">1</div>
                <h3>The Orchestrator</h3>
                <div className="member-platform">councilof.ai</div>
                <div className="member-model">GPT-4</div>
                <p><strong>Specialty:</strong> Democratic Governance</p>
                <p>Coordinates the council, ensures fair voting procedures, and maintains democratic principles.</p>
              </div>

              <div className="member-card">
                <div className="member-number">2</div>
                <h3>Deepfake Detector</h3>
                <div className="member-platform">proofof.ai</div>
                <div className="member-model">Gemini</div>
                <p><strong>Specialty:</strong> Content Authenticity</p>
                <p>Detects manipulated media, verifies content authenticity, and identifies deepfakes.</p>
              </div>

              <div className="member-card">
                <div className="member-number">3</div>
                <h3>Security Guardian</h3>
                <div className="member-platform">asisecurity.ai</div>
                <div className="member-model">GPT-4</div>
                <p><strong>Specialty:</strong> Cybersecurity</p>
                <p>Assesses security risks, identifies vulnerabilities, and ensures system protection.</p>
              </div>

              <div className="member-card">
                <div className="member-number">4</div>
                <h3>AGI Safety Monitor</h3>
                <div className="member-platform">agisafe.ai</div>
                <div className="member-model">Claude</div>
                <p><strong>Specialty:</strong> AGI Risk Assessment</p>
                <p>Monitors for AGI/ASI risks, assesses advanced AI capabilities, and ensures alignment.</p>
              </div>

              <div className="member-card">
                <div className="member-number">5</div>
                <h3>Mental Health Guardian</h3>
                <div className="member-platform">suicidestop.ai</div>
                <div className="member-model">Claude</div>
                <p><strong>Specialty:</strong> Crisis Intervention</p>
                <p>Identifies mental health risks, provides crisis support, and ensures responsible AI for vulnerable populations.</p>
              </div>

              <div className="member-card">
                <div className="member-number">6</div>
                <h3>Transparency Advocate</h3>
                <div className="member-platform">transparencyof.ai</div>
                <div className="member-model">GPT-4</div>
                <p><strong>Specialty:</strong> Explainability</p>
                <p>Ensures AI decisions are explainable, transparent, and understandable to humans.</p>
              </div>

              <div className="member-card">
                <div className="member-number">7</div>
                <h3>Ethics Philosopher</h3>
                <div className="member-platform">ethicalgovernanceof.ai</div>
                <div className="member-model">Claude</div>
                <p><strong>Specialty:</strong> Ethical Reasoning</p>
                <p>Evaluates ethical implications, ensures values alignment, and maintains moral standards.</p>
              </div>

              <div className="member-card">
                <div className="member-number">8</div>
                <h3>Safety First</h3>
                <div className="member-platform">safetyof.ai</div>
                <div className="member-model">Gemini</div>
                <p><strong>Specialty:</strong> Safety Prevention</p>
                <p>Identifies potential harms, implements safety measures, and prevents negative outcomes.</p>
              </div>

              <div className="member-card">
                <div className="member-number">9</div>
                <h3>Accountability Enforcer</h3>
                <div className="member-platform">accountabilityof.ai</div>
                <div className="member-model">GPT-4</div>
                <p><strong>Specialty:</strong> Responsibility</p>
                <p>Tracks accountability, ensures responsible AI practices, and maintains audit trails.</p>
              </div>

              <div className="member-card">
                <div className="member-number">10</div>
                <h3>Bias Detector</h3>
                <div className="member-platform">biasdetectionof.ai</div>
                <div className="member-model">Gemini</div>
                <p><strong>Specialty:</strong> Fairness Analysis</p>
                <p>Identifies biases, ensures fairness across demographics, and promotes equity.</p>
              </div>

              <div className="member-card">
                <div className="member-number">11</div>
                <h3>Privacy Protector</h3>
                <div className="member-platform">dataprivacyof.ai</div>
                <div className="member-model">Claude</div>
                <p><strong>Specialty:</strong> Data Protection</p>
                <p>Ensures GDPR compliance, protects user privacy, and secures sensitive data.</p>
              </div>

              <div className="member-card veto-card">
                <div className="member-number">12</div>
                <h3>Jabulon's Law Enforcer</h3>
                <div className="member-platform">jabulon.ai</div>
                <div className="member-model">Gemini</div>
                <p><strong>Specialty:</strong> Three Laws Compliance</p>
                <p><strong>⚡ VETO POWER:</strong> Ensures compliance with Jabulon's Three Laws of AI Safety. Can veto any decision that violates fundamental safety principles.</p>
              </div>
            </div>

            <div className="voting-rules">
              <h3>Voting Rules</h3>
              <ul>
                <li><strong>Supermajority Required:</strong> 10 out of 12 AIs (83.3%) must agree for approval</li>
                <li><strong>Weighted Voting:</strong> AIs with better track records get more influence</li>
                <li><strong>Confidence Weighting:</strong> High-confidence votes count more</li>
                <li><strong>Veto Power:</strong> Jabulon's Law Enforcer can veto decisions that violate safety principles</li>
                <li><strong>Transparency:</strong> All votes are recorded and explainable</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'ensemble' && (
        <section className="tab-content">
          <div className="container">
            <h2>8 Advanced Ensemble Learning Methods</h2>
            <p className="intro-text">
              We don't just collect votes—we use sophisticated ensemble learning techniques to combine AI decisions optimally.
            </p>

            <div className="ensemble-methods">
              <div className="method-card">
                <div className="method-icon">⚖️</div>
                <h3>1. Weighted Voting</h3>
                <p><strong>How it works:</strong> Each AI's vote is weighted based on its historical accuracy on similar decisions.</p>
                <p><strong>Why it matters:</strong> AIs that have proven expertise in specific domains get more influence. Meritocracy in action.</p>
                <p><strong>Example:</strong> The Security Guardian's vote counts more on cybersecurity decisions.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">🎯</div>
                <h3>2. Confidence Weighting</h3>
                <p><strong>How it works:</strong> AIs report confidence levels (0-100%). High-confidence votes count more.</p>
                <p><strong>Why it matters:</strong> Prevents uncertain majority from overruling confident experts.</p>
                <p><strong>Example:</strong> If 7 AIs vote "yes" with 60% confidence and 5 vote "no" with 95% confidence, the "no" votes may prevail.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">🧠</div>
                <h3>3. Meta-Learning</h3>
                <p><strong>How it works:</strong> A 13th AI learns from all 12 AIs' voting patterns and optimizes the ensemble.</p>
                <p><strong>Why it matters:</strong> The system gets smarter over time, learning which AI combinations work best.</p>
                <p><strong>Example:</strong> Meta-learner discovers that Ethics + Privacy + Bias Detection together catch 95% of fairness issues.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">⏰</div>
                <h3>4. Temporal Learning</h3>
                <p><strong>How it works:</strong> System learns from outcomes 6-12 months later, not just immediate results.</p>
                <p><strong>Why it matters:</strong> Some decisions have long-term consequences that aren't immediately apparent.</p>
                <p><strong>Example:</strong> A decision that seemed safe initially but caused issues 6 months later updates AI weights.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">⚔️</div>
                <h3>5. Adversarial Testing</h3>
                <p><strong>How it works:</strong> Red team AIs try to break the decision, blue team defends it.</p>
                <p><strong>Why it matters:</strong> Forces deeper reasoning and catches blind spots before deployment.</p>
                <p><strong>Example:</strong> Red team finds edge case where decision fails; blue team must address it or decision is rejected.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">🐝</div>
                <h3>6. Swarm Intelligence</h3>
                <p><strong>How it works:</strong> AIs form dynamic coalitions based on decision type, like bees swarming.</p>
                <p><strong>Why it matters:</strong> Emergent intelligence from AI collaboration exceeds individual capabilities.</p>
                <p><strong>Example:</strong> For privacy decisions, Privacy + Security + Ethics + Bias form a specialized swarm.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">🔄</div>
                <h3>7. Knowledge Transfer</h3>
                <p><strong>How it works:</strong> AIs teach each other across domains through cross-training.</p>
                <p><strong>Why it matters:</strong> System continuously improves as AIs learn from each other's expertise.</p>
                <p><strong>Example:</strong> Security Guardian teaches Bias Detector about adversarial attacks on fairness metrics.</p>
              </div>

              <div className="method-card">
                <div className="method-icon">❓</div>
                <h3>8. Uncertainty Quantification</h3>
                <p><strong>How it works:</strong> System knows when it doesn't know and asks humans for guidance.</p>
                <p><strong>Why it matters:</strong> No guessing on critical decisions. Human oversight when needed.</p>
                <p><strong>Example:</strong> If council is split 6-6 with low confidence, decision escalates to human review.</p>
              </div>
            </div>

            <div className="ensemble-stats">
              <h3>Proven Results</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">15-30%</div>
                  <div className="stat-label">Higher Accuracy vs. Single AI</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">95%+</div>
                  <div className="stat-label">Confidence on Clear Decisions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">8</div>
                  <div className="stat-label">Advanced Methods Combined</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Transparency & Explainability</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'blockchain' && (
        <section className="tab-content">
          <div className="container">
            <h2>Blockchain Verification</h2>
            <p className="intro-text">
              Every AI decision is logged immutably on the Polygon blockchain, creating a permanent audit trail 
              for compliance, transparency, and accountability.
            </p>

            <div className="blockchain-flow">
              <div className="blockchain-step">
                <h3>1. Decision Made</h3>
                <p>Council votes and reaches consensus on a decision</p>
              </div>
              <div className="flow-arrow-down">↓</div>
              <div className="blockchain-step">
                <h3>2. Data Hashed</h3>
                <p>Decision details, votes, and metadata are cryptographically hashed</p>
              </div>
              <div className="flow-arrow-down">↓</div>
              <div className="blockchain-step">
                <h3>3. Smart Contract Call</h3>
                <p>AIDecisionLogger smart contract is invoked on Polygon</p>
              </div>
              <div className="flow-arrow-down">↓</div>
              <div className="blockchain-step">
                <h3>4. Blockchain Confirmation</h3>
                <p>Transaction is confirmed and permanently recorded</p>
              </div>
              <div className="flow-arrow-down">↓</div>
              <div className="blockchain-step">
                <h3>5. Proof Generated</h3>
                <p>Cryptographic proof is generated and returned to user</p>
              </div>
            </div>

            <div className="smart-contracts">
              <h3>Our Smart Contracts</h3>
              <div className="contracts-grid">
                <div className="contract-card">
                  <h4>AIDecisionLogger</h4>
                  <p>Logs every AI decision with full vote breakdown, timestamps, and metadata</p>
                  <div className="contract-badge">Deployed on Polygon</div>
                </div>
                <div className="contract-card">
                  <h4>GovernanceVoting</h4>
                  <p>Manages council voting rules, supermajority requirements, and veto power</p>
                  <div className="contract-badge">Deployed on Polygon</div>
                </div>
                <div className="contract-card">
                  <h4>AEGISToken</h4>
                  <p>Governance token (100M supply) for platform voting and premium features</p>
                  <div className="contract-badge">ERC-20 Token</div>
                </div>
                <div className="contract-card">
                  <h4>JabulonCoin</h4>
                  <p>Community rewards token (1B supply) for participation and contributions</p>
                  <div className="contract-badge">ERC-20 Token</div>
                </div>
              </div>
            </div>

            <div className="blockchain-benefits">
              <h3>Why Blockchain?</h3>
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">🔒</div>
                  <div className="benefit-content">
                    <h4>Immutability</h4>
                    <p>Once logged, decisions cannot be altered or deleted. Perfect for compliance audits.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🔍</div>
                  <div className="benefit-content">
                    <h4>Transparency</h4>
                    <p>Anyone can verify decisions on the blockchain. Full public accountability.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚖️</div>
                  <div className="benefit-content">
                    <h4>EU AI Act Compliance</h4>
                    <p>Meets all regulatory requirements for AI decision logging and audit trails.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🛡️</div>
                  <div className="benefit-content">
                    <h4>Tamper-Proof</h4>
                    <p>Cryptographic proofs ensure data integrity. No one can fake or modify records.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <div className="benefit-content">
                    <h4>Low Cost</h4>
                    <p>Polygon's low gas fees make blockchain logging affordable at scale.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'integration' && (
        <section className="tab-content">
          <div className="container">
            <h2>Integration Options</h2>
            <p className="intro-text">
              Multiple ways to integrate councilof.ai into your application, from simple API calls to full SDK integration.
            </p>

            <div className="integration-options">
              <div className="integration-card">
                <h3>🔌 RESTful API</h3>
                <p><strong>Best for:</strong> Quick integration, any programming language</p>
                <p><strong>Setup time:</strong> 10 minutes</p>
                <div className="code-example">
                  <pre>{`POST https://api.councilof.ai/v1/decisions
{
  "type": "content_moderation",
  "content": "...",
  "context": {...}
}

Response:
{
  "decision": "approved",
  "confidence": 0.95,
  "votes": {...},
  "blockchain_proof": "0x..."
}`}</pre>
                </div>
                <a href="/docs/api" className="btn secondary">API Documentation</a>
              </div>

              <div className="integration-card">
                <h3>🐍 Python SDK</h3>
                <p><strong>Best for:</strong> Python applications, data science, ML pipelines</p>
                <p><strong>Setup time:</strong> 5 minutes</p>
                <div className="code-example">
                  <pre>{`pip install aisafety

from aisafety import CouncilClient

client = CouncilClient(api_key="your_key")

decision = client.decide(
    type="content_moderation",
    content="...",
    context={...}
)

print(decision.result)
print(decision.blockchain_proof)`}</pre>
                </div>
                <a href="/docs/python-sdk" className="btn secondary">Python SDK Docs</a>
              </div>

              <div className="integration-card">
                <h3>📦 JavaScript SDK</h3>
                <p><strong>Best for:</strong> Web applications, Node.js, React, Vue, Angular</p>
                <p><strong>Setup time:</strong> 5 minutes</p>
                <div className="code-example">
                  <pre>{`npm install @aisafety/council

import { CouncilClient } from '@aisafety/council';

const client = new CouncilClient({
  apiKey: 'your_key'
});

const decision = await client.decide({
  type: 'content_moderation',
  content: '...',
  context: {...}
});

console.log(decision.result);`}</pre>
                </div>
                <a href="/docs/javascript-sdk" className="btn secondary">JavaScript SDK Docs</a>
              </div>

              <div className="integration-card">
                <h3>🖥️ Dashboard UI</h3>
                <p><strong>Best for:</strong> Manual review, testing, demonstrations</p>
                <p><strong>Setup time:</strong> 0 minutes (no code required)</p>
                <p>Use our web dashboard to submit decisions, view results, and explore the council's voting history.</p>
                <a href="/dashboard" className="btn secondary">Open Dashboard</a>
              </div>

              <div className="integration-card">
                <h3>🔗 Webhooks</h3>
                <p><strong>Best for:</strong> Async workflows, event-driven architecture</p>
                <p><strong>Setup time:</strong> 15 minutes</p>
                <p>Receive real-time notifications when decisions are made, votes are cast, or blockchain confirmations arrive.</p>
                <a href="/docs/webhooks" className="btn secondary">Webhooks Guide</a>
              </div>

              <div className="integration-card">
                <h3>🏢 Enterprise API</h3>
                <p><strong>Best for:</strong> Large organizations, custom requirements</p>
                <p><strong>Setup time:</strong> Custom (with dedicated support)</p>
                <p>Dedicated infrastructure, custom SLAs, white-label options, and hands-on integration support.</p>
                <a href="/contact" className="btn secondary">Contact Sales</a>
              </div>
            </div>

            <div className="integration-support">
              <h3>Integration Support</h3>
              <p>Need help integrating? We offer:</p>
              <ul>
                <li>📚 Comprehensive documentation with examples</li>
                <li>💬 Live chat support during business hours</li>
                <li>📧 Email support with 24-hour response time</li>
                <li>🎥 Video tutorials and walkthroughs</li>
                <li>🤝 Dedicated integration engineer for Enterprise plans</li>
              </ul>
              <a href="/docs" className="btn primary">View Full Documentation</a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HowItWorks;

