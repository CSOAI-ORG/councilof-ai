import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, Users, Globe, Shield, Leaf } from "lucide-react";
import { InternationalSEO } from "@/components/InternationalSEO";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Simplicity",
      description: "Complex compliance made simple. We believe technology should remove friction, not add it."
    },
    {
      icon: Shield,
      title: "Compliance First",
      description: "Every feature is built with regulatory requirements at its core. No shortcuts, no compromises."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Local expertise, global platform. We understand waste regulations across 50+ countries."
    },
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Helping the construction industry reduce waste and maximize material recycling and reuse."
    }
  ];

  const milestones = [
    { year: "2023", event: "MuckAway.ai founded with vision of AI-powered waste management" },
    { year: "2024", event: "Launched AI spoil classification with 95% accuracy" },
    { year: "2024", event: "Expanded to US, Australia, and Canada markets" },
    { year: "2025", event: "DWT (Digital Waste Tracking) integration live for UK" },
    { year: "2025", event: "Voice AI and advanced image analysis launched" },
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MuckAway.ai",
    "legalName": "MuckAway AI Ltd",
    "url": "https://muckaway.ai",
    "logo": "https://muckaway.ai/favicon.png",
    "description": "The UK's leading AI-powered muck away and spoil removal platform for construction and groundworks.",
    "foundingDate": "2023",
    "founders": [
      {
        "@type": "Person",
        "name": "MuckAway.ai Team"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressCountry": "GB"
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "minValue": 10,
      "maxValue": 50
    },
    "sameAs": [
      "https://www.linkedin.com/company/muckaway-ai",
      "https://twitter.com/muckawayai"
    ]
  };

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
        "name": "About Us",
        "item": "https://muckaway.ai/about"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        {/* Primary Meta Tags */}
        <title>About MuckAway.ai | AI Waste Management Innovation | Our Story</title>
        <meta name="title" content="About MuckAway.ai | AI Waste Management Innovation | Our Story" />
        <meta name="description" content="Learn about MuckAway.ai - the pioneering AI platform transforming muck away and spoil removal. Founded in 2023, we serve 500+ construction companies across 50+ countries with 95% AI classification accuracy." />
        <meta name="keywords" content="about muckaway, muck away company, waste management innovation, ai construction technology, spoil removal experts, uk waste management" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://muckaway.ai/about" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://muckaway.ai/about" />
        <meta property="og:title" content="About MuckAway.ai | AI Waste Management Innovation" />
        <meta property="og:description" content="Learn about MuckAway.ai - the pioneering AI platform transforming muck away and spoil removal. Founded in 2023, serving 500+ companies." />
        <meta property="og:image" content="https://muckaway.ai/og-image.png" />
        <meta property="og:site_name" content="MuckAway.ai" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About MuckAway.ai | AI Waste Management Innovation" />
        <meta name="twitter:description" content="Learn about MuckAway.ai - the pioneering AI platform transforming muck away and spoil removal." />
        <meta name="twitter:image" content="https://muckaway.ai/og-image.png" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <InternationalSEO path="/about" />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/10 text-primary">About Us</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Making Waste Management <span className="text-primary">Intelligent</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're building the future of construction waste management—where AI handles the complexity, 
              compliance is automatic, and operators can focus on what they do best.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-accent/10 text-accent">Our Mission</Badge>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Shift it Smart. Shift it Legal.
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  The construction industry moves millions of tonnes of spoil every day. Yet the process 
                  of classifying, pricing, and tracking waste remains paper-heavy, error-prone, and 
                  fragmented. Compliance failures cost the industry billions.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  MuckAway.ai changes this. Using advanced AI, we instantly classify materials, 
                  generate compliant documentation, and connect operators with disposal facilities—all 
                  through a single platform that works on any device, anywhere in the world.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {values.map((value, index) => (
                  <Card key={index} className="text-center hover:shadow-elegant transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary">Our Journey</Badge>
              <h2 className="text-3xl font-bold text-foreground">Building the Future</h2>
            </div>

            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 mb-8 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {milestone.year}
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-foreground pt-3">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent/10 text-accent">Our Team</Badge>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Built by Industry Experts
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Our team combines decades of experience in waste management, construction, 
              and enterprise software development.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                30+ Years Industry Experience
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Lightbulb className="h-4 w-4 mr-2" />
                AI & Machine Learning Experts
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                Multi-Region Compliance Specialists
              </Badge>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
