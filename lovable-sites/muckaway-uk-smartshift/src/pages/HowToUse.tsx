import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Settings, Truck, Calendar, FileCheck, BarChart3, PlayCircle, BookOpen, Phone } from "lucide-react";

const HowToUse = () => {
  const gettingStarted = [
    {
      step: 1,
      icon: <UserPlus className="h-6 w-6" />,
      title: "Create Your Account",
      description: "Sign up and choose your subscription plan",
      details: "Complete the registration process and verify your email address. Choose between our Starter, Professional, or Enterprise plans based on your business needs."
    },
    {
      step: 2,
      icon: <Settings className="h-6 w-6" />,
      title: "Set Up Your Profile",
      description: "Configure your company information and preferences",
      details: "Add your company details, waste carrier license information, and configure your operational settings including pricing structures and service areas."
    },
    {
      step: 3,
      icon: <Truck className="h-6 w-6" />,
      title: "Add Your Fleet",
      description: "Register your vehicles and drivers",
      details: "Input your vehicle information including registration numbers, capacity, and maintenance schedules. Add driver profiles with license details and contact information."
    },
    {
      step: 4,
      icon: <Calendar className="h-6 w-6" />,
      title: "Start Taking Jobs",
      description: "Begin processing customer requests and managing operations",
      details: "Use our job management system to handle customer inquiries, generate quotes, schedule collections, and track job progress from start to finish."
    }
  ];

  const quickGuides = [
    {
      title: "Creating a New Job",
      icon: <FileCheck className="h-5 w-5" />,
      steps: [
        "Navigate to the Jobs section in your dashboard",
        "Click 'New Job' and enter customer details",
        "Select spoil type and estimate volume using AI classification",
        "Generate quote automatically based on your pricing rules",
        "Send quote to customer and track approval status"
      ]
    },
    {
      title: "Managing Fleet Operations",
      icon: <Truck className="h-5 w-5" />,
      steps: [
        "Access Fleet Management from the main menu",
        "View real-time vehicle locations and status",
        "Schedule maintenance using our predictive alerts",
        "Monitor driver daily checks and compliance",
        "Track fuel consumption and operational costs"
      ]
    },
    {
      title: "Using AI Classification",
      icon: <BarChart3 className="h-5 w-5" />,
      steps: [
        "Upload photos of soil/waste materials",
        "Let our AI analyze and classify the materials",
        "Review classification results and confidence scores",
        "Adjust pricing based on AI recommendations",
        "Generate accurate quotes instantly"
      ]
    },
    {
      title: "Generating Reports",
      icon: <FileCheck className="h-5 w-5" />,
      steps: [
        "Go to Analytics & Reports section",
        "Choose from pre-built report templates",
        "Set date ranges and filter criteria",
        "Export reports in PDF or Excel format",
        "Schedule automated report delivery"
      ]
    }
  ];

  const videoTutorials = [
    {
      title: "Getting Started with MuckAway.ai",
      duration: "8:45",
      description: "Complete walkthrough of setting up your account and basic configuration"
    },
    {
      title: "Job Management Workflow",
      duration: "12:30", 
      description: "Learn how to process jobs from quote to completion"
    },
    {
      title: "Using AI Tools Effectively",
      duration: "6:15",
      description: "Maximize the benefits of our AI-powered features"
    },
    {
      title: "Fleet Management Best Practices",
      duration: "15:20",
      description: "Optimize your fleet operations and maintenance scheduling"
    }
  ];

  // Generate HowTo JSON-LD Schema for SEO/AEO - Getting Started Guide
  const howToSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Get Started with MuckAway.ai",
    "description": "Complete guide to setting up and using MuckAway.ai for AI-powered waste management and construction spoil removal.",
    "totalTime": "PT30M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "GBP",
      "value": "0"
    },
    "image": "https://muckaway.ai/og-image.png",
    "step": gettingStarted.map((item, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": item.title,
      "text": item.details,
      "itemListElement": {
        "@type": "HowToDirection",
        "text": item.details
      }
    }))
  }), []);

  // Generate individual HowTo schemas for each quick guide
  const quickGuideSchemas = useMemo(() => quickGuides.map(guide => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": guide.title,
    "step": guide.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    }))
  })), []);

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://muckaway.ai"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "How to Use",
        "item": "https://muckaway.ai/how-to-use"
      }
    ]
  };

  // VideoObject schema for video tutorials
  const videoSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": videoTutorials.map((video, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "VideoObject",
        "name": video.title,
        "description": video.description,
        "duration": `PT${video.duration.replace(':', 'M')}S`,
        "thumbnailUrl": "https://muckaway.ai/og-image.png",
        "uploadDate": "2024-01-01",
        "contentUrl": "https://muckaway.ai/tutorials"
      }
    }))
  }), []);

  return (
    <>
      <Helmet>
        <title>How to Use MuckAway.ai - Step-by-Step Guides & Tutorials</title>
        <meta name="description" content="Learn how to use MuckAway.ai with our comprehensive guides, video tutorials, and step-by-step instructions. From setup to advanced features, master AI-powered waste management." />
        <meta name="keywords" content="muckaway tutorial, waste management software guide, how to use waste transfer notes, AI waste classification tutorial, construction waste management guide" />
        <link rel="canonical" href="https://muckaway.ai/how-to-use" />
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(videoSchema)}
        </script>
        {quickGuideSchemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              How to Use MuckAway.ai
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get up and running quickly with our comprehensive guides, tutorials, and step-by-step instructions. 
              From setup to advanced features, we'll help you maximize your efficiency.
            </p>
          </div>

          <Tabs defaultValue="getting-started" className="mb-16">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="guides">Quick Guides</TabsTrigger>
              <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {gettingStarted.map((item, index) => (
                  <Card key={index} className="relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {item.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <CardDescription className="mt-1">{item.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle>Need Help Getting Started?</CardTitle>
                  <CardDescription>
                    Our onboarding team is here to help you every step of the way
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                      Schedule Onboarding Call
                    </button>
                    <button className="border border-border text-foreground px-6 py-3 rounded-lg hover:bg-muted transition-colors">
                      Live Chat Support
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guides" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {quickGuides.map((guide, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {guide.icon}
                        </div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2">
                        {guide.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {videoTutorials.map((video, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <PlayCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{video.title}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {video.duration}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-3">{video.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Video Library</CardTitle>
                  <CardDescription>
                    Access our complete collection of training videos and tutorials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse our extensive video library covering everything from basic setup to advanced features. 
                    New videos are added regularly based on user feedback and feature updates.
                  </p>
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                    Browse All Videos
                  </button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <CardTitle>Documentation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive documentation covering all features and functionality
                    </p>
                    <button className="w-full border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                      Browse Docs
                    </button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Phone className="h-6 w-6" />
                      </div>
                      <CardTitle>Live Support</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get immediate help from our expert support team
                    </p>
                    <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                      Start Chat
                    </button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Settings className="h-6 w-6" />
                      </div>
                      <CardTitle>Training Sessions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Book personalized training sessions for your team
                    </p>
                    <button className="w-full border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                      Book Training
                    </button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Support Hours & Contact</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">Business Hours</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Monday - Friday: 8:00 AM - 6:00 PM GMT</li>
                      <li>Saturday: 9:00 AM - 2:00 PM GMT</li>
                      <li>Sunday: Closed</li>
                      <li className="text-primary">Emergency support available 24/7</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Email: support@muckaway.ai</li>
                      <li>Phone: +44 (0) 800 123 4567</li>
                      <li>Emergency: +44 (0) 7700 900 123</li>
                      <li>Live Chat: Available in-app</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
};

export default HowToUse;