import { useEffect } from "react";
/**
 * About the measurement credential page
 * Explains CSOAI's AI Safety Analyst training & measurement program,
 * its mission, and key differentiators. CSOAI measures and attests — it
 * is not a certification body.
 */

import { Shield, Users, Globe, Award, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AboutCEASAI() {
  useEffect(() => { document.title = "About the measurement credential | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Training the Next Generation of AI Safety Professionals
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About the <span className="text-blue-600">measurement credential</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The <strong>CSOAI measurement credential for AI safety analysts</strong> is a measurement program 
            dedicated to building a global, measured workforce of AI Safety Analysts.
          </p>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">124</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">13</div>
              <div className="text-sm text-gray-600">Measurement modules</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">£1M</div>
              <div className="text-sm text-gray-600">Free Training</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-16 md:py-20 border-y border-gray-200">
        <div className="container max-w-4xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                With EU AI Act penalties live since <strong>August 2, 2026</strong> and high-risk obligations landing{' '}
                <strong>December 2, 2027</strong> (Annex III; Annex I: August 2, 2028, per the Digital Omnibus), enterprises worldwide will need{' '}
                <strong className="text-blue-600">measured AI Safety Analysts</strong> to ensure compliance,
                transparency, and safety. This program exists to train, measure, and deploy this critical workforce—preventing
                compliance chaos and ensuring AI systems serve humanity responsibly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Training + CSOAI Integration */}
      <section className="py-16 md:py-20">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Training + platform: one CSOAI ecosystem</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Training & measurement */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h3 className="text-2xl font-bold">Training &amp; measurement</h3>
              </div>
              <p className="text-gray-600 font-medium mb-4">The training &amp; measurement program</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Comprehensive measurement modules</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Covers 6 major AI frameworks (EU, NIST, ISO, TC260, UK, Canada)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">£1M free training initiative</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Industry-recognized Watchdog Analyst credentials</span>
                </li>
              </ul>
            </div>

            {/* CSOAI */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
                <h3 className="text-2xl font-bold">CSOAI</h3>
              </div>
              <p className="text-gray-600 font-medium mb-4">The Compliance Platform</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">AI system registration & monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time compliance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Attested Watchdog Analyst deployment</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-700">Council oversight</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-lg text-gray-700 mt-8 max-w-3xl mx-auto">
            <strong>Together</strong>, the measurement credential trains the analysts and CSOAI provides the platform where they work—creating 
            a complete ecosystem for AI safety, transparency, and compliance.
          </p>
        </div>
      </section>

      {/* Why the measurement credential is Different */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why the measurement credential is different</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Open Source */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Open Source Commitment</h3>
              <p className="text-gray-600">
                We believe AI safety should be transparent and accessible. While our training is paid, our methodologies, 
                frameworks, and compliance tools are completely open source.
              </p>
            </div>

            {/* Creating Jobs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-emerald-100 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Creating Real Jobs</h3>
              <p className="text-gray-600">
                We're not just training people—we're creating a new profession. Credential holders become Watchdog 
                Analysts with a measured record and real employment opportunities globally.
              </p>
            </div>

            {/* Industry Recognition */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Industry Recognition</h3>
              <p className="text-gray-600">
                Our measurement credentials are recognized by enterprises, regulators, and the Council—the global oversight
                body for AI safety.
              </p>
            </div>

            {/* Global Reach */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-orange-100 rounded-lg w-fit mb-4">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Reach</h3>
              <p className="text-gray-600">
                Operating in 124 countries across Europe, Americas, Asia-Pacific, and Africa. We train analysts where 
                they're needed most.
              </p>
            </div>

            {/* Free Training */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">£1M Free Training</h3>
              <p className="text-gray-600">
                First-come-first-serve access to £1,000,000 worth of free training courses. 2,004 spots available before 
                the EU AI Act deadline.
              </p>
            </div>

            {/* Comprehensive Coverage */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                13 specialized modules covering EU AI Act, NIST AI RMF, ISO 42001, TC260, UK AI Bill, Canada AIDA, 
                Australia AI Ethics, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Safety First</h3>
                <p className="text-gray-600">
                  AI systems must be safe, transparent, and accountable. We train analysts to identify risks, prevent harm, 
                  and ensure AI serves humanity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg h-fit">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Inclusive Excellence</h3>
                <p className="text-gray-600">
                  AI safety expertise should be accessible to everyone, regardless of background. We provide pathways for 
                  diverse talent to enter this critical field.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 bg-purple-100 rounded-lg h-fit">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Global Collaboration</h3>
                <p className="text-gray-600">
                  AI is a global challenge requiring global solutions. We work across borders, frameworks, and industries to 
                  create unified standards.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-2 bg-orange-100 rounded-lg h-fit">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Open & Transparent</h3>
                <p className="text-gray-600">
                  We practice what we preach. Our methodologies are open source, our processes are transparent, and our 
                  impact is measurable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 md:py-20 text-white">
        <div className="container text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the AI Safety Movement</h2>
          <p className="text-xl text-blue-100 mb-8">
            Become an attested Watchdog Analyst and help ensure AI systems are safe, transparent, and beneficial for all.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Training
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                Apply for Free Training
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
