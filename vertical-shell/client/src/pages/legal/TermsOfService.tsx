import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, Shield, Scale, Users, CreditCard, Globe, AlertTriangle, Gavel, Mail, BookOpen, Gift } from "lucide-react";
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

const prohibitedConduct = [
  "Violate any laws or regulations",
  "Infringe intellectual property rights",
  "Misrepresent your identity or affiliation",
  "Misrepresent CSOAI certification status",
  "Attempt to gain unauthorized access",
  "Interfere with platform operation",
  "Upload malicious code",
  "Harass, abuse, or harm others",
  "Use services for competitive intelligence",
  "Reverse engineer our systems"
];

const freeResources = [
  "Core training materials",
  "Charter documentation",
  "Compliance self-assessment tools",
  "Educational resources"
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
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
              Terms of Service
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

          {/* Section 1: Acceptance */}
          <motion.section {...fadeInUp}>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  1. Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By accessing or using the CSOAI website (csoai.org), platform, services, or resources,
                  you agree to be bound by these Terms of Service ("Terms").
                  <strong> If you do not agree, do not use our services.</strong>
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 2: About CSOAI */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  2. About CSOAI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Council Safety of Artificial Intelligence (CSOAI) is an independent, not-for-profit certification body
                  dedicated to AI safety governance.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Certification", desc: "AI safety certification and licensing" },
                    { title: "Frameworks", desc: "Compliance frameworks and tools" },
                    { title: "Training", desc: "Training and education resources" },
                    { title: "Infrastructure", desc: "Governance infrastructure for responsible AI" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="font-medium text-primary">
                    Mission: Prosperity, safety, and abundance for all through responsible AI governance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: Eligibility */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  3. Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">You must be:</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <div className="text-2xl font-bold text-primary mb-1">18+</div>
                    <p className="text-sm text-muted-foreground">Years old</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Scale className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Legally capable of entering contracts</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Acting on behalf of organization (for membership)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 4: Accounts */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  4. Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">4.1 Registration</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Provide accurate, complete information
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Maintain current contact details
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Keep login credentials secure
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">4.2 Account Security</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary mt-0.5" />
                        You are responsible for all activity under your account
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        Notify us immediately of unauthorized access
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary mt-0.5" />
                        We may suspend accounts for security reasons
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 5: Services */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  5. Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Certification Services</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Subject to Membership & Licensing Agreement</li>
                      <li>• Assessment results confidential</li>
                      <li>• May be revoked for non-compliance</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Training & Resources</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Free resources available to all</li>
                      <li>• Premium resources for members</li>
                      <li>• May not be redistributed</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Platform Access</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Access provided "as is"</li>
                      <li>• May modify or discontinue features</li>
                      <li>• Scheduled maintenance announced</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 6: Free Resources */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  6. Free Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">CSOAI provides free access to:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {freeResources.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold mb-2 text-blue-600">Why We Provide Free Resources</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Democratize AI safety knowledge</li>
                    <li>• Enable market adoption</li>
                    <li>• Support the mission of safe AI for all</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Free resources may NOT be:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sold or commercialized</li>
                    <li>• Modified and redistributed</li>
                    <li>• Attributed to others</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 7: User Conduct */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  7. User Conduct
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">You agree NOT to:</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {prohibitedConduct.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <h4 className="font-semibold mb-2 text-orange-600">Violations may result in:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Account suspension or termination</li>
                    <li>• Membership revocation</li>
                    <li>• Legal action</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 8: Intellectual Property */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  8. Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">8.1 CSOAI Ownership</h4>
                    <p className="text-sm text-muted-foreground mb-2">CSOAI owns or licenses:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• The CSOAI name and logo</li>
                      <li>• The 52-article Partnership Charter</li>
                      <li>• All frameworks, tools, methodologies</li>
                      <li>• Website content and design</li>
                      <li>• Training materials</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">8.2 Limited License</h4>
                    <p className="text-sm text-muted-foreground mb-2">We grant you a limited license to:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Access and use services for intended purposes</li>
                      <li>• Download resources for personal/organizational use</li>
                      <li>• Reference CSOAI materials with attribution</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-2 text-destructive">8.3 Restrictions - You may NOT:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Remove copyright notices
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Modify or create derivative works
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Use CSOAI marks without authorization
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Sublicense to third parties
                    </li>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 10-11: Disclaimers & Liability */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  10-11. Disclaimers & Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">10.1 "As Is" Provision</h4>
                  <p className="text-sm text-muted-foreground">
                    SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">No Guarantee</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Uninterrupted or error-free service</li>
                      <li>• That defects will be corrected</li>
                      <li>• Services free of viruses</li>
                      <li>• Specific outcomes from certification</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <h4 className="font-semibold mb-2 text-orange-600">Important Notices</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Resources are informational, not legal advice</li>
                      <li>• CSOAI certification supports but does not guarantee regulatory compliance</li>
                      <li>• Consult qualified professionals for specific situations</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-2 text-destructive">11.1 Limitation of Liability</h4>
                  <p className="text-sm text-muted-foreground">
                    CSOAI shall not be liable for indirect, incidental, special, or consequential damages;
                    loss of profits, data, or business opportunities;
                    damages exceeding fees paid in the preceding 12 months (or £100 for free users).
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 12-15: Indemnification, Termination, Changes, Governing Law */}
          <motion.section {...fadeInUp} transition={{ delay: 0.9 }}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    12. Indemnification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You agree to indemnify and hold harmless CSOAI from claims arising from:
                    your use of services, violation of these Terms, infringement of third-party rights,
                    or your AI systems/business activities.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <XCircle className="h-5 w-5 text-primary" />
                    13. Termination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>By You:</strong> Stop using services at any time.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>By CSOAI:</strong> For violation of Terms, suspected fraud,
                    extended inactivity, or at our discretion with reasonable notice.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    14. Changes to Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We may modify these Terms at any time. Changes are effective when posted.
                    Material changes notified via website banner or email.
                    Continued use constitutes acceptance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gavel className="h-5 w-5 text-primary" />
                    15. Governing Law
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These Terms are governed by the laws of England and Wales.
                    Disputes shall be resolved in the courts of England and Wales.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Section 16: Dispute Resolution */}
          <motion.section {...fadeInUp} transition={{ delay: 1.0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  16. Dispute Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <p className="text-sm font-medium">Informal Resolution</p>
                    <p className="text-xs text-muted-foreground">Contact us first</p>
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
                    <p className="text-sm font-medium">Courts</p>
                    <p className="text-xs text-muted-foreground">England and Wales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Contact Section */}
          <motion.section {...fadeInUp} transition={{ delay: 1.1 }}>
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/10 border-primary/20">
              <CardContent className="pt-6 text-center">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
                <p className="text-muted-foreground mb-4">
                  Council Safety of Artificial Intelligence
                </p>
                <div className="space-y-2">
                  <p>
                    Email: <a href="mailto:legal@csoai.org" className="text-primary hover:underline">legal@csoai.org</a>
                  </p>
                  <p>
                    Website: <a href="https://csoai.org" className="text-primary hover:underline">csoai.org</a>
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-6">
                  <Link href="/privacy-policy">
                    <Button variant="outline">
                      Privacy Policy
                    </Button>
                  </Link>
                  <Link href="/charter">
                    <Button>
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
