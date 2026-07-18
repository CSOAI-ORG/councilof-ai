/**
 * SOAI-PDCA Continuous Improvement Framework Page
 * Comprehensive documentation of the Safety Oversight AI - Plan-Do-Check-Act methodology
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  RefreshCw,
  ArrowRight,
  BookOpen,
  FileCheck,
  BarChart3,
  Target,
} from 'lucide-react';

export default function SOAIPDCAFramework() {
  // Map template names to backend template IDs
  const templateIdMap: Record<string, string> = {
    'Risk Assessment Matrix': 'risk-assessment-matrix',
    'Compliance Checklist': 'compliance-checklist',
    'Implementation Roadmap': 'implementation-roadmap',
    'Safety Control Guide': 'safety-control-guide',
    'Incident Response Playbook': 'incident-response-playbook',
    'Monitoring Configuration': 'monitoring-configuration',
    'Performance Metrics Dashboard': 'performance-metrics-dashboard',
    'Incident Report Form': 'incident-report-form',
    'Audit Checklist': 'audit-checklist',
    'Root Cause Analysis Template': 'root-cause-analysis',
    'Corrective Action Plan': 'corrective-action-plan',
    'Lessons Learned Document': 'lessons-learned',
  };

  const downloadTemplate = (templateName: string) => {
    const templateId = templateIdMap[templateName];
    if (templateId) {
      // Direct download from backend
      window.open(`/api/download-template/${templateId}`, '_blank');
    } else {
      console.log(`Template not found: ${templateName}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-900 to-emerald-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <img
                src="/pdca-certification-mark.png"
                alt="PDCA Certification Mark"
                className="h-32 w-32"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              SOAI-PDCA Continuous Improvement Framework
            </h1>
            <p className="text-xl text-green-100 mb-8">
              The industry-standard methodology for ongoing AI safety governance, combining
              Safety Oversight AI with the proven Plan-Do-Check-Act cycle for continuous
              improvement and regulatory compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-green-900 hover:bg-gray-100"
                onClick={() => downloadTemplate('SOAI-PDCA-Complete-Guide.pdf')}
              >
                <Download className="mr-2 h-5 w-5" />
                Download Complete Guide
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-green-800"
                onClick={() => downloadTemplate('SOAI-PDCA-Templates.zip')}
              >
                <FileText className="mr-2 h-5 w-5" />
                Get All Templates
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Overview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is SOAI-PDCA?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              SOAI-PDCA combines AI-powered safety oversight with the Deming Cycle (PDCA)
              to create a continuous improvement loop for AI governance that meets global
              regulatory requirements including EU AI Act, NIST AI RMF, and TC260.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border-2 border-green-100">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Safety Oversight AI (SOAI)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The 33-Agent AI Council provides democratic, unbiased safety assessments by
                  aggregating decisions from multiple AI providers (OpenAI, Anthropic, Google,
                  Meta, and more).
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No single-vendor bias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Democratic voting mechanism</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Human analyst oversight</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100">
              <CardHeader>
                <RefreshCw className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>PDCA Cycle (Deming Cycle)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The proven four-phase methodology for continuous improvement, adapted
                  specifically for AI safety governance and regulatory compliance.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Iterative improvement process</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Evidence-based decision making</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Continuous compliance monitoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* PDCA Cycle Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              The Four-Phase SOAI-PDCA Cycle
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  phase: 'PLAN',
                  icon: Target,
                  color: 'blue',
                  description: 'Define objectives, identify risks, establish compliance requirements',
                },
                {
                  phase: 'DO',
                  icon: TrendingUp,
                  color: 'green',
                  description: 'Implement controls, deploy safeguards, execute mitigation strategies',
                },
                {
                  phase: 'CHECK',
                  icon: BarChart3,
                  color: 'yellow',
                  description: 'Monitor performance, assess compliance, collect incident reports',
                },
                {
                  phase: 'ACT',
                  icon: RefreshCw,
                  color: 'purple',
                  description: 'Analyze results, implement improvements, update policies',
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div
                    className={`w-24 h-24 mx-auto mb-4 rounded-full bg-${item.color}-100 flex items-center justify-center`}
                  >
                    <item.icon className={`h-12 w-12 text-${item.color}-600`} />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{item.phase}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {index < 3 && (
                    <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mt-4 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Phase Documentation */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Detailed Phase Documentation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Step-by-step implementation guides for each phase of the SOAI-PDCA cycle,
              with downloadable templates and real-world examples.
            </p>
          </div>

          <Tabs defaultValue="plan" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plan">PLAN</TabsTrigger>
              <TabsTrigger value="do">DO</TabsTrigger>
              <TabsTrigger value="check">CHECK</TabsTrigger>
              <TabsTrigger value="act">ACT</TabsTrigger>
            </TabsList>

            {/* PLAN Phase */}
            <TabsContent value="plan" className="mt-8">
              <Card>
                <CardHeader className="bg-blue-50">
                  <div className="flex items-center gap-4">
                    <Target className="h-10 w-10 text-blue-600" />
                    <div>
                      <CardTitle className="text-2xl">Phase 1: PLAN</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Establish objectives and processes necessary for AI safety
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Activities:</h4>
                      <ul className="space-y-2">
                        {[
                          'Identify AI system scope and boundaries',
                          'Define safety objectives and success criteria',
                          'Map applicable regulatory frameworks (EU AI Act, NIST, TC260)',
                          'Conduct initial risk assessment',
                          'Establish baseline compliance requirements',
                          'Define roles and responsibilities',
                          'Create implementation timeline',
                        ].map((activity, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Required Documentation:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          'AI System Specification Document',
                          'Risk Assessment Matrix',
                          'Compliance Requirements Checklist',
                          'Stakeholder Analysis',
                          'Implementation Roadmap',
                          'Resource Allocation Plan',
                        ].map((doc, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => downloadTemplate(doc)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {doc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">SOAI Integration:</h4>
                      <p className="text-gray-700 mb-3">
                        The 33-Agent Council assists in the PLAN phase by:
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Analyzing AI system architecture for potential risks',
                          'Recommending applicable compliance frameworks',
                          'Identifying similar systems and historical incidents',
                          'Suggesting best practices from industry standards',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DO Phase */}
            <TabsContent value="do" className="mt-8">
              <Card>
                <CardHeader className="bg-green-50">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-10 w-10 text-green-600" />
                    <div>
                      <CardTitle className="text-2xl">Phase 2: DO</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Implement the planned safety controls and safeguards
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Activities:</h4>
                      <ul className="space-y-2">
                        {[
                          'Deploy technical safety controls (guardrails, filters, monitoring)',
                          'Implement governance policies and procedures',
                          'Establish incident response protocols',
                          'Configure logging and audit trails',
                          'Train personnel on safety procedures',
                          'Set up monitoring dashboards',
                          'Document implementation decisions',
                        ].map((activity, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Implementation Templates:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          'Safety Control Implementation Guide',
                          'Incident Response Playbook',
                          'Monitoring Configuration Template',
                          'Training Materials Package',
                          'Change Management Log',
                          'Deployment Checklist',
                        ].map((doc, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => downloadTemplate(doc)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {doc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">SOAI Integration:</h4>
                      <p className="text-gray-700 mb-3">
                        The 33-Agent Council supports the DO phase by:
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Validating control effectiveness before deployment',
                          'Reviewing implementation against planned objectives',
                          'Identifying gaps in safety coverage',
                          'Recommending additional safeguards based on risk profile',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CHECK Phase */}
            <TabsContent value="check" className="mt-8">
              <Card>
                <CardHeader className="bg-yellow-50">
                  <div className="flex items-center gap-4">
                    <BarChart3 className="h-10 w-10 text-yellow-600" />
                    <div>
                      <CardTitle className="text-2xl">Phase 3: CHECK</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Monitor and measure AI system performance against objectives
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Activities:</h4>
                      <ul className="space-y-2">
                        {[
                          'Collect performance metrics and KPIs',
                          'Review incident reports and near-misses',
                          'Conduct compliance audits',
                          'Analyze user feedback and complaints',
                          'Monitor for emerging risks and threats',
                          'Assess control effectiveness',
                          'Generate compliance reports',
                        ].map((activity, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Monitoring Templates:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          'Performance Metrics Dashboard',
                          'Incident Report Form',
                          'Compliance Audit Checklist',
                          'Risk Assessment Update',
                          'Stakeholder Feedback Survey',
                          'Control Effectiveness Review',
                        ].map((doc, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => downloadTemplate(doc)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {doc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">SOAI Integration:</h4>
                      <p className="text-gray-700 mb-3">
                        The 33-Agent Council enhances the CHECK phase by:
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Analyzing incident reports for root causes',
                          'Identifying patterns across multiple data sources',
                          'Benchmarking performance against industry standards',
                          'Flagging anomalies and potential compliance violations',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        Watchdog Integration
                      </h4>
                      <p className="text-gray-700">
                        The CHECK phase is powered by the <strong>Watchdog Public Database</strong>,
                        where anyone can report AI safety incidents. All reports are reviewed by
                        the 33-Agent Council and certified analysts, feeding directly into your
                        PDCA cycle for continuous improvement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACT Phase */}
            <TabsContent value="act" className="mt-8">
              <Card>
                <CardHeader className="bg-purple-50">
                  <div className="flex items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-purple-600" />
                    <div>
                      <CardTitle className="text-2xl">Phase 4: ACT</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Take corrective actions and standardize successful improvements
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Activities:</h4>
                      <ul className="space-y-2">
                        {[
                          'Analyze CHECK phase findings and identify root causes',
                          'Prioritize improvement opportunities',
                          'Implement corrective actions for identified issues',
                          'Update policies, procedures, and controls',
                          'Communicate changes to stakeholders',
                          'Document lessons learned',
                          'Plan next PDCA cycle iteration',
                        ].map((activity, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Improvement Templates:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          'Root Cause Analysis Template',
                          'Corrective Action Plan',
                          'Policy Update Tracker',
                          'Stakeholder Communication Plan',
                          'Lessons Learned Document',
                          'Next Cycle Planning Template',
                        ].map((doc, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start"
                            onClick={() => downloadTemplate(doc)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {doc}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">SOAI Integration:</h4>
                      <p className="text-gray-700 mb-3">
                        The 33-Agent Council optimizes the ACT phase by:
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Recommending evidence-based corrective actions',
                          'Prioritizing improvements based on risk and impact',
                          'Learning from historical decisions via RLHF feedback',
                          'Suggesting preventive measures for future cycles',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-green-600" />
                        Continuous Improvement
                      </h4>
                      <p className="text-gray-700">
                        The ACT phase completes one cycle and feeds directly into the next PLAN
                        phase, creating a continuous loop of improvement. Each iteration makes
                        your AI system safer, more compliant, and more trustworthy.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Implementation Guide */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Getting Started with SOAI-PDCA
              </h2>
              <p className="text-lg text-gray-600">
                Follow these steps to implement the framework in your organization
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Register Your AI System',
                  description: 'Create an account and register your AI system on the CSOAI platform',
                  action: 'Get Started',
                  link: '/ai-systems',
                },
                {
                  step: 2,
                  title: 'Complete Initial Assessment',
                  description: 'Run your first compliance assessment with the 33-Agent Council',
                  action: 'Run Assessment',
                  link: '/compliance',
                },
                {
                  step: 3,
                  title: 'Create Your First PDCA Cycle',
                  description: 'Use the assessment results to plan your first improvement cycle',
                  action: 'Create Cycle',
                  link: '/pdca',
                },
                {
                  step: 4,
                  title: 'Get Certified',
                  description: 'Train your team and earn CSOAI certification for your organization',
                  action: 'View Training',
                  link: '/training',
                },
              ].map((item, index) => (
                <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-green-600">{item.step}</span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        <Button variant="outline" size="sm">
                          {item.action}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gradient-to-r from-green-900 to-emerald-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Additional Resources
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Download comprehensive guides, templates, and case studies
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Link href="/pdca-simulator">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-auto py-4"
                >
                  <div className="text-left w-full">
                    <div className="font-semibold text-lg">🎮 Try Interactive Simulator</div>
                    <div className="text-xs text-emerald-100 mt-1">
                      Walk through a complete PDCA cycle with a fictional AI system
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-6 w-6 flex-shrink-0" />
                </Button>
              </Link>
              {[
                { name: 'Complete Implementation Guide', size: '8.2 MB' },
                { name: 'All Templates (ZIP)', size: '4.5 MB' },
              ].map((resource, i) => (
                <Button
                  key={i}
                  size="lg"
                  variant="secondary"
                  className="bg-white text-green-900 hover:bg-gray-100"
                  onClick={() => downloadTemplate(resource.name)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{resource.name}</div>
                    <div className="text-xs text-gray-600">{resource.size}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
