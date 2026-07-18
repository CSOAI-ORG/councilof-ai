import { motion } from "framer-motion";
import { Clock, Shield, Zap, HeartPulse, AlertTriangle, CheckCircle, Phone, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function ServiceLevelAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-emerald-500/10 via-background to-blue-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Service Commitment
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Service Level Agreement
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Our commitment to reliability, performance, and support for the CSOAI platform
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Version 1.0</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Effective: January 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Uptime Commitment */}
          <motion.section {...fadeInUp}>
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                  1. Platform Availability & Uptime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-6xl font-bold text-emerald-600 mb-2">99.9%</div>
                  <p className="text-gray-600">Monthly Uptime Commitment</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { tier: "Standard", uptime: "99.5%", desc: "Individual & Startup plans" },
                    { tier: "Professional", uptime: "99.9%", desc: "Professional & Business plans" },
                    { tier: "Enterprise", uptime: "99.95%", desc: "Enterprise & Government plans" },
                  ].map((item, i) => (
                    <Card key={i} className="bg-white">
                      <CardContent className="p-4 text-center">
                        <Badge className="mb-2 bg-emerald-100 text-emerald-700">{item.tier}</Badge>
                        <div className="text-2xl font-bold text-emerald-600">{item.uptime}</div>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">What's Included in Uptime Calculation:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                    <li>Core platform access (login, dashboard, training)</li>
                    <li>Certification exam availability</li>
                    <li>API endpoint availability</li>
                    <li>33-Agent Council voting system</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Exclusions:</h4>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                    <li>Scheduled maintenance (announced 48+ hours in advance)</li>
                    <li>Force majeure events</li>
                    <li>Third-party service outages (payment providers, etc.)</li>
                    <li>Customer-side connectivity issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Response Times */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  2. Support Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Our support team is committed to responding within the following timeframes based on
                  issue severity and your subscription tier:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Severity</th>
                        <th className="text-left p-3 font-semibold">Standard</th>
                        <th className="text-left p-3 font-semibold">Professional</th>
                        <th className="text-left p-3 font-semibold">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">
                          <Badge className="bg-red-100 text-red-700">Critical</Badge>
                          <p className="text-xs text-gray-500 mt-1">Platform unavailable</p>
                        </td>
                        <td className="p-3">4 hours</td>
                        <td className="p-3 font-semibold text-emerald-600">1 hour</td>
                        <td className="p-3 font-semibold text-emerald-600">15 minutes</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <Badge className="bg-amber-100 text-amber-700">High</Badge>
                          <p className="text-xs text-gray-500 mt-1">Major feature impaired</p>
                        </td>
                        <td className="p-3">8 hours</td>
                        <td className="p-3">4 hours</td>
                        <td className="p-3 font-semibold text-emerald-600">1 hour</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <Badge className="bg-blue-100 text-blue-700">Medium</Badge>
                          <p className="text-xs text-gray-500 mt-1">Minor feature impaired</p>
                        </td>
                        <td className="p-3">24 hours</td>
                        <td className="p-3">8 hours</td>
                        <td className="p-3">4 hours</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <Badge className="bg-gray-100 text-gray-700">Low</Badge>
                          <p className="text-xs text-gray-500 mt-1">General inquiry</p>
                        </td>
                        <td className="p-3">48 hours</td>
                        <td className="p-3">24 hours</td>
                        <td className="p-3">8 hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-sm text-gray-500">
                  Response times are measured during business hours (9am-6pm GMT, Mon-Fri) for
                  Standard tier. Professional and Enterprise tiers include 24/7 support for Critical issues.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Support Channels */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  3. Support Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-800">Email Support</h4>
                      <p className="text-sm text-blue-600">support@csoai.org</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-700 text-xs">All Tiers</Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-emerald-800">Live Chat</h4>
                      <p className="text-sm text-emerald-600">In-platform chat</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">Professional+</Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-800">Phone Support</h4>
                      <p className="text-sm text-purple-600">Dedicated line</p>
                      <Badge className="mt-2 bg-purple-100 text-purple-700 text-xs">Enterprise Only</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Performance Targets */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  4. Performance Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600">
                  We commit to the following performance standards for the CSOAI platform:
                </p>

                <div className="space-y-4">
                  {[
                    { metric: "Page Load Time", target: "< 3 seconds", current: 92, desc: "95th percentile" },
                    { metric: "API Response Time", target: "< 500ms", current: 95, desc: "Average response" },
                    { metric: "Council Voting", target: "< 60 seconds", current: 88, desc: "Full 33-agent consensus" },
                    { metric: "Certificate Generation", target: "< 10 seconds", current: 97, desc: "PDF generation" },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-semibold">{item.metric}</h4>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">{item.target}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={item.current} className="flex-1" />
                        <span className="text-sm font-semibold text-emerald-600">{item.current}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Service Credits */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  5. Service Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  If we fail to meet our uptime commitments, you may be eligible for service credits:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-white">
                        <th className="text-left p-3 font-semibold">Monthly Uptime</th>
                        <th className="text-left p-3 font-semibold">Service Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">99.0% - 99.9%</td>
                        <td className="p-3">10% of monthly fee</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">95.0% - 99.0%</td>
                        <td className="p-3">25% of monthly fee</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">90.0% - 95.0%</td>
                        <td className="p-3">50% of monthly fee</td>
                      </tr>
                      <tr>
                        <td className="p-3">Below 90.0%</td>
                        <td className="p-3">100% of monthly fee</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-100 rounded-lg p-4 text-sm text-blue-800">
                  <strong>How to Claim:</strong> Submit a support ticket within 30 days of the incident
                  with details of the downtime experienced. Credits are applied to your next billing cycle
                  and cannot be exchanged for cash.
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Maintenance Windows */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  6. Scheduled Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <p>
                  Scheduled maintenance is performed during low-traffic periods to minimize impact:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Standard Maintenance</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Sundays, 2:00 AM - 6:00 AM GMT</li>
                        <li>• 48-hour advance notice</li>
                        <li>• Typically &lt; 30 minutes downtime</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Emergency Maintenance</h4>
                      <ul className="text-sm space-y-1">
                        <li>• As needed for security issues</li>
                        <li>• Notification as soon as practical</li>
                        <li>• Post-incident report within 24 hours</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Incident Communication */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  7. Incident Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  During service disruptions, we commit to transparent communication:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Initial Acknowledgment:</strong> Within 15 minutes of detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Status Updates:</strong> Every 30 minutes during ongoing incidents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Resolution Notice:</strong> Immediate notification when resolved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Post-Incident Report:</strong> Root cause analysis within 5 business days</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-500">
                  Status updates are posted at: <span className="text-emerald-600">status.csoai.org</span>
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Contact */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle>Questions About This SLA?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  For questions about service levels or to report an issue:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-emerald-400">Support</h4>
                    <p className="text-gray-300">support@csoai.org</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-400">Status Page</h4>
                    <p className="text-gray-300">status.csoai.org</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  CSOAI LTD | Companies House No: 16939677 | Registered in England & Wales
                </p>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
