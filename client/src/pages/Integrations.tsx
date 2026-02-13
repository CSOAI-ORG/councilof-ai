/**
 * Integrations Page
 * Showcases CSOAI integrations with the Terranova Group ecosystem and enterprise platforms
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plug,
  Globe,
  Shield,
  Brain,
  Code,
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  Server,
  ExternalLink,
  Link2,
  Eye
} from 'lucide-react';
import { Link } from 'wouter';

// Terranova Group Ecosystem Data
const ecosystemPlatforms = [
  {
    name: 'councilof.ai',
    title: 'AI Governance Council',
    description: 'Primary platform for AI governance and compliance',
    icon: Brain,
    color: 'from-blue-600 to-blue-800'
  },
  {
    name: 'proofof.ai',
    title: 'AI Verification & Authentication',
    description: 'Verification and authentication infrastructure',
    icon: CheckCircle,
    color: 'from-emerald-600 to-emerald-800'
  },
  {
    name: 'asisecurity.ai',
    title: 'AI Security Operations',
    description: 'Security operations and threat management',
    icon: Shield,
    color: 'from-red-600 to-red-800'
  },
  {
    name: 'agisafe.ai',
    title: 'AGI Safety Protocols',
    description: 'Advanced AI safety protocols and guidelines',
    icon: Lock,
    color: 'from-purple-600 to-purple-800'
  },
  {
    name: 'transparencyof.ai',
    title: 'AI Transparency Reporting',
    description: 'Comprehensive transparency and reporting tools',
    icon: Globe,
    color: 'from-cyan-600 to-cyan-800'
  },
  {
    name: 'ethicalgovernanceof.ai',
    title: 'Ethical AI Standards',
    description: 'Ethical standards and governance framework',
    icon: Code,
    color: 'from-amber-600 to-amber-800'
  },
  {
    name: 'safetyof.ai',
    title: 'AI Safety Certification',
    description: 'AI safety certification and validation',
    icon: Zap,
    color: 'from-orange-600 to-orange-800'
  },
  {
    name: 'accountabilityof.ai',
    title: 'AI Accountability Framework',
    description: 'Accountability mechanisms and tracking',
    icon: Server,
    color: 'from-indigo-600 to-indigo-800'
  },
  {
    name: 'biasdetectionof.ai',
    title: 'Bias Detection & Mitigation',
    description: 'Detect and mitigate AI bias automatically',
    icon: Brain,
    color: 'from-pink-600 to-pink-800'
  },
  {
    name: 'dataprivacyof.ai',
    title: 'Data Privacy Compliance',
    description: 'GDPR, CCPA, and data privacy compliance',
    icon: Lock,
    color: 'from-teal-600 to-teal-800'
  },
  {
    name: 'suicidestop.ai',
    title: 'AI for Mental Health Safety',
    description: 'Mental health safety and crisis intervention',
    icon: Shield,
    color: 'from-green-600 to-green-800'
  }
];

// Enterprise Integrations Data
const integrationCategories = [
  {
    category: 'Cloud Platforms',
    integrations: [
      { name: 'AWS SageMaker', description: 'ML model training and deployment on AWS', status: 'Connected' },
      { name: 'Azure ML', description: 'Microsoft Azure machine learning services', status: 'Connected' },
      { name: 'Google Vertex AI', description: 'Google Cloud AI and ML platform', status: 'Connected' },
      { name: 'IBM Watson', description: 'IBM enterprise AI services', status: 'Available' }
    ]
  },
  {
    category: 'AI/ML Frameworks',
    integrations: [
      { name: 'TensorFlow', description: 'Open-source ML framework by Google', status: 'Connected' },
      { name: 'PyTorch', description: 'Open-source ML framework by Meta', status: 'Connected' },
      { name: 'Hugging Face', description: 'Open-source NLP and transformer models', status: 'Connected' },
      { name: 'LangChain', description: 'LLM application development framework', status: 'Connected' },
      { name: 'OpenAI', description: 'OpenAI API and GPT models', status: 'Connected' },
      { name: 'Anthropic', description: 'Anthropic Claude AI models', status: 'Connected' }
    ]
  },
  {
    category: 'GRC Platforms',
    integrations: [
      { name: 'ServiceNow GRC', description: 'Governance, Risk & Compliance platform', status: 'Available' },
      { name: 'Archer', description: 'Archer GRC and risk management', status: 'Available' },
      { name: 'MetricStream', description: 'Enterprise GRC and compliance', status: 'Available' },
      { name: 'OneTrust', description: 'Privacy and governance management', status: 'Connected' }
    ]
  },
  {
    category: 'Collaboration Tools',
    integrations: [
      { name: 'Slack', description: 'Team messaging and notifications', status: 'Connected' },
      { name: 'Microsoft Teams', description: 'Enterprise team collaboration', status: 'Connected' },
      { name: 'Jira', description: 'Issue tracking and project management', status: 'Available' },
      { name: 'Confluence', description: 'Team documentation and wikis', status: 'Available' }
    ]
  },
  {
    category: 'Data & Analytics',
    integrations: [
      { name: 'Snowflake', description: 'Cloud data warehouse and analytics', status: 'Connected' },
      { name: 'Databricks', description: 'Unified data and ML platform', status: 'Connected' },
      { name: 'Google BigQuery', description: 'Google Cloud data warehouse', status: 'Connected' },
      { name: 'Power BI', description: 'Microsoft business intelligence platform', status: 'Available' },
      { name: 'Tableau', description: 'Data visualization and analytics', status: 'Available' }
    ]
  },
  {
    category: 'Identity & Access',
    integrations: [
      { name: 'Okta', description: 'Identity and access management', status: 'Connected' },
      { name: 'Azure AD', description: 'Microsoft Azure Active Directory', status: 'Connected' },
      { name: 'Auth0', description: 'Modern authentication platform', status: 'Available' },
      { name: 'Ping Identity', description: 'Enterprise identity platform', status: 'Available' }
    ]
  }
];

// API & Developer Tools Data
const developerTools = [
  {
    title: 'REST API',
    description: 'Full CRUD operations with OpenAPI 3.0 specification',
    icon: Code
  },
  {
    title: 'GraphQL',
    description: 'Flexible queries for compliance data and reports',
    icon: Plug
  },
  {
    title: 'Webhooks',
    description: 'Real-time event notifications and triggers',
    icon: Zap
  },
  {
    title: 'CLI Tool',
    description: 'Command-line interface for CI/CD pipelines',
    icon: Server
  }
];

// Integration Steps
const integrationSteps = [
  {
    number: 1,
    title: 'Connect',
    description: 'Use OAuth 2.0 or API keys to connect your AI systems and platforms',
    icon: Link2
  },
  {
    number: 2,
    title: 'Configure',
    description: 'Set compliance frameworks, risk thresholds, and alert rules',
    icon: Plug
  },
  {
    number: 3,
    title: 'Monitor',
    description: 'Real-time governance monitoring with automated reporting',
    icon: Eye
  }
];

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Cloud Platforms');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative container max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Connect CSOAI to Your Entire AI Stack
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Seamlessly integrate CSOAI with 50+ enterprise platforms and tools. Connect your AI systems, configure compliance rules, and monitor governance in real-time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <Plug className="w-5 h-5" />
                Browse Integrations
              </Button>
              <Button
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold border border-white/30 flex items-center gap-2"
              >
                <Code className="w-5 h-5" />
                View API Docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Terranova Group Ecosystem */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 mb-4 px-4 py-2">Ecosystem</Badge>
            <h2 className="text-4xl font-bold mb-4 text-slate-900">The Terranova Group Ecosystem</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              11 interconnected platforms forming a comprehensive AI governance and safety ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecosystemPlatforms.map((platform) => {
              const PlatformIcon = platform.icon;
              return (
                <Card key={platform.name} className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-200">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4`}>
                    <PlatformIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{platform.title}</h3>
                  <p className="text-slate-600 mb-3">{platform.name}</p>
                  <p className="text-sm text-slate-500">{platform.description}</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Link href={`https://${platform.name}`} target="_blank" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2 group">
                      Visit Platform
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Integrations */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 mb-4 px-4 py-2">50+ Integrations</Badge>
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Enterprise Integrations</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Connect with your favorite tools and platforms
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {integrationCategories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.category
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Integration Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationCategories
              .find((cat) => cat.category === selectedCategory)
              ?.integrations.map((integration) => (
                <Card
                  key={integration.name}
                  className="p-6 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{integration.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                    <Badge
                      className={`${
                        integration.status === 'Connected'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {integration.status}
                    </Badge>
                    <button className="text-blue-600 hover:text-blue-700 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* API & Developer Tools */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-2">Developer Tools</Badge>
            <h2 className="text-4xl font-bold mb-4 text-slate-900">API & Developer Tools</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful APIs and SDKs for seamless integration
            </p>
          </div>

          {/* Developer Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {developerTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <Card key={tool.title} className="p-8 border border-slate-200 hover:shadow-lg transition-all">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                    <ToolIcon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{tool.title}</h3>
                  <p className="text-slate-600 mb-6">{tool.description}</p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group">
                    Learn more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Card>
              );
            })}
          </div>

          {/* SDKs */}
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Available SDKs</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Python', 'JavaScript/TypeScript', 'Go', 'Java', '.NET'].map((sdk) => (
                <div key={sdk} className="bg-white rounded-lg p-4 text-center border border-blue-200 hover:border-blue-400 transition-colors">
                  <p className="font-semibold text-slate-900">{sdk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* API Documentation Link */}
          <div className="mt-12 text-center">
            <Link href="/api-docs">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2">
                <Code className="w-5 h-5" />
                View Full API Documentation
                <ExternalLink className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4 px-4 py-2">Integration Process</Badge>
            <h2 className="text-4xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three simple steps to connect CSOAI to your AI stack
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrationSteps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < integrationSteps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-400 to-transparent ml-2"></div>
                )}

                <Card className="p-8 text-center relative z-10 h-full hover:shadow-lg transition-all">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Step {step.number}: {step.title}
                  </h3>
                  <p className="text-slate-600">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>

          {/* Integration Details */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 border border-slate-200">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="font-semibold text-slate-900 mb-2">Secure Authentication</h4>
              <p className="text-sm text-slate-600">
                OAuth 2.0, API keys, and industry-standard authentication methods
              </p>
            </Card>
            <Card className="p-6 border border-slate-200">
              <Zap className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="font-semibold text-slate-900 mb-2">Real-time Sync</h4>
              <p className="text-sm text-slate-600">
                Automatic data synchronization and webhook notifications
              </p>
            </Card>
            <Card className="p-6 border border-slate-200">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="font-semibold text-slate-900 mb-2">Instant Activation</h4>
              <p className="text-sm text-slate-600">
                Start monitoring compliance within minutes of connecting
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Status */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="p-8 text-center border border-slate-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <p className="text-slate-600 font-medium">Platform Integrations</p>
            </Card>
            <Card className="p-8 text-center border border-slate-200">
              <div className="text-4xl font-bold text-emerald-600 mb-2">11</div>
              <p className="text-slate-600 font-medium">Terranova Ecosystem Platforms</p>
            </Card>
            <Card className="p-8 text-center border border-slate-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">5</div>
              <p className="text-slate-600 font-medium">SDKs Available</p>
            </Card>
            <Card className="p-8 text-center border border-slate-200">
              <div className="text-4xl font-bold text-amber-600 mb-2">99.9%</div>
              <p className="text-slate-600 font-medium">Uptime Guarantee</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative container max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Connect?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start integrating CSOAI with your AI stack today. Get started for free or contact us for enterprise integration support.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/pricing">
              <button className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors">
                View Pricing
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/enterprise">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors border border-blue-500">
                Contact Enterprise Sales
                <ExternalLink className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Need Help?</h3>
              <p className="text-slate-600 mb-4">
                Our integration specialists are here to help you connect CSOAI to your stack.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">API Documentation</h3>
              <p className="text-slate-600 mb-4">
                Comprehensive guides and reference documentation for all our APIs.
              </p>
              <Link href="/api-docs">
                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                  View Docs
                  <ExternalLink className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Integration Examples</h3>
              <p className="text-slate-600 mb-4">
                Code samples and integration examples for common use cases.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                Explore Examples
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
