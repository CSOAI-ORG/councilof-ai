import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Shield, Wrench, Ban, FileCheck } from "lucide-react";

export const ConstructionAddendum = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This Construction Equipment Rental Addendum applies when booking equipment through our platform.
          It supplements the Global Terms and Regional Addendum.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="hire-terms">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>1. Equipment Hire Terms</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hire Period</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Begins at delivery and ends at collection</li>
                    <li>Minimum hire period: 4 hours</li>
                    <li>Extension requests must be made 24 hours before end date</li>
                    <li>Subject to equipment availability</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Safe site access and egress</li>
                    <li>Suitable ground conditions and overhead clearance</li>
                    <li>Isolation of underground services</li>
                    <li>Proper signing, lighting, guarding of work area</li>
                    <li>Adequate insurance cover (Hired-in Plant)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="safety">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>2. Safety & Training Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customer warrants that all operators are competent and hold appropriate certifications.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Required Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">CPCS</Badge>
                    <Badge variant="outline">NPORS</Badge>
                    <Badge variant="outline">CSCS Card</Badge>
                    <Badge variant="outline">Valid License</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">We Provide</h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    <li>Familiarization briefing on delivery</li>
                    <li>Safety documentation</li>
                    <li>24/7 breakdown support</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="maintenance">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span>3. Maintenance & Breakdown</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong>Our Obligations:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Maintain equipment per manufacturer schedule</li>
                <li>24/7 breakdown support via app</li>
                <li>Replace within 4-24 hours if equipment fails</li>
                <li>Rental extension equivalent to downtime</li>
              </ul>
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Customer must NOT attempt repairs without authorization. Unauthorized repairs void warranty 
                  and may result in liability for further damage.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="damages">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>4. Damages & Insurance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Customer Liability Includes:</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Damage beyond normal wear and tear</li>
                  <li>Loss or theft (equipment value up to excess amount)</li>
                  <li>Cleaning fees if returned excessively dirty</li>
                  <li>Tyre damage from site conditions</li>
                  <li>Fuel costs if not returned full</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Insurance Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Certificate of Hired-in Plant Insurance required</li>
                  <li>Minimum £5M / $2M / €6.5M cover (varies by region)</li>
                  <li>Platform named as loss payee</li>
                  <li>Valid for entire hire period</li>
                </ul>
                <p className="mt-2 text-xs">
                  Without valid insurance, you must purchase our insurance waiver at checkout.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prohibited">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" />
              <span>5. Prohibited Uses</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Equipment may NOT be used for:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Underwater work (unless amphibious model)</li>
                  <li>Lifting persons (unless MEWP/certified man-basket)</li>
                  <li>Demolition of structures containing asbestos</li>
                  <li>Work beyond rated capacity</li>
                  <li>Illegal activities</li>
                  <li>Offshore or marine environments (without written consent)</li>
                </ul>
                <p className="mt-3 text-xs">
                  Violation of prohibited uses voids all warranties and insurance coverage.
                </p>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai-disclaimer">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <span>6. AI Recommendations Disclaimer</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">Important Notice About AI Recommendations</p>
                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                  <li>AI recommendations are for informational purposes only</li>
                  <li>Final equipment selection is Customer's responsibility</li>
                  <li>AI does not replace professional engineering advice</li>
                  <li>Customer must verify suitability for specific site conditions</li>
                  <li>We accept no liability for project outcomes based on AI suggestions</li>
                </ul>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
