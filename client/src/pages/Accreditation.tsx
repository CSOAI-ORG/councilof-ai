/**
 * CSOAI Accreditation Page
 * Explains CSOAI's role as a training provider measuring against published standards
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
import FaqBlock from '@/components/FaqBlock';
import SpotInfographic from '@/components/SpotInfographic';
import { LANE4 } from '@/data/lane4Content';

const L4 = LANE4["accreditation"];

export default function Accreditation() {
  const frameworks = [
    {
      name: 'EU AI Act',
      region: 'European Union',
      articles: '113 Articles',
      status: 'Crosswalked',
      icon: '🇪🇺',
    },
    {
      name: 'NIST AI RMF',
      region: 'United States',
      articles: '72 Guidelines',
      status: 'Crosswalked',
      icon: '🇺🇸',
    },
    {
      name: 'TC260 (GB/T 42459-2023)',
      region: 'China',
      articles: '56 Standards',
      status: 'Crosswalked',
      icon: '🇨🇳',
    },
    {
      name: 'ISO/IEC 42001',
      region: 'International',
      articles: 'AI Management',
      status: 'Crosswalked',
      icon: '🌍',
    },
  ];

  const accreditationLevels = [
    {
      level: 'Foundation',
      title: 'AI Safety Fundamentals',
      duration: '40 hours',
      requirements: ['Complete 5 core courses', 'Pass foundation exam (70%)', 'Ethics assessment'],
      badge: 'Foundation Track',
    },
    {
      level: 'Professional',
      title: 'AI Safety Analyst Track',
      duration: '120 hours',
      requirements: [
        'Foundation certification',
        'Complete all 15 courses',
        'Pass professional exam (80%)',
        '10 practical assessments',
        'Peer review submission',
      ],
      badge: 'Professional Track',
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
      badge: 'Expert Track',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="h-32 w-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI Safety Training &amp; Attestation
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              CSOAI is a measurement body, not an accreditation authority. Our training paths lead to
              signed attestations aligned with the EU AI Act, NIST AI RMF, TC260 and ISO/IEC 42001 —
              measured against live regulatory text, never a substitute for accredited certification.
            </p>
            <p className="text-sm text-blue-200/90 mb-8 max-w-2xl mx-auto border border-blue-400/40 rounded-lg px-4 py-3">
              In the words of our own site-wide footer: &ldquo;We hold no accreditation, we are not a
              notified body, and we issue no certificates of conformity — as of April 2026 zero
              notified bodies had been designated and no harmonised standard yet grants presumption
              of conformity.&rdquo;
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
                  Start training
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-blue-800" disabled title="No file is published for this yet.">Standards file not published yet</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why CSOAI Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Teams Train With CSOAI
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CSOAI is a training provider measuring against published standards — independent of
              every AI vendor, and honest about what a signed attestation is and is not.
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
                <CardTitle>Framework-Aligned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Measured against EU AI Act, NIST AI RMF, China TC260, and ISO 42001.
                  Signed attestation records — not an accredited certification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Honestly Scoped</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We hold no accreditation, we are not a notified body, and we issue no
                  certificates of conformity. Attestations record what was measured —
                  nothing more.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accreditation Badges */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              CSOAI Attestation Marks
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-40 w-40 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
                <h4 className="font-semibold text-gray-900 mb-2">Attestation Mark</h4>
                <p className="text-sm text-gray-600">
                  Signed record of measured training outcomes for each attested analyst
                </p>
              </div>
              <div className="text-center">
                <div className="h-40 w-40 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600 rounded-lg" />
                <h4 className="font-semibold text-gray-900 mb-2">TC260 Crosswalked</h4>
                <p className="text-sm text-gray-600">
                  Training content mapped to China AI Systems Standard GB/T 42459-2023
                </p>
              </div>
              <div className="text-center">
                <div className="h-40 w-40 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-lg" />
                <h4 className="font-semibold text-gray-900 mb-2">SOAI-PDCA Trained</h4>
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
                  Our training system is built on the SOAI-PDCA methodology,
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
              CSOAI training is measured against all major global AI regulatory frameworks —
              the coverage below is what the curriculum crosswalks, not a compliance verdict.
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
              Three Levels of Professional Training
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
                Enterprise Training Program
              </h2>
              <p className="text-xl text-blue-100">
                Put your whole team through CSOAI training and hold a signed assessment you can show
                to regulators, customers, and stakeholders.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6">
                  <FileCheck className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Organizational Measurement</h3>
                  <p className="text-blue-100 text-sm">
                    Measure your AI governance practices against published standards and hold a
                    signed record of the results — you conclude, we measure.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6">
                  <Users className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Team Training Programs</h3>
                  <p className="text-blue-100 text-sm">
                    Bulk training for your team with dedicated support, custom tracks,
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
            Ready to train your team with CSOAI?
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
                View Assessment Exams
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
      <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />
    </div>
  );
}
