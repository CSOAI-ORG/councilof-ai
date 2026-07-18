import { motion } from "framer-motion";
import { Shield, Database, Eye, Clock, UserCheck, Lock, Globe, Cookie, Mail, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const dataUsePurposes = [
  { purpose: "Provide membership services", basis: "Contract performance" },
  { purpose: "Process certifications", basis: "Contract performance" },
  { purpose: "Send service communications", basis: "Legitimate interest" },
  { purpose: "Improve our services", basis: "Legitimate interest" },
  { purpose: "Comply with legal obligations", basis: "Legal obligation" },
  { purpose: "Send marketing (with consent)", basis: "Consent" },
  { purpose: "Maintain safety and security", basis: "Legitimate interest" }
];

const retentionPeriods = [
  { type: "Membership records", period: "Duration + 7 years" },
  { type: "Certification records", period: "10 years after expiry" },
  { type: "Financial records", period: "7 years (legal)" },
  { type: "Communications", period: "3 years" },
  { type: "Website analytics", period: "26 months" },
  { type: "Marketing consent", period: "Until withdrawn + 1 year" }
];

const userRights = [
  { right: "Access", description: "Request a copy of your personal data", icon: Eye },
  { right: "Rectification", description: "Correct inaccurate data", icon: FileText },
  { right: "Erasure", description: "Request deletion (\"right to be forgotten\")", icon: Database },
  { right: "Restriction", description: "Limit how we process your data", icon: Lock },
  { right: "Portability", description: "Receive your data in a portable format", icon: Globe },
  { right: "Objection", description: "Object to processing based on legitimate interests", icon: AlertCircle },
  { right: "Withdraw Consent", description: "Where processing is based on consent", icon: UserCheck }
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-green-500/10 via-background to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-green-500/50 text-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Privacy & Data Protection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Council Safety of Artificial Intelligence (CSOAI)
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Version 1.0</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Last Updated: January 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Section 1: Introduction */}
          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  1. Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Council Safety of Artificial Intelligence ("CSOAI," "we," "us," or "our") is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
                  (csoai.org), use our services, or interact with us.
                </p>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-2">Data Controller</h4>
                  <p className="text-sm text-muted-foreground">
                    Council Safety of Artificial Intelligence<br />
                    United Kingdom<br />
                    Email: <a href="mailto:privacy@csoai.org" className="text-primary hover:underline">privacy@csoai.org</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 2: Information We Collect */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  2. Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Information You Provide
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Account & Membership</p>
                        <ul className="text-sm text-muted-foreground">
                          <li>• Name and contact details</li>
                          <li>• Organization name and role</li>
                          <li>• Professional background</li>
                          <li>• Payment information</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Communications</p>
                        <ul className="text-sm text-muted-foreground">
                          <li>• Emails and messages</li>
                          <li>• Feedback and surveys</li>
                          <li>• Meeting notes</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Compliance Information</p>
                        <ul className="text-sm text-muted-foreground">
                          <li>• AI system documentation</li>
                          <li>• Assessment results</li>
                          <li>• Incident reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Collected Automatically
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Technical Data</p>
                        <ul className="text-sm text-muted-foreground">
                          <li>• IP address</li>
                          <li>• Browser type and version</li>
                          <li>• Device information</li>
                          <li>• Pages visited and time spent</li>
                          <li>• Referring website</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cookies</p>
                        <ul className="text-sm text-muted-foreground">
                          <li>• Essential (required for site)</li>
                          <li>• Analytics (with consent)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: How We Use Your Information */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  3. How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Purpose</th>
                        <th className="text-left py-3 px-4 font-semibold">Legal Basis (GDPR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataUsePurposes.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">{item.purpose}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{item.basis}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    We do NOT:
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li>• Sell your personal data</li>
                    <li>• Share data with third parties for their marketing</li>
                    <li>• Use automated decision-making without human review</li>
                    <li>• Process sensitive data without explicit consent</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 4: Data Sharing */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  4. Data Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">We may share your information with:</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Service Providers</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Cloud hosting (UK/EU)</li>
                      <li>• Payment processors</li>
                      <li>• Email services</li>
                      <li>• Analytics providers</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Legal Requirements</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Regulatory authorities</li>
                      <li>• Law enforcement</li>
                      <li>• Courts in proceedings</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">With Your Consent</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Public acknowledgment</li>
                      <li>• Case studies</li>
                      <li>• Testimonials</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
                    <Globe className="h-4 w-4" />
                    International Transfers
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    If data is transferred outside the UK/EU, we ensure appropriate safeguards:
                    Standard Contractual Clauses, Adequacy decisions, or Binding Corporate Rules.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 5: Data Retention */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  5. Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {retentionPeriods.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">{item.type}</span>
                      <Badge variant="secondary">{item.period}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  After retention periods, data is securely deleted or anonymized.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 6: Your Rights (GDPR) */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  6. Your Rights (GDPR)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {userRights.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold">{item.right}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <h4 className="font-semibold mb-2">How to Exercise Your Rights</h4>
                  <p className="text-muted-foreground mb-2">
                    Email: <a href="mailto:privacy@csoai.org" className="text-primary hover:underline">privacy@csoai.org</a>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We will respond within 30 days. We may request identification to verify your identity.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Right to Complain</h4>
                  <p className="text-sm text-muted-foreground">
                    You may lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong><br />
                    Website: ico.org.uk | Phone: 0303 123 1113
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 7: Security */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  7. Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">We protect your data through:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Encryption in transit (TLS/SSL)",
                    "Encryption at rest",
                    "Access controls",
                    "Regular security assessments",
                    "Staff training",
                    "Incident response procedures"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    Data Breach Notification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    In the event of a breach affecting your rights:
                    We will notify the ICO within 72 hours (where required) and notify you directly if high risk to your rights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 8: Cookies */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  8. Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-semibold mb-2 text-green-600">Essential Cookies</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Session management</li>
                      <li>• Security</li>
                    </ul>
                    <Badge className="mt-2" variant="secondary">No consent required</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold mb-2 text-blue-600">Analytics Cookies</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Usage patterns</li>
                      <li>• Site improvement</li>
                    </ul>
                    <Badge className="mt-2" variant="secondary">Consent required</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Marketing Cookies</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Not currently used</li>
                      <li>• Would require consent</li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  You can control cookies through our cookie consent banner, browser settings, or opt-out links.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 9-12: Additional Information */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">9. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our services are not directed to individuals under 18.
                    We do not knowingly collect data from children.
                    If we learn we have collected data from a child, we will delete it promptly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">10. Changes to This Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We may update this Privacy Policy periodically.
                    Material changes will be notified by email (for members) and website notice.
                    Continued use constitutes acceptance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section {...fadeInUp} transition={{ delay: 0.9 }}>
            <Card className="bg-gradient-to-br from-green-500/5 to-primary/10 border-green-500/20">
              <CardContent className="pt-6 text-center">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
                <p className="text-muted-foreground mb-4">
                  For privacy inquiries, contact our Data Protection Lead:
                </p>
                <div className="space-y-2">
                  <p className="font-medium">Nicholas Templeman</p>
                  <p className="text-muted-foreground">Council Safety of Artificial Intelligence</p>
                  <p>
                    <a href="mailto:privacy@csoai.org" className="text-primary hover:underline">
                      privacy@csoai.org
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Regional Information */}
          <motion.section {...fadeInUp} transition={{ delay: 1.0 }}>
            <Card>
              <CardHeader>
                <CardTitle>12. Additional Information for Specific Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">UK GDPR</h4>
                    <p className="text-sm text-muted-foreground">
                      This policy complies with UK GDPR (retained EU law).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">EU GDPR</h4>
                    <p className="text-sm text-muted-foreground">
                      For EU residents, your data controller is CSOAI, operating under UK adequacy arrangements.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">California (CCPA)</h4>
                    <p className="text-sm text-muted-foreground">
                      California residents have additional rights. Contact us for CCPA-specific disclosures.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>© 2026 Council Safety of Artificial Intelligence. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
