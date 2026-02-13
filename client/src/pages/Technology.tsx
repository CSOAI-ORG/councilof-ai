import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Shield,
  Brain,
  Lock,
  Globe,
  Server,
  Cpu,
  Network,
  Database,
  Eye,
  CheckCircle,
  ArrowRight,
  Zap,
  Code,
  Layers,
  GitBranch
} from 'lucide-react';

export default function Technology() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  const agents = [
    { name: 'Risk Assessment', icon: Shield, description: 'Evaluates model risks and failure modes' },
    { name: 'Bias Detection', icon: Eye, description: 'Identifies unfair patterns and disparities' },
    { name: 'Privacy Analysis', icon: Lock, description: 'Ensures data protection compliance' },
    { name: 'Regulatory Mapping', icon: Globe, description: 'Aligns with regulatory frameworks' },
    { name: 'Ethical Review', icon: Brain, description: 'Assesses ethical implications' },
    { name: 'Performance Monitor', icon: Cpu, description: 'Tracks accuracy and reliability' },
    { name: 'Security Auditor', icon: Shield, description: 'Identifies vulnerabilities' },
    { name: 'Transparency Check', icon: Eye, description: 'Validates explainability standards' },
  ];

  const architectureLayers = [
    {
      id: 'data-ingestion',
      title: 'Data Ingestion Layer',
      icon: Database,
      description: 'Connects to enterprise AI systems, APIs, and data pipelines',
      details: [
        'Real-time data streaming from production AI systems',
        'Batch processing for historical compliance audits',
        'Multi-protocol support: REST, gRPC, Kafka, S3',
        'Automatic schema detection and validation',
        'Data lineage tracking for full traceability'
      ]
    },
    {
      id: 'analysis-engine',
      title: 'Analysis Engine',
      icon: Brain,
      description: '33-agent Byzantine council processes in parallel',
      details: [
        'Distributed processing across multiple nodes',
        'Byzantine Fault Tolerant consensus algorithm',
        '22/33 threshold for compliance decisions',
        'Sub-100ms response time for standard audits',
        'Horizontal scaling for variable loads'
      ]
    },
    {
      id: 'compliance-mapper',
      title: 'Compliance Framework Mapper',
      icon: CheckCircle,
      description: 'Maps findings against regulatory standards',
      details: [
        'Coverage: EU AI Act, NIST AI RMF, ISO 42001',
        'Automatic regulation version tracking',
        'Gap analysis and remediation suggestions',
        'Multi-jurisdiction support',
        'Custom framework integration'
      ]
    },
    {
      id: 'reporting-action',
      title: 'Reporting & Action Layer',
      icon: Layers,
      description: 'Dashboards, alerts, and automated remediation',
      details: [
        'Real-time compliance dashboards',
        'Configurable alerting thresholds',
        'Automated remediation workflow triggers',
        'Audit trail with tamper-proof logging',
        'Export to SIEM and compliance tools'
      ]
    },
  ];

  const integrations = [
    { category: 'Cloud Platforms', items: ['AWS', 'Microsoft Azure', 'Google Cloud Platform'] },
    { category: 'AI/ML Frameworks', items: ['TensorFlow', 'PyTorch', 'Hugging Face', 'OpenAI API'] },
    { category: 'Enterprise Tools', items: ['Salesforce', 'ServiceNow', 'Jira', 'Slack'] },
    { category: 'Data Platforms', items: ['Snowflake', 'Databricks', 'BigQuery', 'Redshift'] },
    { category: 'Identity & Security', items: ['Okta', 'Auth0', 'Azure AD', 'Ping Identity'] },
  ];

  const securityFeatures = [
    { label: 'Compliance', value: 'SOC 2 Type II, ISO 27001, GDPR, CCPA' },
    { label: 'Encryption', value: 'AES-256 at rest, TLS 1.3 in transit' },
    { label: 'Architecture', value: 'Zero-trust, defense-in-depth' },
    { label: 'Deployment', value: 'Multi-region (AWS, Azure, GCP)' },
    { label: 'Availability', value: '99.99% uptime SLA' },
    { label: 'Audit', value: 'Immutable audit logs, continuous monitoring' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            The Technology Behind <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Trustworthy AI Governance</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Built on Byzantine Fault-Tolerant consensus architecture, CSOAI's 33-agent council delivers bulletproof compliance verification across any AI system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <a className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
                View Pricing <ArrowRight size={20} />
              </a>
            </Link>
            <Link href="/demo">
              <a className="px-8 py-3 border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 rounded-lg font-semibold transition">
                Request Demo
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Byzantine Council Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">How the 33-Agent Byzantine Council Works</h2>
            <p className="text-blue-200 text-lg">Distributed consensus for uncompromising compliance verification</p>
          </div>

          {/* Byzantine Explanation Card */}
          <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-700/50 rounded-xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">33 Specialized Agents</h3>
                <p className="text-blue-200">Each analyzes compliance from different angles: risk, bias, privacy, regulation, ethics, and more</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fault Tolerance</h3>
                <p className="text-blue-200">System works even if up to 10 agents fail or produce incorrect results</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Consensus Mechanism</h3>
                <p className="text-blue-200">22 out of 33 agents must agree for a compliance decision</p>
              </div>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              const isExpanded = expandedAgent === agent.name;
              return (
                <button
                  key={agent.name}
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                  className="bg-gradient-to-br from-blue-800/40 to-slate-800/40 border border-blue-600/30 hover:border-blue-400/60 rounded-lg p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <IconComponent className="text-blue-400" size={28} />
                    <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ArrowRight size={18} className="text-blue-300" />
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{agent.name}</h3>
                  <p className="text-blue-200 text-sm">{agent.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Overview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-950/30 to-slate-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Architecture Overview</h2>
            <p className="text-blue-200 text-lg">Four integrated layers for end-to-end compliance assurance</p>
          </div>

          <div className="space-y-4">
            {architectureLayers.map((layer) => {
              const IconComponent = layer.icon;
              const isExpanded = expandedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                  className="w-full bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-700/50 hover:border-blue-400/70 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <IconComponent className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{layer.title}</h3>
                        <p className="text-blue-200">{layer.description}</p>
                      </div>
                    </div>
                    <span className={`ml-4 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ArrowRight size={20} className="text-blue-300" />
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-blue-700/30">
                      <ul className="space-y-2">
                        {layer.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-blue-100">
                            <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Architecture Diagram Visualization */}
          <div className="mt-12 bg-gradient-to-b from-blue-900/30 to-slate-900/30 border border-blue-700/30 rounded-xl p-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 px-6 py-4 bg-blue-800/40 border border-blue-600/50 rounded-lg">
                <Database className="text-blue-400 flex-shrink-0" size={28} />
                <div>
                  <h4 className="font-bold text-white">Data Ingestion</h4>
                  <p className="text-sm text-blue-200">Enterprise AI systems, APIs, data pipelines</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Zap className="text-yellow-400" size={24} />
              </div>

              <div className="flex items-center gap-4 px-6 py-4 bg-blue-800/40 border border-blue-600/50 rounded-lg">
                <Brain className="text-blue-400 flex-shrink-0" size={28} />
                <div>
                  <h4 className="font-bold text-white">Analysis Engine</h4>
                  <p className="text-sm text-blue-200">33-agent Byzantine council (22/33 consensus)</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Zap className="text-yellow-400" size={24} />
              </div>

              <div className="flex items-center gap-4 px-6 py-4 bg-blue-800/40 border border-blue-600/50 rounded-lg">
                <CheckCircle className="text-blue-400 flex-shrink-0" size={28} />
                <div>
                  <h4 className="font-bold text-white">Compliance Mapper</h4>
                  <p className="text-sm text-blue-200">EU AI Act, NIST, ISO 42001, custom frameworks</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Zap className="text-yellow-400" size={24} />
              </div>

              <div className="flex items-center gap-4 px-6 py-4 bg-blue-800/40 border border-blue-600/50 rounded-lg">
                <Layers className="text-blue-400 flex-shrink-0" size={28} />
                <div>
                  <h4 className="font-bold text-white">Reporting & Action</h4>
                  <p className="text-sm text-blue-200">Dashboards, alerts, automated remediation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Infrastructure Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Security & Infrastructure</h2>
            <p className="text-blue-200 text-lg">Enterprise-grade security with global reach</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-900/30 to-slate-900/30 border border-green-700/40 rounded-lg p-6 hover:border-green-400/60 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{feature.label}</h3>
                    <p className="text-green-100">{feature.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infrastructure Details */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-700/50 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Server className="text-blue-400" size={28} />
                <h3 className="text-2xl font-bold text-white">Global Deployment</h3>
              </div>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-center gap-2">
                  <Globe size={18} className="text-blue-400 flex-shrink-0" />
                  Multi-region deployment (AWS, Azure, GCP)
                </li>
                <li className="flex items-center gap-2">
                  <Network size={18} className="text-blue-400 flex-shrink-0" />
                  Geo-redundant data replication
                </li>
                <li className="flex items-center gap-2">
                  <Zap size={18} className="text-blue-400 flex-shrink-0" />
                  99.99% uptime SLA with automatic failover
                </li>
                <li className="flex items-center gap-2">
                  <Lock size={18} className="text-blue-400 flex-shrink-0" />
                  Regional data residency compliance
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-purple-700/50 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-purple-400" size={28} />
                <h3 className="text-2xl font-bold text-white">Data Protection</h3>
              </div>
              <ul className="space-y-3 text-purple-100">
                <li className="flex items-center gap-2">
                  <Lock size={18} className="text-purple-400 flex-shrink-0" />
                  AES-256 encryption at rest
                </li>
                <li className="flex items-center gap-2">
                  <Lock size={18} className="text-purple-400 flex-shrink-0" />
                  TLS 1.3 encryption in transit
                </li>
                <li className="flex items-center gap-2">
                  <Eye size={18} className="text-purple-400 flex-shrink-0" />
                  Zero-trust architecture
                </li>
                <li className="flex items-center gap-2">
                  <GitBranch size={18} className="text-purple-400 flex-shrink-0" />
                  Immutable audit logs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-950/30 to-slate-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Integrations</h2>
            <p className="text-blue-200 text-lg">Works seamlessly with your existing tech stack</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-700/50 hover:border-blue-400/70 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Network size={20} className="text-blue-400" />
                  {integration.category}
                </h3>
                <ul className="space-y-2">
                  {integration.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-blue-200 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open API Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Open API</h2>
            <p className="text-blue-200 text-lg">Build on top of CSOAI with our comprehensive API</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-700/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold text-white">API Endpoints</h3>
              </div>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-blue-600/40 rounded text-sm font-mono text-blue-300 mt-0.5">REST</span>
                  <span>RESTful API with OpenAPI 3.0 spec</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-blue-600/40 rounded text-sm font-mono text-blue-300 mt-0.5">GraphQL</span>
                  <span>GraphQL endpoint for flexible queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-2 py-1 bg-blue-600/40 rounded text-sm font-mono text-blue-300 mt-0.5">Webhooks</span>
                  <span>Real-time alerts and event streaming</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-700/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold text-white">SDK Support</h3>
              </div>
              <div className="space-y-2 text-blue-100">
                <p className="font-semibold">Available in:</p>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'JavaScript', 'Go', 'Java'].map((sdk) => (
                    <span key={sdk} className="px-3 py-1 bg-blue-700/40 rounded-full text-sm border border-blue-600/50">
                      {sdk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rate Limiting & Specs */}
          <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Performance & Limits</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-200 text-sm mb-2">Enterprise Plan</p>
                <p className="text-3xl font-bold text-blue-400">10,000</p>
                <p className="text-blue-100">requests/minute</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm mb-2">Response Time</p>
                <p className="text-3xl font-bold text-blue-400">&lt;100ms</p>
                <p className="text-blue-100">average latency</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm mb-2">Uptime SLA</p>
                <p className="text-3xl font-bold text-blue-400">99.99%</p>
                <p className="text-blue-100">guaranteed availability</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <Link href="/api-docs">
                <a className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                  <Code size={20} />
                  View API Documentation
                  <ArrowRight size={20} />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Deploy Enterprise-Grade AI Governance?</h2>
          <p className="text-xl text-blue-100 mb-8">Join leading organizations using CSOAI to ensure compliance, reduce risk, and build trust in their AI systems.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <a className="px-8 py-3 bg-white hover:bg-blue-50 text-blue-900 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                Explore Plans <ArrowRight size={20} />
              </a>
            </Link>
            <Link href="/enterprise">
              <a className="px-8 py-3 border-2 border-white text-white hover:bg-white/10 rounded-lg font-semibold transition">
                Contact Sales
              </a>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
