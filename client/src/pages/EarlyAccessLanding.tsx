import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Zap, Users, Shield, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'wouter';

export default function EarlyAccessLanding() {
  useEffect(() => {
    document.title = 'Early Access - CSOAI AI Safety Platform';
  }, []);

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto w-full text-center">
          <motion.div {...fadeInUp}>
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🚀 Limited Early Access Available
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Be First to Access AI Safety Certification
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the movement. Get exclusive early access to CEASAI certification, Byzantine Council training, and our complete AI safety platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Early Access Benefits</h3>
            <ul className="space-y-3 mb-8 text-left">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">50% discount on all plans</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Lifetime founding member status</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Priority support & training</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700">Direct access to our team</span>
              </li>
            </ul>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold text-lg"
                >
                  Get Early Access
                </Button>
              </form>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-700 font-semibold">Thank you! Check your email for next steps.</p>
              </div>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-600 text-sm"
          >
            Limited to first 1,000 members • No credit card required
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What You Get</h2>
            <p className="text-xl text-gray-600">Everything needed to master AI safety compliance</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'CEASAI Certification',
                description: 'Professional certification in AI safety, compliance frameworks, and incident analysis. Valid for 3 years.'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Byzantine Council Training',
                description: 'Learn from 33-agent consensus model. Master multi-stakeholder decision making in AI governance.'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Watchdog Platform',
                description: 'Report and analyze AI safety incidents. Contribute to public transparency database.'
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Career Opportunities',
                description: 'Access to job board with AI safety analyst positions from enterprises worldwide.'
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: 'Self-Paced Learning',
                description: 'Complete training at your own pace with lifetime access to course materials.'
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: 'Community Access',
                description: 'Join 10,000+ AI safety professionals. Network, learn, and grow together.'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="text-emerald-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Early Access Pricing</h2>
            <p className="text-xl text-gray-600">50% off all plans for early access members</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Analyst',
                price: '£249',
                originalPrice: '£499',
                description: 'Perfect for individuals',
                features: ['CEASAI Certification', 'Training Courses', 'Watchdog Access', 'Community']
              },
              {
                name: 'Enterprise',
                price: '£499',
                originalPrice: '£999',
                description: 'For organizations',
                features: ['Team Accounts (5)', 'Byzantine Council', 'API Access', 'Priority Support']
              },
              {
                name: 'Government',
                price: 'Custom',
                originalPrice: 'Custom',
                description: 'For regulatory bodies',
                features: ['Unlimited Users', 'Full API', 'Custom Integration', 'Dedicated Support']
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`p-8 h-full flex flex-col ${index === 1 ? 'border-2 border-emerald-600 shadow-lg' : ''}`}>
                  {index === 1 && <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold w-fit mb-4">Most Popular</div>}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 line-through ml-2">{plan.originalPrice}</span>
                    <p className="text-sm text-gray-600 mt-2">per month (billed annually)</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full py-3 font-semibold ${index === 1 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-6">Ready to Lead AI Safety?</h2>
            <p className="text-xl mb-8 opacity-90">Join 10,000+ professionals building the future of AI governance</p>
            <Link href="/signup">
              <Button className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                Get Early Access Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
