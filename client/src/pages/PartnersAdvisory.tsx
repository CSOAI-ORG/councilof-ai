import React, { useState } from 'react';
import {
  ChevronDown,
  Building2,
  Cpu,
  BookOpen,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  Award,
  Globe,
  Hand,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  category: string;
  description: string;
  logo?: string;
  expertise: string[];
}

interface AdvisoryService {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  duration: string;
  delivery: string;
}

interface PartnerTier {
  name: string;
  description: string;
  icon: React.ReactNode;
  partners: Partner[];
  color: string;
}

const advisoryServices: AdvisoryService[] = [
  {
    id: 'governance-strategy',
    title: 'AI Governance Strategy',
    description:
      'Develop comprehensive AI governance frameworks tailored to your organization\'s risk profile, strategic objectives, and regulatory landscape.',
    icon: <Target className="w-8 h-8" />,
    benefits: [
      'Custom governance roadmap aligned with business goals',
      'Cross-functional stakeholder alignment',
      'Risk assessment and prioritization',
      'Framework selection and customization',
      'Implementation timeline and resource planning',
    ],
    duration: '8-12 weeks',
    delivery: 'Hybrid (workshops, assessments, documentation)',
  },
  {
    id: 'compliance-assessment',
    description:
      'Comprehensive evaluation of your AI systems against multiple regulatory frameworks and standards.',
    title: 'Compliance Assessment',
    icon: <Shield className="w-8 h-8" />,
    benefits: [
      'Multi-framework compliance evaluation',
      'Gap analysis and remediation planning',
      'Audit readiness assessment',
      'Risk scoring and prioritization',
      'Compliance roadmap development',
    ],
    duration: '4-8 weeks',
    delivery: 'On-site and remote assessment',
  },
  {
    id: 'implementation-support',
    title: 'Implementation Support',
    description:
      'Hands-on assistance implementing AI governance tools, processes, and organizational structures.',
    icon: <Zap className="w-8 h-8" />,
    benefits: [
      'CSOAI platform configuration and customization',
      'Process design and documentation',
      'Team training and capability building',
      'Change management support',
      'Quality assurance and optimization',
    ],
    duration: '12-24 weeks',
    delivery: 'Dedicated implementation team',
  },
  {
    id: 'executive-education',
    title: 'Executive Education',
    description:
      'Board-level and C-suite workshops on AI governance, risk management, and strategic decision-making.',
    icon: <BookOpen className="w-8 h-8" />,
    benefits: [
      'AI governance fundamentals for executives',
      'Risk and liability frameworks',
      'Strategic AI deployment planning',
      'Regulatory landscape briefing',
      'Case studies and best practices',
    ],
    duration: '2-4 sessions',
    delivery: 'Virtual or in-person workshops',
  },
  {
    id: 'maturity-assessment',
    title: 'Maturity Assessment',
    description:
      'Evaluate your organization\'s AI governance maturity across people, processes, technology, and data dimensions.',
    icon: <TrendingUp className="w-8 h-8" />,
    benefits: [
      'Multi-dimensional maturity evaluation',
      'Benchmark against industry standards',
      'Current state and target state analysis',
      'Capability gaps identification',
      'Improvement roadmap development',
    ],
    duration: '6-10 weeks',
    delivery: 'Assessment and detailed report',
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    description:
      'Expert investigation and remediation support for AI safety incidents, model failures, or compliance violations.',
    icon: <AlertCircle className="w-8 h-8" />,
    benefits: [
      'Rapid incident investigation',
      'Root cause analysis',
      'Impact assessment and mitigation',
      'Remediation planning and execution',
      'Stakeholder communication strategy',
    ],
    duration: 'As-needed, 24/7 available',
    delivery: 'Emergency response team',
  },
];

const AlertCircle = Shield; // Using Shield as alternative since AlertCircle used above

const partnerTiers: PartnerTier[] = [
  {
    name: 'Strategic Partners',
    description:
      'Leading consulting firms and technology companies delivering AI governance services at scale.',
    icon: <Briefcase className="w-8 h-8" />,
    color: 'blue',
    partners: [
      {
        id: 'accenture',
        name: 'Accenture',
        category: 'Global Consulting',
        description: 'AI governance and responsible AI consulting',
        expertise: ['Enterprise AI Strategy', 'Governance Implementation', 'Compliance'],
      },
      {
        id: 'deloitte',
        name: 'Deloitte',
        category: 'Consulting & Risk',
        description: 'Risk management and regulatory compliance',
        expertise: ['Compliance Assessment', 'Risk Management', 'Regulatory Affairs'],
      },
      {
        id: 'mckinsey',
        name: 'McKinsey & Company',
        category: 'Strategy Consulting',
        description: 'AI strategy and responsible AI advisory',
        expertise: ['Strategic Planning', 'AI Policy', 'Governance'],
      },
      {
        id: 'pwc',
        name: 'PwC',
        category: 'Professional Services',
        description: 'AI assurance and governance services',
        expertise: ['Assurance', 'Compliance', 'Implementation'],
      },
      {
        id: 'ibm',
        name: 'IBM',
        category: 'Technology Leader',
        description: 'Enterprise AI and governance platforms',
        expertise: ['AI Platform', 'Governance Tools', 'Implementation'],
      },
      {
        id: 'google-cloud',
        name: 'Google Cloud',
        category: 'Cloud Provider',
        description: 'AI infrastructure and responsible AI',
        expertise: ['Cloud Infrastructure', 'AI Services', 'Compliance'],
      },
    ],
  },
  {
    name: 'Technology Partners',
    description: 'Platforms, tools, and services that integrate with CSOAI for comprehensive governance.',
    icon: <Cpu className="w-8 h-8" />,
    color: 'emerald',
    partners: [
      {
        id: 'dataiku',
        name: 'Dataiku',
        category: 'AI/ML Platform',
        description: 'AI governance integration and model management',
        expertise: ['Model Governance', 'Platform Integration', 'MLOps'],
      },
      {
        id: 'palantir',
        name: 'Palantir Technologies',
        category: 'Data Analytics',
        description: 'Data governance and analytics platform integration',
        expertise: ['Data Governance', 'Analytics Integration', 'Compliance'],
      },
      {
        id: 'databricks',
        name: 'Databricks',
        category: 'Data & AI',
        description: 'AI governance for data and ML workflows',
        expertise: ['MLOps', 'Data Platform', 'Model Management'],
      },
      {
        id: 'microsoft-azure',
        name: 'Microsoft Azure',
        category: 'Cloud Platform',
        description: 'AI governance and responsible AI tools',
        expertise: ['Cloud Services', 'AI Platform', 'Governance Tools'],
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'Enterprise CRM',
        description: 'AI governance for CRM and business applications',
        expertise: ['CRM Integration', 'AI Governance', 'Enterprise Apps'],
      },
      {
        id: 'tableau',
        name: 'Tableau',
        category: 'Analytics & BI',
        description: 'Data visualization and governance integration',
        expertise: ['Data Visualization', 'Analytics', 'Governance'],
      },
    ],
  },
  {
    name: 'Academic Partners',
    description: 'Universities and research institutions advancing AI governance research and education.',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'purple',
    partners: [
      {
        id: 'stanford',
        name: 'Stanford University',
        category: 'Research Institution',
        description: 'AI governance and responsible AI research',
        expertise: ['AI Ethics', 'Governance Research', 'Education'],
      },
      {
        id: 'mit',
        name: 'MIT',
        category: 'Research Institution',
        description: 'AI policy and governance initiatives',
        expertise: ['AI Policy', 'Research', 'Innovation'],
      },
      {
        id: 'berkeley',
        name: 'UC Berkeley',
        category: 'Research Institution',
        description: 'AI safety and responsible AI research',
        expertise: ['AI Safety', 'Ethics', 'Research'],
      },
      {
        id: 'oxford',
        name: 'University of Oxford',
        category: 'Research Institution',
        description: 'AI ethics and governance research',
        expertise: ['Ethics Research', 'Governance', 'Policy'],
      },
      {
        id: 'cambridge',
        name: 'University of Cambridge',
        category: 'Research Institution',
        description: 'Center for the future of intelligence',
        expertise: ['AI Governance', 'Ethics', 'Research'],
      },
      {
        id: 'eth',
        name: 'ETH Zurich',
        category: 'Research Institution',
        description: 'AI governance and policy research',
        expertise: ['Policy Research', 'Governance', 'Standards'],
      },
    ],
  },
  {
    name: 'Government & Standards Partners',
    description: 'Regulatory bodies and standards organizations shaping AI governance frameworks.',
    icon: <Shield className="w-8 h-8" />,
    color: 'red',
    partners: [
      {
        id: 'eu-commission',
        name: 'European Commission',
        category: 'Regulatory Body',
        description: 'EU AI Act implementation and guidance',
        expertise: ['EU AI Act', 'Regulation', 'Standards'],
      },
      {
        id: 'nist',
        name: 'NIST',
        category: 'Standards Organization',
        description: 'AI Risk Management Framework',
        expertise: ['AI RMF', 'Standards', 'Risk Management'],
      },
      {
        id: 'iso',
        name: 'ISO/IEC',
        category: 'Standards Organization',
        description: 'International AI standards and governance',
        expertise: ['ISO 42001', 'Standards', 'Best Practices'],
      },
      {
        id: 'fca',
        name: 'Financial Conduct Authority',
        category: 'Financial Regulator',
        description: 'AI governance for financial services',
        expertise: ['Financial Regulation', 'AI Governance', 'Compliance'],
      },
      {
        id: 'fda',
        name: 'FDA',
        category: 'Health Regulator',
        description: 'AI governance for medical devices',
        expertise: ['Medical AI', 'Regulation', 'Safety'],
      },
      {
        id: 'nato',
        name: 'NATO',
        category: 'International Alliance',
        description: 'AI principles and defense governance',
        expertise: ['Defense AI', 'Principles', 'Governance'],
      },
    ],
  },
];

interface PartnerCertification {
  level: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
}

const certifications: PartnerCertification[] = [
  {
    level: 'Certified Partner',
    description: 'Foundational partnership with CSOAI certification',
    icon: <CheckCircle2 className="w-6 h-6" />,
    benefits: [
      'CSOAI Partner badge and certification',
      'Training and enablement program',
      'Co-marketing opportunities',
      'Partner portal and resources',
      'Technical integration support',
    ],
  },
  {
    level: 'Gold Partner',
    description: 'Advanced partnership with revenue sharing',
    icon: <Award className="w-6 h-6" />,
    benefits: [
      'All Certified Partner benefits',
      'Revenue sharing model (15-25%)',
      'Dedicated partner account manager',
      'Advanced technical support',
      'Co-selling and joint go-to-market',
      'Priority in partner marketing',
    ],
  },
  {
    level: 'Platinum Partner',
    description: 'Strategic alliance with exclusive benefits',
    icon: <Zap className="w-6 h-6" />,
    benefits: [
      'All Gold Partner benefits',
      'Enhanced revenue sharing (25-35%)',
      'C-level engagement and planning',
      'Product development collaboration',
      'Exclusive territory or vertical rights',
      'Premium event and leadership opportunities',
      'Custom SLAs and terms',
    ],
  },
];

interface ExpandedService {
  [key: string]: boolean;
}

const PartnersAdvisory: React.FC = () => {
  const [expandedService, setExpandedService] = useState<ExpandedService>({});
  const [expandedTier, setExpandedTier] = useState<{ [key: string]: boolean }>({});

  const toggleService = (id: string) => {
    setExpandedService((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleTier = (name: string) => {
    setExpandedTier((prev) => ({
      ...prev,
      [name]: !prev[name],
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
            Partners & Advisory Services
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Building the world's largest AI governance ecosystem
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Partner with CSOAI to deliver AI governance solutions globally, or access expert advisory services to accelerate your governance journey.
          </p>
        </div>
      </section>

      {/* Advisory Services Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 text-center">
            Expert Advisory Services
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto">
            Access world-class expertise to design, implement, and optimize AI governance across your organization.
          </p>
        </div>

        <div className="grid gap-6">
          {advisoryServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Service Header */}
              <button
                onClick={() => toggleService(service.id)}
                className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-blue-600 mt-1">{service.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {service.title}
                      </h3>
                      <p className="text-slate-600 mt-1 text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 mt-1 ${
                      expandedService[service.id] ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Service Details */}
              {expandedService[service.id] && (
                <div className="border-t border-slate-200 px-6 py-6 space-y-6 bg-slate-50">
                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Key Deliverables & Benefits
                    </h4>
                    <div className="space-y-2">
                      {service.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-slate-700">
                          <span className="text-emerald-600 font-bold">✓</span>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration & Delivery */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded p-4 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Duration
                      </h5>
                      <p className="text-sm text-slate-700">{service.duration}</p>
                    </div>
                    <div className="bg-white rounded p-4 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Delivery Model
                      </h5>
                      <p className="text-sm text-slate-700">{service.delivery}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-4 border-t border-slate-200">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      <MessageSquare className="w-4 h-4" />
                      Schedule Consultation
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Partner Network Section */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 text-center">
              Global Partner Network
            </h2>
            <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto">
              CSOAI partners with leading organizations across consulting, technology, academia, and government to advance AI governance globally.
            </p>
          </div>

          <div className="space-y-6">
            {partnerTiers.map((tier) => (
              <div
                key={tier.name}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Tier Header */}
                <button
                  onClick={() => toggleTier(tier.name)}
                  className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg bg-${tier.color}-50 text-${tier.color}-600`}>
                        {tier.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {tier.name}
                        </h3>
                        <p className="text-slate-600 mt-1 text-sm">
                          {tier.description}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                        expandedTier[tier.name] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Partners Grid */}
                {expandedTier[tier.name] && (
                  <div className="border-t border-slate-200 px-6 py-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tier.partners.map((partner) => (
                        <div
                          key={partner.id}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <h4 className="font-semibold text-slate-900 text-sm mb-1">
                            {partner.name}
                          </h4>
                          <p className="text-xs text-slate-600 mb-3">
                            {partner.category}
                          </p>
                          <p className="text-sm text-slate-700 mb-3">
                            {partner.description}
                          </p>
                          <div className="space-y-1">
                            {partner.expertise.map((exp, idx) => (
                              <div
                                key={idx}
                                className="inline-block mr-2 mb-2 px-2 py-1 bg-white rounded text-xs text-slate-600 border border-slate-200"
                              >
                                {exp}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Program Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 text-center">
            CSOAI Partner Program
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto">
            Join a thriving partner ecosystem and grow your AI governance business with CSOAI.
          </p>
        </div>

        {/* Certification Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {certifications.map((cert, idx) => (
            <div
              key={idx}
              className="relative group bg-white rounded-lg border border-slate-200 p-8 hover:shadow-lg transition-shadow"
            >
              {idx === 2 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex justify-center mb-4 text-purple-600">
                {cert.icon}
              </div>

              <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
                {cert.level}
              </h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                {cert.description}
              </p>

              <div className="space-y-3 mb-8">
                {cert.benefits.map((benefit, benefitIdx) => (
                  <div key={benefitIdx} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    {benefit}
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  idx === 2
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Learn More
              </button>
            </div>
          ))}
        </div>

        {/* Program Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            All Partners Receive
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Award className="w-6 h-6 text-purple-600" />,
                title: 'Partner Certification',
                description: 'Recognized expertise and credibility in AI governance',
              },
              {
                icon: <BookOpen className="w-6 h-6 text-blue-600" />,
                title: 'Training & Enablement',
                description: 'Comprehensive training on CSOAI platform and best practices',
              },
              {
                icon: <Globe className="w-6 h-6 text-emerald-600" />,
                title: 'Co-Marketing',
                description: 'Joint marketing campaigns and partner visibility',
              },
              {
                icon: <Zap className="w-6 h-6 text-orange-600" />,
                title: 'Technical Support',
                description: 'Dedicated technical support and integration assistance',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-red-600" />,
                title: 'Revenue Sharing',
                description: 'Competitive commissions and revenue sharing models',
              },
              {
                icon: <Hand className="w-6 h-6 text-indigo-600" />,
                title: 'Partner Community',
                description: 'Access to partner network and collaboration opportunities',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-slate-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Requirements Section */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Partnership Opportunities
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Technology Integration',
                description:
                  'Integrate CSOAI with your platform, tools, or services. Expand your AI governance capabilities.',
                requirements: [
                  'API integration capability',
                  'Technical documentation',
                  'Ongoing support commitment',
                  'Security and compliance standards',
                ],
                cta: 'Explore Integration',
              },
              {
                title: 'Consulting & Services',
                description:
                  'Deliver CSOAI-powered AI governance services to your clients. Scale your expertise.',
                requirements: [
                  'CSOAI certification',
                  'Service delivery capability',
                  'Client references',
                  'Revenue sharing agreement',
                ],
                cta: 'Become a Service Partner',
              },
              {
                title: 'Reselling & Distribution',
                description:
                  'Resell CSOAI licenses and services to your customer base. Add new revenue streams.',
                requirements: [
                  'Sales and customer base',
                  'Partner training completion',
                  'Marketing commitment',
                  'Service support capability',
                ],
                cta: 'Start Reselling',
              },
              {
                title: 'Research & Academia',
                description:
                  'Collaborate on AI governance research and education. Advance the field together.',
                requirements: [
                  'Research institution status',
                  'Published research agenda',
                  'Publication and collaboration',
                  'Student/faculty engagement',
                ],
                cta: 'Partner with Us',
              },
            ].map((opportunity, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {opportunity.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {opportunity.description}
                </p>
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Requirements:
                  </p>
                  {opportunity.requirements.map((req, reqIdx) => (
                    <div key={reqIdx} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-600">•</span>
                      {req}
                    </div>
                  ))}
                </div>
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                  {opportunity.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Partner or Get Started?
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations transforming their AI governance with CSOAI and our partner ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold">
              <Hand className="w-5 h-5" />
              Become a Partner
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold">
              <MessageSquare className="w-5 h-5" />
              Request Advisory Services
            </button>
          </div>
        </div>
      </section>

      {/* Footer Stats */}
      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm text-slate-600 mb-8">
            CSOAI's partner network spans 40+ countries, 8 major industries, and encompasses consulting firms, technology leaders, academic institutions, and government organizations.
          </p>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Active Partners', value: '200+' },
              { label: 'Countries', value: '40+' },
              { label: 'Industries', value: '8' },
              { label: 'Employees Trained', value: '50K+' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl font-bold text-purple-600">{stat.value}</div>
                <div className="text-xs text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnersAdvisory;
