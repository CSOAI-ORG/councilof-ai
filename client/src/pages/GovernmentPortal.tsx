import {useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Lock, Send, TrendingUp, Users, AlertCircle, CheckCircle2 } from "lucide-react";

export default function GovernmentPortal() {
  useEffect(() => { document.title = "GovernmentPortal | CSOAI"; }, []);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-white border-b-2 border-emerald-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Government Portal
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Real-time compliance monitoring and enforcement for AI safety regulators worldwide
            </p>
            <div className="flex justify-center gap-4">
              <a href="/contact" className="bg-emerald-600 hover:bg-emerald-700">
                Request Portal Access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Portal Features
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <Send className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Submit Compliance Updates</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Upload new compliance requirements and guidance. Changes propagate to all enterprises in real-time.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ Version control and change tracking</li>
                  <li>✓ Rollback capability if needed</li>
                  <li>✓ Audit trail of all changes</li>
                  <li>✓ Multi-language support</li>
                </ul>
              </Card>

              {/* Feature 2 */}
              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Real-Time Compliance Dashboard</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  View aggregate compliance statistics across all regulated AI systems.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ Compliance rates by region and industry</li>
                  <li>✓ Non-compliance alerts</li>
                  <li>✓ Trend analysis over time</li>
                  <li>✓ Enforcement tracking</li>
                </ul>
              </Card>

              {/* Feature 3 */}
              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Incident Management</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Access Watchdog incident reports and manage enforcement actions.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ View anonymous incident reports</li>
                  <li>✓ Investigate and categorize incidents</li>
                  <li>✓ Issue enforcement actions</li>
                  <li>✓ Track remediation progress</li>
                </ul>
              </Card>

              {/* Feature 4 */}
              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Multi-Agency Collaboration</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Coordinate with other regulators and agencies worldwide.
                </p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ Shared compliance data</li>
                  <li>✓ Coordinated enforcement</li>
                  <li>✓ Best practice sharing</li>
                  <li>✓ International standards alignment</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Demo */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Portal Dashboard Preview
            </h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="incidents">Incidents</TabsTrigger>
                <TabsTrigger value="enforcement">Enforcement</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h3>
                  
                  <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-6 bg-emerald-50 border-emerald-200">
                      <div className="text-sm text-gray-600 mb-2">Total AI Systems</div>
                      <div className="text-3xl font-bold text-emerald-600">1,247</div>
                      <div className="text-xs text-gray-500 mt-2">+12% this month</div>
                    </Card>
                    <Card className="p-6 bg-green-50 border-green-200">
                      <div className="text-sm text-gray-600 mb-2">Compliant Systems</div>
                      <div className="text-3xl font-bold text-green-600">1,098</div>
                      <div className="text-xs text-gray-500 mt-2">88% compliance rate</div>
                    </Card>
                    <Card className="p-6 bg-yellow-50 border-yellow-200">
                      <div className="text-sm text-gray-600 mb-2">Non-Compliant</div>
                      <div className="text-3xl font-bold text-yellow-600">149</div>
                      <div className="text-xs text-gray-500 mt-2">Enforcement pending</div>
                    </Card>
                    <Card className="p-6 bg-red-50 border-red-200">
                      <div className="text-sm text-gray-600 mb-2">Critical Issues</div>
                      <div className="text-3xl font-bold text-red-600">23</div>
                      <div className="text-xs text-gray-500 mt-2">Require immediate action</div>
                    </Card>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-6 h-64 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <BarChart3 className="h-8 w-8" />
                      <span>Compliance Trend Chart</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-6">
                <Card className="p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Compliance Statistics</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">EU AI Act Compliance</span>
                        <span className="text-emerald-600 font-bold">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">NIST RMF Alignment</span>
                        <span className="text-emerald-600 font-bold">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">ISO 42001 Certification</span>
                        <span className="text-emerald-600 font-bold">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">TC260 Standards</span>
                        <span className="text-emerald-600 font-bold">81%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '81%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Submit New Compliance Update</h4>
                    <p className="text-gray-700 text-sm mb-4">
                      Upload new compliance requirements. Changes will be propagated to all enterprises in real-time.
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" disabled title="This control is not wired to a backend action yet.">Submission not available yet</Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Incidents Tab */}
              <TabsContent value="incidents" className="space-y-6">
                <Card className="p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Watchdog Incidents</h3>
                  
                  <div className="space-y-4">
                    {[
                      { type: 'Bias Detection', count: 47, severity: 'High' },
                      { type: 'Privacy Violation', count: 32, severity: 'Critical' },
                      { type: 'Safety Failure', count: 18, severity: 'High' },
                      { type: 'Transparency Issue', count: 25, severity: 'Medium' },
                      { type: 'Autonomy Concern', count: 12, severity: 'Medium' },
                    ].map((incident, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h4 className="font-semibold text-gray-900">{incident.type}</h4>
                          <p className="text-sm text-gray-600">{incident.count} incidents reported</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          incident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          incident.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incident.severity}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Enforcement Tab */}
              <TabsContent value="enforcement" className="space-y-6">
                <Card className="p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Enforcement Actions</h3>
                  
                  <div className="space-y-4">
                    {[
                      { company: 'Tech Corp A', system: 'AI System X', status: 'Flagged', action: 'Warning Issued' },
                      { company: 'AI Solutions Inc', system: 'Recommendation Engine', status: 'Non-Compliant', action: 'Audit Required' },
                      { company: 'Data Analytics Ltd', system: 'Hiring Assistant', status: 'Under Review', action: 'Monitoring' },
                    ].map((enforcement, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{enforcement.company}</h4>
                            <p className="text-sm text-gray-600">{enforcement.system}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            enforcement.status === 'Non-Compliant' ? 'bg-red-100 text-red-700' :
                            enforcement.status === 'Flagged' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {enforcement.status}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Action: {enforcement.action}</span>
                          <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600" disabled title="This control is not wired to a backend action yet.">Detail view not available yet</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Government Portal APIs
            </h2>

            <div className="space-y-6">
              <Card className="p-8 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Submit Compliance Update</h3>
                <p className="text-gray-700 mb-4">Submit new compliance requirements that will be propagated to all enterprises.</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                  <div>POST /api/v1/government/requirements/submit</div>
                  <div className="mt-2 text-gray-400">
                    {`{
  "requirement": "All high-risk AI systems must include human-in-the-loop override",
  "framework": "EU AI Act",
  "effectiveDate": "2025-03-01",
  "priority": "high"
}`}
                  </div>
                </div>
                <a href="/api-docs" className="border-emerald-600 text-emerald-600">
                  View Full API Docs
                </a>
              </Card>

              <Card className="p-8 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Compliance Status</h3>
                <p className="text-gray-700 mb-4">View aggregate compliance statistics across all regulated AI systems.</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                  <div>GET /api/v1/government/compliance/status</div>
                  <div className="mt-2 text-gray-400">
                    {`{
  "totalSystems": 1247,
  "compliantSystems": 1098,
  "nonCompliantSystems": 149,
  "complianceRate": 0.88,
  "byFramework": {
    "euAiAct": 0.92,
    "nistRmf": 0.85,
    "iso42001": 0.78,
    "tc260": 0.81
  }
}`}
                  </div>
                </div>
                <a href="/api-docs" className="border-emerald-600 text-emerald-600">
                  View Full API Docs
                </a>
              </Card>

              <Card className="p-8 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Flag System for Enforcement</h3>
                <p className="text-gray-700 mb-4">Flag an AI system for enforcement action due to non-compliance.</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                  <div>POST /api/v1/government/enforcement/flag</div>
                  <div className="mt-2 text-gray-400">
                    {`{
  "systemId": "sys_12345",
  "reason": "High-risk system without required human oversight",
  "severity": "critical",
  "action": "Immediate audit required"
}`}
                  </div>
                </div>
                <a href="/api-docs" className="border-emerald-600 text-emerald-600">
                  View Full API Docs
                </a>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Access Control */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Security & Access Control
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Authentication</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>OAuth 2.0 with government identity providers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Multi-factor authentication (MFA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Session management and timeout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Audit logging of all access</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-8 w-8 text-emerald-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Data Protection</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>End-to-end encryption for all data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>AES-256 encryption at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>TLS 1.3 encryption in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>GDPR, CCPA, and privacy regulation compliance</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Enforce AI Safety?</h2>
            <p className="text-lg text-emerald-100 mb-8">
              Request access to the Government Portal and start monitoring AI compliance in your jurisdiction.
            </p>
            <a href="/contact" className="bg-white text-emerald-600 hover:bg-gray-100">
              Request Portal Access
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
