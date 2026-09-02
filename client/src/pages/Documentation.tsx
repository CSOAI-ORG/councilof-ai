import { useEffect } from "react";
import { Book, Code, Server, Database, Shield, Zap, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

const DOCS_ARTICLE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'CSOAI Technical Documentation',
  description:
    'Architecture, API references and integration guides for the CSOAI platform — the designed 33-seat Council of AI, SOAI-PDCA framework and Watchdog incident reporting.',
  author: { '@type': 'Organization', name: 'CSOAI' },
  publisher: { '@type': 'Organization', name: 'CSOAI', url: 'https://csoai.org' },
  url: 'https://csoai.org/docs',
  about: ['AI safety', 'multi-agent council', 'SOAI-PDCA', 'AI compliance API'],
};

const DOCS_BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://csoai.org/' },
    { '@type': 'ListItem', position: 2, name: 'Documentation', item: 'https://csoai.org/docs' },
  ],
};

export default function Documentation() {
  useEffect(() => { document.title = "CSOAI Documentation — APIs, Architecture & Guides"; }, []);
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Book className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-6">Technical Documentation</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Comprehensive guides, API references, and architecture documentation for developers and system integrators.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div {...fadeInUp} className="min-w-0">
              <Link href="/api-docs">
                <Card className="h-full hover:shadow-lg transition cursor-pointer">
                  <CardHeader>
                    <Code className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>API Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Complete API documentation with endpoints, authentication, and code examples.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Link href="/security">
                <Card className="h-full hover:shadow-lg transition cursor-pointer">
                  <CardHeader>
                    <Shield className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>Security Practices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Security architecture, compliance certifications, and data protection policies.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Link href="/status">
                <Card className="h-full hover:shadow-lg transition cursor-pointer">
                  <CardHeader>
                    <Zap className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Real-time platform status, uptime metrics, and incident history.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">System Architecture</h2>
            <p className="text-xl text-gray-600">Understanding the CSOAI platform infrastructure</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Server className="w-8 h-8 text-blue-600" />
                    <CardTitle>Technology Stack</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Frontend</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• React 19 with TypeScript</li>
                        <li>• Vite for build tooling</li>
                        <li>• TailwindCSS for styling</li>
                        <li>• Wouter for routing</li>
                        <li>• tRPC for type-safe API calls</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Backend</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Node.js with TypeScript</li>
                        <li>• tRPC for API layer</li>
                        <li>• Drizzle ORM for database</li>
                        <li>• Express.js web server</li>
                        <li>• JWT for authentication</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <CardTitle>Data Architecture</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Database</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• MySQL/TiDB for relational data</li>
                        <li>• 23 tables for comprehensive data model</li>
                        <li>• Automated backups every hour</li>
                        <li>• Multi-region replication</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Storage</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• S3-compatible object storage</li>
                        <li>• CDN for static assets</li>
                        <li>• Encrypted at rest (AES-256)</li>
                        <li>• Versioning enabled</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Components */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Components</h2>
            <p className="text-xl text-gray-600">Key systems that power the CSOAI platform</p>
          </motion.div>

          <div className="space-y-6">
            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">33-seat Council of AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    A distributed consensus system that ensures impartial, vendor-independent AI safety decisions through a combination of AI agents and human experts.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Architecture</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• multi-leg council review</li>
                        <li>• Distributed voting mechanism</li>
                        <li>• Quorum-based consensus</li>
                        <li>• Weighted voting by expertise</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Participants</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• 33 AI safety agents</li>
                        <li>• Trained human analysts</li>
                        <li>• Independent reviewers</li>
                        <li>• Domain experts</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Outcomes</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Risk level classification</li>
                        <li>• Compliance recommendations</li>
                        <li>• Incident severity ratings</li>
                        <li>• Remediation guidance</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">SOAI-PDCA Framework</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    A continuous improvement methodology specifically designed for AI system governance, combining the Deming PDCA cycle with AI-specific safety controls.
                  </p>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Plan</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Risk assessment</li>
                        <li>• Compliance mapping</li>
                        <li>• Control selection</li>
                        <li>• Resource allocation</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Do</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Control implementation</li>
                        <li>• Documentation</li>
                        <li>• Training delivery</li>
                        <li>• Process execution</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Check</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Performance monitoring</li>
                        <li>• Compliance audits</li>
                        <li>• Incident analysis</li>
                        <li>• Effectiveness review</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Act</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Corrective actions</li>
                        <li>• Process improvements</li>
                        <li>• Knowledge capture</li>
                        <li>• Cycle restart</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Watchdog Incident Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    A public transparency system for reporting and tracking AI safety incidents, powered by trained analysts and the Council.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Reporting</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Public submission form</li>
                        <li>• Anonymous reporting option</li>
                        <li>• Evidence upload support</li>
                        <li>• Automated triage</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Analysis</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Analyst assignment</li>
                        <li>• Investigation workflow</li>
                        <li>• Council review</li>
                        <li>• Severity classification</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Transparency</h5>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Public incident database</li>
                        <li>• Real-time status updates</li>
                        <li>• Trend analysis</li>
                        <li>• Lessons learned</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Guides */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Integration Guides</h2>
            <p className="text-xl text-gray-600">Step-by-step guides for integrating with CSOAI</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>REST API Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    Integrate CSOAI into your existing systems using our RESTful API.
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">
                    <pre>{`// Example: Register an AI system
const response = await fetch(
  'https://api.csoai.org/v1/systems',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My AI System',
      type: 'llm',
      riskLevel: 'high'
    })
  }
);`}</pre>
                  </div>
                  <Link href="/api-docs">
                    <a className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                      View full API documentation <ExternalLink className="w-4 h-4" />
                    </a>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>SDK Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    Use our official SDKs for Python, JavaScript, and other languages.
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">
                    <pre>{`# Python SDK Example
from csoai import Client

client = Client(api_key='YOUR_API_KEY')

# Register AI system
system = client.systems.create(
    name='My AI System',
    type='llm',
    risk_level='high'
)

print(f"System ID: {system.id}")`}</pre>
                  </div>
                  <Link href="/api-docs">
                    <a className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                      View SDK documentation <ExternalLink className="w-4 h-4" />
                    </a>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Performance & SLAs */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Performance & SLAs</h2>
            <p className="text-xl text-gray-600">Our commitment to reliability and performance</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>Uptime SLA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-2">99.9%</div>
                    <p className="text-gray-600">Guaranteed uptime</p>
                    <p className="text-sm text-gray-500 mt-2">Max 8.76 hours downtime/year</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>API Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">&lt;300ms</div>
                    <p className="text-gray-600">95th percentile latency</p>
                    <p className="text-sm text-gray-500 mt-2">Measured globally</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>Support Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">&lt;2h</div>
                    <p className="text-gray-600">Average response time</p>
                    <p className="text-sm text-gray-500 mt-2">24/7 support available</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl font-bold mb-6">Need Help?</h2>
            <p className="text-xl mb-8 opacity-90">
              Our technical team is here to support your integration and answer any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@csoai.org"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Contact Support
              </a>
              <Link href="/api-docs">
                <a className="inline-block bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition">
                  View API Docs
                </a>
              </Link>
              <Link href="/knowledge-base">
                <a className="inline-block bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition">
                  Knowledge Base
                </a>
              </Link>
              <Link href="/faq">
                <a className="inline-block bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition">
                  FAQ
                </a>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
