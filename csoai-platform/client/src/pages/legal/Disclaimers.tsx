import { motion } from "framer-motion";
import { AlertTriangle, Shield, Scale, FileText, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Disclaimers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Important Legal Notice
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Important Disclaimers
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Please read these disclaimers carefully before using CSOAI services
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

          {/* Critical Notice */}
          <Alert className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Important:</strong> These disclaimers are legally binding and form part of your agreement
              with CSOAI LTD. By using our services, you acknowledge and accept all disclaimers stated herein.
            </AlertDescription>
          </Alert>

          {/* Certification Does NOT Equal Compliance */}
          <motion.section {...fadeInUp}>
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  1. Certification Validity & Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-900 font-semibold text-lg">
                  CSOAI CERTIFICATION DOES NOT GUARANTEE REGULATORY COMPLIANCE
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Obtaining CSOAI certification (at any level) demonstrates that an individual or organization
                    has completed our training and passed our assessment process. However:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Certification is not a substitute for compliance.</strong> Organizations remain
                      fully responsible for ensuring their AI systems comply with all applicable laws and regulations,
                      including but not limited to the EU AI Act, NIST AI RMF, ISO 42001, and local laws.
                    </li>
                    <li>
                      <strong>Certification is a point-in-time assessment.</strong> It reflects the state of
                      knowledge and systems at the time of certification, not ongoing compliance.
                    </li>
                    <li>
                      <strong>Regulatory requirements change.</strong> Laws and regulations evolve. Certification
                      does not guarantee compliance with future regulatory changes.
                    </li>
                    <li>
                      <strong>Each organization is unique.</strong> Our training covers general frameworks, but
                      specific compliance requirements depend on your industry, jurisdiction, and AI use cases.
                    </li>
                    <li>
                      <strong>Organizations must conduct their own assessments.</strong> CSOAI certification
                      does not replace the need for independent legal review, risk assessment, or regulatory audits.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Not Legal Advice */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Scale className="h-5 w-5 text-blue-600" />
                  2. Not Legal Advice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-900 font-semibold text-lg">
                  CSOAI SERVICES DO NOT CONSTITUTE LEGAL ADVICE
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    CSOAI provides training, tools, and frameworks for AI safety and compliance. However:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Our services are <strong>educational and informational only</strong>. They do not constitute
                      legal advice, regulatory advice, or professional consultation.
                    </li>
                    <li>
                      We are <strong>not a law firm</strong> and do not practice law. Our staff are not licensed
                      attorneys and cannot provide legal opinions.
                    </li>
                    <li>
                      You should <strong>consult qualified legal counsel</strong> for advice specific to your
                      situation, jurisdiction, and compliance requirements.
                    </li>
                    <li>
                      <strong>No attorney-client relationship</strong> is created by your use of CSOAI services.
                    </li>
                    <li>
                      Reliance on CSOAI materials does not substitute for professional legal advice.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* AI-Generated Content */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Info className="h-5 w-5 text-purple-600" />
                  3. AI-Generated Content & Byzantine Council
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-purple-900 font-semibold text-lg">
                  CSOAI USES AI SYSTEMS THAT MAY PRODUCE ERRORS
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Our platform incorporates artificial intelligence, including our 33-Agent Byzantine Council.
                    Users should understand:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>AI systems can make mistakes.</strong> Despite our multi-agent consensus approach,
                      AI-generated assessments, recommendations, and content may contain errors, omissions, or
                      inaccuracies.
                    </li>
                    <li>
                      <strong>Byzantine fault tolerance has limits.</strong> Our 22/33 consensus threshold
                      reduces but does not eliminate the possibility of incorrect conclusions.
                    </li>
                    <li>
                      <strong>AI cannot replace human judgment.</strong> All AI-generated outputs should be
                      reviewed by qualified humans before taking action.
                    </li>
                    <li>
                      <strong>Training data limitations.</strong> AI models are trained on historical data and
                      may not reflect current regulations, best practices, or emerging risks.
                    </li>
                    <li>
                      <strong>No guarantee of accuracy.</strong> We do not warrant that AI-generated content
                      is complete, accurate, or suitable for any particular purpose.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Insurance Disclaimer */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  4. Insurance Coverage Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-emerald-900 font-semibold text-lg">
                  CSOAI'S INSURANCE DOES NOT COVER CLIENT ORGANIZATIONS
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    CSOAI LTD maintains professional indemnity insurance for its own operations. However:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Our insurance covers CSOAI LTD only.</strong> It does not extend to certified
                      individuals, member organizations, or their AI systems.
                    </li>
                    <li>
                      <strong>Organizations must maintain their own insurance.</strong> As specified in our
                      Membership and Licensing Agreements, organizations are required to maintain appropriate
                      insurance coverage based on their risk tier.
                    </li>
                    <li>
                      <strong>Certified analysts need their own coverage.</strong> Individual AI Safety Analysts
                      should consider professional indemnity insurance for their consulting activities.
                    </li>
                    <li>
                      <strong>No claims against CSOAI insurance.</strong> Third parties cannot make claims
                      against CSOAI's insurance policy for issues arising from certified organizations' AI systems.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Earnings Disclaimer */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <FileText className="h-5 w-5 text-orange-600" />
                  5. Earnings & Income Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-orange-900 font-semibold text-lg">
                  EARNINGS VARY AND ARE NOT GUARANTEED
                </p>
                <div className="space-y-3 text-gray-700">
                  <p>
                    CSOAI references typical earnings for AI Safety Analysts (e.g., $45-150/hour). Users should understand:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Earnings are not guaranteed.</strong> Income depends on individual effort, skill,
                      market demand, location, and other factors outside CSOAI's control.
                    </li>
                    <li>
                      <strong>Figures are illustrative only.</strong> Quoted hourly rates represent typical
                      market rates, not promises of specific income.
                    </li>
                    <li>
                      <strong>Results vary significantly.</strong> Some analysts may earn more or less than
                      quoted figures depending on their expertise, availability, and market conditions.
                    </li>
                    <li>
                      <strong>Certification does not guarantee employment.</strong> While we facilitate
                      connections between analysts and organizations, we do not guarantee job placement.
                    </li>
                    <li>
                      <strong>Market conditions change.</strong> Demand for AI Safety Analysts may fluctuate
                      based on regulatory changes, economic conditions, and technology evolution.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Limitation of Liability */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card className="border-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-gray-600" />
                  6. Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    CSOAI LTD shall not be liable for any indirect, incidental, special, consequential,
                    or punitive damages arising from your use of our services.
                  </li>
                  <li>
                    Organizations are solely responsible for the safety, compliance, and operation of
                    their AI systems, regardless of CSOAI certification status.
                  </li>
                  <li>
                    CSOAI's total liability for any claim shall not exceed the fees paid by you to
                    CSOAI in the twelve (12) months preceding the claim.
                  </li>
                  <li>
                    We are not liable for regulatory penalties, fines, or enforcement actions taken
                    against certified organizations.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Acknowledgment */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  Acknowledgment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  By using CSOAI services, you acknowledge that you have read, understood, and agree to
                  all disclaimers stated on this page. These disclaimers supplement and form part of our
                  Terms of Service.
                </p>
                <p className="text-gray-400 text-sm">
                  If you have questions about these disclaimers, please contact us at{" "}
                  <a href="mailto:legal@csoai.org" className="text-emerald-400 hover:underline">
                    legal@csoai.org
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
