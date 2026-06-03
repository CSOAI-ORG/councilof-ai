import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, CheckCircle, Calendar } from "lucide-react";
import complianceImage from "@/assets/compliance-docs.jpg";
import { PLATFORM_METRICS } from "@/config/platformMetrics";

export const VisualEnhancedComplianceSection = () => {
  const complianceFeatures = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Waste Transfer Notes",
      description: "Auto-generated WTNs with digital tracking and compliance validation"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Hazardous Consignment Notes",
      description: "Complete HCN management with regulatory compliance checking"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Live Compliance Checking",
      description: "Real-time regulatory compliance validation and risk assessment"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Digital Waste Tracking",
      description: "Fully prepared for upcoming DWT requirements and regulations"
    }
  ];

  const landfillRates = [
    { region: "England & Northern Ireland", standard: "£98.60", lower: "£3.10" },
    { region: "Scotland", standard: "£98.60", lower: "£3.10" },
    { region: "Wales", standard: "£98.60", lower: "£3.10" }
  ];

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Built for Global Waste Regulations
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Stay fully compliant with automated documentation, real-time regulatory updates, and comprehensive tracking systems.
          </p>
          
          {/* Compliance Visual Header */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <img 
              src={complianceImage} 
              alt="Global waste compliance documentation and certificates" 
              className="w-full h-64 object-cover rounded-xl shadow-elegant border border-border/50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-xl"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-foreground font-semibold text-lg">Professional compliance management built for {PLATFORM_METRICS.regulatoryFrameworks} regulatory frameworks</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {complianceFeatures.map((feature, index) => (
            <Card key={index} className="p-6 h-full hover:shadow-elegant transition-all duration-300 group">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-xl text-primary mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-elegant border border-border/50 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">2025/26 Landfill Tax Rates</h3>
            <Badge className="bg-accent/10 text-accent border-accent/20">
              Automatically Updated
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landfillRates.map((rate, index) => (
              <div key={index} className="text-center p-6 bg-background/50 rounded-lg border border-border/30">
                <h4 className="font-semibold text-foreground mb-4">{rate.region}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Standard Rate</span>
                    <div className="text-xl font-bold text-primary">{rate.standard}/tonne</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Lower Rate</span>
                    <div className="text-lg font-semibold text-accent">{rate.lower}/tonne</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Rates automatically update based on HMRC guidelines. Last updated: April 2025
          </p>
        </div>
      </div>
    </section>
  );
};
