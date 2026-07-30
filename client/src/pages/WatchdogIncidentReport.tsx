import { useEffect } from "react";
/**
 * Watchdog Incident Reporting Page
 * Allows users to report AI safety incidents and view recent reports
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, MapPin, TrendingUp, Eye, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function WatchdogIncidentReportPage() {
  useEffect(() => { document.title = "WatchdogIncidentReport | CSOAI"; }, []);
  const [formData, setFormData] = useState({
    systemName: '',
    description: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    framework: 'eu-ai-act',
    email: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recent reports
  const { data: recentReports = [] } = trpc.watchdog.list.useQuery();
  const submitMutation = trpc.watchdog.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Submit incident report
      await submitMutation.mutateAsync({
        title: formData.systemName,
        description: formData.description,
        aiSystemName: formData.systemName,
        incidentType: 'safety' as const,
        severity: formData.riskLevel === 'high' ? 'critical' : formData.riskLevel,
        reporterEmail: formData.email || undefined,
      });
      setSubmitted(true);
      setFormData({
        systemName: '',
        description: '',
        riskLevel: 'medium',
        framework: 'eu-ai-act',
        email: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const riskColors = {
    low: 'bg-green-50 border-green-200 text-green-700',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    high: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Report an AI Safety Incident</h1>
          <p className="text-xl text-orange-100 max-w-2xl">
            Help us protect the public. Report AI system failures, bias, or safety concerns. 
            Your report helps regulators and researchers understand real-world AI risks.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit an Incident Report</CardTitle>
                <CardDescription>
                  Share details about an AI system failure or safety concern. Reports are anonymous by default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Thank you! Your incident report has been submitted and will be reviewed by our team.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" data-testid="watchdog-incident-form">
                  {/* System Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">AI System Name or Company</label>
                    <Input
                      name="systemName"
                      value={formData.systemName}
                      onChange={handleChange}
                      placeholder="e.g., ChatBot Pro v2.1 or Company Name"
                      required
                      data-testid="watchdog-system-name-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">What AI system or company is involved?</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Incident Description</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe what happened. Include: what the AI system did, what went wrong, who was affected, and any evidence or links."
                      rows={6}
                      required
                      data-testid="watchdog-description-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Be as specific as possible. Include dates, times, and any evidence.</p>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Risk Level</label>
                    <select
                      name="riskLevel"
                      value={formData.riskLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="watchdog-risk-level-select"
                    >
                      <option value="low">Low Risk - Minor issue, limited impact</option>
                      <option value="medium">Medium Risk - Moderate impact, affects multiple users</option>
                      <option value="high">High Risk - Severe impact, safety concern, discrimination</option>
                    </select>
                  </div>

                  {/* Framework */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Applicable Framework</label>
                    <select
                      name="framework"
                      value={formData.framework}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="watchdog-framework-select"
                    >
                      <option value="eu-ai-act">EU AI Act</option>
                      <option value="nist-ai-rmf">NIST AI RMF</option>
                      <option value="tc260">TC260 (China)</option>
                      <option value="uk-ai-bill">UK AI Bill</option>
                      <option value="canada-ai-act">Canada AI Act</option>
                      <option value="australia-ai">Australia AI Governance</option>
                    </select>
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email (Optional)</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com (optional - for follow-up questions)"
                      data-testid="watchdog-email-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to remain completely anonymous</p>
                  </div>

                  {/* Privacy Notice */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm">
                      Your report is anonymous by default. If you provide an email, we'll only use it to follow up on your report. 
                      Reports are shared with regulators and researchers to improve AI safety.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={isLoading}
                    data-testid="watchdog-submit-button"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Incident Report'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Info & Stats */}
          <div className="space-y-6">
            {/* Why Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Why Report?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Help regulators understand real-world AI risks</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Contribute to AI safety research</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Hold AI companies accountable</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Protect future AI users</span>
                </div>
              </CardContent>
            </Card>

            {/* Become an Analyst */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg">Become a Watchdog Analyst</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Help review and investigate AI safety incidents as a certified analyst.
                </p>
                <Link href="/watchdog" className="block w-full">
                  <Button className="w-full" variant="outline" asChild>
                    <span>Learn More</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sign In for More */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  View More Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Sign in to view detailed reports, search by framework, and track incident trends.
                </p>
                <Link href="/login" className="block w-full">
                  <Button className="w-full" size="sm" asChild>
                    <span>Sign In</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Reports Feed */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Recent Incident Reports</h2>
          <div className="space-y-4">
            {recentReports.length > 0 ? (
              recentReports.map((report: any, idx: number) => (
                <Card key={idx} className={riskColors[report.riskLevel as keyof typeof riskColors]}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{report.systemName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {report.framework}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{report.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                          {report.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {report.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {report.riskLevel ? report.riskLevel.charAt(0).toUpperCase() + report.riskLevel.slice(1) : 'Unknown'} Risk
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>No public reports yet. Be the first to report an incident.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* View More Button */}
          <div className="text-center mt-8">
            <Link href="/login" className="inline-block">
              <Button size="lg" variant="outline" asChild>
                <span>Sign In to View More Reports</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
