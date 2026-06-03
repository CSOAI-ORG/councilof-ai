import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Cloud, 
  Zap,
  Download,
  Settings,
  Users,
  Truck,
  FileText,
  AlertTriangle,
  Layers
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Integration = () => {
  const { t } = useTranslation();

  const migrationSteps = [
    {
      step: 1,
      title: "Export Your Data",
      description: "Download your existing data from your current software in CSV or Excel format",
      icon: Download,
    },
    {
      step: 2,
      title: "Upload to MuckAway",
      description: "Use our secure upload tool to import your data directly",
      icon: Upload,
    },
    {
      step: 3,
      title: "Map Your Fields",
      description: "Our intelligent mapper will auto-detect fields - just verify and confirm",
      icon: Settings,
    },
    {
      step: 4,
      title: "Validate & Go Live",
      description: "Review the imported data and start using MuckAway immediately",
      icon: CheckCircle2,
    },
  ];

  const supportedSoftware = [
    { name: "Waste Logics", category: "Waste Management", supported: true },
    { name: "AMCS", category: "Fleet & Waste", supported: true },
    { name: "Teletrac Navman", category: "Fleet Tracking", supported: true },
    { name: "Webfleet", category: "Fleet Management", supported: true },
    { name: "BigChange", category: "Job Management", supported: true },
    { name: "Jobber", category: "Field Service", supported: true },
    { name: "ServiceM8", category: "Job Management", supported: true },
    { name: "Workiz", category: "Field Service", supported: true },
    { name: "Custom Excel/CSV", category: "Spreadsheets", supported: true },
    { name: "Other Software", category: "Custom Import", supported: true },
  ];

  const dataTypes = [
    { icon: Users, title: "Customer Records", description: "Contact details, addresses, billing info" },
    { icon: Truck, title: "Fleet Data", description: "Vehicles, drivers, maintenance history" },
    { icon: FileText, title: "Job History", description: "Past jobs, quotes, invoices" },
    { icon: Layers, title: "Material Types", description: "Waste classifications, EWC codes" },
    { icon: AlertTriangle, title: "Compliance Records", description: "Waste transfer notes, consignment notes" },
    { icon: Database, title: "Site Information", description: "Disposal sites, tipping facilities" },
  ];

  const apiFeatures = [
    {
      title: "RESTful API",
      description: "Full-featured REST API for programmatic access to all MuckAway features",
      badge: "Available",
    },
    {
      title: "Webhooks",
      description: "Real-time notifications for job updates, payments, and compliance events",
      badge: "Available",
    },
    {
      title: "Bulk Import API",
      description: "High-volume data import endpoint for enterprise migrations",
      badge: "Enterprise",
    },
    {
      title: "Third-Party Integrations",
      description: "Connect with accounting software, CRMs, and telematics providers",
      badge: "Coming Soon",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            Easy Migration
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Switch to MuckAway in Minutes
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Seamlessly migrate your existing data from any waste management or fleet software. 
            Our intelligent import tools make switching simple and risk-free.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Start Free Migration
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Download Template
            </Button>
          </div>
        </section>

        {/* Migration Steps */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            4 Simple Steps to Migrate
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {migrationSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="h-full border-border bg-card hover:border-primary/50 transition-colors">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <CardTitle className="text-foreground">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{step.description}</p>
                  </CardContent>
                </Card>
                {index < migrationSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-5 transform -translate-y-1/2 h-6 w-6 text-primary" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Supported Software */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Compatible With Your Current Software
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We support data import from all major waste management and fleet software platforms
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {supportedSoftware.map((software) => (
              <Card key={software.name} className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-foreground text-sm">{software.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{software.category}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Data Types */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            What Data Can You Import?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Import all your critical business data in one seamless migration
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {dataTypes.map((data) => (
              <Card key={data.title} className="border-border bg-card">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <data.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{data.title}</h3>
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* API Section */}
        <section className="mb-20">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <Cloud className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Developer API</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              For advanced integrations, use our comprehensive API to connect MuckAway with your existing systems
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {apiFeatures.map((feature) => (
                <Card key={feature.title} className="border-border bg-secondary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <Badge variant={feature.badge === "Available" ? "default" : "secondary"}>
                        {feature.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                API Documentation
              </Button>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Request API Access
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Make the Switch?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our migration specialists are here to help. Get a free consultation and we'll handle the entire process for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2">
              Schedule Free Consultation
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              Contact Support
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Integration;
