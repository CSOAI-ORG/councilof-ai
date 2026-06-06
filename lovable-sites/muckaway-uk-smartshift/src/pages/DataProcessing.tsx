import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Database, Shield, Users, Globe, Lock, AlertTriangle, 
  CheckCircle2, Clock, FileText, ExternalLink 
} from "lucide-react";
import { useGlobal } from "@/components/GlobalProvider";
import { 
  LEGAL_VERSIONS, 
  formatLegalDate,
  DATA_RETENTION_SCHEDULE,
  SUB_PROCESSORS,
  getLegalEntityForRegion
} from "@/config/legalConfig";

const DataProcessing = () => {
  const { region } = useGlobal();
  const version = LEGAL_VERSIONS.dpa;
  const legalEntity = getLegalEntityForRegion(region?.country || 'UK');

  const processingActivities = [
    { 
      activity: 'Account Management',
      dataTypes: 'Name, email, phone, company',
      purpose: 'User authentication and account services',
      legalBasis: 'Contract',
      retention: 'Active + 7 years'
    },
    { 
      activity: 'Booking Processing',
      dataTypes: 'Address, waste details, payment info',
      purpose: 'Service delivery and payment',
      legalBasis: 'Contract',
      retention: '7 years'
    },
    { 
      activity: 'AI Classification',
      dataTypes: 'Images, descriptions, location',
      purpose: 'Waste classification and pricing',
      legalBasis: 'Contract',
      retention: '2 years'
    },
    { 
      activity: 'Analytics',
      dataTypes: 'Usage data, device info',
      purpose: 'Service improvement',
      legalBasis: 'Legitimate Interest / Consent',
      retention: '26 months'
    },
    { 
      activity: 'Compliance',
      dataTypes: 'Waste transfer notes, classifications',
      purpose: 'Regulatory compliance',
      legalBasis: 'Legal Obligation',
      retention: '7-10 years'
    },
    { 
      activity: 'Marketing',
      dataTypes: 'Email, preferences',
      purpose: 'Promotional communications',
      legalBasis: 'Consent',
      retention: 'Until withdrawn'
    },
  ];

  const securityMeasures = [
    { category: 'Encryption', measures: 'AES-256 at rest, TLS 1.3 in transit' },
    { category: 'Access Control', measures: 'Role-based access, principle of least privilege' },
    { category: 'Authentication', measures: 'MFA required, strong password policy' },
    { category: 'Monitoring', measures: '24/7 intrusion detection, anomaly alerts' },
    { category: 'Testing', measures: 'Annual penetration testing, regular vulnerability scans' },
    { category: 'Compliance', measures: 'SOC 2 Type II certification (pending)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Database className="w-4 h-4 mr-2" />
              GDPR/CCPA/PIPEDA Compliant
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Data Processing Agreement</h1>
            <p className="text-muted-foreground mb-2">
              Version {version.version} • Last updated: {formatLegalDate(version.lastUpdated)}
            </p>
            <p className="text-sm text-muted-foreground">
              This DPA applies to all users and forms part of our Terms of Service
            </p>
          </div>

          {/* Controller/Processor Roles */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Controller & Processor Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">When We Are Controller</h4>
                  <p className="text-sm text-muted-foreground">
                    We decide how to process data for our own purposes: analytics, 
                    security monitoring, fraud prevention, service improvement.
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">When We Are Processor</h4>
                  <p className="text-sm text-muted-foreground">
                    We process data on your behalf: your booking data, customer records, 
                    waste classifications you request.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Data Controller:</strong> {legalEntity.name}<br />
                  <strong>Contact:</strong> {legalEntity.dpo.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Activities */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Processing Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Data Types</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Legal Basis</TableHead>
                      <TableHead>Retention</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processingActivities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{activity.activity}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{activity.dataTypes}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{activity.purpose}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.legalBasis}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{activity.retention}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sub-Processors */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Authorized Sub-Processors
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                We engage the following sub-processors. All have DPAs in place.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Data Processed</TableHead>
                    <TableHead>DPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUB_PROCESSORS.map((processor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{processor.service}</TableCell>
                      <TableCell className="text-muted-foreground">{processor.purpose}</TableCell>
                      <TableCell className="text-muted-foreground">{processor.location}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{processor.dataProcessed}</TableCell>
                      <TableCell>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground mt-4">
                We will notify you 30 days before adding new sub-processors. 
                You may object to new sub-processors by contacting us.
              </p>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Technical & Organizational Security Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {securityMeasures.map((item, index) => (
                  <div key={index} className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-1">{item.category}</h4>
                    <p className="text-sm text-muted-foreground">{item.measures}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Data Retention Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DATA_RETENTION_SCHEDULE.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.dataType}</TableCell>
                      <TableCell className="text-muted-foreground">{item.retention}</TableCell>
                      <TableCell className="text-muted-foreground">{item.justification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Data may be transferred to and processed in countries outside your residence. 
                We ensure appropriate safeguards:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Standard Contractual Clauses (SCCs)</p>
                    <p className="text-sm text-muted-foreground">EU Commission approved clauses for all US transfers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">UK International Data Transfer Agreement</p>
                    <p className="text-sm text-muted-foreground">UK IDTA for post-Brexit compliance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Adequacy Decisions</p>
                    <p className="text-sm text-muted-foreground">Where available (e.g., EU-US Data Privacy Framework)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Breach */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Data Breach Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                In the event of a personal data breach, we will:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">72 hrs</Badge>
                  <p className="text-muted-foreground">
                    Notify relevant supervisory authority (if high risk) per GDPR Article 33
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">ASAP</Badge>
                  <p className="text-muted-foreground">
                    Notify affected individuals without undue delay if high risk to rights
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">Document</Badge>
                  <p className="text-muted-foreground">
                    Maintain breach register with facts, effects, and remedial actions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DPA Sections */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Full DPA Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="instructions">
                  <AccordionTrigger>Processing Instructions</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      We process personal data only on documented instructions from you, 
                      unless required by law. Our standard instructions include:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                      <li>Processing booking and payment data to deliver services</li>
                      <li>Processing AI classification requests you submit</li>
                      <li>Generating compliance documentation on your behalf</li>
                      <li>Sending service-related communications</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="personnel">
                  <AccordionTrigger>Personnel Obligations</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      We ensure all personnel processing personal data:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                      <li>Are bound by confidentiality obligations</li>
                      <li>Have received appropriate data protection training</li>
                      <li>Process data only as necessary for their role</li>
                      <li>Report any suspected breaches immediately</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="audit">
                  <AccordionTrigger>Audit Rights</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      We make available all information necessary to demonstrate 
                      compliance with this DPA and allow for audits:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                      <li>Annual compliance audit summaries available on request</li>
                      <li>SOC 2 Type II audit reports (when available)</li>
                      <li>On-site audits permitted with 30 days notice (reasonable frequency)</li>
                      <li>Audit costs borne by requesting party</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deletion">
                  <AccordionTrigger>Data Return & Deletion</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      Upon termination of our agreement:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                      <li>You may download your data within 30 days</li>
                      <li>We will delete your data unless legal retention applies</li>
                      <li>Anonymized aggregate data may be retained indefinitely</li>
                      <li>Certification of deletion available on request</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="assistance">
                  <AccordionTrigger>Data Subject Request Assistance</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      We assist you in responding to data subject requests:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                      <li>Access requests: Data export within 10 business days</li>
                      <li>Deletion requests: Processing within 10 business days</li>
                      <li>Rectification: Immediate update capability in dashboard</li>
                      <li>Portability: Machine-readable export (JSON/CSV)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Related Policies */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/privacy" className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">Full privacy details</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/cookie-policy" className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Cookie Policy</p>
                    <p className="text-sm text-muted-foreground">Tracking preferences</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/terms" className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">Full legal terms</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact */}
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Questions about data processing?</p>
            <a href={`mailto:${legalEntity.dpo.email}`} className="text-primary hover:underline">
              {legalEntity.dpo.email}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DataProcessing;
