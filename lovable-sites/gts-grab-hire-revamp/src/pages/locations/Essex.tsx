import React from "react";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/Badge";
import { 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  Truck,
  Factory,
  Ship,
  Zap,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const Essex = () => {
  const services = [
    "Industrial Waste Management",
    "Port & Marine Clearance", 
    "Agricultural Waste Removal",
    "Manufacturing Support",
    "Contaminated Land Services",
    "New Town Developments",
    "Logistics Hub Support",
    "Emergency Response Services"
  ];

  const areas = [
    { town: "Chelmsford", postcode: "CM1-CM3", responseTime: "35 mins", industry: "Commercial" },
    { town: "Basildon", postcode: "SS13-SS16", responseTime: "30 mins", industry: "Industrial" },
    { town: "Southend", postcode: "SS0-SS9", responseTime: "40 mins", industry: "Tourism" },
    { town: "Colchester", postcode: "CO1-CO7", responseTime: "45 mins", industry: "Historic" },
    { town: "Harlow", postcode: "CM17-CM20", responseTime: "40 mins", industry: "New Town" },
    { town: "Brentwood", postcode: "CM13-CM15", responseTime: "25 mins", industry: "Residential" },
    { town: "Thurrock", postcode: "RM16-RM20", responseTime: "20 mins", industry: "Logistics" },
    { town: "Grays", postcode: "RM17-RM20", responseTime: "25 mins", industry: "Industrial" }
  ];

  const essexSpecialties = [
    {
      title: "Industrial Manufacturing",
      description: "Specialized handling of manufacturing waste, including metals, chemicals, and production byproducts.",
      icon: Factory
    },
    {
      title: "Port & Maritime",
      description: "Marine industry support including port clearances, shipyard waste, and coastal development projects.",
      icon: Ship
    },
    {
      title: "New Town Development",
      description: "Large-scale residential and commercial development support for Essex's expanding new towns.",
      icon: Users
    },
    {
      title: "Logistics & Distribution",
      description: "Waste management for Essex's major distribution centers and logistics hubs along the M25 corridor.",
      icon: Truck
    }
  ];

  const majorClients = [
    {
      sector: "Manufacturing",
      description: "Supporting Essex's manufacturing sector with reliable industrial waste collection and site clearances.",
      locations: "Basildon, Chelmsford, Harlow"
    },
    {
      sector: "Logistics",
      description: "Waste management for major distribution centers serving London and the South East.",
      locations: "Thurrock, Grays, Basildon"
    },
    {
      sector: "Construction",
      description: "New housing developments and commercial construction across Essex's growth areas.",
      locations: "Brentwood, Chelmsford, Colchester"
    },
    {
      sector: "Agriculture",
      description: "Rural clearances, farm waste management, and agricultural development projects.",
      locations: "Rural Essex, Colchester, Chelmsford"
    }
  ];

  const essexProjects = [
    {
      title: "Thurrock Logistics Park Development",
      size: "200-acre site clearance",
      duration: "8 months",
      challenge: "Multi-phase development with active operations"
    },
    {
      title: "Chelmsford City Centre Regeneration",
      size: "Mixed-use development",
      duration: "12 months", 
      challenge: "Heritage considerations and city center access"
    },
    {
      title: "Basildon Industrial Estate Expansion",
      size: "50-unit manufacturing complex",
      duration: "6 months",
      challenge: "Contaminated land remediation required"
    }
  ];

  return (
    <>
      <SEOHead
        title="Grab Hire Essex | Industrial Waste Removal Services | GTS Grab Hire"
        description="Professional grab hire services across Essex. Chelmsford, Basildon, Thurrock coverage. Industrial specialists, port clearance, manufacturing support. Licensed carrier."
        keywords="grab hire Essex, waste removal Essex, grab lorry Essex, industrial waste Essex, Chelmsford grab hire, Basildon waste removal, Thurrock grab lorry, Essex waste management"
        canonical="https://gtsgrabhire.com/locations/essex"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-4">
              <Badge>Essex Coverage</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
              Essex Industrial Waste Specialists
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-center">
              Professional waste management across Essex. Specialists in industrial clearance, port operations, and manufacturing support from Thurrock to Colchester.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Get Essex Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Essex Specializations */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Essex Industry Expertise</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Specialized services for Essex's diverse industrial landscape, from manufacturing to maritime operations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {essexSpecialties.map((specialty, index) => {
                const IconComponent = specialty.icon;
                return (
                  <Card key={index} className="text-center h-full">
                    <CardHeader>
                      <div className="service-icon mx-auto mb-4">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-lg">{specialty.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{specialty.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coverage Areas */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Essex Coverage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Strategic coverage across Essex's key industrial and commercial centers with rapid response capabilities.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {areas.map((area, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{area.town}</CardTitle>
                      <Badge variant="navy" className="text-xs">{area.industry}</Badge>
                    </div>
                    <CardDescription>{area.postcode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {area.responseTime}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Sectors */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Major Industry Sectors</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Supporting Essex's key industries with specialized waste management and clearance services.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {majorClients.map((client, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Factory className="h-5 w-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                      {client.sector}
                    </CardTitle>
                    <CardDescription>{client.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-[hsl(var(--gts-navy))] mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{client.locations}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Major Projects */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Essex Project Highlights</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Major clearance and waste management projects delivered across Essex's industrial heartland.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {essexProjects.map((project, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Project Size:</span>
                      <span className="font-medium">{project.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{project.duration}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Challenge:</span>
                      <span className="text-sm">{project.challenge}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Essex Advantages */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Essex Industrial Authority</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Deep understanding of Essex's industrial and commercial landscape. From Thurrock's logistics hubs to Chelmsford's tech sector, we know Essex business.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Factory className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Manufacturing Expertise</h3>
                      <p className="text-muted-foreground">Specialized handling of industrial waste, chemical disposal protocols, and manufacturing byproducts.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Ship className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Port Operations</h3>
                      <p className="text-muted-foreground">Marine industry support including dredging waste, shipyard clearances, and coastal projects.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Zap className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Emergency Response</h3>
                      <p className="text-muted-foreground">24/7 emergency services for industrial incidents, contamination events, and urgent clearances.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-6">Essex Service Statistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">300+</div>
                    <div className="text-sm text-muted-foreground">Industrial Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">&lt;35min</div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Emergency Cover</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">Licensed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Available */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Essex Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive industrial and commercial waste management services for Essex businesses.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--gts-yellow))] mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-gradient text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Essex Industrial Partner
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Industrial project in Essex? We have the expertise and equipment for manufacturing, logistics, and marine industry support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Industrial Hotline: 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Essex Project Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Essex;