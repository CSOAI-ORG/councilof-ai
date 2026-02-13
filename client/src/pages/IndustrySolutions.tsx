import React, { useState } from 'react';
import {
  ChevronDown,
  Building2,
  Heart,
  Users,
  Cpu,
  BookOpen,
  Zap,
  Scale,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lock,
  Eye,
  Brain,
} from 'lucide-react';

interface IndustryData {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  overview: string;
  regulations: string[];
  useCases: string[];
  risks: string[];
  solution: string[];
  gradient: string;
}

const industries: IndustryData[] = [
  {
    id: 'financial',
    name: 'Financial Services',
    subtitle: 'Banking, Insurance, Fintech',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'blue',
    gradient: 'from-blue-50 to-blue-100',
    overview:
      'Financial institutions face unprecedented regulatory pressure to govern AI systems used in critical decision-making. From credit scoring to algorithmic trading, every AI deployment must demonstrate compliance, fairness, and explainability.',
    regulations: [
      'EU AI Act (High-Risk Classification)',
      'Basel III AI Requirements',
      'PRA/FCA Guidance on ML in Banking',
      'Fair Lending Laws & FCRA',
      'SOX & MiFID II',
    ],
    useCases: [
      'Credit Scoring & Underwriting',
      'Fraud Detection & AML',
      'Algorithmic Trading',
      'Insurance Underwriting',
      'Customer Risk Assessment',
    ],
    risks: [
      'Algorithmic discrimination in lending',
      'Model drift affecting predictions',
      'Black-box decision accountability',
      'Regulatory audit failures',
      'Reputational damage from bias',
    ],
    solution: [
      'Multi-framework compliance tracking',
      'Automated bias testing & remediation',
      'Real-time model monitoring & drift detection',
      'Audit-ready documentation generation',
      'Regulatory reporting automation',
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    subtitle: 'Clinical AI, Drug Discovery, Diagnostics',
    icon: <Heart className="w-8 h-8" />,
    color: 'red',
    gradient: 'from-red-50 to-red-100',
    overview:
      'Healthcare AI demands the highest standards of safety and accountability. Patient outcomes depend on AI systems that are not only accurate but also transparent, validated, and continuously monitored for safety.',
    regulations: [
      'EU AI Act (High-Risk)',
      'FDA AI/ML Guidance & 510(k)',
      'HIPAA & HITECH',
      'MDR (Medical Device Regulation)',
      'Clinical Trial Regulations',
    ],
    useCases: [
      'Clinical Decision Support',
      'Drug Discovery & Development',
      'Medical Image Analysis',
      'Patient Risk Stratification',
      'Diagnostic AI Systems',
    ],
    risks: [
      'Patient safety from model errors',
      'Bias in medical AI affecting care',
      'Data privacy & HIPAA violations',
      'Regulatory approval delays',
      'Clinical validation gaps',
    ],
    solution: [
      'Safety-first governance framework',
      'Clinical AI validation protocols',
      'Privacy-preserving model monitoring',
      'Regulatory compliance documentation',
      'Continuous safety assessment',
    ],
  },
  {
    id: 'government',
    name: 'Government & Public Sector',
    subtitle: 'Public Safety, Benefits, Administration',
    icon: <Users className="w-8 h-8" />,
    color: 'purple',
    gradient: 'from-purple-50 to-purple-100',
    overview:
      'Government agencies deploying AI must balance efficiency with transparency and civil rights. Citizens have a right to understand how AI systems affect their services, benefits, and freedoms.',
    regulations: [
      'EU AI Act (Government Mandates)',
      'NIST AI Risk Management Framework',
      'Executive Orders on AI',
      'Title VI & Civil Rights Laws',
      'FOIA & Transparency Requirements',
    ],
    useCases: [
      'Predictive Policing & Law Enforcement',
      'Benefits Determination & Eligibility',
      'Immigration & Border Processing',
      'Defense & Military Applications',
      'Infrastructure Management',
    ],
    risks: [
      'Civil rights & discrimination',
      'Transparency & accountability gaps',
      'Public trust & legitimacy',
      'Sovereignty & national security',
      'Escalation of force concerns',
    ],
    solution: [
      'Government-grade governance dashboard',
      'Public transparency & explainability tools',
      'Multi-nation compliance alignment',
      'Civil rights impact assessment',
      'Democratic accountability frameworks',
    ],
  },
  {
    id: 'technology',
    name: 'Technology & Software',
    subtitle: 'Foundation Models, AI Agents, GenAI',
    icon: <Cpu className="w-8 h-8" />,
    color: 'emerald',
    gradient: 'from-emerald-50 to-emerald-100',
    overview:
      'Technology companies building and deploying AI platforms face evolving regulations and market demands for responsible AI. Foundation models and agents require governance at scale.',
    regulations: [
      'EU AI Act (GPAI Classification)',
      'NIST AI Risk Management Framework',
      'ISO 42001 (AI Management)',
      'State-Level Laws (CA, NY, etc.)',
      'Copyright & IP Compliance',
    ],
    useCases: [
      'Foundation Model Development',
      'AI Agents & Autonomous Systems',
      'Generative AI Products',
      'Recommendation Systems',
      'Content Generation Platforms',
    ],
    risks: [
      'Hallucinations & factual accuracy',
      'Copyright & IP infringement',
      'Misuse & harmful content',
      'Model safety at scale',
      'Training data governance',
    ],
    solution: [
      '33-Agent Council for red teaming',
      'Continuous monitoring & evaluation',
      'Safety-first testing protocols',
      'Misuse detection & prevention',
      'Transparency & documentation',
    ],
  },
  {
    id: 'education',
    name: 'Education',
    subtitle: 'EdTech, Adaptive Learning, Student Services',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'amber',
    gradient: 'from-amber-50 to-amber-100',
    overview:
      'Educational institutions deploying AI must prioritize student protection, fairness, and accessibility. AI systems affect student outcomes, and transparency is essential for trust.',
    regulations: [
      'EU AI Act (AI Literacy Mandate)',
      'FERPA (Family Education Privacy Act)',
      'GDPR (Student Data Protection)',
      'ADA & Accessibility Laws',
      'Local Education Regulations',
    ],
    useCases: [
      'Adaptive Learning Platforms',
      'Automated Grading & Assessment',
      'Student Admissions AI',
      'Personalized Learning Paths',
      'Student Support & Counseling',
    ],
    risks: [
      'Student data privacy violations',
      'Algorithmic fairness in admissions',
      'Accessibility & inclusion',
      'Parental consent & transparency',
      'Learning outcome bias',
    ],
    solution: [
      'AI literacy training programs',
      'Governance certification for educators',
      'Student privacy compliance tools',
      'Fairness assessment frameworks',
      'Transparent AI documentation',
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Critical Infrastructure',
    subtitle: 'Industry 4.0, Automation, Safety',
    icon: <Zap className="w-8 h-8" />,
    color: 'orange',
    gradient: 'from-orange-50 to-orange-100',
    overview:
      'Industrial AI applications demand safety-first governance. AI systems controlling critical processes must be continuously monitored and validated for operational safety.',
    regulations: [
      'EU AI Act (High-Risk)',
      'IEC 61508 (Functional Safety)',
      'ISO 26262 (Automotive Safety)',
      'OSHA & Workplace Safety',
      'Environmental Compliance',
    ],
    useCases: [
      'Predictive Maintenance',
      'Quality Control & Inspection',
      'Autonomous Systems & Robotics',
      'Supply Chain Optimization',
      'Energy & Utility Management',
    ],
    risks: [
      'Safety-critical system failures',
      'Process disruption & downtime',
      'Workforce displacement concerns',
      'Data security & industrial espionage',
      'Environmental & safety violations',
    ],
    solution: [
      'Safety-focused governance framework',
      'Continuous operational monitoring',
      'Incident response protocols',
      'Worker-AI collaboration tools',
      'Regulatory compliance documentation',
    ],
  },
  {
    id: 'legal',
    name: 'Legal & Professional Services',
    subtitle: 'Legal Tech, Compliance, Due Diligence',
    icon: <Scale className="w-8 h-8" />,
    color: 'slate',
    gradient: 'from-slate-50 to-slate-100',
    overview:
      'Legal professionals using AI must maintain ethical standards and accountability. AI systems must support, not replace, professional judgment and legal responsibility.',
    regulations: [
      'Professional Liability & Ethics Rules',
      'EU AI Act',
      'Data Protection & Confidentiality',
      'Bar Association Guidelines',
      'Conflict of Interest Laws',
    ],
    useCases: [
      'Contract Analysis & Review',
      'Legal Research & Case Law Analysis',
      'Compliance Checking',
      'Due Diligence Automation',
      'Document Discovery & Analytics',
    ],
    risks: [
      'Accuracy & hallucination errors',
      'Client confidentiality breaches',
      'Professional ethics violations',
      'Liability & malpractice exposure',
      'Unauthorized practice of law',
    ],
    solution: [
      'AI governance frameworks for legal',
      'Ethical AI assessment tools',
      'Client confidentiality safeguards',
      'Continuous accuracy monitoring',
      'Professional documentation & audit trails',
    ],
  },
  {
    id: 'defense',
    name: 'Defense & National Security',
    subtitle: 'Intelligence, Autonomous Systems, Cyber',
    icon: <Shield className="w-8 h-8" />,
    color: 'indigo',
    gradient: 'from-indigo-50 to-indigo-100',
    overview:
      'Defense applications require the most stringent governance standards. AI systems must be designed with safety, accountability, and international cooperation in mind.',
    regulations: [
      'NATO AI Principles',
      'National Defense AI Policies',
      'ITAR & Export Controls',
      'International AI Governance',
      'War Law & Ethics',
    ],
    useCases: [
      'Intelligence Analysis & Fusion',
      'Autonomous Systems & Platforms',
      'Cyber Defense & Security',
      'Logistics & Operations',
      'Threat Assessment & Prediction',
    ],
    risks: [
      'Autonomous weapons accountability',
      'International escalation',
      'Sovereignty & espionage',
      'Civilian harm & proportionality',
      'Trustworthiness & adversarial attacks',
    ],
    solution: [
      '40-nation NATO-grade governance',
      'DSRB pipeline integration',
      'International alignment frameworks',
      'Safety & accountability protocols',
      'Continuous threat assessment',
    ],
  },
];

interface ExpandedStates {
  [key: string]: boolean;
}

const IndustrySolutions: React.FC = () => {
  const [expanded, setExpanded] = useState<ExpandedStates>({});

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl mb-4">
            AI Governance Solutions by Industry
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Tailored compliance frameworks and governance tools for every sector
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Explore industry-specific AI governance requirements, use cases, regulatory landscapes, and CSOAI solutions designed for your sector's unique challenges.
          </p>
        </div>
      </section>

      {/* Industry Cards Grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {industries.map((industry) => (
            <div
              key={industry.id}
              className="group relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Expandable Card Header */}
              <button
                onClick={() => toggleExpanded(industry.id)}
                className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${industry.gradient}`}>
                    <div className={`text-${industry.color}-600`}>
                      {industry.icon}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expanded[industry.id] ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {industry.name}
                </h3>
                <p className="text-sm text-slate-600">{industry.subtitle}</p>
              </button>

              {/* Expandable Content */}
              {expanded[industry.id] && (
                <div className="border-t border-slate-200 px-6 py-6 space-y-6">
                  {/* Overview */}
                  <div>
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {industry.overview}
                    </p>
                  </div>

                  {/* Regulations */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Key Regulations
                    </h4>
                    <div className="space-y-2">
                      {industry.regulations.map((reg, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-blue-600 font-semibold">•</span>
                          {reg}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-600" />
                      AI Use Cases
                    </h4>
                    <div className="space-y-2">
                      {industry.useCases.map((useCase, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-emerald-600 font-semibold">•</span>
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Risks */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Key Risks & Challenges
                    </h4>
                    <div className="space-y-2">
                      {industry.risks.map((risk, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-red-600 font-semibold">•</span>
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CSOAI Solution */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      CSOAI Solutions
                    </h4>
                    <div className="space-y-2">
                      {industry.solution.map((solution, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-purple-600 font-semibold">✓</span>
                          {solution}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      Explore Tools
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                      <ArrowRight className="w-4 h-4" />
                      Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Common Challenges Section */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Common Challenges Across Industries
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12">
            While regulations and use cases vary, organizations across all sectors face shared AI governance challenges
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Regulatory Complexity',
                description: 'Navigating overlapping AI regulations (EU AI Act, NIST, national laws) across multiple jurisdictions and domains.',
                icon: <Building2 className="w-6 h-6" />,
              },
              {
                title: 'Model Transparency & Explainability',
                description: 'Demonstrating how AI systems make decisions and ensuring stakeholders understand the "why" behind predictions.',
                icon: <Eye className="w-6 h-6" />,
              },
              {
                title: 'Bias & Fairness',
                description: 'Identifying, measuring, and mitigating algorithmic bias across diverse applications and protected categories.',
                icon: <Scale className="w-6 h-6" />,
              },
              {
                title: 'Continuous Monitoring & Maintenance',
                description: 'Tracking model performance, drift detection, and identifying when AI systems require retraining or updates.',
                icon: <TrendingUp className="w-6 h-6" />,
              },
              {
                title: 'Data Governance & Privacy',
                description: 'Managing training data governance, ensuring compliance with privacy laws, and documenting data lineage.',
                icon: <Lock className="w-6 h-6" />,
              },
              {
                title: 'Organizational Alignment',
                description: 'Building cross-functional governance structures and ensuring shared accountability for AI systems.',
                icon: <Users className="w-6 h-6" />,
              },
            ].map((challenge, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="text-purple-600 mb-3">{challenge.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{challenge.title}</h3>
                <p className="text-sm text-slate-600">{challenge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Govern AI in Your Industry?
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Start your AI governance journey with industry-specific guidance, tools, and expert support from CSOAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold">
              <BookOpen className="w-5 h-5" />
              Start Free Training
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold">
              <ArrowRight className="w-5 h-5" />
              Request Industry Assessment
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm text-slate-600 mb-8">
            CSOAI provides industry-specific AI governance solutions aligned with leading frameworks including EU AI Act, NIST AI RMF, ISO 42001, and sector-specific regulations.
          </p>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Industries Covered', value: '8+' },
              { label: 'Regulatory Frameworks', value: '40+' },
              { label: 'Global Standards', value: 'ISO/IEC' },
              { label: 'Expert Network', value: '200+' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-2xl font-bold text-purple-600">{stat.value}</div>
                <div className="text-xs text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IndustrySolutions;
