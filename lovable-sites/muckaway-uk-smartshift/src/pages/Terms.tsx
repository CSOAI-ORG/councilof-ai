import { useState } from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileText, Globe, Shield, Building2, Leaf, ChevronDown, Download, ExternalLink } from "lucide-react";
import { useGlobal } from "@/components/GlobalProvider";
import { 
  LEGAL_VERSIONS, 
  getLegalEntityForRegion, 
  formatLegalDate,
  REGIONAL_LEGAL_ENTITIES 
} from "@/config/legalConfig";
import { 
  GLOBAL_BASE_TERMS, 
  UK_ADDENDUM, 
  US_ADDENDUM, 
  EU_ADDENDUM, 
  WASTE_INDUSTRY_ADDENDUM 
} from "@/config/legalTerms";

const Terms = () => {
  const { region } = useGlobal();
  const [selectedRegion, setSelectedRegion] = useState(region?.country || 'UK');
  const legalEntity = getLegalEntityForRegion(selectedRegion);
  const version = LEGAL_VERSIONS.terms;

  const getRegionalAddendum = () => {
    switch (selectedRegion) {
      case 'US':
        return US_ADDENDUM;
      case 'IE':
      case 'DE':
      case 'FR':
      case 'ES':
      case 'IT':
        return EU_ADDENDUM;
      default:
        return UK_ADDENDUM;
    }
  };

  const regionalAddendum = getRegionalAddendum();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <FileText className="w-4 h-4 mr-2" />
              Legal Documentation
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-2">
              Version {version.version} • Last updated: {formatLegalDate(version.lastUpdated)}
            </p>
            <p className="text-sm text-muted-foreground">
              Effective: {formatLegalDate(version.effectiveDate)}
            </p>
          </div>

          {/* Region Selector */}
          <Card className="mb-8 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Your Legal Jurisdiction
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
                <p className="font-medium text-foreground">{legalEntity.name}</p>
                <p className="text-sm text-muted-foreground">{legalEntity.address}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Governing Law: {legalEntity.governingLaw}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Layer Terms */}
          <Tabs defaultValue="global" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2">
              <TabsTrigger value="global" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Global Terms</span>
                <span className="sm:hidden">Global</span>
              </TabsTrigger>
              <TabsTrigger value="regional" className="flex items-center gap-2 py-3">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{selectedRegion} Addendum</span>
                <span className="sm:hidden">{selectedRegion}</span>
              </TabsTrigger>
              <TabsTrigger value="industry" className="flex items-center gap-2 py-3">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">Waste Industry</span>
                <span className="sm:hidden">Industry</span>
              </TabsTrigger>
              <TabsTrigger value="entity" className="flex items-center gap-2 py-3">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Legal Entity</span>
                <span className="sm:hidden">Entity</span>
              </TabsTrigger>
            </TabsList>

            {/* Layer 1: Global Base Terms */}
            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Layer 1: Global Base Terms
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    These terms apply to all users worldwide
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {GLOBAL_BASE_TERMS.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-left">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-muted-foreground bg-transparent p-0">
                              {section.content}
                            </pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layer 2: Regional Addendum */}
            <TabsContent value="regional">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Layer 2: {selectedRegion} Regional Addendum
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Additional terms specific to your jurisdiction
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {regionalAddendum.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-left">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-muted-foreground bg-transparent p-0">
                              {section.content}
                            </pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layer 5: Industry Addendum */}
            <TabsContent value="industry">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    Layer 5: Waste Management Industry Addendum
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Terms specific to waste management services
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {WASTE_INDUSTRY_ADDENDUM.map((section) => (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger className="text-left">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-muted-foreground bg-transparent p-0">
                              {section.content}
                            </pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Legal Entity Details */}
            <TabsContent value="entity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Your Regional Legal Entity
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your agreement is with the following entity
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Legal Entity Name</p>
                      <p className="font-medium text-foreground">{legalEntity.name}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Registration Number</p>
                      <p className="font-medium text-foreground">{legalEntity.registrationNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Registered Address</p>
                      <p className="font-medium text-foreground">{legalEntity.address}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Governing Law</p>
                      <p className="font-medium text-foreground">{legalEntity.governingLaw}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Courts</p>
                      <p className="font-medium text-foreground">{legalEntity.courts}</p>
                    </div>
                    {legalEntity.vatNumber && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">VAT Number</p>
                        <p className="font-medium text-foreground">{legalEntity.vatNumber}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-medium text-foreground mb-4">Data Protection Officer</h4>
                    <div className="flex flex-col gap-2">
                      <a 
                        href={`mailto:${legalEntity.dpo.email}`}
                        className="text-primary hover:underline"
                      >
                        {legalEntity.dpo.email}
                      </a>
                      {legalEntity.dpo.phone && (
                        <a 
                          href={`tel:${legalEntity.dpo.phone}`}
                          className="text-primary hover:underline"
                        >
                          {legalEntity.dpo.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {legalEntity.regulatoryBody && (
                    <div className="border-t border-border pt-6">
                      <h4 className="font-medium text-foreground mb-4">Regulatory Body</h4>
                      <p className="text-muted-foreground">{legalEntity.regulatoryBody}</p>
                      {legalEntity.regulatoryUrl && (
                        <a 
                          href={legalEntity.regulatoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
                        >
                          Visit Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Acceptance Notice */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Electronic Acceptance</h4>
                  <p className="text-sm text-muted-foreground">
                    By using MuckAway.ai, you electronically sign and agree to these Terms of Service 
                    and all attached addendums applicable to your jurisdiction.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <div className="mt-8 text-center text-muted-foreground">
            <p className="mb-2">Questions about these Terms?</p>
            <a href="mailto:legal@muckaway.ai" className="text-primary hover:underline">
              legal@muckaway.ai
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
