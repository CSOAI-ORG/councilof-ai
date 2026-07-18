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
  Users,
  Award,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const Kent = () => {
  const services = [
    "Grab Hire Services",
    "Muck Away & Soil Removal", 
    "Construction Waste Removal",
    "Garden Waste Clearance",
    "Commercial Waste Collection",
    "Emergency Waste Services",
    "Aggregate Supply",
    "Utilities & Infrastructure Support"
  ];

  const areas = [
    { town: "Maidstone", postcode: "ME14-ME17", responseTime: "30 mins" },
    { town: "Canterbury", postcode: "CT1-CT4", responseTime: "45 mins" },
    { town: "Dartford", postcode: "DA1-DA4", responseTime: "25 mins" },
    { town: "Gravesend", postcode: "DA11-DA13", responseTime: "30 mins" },
    { town: "Tonbridge", postcode: "TN9-TN12", responseTime: "40 mins" },
    { town: "Sevenoaks", postcode: "TN13-TN15", responseTime: "35 mins" },
    { town: "Ashford", postcode: "TN23-TN27", responseTime: "50 mins" },
    { town: "Folkestone", postcode: "CT18-CT21", responseTime: "60 mins" },
    { town: "Dover", postcode: "CT14-CT17", responseTime: "65 mins" },
    { town: "Margate", postcode: "CT9-CT12", responseTime: "70 mins" }
  ];

  const caseStudies = [
    {
      title: "Canterbury Cathedral Restoration",
      description: "Specialist heritage site waste removal during cathedral restoration works.",
      wasteType: "Heritage Construction Waste",
      duration: "6 months"
    },
    {
      title: "M25 Junction Upgrade",
      description: "Emergency muck away services for Highways England infrastructure project.",
      wasteType: "Contaminated Soil & Debris",
      duration: "3 weeks"
    },
    {
      title: "Maidstone Housing Development",
      description: "Complete site clearance for 200-home development project.",
      wasteType: "Mixed Construction Waste",
      duration: "4 months"
    }
  ];

  const landmarks = [
    "Canterbury Cathedral",
    "Dover Castle", 
    "Leeds Castle",
    "Chatham Historic Dockyard",
    "Bluewater Shopping Centre",
    "Brands Hatch Circuit",
    "Royal Tunbridge Wells",
    "Whitstable Harbour"
  ];

  return (
    <>
      <SEOHead
        title="Grab Hire Kent | Professional Waste Removal Services | GTS Grab Hire"
        description="Professional grab hire services across Kent. Maidstone, Canterbury, Dartford coverage. Same-day service, licensed waste carrier. Get instant quote for Kent projects."
        keywords="grab hire Kent, waste removal Kent, grab lorry Kent, muck away Kent, construction waste Kent, Maidstone grab hire, Canterbury waste removal, Dartford grab lorry"
        canonical="https://gtsgrabhire.com/locations/kent"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-4">
              <Badge>Kent Coverage</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
              Grab Hire Services Across Kent
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-center">
              Professional waste removal and grab hire services throughout Kent. From Canterbury to Dartford, we provide rapid response across the Garden of England.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Get Free Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Coverage Areas */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Kent Coverage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Serving all major towns and cities across Kent with rapid response times and professional service.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {areas.map((area, index) => (
                <Card key={index} className="text-center">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-5 w-5 text-[hsl(var(--gts-yellow))]" />
                    </div>
                    <CardTitle className="text-lg">{area.town}</CardTitle>
                    <CardDescription className="text-sm">{area.postcode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {area.responseTime}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Services Available */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Services Available in Kent</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive waste management and grab hire services tailored for Kent's construction, commercial, and residential sectors.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--gts-yellow))] mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kent Highlights */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Kent Chooses GTS Grab Hire</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Award className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">35+ Years Local Experience</h3>
                      <p className="text-muted-foreground">Deep understanding of Kent's construction landscape, from historic Canterbury projects to modern Maidstone developments.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Zap className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Same-Day Response</h3>
                      <p className="text-muted-foreground">Emergency services available across Kent with our strategically positioned fleet for rapid deployment.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Family-Run Business</h3>
                      <p className="text-muted-foreground">Personal service and long-term relationships with Kent contractors, developers, and homeowners.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Truck className="h-6 w-6 text-[hsl(var(--gts-yellow))] mr-4 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Specialized Equipment</h3>
                      <p className="text-muted-foreground">16-ton grab lorries and 20-ton tipper lorries perfect for Kent's diverse terrain, from coastal areas to rural developments.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Kent Service Statistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">50+</div>
                    <div className="text-sm text-muted-foreground">Towns Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">&lt;45min</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Emergency Service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">Licensed & Insured</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kent Case Studies */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Kent Project Success Stories</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real projects across Kent where our expertise and equipment made the difference.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{study.title}</CardTitle>
                    <CardDescription>{study.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Waste Type:</span>
                        <span className="font-medium">{study.wasteType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{study.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Local Landmarks */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Serving Kent's Iconic Locations</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From historic landmarks to modern developments, we know Kent inside out.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {landmarks.map((landmark, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <MapPin className="h-5 w-5 text-[hsl(var(--gts-yellow))] mx-auto mb-2" />
                  <span className="text-sm font-medium">{landmark}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-gradient text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Book in Kent?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Professional grab hire services across Kent with same-day availability. Call now for your instant quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call Now: 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Get Kent Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Kent;