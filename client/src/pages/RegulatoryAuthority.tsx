import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Globe, Shield, Zap } from "lucide-react";

export default function RegulatoryAuthority() {
  useEffect(() => { document.title = "RegulatoryAuthority | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-white border-b-2 border-emerald-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              CSOAI: A Measurement Body for AI Safety Governance
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              A measurement body for AI governance: signed, provision-anchored measurement records — not accredited certification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/accreditation">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Learn About ISO 17065
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/trust-center">
                <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  View 5-Year Roadmap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Pillar Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Three Pillars of Regulatory Authority
            </h2>
            <p className="text-xl text-gray-700 text-center mb-12">
              How CSOAI becomes the mandatory infrastructure for global AI safety governance
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <Card className="p-8 border-2 border-emerald-200 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Measurement Body</h3>
                </div>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>ISO/IEC 17065 pathway — under evaluation, not held</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Signed attestation records for training and measurement processes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>International credibility and legitimacy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Signed records that third parties can verify independently</span>
                  </li>
                </ul>
                <Link href="/accreditation">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    Learn More
                  </Button>
                </Link>
              </Card>

              {/* Pillar 2 */}
              <Card className="p-8 border-2 border-emerald-200 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Regional Recognition</h3>
                </div>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>○ EU Notified Body status — future option, not held</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>NIST AI RMF mapping (United States)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>TC260 alignment (China)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Coverage across all major regulatory regions</span>
                  </li>
                </ul>
                <Link href="/trust-center">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    View Roadmap
                  </Button>
                </Link>
              </Card>

              {/* Pillar 3 */}
              <Card className="p-8 border-2 border-emerald-200 hover:shadow-lg transition">
                {/* REWRITTEN 2026-08-26. This card was headed "Mandatory Infrastructure" and
                    listed four GREEN TICKS: "Governments mandate CSOAI compliance",
                    "Enterprises have no choice but to integrate", plus two revenue lines.
                    None of that is true. No government mandates CSOAI, no enterprise is
                    obliged to integrate, and the tick icon rendered a strategic ambition as
                    an achieved fact. It also contradicted the site's own standing disclaimer
                    — "Not a certification. Not a notified body." — by claiming exactly the
                    regulatory authority we elsewhere disclaim. An ambition is legitimate to
                    publish; publishing it as a status is not. */}
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Where we are trying to get to</h3>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  An ambition, stated as one. None of the following is true today, and we will
                  not describe it as true until it is.
                </p>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-700">Goal</span>
                    <span>
                      That measurement of this kind becomes something regulators reference.
                      <span className="block text-xs text-gray-500">
                        Today: no government mandates or recognises CSOAI. We are not a notified body.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-700">Goal</span>
                    <span>
                      That integrating an independent measurement becomes the obvious choice.
                      <span className="block text-xs text-gray-500">
                        Today: entirely voluntary, and it should stay a choice worth making on its merits.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-700">Goal</span>
                    <span>
                      That a continuous, signed measurement history is worth more than a one-off audit.
                      <span className="block text-xs text-gray-500">
                        Today: the signed history exists and is publicly verifiable — that part is real.
                      </span>
                    </span>
                  </li>
                </ul>
                <Link href="/government-portal">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    Government Portal
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Bodies Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Global Regulatory Recognition
            </h2>
            <p className="text-xl text-gray-700 text-center mb-12">
              CSOAI's measurement records map to the world's leading regulatory frameworks
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* ISO 17065 */}
              <Card className="p-8 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl font-bold text-blue-600">ISO</div>
                  <h3 className="text-2xl font-bold text-gray-900">17065</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  International standard for accreditation bodies certifying products, processes, and services.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm mb-6">
                  <li>○ Accreditation-chain recognition — a future option, not claimed today</li>
                  <li>▹ International credibility</li>
                  <li>▹ Foundation for all other recognitions</li>
                  <li>▹ Timeline: 12 months (2025)</li>
                </ul>
                <Link href="/accreditation">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Learn More
                  </Button>
                </Link>
              </Card>

              {/* EU Notified Body */}
              <Card className="p-8 border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🇪🇺</div>
                  <h3 className="text-2xl font-bold text-gray-900">Notified Body</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Official EU authority for AI system compliance assessment under EU AI Act.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm mb-6">
                  <li>▹ Mandatory for high-risk AI in Europe</li>
                  <li>▹ Legally binding compliance certificates</li>
                  <li>▹ €30M fines for non-compliance</li>
                  <li>▹ Timeline: 24 months (2026-2027)</li>
                </ul>
                <Link href="/accreditation">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    Learn More
                  </Button>
                </Link>
              </Card>

              {/* NIST */}
              <Card className="p-8 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🇺🇸</div>
                  <h3 className="text-2xl font-bold text-gray-900">NIST Recognition</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  US government recognition of alignment with AI Risk Management Framework.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm mb-6">
                  <li>▹ US government agency credibility</li>
                  <li>▹ Procurement compliance support</li>
                  <li>▹ Voluntary but increasingly required</li>
                  <li>▹ Timeline: 12 months (2026)</li>
                </ul>
                <Link href="/accreditation">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Learn More
                  </Button>
                </Link>
              </Card>

              {/* TC260 */}
              <Card className="p-8 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🇨🇳</div>
                  <h3 className="text-2xl font-bold text-gray-900">TC260 Alignment</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  China's AI safety standards for systems deployed in or serving Chinese users.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm mb-6">
                  <li>▹ Mandatory for China market</li>
                  <li>▹ Algorithm transparency requirements</li>
                  <li>▹ Data security and content safety</li>
                  <li>▹ Timeline: 12 months (2027)</li>
                </ul>
                <Link href="/accreditation">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Learn More
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              5-Year Roadmap to Global Standard
            </h2>
            <p className="text-xl text-gray-700 text-center mb-12">
              From measurement body to trusted public infrastructure
            </p>

            <div className="space-y-8">
              {/* 2025 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-2xl">
                    2025
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Foundation</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>○ ISO/IEC 17065 — future option, not pursued today</li>
                    <li>○ Analyst network — design target, not current</li>
                    <li>▹ Government Portal launched (beta)</li>
                    <li>▹ Revenue: $41M</li>
                  </ul>
                </div>
              </div>

              {/* 2026 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-2xl">
                    2026
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Expansion <span className="text-sm font-normal text-gray-500">— target, not achieved</span></h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>▹ EU legal entity established</li>
                    <li>▹ Enterprise APIs launched</li>
                    <li>▹ Analyst network scaled to 5,000</li>
                    <li>▹ NIST recognition achieved</li>
                    <li>▹ Revenue: $150M</li>
                  </ul>
                </div>
              </div>

              {/* 2027 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-2xl">
                    2027
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Authority <span className="text-sm font-normal text-gray-500">— target, not achieved</span></h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>▹ EU Notified Body status approved</li>
                    <li>▹ Analyst network scaled to 10,000</li>
                    <li>▹ TC260 recognition achieved</li>
                    <li>▹ Mandatory compliance begins in EU</li>
                    <li>▹ Revenue: $400M</li>
                  </ul>
                </div>
              </div>

              {/* 2028-2030 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-2xl">
                    2028+
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Global Standard <span className="text-sm font-normal text-gray-500">— target, not achieved</span></h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>▹ 60-80% market penetration</li>
                    <li>▹ a global analyst network (counts published only when signed)</li>
                    <li>▹ CSOAI is de facto global standard</li>
                    <li>▹ Revenue: $800M-$1.34B</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Lead AI Safety Governance?</h2>
            <p className="text-lg text-emerald-100 mb-8">
              Join CSOAI as we build independent measurement for AI governance. Whether you're an enterprise, regulator, or analyst, there's a role for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/?lobby=measured&task=enterprise-start">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                  Enterprise lobby
                </Button>
              </Link>
              <Link href="/government-portal">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-emerald-700">
                  For Governments
                </Button>
              </Link>
              <Link href="/academy">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-emerald-700">
                  Become an Analyst
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
