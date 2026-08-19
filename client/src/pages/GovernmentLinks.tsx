import { useEffect } from "react";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  FileText, 
  Building2, 
  Shield, 
  Users, 
  TrendingUp,
  ExternalLink,
  Download,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function GovernmentLinks() {
  useEffect(() => { document.title = "GovernmentLinks | CSOAI"; }, []);
  const regions = [
    {
      name: 'European Union',
      flag: '🇪🇺',
      regulations: [
        {
          title: 'EU AI Act',
          description: 'Comprehensive AI regulation framework for the EU',
          link: 'https://digital-strategy.ec.europa.eu/en/policies/ai-act',
          status: 'Active',
          deadline: 'Transparency: Aug 2, 2026 · High-risk: Dec 2, 2027 / Aug 2, 2028 (Digital Omnibus)'
        },
        {
          title: 'GDPR',
          description: 'General Data Protection Regulation',
          link: 'https://gdpr-info.eu/',
          status: 'Active',
          deadline: 'Ongoing'
        },
        {
          title: 'Digital Services Act',
          description: 'Regulation of digital services in the EU',
          link: 'https://digital-strategy.ec.europa.eu/en/policies/digital-services-act-package',
          status: 'Active',
          deadline: 'Ongoing'
        }
      ]
    },
    {
      name: 'United States',
      flag: '🇺🇸',
      regulations: [
        {
          title: 'NIST AI Risk Management Framework',
          description: 'US framework for managing AI risks',
          link: 'https://www.nist.gov/ai/ai-risk-management-framework',
          status: 'Active',
          deadline: 'Ongoing'
        },
        {
          title: 'Executive Order on AI',
          description: 'Presidential order on AI governance',
          link: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/',
          status: 'Active',
          deadline: 'Ongoing'
        },
        {
          title: 'FTC AI Guidelines',
          description: 'Federal Trade Commission guidance on AI',
          link: 'https://www.ftc.gov/news-events/news/2023/10/ftc-proposes-rule-prohibiting-unfair-or-deceptive-ai-practices',
          status: 'Proposed',
          deadline: 'TBD'
        }
      ]
    },
    {
      name: 'United Kingdom',
      flag: '🇬🇧',
      regulations: [
        {
          title: 'UK AI Bill',
          description: 'UK framework for AI regulation',
          link: 'https://www.gov.uk/guidance/ai-regulation-a-pro-innovation-approach',
          status: 'In Development',
          deadline: 'TBD'
        },
        {
          title: 'ICO AI Guidance',
          description: 'Information Commissioner\'s Office AI guidance',
          link: 'https://ico.org.uk/for-organisations/ai/',
          status: 'Active',
          deadline: 'Ongoing'
        }
      ]
    },
    {
      name: 'China',
      flag: '🇨🇳',
      regulations: [
        {
          title: 'TC260 AI Standards',
          description: 'Standardization Administration of China AI standards',
          link: 'https://www.tc260.org.cn/',
          status: 'Active',
          deadline: 'Ongoing'
        },
        {
          title: 'CAC AI Governance',
          description: 'Cyberspace Administration of China AI rules',
          link: 'http://www.cac.gov.cn/',
          status: 'Active',
          deadline: 'Ongoing'
        }
      ]
    },
    {
      name: 'Canada',
      flag: '🇨🇦',
      regulations: [
        {
          title: 'Canada AI Act',
          description: 'Canadian legislation on AI governance',
          link: 'https://www.justice.gc.ca/eng/csj-sjc/ai-ia/index.html',
          status: 'In Development',
          deadline: 'TBD'
        },
        {
          title: 'PIPEDA',
          description: 'Personal Information Protection and Electronic Documents Act',
          link: 'https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/',
          status: 'Active',
          deadline: 'Ongoing'
        }
      ]
    },
    {
      name: 'Australia',
      flag: '🇦🇺',
      regulations: [
        {
          title: 'Australia AI Governance',
          description: 'Australian approach to AI regulation',
          link: 'https://www.industry.gov.au/publications/artificial-intelligence-roadmap',
          status: 'In Development',
          deadline: 'TBD'
        },
        {
          title: 'Privacy Act',
          description: 'Australian Privacy Principles',
          link: 'https://www.oaic.gov.au/privacy/the-privacy-act',
          status: 'Active',
          deadline: 'Ongoing'
        }
      ]
    }
  ];

  const resources = [
    {
      title: 'Government Portals',
      icon: Building2,
      items: [
        { name: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/' },
        { name: 'US AI.gov', url: 'https://ai.gov/' },
        { name: 'UK DCMS', url: 'https://www.dcms.gov.uk/' },
        { name: 'China CAC', url: 'http://www.cac.gov.cn/' }
      ]
    },
    {
      title: 'Standards Organizations',
      icon: FileText,
      items: [
        { name: 'ISO/IEC JTC 1 AI', url: 'https://www.iso.org/committee/6794475.html' },
        { name: 'NIST', url: 'https://www.nist.gov/ai' },
        { name: 'TC260', url: 'https://www.tc260.org.cn/' },
        { name: 'IEEE', url: 'https://standards.ieee.org/industry-connections/ec/autonomous-systems.html' }
      ]
    },
    {
      title: 'Research & Documentation',
      icon: BookOpen,
      items: [
        { name: 'OECD AI Policy Observatory', url: 'https://oecd.ai/' },
        { name: 'Stanford AI Index', url: 'https://aiindex.stanford.edu/' },
        { name: 'Partnership on AI', url: 'https://www.partnershiponai.org/' },
        { name: 'AI Now Institute', url: 'https://ainowinstitute.org/' }
      ]
    },
    {
      title: 'Compliance Tools',
      icon: Shield,
      items: [
        { name: 'CSOAI Platform', url: '/' },
        { name: 'EU Compliance Checker', url: 'https://digital-strategy.ec.europa.eu/' },
        { name: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework' },
        { name: 'ISO 42001', url: 'https://www.iso.org/standard/81230.html' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'In Development':
        return 'bg-blue-100 text-blue-800';
      case 'Proposed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Globe className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Government & Regulatory Links</h1>
          </div>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Comprehensive directory of government resources, regulatory frameworks, and compliance standards for AI governance worldwide.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick Navigation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {regions.map((region) => (
              <a
                key={region.name}
                href={`#${region.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow-md transition text-center"
              >
                <div className="text-3xl mb-2">{region.flag}</div>
                <p className="font-semibold text-gray-900 text-sm">{region.name}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Regional Regulations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Regional Regulations & Frameworks</h2>
          
          <div className="space-y-12">
            {regions.map((region) => (
              <div key={region.name} id={region.name.toLowerCase().replace(/\s+/g, '-')}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{region.flag}</span>
                  <h3 className="text-2xl font-bold text-gray-900">{region.name}</h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {region.regulations.map((reg, idx) => (
                    <Card key={idx} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex-1">{reg.title}</h4>
                        <Badge className={getStatusColor(reg.status)}>
                          {reg.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{reg.description}</p>
                      
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600 font-semibold">Deadline/Status</p>
                        <p className="text-sm font-mono text-gray-900">{reg.deadline}</p>
                      </div>

                      <a
                        href={reg.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        Learn More
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Government & Standards Resources</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {resources.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Card key={idx} className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Icon className="h-8 w-8 text-emerald-600" />
                    <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {category.items.map((item, itemIdx) => (
                      <a
                        key={itemIdx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 hover:bg-emerald-50 rounded transition"
                      >
                        <span className="text-gray-900 font-medium">{item.name}</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Key Dates */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Key Regulatory Dates</h2>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">EU AI Act Enforcement</h4>
                  <p className="text-gray-600 text-sm">Penalties + transparency: August 2, 2026 · High-risk: December 2, 2027 / August 2, 2028</p>
                  <p className="text-xs text-gray-500 mt-1">Staged deadlines as amended by the Digital Omnibus (Reg (EU) 2026/1744)</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">NIST AI RMF</h4>
                  <p className="text-gray-600 text-sm">Ongoing Implementation</p>
                  <p className="text-xs text-gray-500 mt-1">US government adoption and enterprise guidance</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">ISO 42001</h4>
                  <p className="text-gray-600 text-sm">2024-2025</p>
                  <p className="text-xs text-gray-500 mt-1">International AI management system standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Compliant with CSOAI</h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Our platform automatically tracks regulatory updates and helps your organization stay compliant with all major frameworks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/compliance">
              <Button className="bg-white text-emerald-600 hover:bg-gray-100">
                View Compliance Tools
              </Button>
            </Link>
            <a
              href="https://digital-strategy.ec.europa.eu/en/policies/ai-act"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Read EU AI Act
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
