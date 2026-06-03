import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Users, FileText, Map, Shield, BarChart3, Calendar, Camera } from "lucide-react";
import dashboardImage from "@/assets/dashboard-mockup.jpg";
import imageAnalysisImage from "@/assets/image-analysis.jpg";
import voiceInterfaceImage from "@/assets/voice-interface.jpg";

const Software = () => {
  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Fleet Management",
      description: "Complete vehicle tracking, maintenance scheduling, and driver management"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Portal",
      description: "Self-service portal for customers to track jobs and manage accounts"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Document Management",
      description: "Digital storage and management of all compliance documents"
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: "Route Optimization",
      description: "AI-powered route planning for maximum efficiency"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Compliance Tracking",
      description: "Automated compliance monitoring and reporting"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Reporting",
      description: "Comprehensive insights and customizable reports"
    }
  ];

  const modules = [
    {
      category: "Core Operations",
      items: [
        "Job Management & Scheduling",
        "Quote Generation & Pricing",
        "Customer Relationship Management",
        "Site Management & Access Notes",
        "Real-time Job Tracking"
      ]
    },
    {
      category: "Fleet & Drivers",
      items: [
        "Vehicle Management & Maintenance",
        "Driver Daily Checks",
        "Fleet Performance Analytics",
        "Maintenance Scheduling",
        "Vehicle Tracking & Monitoring"
      ]
    },
    {
      category: "Compliance & Documentation",
      items: [
        "Hazardous Consignment Notes",
        "Waste Transfer Notes",
        "Regulatory Compliance Tracking",
        "Document Storage & Retrieval",
        "Audit Trail Management"
      ]
    },
    {
      category: "Analytics & Intelligence",
      items: [
        "Business Intelligence Dashboard",
        "Performance Metrics",
        "Cost Analysis & Optimization",
        "Predictive Analytics",
        "Custom Reporting"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Complete Waste Management Software Suite
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Streamline your entire waste management operation with our comprehensive software platform, 
              designed specifically for the unique challenges of the waste and recycling industry.
            </p>
            
            {/* Software Demo Visual */}
            <div className="relative max-w-5xl mx-auto mb-12">
              <img 
                src={dashboardImage} 
                alt="MuckAway.ai Software Dashboard Interface" 
                className="w-full h-96 object-cover rounded-xl shadow-elegant border border-border/50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent rounded-xl"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-foreground font-semibold text-lg">Professional dashboard with real-time analytics and fleet management</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="mb-16">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="h-full group hover:shadow-elegant transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors duration-300">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
              
              {/* Advanced Features Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <Card className="relative overflow-hidden group">
                  <div className="relative h-48">
                    <img 
                      src={imageAnalysisImage} 
                      alt="Revolutionary Image Analysis" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  </div>
                  <CardHeader className="absolute bottom-0 left-0 right-0">
                    <CardTitle className="text-xl text-foreground">Revolutionary Image Analysis</CardTitle>
                    <CardDescription className="text-foreground/80">
                      Batch upload and analyze spoil photos with advanced AI computer vision
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card className="relative overflow-hidden group">
                  <div className="relative h-48">
                    <img 
                      src={voiceInterfaceImage} 
                      alt="Voice AI Assistant" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  </div>
                  <CardHeader className="absolute bottom-0 left-0 right-0">
                    <CardTitle className="text-xl text-foreground">Voice AI Assistant</CardTitle>
                    <CardDescription className="text-foreground/80">
                      Talk to AI for instant quotes and job booking with natural language processing
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-2xl">Why Choose MuckAway.ai?</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Industry Expertise</h3>
                    <p className="text-muted-foreground mb-4">
                      Built by waste management professionals who understand the complexities 
                      of the industry and regulatory requirements.
                    </p>
                    <h3 className="font-semibold mb-3">Scalable Solution</h3>
                    <p className="text-muted-foreground">
                      From small operations to large enterprises, our software scales 
                      with your business needs.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Cloud-Based</h3>
                    <p className="text-muted-foreground mb-4">
                      Access your data anywhere, anytime with our secure cloud infrastructure 
                      and mobile-responsive design.
                    </p>
                    <h3 className="font-semibold mb-3">Continuous Updates</h3>
                    <p className="text-muted-foreground">
                      Regular updates ensure compliance with changing regulations and 
                      access to the latest features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {modules.map((module, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-xl">{module.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {module.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Third-Party Integrations</CardTitle>
                    <CardDescription>Connect with your existing tools and systems</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Accounting Software</Badge>
                      <span className="text-sm text-muted-foreground">QuickBooks, Xero, Sage</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">GPS Tracking</Badge>
                      <span className="text-sm text-muted-foreground">Vehicle tracking systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Payment Processing</Badge>
                      <span className="text-sm text-muted-foreground">Stripe, PayPal, Direct Debit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Email & SMS</Badge>
                      <span className="text-sm text-muted-foreground">Automated notifications</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Access</CardTitle>
                    <CardDescription>Build custom integrations with our RESTful API</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Our comprehensive API allows you to integrate MuckAway.ai with your 
                      existing systems and build custom workflows.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        RESTful API with JSON responses
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Webhook support for real-time updates
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Comprehensive documentation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Rate limiting and security controls
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center bg-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Ready to Modernize Your Operations?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join hundreds of waste management companies who have transformed their operations with MuckAway.ai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                Start Free Trial
              </button>
              <button className="border border-border text-foreground px-6 py-3 rounded-lg hover:bg-muted transition-colors">
                Book a Demo
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Software;