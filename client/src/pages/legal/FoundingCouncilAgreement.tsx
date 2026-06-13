import { motion } from "framer-motion";
import { Crown, Users, Vote, Gift, Clock, Shield, Scale, Briefcase, CheckCircle, Star, Globe, AlertTriangle } from "lucide-react";
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

const expertiseAreas = [
  "AI/ML Technical",
  "AI Safety Research",
  "Governance/Policy",
  "Legal/Regulatory",
  "Enterprise/Industry",
  "Healthcare AI",
  "Defense/Aerospace",
  "Financial Services",
  "Academia",
  "Civil Society"
];

const regions = [
  { name: "UK/Europe", icon: "🇬🇧" },
  { name: "North America", icon: "🇺🇸" },
  { name: "Asia-Pacific", icon: "🇯🇵" },
  { name: "Middle East/Africa", icon: "🇦🇪" },
  { name: "Latin America", icon: "🇧🇷" }
];

export default function FoundingCouncilAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-amber-500/10 via-background to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-amber-500/50 text-amber-600">
              <Crown className="h-3 w-3 mr-1" />
              Founding Council
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Founding Council Agreement
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

          {/* Section 1: Appointment */}
          <motion.section {...fadeInUp}>
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  1. Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This Agreement confirms the appointment of the undersigned as a <strong>Founding Council Member</strong> of the Council Safety of Artificial Intelligence (CSOAI).
                </p>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-center text-lg font-medium">
                    "Shaping the future of AI governance from the very beginning"
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 2: Founding Council Role */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  2. Founding Council Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Purpose</h4>
                  <p className="text-muted-foreground">
                    The Founding Council provides strategic guidance, expertise, and governance oversight during CSOAI's establishment phase and ongoing operations.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Composition</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <div className="text-3xl font-bold text-primary mb-1">50</div>
                      <p className="text-sm text-muted-foreground">Maximum Founding Members</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <div className="text-3xl font-bold text-primary mb-1">4+</div>
                      <p className="text-sm text-muted-foreground">Stakeholder Groups</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <div className="text-3xl font-bold text-primary mb-1">5</div>
                      <p className="text-sm text-muted-foreground">Global Regions</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Diverse Representation</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Industry", "Academia", "Policy", "Civil Society"].map((group) => (
                      <Badge key={group} variant="secondary">{group}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: Rights & Privileges */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  3. Rights & Privileges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Vote className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Voting Rights</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Vote on Charter amendments (Article 45)</li>
                        <li>• Vote on major governance decisions</li>
                        <li>• Elect Human Council representatives</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-amber-600" />
                        <h4 className="font-semibold">Permanent Recognition</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Listed as Founding Member in perpetuity</li>
                        <li>• Recognition on website and materials</li>
                        <li>• "CSOAI Founding Member" designation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">Fee Benefits</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Lifetime 50% discount on membership fees</li>
                        <li>• Free access to all training programs</li>
                        <li>• Priority access to new initiatives</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">Governance Access</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Direct input on Charter development</li>
                        <li>• Early review of policy proposals</li>
                        <li>• Access to Founding Council communications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 4: Responsibilities */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  4. Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Active Participation
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Attend minimum 50% of Founding Council meetings</li>
                      <li>• Respond to governance votes within timeframes</li>
                      <li>• Contribute expertise when requested</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Advocacy
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Support CSOAI's mission publicly where appropriate</li>
                      <li>• Represent CSOAI professionally</li>
                      <li>• Refer potential members and partners</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Confidentiality
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Protect confidential CSOAI information</li>
                      <li>• Not disclose deliberations without consent</li>
                      <li>• Maintain security of shared materials</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-500" />
                      Conflicts of Interest
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Disclose any conflicts promptly</li>
                      <li>• Recuse from decisions where conflicted</li>
                      <li>• Act in CSOAI's best interest</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 5: Time Commitment */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  5. Time Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary mb-1">4×</div>
                    <p className="text-sm text-muted-foreground">Quarterly meetings</p>
                    <p className="text-xs text-muted-foreground">(2 hours each)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary mb-1">1×</div>
                    <p className="text-sm text-muted-foreground">Annual planning</p>
                    <p className="text-xs text-muted-foreground">(half day)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary mb-1">Ad-hoc</div>
                    <p className="text-sm text-muted-foreground">Consultations</p>
                    <p className="text-xs text-muted-foreground">(as needed)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-1">15-25</div>
                    <p className="text-sm text-muted-foreground">Hours/year</p>
                    <p className="text-xs text-muted-foreground">(total estimate)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  This is a <strong>voluntary role</strong> with no compensation. Travel expenses for required in-person meetings covered by CSOAI when funds permit.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 6: Term */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  6. Term
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="font-semibold mb-2 text-green-600">Duration</h4>
                    <p className="text-sm text-muted-foreground">
                      Founding Council status is <strong>permanent (lifetime)</strong>. Active participation expected for first 3 years.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold mb-2 text-blue-600">Emeritus Status</h4>
                    <p className="text-sm text-muted-foreground">
                      After 3 years: Emeritus status available with reduced obligations, retained recognition.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-semibold mb-2 text-amber-600">Resignation</h4>
                    <p className="text-sm text-muted-foreground">
                      May resign anytime with written notice. Founding Member recognition retained unless revoked for cause.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Removal Conditions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    CSOAI may remove a Founding Council Member for: conduct bringing CSOAI into disrepute,
                    material breach of this Agreement, or failure to participate for 12+ consecutive months.
                    Removal requires 2/3 vote of remaining Founding Council.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 7-8: IP & Confidentiality */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    7. Intellectual Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Contributions</h4>
                    <p className="text-sm text-muted-foreground">
                      Any contributions to Charter, frameworks, or materials become property of CSOAI and will be attributed where appropriate.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Use of CSOAI IP</h4>
                    <p className="text-sm text-muted-foreground">
                      Founding Members may reference membership and use "CSOAI Founding Member" designation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    8. Confidentiality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Confidential information includes:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Founding Council deliberations</li>
                    <li>• Unpublished Charter drafts</li>
                    <li>• Member & financial information</li>
                    <li>• Strategic plans</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Period:</strong> 5 years after end of active membership
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Section 9-10: Liability & Governing Law */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  9-10. Liability & Governing Law
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-semibold mb-2 text-green-600">Good Faith Protection</h4>
                  <p className="text-sm text-muted-foreground">
                    Founding Council Members acting in good faith are indemnified by CSOAI against claims arising from their CSOAI role.
                    Excludes willful misconduct, gross negligence, breach of Agreement, or criminal acts.
                  </p>
                </div>
                <p className="text-muted-foreground text-center">
                  This Agreement is governed by the laws of <strong>England and Wales</strong>.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Expertise Areas */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Areas of Expertise We Seek
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {expertiseAreas.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Geographic Diversity</h4>
                  <div className="flex flex-wrap gap-3">
                    {regions.map((region) => (
                      <div key={region.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                        <span>{region.icon}</span>
                        <span className="text-sm">{region.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.section {...fadeInUp} transition={{ delay: 0.9 }}>
            <Card className="bg-gradient-to-br from-amber-500/10 to-primary/10 border-amber-500/20">
              <CardContent className="pt-6 text-center">
                <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Interested in Becoming a Founding Member?</h3>
                <p className="text-muted-foreground mb-6">
                  Join the first 50 leaders shaping the future of AI governance. Limited positions available.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/pricing">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                      <Crown className="h-4 w-4 mr-2" />
                      Apply to Founding Council
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
