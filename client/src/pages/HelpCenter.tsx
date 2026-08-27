import { useEffect } from "react";
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, ChevronDown, MessageCircle, Mail, Phone, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function HelpCenter() {
  useEffect(() => { document.title = "CSOAI Help Center — Support, Guides & Answers"; }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics and get up and running',
      articles: [
        { title: 'Creating Your Account', href: '#' },
        { title: 'Setting Up Your Profile', href: '#' },
        { title: 'Understanding the Dashboard', href: '#' },
      ],
    },
    {
      title: 'Academy & signed records',
      icon: CheckCircle,
      description: 'Training produces a signed record, not a certificate',
      articles: [
        { title: 'How to Enroll in Courses', href: '/academy' },
        { title: 'Preparing for an academy assessment', href: '/academy' },
        { title: 'Understanding a signed record', href: '/gspc-verify' },
      ],
    },
    {
      title: 'Watchdog Program',
      icon: AlertCircle,
      description: 'Details about incident reporting and analyst roles',
      articles: [
        { title: 'How to Report an Incident', href: '#' },
        { title: 'Becoming a Watchdog Analyst', href: '#' },
        { title: 'Understanding Report Status', href: '#' },
      ],
    },
    {
      title: 'Compliance & Frameworks',
      icon: BookOpen,
      description: 'Learn about compliance frameworks and assessments',
      articles: [
        { title: 'Understanding SOAI-PDCA', href: '#' },
        { title: 'EU AI Act Compliance', href: '#' },
        { title: 'Running a Compliance Assessment', href: '#' },
      ],
    },
  ];

  const faqs = [
    {
      question: 'How do I get started with CSOAI?',
      answer: 'Create an account, complete your profile, and explore the training courses. You can start with our Getting Started course to understand the platform.',
    },
    {
      question: 'Does academy training certify a system?',
      answer: 'No. Academy assessments produce a signed record that a person completed training. Council of AI measures; it does not certify systems or issue conformity marks.',
    },
    {
      question: 'How can I become a Watchdog Analyst?',
      answer: 'Start at /academy, complete the training modules, and get a signed record of what you finished. We do not issue a certificate of system compliance.',
    },
    {
      question: 'What are the different compliance frameworks?',
      answer: 'We support EU AI Act, NIST AI RMF, China TC260, and our proprietary SOAI-PDCA framework. Each has different requirements and assessment criteria.',
    },
    {
      question: 'How do I report an AI safety incident?',
      answer: 'Use the Watchdog section to submit an incident report. Provide details about the incident, the AI system involved, and any supporting evidence.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security practices. All data is encrypted in transit and at rest. We comply with GDPR and other privacy regulations.',
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@csoai.org',
      link: 'mailto:support@csoai.org',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available 9am-5pm EST',
      link: '#',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
  ];

  const helpFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-4xl font-bold mb-6 text-gray-900">
              How Can We Help?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Find answers to common questions and get support for your CSOAI journey.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl font-bold mb-12 text-center text-gray-900">
            Browse by Category
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <category.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article.title}>
                          <a
                            href={article.href}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            → {article.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl font-bold mb-12 text-center text-gray-900">
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-600 transition-transform ${
                          expandedFAQ === index ? 'transform rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expandedFAQ === index && (
                      <p className="mt-4 text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl font-bold mb-12 text-center text-gray-900">
            Still Need Help?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow p-6 text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <method.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600">{method.description}</p>
                </Card>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Contact our support team and we'll help you get the answers you need.
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Contact Support
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
