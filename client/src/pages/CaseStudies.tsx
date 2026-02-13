import React, { useState } from 'react';
import {
  Building2,
  Heart,
  Users,
  Cpu,
  Factory,
  Globe,
  TrendingUp,
  CheckCircle2,
  Award,
  Shield,
  Zap,
  BarChart3,
  Clock,
  Target,
  ArrowRight,
  Briefcase,
  Sparkles,
  Lightbulb,
  Gauge,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: 'financial' | 'healthcare' | 'government' | 'technology' | 'manufacturing' | 'multinational';
  featured?: boolean;
  challenge: string;
  solution: string;
  frameworks: string[];
  results: {
    metric: string;
    value: string;
    description: string;
  }[];
  icon: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
  industryColor: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 'european-bank',
    title: 'EU AI Act Compliance for Financial Services',
    company: 'Global Bank (European)',
    industry: 'financial',
    featured: true,
    challenge:
      'A major European bank deployed high-risk AI systems for credit scoring and lending decisions across 15 countries. They faced fragmented regulatory requirements across EU member states and needed to demonstrate compliance with the newly enacted EU AI Act while maintaining system performance.',
    solution:
      'CSOAI implemented a centralized governance hub that mapped their AI systems against EU AI Act requirements, managed documentation automatically, tracked real-time compliance status, and generated audit-ready reports. The platform monitored model bias, fairness metrics, and explainability across all lending algorithms.',
    frameworks: ['EU AI Act', 'Basel III', 'ISO 42001', 'GDPR'],
    results: [
      {
        metric: 'Regulatory Readiness',
        value: '100%',
        description: 'Achieved full EU AI Act compliance in 6 months',
      },
      {
        metric: 'Documentation Time',
        value: '90%',
        description: 'Reduction in compliance documentation effort',
      },
      {
        metric: 'Audit Cycles',
        value: '40%',
        description: 'Faster regulatory audit completion',
      },
      {
        metric: 'Risk Incidents',
        value: '60%',
        description: 'Reduction in AI-related compliance incidents',
      },
    ],
    icon: <Building2 className="w-12 h-12" />,
    backgroundColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    industryColor: 'text-blue-600',
  },
  {
    id: 'hospital-network',
    title: 'Clinical AI Governance for Healthcare Systems',
    company: 'Regional Healthcare Network',
    industry: 'healthcare',
    featured: true,
    challenge:
      'A hospital network implemented AI systems for medical image analysis, clinical decision support, and patient risk stratification across 25 facilities. They needed to ensure patient safety, FDA compliance, clinical validation, and interoperability across diverse IT systems.',
    solution:
      'CSOAI provided a unified safety-first governance framework with continuous clinical validation monitoring, automated FDA compliance tracking, patient safety incident detection, and model performance dashboards. The platform enabled rapid deployment while maintaining rigorous safety standards.',
    frameworks: ['EU AI Act', 'FDA AI/ML Guidance', 'HIPAA', 'ISO 13485'],
    results: [
      {
        metric: 'Safety Incidents',
        value: '85%',
        description: 'Reduction in AI-related patient safety risks',
      },
      {
        metric: 'Deployment Time',
        value: '70%',
        description: 'Faster clinical AI system validation',
      },
      {
        metric: 'Monitoring Efficiency',
        value: 'Real-time',
        description: 'Continuous model performance tracking',
      },
      {
        metric: 'Regulatory Approval',
        value: '8 weeks',
        description: 'Average FDA/regulatory approval cycle',
      },
    ],
    icon: <Heart className="w-12 h-12" />,
    backgroundColor: 'bg-red-50',
    borderColor: 'border-red-200',
    industryColor: 'text-red-600',
  },
  {
    id: 'national-regulator',
    title: 'Government AI Oversight Framework',
    company: 'National AI Regulator',
    industry: 'government',
    challenge:
      'A government agency tasked with AI oversight needed to monitor AI systems deployed across public sector organizations including law enforcement, benefits administration, and immigration. They required transparency, civil rights protection, and cross-agency governance.',
    solution:
      'CSOAI deployed a government-grade governance platform with public transparency dashboards, civil rights impact assessment tools, cross-agency AI registry, automated compliance monitoring, and democratized accountability mechanisms. The system enabled oversight without stifling innovation.',
    frameworks: ['NIST AI RMF', 'EU AI Act', 'Executive Orders', 'ISO 42001'],
    results: [
      {
        metric: 'AI Systems Monitored',
        value: '500+',
        description: 'Government AI systems under governance',
      },
      {
        metric: 'Transparency Index',
        value: '95%',
        description: 'Public visibility into government AI deployments',
      },
      {
        metric: 'Civil Rights Incidents',
        value: '75%',
        description: 'Reduction in discriminatory AI outcomes',
      },
      {
        metric: 'Response Time',
        value: '48 hours',
        description: 'Average AI incident response time',
      },
    ],
    icon: <Users className="w-12 h-12" />,
    backgroundColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    industryColor: 'text-purple-600',
  },
  {
    id: 'tech-company',
    title: 'Enterprise AI Ethics Framework',
    company: 'Global Technology Company',
    industry: 'technology',
    challenge:
      'A leading tech company deployed AI across 50+ products and services including recommendations, content moderation, and search algorithms. They faced pressure to demonstrate ethical AI practices, manage reputational risk, and comply with emerging regulations across multiple jurisdictions.',
    solution:
      'CSOAI implemented an enterprise ethics framework with automated bias testing, fairness metrics, transparency reporting, model governance, and stakeholder dashboards. The platform provided real-time visibility into AI system behavior and enabled rapid response to bias or fairness issues.',
    frameworks: ['ISO 42001', 'NIST AI RMF', 'EU AI Act', 'AI Ethics Principles'],
    results: [
      {
        metric: 'Bias Detection',
        value: '99.2%',
        description: 'Automated detection of fairness issues',
      },
      {
        metric: 'Response Time',
        value: '24 hours',
        description: 'Average response to AI fairness alerts',
      },
      {
        metric: 'Stakeholder Trust',
        value: '87%',
        description: 'Improvement in external stakeholder trust',
      },
      {
        metric: 'Compliance Coverage',
        value: '100%',
        description: 'All AI systems under active governance',
      },
    ],
    icon: <Cpu className="w-12 h-12" />,
    backgroundColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    industryColor: 'text-emerald-600',
  },
  {
    id: 'manufacturing',
    title: 'Predictive AI Safety for Manufacturing',
    company: 'Advanced Manufacturing Corp',
    industry: 'manufacturing',
    challenge:
      'A multinational manufacturing company deployed AI for predictive maintenance, quality control, and process optimization across 20 factories in different countries. They needed to ensure worker safety, prevent equipment failures, and comply with ISO and regional AI regulations.',
    solution:
      'CSOAI provided a safety-first AI monitoring platform with real-time anomaly detection, predictive maintenance validation, worker safety impact assessment, and ISO 42001 compliance automation. The system integrated with existing manufacturing execution systems and provided instant alerts for safety-critical issues.',
    frameworks: ['ISO 42001', 'ISO 50001', 'NIST AI RMF', 'IEC 61508'],
    results: [
      {
        metric: 'Equipment Failures Prevented',
        value: '92%',
        description: 'Reduction in unplanned maintenance incidents',
      },
      {
        metric: 'Worker Safety Incidents',
        value: '78%',
        description: 'Fewer incidents involving AI-related equipment failures',
      },
      {
        metric: 'Compliance Audits Passed',
        value: '100%',
        description: 'All ISO and safety audits cleared without issues',
      },
      {
        metric: 'Operational Efficiency',
        value: '35%',
        description: 'Improved overall equipment effectiveness (OEE)',
      },
    ],
    icon: <Factory className="w-12 h-12" />,
    backgroundColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    industryColor: 'text-orange-600',
  },
  {
    id: 'multinational-compliance',
    title: 'Cross-Border AI Governance',
    company: 'International Commerce Corp',
    industry: 'multinational',
    challenge:
      'A multinational corporation deployed AI-powered supply chain optimization, pricing engines, and customer analytics across 45 countries with different regulatory requirements (EU AI Act, NIST RMF, national AI strategies, data protection laws). Managing compliance across jurisdictions was impossible with legacy tools.',
    solution:
      'CSOAI deployed a global governance platform that automatically mapped AI systems against country-specific requirements, maintained jurisdiction-specific compliance dashboards, managed localized documentation, tracked regulatory changes in real-time, and provided unified reporting. The system reduced compliance risk across all markets.',
    frameworks: ['EU AI Act', 'NIST AI RMF', 'UK AI Bill', 'China AI Regulations', 'ISO 42001'],
    results: [
      {
        metric: 'Compliance Coverage',
        value: '45 nations',
        description: 'AI systems compliant across 45 jurisdictions',
      },
      {
        metric: 'Regulatory Risk',
        value: '82%',
        description: 'Reduction in regulatory non-compliance risk',
      },
      {
        metric: 'Time to Deploy',
        value: '60%',
        description: 'Faster global AI system deployment',
      },
      {
        metric: 'Incident Response',
        value: '48 hours',
        description: 'Multi-jurisdiction incident coordination',
      },
    ],
    icon: <Globe className="w-12 h-12" />,
    backgroundColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    industryColor: 'text-indigo-600',
  },
  {
    id: 'fintech-startup',
    title: 'Rapid Compliance Scaling for Fintech',
    company: 'Emerging Fintech Startup',
    industry: 'financial',
    challenge:
      'A high-growth fintech startup launching AI-powered investment advisory services needed to achieve regulatory compliance across multiple jurisdictions within months, without slowing product development or adding significant overhead to their lean team.',
    solution:
      'CSOAI provided a streamlined compliance platform with pre-configured templates for fintech requirements, automated bias and fairness testing, real-time model monitoring, and audit-ready documentation. The startup could scale compliance alongside product growth without hiring compliance specialists.',
    frameworks: ['EU AI Act', 'MiFID II', 'Fair Lending Laws', 'ISO 42001'],
    results: [
      {
        metric: 'Time to Compliance',
        value: '6 weeks',
        description: 'Regulatory approval in record time',
      },
      {
        metric: 'Compliance Team Size',
        value: '1 person',
        description: 'Single person managing CSOAI platform',
      },
      {
        metric: 'Market Entry Speed',
        value: '3x',
        description: 'Faster launch in new regulated markets',
      },
      {
        metric: 'Cost Savings',
        value: '$2.4M',
        description: 'vs. traditional compliance consultants',
      },
    ],
    icon: <TrendingUp className="w-12 h-12" />,
    backgroundColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    industryColor: 'text-cyan-600',
  },
];

export default function CaseStudies() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const industries = [
    { id: 'all', label: 'All Industries', count: caseStudies.length },
    { id: 'financial', label: 'Financial Services', count: caseStudies.filter(cs => cs.industry === 'financial').length },
    { id: 'healthcare', label: 'Healthcare', count: caseStudies.filter(cs => cs.industry === 'healthcare').length },
    { id: 'government', label: 'Government', count: caseStudies.filter(cs => cs.industry === 'government').length },
    { id: 'technology', label: 'Technology', count: caseStudies.filter(cs => cs.industry === 'technology').length },
    { id: 'manufacturing', label: 'Manufacturing', count: caseStudies.filter(cs => cs.industry === 'manufacturing').length },
  ];

  const filteredCaseStudies =
    selectedIndustry === 'all'
      ? caseStudies
      : caseStudies.filter(cs => cs.industry === selectedIndustry);

  const featuredCaseStudy = caseStudies.find(cs => cs.featured);
  const regularCaseStudies = filteredCaseStudies.filter(cs => !cs.featured || selectedIndustry !== 'all');

  const stats = [
    { label: 'Organizations Governed', value: '500+', icon: <Building2 className="w-6 h-6" />, color: 'emerald' },
    { label: 'AI Systems Monitored', value: '12,000+', icon: <Cpu className="w-6 h-6" />, color: 'blue' },
    { label: 'Countries Covered', value: '45+', icon: <Globe className="w-6 h-6" />, color: 'purple' },
    { label: 'Compliance Frameworks', value: '8+', icon: <Shield className="w-6 h-6" />, color: 'indigo' },
  ];

  const getStatColors = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-t-emerald-400' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-t-blue-400' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-t-purple-400' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-t-indigo-400' },
    };
    return colorMap[color] || colorMap.emerald;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Decorative Blobs */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20 overflow-hidden">
        {/* Decorative gradient circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        <div className="container max-w-6xl relative z-10">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Real-World Results</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            How Organizations Govern AI with CSOAI
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl">
            From financial institutions to government agencies, organizations worldwide are using CSOAI to achieve compliance,
            reduce risk, and accelerate AI deployment with confidence.
          </p>
        </div>
      </div>

      {/* Results at a Glance with Enhanced Stats Cards */}
      <div className="container max-w-6xl py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Results at a Glance</h2>
          <p className="text-gray-600">Impact across organizations using CSOAI</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const colors = getStatColors(stat.color);
            return (
              <Card
                key={idx}
                className={`relative p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${colors.border} rounded-xl overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className={`flex justify-center mb-4 ${colors.text}`}>
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Featured Case Study with Enhanced Design */}
      {featuredCaseStudy && selectedIndustry === 'all' && (
        <div className="container max-w-6xl py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Featured Case Study</h2>
          </div>
          <Card className={`${featuredCaseStudy.backgroundColor} border-2 ${featuredCaseStudy.borderColor} p-8 md:p-12 hover:shadow-2xl transition-all duration-300 relative overflow-hidden rounded-2xl`}>
            {/* Gradient header strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
              featuredCaseStudy.id === 'european-bank' ? 'from-blue-400 via-blue-500 to-blue-600' :
              featuredCaseStudy.id === 'hospital-network' ? 'from-red-400 via-red-500 to-red-600' :
              'from-emerald-400 via-emerald-500 to-emerald-600'
            }`}></div>

            <div className="flex items-start gap-6 mb-8">
              {/* Large icon with gradient background circle */}
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
                featuredCaseStudy.id === 'european-bank' ? 'bg-gradient-to-br from-blue-200 to-blue-100 text-blue-700' :
                featuredCaseStudy.id === 'hospital-network' ? 'bg-gradient-to-br from-red-200 to-red-100 text-red-700' :
                'bg-gradient-to-br from-emerald-200 to-emerald-100 text-emerald-700'
              }`}>
                {featuredCaseStudy.icon}
                <div className={`absolute inset-0 rounded-full opacity-20 mix-blend-overlay ${
                  featuredCaseStudy.id === 'european-bank' ? 'bg-blue-300' :
                  featuredCaseStudy.id === 'hospital-network' ? 'bg-red-300' :
                  'bg-emerald-300'
                }`}></div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{featuredCaseStudy.title}</h3>
                    <p className="text-lg font-semibold text-gray-700">{featuredCaseStudy.company}</p>
                  </div>
                  <Badge className="w-fit bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300 font-semibold">Featured</Badge>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Challenge
                </h4>
                <p className="text-gray-700 leading-relaxed">{featuredCaseStudy.challenge}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Solution
                </h4>
                <p className="text-gray-700 leading-relaxed">{featuredCaseStudy.solution}</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Key Results
              </h4>
              <div className="grid md:grid-cols-4 gap-4">
                {featuredCaseStudy.results.map((result, idx) => {
                  const borderColors = ['border-l-emerald-500', 'border-l-blue-500', 'border-l-purple-500', 'border-l-orange-500'];
                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-lg p-4 border-l-4 ${borderColors[idx % borderColors.length]} hover:shadow-md transition-shadow`}
                    >
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        {result.value}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-2">{result.metric}</div>
                      <div className="text-xs text-gray-600">{result.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {featuredCaseStudy.frameworks.map((framework, idx) => (
                <Badge
                  key={idx}
                  className="bg-white text-gray-700 border-gray-300 hover:border-gray-400 transition-colors"
                >
                  {framework}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Industry Filter with Gradient Pills and Count Badges */}
      <div className="container max-w-6xl py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-8">All Case Studies</h2>
          <div className="flex flex-wrap gap-3">
            {industries.map(industry => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedIndustry === industry.id
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {industry.label}
                <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                  selectedIndustry === industry.id
                    ? 'bg-emerald-700/30 text-emerald-100'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {industry.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Case Study Cards with Enhanced Design */}
        <div className="grid md:grid-cols-2 gap-8">
          {regularCaseStudies.map(caseStudy => {
            const headerGradients: Record<string, string> = {
              'european-bank': 'from-blue-400 to-blue-500',
              'hospital-network': 'from-red-400 to-red-500',
              'national-regulator': 'from-purple-400 to-purple-500',
              'tech-company': 'from-emerald-400 to-emerald-500',
              'manufacturing': 'from-orange-400 to-orange-500',
              'multinational-compliance': 'from-indigo-400 to-indigo-500',
              'fintech-startup': 'from-cyan-400 to-cyan-500',
            };

            const gradientClass = headerGradients[caseStudy.id] || 'from-emerald-400 to-emerald-500';

            return (
              <Card
                key={caseStudy.id}
                className={`${caseStudy.backgroundColor} border-2 ${caseStudy.borderColor} overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl`}
              >
                {/* Gradient header strip */}
                <div className={`h-1 bg-gradient-to-r ${gradientClass}`}></div>

                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    {/* Gradient background icon badge */}
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${
                      caseStudy.id === 'european-bank' ? 'from-blue-200 to-blue-100 text-blue-700' :
                      caseStudy.id === 'hospital-network' ? 'from-red-200 to-red-100 text-red-700' :
                      caseStudy.id === 'national-regulator' ? 'from-purple-200 to-purple-100 text-purple-700' :
                      caseStudy.id === 'tech-company' ? 'from-emerald-200 to-emerald-100 text-emerald-700' :
                      caseStudy.id === 'manufacturing' ? 'from-orange-200 to-orange-100 text-orange-700' :
                      caseStudy.id === 'multinational-compliance' ? 'from-indigo-200 to-indigo-100 text-indigo-700' :
                      'from-cyan-200 to-cyan-100 text-cyan-700'
                    }`}>
                      {caseStudy.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{caseStudy.title}</h3>
                      <p className="text-sm font-semibold text-gray-700">{caseStudy.company}</p>
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Challenge
                      </h4>
                      <p className="text-sm text-gray-700 line-clamp-3">{caseStudy.challenge}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Key Results
                    </h4>
                    <div className="space-y-2">
                      {caseStudy.results.slice(0, 2).map((result, idx) => {
                        const borderColorMap: Record<string, string> = {
                          'european-bank': 'border-l-blue-500',
                          'hospital-network': 'border-l-red-500',
                          'national-regulator': 'border-l-purple-500',
                          'tech-company': 'border-l-emerald-500',
                          'manufacturing': 'border-l-orange-500',
                          'multinational-compliance': 'border-l-indigo-500',
                          'fintech-startup': 'border-l-cyan-500',
                        };
                        const borderColor = borderColorMap[caseStudy.id] || 'border-l-emerald-500';

                        return (
                          <div key={idx} className={`flex items-center gap-3 bg-white rounded-lg p-3 border-l-4 ${borderColor}`}>
                            <div className="flex-1">
                              <div className="font-bold text-lg text-emerald-600">{result.value}</div>
                              <div className="text-xs text-gray-600">{result.metric}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Frameworks</h4>
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.frameworks.slice(0, 3).map((framework, idx) => (
                        <Badge key={idx} className="bg-white text-gray-700 border-gray-300 text-xs hover:border-gray-400 transition-colors">
                          {framework}
                        </Badge>
                      ))}
                      {caseStudy.frameworks.length > 3 && (
                        <Badge className="bg-white text-gray-700 border-gray-300 text-xs hover:border-gray-400 transition-colors">
                          +{caseStudy.frameworks.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold transition-all duration-200">
                    Read Full Case Study
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredCaseStudies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No case studies found for this industry.</p>
          </div>
        )}
      </div>

      {/* Common Patterns & Success Factors with Gradient Icon Circles */}
      <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 py-16 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>

        <div className="container max-w-6xl relative z-10">
          <h2 className="text-3xl font-bold mb-4">Common Success Patterns</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">
            Organizations that succeed with CSOAI share these characteristics:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-l-4 border-emerald-500 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Governance-First Approach</h3>
                  <p className="text-gray-700">
                    Organizations embed AI governance from the start, treating it as part of product development, not an afterthought.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-blue-500 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Real-Time Monitoring</h3>
                  <p className="text-gray-700">
                    Continuous monitoring of model performance, fairness, and compliance ensures issues are caught instantly, not during audits.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-purple-500 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Cross-Functional Alignment</h3>
                  <p className="text-gray-700">
                    Success requires collaboration between product, engineering, compliance, and executive teams—CSOAI facilitates this alignment.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-orange-500 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Proactive Risk Management</h3>
                  <p className="text-gray-700">
                    Organizations that use CSOAI to identify and address risks before they become problems save millions in remediation costs.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Case Study Breakdown by Framework with Enhanced Cards */}
      <div className="container max-w-6xl py-16">
        <h2 className="text-3xl font-bold mb-4">Frameworks in Action</h2>
        <p className="text-gray-600 mb-8">
          CSOAI supports compliance with all major AI governance frameworks
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-blue-500 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-200 to-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">EU AI Act</h4>
            <p className="text-sm text-gray-600 mb-4">
              High-risk AI system classification, documentation, and real-time monitoring
            </p>
            <p className="text-xs text-gray-500">
              Used by: {caseStudies.filter(cs => cs.frameworks.includes('EU AI Act')).length} organizations
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-purple-500 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-200 to-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Gauge className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">NIST AI RMF</h4>
            <p className="text-sm text-gray-600 mb-4">
              Risk management framework with continuous assessment and remediation tracking
            </p>
            <p className="text-xs text-gray-500">
              Used by: {caseStudies.filter(cs => cs.frameworks.includes('NIST AI RMF')).length} organizations
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-emerald-500 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">ISO 42001</h4>
            <p className="text-sm text-gray-600 mb-4">
              AI management system certification support and compliance verification
            </p>
            <p className="text-xs text-gray-500">
              Used by: {caseStudies.filter(cs => cs.frameworks.includes('ISO 42001')).length} organizations
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-orange-500 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-200 to-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">Industry-Specific</h4>
            <p className="text-sm text-gray-600 mb-4">
              FDA, HIPAA, Basel III, MiFID II, and other regulatory requirements
            </p>
            <p className="text-xs text-gray-500">
              Used by: {caseStudies.length} organizations
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20 overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-32 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>

        <div className="container max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Govern Your AI Systems?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Join 500+ organizations that have transformed their AI governance with CSOAI.
            From rapid compliance to continuous monitoring, we've got you covered.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white text-lg px-8 py-6 font-semibold transition-all duration-200"
              asChild
            >
              <Link href="/enterprise-onboarding">
                Schedule a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-emerald-400 text-emerald-300 hover:bg-emerald-900/20 text-lg px-8 py-6 font-semibold transition-all duration-200"
              asChild
            >
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>

          <div className="mt-12 pt-12 border-t border-emerald-900/30 grid md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-200/20 to-emerald-100/20 text-emerald-400 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">Enterprise Ready</h3>
              <p className="text-gray-300 text-sm">
                Built for organizations of all sizes, from startups to Fortune 500 companies
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-200/20 to-emerald-100/20 text-emerald-400 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">Fast Implementation</h3>
              <p className="text-gray-300 text-sm">
                Get up and running in weeks, not months. Rapid deployment and quick ROI
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-200/20 to-emerald-100/20 text-emerald-400 flex items-center justify-center mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">Proven Results</h3>
              <p className="text-gray-300 text-sm">
                Thousands of success stories across industries and geographies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section Preview */}
      <div className="container max-w-6xl py-16">
        <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <Card className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-3">How long does implementation take?</h3>
            <p className="text-gray-700">
              Most organizations are live with CSOAI within 4-8 weeks. The timeline depends on system complexity and existing governance maturity.
              We provide complete implementation support including staff training and process integration.
            </p>
          </Card>

          <Card className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-3">Which frameworks does CSOAI support?</h3>
            <p className="text-gray-700">
              CSOAI supports all major AI governance frameworks including EU AI Act, NIST AI Risk Management Framework, ISO 42001, and industry-specific
              requirements like FDA guidance, Basel III, and HIPAA. Our framework library is continuously updated as new regulations emerge.
            </p>
          </Card>

          <Card className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-3">Can CSOAI integrate with existing systems?</h3>
            <p className="text-gray-700">
              Yes. CSOAI integrates with ML platforms, data warehouses, cloud services, and enterprise systems. We provide APIs, connectors, and
              professional integration services to ensure seamless adoption within your existing technology stack.
            </p>
          </Card>

          <Card className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg mb-3">What ROI can we expect?</h3>
            <p className="text-gray-700">
              Organizations typically see 40-80% reduction in compliance costs, 60-90% faster audit cycles, and significant risk reduction.
              Most see positive ROI within 6 months through avoided compliance incidents and faster time-to-market for AI products.
            </p>
          </Card>
        </div>
      </div>

      {/* Bottom CTA with Decorative Element */}
      <div className="relative bg-gradient-to-r from-emerald-50 via-blue-50 to-emerald-50 border-t-2 border-emerald-200 py-12 overflow-hidden">
        <div className="absolute top-0 right-20 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>

        <div className="container max-w-4xl text-center relative z-10">
          <h3 className="text-2xl font-bold mb-4">See What's Possible with CSOAI</h3>
          <p className="text-gray-700 mb-8">
            Explore how organizations like yours are achieving AI governance excellence
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold transition-all duration-200" asChild>
              <Link href="/enterprise-onboarding">
                Request Demo
              </Link>
            </Button>
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold transition-all duration-200" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
