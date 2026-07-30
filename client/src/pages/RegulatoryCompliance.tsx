import { useEffect } from "react";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
  FileText,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Award
} from 'lucide-react';

export default function RegulatoryCompliance() {
  useEffect(() => { document.title = "RegulatoryCompliance | CSOAI"; }, []);
  const frameworks = [
    {
      id: 'eu-ai-act',
      name: 'EU AI Act',
      region: 'European Union',
      status: 'Active',
      deadline: 'August 2, 2026',
      description: 'Comprehensive AI regulation framework establishing risk-based requirements for AI systems',
      icon: '🇪🇺',
      coverage: '50,000+ EU enterprises',
      keyRequirements: [
        'Risk assessment and classification',
        'Transparency and documentation',
        'Human oversight mechanisms',
        'Bias monitoring and mitigation',
        'Data governance and quality',
        'Incident reporting'
      ],
      penalties: 'Up to €30M or 6% of global revenue',
      resources: [
        { title: 'Official Text', url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-act' },
        { title: 'Implementation Guide', url: 'https://digital-strategy.ec.europa.eu/' },
        { title: 'FAQ', url: 'https://digital-strategy.ec.europa.eu/' }
      ]
    },
    {
      id: 'nist-ai-rmf',
      name: 'NIST AI Risk Management Framework',
      region: 'United States',
      status: 'Active',
      deadline: 'Ongoing',
      description: 'Voluntary framework for managing AI risks in the US, adopted by federal agencies',
      icon: '🇺🇸',
      coverage: 'Federal agencies, enterprises',
      keyRequirements: [
        'AI risk mapping',
        'Measurement and monitoring',
        'Risk mitigation strategies',
        'Governance and accountability',
        'Transparency and documentation',
        'Stakeholder engagement'
      ],
      penalties: 'No direct penalties (voluntary)',
      resources: [
        { title: 'NIST AI RMF', url: 'https://www.nist.gov/ai/ai-risk-management-framework' },
        { title: 'Playbook', url: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework' },
        { title: 'Toolkit', url: 'https://www.nist.gov/ai' }
      ]
    },
    {
      id: 'tc260',
      name: 'TC260 AI Standards',
      region: 'China',
      status: 'Active',
      deadline: 'Ongoing',
      description: 'Chinese standardization for AI systems, managed by Standardization Administration',
      icon: '🇨🇳',
      coverage: 'Chinese enterprises, tech companies',
      keyRequirements: [
        'Algorithm transparency',
        'Data security',
        'Content compliance',
        'User privacy protection',
        'System reliability',
        'Fairness and bias prevention'
      ],
      penalties: 'Administrative fines and sanctions',
      resources: [
        { title: 'TC260 Portal', url: 'https://www.tc260.org.cn/' },
        { title: 'Standards Catalog', url: 'https://www.tc260.org.cn/' },
        { title: 'Technical Guidance', url: 'https://www.tc260.org.cn/' }
      ]
    },
    {
      id: 'uk-ai-bill',
      name: 'UK AI Bill',
      region: 'United Kingdom',
      status: 'In Development',
      deadline: 'TBD',
      description: 'UK\'s pro-innovation approach to AI regulation with sector-specific guidance',
      icon: '🇬🇧',
      coverage: 'UK enterprises, public sector',
      keyRequirements: [
        'Risk-based approach',
        'Transparency requirements',
        'Accountability mechanisms',
        'Data protection compliance',
        'Sector-specific guidance',
        'Incident reporting'
      ],
      penalties: 'To be determined',
      resources: [
        { title: 'UK AI Guidance', url: 'https://www.gov.uk/guidance/ai-regulation-a-pro-innovation-approach' },
        { title: 'ICO AI Guidance', url: 'https://ico.org.uk/for-organisations/ai/' },
        { title: 'Consultation Documents', url: 'https://www.gov.uk/' }
      ]
    }
  ];

  const complianceChecklist = [
    {
      category: 'Assessment & Documentation',
      items: [
        'Conduct AI risk assessment',
        'Document AI system architecture',
        'Create compliance roadmap',
        'Identify applicable regulations'
      ]
    },
    {
      category: 'Technical Implementation',
      items: [
        'Implement bias monitoring',
        'Set up data governance',
        'Deploy audit logging',
        'Establish access controls'
      ]
    },
    {
      category: 'Governance & Process',
      items: [
        'Establish AI governance committee',
        'Create incident response procedures',
        'Define escalation pathways',
        'Train staff on compliance'
      ]
    },
    {
      category: 'Monitoring & Reporting',
      items: [
        'Monitor system performance',
        'Track regulatory updates',
        'Prepare compliance reports',
        'Conduct regular audits'
      ]
    }
  ];

  const comparisonData = [
    {
      aspect: 'Risk Classification',
      euAiAct: 'Prohibited, High, Limited, Minimal',
      nistRmf: 'Continuous assessment',
      tc260: 'Algorithm classification',
      ukAiBill: 'Risk-based approach'
    },
    {
      aspect: 'Transparency',
      euAiAct: 'Mandatory disclosure',
      nistRmf: 'Recommended',
      tc260: 'Algorithm transparency',
      ukAiBill: 'Sector-specific'
    },
    {
      aspect: 'Human Oversight',
      euAiAct: 'Required for high-risk',
      nistRmf: 'Recommended',
      tc260: 'Content review required',
      ukAiBill: 'Recommended'
    },
    {
      aspect: 'Audit Requirements',
      euAiAct: 'Mandatory for high-risk',
      nistRmf: 'Recommended',
      tc260: 'Regular audits',
      ukAiBill: 'Sector-specific'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Regulatory Compliance Guide</h1>
          </div>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Comprehensive guide to AI regulatory compliance across major global frameworks and jurisdictions.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Key Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Compliance Deadline</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">Aug 2, 2026</p>
              </div>
              <Clock className="h-10 w-10 text-emerald-600" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Enterprises Affected</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">50,000+</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Frameworks</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">6+</p>
              </div>
              <FileText className="h-10 w-10 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Max Penalty</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">€30M</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Framework Details */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Major Regulatory Frameworks</h2>

          <Tabs defaultValue="eu-ai-act" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              {frameworks.map((framework) => (
                <TabsTrigger key={framework.id} value={framework.id}>
                  <span className="mr-2">{framework.icon}</span>
                  <span className="hidden sm:inline">{framework.name.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {frameworks.map((framework) => (
              <TabsContent key={framework.id} value={framework.id}>
                <Card className="p-8">
                  <div className="mb-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{framework.name}</h3>
                        <p className="text-gray-600 mt-2">{framework.description}</p>
                      </div>
                      <Badge className={framework.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {framework.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 font-semibold">Deadline</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{framework.deadline}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 font-semibold">Coverage</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{framework.coverage}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 font-semibold">Max Penalty</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{framework.penalties}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Key Requirements</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {framework.keyRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-900">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t mt-8 pt-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Resources</h4>
                    <div className="space-y-2">
                      {framework.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 hover:bg-emerald-50 rounded transition"
                        >
                          <span className="text-gray-900 font-medium">{resource.title}</span>
                          <span className="text-emerald-600">→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Framework Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Framework Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-bold text-gray-900">Aspect</th>
                  <th className="text-left p-4 font-bold text-gray-900">EU AI Act</th>
                  <th className="text-left p-4 font-bold text-gray-900">NIST RMF</th>
                  <th className="text-left p-4 font-bold text-gray-900">TC260</th>
                  <th className="text-left p-4 font-bold text-gray-900">UK AI Bill</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">{row.aspect}</td>
                    <td className="p-4 text-gray-600">{row.euAiAct}</td>
                    <td className="p-4 text-gray-600">{row.nistRmf}</td>
                    <td className="p-4 text-gray-600">{row.tc260}</td>
                    <td className="p-4 text-gray-600">{row.ukAiBill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Compliance Implementation Checklist</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {complianceChecklist.map((section, idx) => (
              <Card key={idx} className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h3>
                <div className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded border-2 border-emerald-600 flex-shrink-0 mt-0.5"></div>
                      <span className="text-gray-900">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Automate Your Compliance</h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            CSOAI automatically tracks regulatory updates, manages compliance documentation, and ensures your organization stays compliant with all major frameworks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/compliance">
              <Button className="bg-white text-emerald-600 hover:bg-gray-100">
                Start Compliance Assessment
              </Button>
            </Link>
            <Link href="/government-links">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                View All Resources
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
