import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function Accessibility() {
  useEffect(() => {
    document.title = 'Accessibility - CSOAI';
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const accessibilityFeatures = [
    'WCAG 2.1 Level AA compliance',
    'Keyboard navigation support',
    'Screen reader compatibility',
    'High contrast mode support',
    'Text resizing capabilities',
    'Color-blind friendly design',
    'Closed captioning for videos',
    'Accessible forms and inputs',
    'Focus indicators on interactive elements',
    'Alternative text for images',
    'Semantic HTML structure',
    'Accessible PDF documents',
  ];

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Accessibility Statement
            </h1>
            <p className="text-lg text-gray-600">
              CSOAI is committed to ensuring digital accessibility for all users.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Commitment</h2>
            <p className="text-gray-600 mb-4">
              CSOAI is committed to making our website and services accessible to everyone, including people with disabilities. We strive to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards set by the World Wide Web Consortium (W3C).
            </p>
            <p className="text-gray-600">
              We believe that accessibility is not just a legal requirement but a fundamental right. We continuously work to improve the accessibility of our platform and welcome feedback from our users.
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Accessibility Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessibilityFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="flex items-start space-x-3"
                >
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Accessibility Features by Device</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Desktop & Laptop</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Full keyboard navigation</li>
                  <li>Screen reader support (NVDA, JAWS, VoiceOver)</li>
                  <li>High contrast mode</li>
                  <li>Text size adjustment</li>
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile & Tablet</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Touch-friendly interface</li>
                  <li>Screen reader support (VoiceOver, TalkBack)</li>
                  <li>Zoom and text resizing</li>
                  <li>Haptic feedback support</li>
                </ul>
              </Card>
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">How to Use Accessibility Features</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Keyboard Navigation</h3>
                <p className="text-gray-600 mb-3">
                  You can navigate our website using only your keyboard:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li><strong>Tab:</strong> Move to the next interactive element</li>
                  <li><strong>Shift + Tab:</strong> Move to the previous interactive element</li>
                  <li><strong>Enter:</strong> Activate a button or link</li>
                  <li><strong>Space:</strong> Toggle checkboxes or buttons</li>
                  <li><strong>Arrow Keys:</strong> Navigate within menus and lists</li>
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Screen Readers</h3>
                <p className="text-gray-600 mb-3">
                  Our website is compatible with popular screen readers:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li><strong>Windows:</strong> NVDA (free) or JAWS</li>
                  <li><strong>macOS:</strong> VoiceOver (built-in)</li>
                  <li><strong>iOS:</strong> VoiceOver (built-in)</li>
                  <li><strong>Android:</strong> TalkBack (built-in)</li>
                </ul>
              </Card>
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Accessibility Issues or Feedback</h2>
            <Card className="p-6 bg-green-50">
              <p className="text-gray-600 mb-4">
                If you encounter any accessibility issues while using our website or services, or if you have suggestions for improvement, please contact us:
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> accessibility@csoai.org<br />
                <strong>Address:</strong> CSOAI, United Kingdom<br />
                <strong>Website:</strong> www.csoai.org
              </p>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Standards & Compliance</h2>
            <Card className="p-6">
              <p className="text-gray-600 mb-4">
                CSOAI aims to comply with the following standards and regulations:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
                <li>Americans with Disabilities Act (ADA)</li>
                <li>Section 508 of the Rehabilitation Act</li>
                <li>European Accessibility Act</li>
                <li>EN 301 549 standard</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
