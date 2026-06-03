import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, Scale, Leaf, ShieldAlert, Recycle } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

export const WasteAddendum = () => {
  const { region } = useGlobalSettings();
  const countryCode = region?.countryCode?.toUpperCase() || 'GB';

  const getWasteCarrierLicense = () => {
    if (countryCode === 'GB' || countryCode === 'UK') {
      return { authority: 'Environment Agency', license: 'CBDU123456', permit: 'Upper Tier Waste Carrier' };
    }
    if (countryCode === 'IE') {
      return { authority: 'NWCPO', license: 'IE123456', permit: 'Waste Collection Permit' };
    }
    if (countryCode === 'AU') {
      return { authority: 'EPA Victoria', license: '12345', permit: 'Transport License' };
    }
    if (countryCode === 'US') {
      return { authority: 'EPA / State DEQ', license: 'Various', permit: 'Solid Waste Transporter' };
    }
    // EU countries
    if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT'].includes(countryCode)) {
      return { authority: 'National Environment Agency', license: 'EU-123456', permit: 'Waste Transport Permit' };
    }
    return { authority: 'Environment Agency', license: 'CBDU123456', permit: 'Upper Tier Waste Carrier' };
  };

  const license = getWasteCarrierLicense();

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This Waste Management Addendum applies to all spoil removal, muckaway, and waste collection services 
          booked through MuckAway.ai. It supplements the Global Terms and Regional Addendum.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="waste-carrier">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>1. Waste Carrier Compliance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Our Licenses & Permits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authority:</span>
                    <Badge variant="outline">{license.authority}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number:</span>
                    <Badge>{license.license}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permit Type:</span>
                    <span>{license.permit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Customer Warranties</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>By booking waste collection, you warrant that:</p>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li>Waste description is accurate and complete</li>
                  <li>No hazardous or prohibited materials are included</li>
                  <li>Waste is correctly classified per regulations</li>
                </ul>
              </CardContent>
            </Card>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Prohibited Materials:</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="destructive">Asbestos</Badge>
                  <Badge variant="destructive">Clinical Waste</Badge>
                  <Badge variant="destructive">Fridges/Freezers</Badge>
                  <Badge variant="destructive">Tyres (commercial)</Badge>
                  <Badge variant="destructive">Liquid Waste {'>'}10L</Badge>
                  <Badge variant="destructive">Hazardous Chemicals</Badge>
                </div>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="duty-of-care">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>2. Duty of Care</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Under the Environmental Protection Act and equivalent regional legislation, 
                both producer and carrier have a duty of care for waste.
              </p>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">We Provide</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Waste Transfer Notes (WTN) for every collection</li>
                    <li>Digital WTN available in your dashboard</li>
                    <li>EWC code classification assistance</li>
                    <li>Compliant disposal at licensed facilities</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Your Obligations</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Store waste safely prior to collection</li>
                    <li>Prevent contamination</li>
                    <li>Sign WTN at collection (digital signature accepted)</li>
                    <li>Keep WTN records for minimum 2 years</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pricing">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span>3. Pricing & Weighbridge</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Flat Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Up to specified tonnes/m³ per load
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Weight-Based</h4>
                  <p className="text-sm text-muted-foreground">
                    Weighbridge ticket provided
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Time-Based</h4>
                  <p className="text-sm text-muted-foreground">
                    For wait-and-load services
                  </p>
                </CardContent>
              </Card>
            </div>
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Overweight Charges:</strong> If load exceeds booked capacity, additional charges apply 
                based on weighbridge reading. Weighbridge tickets available within 24 hours via app.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="environmental">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span>4. Environmental Liability</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Customer Liability for Misdescribed Waste</p>
                <p className="text-sm">
                  You are liable for all fines, clean-up costs, and remediation expenses if waste 
                  is misdescribed or contains prohibited materials.
                </p>
              </AlertDescription>
            </Alert>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">If Prohibited Waste Is Found</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Service will be immediately stopped</li>
                  <li>Waste quarantined at your cost</li>
                  <li>Report to regulator if legally required</li>
                  <li>Remediation costs charged to customer</li>
                </ol>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              <strong>Our Coverage:</strong> Pollution insurance £10M / $5M / €10M. 
              Customer must notify us immediately of any pollution incident.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sustainability">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-green-500" />
              <span>5. Landfill Diversion & Sustainability</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-medium">90%+ Landfill Diversion</h4>
                    <p className="text-sm text-muted-foreground">
                      We divert minimum 90% of waste from landfill through recycling and recovery
                    </p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  <li>Recycling certificates available quarterly</li>
                  <li>Sustainability reports for your ESG reporting</li>
                  <li>Carbon offset option available at checkout</li>
                  <li>CO₂ savings tracked per job</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="special-waste">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>6. Special Waste Streams</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">For contaminated soil, asbestos-containing waste, or other special wastes:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>Pre-acceptance audit required</li>
                  <li>Laboratory analysis may be needed</li>
                  <li>Higher rates apply</li>
                  <li>Extended processing times</li>
                  <li>Hazardous Waste Consignment Note may be required</li>
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Contact our compliance team before booking if you suspect your waste may be contaminated 
              or fall under special waste regulations.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
