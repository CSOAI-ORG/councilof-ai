import { motion } from "framer-motion";
import { Shield, FileCheck, Layers, CreditCard, ClipboardCheck, AlertTriangle, Clock, Scale, Eye, Building2, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const licenseTiers = [
  {
    tier: "Tier 1",
    risk: "Minimal",
    examples: "Spam filters, basic recommendation",
    frequency: "Annual self-assessment",
    color: "bg-green-500",
    baseFee: "Included",
    perSystem: "£500"
  },
  {
    tier: "Tier 2",
    risk: "Limited",
    examples: "Customer service bots, content moderation",
    frequency: "Annual + random audits",
    color: "bg-blue-500",
    baseFee: "Included",
    perSystem: "£2,000"
  },
  {
    tier: "Tier 3",
    risk: "High",
    examples: "Healthcare AI, financial decisions, hiring",
    frequency: "Quarterly review",
    color: "bg-orange-500",
    baseFee: "Included",
    perSystem: "£10,000"
  },
  {
    tier: "Tier 4",
    risk: "Critical",
    examples: "Autonomous vehicles, infrastructure, weapons",
    frequency: "Continuous monitoring",
    color: "bg-red-500",
    baseFee: "Included",
    perSystem: "£25,000+"
  }
];

const insuranceRequirements = [
  { tier: "Tier 1", coverage: "Recommended only", color: "text-green-600" },
  { tier: "Tier 2", coverage: "£1M Professional Indemnity", color: "text-blue-600" },
  { tier: "Tier 3", coverage: "£5M Professional Indemnity + £5M Public Liability", color: "text-orange-600" },
  { tier: "Tier 4", coverage: "£10M+ (custom requirements)", color: "text-red-600" }
];

const incidentTimelines = [
  { severity: "Critical", time: "1 hour", color: "bg-red-500" },
  { severity: "High-risk", time: "24 hours", color: "bg-orange-500" },
  { severity: "Medium-risk", time: "7 days", color: "bg-yellow-500" },
  { severity: "Low-risk", time: "30 days", color: "bg-green-500" }
];

export default function LicensingAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <FileCheck className="h-3 w-3 mr-1" />
              Legal Document
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI Safety Licensing Agreement
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Council Safety of Artificial Intelligence (CSOAI)
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
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Section 2: Definitions */}
          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Key Definitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { term: "AI System", definition: "Any artificial intelligence system submitted for CSOAI licensing" },
                    { term: "License", definition: "Authorization to operate AI systems under CSOAI governance" },
                    { term: "License Tier", definition: "Classification based on AI system risk level (Articles 6-9 of Charter)" },
                    { term: "Byzantine Council", definition: "CSOAI's automated monitoring infrastructure" },
                    { term: "Charter", definition: "The CSOAI 52-article Partnership Charter" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted">
                      <p className="font-semibold text-sm">{item.term}</p>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: License Tiers */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  3. License Tiers (per Charter Articles 6-9)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Tier</th>
                        <th className="text-left py-3 px-4 font-semibold">Risk Level</th>
                        <th className="text-left py-3 px-4 font-semibold">Examples</th>
                        <th className="text-left py-3 px-4 font-semibold">Review Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenseTiers.map((tier, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                              <span className="font-medium">{tier.tier}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{tier.risk}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{tier.examples}</td>
                          <td className="py-3 px-4 text-sm">{tier.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  CSOAI determines tier based on submitted documentation. Licensee may appeal classification within 30 days.
                  Tier may be upgraded if risk profile changes.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 4: License Grant */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  4. License Grant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Upon successful assessment, CSOAI grants Licensee a non-exclusive, non-transferable license to:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Operate specified AI systems under CSOAI governance",
                    "Display CSOAI certification marks for licensed systems",
                    "Reference CSOAI compliance in marketing materials",
                    "Access CSOAI member resources and tools"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Scope</h4>
                  <p className="text-sm text-muted-foreground">
                    License covers only AI systems specifically assessed and approved, use cases disclosed in application,
                    and jurisdictions specified. New AI systems require separate licensing application.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 5: License Conditions */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  5. License Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Maintain Charter Compliance
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Adhere to all 52 articles of the CSOAI Charter</li>
                      <li>• Implement required safety measures for tier</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Submit to Monitoring
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Tier 3-4: Connect to Byzantine Council monitoring</li>
                      <li>• Tier 1-2: Provide access for random audits</li>
                      <li>• All tiers: Incident reporting as required</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Incident Reporting Timeframes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {incidentTimelines.map((item, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted text-center">
                        <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`} />
                        <p className="font-semibold text-sm">{item.severity}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    Documentation Requirements
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Maintain current AI system documentation</li>
                    <li>• Update CSOAI within 30 days of material changes</li>
                    <li>• Preserve audit trails per retention requirements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 6: Certification Marks */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  6. Certification Marks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Authorized Use
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• "CSOAI Certified" mark</li>
                      <li>• Tier-specific certification badge</li>
                      <li>• License number for verification</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Misuse Consequences
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Immediate license suspension</li>
                      <li>• Legal action for trademark infringement</li>
                      <li>• Public notice of misuse</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 7: Fees */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  7. Licensing Fees (Annual)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Tier</th>
                        <th className="text-left py-3 px-4 font-semibold">Base Fee</th>
                        <th className="text-left py-3 px-4 font-semibold">Per-System Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenseTiers.map((tier, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                              <span className="font-medium">{tier.tier}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{tier.baseFee}</td>
                          <td className="py-3 px-4 font-medium">{tier.perSystem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Initial Assessment</h4>
                    <p className="text-sm text-muted-foreground">Included in first year</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Re-assessment</h4>
                    <p className="text-sm text-muted-foreground">£2,500 (major changes)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Expedited</h4>
                    <p className="text-sm text-muted-foreground">+50% premium</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 8: Assessment Process */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  8. Assessment Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center py-6">
                  {[
                    { step: "1", title: "Application", desc: "Submit form & documentation" },
                    { step: "2", title: "Document Review", desc: "CSOAI reviews within 30 days" },
                    { step: "3", title: "Technical Assessment", desc: "Document-based or inspection" },
                    { step: "4", title: "Decision", desc: "Approve, defer, or reject" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="font-bold text-primary text-lg">{item.step}</span>
                        </div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      {index < 3 && <div className="hidden md:block w-8 h-0.5 bg-primary/30" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 9: Suspension & Revocation */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  9. Suspension & Revocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <h4 className="font-semibold mb-3 text-orange-600">Suspension (Temporary)</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Non-payment (after 60-day cure period)</li>
                      <li>• Safety incident under investigation</li>
                      <li>• Material non-compliance discovered</li>
                      <li>• Failure to remediate within timeframes</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold mb-3 text-destructive">Revocation (Permanent)</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Persistent non-compliance</li>
                      <li>• Serious safety incident with inadequate response</li>
                      <li>• Fraud or misrepresentation</li>
                      <li>• Misuse of certification marks</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reapplication may be permitted after 12 months
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Appeals Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Appeal within 30 days of decision. Heard by independent Appeals Panel. Decision is final.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 12: Insurance Requirements */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  12. Insurance Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insuranceRequirements.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="font-medium">{item.tier}</span>
                      <span className={`text-sm ${item.color}`}>{item.coverage}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 13-15: Term, Termination, Governing Law */}
          <motion.section {...fadeInUp} transition={{ delay: 0.9 }}>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    13. Term & Renewal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Initial term: 12 months</li>
                    <li>• Renewal: Annual, subject to compliance</li>
                    <li>• 60 days notice for non-renewal</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <XCircle className="h-5 w-5 text-primary" />
                    14. Termination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• By Licensee: 60 days notice</li>
                    <li>• By CSOAI: Immediate for breach</li>
                    <li>• Remove branding within 30 days</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    15. Governing Law
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Governed by laws of England and Wales. Disputes resolved through mediation, then arbitration in London.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Call to Action */}
          <motion.section {...fadeInUp} transition={{ delay: 1.0 }}>
            <Card className="bg-gradient-to-br from-primary/5 to-blue-500/10 border-primary/20">
              <CardContent className="pt-6 text-center">
                <FileCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Ready to License Your AI Systems?</h3>
                <p className="text-muted-foreground mb-6">
                  Get your AI systems certified and demonstrate your commitment to safety.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/certification">
                    <Button size="lg">
                      Start Certification
                    </Button>
                  </Link>
                  <Link href="/charter">
                    <Button variant="outline" size="lg">
                      Read the Charter
                    </Button>
                  </Link>
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
