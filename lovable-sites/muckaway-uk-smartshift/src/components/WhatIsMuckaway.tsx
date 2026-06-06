import { Building2, Truck, Factory, Globe, Shield, Zap } from "lucide-react";
import { useGlobal } from "@/components/GlobalProvider";
import { getComplianceForRegion } from "@/config/regionalCompliance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const audiences = [
  {
    icon: Building2,
    title: "Construction Companies",
    description: "Dispose of excavated spoil legally and efficiently. Get instant quotes, book collections, and receive compliant documentation automatically.",
    features: ["Instant AI quotes", "Automatic compliance", "Job tracking"],
  },
  {
    icon: Truck,
    title: "Waste Carriers",
    description: "Manage your fleet, track jobs, and generate all required documentation. From WTNs to hazardous consignment notes.",
    features: ["Fleet management", "Driver daily checks", "Digital paperwork"],
  },
  {
    icon: Factory,
    title: "Recycling Facilities",
    description: "Track incoming materials with AI classification. Verify material types, contamination levels, and compliance status.",
    features: ["Material verification", "Weighbridge OCR", "Audit trails"],
  },
];

export const WhatIsMuckaway = () => {
  const { region } = useGlobal();
  const compliance = getComplianceForRegion(region?.country || 'UK');

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            {compliance.flag} Built for {compliance.name}
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            What is MuckAway.ai?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The complete AI-powered platform for construction waste and spoil management. 
            From quote to disposal, we handle everything—legally, efficiently, and transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {audiences.map((audience, index) => (
            <Card key={index} className="group hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] border-border/50">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <audience.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{audience.title}</CardTitle>
                <CardDescription className="text-base">
                  {audience.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {audience.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="text-center p-6 bg-card rounded-xl border border-border/50">
            <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">50+</div>
            <div className="text-sm text-muted-foreground">Countries Supported</div>
          </div>
          <div className="text-center p-6 bg-card rounded-xl border border-border/50">
            <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">100%</div>
            <div className="text-sm text-muted-foreground">Compliance Rate</div>
          </div>
          <div className="text-center p-6 bg-card rounded-xl border border-border/50">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">30s</div>
            <div className="text-sm text-muted-foreground">Average Quote Time</div>
          </div>
          <div className="text-center p-6 bg-card rounded-xl border border-border/50">
            <Truck className="h-8 w-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-foreground mb-1">1M+</div>
            <div className="text-sm text-muted-foreground">Tonnes Processed</div>
          </div>
        </div>
      </div>
    </section>
  );
};
