import React, { useState } from 'react';
import './UseCases.css';

const UseCases = () => {
  const [activeIndustry, setActiveIndustry] = useState('enterprise');

  const industries = {
    enterprise: {
      title: "Enterprise & Business",
      icon: "🏢",
      description: "Transform your business decision-making with democratic AI governance",
      useCases: [
        {
          title: "Content Moderation at Scale",
          challenge: "Manual content moderation is slow, inconsistent, and prone to bias",
          solution: "Council of 12 AIs reviews content from multiple perspectives (safety, ethics, bias, privacy) ensuring fair, consistent moderation decisions",
          results: ["95% accuracy", "10x faster than manual review", "Audit trail for appeals"],
          companies: ["Social media platforms", "User-generated content sites", "Online marketplaces"]
        },
        {
          title: "Hiring & Recruitment",
          challenge: "AI-powered hiring tools often perpetuate bias and lack transparency",
          solution: "Democratic AI council evaluates candidates with bias detection, fairness analysis, and explainable decisions compliant with EU AI Act",
          results: ["40% reduction in bias", "100% explainable decisions", "EU AI Act compliant"],
          companies: ["HR tech companies", "Recruitment agencies", "Large enterprises"]
        },
        {
          title: "Financial Risk Assessment",
          challenge: "Single AI models miss edge cases and lack accountability",
          solution: "Ensemble learning combines 12 specialized AIs for comprehensive risk analysis with blockchain-verified audit trails",
          results: ["25% better risk prediction", "Immutable audit trail", "Regulatory compliance"],
          companies: ["Banks", "Insurance companies", "Fintech startups"]
        },
        {
          title: "Customer Service Automation",
          challenge: "Chatbots make mistakes and lack empathy, damaging brand reputation",
          solution: "Council ensures responses are accurate, empathetic, safe, and aligned with brand values before sending",
          results: ["90% customer satisfaction", "50% fewer escalations", "Brand-safe responses"],
          companies: ["E-commerce", "SaaS companies", "Customer support platforms"]
        }
      ]
    },
    government: {
      title: "Government & Public Sector",
      icon: "🏛️",
      description: "Ensure democratic, transparent, and accountable AI in public services",
      useCases: [
        {
          title: "Public Benefits Allocation",
          challenge: "AI systems for benefits allocation lack transparency and may discriminate",
          solution: "Democratic council ensures fair, explainable decisions with full audit trails meeting government transparency requirements",
          results: ["Zero discrimination complaints", "100% decision transparency", "Public trust restored"],
          companies: ["Social services", "Healthcare systems", "Housing authorities"]
        },
        {
          title: "Law Enforcement AI",
          challenge: "Predictive policing and surveillance AI face bias and accountability concerns",
          solution: "Council includes bias detection, ethics review, and privacy protection in every decision with civilian oversight",
          results: ["Bias eliminated", "Constitutional compliance", "Community trust"],
          companies: ["Police departments", "Justice systems", "Border control"]
        },
        {
          title: "Urban Planning & Smart Cities",
          challenge: "AI-driven city planning may not consider diverse community needs",
          solution: "Democratic AI evaluates plans from safety, accessibility, environmental, and equity perspectives",
          results: ["Inclusive planning", "Environmental compliance", "Community approval"],
          companies: ["City governments", "Urban planners", "Infrastructure projects"]
        },
        {
          title: "Election Security",
          challenge: "Deepfakes and misinformation threaten electoral integrity",
          solution: "proofof.ai detects deepfakes while council verifies information authenticity in real-time",
          results: ["99.8% deepfake detection", "Real-time verification", "Election integrity protected"],
          companies: ["Electoral commissions", "Government agencies", "Media organizations"]
        }
      ]
    },
    healthcare: {
      title: "Healthcare & Life Sciences",
      icon: "🏥",
      description: "Save lives with AI that's safe, ethical, and clinically validated",
      useCases: [
        {
          title: "Clinical Decision Support",
          challenge: "AI medical recommendations need validation from multiple specialties",
          solution: "Council of medical AI specialists (diagnostics, ethics, safety, privacy) validates recommendations before clinicians see them",
          results: ["30% fewer diagnostic errors", "HIPAA compliant", "Malpractice risk reduced"],
          companies: ["Hospitals", "Diagnostic labs", "Telemedicine platforms"]
        },
        {
          title: "Drug Discovery & Clinical Trials",
          challenge: "AI-driven drug discovery lacks safety oversight and ethical review",
          solution: "Democratic council evaluates safety, efficacy, ethics, and bias in trial design and patient selection",
          results: ["Faster FDA approval", "Diverse patient populations", "Ethical compliance"],
          companies: ["Pharmaceutical companies", "Biotech startups", "Research institutions"]
        },
        {
          title: "Mental Health AI",
          challenge: "Mental health chatbots can cause harm without proper safety guardrails",
          solution: "suicidestop.ai integration ensures crisis detection with council oversight for safety-critical decisions",
          results: ["Zero harm incidents", "Lives saved", "Regulatory approval"],
          companies: ["Mental health apps", "Telehealth providers", "Crisis hotlines"]
        },
        {
          title: "Medical Imaging Analysis",
          challenge: "Single AI models miss rare conditions and lack explainability",
          solution: "Ensemble of specialized imaging AIs with radiologist-level explanations and second opinions",
          results: ["15% higher accuracy", "Explainable diagnoses", "Liability protection"],
          companies: ["Radiology centers", "Imaging AI companies", "Hospital systems"]
        }
      ]
    },
    media: {
      title: "Media & Entertainment",
      icon: "📺",
      description: "Protect content authenticity and build audience trust",
      useCases: [
        {
          title: "Deepfake Detection for News",
          challenge: "Deepfakes undermine journalism credibility and spread misinformation",
          solution: "proofof.ai detects manipulated media in real-time with blockchain verification for published content",
          results: ["99.8% detection accuracy", "Real-time verification", "Audience trust restored"],
          companies: ["News organizations", "Fact-checking services", "Social media platforms"]
        },
        {
          title: "Content Authenticity Verification",
          challenge: "User-generated content may be fake, stolen, or manipulated",
          solution: "Council verifies authenticity, detects deepfakes, checks copyright, and ensures safety before publishing",
          results: ["Authentic content only", "Copyright protection", "Platform liability reduced"],
          companies: ["Video platforms", "Photo sharing apps", "Content marketplaces"]
        },
        {
          title: "AI-Generated Content Labeling",
          challenge: "EU AI Act requires disclosure of AI-generated content",
          solution: "Automated detection and labeling of AI-generated text, images, video, and audio with blockchain proof",
          results: ["100% compliance", "Transparent disclosure", "User trust maintained"],
          companies: ["Publishers", "Social networks", "Content platforms"]
        },
        {
          title: "Brand Safety for Advertising",
          challenge: "Ads appear next to harmful or fake content, damaging brand reputation",
          solution: "Council evaluates content safety, authenticity, and brand alignment before ad placement",
          results: ["Zero brand safety incidents", "Higher ad revenue", "Advertiser confidence"],
          companies: ["Ad networks", "Publishers", "Streaming platforms"]
        }
      ]
    },
    finance: {
      title: "Financial Services",
      icon: "💰",
      description: "Build trust with transparent, fair, and compliant AI",
      useCases: [
        {
          title: "Loan Approval & Credit Scoring",
          challenge: "AI credit models face bias complaints and lack explainability",
          solution: "Democratic council ensures fair evaluation with bias detection, explainable decisions, and regulatory compliance",
          results: ["Zero discrimination lawsuits", "Explainable denials", "Regulatory approval"],
          companies: ["Banks", "Credit unions", "Fintech lenders"]
        },
        {
          title: "Fraud Detection",
          challenge: "Single AI models miss sophisticated fraud patterns",
          solution: "Ensemble of specialized fraud detection AIs with real-time blockchain logging for investigations",
          results: ["40% more fraud detected", "Faster investigations", "Lower false positives"],
          companies: ["Payment processors", "Banks", "E-commerce platforms"]
        },
        {
          title: "Algorithmic Trading Compliance",
          challenge: "AI trading algorithms need oversight to prevent market manipulation",
          solution: "Council monitors trading decisions for compliance, ethics, and market impact before execution",
          results: ["Regulatory compliance", "Market stability", "Audit trail for investigations"],
          companies: ["Hedge funds", "Investment banks", "Trading platforms"]
        },
        {
          title: "Insurance Underwriting",
          challenge: "AI underwriting faces bias concerns and regulatory scrutiny",
          solution: "Democratic AI ensures fair risk assessment with explainable premiums and bias-free decisions",
          results: ["Fair pricing", "Regulatory compliance", "Customer trust"],
          companies: ["Insurance companies", "Insurtech startups", "Reinsurers"]
        }
      ]
    },
    education: {
      title: "Education & Research",
      icon: "🎓",
      description: "Empower learning with safe, fair, and transparent AI",
      useCases: [
        {
          title: "Automated Grading & Assessment",
          challenge: "AI grading systems may be biased or unfair to certain student groups",
          solution: "Council ensures fair evaluation with bias detection, multiple assessment perspectives, and explainable grades",
          results: ["Fair grading", "Reduced bias", "Student trust"],
          companies: ["EdTech platforms", "Universities", "Online learning"]
        },
        {
          title: "Admissions Decisions",
          challenge: "AI-powered admissions face legal challenges over bias and transparency",
          solution: "Democratic evaluation with bias detection, fairness analysis, and explainable decisions meeting legal requirements",
          results: ["Diverse student body", "Legal compliance", "Defensible decisions"],
          companies: ["Universities", "Admissions platforms", "Scholarship programs"]
        },
        {
          title: "Personalized Learning",
          challenge: "AI tutors may reinforce biases or provide unsafe content",
          solution: "Council ensures content safety, pedagogical quality, and personalization without discrimination",
          results: ["Better learning outcomes", "Safe content", "Equitable access"],
          companies: ["EdTech companies", "Online courses", "Learning management systems"]
        },
        {
          title: "Research Ethics Review",
          challenge: "AI research proposals need ethical oversight and safety review",
          solution: "Automated ethics review with council evaluation of safety, bias, privacy, and societal impact",
          results: ["Faster IRB approval", "Ethical compliance", "Safety ensured"],
          companies: ["Universities", "Research institutions", "Funding agencies"]
        }
      ]
    }
  };

  const activeData = industries[activeIndustry];

  return (
    <div className="use-cases-page">
      <section className="uc-hero">
        <div className="container">
          <h1 className="gradient-text">Real-World Use Cases</h1>
          <p className="subtitle">
            See how democratic AI governance transforms industries and builds trust
          </p>
        </div>
      </section>

      <section className="industry-selector">
        <div className="container">
          <div className="industry-tabs">
            {Object.entries(industries).map(([key, data]) => (
              <button
                key={key}
                className={`industry-tab ${activeIndustry === key ? 'active' : ''}`}
                onClick={() => setActiveIndustry(key)}
              >
                <span className="tab-icon">{data.icon}</span>
                <span className="tab-title">{data.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="industry-content">
        <div className="container">
          <div className="industry-header">
            <h2>
              <span className="industry-icon">{activeData.icon}</span>
              {activeData.title}
            </h2>
            <p className="industry-description">{activeData.description}</p>
          </div>

          <div className="use-cases-grid">
            {activeData.useCases.map((useCase, idx) => (
              <div key={idx} className="use-case-card">
                <h3>{useCase.title}</h3>
                
                <div className="uc-section">
                  <h4>❌ Challenge</h4>
                  <p>{useCase.challenge}</p>
                </div>

                <div className="uc-section">
                  <h4>✅ Solution</h4>
                  <p>{useCase.solution}</p>
                </div>

                <div className="uc-section">
                  <h4>📊 Results</h4>
                  <ul className="results-list">
                    {useCase.results.map((result, i) => (
                      <li key={i}>{result}</li>
                    ))}
                  </ul>
                </div>

                <div className="uc-section">
                  <h4>🏢 Ideal For</h4>
                  <div className="companies-tags">
                    {useCase.companies.map((company, i) => (
                      <span key={i} className="company-tag">{company}</span>
                    ))}
                  </div>
                </div>

                <button className="btn secondary">Learn More →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Industry?</h2>
          <p>
            Join leading organizations using democratic AI governance to build trust, 
            ensure compliance, and deliver better outcomes.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn primary">Schedule Demo</a>
            <a href="/#pricing" className="btn secondary">View Pricing</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UseCases;

