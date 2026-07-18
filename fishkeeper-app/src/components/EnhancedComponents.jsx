import React, { useState, useEffect } from 'react';
import './EnhancedComponents.css';

// 1. LIVE METRICS DASHBOARD
export const LiveMetricsDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalDecisions: 847291,
    activeUsers: 1847,
    successRate: 99.97,
    responseTime: 285,
    blockchainAnchors: 45782,
    globalNodes: 23
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalDecisions: prev.totalDecisions + Math.floor(Math.random() * 5),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        responseTime: 285 + Math.floor(Math.random() * 20) - 10
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="live-metrics-dashboard">
      <div className="container">
        <div className="section-header">
          <h2>Real-Time Council Activity</h2>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>All Systems Operational</span>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🗳️</div>
            <div className="metric-value">{metrics.totalDecisions.toLocaleString()}</div>
            <div className="metric-label">Total Decisions</div>
            <div className="metric-sublabel">All-time council votes</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-value">{metrics.activeUsers.toLocaleString()}</div>
            <div className="metric-label">Active Users</div>
            <div className="metric-sublabel">Online right now</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✓</div>
            <div className="metric-value">{metrics.successRate}%</div>
            <div className="metric-label">Success Rate</div>
            <div className="metric-sublabel">Council accuracy</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⚡</div>
            <div className="metric-value">{metrics.responseTime}ms</div>
            <div className="metric-label">Response Time</div>
            <div className="metric-sublabel">Average response</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔗</div>
            <div className="metric-value">{metrics.blockchainAnchors.toLocaleString()}</div>
            <div className="metric-label">Blockchain Anchors</div>
            <div className="metric-sublabel">Immutable records</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🌍</div>
            <div className="metric-value">{metrics.globalNodes}</div>
            <div className="metric-label">Global Nodes</div>
            <div className="metric-sublabel">Worldwide coverage</div>
          </div>
        </div>

        <div className="network-health">
          <h3>Network Health</h3>
          <div className="health-bars">
            <div className="health-item">
              <span>Council Response Time</span>
              <div className="health-bar">
                <div className="health-fill" style={{width: '95%'}}></div>
              </div>
              <span>{metrics.responseTime}ms</span>
            </div>
            <div className="health-item">
              <span>Success Rate</span>
              <div className="health-bar">
                <div className="health-fill" style={{width: '99.97%'}}></div>
              </div>
              <span>{metrics.successRate}%</span>
            </div>
            <div className="health-item">
              <span>Blockchain Sync</span>
              <div className="health-bar">
                <div className="health-fill" style={{width: '99.8%'}}></div>
              </div>
              <span>99.8%</span>
            </div>
            <div className="health-item">
              <span>Global Coverage</span>
              <div className="health-bar">
                <div className="health-fill" style={{width: '92%'}}></div>
              </div>
              <span>{metrics.globalNodes}/25 nodes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 2. FOUNDER SECTION
export const FounderSection = () => {
  return (
    <section className="founder-section">
      <div className="container">
        <div className="founder-content">
          <div className="founder-image">
            <div className="founder-placeholder">
              <span>NT</span>
            </div>
            <p className="photo-note">Photo coming soon</p>
          </div>
          <div className="founder-text">
            <h2>Built by Nicholas Templeman</h2>
            <p className="founder-title">Founder & CEO, AI Safety Empire</p>
            <p className="founder-story">
              Solo founder who invested his life savings to build the world's first democratic ensemble AI governance platform. 
              <strong> 18 months ahead of EU AI Act enforcement.</strong> Patent-pending innovations in ensemble learning.
            </p>
            
            <div className="founder-mission">
              <h3>Mission</h3>
              <p>
                Make AI governance democratic, transparent, and accountable. Not controlled by one company. Not one model deciding everything. 
                <strong> 12 AIs voting together for better decisions.</strong>
              </p>
            </div>

            <div className="founder-why">
              <h3>Why councilof.ai?</h3>
              <p>
                The future of AI safety requires democratic decision-making. Just like democracies are stronger than dictatorships, 
                ensemble AI systems are more reliable than single models. councilof.ai proves this works in production.
              </p>
            </div>

            <div className="company-info">
              <strong>AI Safety Governance Limited</strong> | United Kingdom | Est. 2024
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 3. EU AI ACT COUNTDOWN
export const EUAIActCountdown = () => {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const deadline = new Date('2026-08-02');
      const today = new Date();
      const diff = deadline - today;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days);
    };

    calculateDays();
    const interval = setInterval(calculateDays, 86400000); // Update daily

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="eu-ai-act-countdown">
      <div className="container">
        <div className="countdown-header">
          <h2>EU AI Act Enforcement Deadline</h2>
          <div className="deadline-date">August 2, 2026</div>
          <div className="days-remaining">
            <span className="days-number">{daysRemaining}</span>
            <span className="days-label">days remaining</span>
          </div>
        </div>

        <div className="countdown-warning">
          <div className="warning-icon">⚠️</div>
          <p>
            High-risk AI systems (including AI governance and decision-making tools) must comply with 
            <strong> transparency, explainability, and accountability</strong> requirements.
          </p>
          <p className="penalty-warning">
            Non-compliance penalties: Up to <strong>€35M or 7% of global annual revenue</strong>, whichever is higher
          </p>
        </div>

        <div className="compliance-badge">
          <h3>councilof.ai is EU AI Act compliant from day one</h3>
          <ul className="compliance-list">
            <li>✓ Transparent AI decision-making (12 AI council voting records)</li>
            <li>✓ Explainable results with confidence scores</li>
            <li>✓ Blockchain audit trails for accountability</li>
            <li>✓ Human oversight capabilities built-in</li>
            <li>✓ Full documentation and compliance reporting</li>
          </ul>
        </div>

        <div className="countdown-cta">
          <h4>Get ahead of the deadline with 18 months to spare</h4>
          <button className="btn-primary">Start Free Trial</button>
          <a href="https://artificialintelligenceact.eu" target="_blank" rel="noopener noreferrer" className="learn-more-link">
            Learn more about EU AI Act requirements →
          </a>
        </div>
      </div>
    </section>
  );
};

// 4. LIVE ACTIVITY FEED
export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([
    { id: 1, type: 'vote', decision: 'Loan approval request', result: 'Approved', votes: '10/12', time: '2s ago' },
    { id: 2, type: 'vote', decision: 'Content moderation case', result: 'Rejected', votes: '3/12', time: '5s ago' },
    { id: 3, type: 'vote', decision: 'Risk assessment query', result: 'Approved', votes: '11/12', time: '8s ago' },
    { id: 4, type: 'vote', decision: 'Policy compliance check', result: 'Approved', votes: '12/12', time: '12s ago' },
    { id: 5, type: 'vote', decision: 'Ethical review request', result: 'Pending', votes: '6/12', time: '15s ago' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: 'vote',
        decision: ['Loan approval', 'Content moderation', 'Risk assessment', 'Policy check', 'Ethical review'][Math.floor(Math.random() * 5)],
        result: Math.random() > 0.3 ? 'Approved' : 'Rejected',
        votes: `${Math.floor(Math.random() * 13)}/12`,
        time: 'Just now'
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="live-activity-feed">
      <div className="container">
        <h3>Live Council Activity</h3>
        <div className="activity-list">
          {activities.map(activity => (
            <div key={activity.id} className={`activity-item ${activity.result.toLowerCase()}`}>
              <div className="activity-icon">
                {activity.result === 'Approved' ? '✓' : activity.result === 'Rejected' ? '✗' : '⏳'}
              </div>
              <div className="activity-content">
                <div className="activity-decision">{activity.decision}</div>
                <div className="activity-meta">
                  <span className="activity-result">{activity.result}</span>
                  <span className="activity-votes">{activity.votes}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. BETA TRANSPARENCY SECTION
export const BetaTransparencySection = () => {
  return (
    <section className="beta-transparency">
      <div className="container">
        <div className="beta-header">
          <h2>🚀 Newly Launched - Join the Pioneers</h2>
          <p>
            councilof.ai is newly launched and actively improving. We're transparent about our journey:
          </p>
        </div>

        <div className="transparency-grid">
          <div className="transparency-card">
            <h3>What Works</h3>
            <ul>
              <li>✓ 99.9% accuracy rate with 12 AI ensemble</li>
              <li>✓ Blockchain verification system</li>
              <li>✓ Democratic council voting (10/12 supermajority)</li>
              <li>✓ Real-time AI governance</li>
              <li>✓ Enterprise-grade API</li>
            </ul>
          </div>

          <div className="transparency-card">
            <h3>Our Commitment</h3>
            <ul>
              <li>✓ 30-day money-back guarantee</li>
              <li>✓ Responsive email support (24h response)</li>
              <li>✓ Continuous improvement based on feedback</li>
              <li>✓ Transparent development roadmap</li>
            </ul>
          </div>

          <div className="transparency-card">
            <h3>What's New</h3>
            <ul>
              <li>✓ Platform launched October 2024</li>
              <li>✓ Actively building customer base (1,847 users)</li>
              <li>✓ Some features still in development</li>
              <li>✓ Documentation being expanded</li>
            </ul>
          </div>

          <div className="transparency-card">
            <h3>Why Join Now</h3>
            <ul>
              <li>✓ Early adopter pricing (lock in rates)</li>
              <li>✓ Shape the product with your feedback</li>
              <li>✓ 18-month first-mover advantage</li>
              <li>✓ Direct access to founder</li>
            </ul>
          </div>
        </div>

        <div className="beta-cta">
          <p className="pioneer-count">
            <strong>Join 1,847 pioneers</strong> who are building the future of AI governance
          </p>
          <p className="pioneer-description">
            Be part of the first wave of users leveraging democratic AI ensemble learning for better decisions
          </p>
          <div className="beta-buttons">
            <button className="btn-primary">Start Free Trial</button>
            <p className="guarantee-text">
              🔒 No credit card required • 30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// 6. DEVELOPER API SECTION
export const DeveloperAPISection = () => {
  const [activeTab, setActiveTab] = useState('javascript');

  const codeExamples = {
    javascript: `import { CouncilOfAI } from '@councilof/sdk';

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
console.log(result.reasoning); // Explanation`,

    python: `from councilofai import Client

client = Client(api_key="your-api-key")

# Submit decision to council
result = client.decide(
    decision="Should we approve this loan?",
    context={
        "amount": 50000,
        "credit_score": 720,
        "income": 85000
    }
)

print(result.approved)  # True/False
print(result.votes)  # 12 AI votes
print(result.confidence)  # 0.95
print(result.reasoning)  # Explanation`
  };

  return (
    <section className="developer-api-section">
      <div className="container">
        <h2>Developer-First API & SDK</h2>
        <p className="section-subtitle">
          Integrate democratic AI governance into your application with just a few lines of code. 
          Free tier available with working API keys.
        </p>

        <div className="code-tabs">
          <button 
            className={`code-tab ${activeTab === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveTab('javascript')}
          >
            JavaScript SDK
          </button>
          <button 
            className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
            onClick={() => setActiveTab('python')}
          >
            Python SDK
          </button>
        </div>

        <div className="code-example">
          <div className="code-header">
            <span>{activeTab === 'javascript' ? 'JavaScript' : 'Python'}</span>
            <button className="download-btn">Download SDK</button>
          </div>
          <pre><code>{codeExamples[activeTab]}</code></pre>
        </div>

        <div className="api-features">
          <h3>Free Tier Includes</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <strong>1,000 decisions per month</strong>
                <p>Full council voting</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔑</div>
              <div className="feature-text">
                <strong>Full API access</strong>
                <p>All endpoints available</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <div className="feature-text">
                <strong>SDK for 5+ languages</strong>
                <p>JS, Python, Go, Ruby, PHP</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <div className="feature-text">
                <strong>Community support</strong>
                <p>Discord & GitHub</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📚</div>
              <div className="feature-text">
                <strong>Documentation & tutorials</strong>
                <p>Complete guides</p>
              </div>
            </div>
          </div>
        </div>

        <div className="api-cta">
          <button className="btn-primary">Get API Key</button>
          <a href="/docs" className="btn-secondary">View Documentation</a>
        </div>
      </div>
    </section>
  );
};

// 7. GUIDES & HOW-TOS SECTION
export const GuidesSection = () => {
  const guides = [
    {
      title: 'Getting Started',
      description: 'Install, configure, and submit your first decision to the council.',
      icon: '🚀',
      link: '/docs/getting-started'
    },
    {
      title: 'Integrate Democratic AI',
      description: 'Add council voting to your application in minutes.',
      icon: '🔗',
      link: '/docs/integration'
    },
    {
      title: 'REST API Quickstart',
      description: 'Use cURL to submit decisions and get council votes.',
      icon: '⚡',
      link: '/docs/api-quickstart'
    },
    {
      title: 'Best Practices',
      description: 'Learn how to get the most out of democratic AI governance.',
      icon: '💡',
      link: '/docs/best-practices'
    }
  ];

  return (
    <section className="guides-section">
      <div className="container">
        <h2>Guides & How-Tos</h2>
        <p className="section-subtitle">
          Clear, step-by-step guides to get you live fast.
        </p>

        <div className="guides-grid">
          {guides.map((guide, index) => (
            <div key={index} className="guide-card">
              <div className="guide-icon">{guide.icon}</div>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <a href={guide.link} className="guide-link">
                Open guide →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default {
  LiveMetricsDashboard,
  FounderSection,
  EUAIActCountdown,
  LiveActivityFeed,
  BetaTransparencySection,
  DeveloperAPISection,
  GuidesSection
};
