import { useState } from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, Globe, Database, Users, Clock, Lock, 
  FileText, ExternalLink, Download, Mail, CheckCircle2 
} from "lucide-react";
import { useGlobal } from "@/components/GlobalProvider";
import { 
  LEGAL_VERSIONS, 
  getLegalEntityForRegion, 
  formatLegalDate,
  DATA_RETENTION_SCHEDULE,
  SUB_PROCESSORS,
  REGIONAL_LEGAL_ENTITIES
} from "@/config/legalConfig";

const Privacy = () => {
  const { region } = useGlobal();
  const [selectedRegion, setSelectedRegion] = useState(region?.country || 'UK');
  const legalEntity = getLegalEntityForRegion(selectedRegion);
  const version = LEGAL_VERSIONS.privacy;

  const isEU = ['IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'PL'].includes(selectedRegion);
  const isUK = selectedRegion === 'UK' || selectedRegion === 'GB';
  const isUS = selectedRegion === 'US';
  const isCA = selectedRegion === 'CA';
  const isAU = selectedRegion === 'AU';

  const dataCollected = [
    { category: 'Contact Data', items: 'Name, email, phone, address, company', purpose: 'Account management, service delivery' },
    { category: 'Identity Data', items: 'User ID, login credentials, IP address', purpose: 'Authentication, security' },
    { category: 'Financial Data', items: 'Payment info (via Stripe - we don\'t store full card)', purpose: 'Payment processing' },
    { category: 'Transactional Data', items: 'Booking history, quotes, job records', purpose: 'Service delivery, compliance' },
    { category: 'Technical Data', items: 'Browser, device, location, usage patterns', purpose: 'Service improvement, analytics' },
    { category: 'AI Interaction Data', items: 'Images, voice inputs, chat history', purpose: 'AI-powered features, improvement' },
    { category: 'Compliance Data', items: 'Waste classifications, transfer notes', purpose: 'Regulatory compliance' },
  ];

  const yourRights = [
    { right: 'Access', description: 'Request a copy of your personal data', applies: ['GDPR', 'CCPA', 'PIPEDA', 'Privacy Act'] },
    { right: 'Rectification', description: 'Correct inaccurate personal data', applies: ['GDPR', 'CCPA', 'PIPEDA', 'Privacy Act'] },
    { right: 'Erasure', description: 'Request deletion of your data ("right to be forgotten")', applies: ['GDPR', 'CCPA'] },
    { right: 'Portability', description: 'Receive your data in machine-readable format', applies: ['GDPR', 'CCPA'] },
    { right: 'Object', description: 'Opt-out of certain data processing', applies: ['GDPR', 'CCPA', 'PIPEDA', 'Privacy Act'] },
    { right: 'Restrict', description: 'Limit how we process your data', applies: ['GDPR'] },
    { right: 'Withdraw Consent', description: 'Withdraw consent at any time', applies: ['GDPR', 'CCPA', 'PIPEDA', 'Privacy Act'] },
    { right: 'Non-Discrimination', description: 'Equal service regardless of privacy choices', applies: ['CCPA'] },
    { right: 'Opt-Out of Sale', description: 'Prevent sale of personal data (we don\'t sell)', applies: ['CCPA'] },
  ];

  const getApplicableRegulation = () => {
    if (isUK) return 'UK GDPR';
    if (isEU) return 'EU GDPR';
    if (isUS) return 'CCPA/CPRA';
    if (isCA) return 'PIPEDA';
    if (isAU) return 'Privacy Act 1988';
    return 'UK GDPR';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Shield className="w-4 h-4 mr-2" />
              Privacy & Data Protection
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-2">
              Version {version.version} • Last updated: {formatLegalDate(version.lastUpdated)}
            </p>
            <p className="text-sm text-primary font-medium">
              {getApplicableRegulation()} Compliant
            </p>
          </div>

          {/* Region Selector */}
          <Card className="mb-8 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Your Privacy Jurisdiction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(REGIONAL_LEGAL_ENTITIES).map((code) => (
                  <Button
                    key={code}
                    variant={selectedRegion === code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion(code)}
                    className={selectedRegion === code ? "bg-primary text-primary-foreground" : ""}
                  >
                    {code}
                  </Button>
                ))}
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="font-medium text-foreground">Data Controller: {legalEntity.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Data Protection Officer: {legalEntity.dpo.email}
                </p>
                {legalEntity.regulatoryBody && (
                  <p className="text-sm text-muted-foreground">
                    Regulatory Authority: {legalEntity.regulatoryBody}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-2">
              <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
              <TabsTrigger value="data" className="py-3">Data Collected</TabsTrigger>
              <TabsTrigger value="rights" className="py-3">Your Rights</TabsTrigger>
              <TabsTrigger value="sharing" className="py-3">Data Sharing</TabsTrigger>
              <TabsTrigger value="retention" className="py-3">Retention</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy at a Glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <Database className="h-8 w-8 text-primary mb-2" />
                      <h4 className="font-medium text-foreground">What We Collect</h4>
                      <p className="text-sm text-muted-foreground">
                        Contact info, usage data, AI interactions, and compliance documentation
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <Lock className="h-8 w-8 text-primary mb-2" />
                      <h4 className="font-medium text-foreground">How We Protect It</h4>
                      <p className="text-sm text-muted-foreground">
                        AES-256 encryption, MFA, SOC 2 compliance, regular security audits
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <Users className="h-8 w-8 text-primary mb-2" />
                      <h4 className="font-medium text-foreground">Who We Share With</h4>
                      <p className="text-sm text-muted-foreground">
                        Service providers under contract (Stripe, Supabase, etc.) - never sold
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <Clock className="h-8 w-8 text-primary mb-2" />
                      <h4 className="font-medium text-foreground">How Long We Keep It</h4>
                      <p className="text-sm text-muted-foreground">
                        7 years for legal compliance, then anonymized or deleted
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-medium text-foreground mb-4">Legal Basis for Processing ({getApplicableRegulation()})</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Contract Performance</p>
                          <p className="text-sm text-muted-foreground">Processing bookings, payments, service delivery</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Legitimate Interests</p>
                          <p className="text-sm text-muted-foreground">Fraud prevention, security, service improvement</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Consent</p>
                          <p className="text-sm text-muted-foreground">Marketing communications (opt-in only)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Legal Obligation</p>
                          <p className="text-sm text-muted-foreground">Tax records, waste transfer documentation, regulatory reporting</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Collected */}
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Personal Data We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Data Items</TableHead>
                        <TableHead>Purpose</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataCollected.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-muted-foreground">{item.items}</TableCell>
                          <TableCell className="text-muted-foreground">{item.purpose}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">We Do NOT Collect:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Biometric data (unless explicitly consented for app features)</li>
                      <li>• Racial or ethnic origin</li>
                      <li>• Political opinions or religious beliefs</li>
                      <li>• Health data (beyond safety incident reporting)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Your Rights */}
            <TabsContent value="rights">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Your Data Rights Under {getApplicableRegulation()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {yourRights.map((item, index) => {
                      const isApplicable = 
                        (isUK && item.applies.includes('GDPR')) ||
                        (isEU && item.applies.includes('GDPR')) ||
                        (isUS && item.applies.includes('CCPA')) ||
                        (isCA && item.applies.includes('PIPEDA')) ||
                        (isAU && item.applies.includes('Privacy Act'));

                      return (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border ${isApplicable ? 'border-primary/20 bg-secondary/50' : 'border-border/50 bg-muted/20 opacity-60'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-foreground flex items-center gap-2">
                                {item.right}
                                {isApplicable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              </h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Badge variant={isApplicable ? "default" : "secondary"} className="shrink-0">
                              {isApplicable ? 'Available' : 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">How to Exercise Your Rights</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      We respond to all valid requests within 30 days (GDPR) or 45 days (CCPA).
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild>
                        <a href={`mailto:${legalEntity.dpo.email}?subject=Data%20Subject%20Request`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email DPO
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/contact">
                          Submit Request Form
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Sharing */}
            <TabsContent value="sharing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Sub-Processors & Data Sharing
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    We share data only with trusted service providers under contract
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-medium text-foreground">
                      ✓ We do NOT sell your personal data
                    </p>
                    <p className="text-sm text-muted-foreground">
                      California residents: No "Do Not Sell" opt-out needed as we never sell data.
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>DPA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SUB_PROCESSORS.map((processor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{processor.service}</TableCell>
                          <TableCell className="text-muted-foreground">{processor.purpose}</TableCell>
                          <TableCell className="text-muted-foreground">{processor.location}</TableCell>
                          <TableCell>
                            {processor.dpaInPlace ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {(isUK || isEU) && (
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">International Transfers</h4>
                      <p className="text-sm text-muted-foreground">
                        For transfers outside the UK/EU, we use Standard Contractual Clauses (SCCs) 
                        as approved by the European Commission to ensure adequate protection.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Retention */}
            <TabsContent value="retention">
              <Card>
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

                  <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">After Retention Period</h4>
                    <p className="text-sm text-muted-foreground">
                      Data is either securely deleted or anonymized for aggregate analytics.
                      Anonymized data cannot be linked back to individuals.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Links to Related Policies */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/cookie-policy" className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Cookie Policy</p>
                    <p className="text-sm text-muted-foreground">Manage tracking preferences</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/data-processing" className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Data Processing</p>
                    <p className="text-sm text-muted-foreground">Full DPA details</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <a href="/terms" className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">Full legal terms</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Download & Contact */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Questions About Your Privacy?</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact our Data Protection Officer: {legalEntity.dpo.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button asChild size="sm">
                    <a href={`mailto:${legalEntity.dpo.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact DPO
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
