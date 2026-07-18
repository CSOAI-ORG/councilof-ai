import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Shield, Calendar } from "lucide-react";

export const ComplianceSection = () => {
  const complianceFeatures = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Auto-Generated WTNs",
      description: "Waste Transfer Notes automatically created with all required fields, signatures, and 2-year retention"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Hazardous Consignment Notes",
      description: "Full Section A-E workflow for hazardous materials with unique consignment numbering"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Live Compliance Checking",
      description: "Real-time verification of waste carrier licenses and disposal site permits via EA API"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Digital Waste Tracking Ready",
      description: "Future-proof schema ready for DEFRA's mandatory Digital Waste Tracking (October 2026)"
    }
  ];

  return (
    <section id="compliance" className="py-20 bg-gradient-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Global Compliance Leader
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Built for Global Waste Regulations
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Complete compliance automation with live regulatory updates. From WTNs to hazardous consignment notes, 
            MuckAway.ai handles all the paperwork so you can focus on the job.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {complianceFeatures.map((feature, index) => (
            <Card key={index} className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader>
                <div className="text-primary mb-2">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-card rounded-lg p-8 border border-border shadow-card">
          <h3 className="text-2xl font-bold text-foreground mb-6">2025/26 Landfill Tax Rates</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">£126.15</div>
              <div className="text-muted-foreground">Standard Rate /tonne</div>
              <div className="text-sm text-muted-foreground mt-1">England, NI, Scotland</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">£4.05</div>
              <div className="text-muted-foreground">Lower Rate /tonne</div>
              <div className="text-sm text-muted-foreground mt-1">England & Northern Ireland</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">£6.30</div>
              <div className="text-muted-foreground">Lower Rate /tonne</div>
              <div className="text-sm text-muted-foreground mt-1">Wales</div>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Rates automatically updated across all quotes and invoices
          </div>
        </div>
      </div>
    </section>
  );
};