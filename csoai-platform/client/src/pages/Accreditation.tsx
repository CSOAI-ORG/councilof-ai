/**
 * CSOAI Accreditation Page
 * Explains CSOAI's role as the global regulatory authority for AI Safety
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Shield,
  Globe,
  CheckCircle2,
  Award,
  FileCheck,
  Users,
  Building2,
  ArrowRight,
  Download,
  ExternalLink,
} from 'lucide-react';

export default function Accreditation() {
  const frameworks = [
    {
      name: 'EU AI Act',
      region: 'European Union',
      articles: '113 Articles',
      status: 'Fully Compliant',
      icon: '🇪🇺',
    },
    {
      name: 'NIST AI RMF',
      region: 'United States',
      articles: '72 Guidelines',
      status: 'Fully Compliant',
      icon: '🇺🇸',
    },
    {
      name: 'TC260 (GB/T 42459-2023)',
      region: 'China',
      articles: '56 Standards',
      status: 'Fully Compliant',
      icon: '🇨🇳',
    },
    {
      name: 'ISO/IEC 42001',
      region: 'International',
      articles: 'AI Management',
      status: 'Aligned',
      icon: '🌍',
    },
  ];

  const accreditationLevels = [
    {
      level: 'Foundation',
      title: 'AI Safety Fundamentals',
      duration: '40 hours',
      requirements: ['Complete 5 core courses', 'Pass foundation exam (70%)', 'Ethics assessment'],
      badge: 'Foundation Certified',
    },
    {
      level: 'Professional',
      title: 'Certified AI Safety Analyst',
      duration: '120 hours',
      requirements: [
        'Foundation certification',
        'Complete all 15 courses',
        'Pass professional exam (80%)',
        '10 practical assessments',
        'Peer review submission',
      ],
      badge: 'Professionally Certified',
    },
    {
      level: 'Expert',
      title: 'Senior AI Safety Specialist',
      duration: '200+ hours',
      requirements: [
        'Professional certification',
        'Advanced specialization track',
        'Pass expert exam (85%)',
        '50+ real-world assessments',
        'Published case study',
        'Mentorship of 5 analysts',
      ],
      badge: 'Expert Certified',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <img
                src="/csoai-official-seal.png"
                alt="CSOAI Official Seal"
                className="h-32 w-32"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Global AI Safety Accreditation Authority
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              CSOAI is the world's first independent accreditation body for AI Safety professionals,
              recognized across 120+ countries and aligned with all major regulatory frameworks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
                  Start Certification
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-blue-800">
                <Download className="mr-2 h-5 w-5" />
                Download Standards
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why CSOAI Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why CSOAI is the Global Standard
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Unlike vendor-specific certifications, CSOAI maintains complete independence from all AI companies,
              ensuring unbiased, globally-recognized credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-blue-100">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>100% Independent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No financial ties to OpenAI, Google, Microsoft, Anthropic, or any AI vendor.
                  Our only incentive is public safety.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100">
              <CardHeader>
                <Globe className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Globally Recognized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Aligned with EU AI Act, NIST AI RMF, China TC260, and ISO 42001.
                  Recognized in 120+ countries worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Industry Trusted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Certified analysts working with Fortune 500 companies,
                  governments, and startups globally.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accreditation Badges */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Official CSOAI Accreditation Marks
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <img
                  src="/csoai-official-seal.png"
                  alt="CSOAI Official Seal"
                  className="h-40 w-40 mx-auto mb-4"
                />
                <h4 className="font-semibold text-gray-900 mb-2">Official Seal</h4>
                <p className="text-sm text-gray-600">
                  Primary accreditation mark for all certified professionals
                </p>
              </div>
              <div className="text-center">
                <img
                  src="/tc260-compliance-badge.png"
                  alt="TC260 Compliance"
                  className="h-40 w-40 mx-auto mb-4"
                />
                <h4 className="font-semibold text-gray-900 mb-2">TC260 Compliant</h4>
                <p className="text-sm text-gray-600">
                  China AI Systems Standard GB/T 42459-2023
                </p>
              </div>
              <div className="text-center">
                <img
                  src="/pdca-certification-mark.png"
                  alt="PDCA Certified"
                  className="h-40 w-40 mx-auto mb-4"
                />
                <h4 className="font-semibold text-gray-900 mb-2">PDCA Certified</h4>
                <p className="text-sm text-gray-600 mb-4">
                  SOAI-PDCA Continuous Improvement Framework
                </p>
                <Link href="/soai-pdca">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn About SOAI-PDCA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* SOAI-PDCA Framework Callout */}
            <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border-2 border-green-200">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Powered by the SOAI-PDCA Continuous Improvement Framework
                </h3>
                <p className="text-gray-700 mb-6">
                  Our accreditation system is built on the industry-standard SOAI-PDCA methodology,
                  combining AI-powered safety oversight with the proven Plan-Do-Check-Act cycle
                  for continuous improvement and regulatory compliance.
                </p>
                <Link href="/soai-pdca">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Explore the SOAI-PDCA Framework
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Compliance */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Framework Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CSOAI certification covers all major global AI regulatory frameworks,
              ensuring your credentials are recognized worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {frameworks.map((framework, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4 text-center">{framework.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-center">
                    {framework.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Region:</span>
                      <span className="font-medium">{framework.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coverage:</span>
                      <span className="font-medium">{framework.articles}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-semibold">{framework.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Levels */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Three Levels of Professional Certification
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Progress from foundational knowledge to expert-level mastery with our
              comprehensive certification pathway.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {accreditationLevels.map((cert, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
                  <div className="text-sm font-semibold text-blue-600 mb-2">
                    LEVEL {index + 1}
                  </div>
                  <CardTitle className="text-2xl">{cert.title}</CardTitle>
                  <div className="text-sm text-gray-600 mt-2">{cert.duration}</div>
                </CardHeader>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                  <ul className="space-y-2 mb-6">
                    {cert.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-blue-900">
                      {cert.badge}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Organizations */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Building2 className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Enterprise Accreditation Program
              </h2>
              <p className="text-xl text-blue-100">
                Get your entire organization CSOAI-certified and demonstrate compliance
                to regulators, customers, and stakeholders.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6">
                  <FileCheck className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Organizational Certification</h3>
                  <p className="text-blue-100 text-sm">
                    Certify your entire AI governance framework and demonstrate compliance
                    with global standards.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6">
                  <Users className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Team Training Programs</h3>
                  <p className="text-blue-100 text-sm">
                    Bulk certification for your team with dedicated support, custom tracks,
                    and progress dashboards.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/enterprise-onboarding">
                <Button size="lg" variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
                  Request Enterprise Demo
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Become CSOAI Certified?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join certified AI Safety Analysts building careers in the fastest-growing
            field in tech.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Free Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/certification">
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                View Certification Exams
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
