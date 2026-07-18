import { motion } from "framer-motion";
import { Shield, Database, Lock, Globe, FileText, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function DataProcessingAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-500/10 via-background to-purple-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Data Processing Agreement
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              How CSOAI processes personal data in compliance with GDPR and global privacy regulations
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

          {/* Parties */}
          <motion.section {...fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  1. Parties to This Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>This Data Processing Agreement ("DPA") is entered into between:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-blue-900 mb-2">Data Controller</h4>
                      <p className="text-sm text-blue-800">
                        The organization or individual ("Customer") who has entered into a service agreement
                        with CSOAI for AI safety training, certification, or compliance services.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-emerald-900 mb-2">Data Processor</h4>
                      <p className="text-sm text-emerald-800">
                        <strong>CSOAI LTD</strong><br />
                        Companies House No: 16939677<br />
                        Registered in England & Wales
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Definitions */}
          <motion.section {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  2. Definitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  {[
                    { term: "Personal Data", def: "Any information relating to an identified or identifiable natural person ('data subject')" },
                    { term: "Processing", def: "Any operation performed on personal data, including collection, storage, use, disclosure, or deletion" },
                    { term: "Data Subject", def: "An identified or identifiable natural person whose personal data is processed" },
                    { term: "Sub-processor", def: "Any third party engaged by CSOAI to process personal data on behalf of the Customer" },
                    { term: "GDPR", def: "General Data Protection Regulation (EU) 2016/679" },
                    { term: "UK GDPR", def: "The GDPR as incorporated into UK law by the Data Protection Act 2018" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-900 min-w-32">{item.term}:</span>
                      <span className="text-gray-600">{item.def}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Data Processing Details */}
          <motion.section {...fadeInUp} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  3. Details of Data Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">3.1 Categories of Data Subjects</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600">
                    <li>Employees and contractors of Customer organizations</li>
                    <li>AI Safety Analyst certification candidates</li>
                    <li>Users of CSOAI training platform</li>
                    <li>Representatives of member organizations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3.2 Types of Personal Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600">
                    <li>Name, email address, job title</li>
                    <li>Organization affiliation</li>
                    <li>Training progress and certification status</li>
                    <li>Assessment scores and completion records</li>
                    <li>Payment information (processed via Stripe)</li>
                    <li>IP addresses and usage analytics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3.3 Purpose of Processing</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-600">
                    <li>Providing AI safety training and certification services</li>
                    <li>Managing user accounts and access</li>
                    <li>Processing payments and subscriptions</li>
                    <li>Issuing and verifying certifications</li>
                    <li>Sending service-related communications</li>
                    <li>Improving platform functionality</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">3.4 Duration of Processing</h4>
                  <p className="text-gray-600">
                    Personal data will be processed for the duration of the service agreement plus a retention
                    period of 7 years for certification records (as required for professional certification
                    integrity) and 3 years for other data, unless longer retention is required by law.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* CSOAI Obligations */}
          <motion.section {...fadeInUp} transition={{ delay: 0.3 }}>
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  4. CSOAI's Obligations as Data Processor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">CSOAI commits to:</p>
                <div className="grid gap-3">
                  {[
                    "Process personal data only on documented instructions from the Customer",
                    "Ensure persons authorized to process data are bound by confidentiality",
                    "Implement appropriate technical and organizational security measures",
                    "Assist the Customer in responding to data subject requests",
                    "Assist with data protection impact assessments when required",
                    "Delete or return all personal data upon termination of services",
                    "Make available all information necessary to demonstrate compliance",
                    "Allow for and contribute to audits conducted by the Customer",
                    "Notify the Customer of any data breach within 72 hours",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Sub-processors */}
          <motion.section {...fadeInUp} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  5. Sub-processors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  CSOAI uses the following sub-processors to deliver our services. By entering into this DPA,
                  the Customer provides general authorization for the use of these sub-processors:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Sub-processor</th>
                        <th className="text-left p-3 font-semibold">Purpose</th>
                        <th className="text-left p-3 font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Stripe, Inc.", purpose: "Payment processing", location: "USA (EU SCCs)" },
                        { name: "OpenAI", purpose: "AI council processing", location: "USA (EU SCCs)" },
                        { name: "Anthropic", purpose: "AI council processing", location: "USA (EU SCCs)" },
                        { name: "Google Cloud", purpose: "AI council processing", location: "EU/USA" },
                        { name: "Vercel", purpose: "Application hosting", location: "Global CDN" },
                        { name: "PostgreSQL (Neon)", purpose: "Database hosting", location: "EU" },
                      ].map((sp, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3 font-medium">{sp.name}</td>
                          <td className="p-3 text-gray-600">{sp.purpose}</td>
                          <td className="p-3 text-gray-600">{sp.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500">
                  CSOAI will notify Customers of any intended changes to sub-processors, allowing 30 days
                  to object. Where transfers occur outside the EEA, appropriate safeguards (Standard
                  Contractual Clauses) are in place.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Security Measures */}
          <motion.section {...fadeInUp} transition={{ delay: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  6. Technical and Organizational Security Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">CSOAI implements the following security measures:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Encryption", items: ["TLS 1.3 for data in transit", "AES-256 for data at rest", "End-to-end encryption for sensitive data"] },
                    { title: "Access Control", items: ["Role-based access control (RBAC)", "Multi-factor authentication", "Regular access reviews"] },
                    { title: "Infrastructure", items: ["SOC 2 Type II compliant hosting", "Regular security audits", "Automated vulnerability scanning"] },
                    { title: "Operations", items: ["24/7 monitoring and alerting", "Incident response procedures", "Regular backup and recovery testing"] },
                  ].map((section, i) => (
                    <Card key={i} className="bg-gray-50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{section.title}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {section.items.map((item, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Data Subject Rights */}
          <motion.section {...fadeInUp} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  7. Data Subject Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  CSOAI will assist Customers in fulfilling their obligations to respond to data subject
                  requests, including:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { right: "Right of Access", desc: "Obtain confirmation of processing and access to data" },
                    { right: "Right to Rectification", desc: "Correct inaccurate personal data" },
                    { right: "Right to Erasure", desc: "Request deletion of personal data" },
                    { right: "Right to Restriction", desc: "Limit processing of personal data" },
                    { right: "Right to Portability", desc: "Receive data in machine-readable format" },
                    { right: "Right to Object", desc: "Object to processing based on legitimate interests" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <h4 className="font-semibold text-purple-900">{item.right}</h4>
                      <p className="text-sm text-purple-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  To exercise any data subject rights, contact: <a href="mailto:privacy@csoai.org" className="text-emerald-600 hover:underline">privacy@csoai.org</a>
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Breach Notification */}
          <motion.section {...fadeInUp} transition={{ delay: 0.7 }}>
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  8. Data Breach Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  In the event of a personal data breach, CSOAI will:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">1.</span>
                    Notify the Customer without undue delay and in any event within <strong>72 hours</strong> of becoming aware
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">2.</span>
                    Provide the nature of the breach, categories and approximate number of data subjects affected
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">3.</span>
                    Describe the likely consequences of the breach
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">4.</span>
                    Describe measures taken or proposed to address the breach
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">5.</span>
                    Cooperate fully with the Customer's breach response and regulatory notification obligations
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Contact */}
          <motion.section {...fadeInUp} transition={{ delay: 0.8 }}>
            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>For questions about this DPA or data protection matters:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-emerald-400">Data Protection Contact</h4>
                    <p className="text-gray-300">privacy@csoai.org</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-400">Legal Inquiries</h4>
                    <p className="text-gray-300">legal@csoai.org</p>
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
