import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Users, Brain, BarChart3, Lock, Zap } from 'lucide-react';
import { Link } from 'wouter';

export default function CouncilLicensingLanding() {
  useEffect(() => {
    document.title = 'Council Licensing - CSOAI';
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          <motion.div {...fadeInUp}>
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🏛️ Multi-Stakeholder Governance
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Council Licensing
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Deploy consensus-based AI governance. License the council fleet for your organization's critical compliance decisions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What is Council?</h3>
            <p className="text-gray-600 mb-6">
              A consensus-based governance model using 33 specialized AI agents representing different stakeholder perspectives. Perfect for complex compliance decisions requiring multi-stakeholder agreement.
            </p>
            <Link href="/contact">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 font-semibold text-lg">
                Request License Info
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Council Works</h2>
            <p className="text-xl text-gray-600">Multi-stakeholder consensus for AI governance</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: '1',
                title: 'Submit Case',
                description: 'Present your AI compliance question or incident to the council'
              },
              {
                number: '2',
                title: '33 Agents Deliberate',
                description: 'Specialized agents analyze from different perspectives and expertise areas'
              },
              {
                number: '3',
                title: 'Consensus Voting',
                description: 'A designed multi-agent vote requires a supermajority (23 of 33) to agree'
              },
              {
                number: '4',
                title: 'Decision Report',
                description: 'Receive detailed governance decision with full reasoning and audit trail'
              },
            ].map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Licensing Tiers */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Licensing Tiers</h2>
            <p className="text-xl text-gray-600">Choose the right council configuration for your needs</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Departmental',
                price: 'Free',
                period: '',
                description: 'For single departments',
                decisions: 'Up to 100 decisions/month',
                features: [
                  'Full council fleet',
                  'Standard expertise mix',
                  'Monthly reporting',
                  'Email support',
                  'Basic API access'
                ]
              },
              {
                name: 'Enterprise',
                price: 'Free',
                period: '',
                description: 'For enterprise-wide use',
                decisions: 'Unlimited decisions',
                features: [
                  'Everything in Departmental',
                  'Custom agent specialization',
                  'Real-time reporting',
                  'Priority support',
                  'Full API access',
                  'Custom workflows'
                ],
                highlighted: true
              },
              {
                name: 'Government',
                price: 'Custom',
                period: 'pricing',
                description: 'For regulatory bodies',
                decisions: 'Unlimited',
                features: [
                  'Everything in Enterprise',
                  'Dedicated council instance',
                  'On-premise deployment',
                  '24/7 support',
                  'Custom governance models',
                  'Regulatory compliance'
                ]
              },
            ].map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`p-8 h-full flex flex-col ${tier.highlighted ? 'border-2 border-purple-600 shadow-xl' : ''}`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-2">{tier.description}</p>
                  <p className="text-sm text-gray-500 mb-6">{tier.decisions}</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600 ml-2">{tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full py-3 font-semibold ${
                      tier.highlighted
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Specializations */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">33-Agent Specializations</h2>
            <p className="text-xl text-gray-600">Diverse expertise for comprehensive governance</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Compliance Experts', count: '8 agents' },
              { title: 'Technical Specialists', count: '8 agents' },
              { title: 'Ethics & Policy', count: '8 agents' },
              { title: 'Risk Analysts', count: '4 agents' },
              { title: 'Industry Representatives', count: '3 agents' },
              { title: 'Public Interest Advocates', count: '2 agents' },
            ].map((spec, index) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{spec.title}</h3>
                  <p className="text-purple-600 font-semibold">{spec.count}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-6">Ready for Consensus-Based Governance?</h2>
            <p className="text-xl mb-8 opacity-90">Deploy Council for your organization today</p>
            <Link href="/contact">
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                Request Demo & Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
