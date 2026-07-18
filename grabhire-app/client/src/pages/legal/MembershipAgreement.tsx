import { motion } from "framer-motion";
import { FileText, Users, Shield, CreditCard, Scale, Clock, AlertTriangle, Building2, CheckCircle } from "lucide-react";
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

const membershipTiers = [
  { tier: "Startup", revenue: "<£1M", fee: "Free (Year 1)", highlight: true },
  { tier: "SME", revenue: "£1M - £50M", fee: "£2,500" },
  { tier: "Enterprise", revenue: "£50M - £500M", fee: "£10,000" },
  { tier: "Large Enterprise", revenue: "£500M - £5B", fee: "£25,000" },
  { tier: "Global", revenue: ">£5B", fee: "£50,000" }
];

const incidentTimelines = [
  { severity: "Critical", time: "1 hour", color: "bg-red-500" },
  { severity: "High", time: "24 hours", color: "bg-orange-500" },
  { severity: "Medium", time: "7 days", color: "bg-yellow-500" },
  { severity: "Low", time: "30 days", color: "bg-green-500" }
];

export default function MembershipAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <FileText className="h-3 w-3 mr-1" />
              Legal Document
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Membership Agreement
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
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Section 1: Parties */}
          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  1. Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This Membership Agreement ("Agreement") is entered into between:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold mb-2">Council Safety of Artificial Intelligence ("CSOAI")</h4>
                    <p className="text-sm text-muted-foreground">United Kingdom</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">The Member</h4>
                    <p className="text-sm text-muted-foreground">As identified in the Membership Application</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 2: Membership Tiers */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  2. Membership Tiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Tier</th>
                        <th className="text-left py-3 px-4 font-semibold">Annual Revenue</th>
                        <th className="text-left py-3 px-4 font-semibold">Annual Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipTiers.map((tier, index) => (
                        <tr key={index} className={`border-b ${tier.highlight ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                          <td className="py-3 px-4 font-medium">{tier.tier}</td>
                          <td className="py-3 px-4 text-muted-foreground">{tier.revenue}</td>
                          <td className="py-3 px-4">
                            {tier.highlight ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {tier.fee}
                              </Badge>
                            ) : (
                              tier.fee
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Founding Member Benefits (First 50 Members)
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Lifetime 50% fee discount
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Founding Council voting rights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Charter input privileges
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Recognition in perpetuity
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: Member Obligations */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  3. Member Obligations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">3.1 The Member agrees to:</h4>
                  <ul className="space-y-2">
                    {[
                      "Comply with the CSOAI Partnership Charter (52 articles)",
                      "Submit to compliance assessments as required by risk tier",
                      "Maintain accurate records of AI systems under CSOAI governance",
                      "Pay membership fees when due",
                      "Participate in good faith in CSOAI governance processes"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Incident Reporting Timeframes:</h4>
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

                <div>
                  <h4 className="font-semibold mb-3">3.2 The Member shall NOT:</h4>
                  <ul className="space-y-2">
                    {[
                      "Misrepresent CSOAI certification or membership status",
                      "Use CSOAI branding without authorization",
                      "Engage in activities that bring CSOAI into disrepute",
                      "Share confidential CSOAI materials with non-members"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 4: CSOAI Obligations */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  4. CSOAI Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">CSOAI agrees to:</p>
                <ul className="space-y-2">
                  {[
                    "Provide access to compliance tools and frameworks",
                    "Conduct fair and transparent assessments",
                    "Maintain confidentiality of Member information",
                    "Provide reasonable notice of Charter amendments",
                    "Operate governance processes democratically",
                    "Maintain the Byzantine Council monitoring infrastructure"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 5: Licensing & Certification */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  5. Licensing & Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">5.1 License Grant</h4>
                  <p className="text-muted-foreground mb-3">
                    Upon successful compliance assessment, CSOAI grants Member a non-exclusive, non-transferable license to:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Display CSOAI certification marks",
                      "Reference CSOAI compliance status",
                      "Access CSOAI member resources"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">5.2 License Conditions</h4>
                  <p className="text-muted-foreground">
                    License remains valid subject to continued compliance with Charter, payment of fees, and satisfactory audit results.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    5.3 License Revocation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    CSOAI may revoke license for: material non-compliance, safety incidents with inadequate response,
                    non-payment (after 60-day cure period), or misuse of CSOAI certification marks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 6: Fees & Payment */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  6. Fees & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Payment Terms</h4>
                    <p className="text-sm text-muted-foreground">Annual fees due within 30 days of invoice</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Late Payment</h4>
                    <p className="text-sm text-muted-foreground">2% monthly interest applies</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Non-Payment</h4>
                    <p className="text-sm text-muted-foreground">Membership suspension after 90 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 7-8: Confidentiality & Liability */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    7. Confidentiality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Both parties agree to protect:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Assessment results (unless public disclosure required)</li>
                    <li>• Proprietary business information</li>
                    <li>• Technical architecture details</li>
                    <li>• Member lists (except publicly acknowledged)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    8. Liability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    CSOAI's total liability shall not exceed fees paid in the preceding 12 months.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Member indemnifies CSOAI against claims arising from Member's AI systems,
                    misrepresentation of CSOAI status, or breach of this Agreement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Section 9: Term & Termination */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  9. Term & Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Initial Term</h4>
                    <p className="text-sm text-muted-foreground">12 months, auto-renewal unless 60-day notice given</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Termination for Cause</h4>
                    <p className="text-sm text-muted-foreground">Material breach (uncured after 30 days), insolvency, illegal activity</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Effect of Termination</h4>
                    <p className="text-sm text-muted-foreground">License ceases immediately, remove CSOAI branding within 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 10: Dispute Resolution */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  10. Dispute Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <p className="text-sm font-medium">Good Faith Negotiation</p>
                    <p className="text-xs text-muted-foreground">30 days</p>
                  </div>
                  <div className="hidden md:block w-8 h-0.5 bg-primary/30" />
                  <div className="text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <p className="text-sm font-medium">Mediation</p>
                    <p className="text-xs text-muted-foreground">CEDR or equivalent</p>
                  </div>
                  <div className="hidden md:block w-8 h-0.5 bg-primary/30" />
                  <div className="text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <p className="text-sm font-medium">Arbitration</p>
                    <p className="text-xs text-muted-foreground">London, English law</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* General Provisions */}
          <motion.section {...fadeInUp} transition={{ delay: 0.9 }}>
            <Card>
              <CardHeader>
                <CardTitle>11. General Provisions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This Agreement, together with the CSOAI Partnership Charter, constitutes the entire agreement.
                  CSOAI may amend this Agreement with 90 days notice. Continued membership constitutes acceptance.
                </p>
                <p className="text-muted-foreground">
                  Member may not assign without CSOAI consent. Invalid provisions shall be severed without affecting remainder.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.section {...fadeInUp} transition={{ delay: 1.0 }}>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Ready to Join CSOAI?</h3>
                <p className="text-muted-foreground mb-6">
                  Become part of the global movement for responsible AI governance.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/pricing">
                    <Button size="lg">
                      View Membership Options
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
