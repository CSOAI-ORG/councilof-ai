import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, BarChart3, Lock, Zap, Users, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function EnterprisePlansLanding() {
  useEffect(() => {
    document.title = 'Enterprise Plans - CSOAI';
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Enterprise AI Compliance at Scale
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Empower your organization with enterprise-grade AI safety, compliance monitoring, and Byzantine Council governance.
            </p>
            <Link href="/contact">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold">
                Schedule Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise Plans</h2>
            <p className="text-xl text-gray-600">Flexible pricing for organizations of any size</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Growth',
                price: '£2,499',
                period: '/month',
                description: 'For scaling organizations',
                users: 'Up to 25 users',
                features: [
                  'Team dashboard',
                  'AI system registry',
                  'Compliance monitoring',
                  'Watchdog integration',
                  'Basic API access',
                  'Email support'
                ]
              },
              {
                name: 'Professional',
                price: '£7,999',
                period: '/month',
                description: 'For mid-size enterprises',
                users: 'Up to 100 users',
                features: [
                  'Everything in Growth',
                  'Byzantine Council voting',
                  'Advanced analytics',
                  'Custom workflows',
                  'Full API access',
                  'Priority support',
                  'Quarterly training'
                ],
                highlighted: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'pricing',
                description: 'For large organizations',
                users: 'Unlimited users',
                features: [
                  'Everything in Professional',
                  'Dedicated account manager',
                  'Custom integrations',
                  'On-premise deployment',
                  'SLA guarantee',
                  '24/7 support',
                  'Custom compliance frameworks'
                ]
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`p-8 h-full flex flex-col ${plan.highlighted ? 'border-2 border-blue-600 shadow-xl' : ''}`}>
                  {plan.highlighted && (
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold w-fit mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-2">{plan.description}</p>
                  <p className="text-sm text-gray-500 mb-6">{plan.users}</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full py-3 font-semibold ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise Features</h2>
            <p className="text-xl text-gray-600">Everything you need for enterprise-scale AI governance</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Advanced Analytics',
                description: 'Real-time dashboards showing compliance status, risk metrics, and trend analysis across all AI systems.'
              },
              {
                icon: <Lock className="h-8 w-8" />,
                title: 'Security & Compliance',
                description: 'SOC 2 Type II certified, GDPR compliant, with enterprise-grade encryption and access controls.'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Team Management',
                description: 'Role-based access control, team collaboration tools, and audit logs for governance.'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'API & Integrations',
                description: 'Full REST API, webhooks, and pre-built integrations with your existing tools.'
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Byzantine Council',
                description: 'Multi-stakeholder consensus model for critical compliance decisions and governance.'
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: 'Compliance Frameworks',
                description: 'Pre-built templates for EU AI Act, NIST RMF, TC260, and custom frameworks.'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-6">Ready to Scale AI Compliance?</h2>
            <p className="text-xl mb-8 opacity-90">Talk to our enterprise team about your specific needs</p>
            <Link href="/contact">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                Schedule Enterprise Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
