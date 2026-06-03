import React from "react";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/Badge";
import { 
  Trash2, 
  Clock, 
  Shield, 
  Truck, 
  CheckCircle, 
  Phone, 
  Calculator,
  Recycle,
  Building,
  Home,
  Factory,
  TreePine,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const WasteRemoval = () => {
  const wasteTypes = [
    {
      type: "Construction Waste",
      icon: Building,
      description: "Building materials, rubble, concrete, plasterboard",
      examples: "Demolition debris, renovation waste, site clearance",
      link: "/services/construction-waste"
    },
    {
      type: "Garden Waste",
      icon: TreePine,
      description: "Green waste, tree cuttings, soil, landscaping debris",
      examples: "Hedge trimmings, lawn clippings, branch removal",
      link: "/services/garden-waste"
    },
    {
      type: "Commercial Waste",
      icon: Factory,
      description: "Office clearances, retail waste, industrial materials",
      examples: "Furniture, equipment, packaging materials",
      link: "/services/commercial-waste"
    },
    {
      type: "Household Waste",
      icon: Home,
      description: "Home clearances, renovation waste, general rubbish",
      examples: "Furniture, appliances, DIY materials",
      link: "/quote"
    },
    {
      type: "Soil & Muck",
      icon: Truck,
      description: "Excavated soil, contaminated ground, subsoil",
      examples: "Foundation excavations, landscaping projects",
      link: "/services/muck-away"
    },
    {
      type: "Emergency Clearance",
      icon: Zap,
      description: "Urgent waste removal, flood damage, storm cleanup",
      examples: "Crisis situations, same-day clearance needed",
      link: "/services/emergency-waste"
    }
  ];

  const serviceFeatures = [
    {
      icon: Clock,
      title: "Same Day Service",
      description: "Urgent waste removal available with our rapid response team"
    },
    {
      icon: Shield,
      title: "Fully Licensed",
      description: "Environment Agency licensed waste carrier with full insurance"
    },
    {
      icon: Truck,
      title: "16-Ton Capacity",
      description: "Large grab lorries handle 3x more waste than standard skips"
    },
    {
      icon: Recycle,
      title: "Eco-Friendly Disposal",
      description: "Responsible waste processing with maximum recycling rates"
    },
    {
      icon: CheckCircle,
      title: "No Permits Required",
      description: "Unlike skips, our grab lorries don't need council permits"
    },
    {
      icon: Calculator,
      title: "Transparent Pricing",
      description: "Fixed quotes with no hidden fees or surprise charges"
    }
  ];

  const coverage = [
    { area: "Kent", towns: "Maidstone, Canterbury, Dartford, Gravesend, Tonbridge" },
    { area: "London", towns: "Bromley, Croydon, Greenwich, Lewisham, Bexley" },
    { area: "Essex", towns: "Chelmsford, Basildon, Brentwood, Grays, Thurrock" }
  ];

  return (
    <>
      <SEOHead
        title="Waste Removal Services Kent | Professional Waste Collection | GTS Grab Hire"
        description="Professional waste removal across Kent, London & Essex. All waste types collected - construction, garden, commercial. Same-day service available. Licensed & insured."
        keywords="waste removal Kent, waste collection London, professional waste disposal, grab hire waste removal, construction waste, commercial waste, garden waste clearance"
        canonical="https://gtsgrabhire.com/services/waste-removal"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <Badge>Professional Waste Removal</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Complete Waste Removal Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Professional waste collection across Kent, London & Essex. All waste types handled with same-day service available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white">
                Get Free Quote
              </Button>
            </div>
          </div>
        </section>

        {/* Waste Types Section */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">All Waste Types Handled</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From construction debris to garden waste, we handle all types of waste removal with professional, licensed service.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wasteTypes.map((waste, index) => {
                const IconComponent = waste.icon;
                return (
                  <Card key={index} className="card-hover h-full">
                    <CardHeader>
                      <div className="service-icon mb-4">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl">{waste.type}</CardTitle>
                      <CardDescription>{waste.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Examples:</strong> {waste.examples}
                      </p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={waste.link}>Learn More</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Service Features */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Waste Removal?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional, reliable, and environmentally responsible waste removal with over 35 years of experience.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {serviceFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="service-icon mx-auto mb-4">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coverage Areas */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Service Coverage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive waste removal services across Kent, London, and Essex with rapid response times.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {coverage.map((area, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-navy))]">{area.area}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{area.towns}</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link to={`/locations/${area.area.toLowerCase()}`}>
                        View {area.area} Services
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple 3-Step Process</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Quick and easy waste removal - from quote to collection in as little as the same day.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-navy))] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Quote</h3>
                <p className="text-muted-foreground">Call us or fill out our online form for an instant quote based on your waste type and location.</p>
              </div>
              <div className="text-center">
                <div className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-navy))] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Schedule Collection</h3>
                <p className="text-muted-foreground">Choose your preferred collection time - same day service available for urgent requirements.</p>
              </div>
              <div className="text-center">
                <div className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-navy))] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">We Collect</h3>
                <p className="text-muted-foreground">Our professional team arrives on time with the right equipment to handle your waste removal safely.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What types of waste can you remove?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>We handle all types of waste including construction debris, garden waste, commercial waste, household clearances, soil and muck, and emergency clearances. We're fully licensed for all waste types.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How quickly can you collect waste?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>We offer same-day service for urgent requirements. Standard bookings are typically scheduled within 24-48 hours. Emergency collections can be arranged within hours of your call.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do I need permits for waste collection?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>No permits are required for our grab lorry service. Unlike skips that need council permits for road placement, our lorries collect waste directly from your property.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How do you ensure environmentally responsible disposal?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>We're Environment Agency licensed and work with approved disposal facilities. We maximize recycling rates and ensure all waste is processed according to environmental regulations.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-gradient text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for Professional Waste Removal?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Get an instant quote for your waste removal requirements. Same-day service available across Kent, London, and Essex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call Now: 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Get Free Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default WasteRemoval;